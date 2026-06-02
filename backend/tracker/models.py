from django.db import models
# Import the custom User model from the userauths application.
# This enables us to link each project to a specific user for data isolation.
from userauths.models import User

class Project(models.Model):
    """
    PROJECT MODEL
    
    Analogy:
    Think of a Project like a digital cabinet drawer.
    Each drawer belongs to one specific person (the owner).
    Inside this drawer, the owner can keep folders and papers (tasks).
    Since every drawer has a lock that only opens for its owner,
    we ensure absolute privacy and security for all their projects!
    """

    class StatusChoices(models.TextChoices):
        """
        These are the status options a project can have.
        Using TextChoices keeps our statuses standardized and prevents typos!
        """
        PLANNING = 'planning', 'Planning'
        ACTIVE = 'active', 'Active'
        COMPLETED = 'completed', 'Completed'
        ARCHIVED = 'archived', 'Archived'

    # The owner field links this project to a single User.
    # models.CASCADE means: if a User's account is ever deleted, 
    # all of their projects will be deleted automatically to keep the database clean.
    # related_name='projects' allows us to find all projects of a user using: user.projects.all()
    owner = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='projects',
        verbose_name="Project Owner"
    )

    # The title of the project (e.g., "Client Website Redesign").
    # CharField is perfect for short pieces of text. We set a limit of 255 characters.
    title = models.CharField(
        max_length=255, 
        verbose_name="Project Title"
    )

    # Detailed notes or description about what the project is about.
    # TextField is designed for long paragraphs. We set blank=True so that
    # the user can leave this field empty if they don't have a description yet.
    description = models.TextField(
        blank=True, 
        default='', 
        verbose_name="Project Description"
    )

    # The current state of the project.
    # We restrict the values to our choices defined in StatusChoices.
    # The default status when a user creates a new project is 'planning'.
    status = models.CharField(
        max_length=20, 
        choices=StatusChoices.choices, 
        default=StatusChoices.PLANNING,
        verbose_name="Project Status"
    )

    # An optional date by which the project should be completed.
    # null=True lets the database store a blank (NULL) value if no date is picked.
    # blank=True lets forms and validation allow a blank field during submission.
    due_date = models.DateField(
        null=True, 
        blank=True, 
        verbose_name="Due Date"
    )

    # A timestamp recording exactly when the project row was created in the database.
    # auto_now_add=True handles this automatically behind the scenes when the project is first saved.
    created_at = models.DateTimeField(
        auto_now_add=True, 
        verbose_name="Created At"
    )

    # A timestamp that updates automatically every single time this project is saved or modified.
    # auto_now=True handles updating this timestamp automatically.
    updated_at = models.DateTimeField(
        auto_now=True, 
        verbose_name="Last Updated At"
    )

    def __str__(self):
        """
        This magic method controls how a Project is printed in text form.
        When Django displays the project in the admin panel, it will show the title.
        """
        # Return the project title for clean readability in terminal/admin panel.
        return self.title


class Task(models.Model):
    """
    TASK MODEL
    
    Analogy:
    Think of a Task like a single sticky note inside a project drawer.
    Each sticky note has a title, description, urgency level (priority),
    and a completion status (todo, doing, done).
    Because the task is linked directly to a parent project,
    and that project belongs to a user, the task is also 100% private to that user!
    """

    class PriorityChoices(models.TextChoices):
        """
        Priority levels represent the urgency of this specific task.
        """
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'

    class StatusChoices(models.TextChoices):
        """
        Status choices show where the task is in its lifecycle.
        """
        TODO = 'todo', 'To Do'
        DOING = 'doing', 'Doing'
        DONE = 'done', 'Done'

    # Connects this task to a specific Project.
    # If the project is deleted, CASCADE will delete all of its tasks too.
    # related_name='tasks' lets us find all tasks of a project using: project.tasks.all()
    project = models.ForeignKey(
        Project, 
        on_delete=models.CASCADE, 
        related_name='tasks',
        verbose_name="Parent Project"
    )

    # The title of the task (e.g., "Design layout logo").
    title = models.CharField(
        max_length=255, 
        verbose_name="Task Title"
    )

    # Extra notes or instructions for completing this specific task.
    description = models.TextField(
        blank=True, 
        default='', 
        verbose_name="Task Description"
    )

    # The urgency level of the task, defaulting to 'medium'.
    priority = models.CharField(
        max_length=10, 
        choices=PriorityChoices.choices, 
        default=PriorityChoices.MEDIUM,
        verbose_name="Priority Level"
    )

    # The progress status of the task, defaulting to 'todo'.
    status = models.CharField(
        max_length=10, 
        choices=StatusChoices.choices, 
        default=StatusChoices.TODO,
        verbose_name="Task Status"
    )

    # Optional target date for task completion.
    due_date = models.DateField(
        null=True, 
        blank=True, 
        verbose_name="Due Date"
    )

    # The exact timestamp when this task was marked as 'done'.
    # We will write view logic later to automatically set this field when status is 'done'!
    completed_at = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="Completed At"
    )

    # Automatically records the creation timestamp when this task is first created.
    created_at = models.DateTimeField(
        auto_now_add=True, 
        verbose_name="Created At"
    )

    # Automatically records when this task was last updated or saved.
    updated_at = models.DateTimeField(
        auto_now=True, 
        verbose_name="Last Updated At"
    )

    def __str__(self):
        """
        Returns the text representation of the task, which is its title.
        """
        # Return the task title for clear identification.
        return self.title
