from django.shortcuts import render
from django.http import Http404

# Import REST framework core tools for writing Class-Based API Views.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

# Import our Project and Task models and their corresponding serializer translators.
from .models import Project, Task
from .serializers import ProjectSerializer, ProjectDetailSerializer, TaskSerializer
from django.utils import timezone
import datetime

class ProjectListCreateAPIView(APIView):
    """
    PROJECT LIST & CREATE API VIEW
    
    Analogy:
    Think of this view like a custom bank vault manager.
    - When a customer wants a list of their boxes (GET), the manager goes to the vault,
      filters and retrieves ONLY the boxes matching the customer's credentials, and returns them.
      The customer can never see anyone else's safety boxes!
    - When a customer wants to deposit a new box (POST), the manager accepts it,
      validates the package dimensions, and writes the customer's permanent signature 
      directly onto the ownership card, ignoring any fake labels the customer tries to attach.
    """
    
    # We require the client request to be authenticated with a valid token.
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Handles retrieving all projects belonging to the logged-in user.
        """
        # Step 1: Query the database for projects owned ONLY by the logged-in user.
        # This ensures strict data isolation so users can't see other users' files!
        user_projects = Project.objects.filter(owner=request.user)
        
        # Step 2: Pass the database projects to the serializer.
        # we set many=True because user_projects is a list (QuerySet) of multiple objects.
        serializer = ProjectSerializer(user_projects, many=True)
        
        # Step 3: Return the translated JSON data to the browser with a 200 OK status.
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Handles creating a brand-new project securely linked to the logged-in user.
        """
        # Step 1: Instantiate the serializer translator using the incoming JSON payload data.
        serializer = ProjectSerializer(data=request.data)
        
        # Step 2: Validate the incoming data against the constraints specified in the model fields.
        # If any validation rules fail, this will automatically raise a 400 Bad Request error.
        serializer.is_valid(raise_exception=True)
        
        # Step 3: Explicitly save the project to the database, passing owner=request.user.
        # This forces the backend to assign the currently authenticated user as the project owner,
        # completely ignoring any fake owner IDs passed in by a malicious client request!
        serializer.save(owner=request.user)
        
        # Step 4: Return the created project data as JSON with a 201 Created status code.
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProjectDetailAPIView(APIView):
    """
    PROJECT DETAIL, UPDATE & DELETE API VIEW
    
    Analogy:
    Think of this view like a security guard managing access to a single drawer.
    If a visitor wants to inspect (GET), modify (PUT), or shred (DELETE) a drawer,
    the guard must first verify: "Does this drawer exist, AND is this visitor its registered owner?"
    If it is someone else's drawer, the guard says: "Drawer not found!" 
    This prevents nosey visitors from even knowing other drawers exist.
    """
    
    # Require authentication to access single project endpoints.
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        """
        A secure helper method to retrieve a specific project while verifying ownership.
        """
        try:
            # We query the Project by its primary key AND verify that the owner is the logged-in user.
            # This is the gold standard of API security: manual data isolation at the database query level!
            return Project.objects.get(pk=pk, owner=user)
        except Project.DoesNotExist:
            # If no project matches, we raise a standard Http404 exception.
            # The custom exception handler catches this and returns a secure 404 Not Found response.
            raise Http404("Project not found, or you do not have permission to access it.")

    def get(self, request, pk):
        """
        Handles retrieving the details of a single project owned by the user.
        """
        # Step 1: Securely fetch the project using our helper method.
        # This is a critical security step! If a user tries to access a project
        # ID that belongs to someone else, this method will raise an Http404 exception
        # and immediately stop execution before calculating any database statistics or
        # exposing private information. Absolute data isolation is guaranteed!
        project = self.get_object(pk, request.user)
        
        # Step 2: Translate the single database record into clean JSON data using the detail serializer.
        # ProjectDetailSerializer computes total tasks, completed tasks, and completion percentage!
        serializer = ProjectDetailSerializer(project)
        
        # Step 3: Return the JSON representation to the client.
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        """
        Handles updating project details (e.g. changing title, description, or status).
        """
        # Step 1: Securely fetch the project, verifying ownership first.
        project = self.get_object(pk, request.user)
        
        # Step 2: Instantiate the serializer with the project object and the new data.
        # We specify partial=True so the frontend can choose to edit only a single field
        # (like just the status) without having to submit all fields every single time!
        serializer = ProjectSerializer(project, data=request.data, partial=True)
        
        # Step 3: Validate the updated fields.
        serializer.is_valid(raise_exception=True)
        
        # Step 4: Save the changes directly to the database.
        serializer.save()
        
        # Step 5: Return the newly updated project details to the client.
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        """
        Handles deleting a project and all of its cascade-dependent tasks securely.
        """
        # Step 1: Securely fetch the project, verifying ownership.
        project = self.get_object(pk, request.user)
        
        # Step 2: Call the delete method on the database object.
        # Due to models.CASCADE configuration on our relational ForeignKey keys,
        # this will automatically clean up and delete all associated tasks, keeping the database tidy!
        project.delete()
        
        # Step 3: Return a standard 204 No Content response confirming successful deletion.
        return Response(
            {"detail": "Project and all associated tasks successfully deleted."},
            status=status.HTTP_204_NO_CONTENT
        )


class TaskListCreateAPIView(APIView):
    """
    TASK LIST & CREATE API VIEW
    
    Analogy:
    Think of this like an office inbox. 
    - When someone wants to see all tasks for a project (GET), the system first checks 
      who owns the project. If it's your project, you get the list of tasks.
    - When you drop a new task in the inbox (POST), the system ensures you're placing 
      it into a project folder that you actually own. If you try slipping it into 
      someone else's folder, the system rejects it!
    """
    
    # We require the client request to be authenticated with a valid token.
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Handles retrieving all tasks for a specific project owned by the user.
        """
        # Step 1: Grab the project_id from the query parameters (e.g., ?project_id=1).
        project_id = request.query_params.get('project_id')
        
        # Step 2: Validate that a project_id was actually provided.
        if not project_id:
            return Response(
                {"error": "You must provide a project_id query parameter."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Step 3: Look up the project and verify the logged-in user owns it.
        try:
            # We filter by both id and owner. If it doesn't match both, it throws an error!
            project = Project.objects.get(id=project_id, owner=request.user)
        except Project.DoesNotExist:
            return Response(
                {"error": "Project not found, or you do not have permission to access it."},
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Step 4: Fetch all tasks belonging to this validated project.
        tasks = Task.objects.filter(project=project)
        
        # Step 5: Serialize the multiple task objects into a neat JSON list.
        serializer = TaskSerializer(tasks, many=True)
        
        # Step 6: Return the JSON list back to the browser!
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Handles creating a new task and assigning it to an owned project.
        """
        # Step 1: Feed the incoming JSON data to our TaskSerializer.
        serializer = TaskSerializer(data=request.data)
        
        # Step 2: Ensure the data is valid based on our model fields.
        serializer.is_valid(raise_exception=True)
        
        # Step 3: Extract the project from the validated data.
        # The serializer stores the actual Project instance inside validated_data.
        project = serializer.validated_data.get('project')
        
        # Step 4: Security check! Does the logged-in user actually own this project?
        if project.owner != request.user:
            return Response(
                {"error": "You cannot add a task to a project you do not own."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Step 5: Everything is secure. Save the task to the database!
        serializer.save()
        
        # Step 6: Return the new task details back to the client.
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TaskDetailAPIView(APIView):
    """
    TASK DETAIL, UPDATE & DELETE API VIEW
    
    Analogy:
    Think of this view as a personal secretary for a specific task.
    When you want to view, update, or delete a task, the secretary first 
    checks which project this task belongs to, and then verifies if YOU 
    are the owner of that project. If not, the secretary tells you to leave!
    """
    
    # We require authentication so we know exactly who is making the request.
    permission_classes = [IsAuthenticated]

    def get_task(self, pk, user):
        """
        A secure helper method to retrieve a specific task while verifying 
        that its parent project belongs to the logged-in user.
        """
        try:
            # We find the task by its ID.
            task = Task.objects.get(pk=pk)
            
            # Critical Security Check: We verify that the owner of the task's project
            # matches the currently logged-in user!
            if task.project.owner != user:
                # If they don't match, we raise a 404 error just like if it didn't exist.
                raise Http404("Task not found or permission denied.")
                
            return task
        except Task.DoesNotExist:
            raise Http404("Task not found.")

    def get(self, request, pk):
        """
        Retrieves the details of a specific task securely.
        """
        # Step 1: Securely fetch the task using our helper method.
        task = self.get_task(pk, request.user)
        
        # Step 2: Translate the task object into a JSON dictionary.
        serializer = TaskSerializer(task)
        
        # Step 3: Send the JSON data back to the client.
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        """
        Updates a task and automatically handles the completed_at timestamp.
        """
        # Step 1: Securely fetch the task.
        task = self.get_task(pk, request.user)
        
        # Step 2: Prepare the serializer with the existing task and the new incoming data.
        serializer = TaskSerializer(task, data=request.data, partial=True)
        
        # Step 3: Validate the data.
        serializer.is_valid(raise_exception=True)
        
        # Step 4: Check if the status is being updated.
        new_status = serializer.validated_data.get('status')
        
        if new_status:
            # If the user is moving the task to 'done' and it wasn't already done:
            if new_status == 'done' and task.status != 'done':
                serializer.save(completed_at=timezone.now())
            # If the user is changing it FROM 'done' to something else:
            elif new_status != 'done' and task.status == 'done':
                serializer.save(completed_at=None)
            else:
                # Otherwise, just save normally without touching the timestamp.
                serializer.save()
        else:
            # If status isn't being updated at all, just save normally.
            serializer.save()
            
        # Step 5: Return the newly updated task JSON to the frontend.
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        """
        Deletes a specific task securely.
        """
        # Step 1: Securely fetch the task using our helper method.
        task = self.get_task(pk, request.user)
        
        # Step 2: Delete the task from the database.
        task.delete()
        
        # Step 3: Return a successful response confirming the deletion.
        return Response(
            {"detail": "Task successfully deleted."},
            status=status.HTTP_204_NO_CONTENT
        )


class AnalyticsAPIView(APIView):
    """
    ANALYTICS API VIEW
    
    Analogy:
    Think of this like a dashboard builder at a command center.
    Instead of asking the user to manually count all their projects, task cards,
    and deadlines, the dashboard builder queries all drawers, counts the active tasks,
    categorizes them by urgency and column status, and highlights any overdue deadlines
    in a single comprehensive report package (JSON dictionary).
    """
    
    # We require the client request to be authenticated with a valid token.
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Handles aggregating and calculating task and project metrics for the logged-in user.
        """
        # Step 1: Count total projects owned by the currently authenticated user.
        total_projects = request.user.projects.count()
        
        # Step 2: Query the Task model to fetch all tasks belonging to the user's projects.
        # We perform a relational filter: `project__owner=request.user`.
        user_tasks = Task.objects.filter(project__owner=request.user)
        
        # Step 3: Count total tasks across all projects owned by the user.
        total_tasks = user_tasks.count()
        
        # Step 4: Calculate status breakdown (To Do, Doing, Done).
        # Individual counts are extremely easy to read, debug, and learn for beginners.
        todo_count = user_tasks.filter(status='todo').count()
        doing_count = user_tasks.filter(status='doing').count()
        done_count = user_tasks.filter(status='done').count()
        
        # Step 5: Calculate priority breakdown (Low, Medium, High).
        low_priority_count = user_tasks.filter(priority='low').count()
        medium_priority_count = user_tasks.filter(priority='medium').count()
        high_priority_count = user_tasks.filter(priority='high').count()
        
        # Step 6: Define date boundaries using Python's standard datetime/timezone utilities.
        # Since due_date is a DateField, we compare it against a date object.
        today = timezone.now().date()
        next_week = today + datetime.timedelta(days=7)
        
        # Step 7: Calculate overdue tasks.
        # Overdue tasks are incomplete (status is not 'done') AND their due_date is strictly in the past.
        # We check for not NULL due_date because a task with no due date cannot be overdue.
        overdue_count = user_tasks.filter(
            due_date__lt=today
        ).exclude(
            status='done'
        ).count()
        
        # Step 8: Calculate tasks due within the next 7 days.
        # We filter tasks that are incomplete (not 'done') AND due between today and 7 days from now (inclusive).
        due_next_7_days_count = user_tasks.filter(
            due_date__range=[today, next_week]
        ).exclude(
            status='done'
        ).count()
        
        # Step 8.5: Fetch the actual overdue tasks query list to display in the UI.
        # We use select_related('project') to retrieve project titles in a single SQL join query.
        overdue_tasks_qs = user_tasks.filter(
            due_date__lt=today
        ).exclude(
            status='done'
        ).select_related('project')
        
        # Serialize the task models. Since we want to display the project title in the UI,
        # we dynamically build a list of dictionaries.
        overdue_tasks_list = [
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "priority": t.priority,
                "status": t.status,
                "due_date": t.due_date.strftime("%Y-%m-%d") if t.due_date else None,
                "project_title": t.project.title
            }
            for t in overdue_tasks_qs
        ]

        # Step 9: Bundle all the aggregated metrics into a structured response dictionary.
        analytics_data = {
            "total_projects": total_projects,
            "total_tasks": total_tasks,
            "status_breakdown": {
                "todo": todo_count,
                "doing": doing_count,
                "done": done_count
            },
            "priority_breakdown": {
                "low": low_priority_count,
                "medium": medium_priority_count,
                "high": high_priority_count
            },
            "overdue_tasks": overdue_count,
            "due_next_7_days": due_next_7_days_count,
            "overdue_tasks_list": overdue_tasks_list
        }
        
        # Step 10: Return the packaged metrics to the frontend client with a 200 OK status code.
        return Response(analytics_data, status=status.HTTP_200_OK)


