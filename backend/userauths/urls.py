# Import Django's URL routing functions.
from django.urls import path

# Import our custom Views to hook them up to URL paths.
from .views import RegisterView, LoginView, GitHubLogin, GoogleLogin, RequestMagicLinkView, VerifyMagicLinkView

# Define the local URL patterns list for the userauths application.
urlpatterns = [
    # 1. Map the 'register/' path to our RegisterView class.
    # as_view() is called because Django's URL router expects a standard function callback
    # rather than a class, so as_view() acts as the bridge for class-based views.
    path('register/', RegisterView.as_view(), name='register'),

    # 2. Map the 'login/' path to our LoginView class.
    path('login/', LoginView.as_view(), name='login'),

    # 3. Map the 'github/' path to our GitHubLogin social authentication class.
    path('github/', GitHubLogin.as_view(), name='github_login'),

    # 4. Map the 'google/' path to our GoogleLogin social authentication class.
    path('google/', GoogleLogin.as_view(), name='google_login'),

    # 5. Map the 'magic-link/request/' path to our RequestMagicLinkView class.
    path('magic-link/request/', RequestMagicLinkView.as_view(), name='request_magic_link'),

    # 6. Map the 'magic-link/verify/' path to our VerifyMagicLinkView class.
    path('magic-link/verify/', VerifyMagicLinkView.as_view(), name='verify_magic_link'),
]
