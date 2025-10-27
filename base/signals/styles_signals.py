from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver
from base.models import DanceClass, Instructor, Style


def school_has_style(school, style):
    """Sprawdza, czy szkoła ma jeszcze klasy danego stylu."""
    return DanceClass.objects.filter(school=school, style=style).exists()

def instructor_has_style(instructor, style):
    """Sprawdza, czy instruktor prowadzi jeszcze klasy danego stylu."""
    return DanceClass.objects.filter(instructors=instructor, style=style).exists()

# ============================================
# SIGNALS
# ============================================

@receiver(pre_save, sender=DanceClass, weak=False)
def capture_old_state_before_save(sender, instance, **kwargs):
    """Przed zapisem przechwytuje stary styl ORAZ stary zbiór instruktorów."""
    if not instance.pk:
        instance._old_state = None  # Nowy obiekt
        return

    try:
        old_instance = DanceClass.objects.get(pk=instance.pk)
        instance._old_state = {
            'style': old_instance.style,
            'instructors': set(old_instance.instructors.all())
        }
    except DanceClass.DoesNotExist:
        instance._old_state = None

@receiver(post_save, sender=DanceClass, weak=False)
def update_styles_after_save(sender, instance, created, **kwargs):
    """
    Centralna funkcja do obsługi tworzenia i aktualizacji.
    Obsługuje dodawanie, usuwanie i zmiany stylu/instruktorów.
    """
    school = instance.school
    new_style = instance.style
    new_instructors = set(instance.instructors.all())

    # 1. Zawsze dodajemy aktualne powiązania
    school.styles.add(new_style)
    for instructor in new_instructors:
        instructor.styles.add(new_style)

    # 2. Jeśli to była aktualizacja, czas na czyszczenie starych powiązań
    if not created and instance._old_state:
        old_style = instance._old_state['style']
        old_instructors = instance._old_state['instructors']

        # A. Czyszczenie po usuniętych instruktorach
        removed_instructors = old_instructors - new_instructors
        for instructor in removed_instructors:
            # Sprawdzamy stary styl, bo z takich zajęć zostali usunięci
            if not instructor_has_style(instructor, old_style):
                instructor.styles.remove(old_style)

        # B. Czyszczenie, jeśli zmienił się styl
        if old_style != new_style:
            # Sprawdź szkołę
            if not school_has_style(school, old_style):
                school.styles.remove(old_style)
            
            # Sprawdź starych instruktorów (tych, którzy nie zostali usunięci)
            # bo to oni uczyli starego stylu
            instructors_to_check = old_instructors - removed_instructors
            for instructor in instructors_to_check:
                if not instructor_has_style(instructor, old_style):
                    instructor.styles.remove(old_style)


@receiver(post_delete, sender=DanceClass, weak=False)
def cleanup_styles_after_delete(sender, instance, **kwargs):
    """Czyści powiązania po usunięciu zajęć."""
    school = instance.school
    style_to_check = instance.style
    
    # W momencie post_delete relacja M2M wciąż istnieje w pamięci
    instructors_before_delete = instance.instructors.all()

    # Sprawdź szkołę
    if not school_has_style(school, style_to_check):
        school.styles.remove(style_to_check)

    # Sprawdź instruktorów
    for instructor in instructors_before_delete:
        if not instructor_has_style(instructor, style_to_check):
            instructor.styles.remove(style_to_check)