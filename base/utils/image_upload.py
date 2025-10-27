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

def createImageValidator(max_size_mb=5, allowed_mime_types=None):
    """
    Funkcja-fabryka, która tworzy i zwraca spersonalizowaną funkcję walidującą.
    Pozwala na łatwe definiowanie różnych limitów rozmiaru i typów plików.
    """
    if allowed_mime_types is None:
        # Domyślnie dozwolone popularne formaty obrazów
        allowed_mime_types = ['image/jpeg', 'image/png', 'image/gif']

    def validator(file):
        # Krok 1: Walidacja rozmiaru pliku
        max_size_bytes = max_size_mb * 1024 * 1024
        if file.size > max_size_bytes:
            raise ValidationError(f'Plik jest zbyt duży (max {max_size_mb}MB).')
            
        # Krok 2: Bezpieczna walidacja typu pliku (MIME type)
        file.seek(0)
        mime_type = magic.from_buffer(file.read(1024), mime=True)
        file.seek(0)  # Zresetuj wskaźnik pliku dla Django

        if mime_type not in allowed_mime_types:
            raise ValidationError(f'Nieprawidłowy typ pliku ({mime_type}). Dozwolone są tylko obrazy.')

    return validator

# --- Predefiniowane walidatory do użycia w modelach ---

# Ogólny walidator dla większości obrazów
validate_image = createImageValidator(max_size_mb=5)

# Specjalny walidator dla awatarów z mniejszym limitem
validate_avatar = createImageValidator(max_size_mb=2)