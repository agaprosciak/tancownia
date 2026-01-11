from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, Style, School, SchoolImage, PriceList, Review,
    Instructor, DanceFloor, DanceClass
)

# --- KLUCZOWA ZMIANA DLA USERA ---
class CustomUserAdmin(UserAdmin):
    # Dodaliśmy przecinek po 'role'
    fieldsets = UserAdmin.fieldsets + (
        ('Dodatkowe Informacje', {'fields': ('role',)}), 
    )
    
    # Tutaj przy dwóch polach ('role', 'email') jest już OK
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Dodatkowe Informacje', {'fields': ('role', 'email')}),
    )

# Rejestrujemy Usera ZE SPECJALNĄ KONFIGURACJĄ
admin.site.register(User, CustomUserAdmin)

# --- RESZTA MODELI (Zwykła rejestracja) ---
admin.site.register(Style)
admin.site.register(School)
admin.site.register(SchoolImage)
admin.site.register(PriceList)
admin.site.register(Review)
admin.site.register(Instructor)
admin.site.register(DanceFloor)
admin.site.register(DanceClass)
