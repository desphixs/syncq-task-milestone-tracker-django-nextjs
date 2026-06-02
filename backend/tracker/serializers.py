from rest_framework import serializers
# Import our Project model from the local models file.
from .models import Project

class ProjectSerializer(serializers.ModelSerializer):
    """
    PROJECT SERIALIZER
    
    Analogy:
    Think of a Serializer like a customs translator at an international border.
    When data comes from the browser (as JSON text), the translator double-checks
    if the passport is valid (validation) and translates it into a Python format Django understands.
    When sending data back to the browser, the translator takes our database rows
    and translates them into a neat JSON text format that React/Next.js can easily display!
    """
    
    class Meta:
        # We bind this serializer directly to our Project model.
        model = Project
        
        # We specify exactly which database columns should be translated into JSON.
        fields = [
            'id',
            'owner',
            'title',
            'description',
            'status',
            'due_date',
            'created_at',
            'updated_at'
        ]
        
        # We mark the owner field as read-only.
        # This is a critical security rule! We never let the frontend client tell us
        # who owns a project. The backend will always force the owner to be the logged-in user.
        read_only_fields = ['owner']
