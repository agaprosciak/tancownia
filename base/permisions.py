from rest_framework import permissions

class IsCreatorAndEmploysOrAdminOrReadOnly(permissions.BasePermission):
    """
    Edycja dozwolona tylko dla:
    1. Admina.
    2. Twórcy rekordu, ALE TYLKO JEŚLI instruktor nadal jest przypisany do jego szkoły.
    """
    
    def has_object_permission(self, request, view, obj):
        # 1. Czytanie (GET) dla każdego
        if request.method in permissions.SAFE_METHODS:
            return True

        # 2. Admin może wszystko
        if request.user.is_staff:
            return True

        # 3. Sprawdzamy Twórcę
        if obj.created_by == request.user:
            # Sprawdzamy, czy użytkownik (szkoła) ma tego instruktora u siebie w relacji 'schools'
            # Zakładając, że User ma relację 1:1 ze School
            if hasattr(request.user, 'school'):
                is_employed = obj.schools.filter(pk=request.user.school.pk).exists()
                return is_employed
            
        return False