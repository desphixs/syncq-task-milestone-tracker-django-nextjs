from rest_framework import serializers
# Import our Project and Task models from the local models file.
from .models import Project, Task

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


class ProjectDetailSerializer(serializers.ModelSerializer):
    """
    PROJECT DETAIL SERIALIZER
    
    Analogy:
    Think of a Detail Serializer like an advanced customs officer.
    Instead of just checking standard passport fields, this officer pulls up files,
    performs quick arithmetic (like adding up completed tasks), and calculates a
    neat progress score before letting you pass!
    
    This serializer automatically computes total tasks, completed tasks, and completion
    percentage in real-time, helping our frontend render beautiful progress bars
    without having to do manual client-side calculations.
    """
    
    # We define custom read-only fields using SerializerMethodField.
    # This instructs Django REST Framework to search for methods named 'get_<fieldname>'
    # to dynamically compute these values on each request.
    total_tasks = serializers.SerializerMethodField()
    completed_tasks = serializers.SerializerMethodField()
    completion_percentage = serializers.SerializerMethodField()

    class Meta:
        # We map this serializer to our Project model.
        model = Project
        
        # We list all original project fields, plus our custom computed fields.
        fields = [
            'id',
            'owner',
            'title',
            'description',
            'status',
            'due_date',
            'created_at',
            'updated_at',
            'total_tasks',
            'completed_tasks',
            'completion_percentage'
        ]
        
        # Ensure that the owner remains secure and read-only.
        read_only_fields = ['owner']

    def get_total_tasks(self, obj):
        """
        Retrieves the total number of tasks belonging to the project.
        """
        # We utilize the reverse relationship 'tasks' configured on the ForeignKey in models.py.
        # Calling obj.tasks.count() performs a fast database count query.
        return obj.tasks.count()

    def get_completed_tasks(self, obj):
        """
        Retrieves the number of completed tasks belonging to the project.
        """
        # We filter the reverse relationship 'tasks' by status='done' and count the records.
        return obj.tasks.filter(status='done').count()

    def get_completion_percentage(self, obj):
        """
        Calculates the completion percentage, rounded to the nearest integer.
        """
        # Step 1: Count the total number of tasks for this specific project.
        total = obj.tasks.count()
        
        # Step 2: Prevent a DivisionByZero error by checking if there are no tasks yet.
        # If total is 0, we immediately return 0.
        if total == 0:
            return 0
            
        # Step 3: Count how many of these tasks have the status set to 'done'.
        completed = obj.tasks.filter(status='done').count()
        
        # Step 4: Calculate the mathematical percentage.
        percentage = (completed / total) * 100
        
        # Step 5: Round to the nearest integer and return the value.
        return round(percentage)


class TaskSerializer(serializers.ModelSerializer):
    """
    TASK SERIALIZER
    
    Analogy:
    Think of the Task Serializer like a task-inspector at an assembly line.
    When you create a new task, the inspector checks if the data provided
    (like the title, priority, and which project it belongs to) is valid.
    When sending task data to the frontend, the inspector neatly packages
    the raw database row into an easy-to-read JSON object for React.
    """

    class Meta:
        # We bind this serializer to our Task model.
        model = Task
        
        # We specify all the fields we want to expose to our frontend.
        fields = [
            'id',
            'project',
            'title',
            'description',
            'priority',
            'status',
            'due_date',
            'completed_at',
            'created_at',
            'updated_at'
        ]
        
        # We make 'completed_at' read-only because we don't want clients
        # to manually set the completion time. Our backend will automatically
        # handle the timestamp when the status changes to 'done'!
        read_only_fields = ['completed_at']

