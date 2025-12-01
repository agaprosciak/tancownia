from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator


from base.utils.image_upload import (
    user_avatar_path,
    school_logo_path,
    instructor_image_path,
    school_image_path,
    validate_image,
    validate_avatar
)



class User(AbstractUser):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('owner', 'Owner'),
        ('admin', 'Admin'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    email = models.EmailField(unique=True)
    avatar = models.ImageField(
        upload_to=user_avatar_path,
        blank=True,
        null=True,
        validators=[validate_avatar]
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.email} ({self.role})"



class Style(models.Model):
    style_name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.style_name


class School(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='school')

    name = models.CharField(max_length=255)
    logo = models.ImageField(
        upload_to=school_logo_path,
        blank=True,
        null=True,
        validators=[validate_image]
    )
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    instagram = models.URLField(blank=True, null=True)
    facebook = models.URLField(blank=True, null=True)

    street = models.CharField(max_length=255)
    build_no = models.CharField(max_length=20)
    postal_code = models.CharField(max_length=20)
    city = models.CharField(max_length=100)
    county = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    full_address = models.CharField(max_length=255,blank=True)

    styles = models.ManyToManyField('Style', related_name='schools', blank=True)
    description = models.TextField()
    important_info = models.TextField(blank=True, null=True)
    rules = models.TextField(blank=True, null=True)
    default_registration_info_link = models.TextField(blank=True, null=True)

    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        self.full_address = f"{self.street} {self.build_no}, {self.postal_code} {self.city}"
        super().save(*args, **kwargs)


class SchoolImage(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to=school_image_path, validators=[validate_image])
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.school.name} - {self.id}"

class PriceList(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='price_list')
    class_duration = models.CharField(max_length=50)
    name = models.CharField(max_length=100)
    description = models.TextField()
    price = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"{self.school.name} - {self.name}"



class Review(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('school', 'user')
        ordering = ['-created_at']

    def __str__(self):
        
        return f"{self.rating}★ {self.school.name}"


class Instructor(models.Model):
    schools = models.ManyToManyField(School, related_name='instructors')
    first_name = models.CharField(max_length=100)
    pseudonym = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100)
    photo = models.ImageField(upload_to=instructor_image_path, blank=True, null=True,  validators=[validate_image])
    styles = models.ManyToManyField(Style, related_name='instructors', blank=True)

    def __str__(self):
        display_name = f"{self.first_name} {self.last_name}"
        if self.pseudonym:
            display_name += f" ({self.pseudonym})"
        return display_name




class Level(models.Model):
    level = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.level


class AgeGroup(models.Model):
    age = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.age


class ParticipationForm(models.Model):
    participation_form = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.participation_form

class DanceFloor(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='floors')
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name} ({self.school.name})"




class DanceClass(models.Model):
    DAYS_OF_WEEK = [
        ('monday', 'Poniedziałek'),
        ('tuesday', 'Wtorek'),
        ('wednesday', 'Środa'),
        ('thursday', 'Czwartek'),
        ('friday', 'Piątek'),
        ('saturday', 'Sobota'),
        ('sunday', 'Niedziela'),
    ]

    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='classes')
    style = models.ForeignKey(Style, on_delete=models.CASCADE, related_name='classes')
    instructors = models.ManyToManyField(Instructor, related_name='classes', blank=True)
    level = models.ForeignKey(Level, on_delete=models.CASCADE)
    age_group = models.ForeignKey(AgeGroup, on_delete=models.CASCADE)
    participation_form = models.ForeignKey(ParticipationForm, on_delete=models.SET_NULL, null=True, blank=True, help_text="Opcjonalnie, np. zajęcia w parach, solo, formacja")
    
    # ZMIANA: day_of_week jest wymagane w bazie (brak null=True), ale opcjonalne w formularzu (blank=True)
    # ponieważ uzupełniamy je automatycznie w save()
    day_of_week = models.CharField(max_length=20, choices=DAYS_OF_WEEK, blank=True)
    
    starts_at = models.TimeField()
    ends_at = models.TimeField()
    floor = models.ForeignKey(DanceFloor, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    
    # first_class_date jest teraz BEZWZGLĘDNIE OBOWIĄZKOWE
    first_class_date = models.DateField()
    
    can_join = models.BooleanField(default=True)
    periodic = models.BooleanField(default=True)
    price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    registration_info_link = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.style.style_name} ({self.school.name})"
    
    def save(self, *args, **kwargs):
        # AUTOMATYCZNE USTAWIANIE DNIA TYGODNIA
        # Działa zawsze, gdy podana jest data (a teraz jest ona obowiązkowa)
        if self.first_class_date:
            days_keys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            day_index = self.first_class_date.weekday()
            self.day_of_week = days_keys[day_index]

        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        
        # 1. Walidacja czasu (Start < Koniec)
        if self.starts_at and self.ends_at and self.ends_at <= self.starts_at:
            raise ValidationError(
                {'ends_at': "Czas zakończenia zajęć musi być późniejszy niż czas rozpoczęcia."}
            )
            
        # ====================================================
        # 2. WALIDACJA KOLIZJI SALI (Double Booking)
        # ====================================================
        
        # Sprawdzamy tylko, jeśli zdefiniowano salę i godziny
        if self.floor and self.starts_at and self.ends_at and self.first_class_date:
            
            # Musimy ustalić, jaki to dzień tygodnia, żeby sprawdzić kolizje.
            # W clean() save() jeszcze nie zadziałał, więc musimy to wyliczyć "na brudno" tutaj.
            days_keys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            current_day_of_week = days_keys[self.first_class_date.weekday()]

            # Szukamy konfliktów
            conflicting_classes = DanceClass.objects.filter(
                school=self.school,     # Ta sama szkoła
                floor=self.floor,       # Ta sama sala
                day_of_week=current_day_of_week # Ten sam dzień tygodnia (cyklicznie)
            )

            # Wykluczamy "samego siebie" przy edycji
            if self.pk:
                conflicting_classes = conflicting_classes.exclude(pk=self.pk)

            # Sprawdzamy nakładanie się godzin
            # (Nowy start < Stary koniec) ORAZ (Nowy koniec > Stary start)
            conflicting_classes = conflicting_classes.filter(
                starts_at__lt=self.ends_at,
                ends_at__gt=self.starts_at
            )

            if conflicting_classes.exists():
                conflict = conflicting_classes.first()
                raise ValidationError({
                    'starts_at': (
                        f"Kolizja! W sali '{self.floor.name}' w {self.get_day_of_week_display()} "
                        f"odbywają się już zajęcia: {conflict.style.style_name} "
                        f"({conflict.starts_at.strftime('%H:%M')} - {conflict.ends_at.strftime('%H:%M')})."
                    )
                })



class ClassCancellation(models.Model):
    #Model reprezentujący jednorazowe odwołanie zajęć w konkretnym dniu.
    dance_class = models.ForeignKey(
        DanceClass, 
        on_delete=models.CASCADE, 
        related_name='cancellations',
        help_text="Wybierz zajęcia, które chcesz odwołać."
    )
    date = models.DateField(
        help_text="Konkretna data, w której zajęcia się nie odbędą."
    )
    reason = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text="Opcjonalny powód odwołania (np. 'Święto')."
    )
    cancelled = models.BooleanField(
        default=True,
        help_text="Zaznaczone oznacza, że zajęcia są odwołane. Odznacz, aby przywrócić zajęcia w tym terminie."
    )
    
    class Meta:
        unique_together = ('dance_class', 'date')
        ordering = ['date']

    def __str__(self):
        status = "Odwołane" if self.cancelled else "Przywrócone"
        return f"{status}: {self.dance_class.style.style_name} w dniu {self.date}"

    def clean(self):
        #Walidacja logiki biznesowej przed zapisem.
        super().clean()

        # 1. Sprawdź, czy data odwołania nie jest w przeszłości
        if self.date < timezone.now().date():
            raise ValidationError("Nie można odwołać zajęć z przeszłości.")
            
        # 2. Dla zajęć cyklicznych, sprawdź czy dzień tygodnia się zgadza
        if self.dance_class and self.dance_class.periodic:
            # mapowanie wartości z modelu na standard weekday() (poniedziałek=0)
            day_map = {name: i for i, (name, _) in enumerate(DanceClass.DAYS_OF_WEEK)}
            expected_weekday = day_map.get(self.dance_class.day_of_week)
            
            if self.date.weekday() != expected_weekday:
                raise ValidationError(
                    f"Te zajęcia odbywają się w {self.dance_class.get_day_of_week_display()}. "
                    f"Nie można ich odwołać w dniu {self.date.strftime('%A')}."
                )
            
        # 3. Dla zajęć jednorazowych, sprawdź czy data odwołania jest taka sama
        if self.dance_class and not self.dance_class.periodic:
            if self.dance_class.first_class_date != self.date:
                raise ValidationError(
                    "Datę odwołania dla zajęć jednorazowych musi być taka sama "
                    f"jak data tych zajęć ({self.dance_class.first_class_date})."
                )


