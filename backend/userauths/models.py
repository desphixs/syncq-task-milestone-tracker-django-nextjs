from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

class UserManager(BaseUserManager):
    """
    CUSTOM USER MANAGER
    
    Analogy:
    Think of this class like a clerk at the passport office. 
    Whenever a new citizen wants to register, the clerk double-checks if their data is complete,
    standardizes their email structure (normalization), and makes sure their security password
    is scrambled safely before sealing the records in the filing cabinet (the database).
    """

    def create_user(self, email, password=None, **extra_fields):
        """
        Creates, hashes the password, and saves a standard user account.
        """
        # We enforce that every user must provide an email address.
        if not email:
            raise ValueError('Users must provide an email address')
        
        # We "normalize" the email domain name (e.g., converting "Destiny@Gmail.Com" to lowercase).
        # This prevents duplicate account registrations due to case adjustments.
        email = self.normalize_email(email)
        
        # Instantiate the model with the normalized email and extra details.
        user = self.model(email=email, **extra_fields)
        
        # We securely hash/scramble the password before saving it.
        # This keeps the raw password safe from database breaches!
        user.set_password(password)
        
        # Save the finalized user object directly to the database.
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Creates, hashes, and saves an administrative superuser account.
        """
        # We set default flags since this is an admin administrator.
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        # Validate that the superuser possesses permissions access.
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        # Call our standard create_user method above to generate the database row.
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    CUSTOM USER MODEL
    
    Analogy:
    This model defines the layout of the filing card for every user in our library database.
    Instead of using standard old-fashioned user cards that rely on usernames, we design a modern card 
    layout that uses a unique Email address as the primary identifier (USERNAME_FIELD).
    """
    
    # Primary email address that must be unique across the entire database.
    email = models.EmailField(unique=True, max_length=255)
    
    # Optional field to store the user's full name.
    full_name = models.CharField(max_length=255, blank=True)
    
    # Active toggle indicator. Useful for suspending accounts or soft deletions.
    is_active = models.BooleanField(default=True)
    
    # Staff indicator. Determines if this user is allowed to access the admin portal interface.
    is_staff = models.BooleanField(default=False)
    
    # Timestamps that record exactly when an account was born and last modified.
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Attach our custom manager clerk to this model so Django knows how to create users.
    objects = UserManager()

    # We map the email field as the primary username column.
    USERNAME_FIELD = 'email'
    
    # We require no additional fields during basic generation (e.g. createsuperuser).
    REQUIRED_FIELDS = []

    def __str__(self):
        """
        Returns a friendly representation string whenever the object is printed.
        """
        return self.email
