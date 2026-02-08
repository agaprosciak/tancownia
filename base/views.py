from django_filters import rest_framework as dj_filters
from rest_framework import viewsets, filters, generics, status
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction

# UZUPEŁNIONE IMPORTY MODELI
from .models import School, DanceClass, Style, Instructor, Review, User, SchoolImage, DanceFloor, PriceList

# UZUPEŁNIONE IMPORTY SERIALIZERÓW
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

# Definiujemy zaawansowany filtr dla wyszukiwarki
class SchoolFilter(dj_filters.FilterSet):
    city = dj_filters.CharFilter(lookup_expr='icontains')
    multisport = dj_filters.BooleanFilter(field_name='accepts_multisport')
    medicover = dj_filters.BooleanFilter(field_name='accepts_medicover')
    fitprofit = dj_filters.BooleanFilter(field_name='accepts_fitprofit')
    pzu_sport = dj_filters.BooleanFilter(field_name='accepts_pzu_sport')

    style = dj_filters.AllValuesMultipleFilter(field_name='classes__style__style_name')
    level = dj_filters.AllValuesMultipleFilter(field_name='classes__level')
    group_type = dj_filters.AllValuesMultipleFilter(field_name='classes__group_type')
    day = dj_filters.AllValuesMultipleFilter(field_name='classes__day_of_week')

    age = dj_filters.NumberFilter(method='filter_age')
    time_min = dj_filters.TimeFilter(field_name='classes__starts_at', lookup_expr='gte')
    time_max = dj_filters.TimeFilter(field_name='classes__starts_at', lookup_expr='lte')

    class Meta:
        model = School
        fields = []

    def filter_age(self, queryset, name, value):
        return queryset.filter(
            classes__min_age__lte=value
        ).filter(
            dj_filters.Q(classes__max_age__gte=value) | dj_filters.Q(classes__max_age__isnull=True)
        ).distinct()

class SchoolViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = School.objects.all().distinct().order_by('-average_rating')
    serializer_class = SchoolSerializer
    filter_backends = [dj_filters.DjangoFilterBackend, filters.SearchFilter]
    filterset_class = SchoolFilter
    search_fields = ['name', 'description', 'classes__subtitle']

    def perform_create(self, serializer):
        # 1. Zapisujemy podstawowe dane szkoły (w tym logo)
        school = serializer.save(user=self.request.user)

        # 2. Wyciągamy listę plików z galerii (uploaded_images z React)
        images = self.request.FILES.getlist('uploaded_images')
        
        # 3. Tworzymy rekordy w modelu SchoolImage dla każdego zdjęcia
        for image in images:
            SchoolImage.objects.create(school=school, image=image)

    @action(detail=False, methods=['get', 'put', 'patch'], url_path='my_school')
    def my_school(self, request):
        """
        Endpoint do pobierania i EDYCJI szkoły zalogowanego użytkownika.
        """
        user = request.user
        
        # Sprawdzamy, czy user w ogóle ma szkołę
        if not hasattr(user, 'school'):
            return Response({"detail": "Nie utworzono jeszcze szkoły."}, status=status.HTTP_404_NOT_FOUND)

        school = user.school

        # --- SCENARIUSZ 1: POBIERANIE DANYCH (GET) ---
        if request.method == 'GET':
            serializer = self.get_serializer(school)
            return Response(serializer.data)

        # --- SCENARIUSZ 2: EDYCJA DANYCH (PUT / PATCH) ---
        elif request.method in ['PUT', 'PATCH']:
            serializer = self.get_serializer(school, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()

            # --- DODAWANIE NOWYCH ZDJĘĆ ---
            # Tu używamy bezpiecznego sprawdzenia, bo przy JSON request.FILES jest puste
            if hasattr(request.FILES, 'getlist'):
                images = request.FILES.getlist('uploaded_images')
                if images:
                    for img in images:
                        SchoolImage.objects.create(school=school, image=img)

            # --- USUWANIE ZDJĘĆ Z GALERII (TU BYŁ BŁĄD) ---
            # NAPRAWA: Sprawdzamy, czy request.data to Formularz (ma getlist) czy JSON (nie ma)
            if hasattr(request.data, 'getlist'):
                # To przychodzi z SetupSchoolInfo (FormData)
                deleted_ids = request.data.getlist('deleted_images')
            else:
                # To przychodzi z News (JSON) - tu nie ma getlist, używamy zwykłego get
                deleted_ids = request.data.get('deleted_images', [])

            if deleted_ids:
                # Konwertujemy na inty i usuwamy
                SchoolImage.objects.filter(id__in=deleted_ids, school=school).delete()

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

        # KLUCZOWY FIX: Czyścimy stare sale przed zapisem nowych
        # Dzięki temu "kosz" w React zadziała w bazie, a "tylko jedna sala" wywali resztę
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
            # FIX: Use 'entry_type' instead of 'type'
            e_type = item.get('entry_type')
            
            if not e_type:
                e_type = 'single'

            # FIX: Frontend sends 'entries_per_week', not 'entries'
            entries = item.get('entries_per_week')
            
            # Logic for unlimited/single
            if item.get('unlimited') or e_type == 'single':
                entries = None

            PriceList.objects.create(
                school=school,
                name=item.get('name'),
                price=item.get('price'),
                entry_type=e_type, 
                # FIX: Frontend sends 'duration_minutes', not 'duration'
                duration_minutes=item.get('duration_minutes') or 60,
                entries_per_week=entries,
                # FIX: Frontend sends 'description', not 'details'
                description=item.get('description', '')
            )
                
        return Response({"status": "success"}, status=201)
    
class DanceClassViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = DanceClass.objects.all().order_by('starts_at')
    serializer_class = DanceClassSerializer
    filter_backends = [dj_filters.DjangoFilterBackend] 
    filterset_fields = ['school', 'style', 'day_of_week', 'level', 'min_age']

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and hasattr(user, 'role') and user.role == 'owner':
            if hasattr(user, 'school'):
                return self.queryset.filter(school=user.school)
        return self.queryset.all()

    # --- POPRAWIONY ATOMIC CREATE ---
    def create(self, request, *args, **kwargs):
        full_data = request.data
        time_slots = full_data.get('time_slots')

        if time_slots and isinstance(time_slots, list):
            # 1. Czyścimy dane z 'time_slots'
            base_data = {k: v for k, v in full_data.items() if k != 'time_slots'}
            
            try:
                with transaction.atomic():
                    created_objects = []
                    for slot in time_slots:
                        merged_data = {**base_data, **slot}
                        
                        # --- FIX NA BŁĄD 400: DODAJE SZKOŁĘ PRZED WALIDACJĄ ---
                        # Serializer musi widzieć szkołę, żeby is_valid() przeszedł
                        if hasattr(request.user, 'school') and request.user.school:
                            merged_data['school'] = request.user.school.id
                        
                        serializer = self.get_serializer(data=merged_data)
                        serializer.is_valid(raise_exception=True)
                        
                        # Zapisujemy (perform_create też doda szkołę, ale to dla pewności)
                        self.perform_create(serializer)
                        created_objects.append(serializer.data)
                
                return Response(created_objects, status=status.HTTP_201_CREATED)
            
            except Exception as e:
                # Zwracamy treść błędu (np. kolizja w Sali 1)
                error_detail = getattr(e, 'detail', str(e))
                return Response(error_detail, status=status.HTTP_400_BAD_REQUEST)

        return super().create(request, *args, **kwargs)

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

            # Jeśli chcesz tylko tych ze swojej szkoły
            if my_only and hasattr(user, 'school'):
                queryset = queryset.filter(schools=user.school)

            # Jeśli chcesz tylko tych, których sama dodałaś do bazy
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

# Widok rejestracji
class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    queryset = User.objects.all()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # 1. Generujemy token
        refresh = RefreshToken.for_user(user)
        
        # 2. !!! KLUCZOWY FIX !!! 
        # Musimy ręcznie dodać dane do ACCESS TOKENA, 
        # bo RefreshToken.for_user nie używa Twojego MyTokenObtainPairSerializer
        refresh['username'] = user.username
        refresh['role'] = user.role
        refresh['has_school'] = False # Nowy owner nie ma szkoły

        # 3. Przygotowujemy odpowiedź
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

    # 1. Sprawdź czy podano hasła
    if not current_password or not new_password:
        return Response({'error': 'Podaj obecne i nowe hasło.'}, status=400)

    # 2. Sprawdź czy obecne hasło jest dobre
    if not user.check_password(current_password):
        return Response({'error': 'Obecne hasło jest nieprawidłowe.'}, status=400)

    # 3. Zmień hasło i zapisz
    try:
        user.set_password(new_password)
        user.save()
        return Response({'success': 'Hasło zostało zmienione.'})
    except Exception as e:
        return Response({'error': 'Wystąpił błąd serwera.'}, status=500)

