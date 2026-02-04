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
    class Meta:
        model = PriceList
        fields = '__all__'

class DanceFloorSerializer(serializers.ModelSerializer):
    class Meta:
        model = DanceFloor
        fields = '__all__'

class InstructorSerializer(serializers.ModelSerializer):
    styles = StyleSerializer(many=True, read_only=True)
    class Meta:
        model = Instructor
        fields = '__all__'

class DanceClassSerializer(serializers.ModelSerializer):
    # Wyświetlamy nazwy zamiast ID dla czytelności we frontendzie
    style_name = serializers.ReadOnlyField(source='style.style_name')
    floor_name = serializers.ReadOnlyField(source='floor.name')
    
    class Meta:
        model = DanceClass
        fields = '__all__'

    def validate(self, data):
        """
        Serializery domyślnie nie odpalają metody clean() modelu.
        Musimy ją wywołać ręcznie, aby Twoja logika kolizji sal działała!
        """
        instance = DanceClass(**data)
        instance.clean()
        return data

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

