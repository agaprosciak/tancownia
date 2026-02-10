from django.db.models.signals import pre_save, post_save, pre_delete, post_delete, m2m_changed
from django.dispatch import receiver
from base.models import DanceClass, Instructor


def school_has_style(school, style):
    """Sprawdza, czy szkoła ma jeszcze jakiekolwiek inne klasy danego stylu."""
    return DanceClass.objects.filter(school=school, style=style).exists()

def instructor_has_style(instructor, style):
    """Sprawdza, czy instruktor prowadzi jeszcze jakiekolwiek inne klasy danego stylu."""
    return DanceClass.objects.filter(instructors=instructor, style=style).exists()


#ZMIANA STYLU (przy edycji zajęć)
@receiver(pre_save, sender=DanceClass, weak=False)
def capture_old_style_before_save(sender, instance, **kwargs):
    """Zapamiętuje stary styl przed zapisem, żeby sprawdzić, czy się zmienił."""
    if not instance.pk:
        instance._old_style = None
        return
    try:
        old_instance = DanceClass.objects.get(pk=instance.pk)
        instance._old_style = old_instance.style
    except DanceClass.DoesNotExist:
        instance._old_style = None

@receiver(post_save, sender=DanceClass, weak=False)
def handle_style_change(sender, instance, created, **kwargs):
    """
    Uruchamia się po zapisaniu zajęć.
    Obsługuje dodanie stylu do szkoły oraz czyszczenie starych stylów przy edycji.
    """
    school = instance.school
    new_style = instance.style
    
    school.styles.add(new_style)

    # Jeśli zmieniono styl
    if not created and instance._old_style and instance._old_style != new_style:
        old_style = instance._old_style
        
        #Czyścimy szkołę ze starego stylu (jeśli już go nie uczy)
        if not school_has_style(school, old_style):
            school.styles.remove(old_style)
            
        #Czyścimy instruktorów ze starego stylu i dodajemy nowy
        for instructor in instance.instructors.all():
            instructor.styles.add(new_style)
            if not instructor_has_style(instructor, old_style):
                instructor.styles.remove(old_style)


#ZMIANA INSTRUKTORÓW (Dodawanie/Usuwanie osób)
@receiver(m2m_changed, sender=DanceClass.instructors.through, weak=False)
def handle_instructors_change(sender, instance, action, pk_set, **kwargs):
    """
    Uruchamia się, gdy dodano lub usunięto instruktorów z zajęć.
    Działa przy tworzeniu nowych zajęć.
    """
    if action == "post_add":
        # Gdy dodano instruktorów -> Przypisz im styl tych zajęć
        for instructor_id in pk_set:
            try:
                instructor = Instructor.objects.get(pk=instructor_id)
                instructor.styles.add(instance.style)
            except Instructor.DoesNotExist:
                continue

    elif action == "post_remove":
        # Gdy usunięto instruktorów -> Zabierz im styl (jeśli to były jedyne zajęcia)
        for instructor_id in pk_set:
            try:
                instructor = Instructor.objects.get(pk=instructor_id)
                if not instructor_has_style(instructor, instance.style):
                    instructor.styles.remove(instance.style)
            except Instructor.DoesNotExist:
                continue


#USUWANIE ZAJĘĆ
@receiver(pre_delete, sender=DanceClass, weak=False)
def cache_relations_before_delete(sender, instance, **kwargs):
    """Zapamiętuje powiązania w pamięci RAM, zanim rekord zniknie z bazy."""
    instance._cached_instructors = list(instance.instructors.all())
    instance._cached_school = instance.school
    instance._cached_style = instance.style

@receiver(post_delete, sender=DanceClass, weak=False)
def cleanup_styles_after_delete(sender, instance, **kwargs):
    """Czyści style po usunięciu zajęć, korzystając z zapamiętanych danych."""
    school = getattr(instance, '_cached_school', None)
    style_to_check = getattr(instance, '_cached_style', None)
    instructors = getattr(instance, '_cached_instructors', [])

    if not school or not style_to_check:
        return

    if not school_has_style(school, style_to_check):
        school.styles.remove(style_to_check)

    for instructor in instructors:
        if not instructor_has_style(instructor, style_to_check):
            instructor.styles.remove(style_to_check)

