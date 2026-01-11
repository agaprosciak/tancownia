import uuid
import os
from django.core.exceptions import ValidationError
import magic  # Używane do bezpiecznego sprawdzania typu pliku
from django.utils.deconstruct import deconstructible

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

def school_logo_path(instance, filename):
    return generate_unique_upload_path(instance, filename, "schools/logos")

def instructor_image_path(instance, filename):
    return generate_unique_upload_path(instance, filename, "instructors")

def school_image_path(instance, filename):
    """
    Tworzy podfolder dla galerii szkoły, nawet jeśli szkoła nie jest jeszcze zapisana.
    """
    school_id_or_new = instance.school.id if instance.school and instance.school.id else "new_school"
    upload_dir = f"schools/{school_id_or_new}"
    return generate_unique_upload_path(instance, filename, upload_dir)


# ===================================================================
#  2. GENERYCZNA FUNKCJA DO TWORZENIA WALIDATORÓW OBRAZÓW
# ===================================================================

@deconstructible
class ImageValidator:
    """
    Konfigurowalny walidator obrazów w formie klasy.
    Django potrafi poprawnie zapisać ("serializować") takie obiekty w migracjach.
    """
    def __init__(self, max_size_mb=5, allowed_mime_types=None):
        self.max_size_mb = max_size_mb
        if allowed_mime_types is None:
            self.allowed_mime_types = ['image/jpeg', 'image/png', 'image/gif']
        else:
            self.allowed_mime_types = allowed_mime_types

    def __call__(self, file):
        """Ta metoda jest wywoływana, gdy Django używa walidatora."""
        # Krok 1: Walidacja rozmiaru
        max_size_bytes = self.max_size_mb * 1024 * 1024
        if file.size > max_size_bytes:
            raise ValidationError(f'Plik jest zbyt duży (max {self.max_size_mb}MB).')
            
        # Krok 2: Bezpieczna walidacja typu pliku
        file.seek(0)
        mime_type = magic.from_buffer(file.read(1024), mime=True)
        file.seek(0)

        if mime_type not in self.allowed_mime_types:
            raise ValidationError(f'Nieprawidłowy typ pliku ({mime_type}). Dozwolone są tylko obrazy.')

# --- Tworzenie konkretnych instancji walidatorów ---

validate_image = ImageValidator(max_size_mb=5)