from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg
from base.models import Review, School

@receiver([post_save, post_delete], sender=Review)
def update_school_rating(sender, instance, **kwargs):
    """Przelicza średnią ocenę szkoły po zapisaniu lub usunięciu recenzji."""
    
    school = instance.school
    
    average = school.reviews.aggregate(Avg('rating'))['rating__avg']
    
    new_rating = round(average, 2) if average is not None else 0
    
    if school.average_rating != new_rating:
        school.average_rating = new_rating
        school.save(update_fields=['average_rating'])