from django.contrib import admin
from .models import User, Profile

class UserAdmin(admin.ModelAdmin):
    """
    CUSTOM USER ADMIN CONFIGURATIONS
    
    This class configures how our custom User model is displayed and managed 
    inside Django's standard graphical admin portal interface.
    """
    # Columns to show in the users table list view.
    list_display = ('email', 'full_name', 'is_active', 'is_staff', 'created_at')
    
    # Enable quick filtering of rows by these fields on the right sidebar panel.
    list_filter = ('is_active', 'is_staff', 'created_at')
    
    # Enable a search bar at the top to search users by their email or full name.
    search_fields = ('email', 'full_name')
    
    # Sort users by newest registrations first by default.
    ordering = ('-created_at',)

# Register our custom User model with the customized UserAdmin settings!
admin.site.register(User, UserAdmin)


admin.site.register(Profile)