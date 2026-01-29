from rest_framework import serializers
from .models import User, Style, School, SchoolImage, PriceList, Review, Instructor, DanceFloor, DanceClass
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Dodajemy rolę użytkownika do tokena, żeby React od razu wiedział, co pokazać
        token['role'] = user.role
        return token

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8) # Hasło tylko do zapisu

    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'role'] # Pola z Twoich makiet SignUp

    def create(self, validated_data):
        # Używamy create_user, żeby Django automatycznie zahaszowało hasło przed zapisem
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
            role=validated_data.get('role', 'user') # Domyślnie tancerz, jeśli nie podano inaczej
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
    # Zagnieżdżamy relacje, żeby React dostał komplet danych na raz
    images = SchoolImageSerializer(many=True, read_only=True)
    floors = DanceFloorSerializer(many=True, read_only=True)
    instructors = InstructorSerializer(many=True, read_only=True)
    styles = StyleSerializer(many=True, read_only=True)

    class Meta:
        model = School
        fields = '__all__'

class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Review
        fields = ['id', 'school', 'user', 'username', 'rating', 'description', 'created_at']
        read_only_fields = ['user']