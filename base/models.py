from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import datetime
from django.db.models import F

from base.utils.image_upload import (
    school_logo_path,
    instructor_image_path,
    school_image_path,
    validate_image,
)

class User(AbstractUser):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('owner', 'Owner'),
        ('admin', 'Admin'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    email = models.EmailField(unique=True)

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
    description = models.TextField(help_text="Opisz klimat swojego studia, co Was wyróżnia oraz najważniejsze informacje. To tekst, który ma przekonać kursanta, że to miejsce właśnie dla niego!")
    rules = models.TextField(blank=True, null=True, help_text="Link/i lub tekst. Możesz wkleić tutaj m.in. zasady uczestnictwa w zajęciach, regulamin płatności oraz obowiązujące w szkole Standardy Ochrony Małoletnich.")
    default_registration_info_link = models.TextField(blank=True, null=True, help_text="Wklej tutaj link do Twojego systemu/formularza zapisów lub napisz informacje o sposobie zapisów na zajęcia. Link lub informacje zostaną automatycznie dodany do każdych nowych zajęć (będziesz mógł go zmienić przy konkretnym kursie).")
    news = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Aktualności",
        help_text="Wpisz tu ważne komunikaty (np. 'W Wigilię nieczynne'). Ten tekst wyświetli się na profilu szkoły."
    )

    accepts_multisport = models.BooleanField(
        default=False, 
        verbose_name="Akceptujemy MultiSport"
    )
    accepts_medicover = models.BooleanField(
        default=False, 
        verbose_name="Akceptujemy Medicover Sport (OK System)"
    )
    accepts_fitprofit = models.BooleanField(
        default=False, 
        verbose_name="Akceptujemy FitProfit"
    )
    accepts_pzu_sport = models.BooleanField(
        default=False, 
        verbose_name="Akceptujemy PZU Sport"
    )

    # Pole na dodatkowe informacje (np. "Wymagana kaucja 50 zł", "Dopłata 10 zł")
    benefit_cards_info = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Informacje o kartach (dopłaty, kaucje)",
        help_text="Tutaj wpisz informacje o ewentualnych dopłatach do kart lub kaucjach zwrotnych."
    )

    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        self.full_address = f"{self.street} {self.build_no}, {self.postal_code} {self.city}"
        super().save(*args, **kwargs)


class SchoolImage(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to=school_image_path, validators=[validate_image], help_text="Pokaż klimat swojego miejsca, sale, recepcję, szatnie. Możesz dodać maksymalnie 9 zdjęć (najlepiej w orientacji poziomej).")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.school.name} - {self.id}"

class PriceList(models.Model):
    ENTRY_TYPE_CHOICES = [
        ('pass', 'Karnet'),
        ('single', '1 wejście'),
    ]

    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='price_list')
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    entry_type = models.CharField(max_length=10, choices=ENTRY_TYPE_CHOICES, default='pass')
    duration_minutes = models.PositiveIntegerField(blank=True, null=True, help_text="Czas trwania zajęć w minutach")
    entries_per_week = models.PositiveIntegerField(blank=True, null=True, help_text="Ilość wejść w tygodniu (dla karnetów)")
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.school.name} - {self.name} ({self.get_entry_type_display()})"



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
    photo = models.ImageField(
        upload_to=instructor_image_path, 
        blank=True, 
        null=True, 
        validators=[validate_image]
    )
    styles = models.ManyToManyField(Style, related_name='instructors', blank=True)
    instagram = models.URLField(blank=True, null=True, verbose_name="Instagram URL")
    facebook = models.URLField(blank=True, null=True, verbose_name="Facebook URL")
    

    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='created_instructors'
    )


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

    LEVEL_CHOICES = [
        ('BEGINNER', 'Od podstaw'),
        ('BASIC', 'Początkujący'),
        ('INTERMEDIATE', 'Średniozaawansowany'),
        ('ADVANCED', 'Zaawansowany'),
        ('PRO', 'Profesjonalny'),
        ('OPEN', 'Open (dla każdego)'),
    ]

    GROUP_TYPE_CHOICES =  [
        ('FORMATION', 'Formacja'),
        ('PROJECT', 'Grupa zamknięta'),
        ('DANCE_CONTEST', 'Grupa turniejowa'),
        ('VIDEO_PROJECT', 'Video projekt')
    ]

    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='classes')
    style = models.ForeignKey('Style', on_delete=models.CASCADE, related_name='classes')
    
    subtitle = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        verbose_name="Temat / Dopisek",
        help_text="Opcjonalnie: doprecyzuj temat, np. 'Footwork', 'Musicality', 'Technika obrotów'."
    )
    
    instructors = models.ManyToManyField('Instructor', related_name='classes', blank=True)
    
    level = models.CharField(
        max_length=20,
        choices=LEVEL_CHOICES, 
        default='OPEN',
        verbose_name="Poziom zaawansowania"
    )
    
    group_type = models.CharField(
        max_length=20, 
        choices=GROUP_TYPE_CHOICES, 
        null=True,   
        blank=True, 
        verbose_name="Specyfika grupy (opcjonalne)"
    )

    # === WIEK ===
    min_age = models.PositiveIntegerField(
        verbose_name="Wiek od (lat)",
        help_text="Minimalny wiek uczestnika."
    )

    max_age = models.PositiveIntegerField(
        null=True, 
        blank=True, 
        verbose_name="Wiek do (lat)",
        help_text="Zostaw puste, jeśli grupa nie ma górnej granicy (np. dla grupy 16+ lub dorosłych)."
    )
    
    # Zawsze uzupełniany w save na podstawie daty startu
    day_of_week = models.CharField(max_length=20, choices=DAYS_OF_WEEK, blank=True)
    
    starts_at = models.TimeField(verbose_name="Godzina startu")
    ends_at = models.TimeField(verbose_name="Godzina końca", help_text="W przypadku wydarzeń kilkudniowych: wpisz godzinę zakończenia CAŁEGO wydarzenia w ostatnim dniu jego trwania")
    
    floor = models.ForeignKey('DanceFloor', on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    periodic = models.BooleanField(default=True, verbose_name="Zajęcia cykliczne")
    
    first_class_date = models.DateField(verbose_name="Data startu")
    last_class_date = models.DateField(null=True, blank=True, verbose_name="Data końca")
    
    can_join = models.BooleanField(default=True, help_text="Odznacz to pole, jeśli grupa jest już pełna lub zakończyły się do niej zapisy.")
    price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    registration_info_link = models.TextField(blank=True, null=True, help_text="Link do zapisów lub instrukcja.")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.style} ({self.day_of_week} {self.starts_at})"
    
    def save(self, *args, **kwargs):
        # Dzień tygodnia zawsze na podstawie daty startu
        if self.first_class_date:
            days_keys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            self.day_of_week = days_keys[self.first_class_date.weekday()]

        # Automatycznie ustawiana daty końca (Żeby event jednodniowy miał datę końca = data startu)
        if not self.last_class_date:
            self.last_class_date = self.first_class_date

        super().save(*args, **kwargs)

    def clean(self):
        # Walidacja daty i godziny

        effective_end_date = self.last_class_date if self.last_class_date else self.first_class_date
        
        if effective_end_date < self.first_class_date:
             raise ValidationError({'last_class_date': "Data końca wcześniejsza niż startu."})

        # Dla jednodniowych wydarzeń sprawdzamy logikę godzin (koniec > start)
        if effective_end_date == self.first_class_date:
            if self.starts_at and self.ends_at and self.ends_at <= self.starts_at:
                raise ValidationError({'ends_at': "Godzina końca musi być późniejsza niż startu."})

        # Logika kolizji zajęć w salach
        if self.floor is None:
            return

        # Jeśli to wydarzenie wielodniowe, też pomijamy sprawdzanie kolizji
        is_multi_day = effective_end_date > self.first_class_date
        if not self.periodic and is_multi_day:
            return

        # Sprawdzamy kolizje tylko jeśli istnieją godziny startu i końca
        if self.starts_at and self.ends_at:
            
            # Pobieramy wszystko z tej samej szkoły i tej samej sali
            qs = DanceClass.objects.filter(school=self.school, floor=self.floor)

            # Wykluczamy aktualnie edytowane zajęcia, żeby nie kolidować ze sobą
            if self.pk:
                qs = qs.exclude(pk=self.pk)

            conflicts = []

            # SCENARIUSZ A: ZAJĘCIA CYKLICZNE (Stały grafik)
            if self.periodic:
                # Sprawdzanie kolizji tylko z innymi cyklicznymi zajęciami w ten sam dzień tygodnia
                conflicts = qs.filter(periodic=True, day_of_week=self.day_of_week)

            # SCENARIUSZ B: WARSZTAT JEDNODNIOWY
            else:
                # Sprawdzanie kolizji tylko pomiędzy warszatami jednorazowymi
                conflicts = qs.filter(periodic=False, first_class_date=self.first_class_date)

            # Sprawdzanie zakresów godzin
            for c in conflicts:
                # Logika: (Start A < Koniec B) AND (Koniec A > Start B)
                if self.starts_at < c.ends_at and self.ends_at > c.starts_at:
                    formatted_start = c.starts_at.strftime('%H:%M')
                    formatted_end = c.ends_at.strftime('%H:%M')
                    
                    raise ValidationError({
                        'starts_at': f"KOLIZJA! W sali '{self.floor.name}' są już zajęcia: {c.style} ({formatted_start}-{formatted_end})"
                    })