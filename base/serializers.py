import bleach
from django.forms import ValidationError
from rest_framework import serializers
from .models import User, Style, School, SchoolImage, PriceList, Review, Instructor, DanceFloor, DanceClass
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# --- ZMODYFIKOWANA FUNKCJA ANTY-XSS ---
def sanitize_data(data):
    for key, value in data.items():
        if isinstance(value, str) and key != 'password':
            # Czyścimy tekst z HTML-a
            cleaned_value = bleach.clean(value, tags=[], strip=True).strip()
            
            # SPRAWDZAMY: Jeśli user COŚ wpisał (value), ale po czyszczeniu zostało NIC (not cleaned_value)
            # To znaczy, że wpisał same tagi HTML/skrypty. Wtedy wyrzucamy błąd do frontendu.
            if value.strip() and not cleaned_value:
                raise serializers.ValidationError({
                    key: "Pole zawiera niedozwolone znaki lub kod HTML i nie może zostać zapisane."
                })
            
            data[key] = cleaned_value
    return data
# -----------------------------------

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.role
        token['has_school'] = hasattr(user, 'school')
        return token

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'role') 
        extra_kwargs = {'password': {'write_only': True}}
    
    def validate_role(self, value):
        allowed_public_roles = ['user', 'owner']
        if value not in allowed_public_roles:
            raise serializers.ValidationError("Nie masz uprawnień, by nadać sobie taką rolę.")
        return value

    def validate(self, attrs):
        return sanitize_data(attrs) 

    def create(self, validated_data):
        role = validated_data.pop('role', 'user')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=role 
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

    def validate(self, attrs):
        return sanitize_data(attrs)

class SchoolImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolImage
        fields = ['id', 'image', 'created_at']

class PriceListSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = PriceList
        fields = '__all__'

    def validate(self, attrs):
        return sanitize_data(attrs)

class DanceFloorSerializer(serializers.ModelSerializer):
    class Meta:
        model = DanceFloor
        fields = '__all__'

    def validate(self, attrs):
        return sanitize_data(attrs)

class SimpleSchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ['id', 'name']

class InstructorSerializer(serializers.ModelSerializer):
    styles = StyleSerializer(many=True, read_only=True)
    schools = SimpleSchoolSerializer(many=True, read_only=True)

    class Meta:
        model = Instructor
        fields = '__all__'
        read_only_fields = ['schools', 'created_by']

    def validate(self, attrs):
        return sanitize_data(attrs)

class DanceClassSerializer(serializers.ModelSerializer):
    style = serializers.JSONField() 
    school = serializers.PrimaryKeyRelatedField(read_only=True)
    description = serializers.CharField(max_length=1000, allow_blank=True, required=False)
    registration_info_link = serializers.CharField(max_length=1000, allow_blank=True, required=False)

    class Meta:
        model = DanceClass
        fields = '__all__'

    def validate(self, data):
        # Tutaj wywołujemy sanitize_data, które teraz wywali błąd jeśli style to sam HTML
        data = sanitize_data(data)

        request = self.context.get('request')
        user_school = request.user.school
        style_data = data.get('style')
        
        if isinstance(style_data, int):
            style_obj = Style.objects.filter(id=style_data).first()
        else:
            style_obj = Style(style_name=str(style_data).capitalize())

        temp_data = {**data}
        temp_data['style'] = style_obj
        temp_data['school'] = user_school
        temp_data.pop('instructors', None) 
        
        instance = DanceClass(**temp_data)
        try:
            instance.clean() 
        except ValidationError as e:
            raise serializers.ValidationError(e.message_dict)
            
        return data

    def create(self, validated_data):
        style_data = validated_data.pop('style')
        instructors_data = validated_data.pop('instructors', []) 

        if isinstance(style_data, int):
            style_obj = Style.objects.get(id=style_data)
        else:
            style_name = str(style_data).strip().capitalize()
            style_obj, created = Style.objects.get_or_create(style_name=style_name)

        dance_class = DanceClass.objects.create(style=style_obj, **validated_data)
        if instructors_data:
            dance_class.instructors.set(instructors_data)
            
        return dance_class

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.style:
            ret['style'] = StyleSerializer(instance.style).data
        else:
            ret['style'] = None
        return ret
    
class SchoolSerializer(serializers.ModelSerializer):
    images = SchoolImageSerializer(many=True, read_only=True)
    floors = DanceFloorSerializer(many=True, read_only=True)
    instructors = InstructorSerializer(many=True, read_only=True)
    price_list = PriceListSerializer(many=True, read_only=True)
    styles = StyleSerializer(many=True, read_only=True)
    classes = DanceClassSerializer(many=True, read_only=True)
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=2, read_only=True)
    full_address = serializers.CharField(read_only=True)
    reviews_count = serializers.IntegerField(read_only=True)
    
    description = serializers.CharField(max_length=2500, allow_blank=True, required=False)
    rules = serializers.CharField(max_length=1500, allow_blank=True, required=False)
    default_registration_info_link = serializers.CharField(max_length=1000, allow_blank=True, required=False)
    news = serializers.CharField(max_length=1000, allow_blank=True, required=False)

    class Meta:
        model = School
        fields = [
            'id', 'user', 'name', 'logo', 'email', 'phone', 'website', 
            'instagram', 'facebook', 'street', 'build_no', 'postal_code', 
            'city', 'description', 'rules', 'default_registration_info_link',
            'news', 'accepts_multisport', 'accepts_medicover', 'accepts_fitprofit', 
            'accepts_pzu_sport', 'benefit_cards_info', 'images', 'floors', 
            'instructors', 'price_list', 'styles', 'average_rating', 'full_address',
            'latitude', 'longitude', 'state', 'county','classes','reviews_count'
        ]
        read_only_fields = ['id', 'user', 'average_rating', 'full_address', 'reviews_count']

    def validate(self, attrs):
        return sanitize_data(attrs)

class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    description = serializers.CharField(max_length=1000)

    class Meta:
        model = Review
        fields = ['id', 'school', 'user', 'username', 'rating', 'description', 'created_at']
        read_only_fields = ['user']

    def validate(self, attrs):
        return sanitize_data(attrs)