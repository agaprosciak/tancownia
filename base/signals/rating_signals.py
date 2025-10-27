from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg
from base.models import Review, School # Dodano import School dla czytelności

@receiver([post_save, post_delete], sender=Review)
def update_school_rating(sender, instance, **kwargs):
    """Przelicza średnią ocenę szkoły po zapisaniu lub usunięciu recenzji."""
    
    school = instance.school
    
    # Krok 1: Oblicz nową średnią.
    average = school.reviews.aggregate(Avg('rating'))['rating__avg']
    
    # Krok 2: Upewnij się, że wartość nie jest None i zaokrąglij ją.
    new_rating = round(average, 2) if average is not None else 0
    
    # Krok 3: (Optymalizacja) Zapisz do bazy tylko, jeśli ocena faktycznie się zmieniła.
    if school.average_rating != new_rating:
        school.average_rating = new_rating
        
        # Krok 4: (Kluczowa zmiana) Zaktualizuj tylko jedno pole, aby uniknąć pętli sygnałów.
        school.save(update_fields=['average_rating'])