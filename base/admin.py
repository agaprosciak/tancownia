from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User,  # Twój model
    Style, School, SchoolImage, PriceList, Review,
    Instructor, Level, AgeGroup, ParticipationForm,
    DanceFloor, DanceClass, ClassCancellation,
)

# --- KLUCZOWA ZMIANA DLA USERA ---
class CustomUserAdmin(UserAdmin):
    # To sprawia, że w widoku EDYCJI (po wejściu w usera) widzisz swoje pola
    fieldsets = UserAdmin.fieldsets + (
        ('Dodatkowe Informacje', {'fields': ('role', 'avatar')}),
    )
    
    # To sprawia, że w widoku TWORZENIA (Add User) też możesz je dodać
    # (chociaż standardowo Django najpierw każe podać hasło, a potem resztę)
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Dodatkowe Informacje', {'fields': ('role', 'avatar', 'email')}),
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
admin.site.register(Level)
admin.site.register(AgeGroup)
admin.site.register(ParticipationForm)
admin.site.register(DanceFloor)
admin.site.register(DanceClass)
admin.site.register(ClassCancellation)