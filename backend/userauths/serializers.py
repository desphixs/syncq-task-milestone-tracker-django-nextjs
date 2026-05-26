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
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        # Hook this serializer to our custom User database model.
        model = User
        # Define the exact fields that the frontend is allowed to submit or read.
        fields = ['email', 'full_name', 'password', 'confirm_password']

    # Custom validation function to check all submitted fields before saving.
    def validate(self, attrs):
        # 1. Check if the password and the confirmation password match exactly.
        if attrs['password'] != attrs['confirm_password']:
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
        # Remove confirm_password since it is not a field in our actual database User model.
        validated_data.pop('confirm_password')
        
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


from .models import Profile

class UserProfileSerializer(serializers.ModelSerializer):
    """
    USER PROFILE SERIALIZER
    
    Analogy:
    Think of this serializer like a unified passport updater form.
    When a citizen submits this form, it updates both their core passport details (full name)
    and their visa logs / visual picture (bio, avatar url, notifications preferences) in one single go!
    
    It supports dotted sources so DRF nests the profile fields cleanly under the 'profile' context dictionary.
    """
    bio = serializers.CharField(source='profile.bio', required=False, allow_blank=True)
    avatar = serializers.URLField(source='profile.avatar', required=False, allow_blank=True)
    email_notification = serializers.BooleanField(source='profile.email_notification', required=False)
    public_profile = serializers.BooleanField(source='profile.public_profile', required=False)

    class Meta:
        model = User
        fields = ['email', 'full_name', 'bio', 'avatar', 'email_notification', 'public_profile', 'created_at']
        read_only_fields = ['email', 'created_at']

    def update(self, instance, validated_data):
        # 1. Safely extract profile nested fields dictionary parsed by DRF's dotted source rules
        profile_data = validated_data.pop('profile', {})

        # 2. Update parent User fields (like full_name)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # 3. Smart creation: Retrieve or create Profile model instance if it doesn't already exist
        profile, created = Profile.objects.get_or_create(user=instance)

        # 4. Update the nested Profile fields
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()

        return instance


class PasswordChangeSerializer(serializers.Serializer):
    """
    PASSWORD CHANGE SERIALIZER
    
    Analogy:
    Think of this serializer like a secure combination-lock reset form.
    The vault gatekeeper (the serializer) refuses to change your vault combination
    unless you can prove you already know the combination of the active lock (current_password)!
    Then, it ensures your new combination is strong, safe, and typed twice to avoid typos.
    """
    current_password = serializers.CharField(
        required=True,
        style={'input_type': 'password'},
        write_only=True
    )
    new_password = serializers.CharField(
        required=True,
        style={'input_type': 'password'},
        write_only=True
    )
    confirm_new_password = serializers.CharField(
        required=True,
        style={'input_type': 'password'},
        write_only=True
    )

    def validate_current_password(self, value):
        # Retrieve the authenticated user from context to verify password
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Your current password is incorrect.")
        return value

    def validate(self, attrs):
        # 1. Verify if the new password matches confirmation exactly
        if attrs['new_password'] != attrs['confirm_new_password']:
            raise serializers.ValidationError({"new_password": "New passwords do not match."})

        # 2. Prevent setting the same password
        if attrs['current_password'] == attrs['new_password']:
            raise serializers.ValidationError({"new_password": "Your new password cannot be the same as your current password."})

        # 3. Enforce the same strength rules as RegisterSerializer
        password = attrs['new_password']
        if len(password) < 8:
            raise serializers.ValidationError({"new_password": "Password must be at least 8 characters long."})
        if not re.search(r'[A-Z]', password):
            raise serializers.ValidationError({"new_password": "Password must contain at least one uppercase letter."})
        if not re.search(r'[a-z]', password):
            raise serializers.ValidationError({"new_password": "Password must contain at least one lowercase letter."})
        if not re.search(r'[0-9]', password):
            raise serializers.ValidationError({"new_password": "Password must contain at least one number."})
        if not re.search(r'[@#$!%*?&]', password):
            raise serializers.ValidationError({"new_password": "Password must contain at least one special character."})

        return attrs


