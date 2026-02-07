from django.forms import ValidationError
from rest_framework import serializers
from .models import User, Style, School, SchoolImage, PriceList, Review, Instructor, DanceFloor, DanceClass
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # DODAJEMY DANE DO TOKENA (to co przeczyta jwtDecode)
        token['username'] = user.username
        token['role'] = user.role
        token['has_school'] = hasattr(user, 'school') # Sprawdza czy ma szkołę

        return token

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # MUSISZ dodać 'role' tutaj, inaczej Django powie: "Co ty mi tu wysyłasz?"
        fields = ('username', 'email', 'password', 'role') 
        extra_kwargs = {'password': {'write_only': True}}
    
    def validate_role(self, value):
    # Pozwalamy na rejestrację tylko tancerzy i właścicieli
    # Wykluczamy 'admin', żeby nikt sam sobie nie nadał uprawnień przez API
        allowed_public_roles = ['user', 'owner']
        if value not in allowed_public_roles:
            raise serializers.ValidationError("Nie masz uprawnień, by nadać sobie taką rolę.")
        return value

    def create(self, validated_data):
        # Wyciągamy rolę, jeśli jej nie ma, dajemy 'user'
        role = validated_data.pop('role', 'user')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=role  # Przypisujemy rolę do modelu
        )
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'role']

class StyleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Style
        fields = '__all__'

class SchoolImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolImage
        fields = ['id', 'image', 'created_at']

class PriceListSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = PriceList
        fields = '__all__'

class DanceFloorSerializer(serializers.ModelSerializer):
    class Meta:
        model = DanceFloor
        fields = '__all__'

class SimpleSchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ['id', 'name']

from rest_framework import serializers
from .models import Instructor, School, Style

# 1. Mały serializer - tylko ID (do linku) i NAZWA (do wyświetlenia)
class SimpleSchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ['id', 'name'] # Bez miasta, tak jak chciałaś

class InstructorSerializer(serializers.ModelSerializer):
    styles = StyleSerializer(many=True, read_only=True)
    
    # 2. Nadpisujemy schools, żeby zwracało listę obiektów, a nie same ID
    # Dzięki temu frontend dostanie: [{"id": 1, "name": "Szkoła A"}, ...]
    # I będzie mógł zrobić: navigate(`/school/${school.id}`)
    schools = SimpleSchoolSerializer(many=True, read_only=True)

    class Meta:
        model = Instructor
        fields = '__all__'
        read_only_fields = ['schools', 'created_by']

class DanceClassSerializer(serializers.ModelSerializer):
    # JSONField pozwala przyjąć ID (int) lub nową nazwę (str)
    style = serializers.JSONField() 
    school = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = DanceClass
        fields = '__all__'

    def validate(self, data):
        # Pobieramy szkołę z kontekstu (widoku)
        request = self.context.get('request')
        user_school = request.user.school
        style_data = data.get('style')
        
        # Tworzymy atrapę stylu tylko do walidacji clean()
        if isinstance(style_data, int):
            style_obj = Style.objects.filter(id=style_data).first()
        else:
            style_obj = Style(style_name=str(style_data).capitalize())

        # Przygotowujemy dane do clean()
        temp_data = {**data}
        temp_data['style'] = style_obj
        temp_data['school'] = user_school
        
        # Many-to-Many (instruktorzy) wywalamy z atrapy, bo clean() ich nie potrzebuje
        temp_data.pop('instructors', None) 
        
        instance = DanceClass(**temp_data)
        try:
            instance.clean() # Walidacja kolizji sal i godzin
        except ValidationError as e:
            raise serializers.ValidationError(e.message_dict)
            
        return data

    def create(self, validated_data):
        style_data = validated_data.pop('style')
        instructors_data = validated_data.pop('instructors', []) 

        # Logika: znajdź istniejący styl lub stwórz nowy
        if isinstance(style_data, int):
            style_obj = Style.objects.get(id=style_data)
        else:
            style_name = str(style_data).strip().capitalize()
            style_obj, created = Style.objects.get_or_create(style_name=style_name)

        # 1. Tworzymy zajęcia
        dance_class = DanceClass.objects.create(style=style_obj, **validated_data)
        
        # 2. Dodajemy instruktorów przez .set() (wymóg Many-to-Many)
        if instructors_data:
            dance_class.instructors.set(instructors_data)
            
        return dance_class

    def to_representation(self, instance):
        """
        FIX: To rozwiązuje błąd 'Style is not JSON serializable'.
        Zamieniamy obiekt Style na jego ID przed wysłaniem odpowiedzi do Reacta.
        """
        ret = super().to_representation(instance)
        ret['style'] = instance.style.id if instance.style else None
        return ret
    
class SchoolSerializer(serializers.ModelSerializer):
    images = SchoolImageSerializer(many=True, read_only=True)
    floors = DanceFloorSerializer(many=True, read_only=True)
    instructors = InstructorSerializer(many=True, read_only=True)
    price_list = PriceListSerializer(many=True, read_only=True)
    styles = StyleSerializer(many=True, read_only=True)

    average_rating = serializers.DecimalField(max_digits=3, decimal_places=2, read_only=True)
    full_address = serializers.CharField(read_only=True)

    class Meta:
        model = School
        fields = [
            'id', 'user', 'name', 'logo', 'email', 'phone', 'website', 
            'instagram', 'facebook', 'street', 'build_no', 'postal_code', 
            'city', 'description', 'rules', 'default_registration_info_link',
            'news', 'accepts_multisport', 'accepts_medicover', 'accepts_fitprofit', 
            'accepts_pzu_sport', 'benefit_cards_info', 'images', 'floors', 
            'instructors', 'price_list', 'styles', 'average_rating', 'full_address',
            'latitude', 'longitude', 'state', 'county' 
        ]
        
        read_only_fields = ['id', 'user', 'average_rating', 'full_address']
        


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Review
        fields = ['id', 'school', 'user', 'username', 'rating', 'description', 'created_at']
        read_only_fields = ['user']

