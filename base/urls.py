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
    PriceListViewSet,
    custom_change_username,
    custom_change_password
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
    path('change-username/', custom_change_username, name='change-username'),
    path('change-password/', custom_change_password, name='change-password'),
    
    path('', include(router.urls)),
]