"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# Import the standard administration module and inclusion routing tools.
from django.contrib import admin
from django.urls import path, include

# Define the central URL routing list for the entire Django server.
urlpatterns = [
    # Route administrative dashboard traffic to Django's native admin site.
    path('admin/', admin.site.urls),

    # Route all API traffic starting with 'api/' to our 'userauths' application urls file.
    path('api/userauths/', include('userauths.urls')),
]

