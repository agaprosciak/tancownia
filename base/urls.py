from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SchoolViewSet, 
    DanceClassViewSet, 
    StyleViewSet, 
    InstructorViewSet,
    ReviewViewSet
)

# Router to automat, który sam tworzy ścieżki na podstawie ViewSetów
router = DefaultRouter()

# Rejestrujemy nasze "centra dowodzenia"
router.register(r'schools', SchoolViewSet, basename='school')
router.register(r'classes', DanceClassViewSet, basename='danceclass')
router.register(r'styles', StyleViewSet, basename='style')
router.register(r'instructors', InstructorViewSet, basename='instructor')
router.register(r'reviews', ReviewViewSet, basename='review')
urlpatterns = [
    # Wszystkie adresy będą zaczynać się od pustego ciągu, 
    # np. /api/schools/, /api/classes/ itp.
    path('', include(router.urls)),
]