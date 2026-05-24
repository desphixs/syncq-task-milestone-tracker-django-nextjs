# Import standard serializers module from Django REST Framework.
from rest_framework import serializers
# Import our custom User model to hook it up with serializers.
from .models import User
# Import Django's built-in password validation utilities.
import re

# Define a serializer to handle user registration validation.
class RegisterSerializer(serializers.ModelSerializer):
    # Field for entering the password (write-only so it never leaks in GET requests).
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    # Field to confirm the password (write-only).
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        # Hook this serializer to our custom User database model.
        model = User
        # Define the exact fields that the frontend is allowed to submit or read.
        fields = ['email', 'full_name', 'password', 'password_confirm']

    # Custom validation function to check all submitted fields before saving.
    def validate(self, attrs):
        # 1. Check if the password and the confirmation password match exactly.
        if attrs['password'] != attrs['password_confirm']:
            # If they do not match, raise a validation error.
            raise serializers.ValidationError({"password": "Passwords do not match."})

        password = attrs['password']

        # 2. Enforce password complexity matching rules.
        # Rule A: Must be at least 8 characters long.
        if len(password) < 8:
            raise serializers.ValidationError({"password": "Password must be at least 8 characters long."})

        # Rule B: Must contain at least one uppercase character.
        if not re.search(r'[A-Z]', password):
            raise serializers.ValidationError({"password": "Password must contain at least one uppercase letter."})

        # Rule C: Must contain at least one lowercase character.
        if not re.search(r'[a-z]', password):
            raise serializers.ValidationError({"password": "Password must contain at least one lowercase letter."})

        # Rule D: Must contain at least one numeric digit (0-9).
        if not re.search(r'[0-9]', password):
            raise serializers.ValidationError({"password": "Password must contain at least one number."})

        # Rule E: Must contain at least one special character (e.g., @, #, $, %, etc.).
        if not re.search(r'[@#$!%*?&]', password):
            raise serializers.ValidationError({"password": "Password must contain at least one special character (e.g. @, #, $, !, %, *, ?, &)."})

        # Return the verified attributes dictionary.
        return attrs

    # This method is called when we run serializer.save() to write the new user to the database.
    def create(self, validated_data):
        # Remove password_confirm since it is not a field in our actual database User model.
        validated_data.pop('password_confirm')
        
        # Pull out the email, password, and other extra fields.
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        
        # Use our custom User model's objects manager to create a standard user.
        # This automatically hashes the password using set_password.
        user = User.objects.create_user(
            email=email,
            password=password,
            **validated_data
        )
        # Return the successfully registered user object.
        return user


# Define a serializer to handle login validation.
class LoginSerializer(serializers.Serializer):
    # Email input field.
    email = serializers.EmailField(required=True)
    # Password input field (write-only for security).
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
