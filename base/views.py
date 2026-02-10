import math
from django_filters import rest_framework as dj_filters
from rest_framework import viewsets, filters, generics, status
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django.db import transaction
from django.db.models import Q, Count


from .models import School, DanceClass, Style, Instructor, Review, User, SchoolImage, DanceFloor, PriceList

from .serializers import (
    SchoolSerializer, 
    DanceClassSerializer, 
    StyleSerializer, 
    InstructorSerializer,
    ReviewSerializer, 
    RegisterSerializer,
    MyTokenObtainPairSerializer,
    DanceFloorSerializer,
    PriceListSerializer
)

class SchoolFilter(dj_filters.FilterSet):
    bbox = dj_filters.CharFilter(method='filter_by_bbox')
    radius = dj_filters.NumberFilter(method='filter_by_radius')
    city = dj_filters.CharFilter(lookup_expr='icontains')
    lat = dj_filters.NumberFilter(method='filter_ignore')
    lon = dj_filters.NumberFilter(method='filter_ignore')

    multisport = dj_filters.BooleanFilter(field_name='accepts_multisport')
    medicover = dj_filters.BooleanFilter(field_name='accepts_medicover')
    fitprofit = dj_filters.BooleanFilter(field_name='accepts_fitprofit')
    pzu_sport = dj_filters.BooleanFilter(field_name='accepts_pzu_sport')

    style = dj_filters.CharFilter(method='filter_style')
    level = dj_filters.CharFilter(method='filter_level')
    group_type = dj_filters.CharFilter(method='filter_group_type')
    day = dj_filters.CharFilter(method='filter_day')
    age = dj_filters.NumberFilter(method='filter_age')
    time_start = dj_filters.CharFilter(method='filter_time_start')
    time_end = dj_filters.CharFilter(method='filter_time_end')

    class Meta:
        model = School
        fields = []

    # LOGIKA (A or B) AND (C or D)
    def filter_style(self, queryset, name, value):
        vals = self.request.query_params.getlist('style')
        if not vals: return queryset
        query = Q()
        for v in vals: query |= Q(classes__style__style_name__iexact=v)
        return queryset.filter(query).distinct()

    def filter_level(self, queryset, name, value):
        vals = self.request.query_params.getlist('level')
        if not vals: return queryset
        query = Q()
        for v in vals: query |= Q(classes__level__iexact=v)
        return queryset.filter(query).distinct()

    def filter_group_type(self, queryset, name, value):
        vals = self.request.query_params.getlist('group_type')
        if not vals: return queryset
        query = Q()
        for v in vals: query |= Q(classes__group_type__iexact=v)
        return queryset.filter(query).distinct()

    def filter_day(self, queryset, name, value):
        day_mapping = {'mon': 'monday', 'tue': 'tuesday', 'wed': 'wednesday', 'thu': 'thursday', 'fri': 'friday', 'sat': 'saturday', 'sun': 'sunday'}
        days_param = self.request.query_params.getlist('day')
        if not days_param: return queryset
        query = Q()
        for d in days_param:
            mapped = day_mapping.get(d, d)
            query |= Q(classes__day_of_week__iexact=mapped)
        return queryset.filter(query).distinct()

    def filter_time_start(self, queryset, name, value):
        if not value: return queryset
        return queryset.filter(classes__starts_at__gte=value).distinct()

    def filter_time_end(self, queryset, name, value):
        if not value: return queryset
        return queryset.filter(classes__starts_at__lte=value).distinct()

    def filter_age(self, queryset, name, value):
        return queryset.filter(classes__min_age__lte=value).filter(Q(classes__max_age__gte=value) | Q(classes__max_age__isnull=True)).distinct()

    def filter_by_bbox(self, queryset, name, value):
        try:
            parts = [float(x) for x in value.split(',')]
            if len(parts) == 4:
                min_lat, max_lat, min_lon, max_lon = parts
                return queryset.filter(latitude__gte=min_lat, latitude__lte=max_lat, longitude__gte=min_lon, longitude__lte=max_lon)
        except ValueError: pass
        return queryset

    def filter_by_radius(self, queryset, name, value):
        lat = self.request.query_params.get('lat')
        lon = self.request.query_params.get('lon')
        if not lat or not lon or not value: return queryset
        try:
            center_lat, center_lon, radius_km = float(lat), float(lon), float(value)
            delta_lat = radius_km / 111.0
            cos_lat = abs(math.cos(math.radians(center_lat))) or 0.0001
            delta_lon = radius_km / (111.0 * cos_lat)
            return queryset.filter(latitude__gte=center_lat - delta_lat, latitude__lte=center_lat + delta_lat, longitude__gte=center_lon - delta_lon, longitude__lte=center_lon + delta_lon)
        except ValueError: return queryset

    def filter_ignore(self, queryset, name, value): return queryset

class SchoolViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = SchoolSerializer
    filter_backends = [dj_filters.DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = SchoolFilter
    search_fields = ['name', 'classes__style__style_name']
    ordering_fields = ['average_rating', 'name', 'created_at', 'classes__first_class_date']
    ordering = ['-average_rating']

    def get_queryset(self):
        queryset = School.objects.all().annotate(reviews_count=Count('reviews', distinct=True)).distinct()
        queryset = queryset.prefetch_related('classes__style', 'images', 'floors', 'instructors', 'price_list', 'styles')
        return queryset

    def perform_create(self, serializer):
        school = serializer.save(user=self.request.user)
        images = self.request.FILES.getlist('uploaded_images')
        for image in images: SchoolImage.objects.create(school=school, image=image)

    @action(detail=False, methods=['get', 'put', 'patch'], url_path='my_school')
    def my_school(self, request):
        user = request.user
        if not hasattr(user, 'school'): return Response({"detail": "Nie utworzono jeszcze szkoły."}, status=status.HTTP_404_NOT_FOUND)
        school = user.school
        if request.method == 'GET':
            serializer = self.get_serializer(school)
            return Response(serializer.data)
        elif request.method in ['PUT', 'PATCH']:
            serializer = self.get_serializer(school, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            if hasattr(request.FILES, 'getlist'):
                images = request.FILES.getlist('uploaded_images')
                for img in images: SchoolImage.objects.create(school=school, image=img)
            deleted_ids = request.data.getlist('deleted_images') if hasattr(request.data, 'getlist') else request.data.get('deleted_images', [])
            if deleted_ids: SchoolImage.objects.filter(id__in=deleted_ids, school=school).delete()
            return Response(serializer.data, status=status.HTTP_200_OK)


class DanceFloorViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = DanceFloor.objects.all()
    serializer_class = DanceFloorSerializer

    @action(detail=False, methods=['post'])
    def create_multiple(self, request):
        rooms_data = request.data.get('rooms', [])
        
        try:
            school = request.user.school
        except Exception:
            return Response({"error": "Błąd: Najpierw musisz stworzyć szkołę!"}, status=400)

        #Czyszczenie starych sal przed zapisem nowych
        school.floors.all().delete()

        created_rooms = []
        for item in rooms_data:
            name = item.get('name', '').strip()
            if name:
                room = DanceFloor.objects.create(school=school, name=name)
                created_rooms.append(room.id)
                
        return Response({"status": "success", "count": len(created_rooms)}, status=201)
    
class PriceListViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = PriceList.objects.all()
    serializer_class = PriceListSerializer

    @action(detail=False, methods=['post'])
    def sync_prices(self, request):
        school = getattr(request.user, 'school', None)
        if not school:
            return Response({"error": "Najpierw stwórz profil szkoły!"}, status=400)

        prices_data = request.data.get('prices', [])
        cards_data = request.data.get('cards', {})
        
        # 1. Karty (Multisport itp.)
        school.accepts_multisport = cards_data.get('multisport', False)
        school.accepts_medicover = cards_data.get('medicover', False)
        school.accepts_fitprofit = cards_data.get('fitprofit', False)
        school.accepts_pzu_sport = cards_data.get('pzu_sport', False)
        school.benefit_cards_info = cards_data.get('info', '')
        school.save()

        # 2. Cennik
        school.price_list.all().delete()
        for item in prices_data:
            e_type = item.get('entry_type')
            
            if not e_type:
                e_type = 'single'

            entries = item.get('entries_per_week')
            
            if item.get('unlimited') or e_type == 'single':
                entries = None

            PriceList.objects.create(
                school=school,
                name=item.get('name'),
                price=item.get('price'),
                entry_type=e_type, 
                duration_minutes=item.get('duration_minutes') or 60,
                entries_per_week=entries,
                description=item.get('description', '')
            )
                
        return Response({"status": "success"}, status=201)
    
class DanceClassViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = DanceClass.objects.all().order_by('starts_at')
    serializer_class = DanceClassSerializer
    filter_backends = [dj_filters.DjangoFilterBackend] 
    filterset_fields = ['school', 'style', 'day_of_week', 'level', 'min_age']

    def create(self, request, *args, **kwargs):
        full_data = request.data
        time_slots = full_data.get('time_slots')

        if time_slots and isinstance(time_slots, list):
            base_data = {k: v for k, v in full_data.items() if k != 'time_slots'}
            
            try:
                with transaction.atomic():
                    created_objects = []
                    for slot in time_slots:
                        merged_data = {**base_data, **slot}
                        
                        if hasattr(request.user, 'school') and request.user.school:
                            merged_data['school'] = request.user.school.id
                        
                        serializer = self.get_serializer(data=merged_data)
                        serializer.is_valid(raise_exception=True)
                        
                        self.perform_create(serializer)
                        created_objects.append(serializer.data)
                
                return Response(created_objects, status=status.HTTP_201_CREATED)
            
            except Exception as e:
                error_detail = getattr(e, 'detail', str(e))
                return Response(error_detail, status=status.HTTP_400_BAD_REQUEST)

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        #Przy tworzeniu zawsze przypisujemy do szkoły zalogowanego
        dance_class = serializer.save(school=self.request.user.school)
        instructors = dance_class.instructors.all()
        for inst in instructors:
            if self.request.user.school not in inst.schools.all():
                inst.schools.add(self.request.user.school)
    def perform_create(self, serializer):
        dance_class = serializer.save(school=self.request.user.school)
        instructors = dance_class.instructors.all()
        for inst in instructors:
            if self.request.user.school not in inst.schools.all():
                inst.schools.add(self.request.user.school)


class StyleViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    queryset = Style.objects.all().order_by('style_name')
    serializer_class = StyleSerializer


class InstructorViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = Instructor.objects.all()
    serializer_class = InstructorSerializer

    def get_queryset(self):
        queryset = self.queryset
        user = self.request.user

        if user.is_authenticated:
            # Wyciągamy parametry z adresu URL
            my_only = self.request.query_params.get('my_only') == 'true'
            created_by_me = self.request.query_params.get('created_by_me') == 'true'

            if my_only and hasattr(user, 'school'):
                queryset = queryset.filter(schools=user.school)

            if created_by_me:
                queryset = queryset.filter(created_by=user)

        return queryset.distinct()

    def perform_create(self, serializer):
        # Przy tworzeniu nowego instruktora, przypisujemy go do szkoły twórcy
        instructor = serializer.save(created_by=self.request.user)
        if hasattr(self.request.user, 'school'):
            instructor.schools.add(self.request.user.school)

        
class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    
    filter_backends = [dj_filters.DjangoFilterBackend] 
    filterset_fields = ['school'] 

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated()]
        return [AllowAny()]

    def perform_create(self, serializer):
        if self.request.user.role != 'user':
            raise PermissionDenied("Tylko tancerze mogą wystawiać opinie!")
        serializer.save(user=self.request.user)

class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    queryset = User.objects.all()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generujemy token
        refresh = RefreshToken.for_user(user)
        
        refresh['username'] = user.username
        refresh['role'] = user.role
        refresh['has_school'] = False # Nowy owner nie ma szkoły

        return Response({
            "user": serializer.data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "username": user.username,
            "role": user.role,
            "has_school": False
        }, status=status.HTTP_201_CREATED)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def custom_change_username(request):
    user = request.user

    new_username = request.data.get('new_username')
    password = request.data.get('current_password')

    if not new_username or not password:
        return Response({'error': 'Podaj nową nazwę i hasło'}, status=400)

    if not user.check_password(password):
        return Response({'error': 'Błędne hasło'}, status=400)

    if User.objects.filter(username=new_username).exists():
        return Response({'error': 'Ta nazwa jest już zajęta'}, status=400)

    try:
        user.username = new_username
        user.save()
        return Response({'success': 'Nazwa zmieniona'})
    except Exception as e:
        return Response({'error': 'Wystąpił błąd serwera'}, status=500)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def custom_change_password(request):
    user = request.user
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')

    if not current_password or not new_password:
        return Response({'error': 'Podaj obecne i nowe hasło.'}, status=400)

    if not user.check_password(current_password):
        return Response({'error': 'Obecne hasło jest nieprawidłowe.'}, status=400)

    try:
        user.set_password(new_password)
        user.save()
        return Response({'success': 'Hasło zostało zmienione.'})
    except Exception as e:
        return Response({'error': 'Wystąpił błąd serwera.'}, status=500)

