from django.urls import path
# Import our Project and Task listing and detail API views from the local views file.
from .views import (
    ProjectListCreateAPIView, 
    ProjectDetailAPIView,
    TaskListCreateAPIView,
    TaskDetailAPIView,
    AnalyticsAPIView
)
# Define the url patterns that are handled inside our tracker application.
# Analogy:
# Think of this list like a phone switchboard.
# When a client requests a specific telephone extension (path string),
# the switchboard maps it and instantly routes the call to the correct operator view class!
urlpatterns = [
    # Extension for listing and creating projects: matches 'projects/'
    # as_view() is necessary because our views are Class-Based (inheriting from APIView).
    path(
        'projects/', 
        ProjectListCreateAPIView.as_view(), 
        name='project-list-create'
    ),
    
    # Extension for viewing, updating, or deleting a single project: matches 'projects/<int:pk>/'
    # <int:pk> is a converter that matches any integer primary key, passing it to the view as 'pk'.
    path(
        'projects/<int:pk>/', 
        ProjectDetailAPIView.as_view(), 
        name='project-detail'
    ),
    
    # Extension for listing and creating tasks: matches 'tasks/'
    path(
        'tasks/',
        TaskListCreateAPIView.as_view(),
        name='task-list-create'
    ),
    
    # Extension for viewing, updating, or deleting a single task: matches 'tasks/<int:pk>/'
    path(
        'tasks/<int:pk>/',
        TaskDetailAPIView.as_view(),
        name='task-detail'
    ),

    # Extension for retrieving overall project analytics metrics: matches 'analytics/'
    path(
        'analytics/',
        AnalyticsAPIView.as_view(),
        name='project-analytics'
    ),
]

