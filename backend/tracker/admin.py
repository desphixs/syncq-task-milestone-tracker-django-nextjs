from django.contrib import admin
# Import our Project and Task models from the local models file.
from .models import Project, Task

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """
    CUSTOM PROJECT ADMIN CONFIGURATION
    
    Analogy:
    Think of the Admin portal like a supervisor's master control room.
    By customizing ProjectAdmin, we are adding handy viewing monitors and filters
    to our control room so a supervisor can quickly search projects, filter them by status,
    or view exactly who owns which project at a single glance!
    """

    # Customize the columns shown in the Django Admin list table view.
    # Students can easily see the owner, title, status, due date, and timestamps in one row.
    list_display = (
        'id',
        'title',
        'owner',
        'status',
        'due_date',
        'created_at',
        'updated_at'
    )

    # Add quick filtering panels on the right side of the page.
    # This allows filtering projects by their current status and target due date.
    list_filter = (
        'status',
        'due_date',
        'created_at'
    )

    # Add a lookup search bar at the top of the admin page.
    # We specify which fields to look through. Since owner is a foreign key,
    # we use the double underscore syntax 'owner__email' to search by owner's email address!
    search_fields = (
        'title',
        'description',
        'owner__email'
    )

    # Set up default ordering so the newest projects are displayed at the very top.
    ordering = ('-created_at',)


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """
    CUSTOM TASK ADMIN CONFIGURATION
    
    Analogy:
    Just like with projects, a supervisor needs a clear display to see all individual tasks.
    We add quick filters for priority and status, and enable searching so that
    finding a needle in a haystack of task notes becomes incredibly easy!
    """

    # Define the columns that appear in the admin list view for tasks.
    list_display = (
        'id',
        'title',
        'project',
        'priority',
        'status',
        'due_date',
        'completed_at',
        'created_at'
    )

    # Filters on the right sidebar allow sorting through tasks by status, priority, and date.
    list_filter = (
        'status',
        'priority',
        'due_date',
        'completed_at'
    )

    # Enable a search bar to look up tasks by their title, description, or parent project name.
    search_fields = (
        'title',
        'description',
        'project__title'
    )

    # Order tasks by due date first, showing upcoming deadlines.
    ordering = ('due_date', '-created_at')
