from django_filters import rest_framework as dj_filters
from rest_framework import viewsets, filters, generics, status
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework.decorators import action

# UZUPEŁNIONE IMPORTY MODELI
from .models import School, DanceClass, Style, Instructor, Review, User, SchoolImage

# UZUPEŁNIONE IMPORTY SERIALIZERÓW
from .serializers import (
    SchoolSerializer, 
    DanceClassSerializer, 
    StyleSerializer, 
    InstructorSerializer,
    ReviewSerializer, 
    RegisterSerializer,
    MyTokenObtainPairSerializer
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

    @action(detail=False, methods=['get'])
    def my_school(self, request):
        try:
            # Próba pobrania szkoły przypisanej do zalogowanego usera
            school = request.user.school 
            serializer = self.get_serializer(school)
            return Response(serializer.data)
        except:
            # Brak szkoły = sygnał 404 dla Frontendu
            return Response({"detail": "No school found."}, status=404)

class DanceClassViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = DanceClass.objects.all().order_by('starts_at')
    serializer_class = DanceClassSerializer
    # POPRAWIONE: Zmieniono DjangoFilterBackend na dj_filters.DjangoFilterBackend
    filter_backends = [dj_filters.DjangoFilterBackend] 
    filterset_fields = ['school', 'style', 'day_of_week', 'level', 'min_age']

class StyleViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    queryset = Style.objects.all().order_by('style_name')
    serializer_class = StyleSerializer

class InstructorViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = Instructor.objects.all()
    serializer_class = InstructorSerializer

# Widok recenzji
class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer

    def get_permissions(self):
        # Czytać opinie może każdy (makieta School), ale dodawać tylko zalogowani
        if self.action == 'create':
            return [IsAuthenticated()]
        return [AllowAny()]

    def perform_create(self, serializer):
        # Blokada dla Ownera - tylko tancerz (role='user') wystawia opinie
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