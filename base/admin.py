from django.contrib import admin
from .models import (
    User,
    Style,
    School,
    SchoolImage,
    PriceList,
    Review,
    Instructor,
    Level,
    AgeGroup,
    ParticipationForm,
    DanceFloor,
    DanceClass,
    ClassCancellation,
)

# Rejestracja wszystkich modeli w panelu admina
admin.site.register(User)
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