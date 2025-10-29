import uuid
import os
from django.core.exceptions import ValidationError
import magic  # Używane do bezpiecznego sprawdzania typu pliku

# ===================================================================
#  1. GENERYCZNA FUNKCJA DO TWORZENIA ŚCIEŻEK
# ===================================================================

def generate_unique_upload_path(instance, filename, upload_dir):
    """
    Generuje unikalną ścieżkę dla wgrywanego pliku.
    Jest bezpieczna, ponieważ nie zależy od `instance.id`, które jest puste przy tworzeniu nowego obiektu.
    """
    ext = filename.split('.')[-1].lower()
    unique_filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join(upload_dir, unique_filename)

# --- Konkretne funkcje upload_to używane w modelach ---

def user_avatar_path(instance, filename):
    return generate_unique_upload_path(instance, filename, "user_images/avatars")

def school_logo_path(instance, filename):
    return generate_unique_upload_path(instance, filename, "schools_images/logos")

def instructor_image_path(instance, filename):
    return generate_unique_upload_path(instance, filename, "instructor_images/photos")

def school_image_path(instance, filename):
    """
    Tworzy podfolder dla galerii szkoły, nawet jeśli szkoła nie jest jeszcze zapisana.
    """
    school_id_or_new = instance.school.id if instance.school and instance.school.id else "new_school"
    upload_dir = f"schools_images/{school_id_or_new}/gallery"
    return generate_unique_upload_path(instance, filename, upload_dir)


# ===================================================================
#  2. GENERYCZNA FUNKCJA DO TWORZENIA WALIDATORÓW OBRAZÓW
# ===================================================================

def create_image_validator(max_size_mb=5, allowed_mime_types=None):
    """
    Funkcja-fabryka, która TWORZY i ZWRACA spersonalizowaną funkcję walidującą.
    Działa jak maszyna, którą konfigurujesz, a ona produkuje dla Ciebie walidator.
    """
    if allowed_mime_types is None:
        allowed_mime_types = ['image/jpeg', 'image/png', 'image/gif']

    # To jest funkcja-produkt, którą fabryka tworzy.
    # To właśnie ta funkcja będzie uruchamiana przez Django przy każdym wgraniu pliku.
    def validator(file):
        # Ta funkcja "pamięta" wartość `max_size_mb` z momentu jej stworzenia.
        max_size_bytes = max_size_mb * 1024 * 1024
        if file.size > max_size_bytes:
            raise ValidationError(f'Plik jest zbyt duży (max {max_size_mb}MB).')
            
        # Bezpieczna walidacja typu pliku.
        file.seek(0)
        mime_type = magic.from_buffer(file.read(1024), mime=True)
        file.seek(0)

        if mime_type not in allowed_mime_types:
            raise ValidationError(f'Nieprawidłowy typ pliku ({mime_type}). Dozwolone są tylko obrazy.')

    # Fabryka zwraca gotowy produkt - skonfigurowaną funkcję walidującą.
    return validator

# --- Użycie fabryki do stworzenia predefiniowanych walidatorów ---

# "Zamawiamy" walidator o pojemności 5MB.
validate_image = create_image_validator(max_size_mb=5)

# "Zamawiamy" drugi, mniejszy walidator dla awatarów.
validate_avatar = create_image_validator(max_size_mb=2)