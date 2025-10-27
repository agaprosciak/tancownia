import os
from django.db import models
from django.db.models.signals import pre_save, post_delete
from django.dispatch import receiver
from base.models import User, School, Instructor, SchoolImage

# ==========================================================
#  1. HELPER DO BEZPIECZNEGO USUWANIA PLIKÓW
# ==========================================================

def delete_file_if_exists(file_path):
    """Bezpiecznie usuwa plik i jego pusty folder nadrzędny."""
    if file_path and os.path.isfile(file_path):
        os.remove(file_path)
        folder = os.path.dirname(file_path)
        if os.path.isdir(folder) and not os.listdir(folder):
            try:
                os.rmdir(folder)
            except OSError:
                # Może wystąpić błąd, jeśli inny proces zdążył usunąć folder
                pass

# ==========================================================
#  2. GENERYCZNE SYGNAŁY DO ZARZĄDZANIA PLIKAMI
# ==========================================================

def auto_delete_file_on_change(sender, instance, **kwargs):
    """
    Generyczny sygnał PRE_SAVE.
    Usuwa stary plik, jeśli został zastąpiony nowym w danym obiekcie.
    """
    if not instance.pk:
        return  # Obiekt jest nowy, nie ma starego pliku

    try:
        old_instance = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        return  # Na wszelki wypadek

    # Iterujemy po wszystkich polach modelu, szukając pól obrazów
    for field in sender._meta.fields:
        if isinstance(field, models.ImageField):
            old_file = getattr(old_instance, field.name)
            new_file = getattr(instance, field.name)
            
            # Jeśli plik się zmienił i stary plik nie jest plikiem domyślnym, usuń go
            if old_file and old_file != new_file and old_file.name != field.default:
                delete_file_if_exists(old_file.path)


def auto_delete_file_on_delete(sender, instance, **kwargs):
    """
    Generyczny sygnał POST_DELETE.
    Usuwa wszystkie pliki powiązane z usuniętym obiektem.
    """
    # Iterujemy po wszystkich polach modelu, szukając pól obrazów
    for field in sender._meta.fields:
        if isinstance(field, models.ImageField):
            file_to_delete = getattr(instance, field.name)

            # Jeśli plik istnieje i nie jest plikiem domyślnym, usuń go
            if file_to_delete and file_to_delete.name != field.default:
                delete_file_if_exists(file_to_delete.path)

# ==========================================================
#  3. PODŁĄCZANIE SYGNAŁÓW DO WSZYSTKICH POTRZEBNYCH MODELI
# ==========================================================

# Lista modeli, które zawierają pliki i mają być objęte automatycznym sprzątaniem
models_with_files = [User, School, Instructor, SchoolImage]

for model in models_with_files:
    pre_save.connect(auto_delete_file_on_change, sender=model, weak=False)
    post_delete.connect(auto_delete_file_on_delete, sender=model, weak=False)