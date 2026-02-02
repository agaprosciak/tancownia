from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
# 1. Importujesz swój nowy widok z aplikacji base
from base.views import MyTokenObtainPairView 

urlpatterns = [
    path('admin/', admin.site.urls),

    # Twoje widoki API (szkoły, zajęcia itd.)
    path('api/', include('base.urls')), 

    # 2. PODMIENIASZ TokenObtainPairView na swój własny MyTokenObtainPairView
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # Odświeżanie tokena może zostać standardowe
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)