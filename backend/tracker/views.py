from django.shortcuts import render
from django.http import Http404

# Import REST framework core tools for writing Class-Based API Views.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

# Import our Project model and its corresponding serializer translator.
from .models import Project
from .serializers import ProjectSerializer

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
        project = self.get_object(pk, request.user)
        
        # Step 2: Translate the single database record into clean JSON data.
        serializer = ProjectSerializer(project)
        
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
