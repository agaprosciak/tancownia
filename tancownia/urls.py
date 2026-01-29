from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # 1. Panel administratora (musisz go mieć!)
    path('admin/', admin.site.urls),

    # 2. Twoje widoki API (szkoły, zajęcia, instruktorzy)
    path('api/', include('base.urls')), 

    # 3. Logowanie JWT - pobieranie i odświeżanie tokenów
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# Obsługa zdjęć w trybie deweloperskim
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)