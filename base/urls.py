from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SchoolViewSet, 
    DanceClassViewSet, 
    StyleViewSet, 
    InstructorViewSet,
    ReviewViewSet,
    RegisterView,
    DanceFloorViewSet,
    PriceListViewSet
)

router = DefaultRouter()
router.register(r'schools', SchoolViewSet, basename='school')
router.register(r'classes', DanceClassViewSet, basename='danceclass')
router.register(r'styles', StyleViewSet, basename='style')
router.register(r'instructors', InstructorViewSet, basename='instructor')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'dancefloors', DanceFloorViewSet, basename='dancefloor')
router.register(r'price-list', PriceListViewSet, basename='price-list')

urlpatterns = [
    # 2. DODAJEMY REJESTRACJĘ TUTAJ
    path('register/', RegisterView.as_view(), name='register'),
    
    path('', include(router.urls)),
]