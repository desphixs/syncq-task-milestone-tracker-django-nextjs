# Import standard APIView and response modules from Django REST Framework.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

# Import Django's native authentication module to verify login credentials.
from django.contrib.auth import authenticate

# Import our custom serializers to clean and validate incoming payloads.
from .serializers import RegisterSerializer, LoginSerializer

# Import the JWT generation tool from SimpleJWT.
from rest_framework_simplejwt.tokens import RefreshToken

# Define the custom user registration endpoint.
class RegisterView(APIView):
    # Allow any guest/unauthenticated user to access the registration endpoint.
    permission_classes = [AllowAny]

    # Handle incoming HTTP POST requests for creating new users.
    def post(self, request):
        # 1. Bind the incoming request data to our RegisterSerializer.
        serializer = RegisterSerializer(data=request.data)
        
        # 2. Check if all the rules (passwords matching, password complexity, unique email) are met.
        if serializer.is_valid():
            # If valid, save the new User model instance to the database.
            user = serializer.save()
            
            # Create a success payload to return to the frontend client.
            success_payload = {
                "message": "User registered successfully.",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name
                }
            }
            # Return the success payload with a 201 Created HTTP status.
            return Response(success_payload, status=status.HTTP_201_CREATED)
        
        # 3. If validation failed, return the specific errors with a 400 Bad Request HTTP status.
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Define the custom user login endpoint.
class LoginView(APIView):
    # Allow any guest/unauthenticated user to access the login endpoint.
    permission_classes = [AllowAny]

    # Handle incoming HTTP POST requests for authenticating users.
    def post(self, request):
        # 1. Bind the incoming email and password request data to our LoginSerializer.
        serializer = LoginSerializer(data=request.data)
        
        # 2. Validate that the email and password are provided and well-formed.
        if not serializer.is_valid():
            # If parameters are missing or malformed, return the errors with a 400 Bad Request status.
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # 3. Extract the validated email and password values.
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        # 4. Use Django's built-in authenticate function to verify credentials in the database.
        # This will compare the submitted password against the stored secure PBKDF2 hash.
        user = authenticate(request, email=email, password=password)
        
        # 5. Check if the authentication was successful.
        if user is not None:
            # Check if the user's active status is enabled.
            if not user.is_active:
                # If suspended or inactive, return a 403 Forbidden response.
                return Response(
                    {"detail": "This account is inactive. Please contact support."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # 6. Generate a cryptographically signed JWT Refresh Token for the user.
            refresh = RefreshToken.for_user(user)
            
            # Extract the access token string (the short-term token).
            access_token = str(refresh.access_token)
            # Extract the refresh token string (the long-term token).
            refresh_token = str(refresh)
            
            # 7. Build the JSON response body containing only the short-term access token.
            response_body = {
                "message": "Login successful.",
                "access": access_token,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name
                }
            }
            
            # Initialize the DRF Response object.
            response = Response(response_body, status=status.HTTP_200_OK)
            
            # 8. Nest the long-term refresh token inside a secure, HttpOnly, SameSite browser cookie.
            # - key='refresh_token': The name of the cookie stored by the browser.
            # - value=refresh_token: The signed JWT refresh token string.
            # - httponly=True: Prevents JavaScript scripts from accessing the cookie, blocking XSS theft!
            # - secure=True: Forces the browser to only transmit this cookie over encrypted HTTPS channels.
            # - samesite='Lax': Mitigates CSRF (Cross-Site Request Forgery) attacks by restricting cookie sharing.
            response.set_cookie(
                key='refresh_token',
                value=refresh_token,
                httponly=True,
                secure=True,
                samesite='Lax'
            )
            
            # Return the response containing the JSON body and secure cookie header.
            return response
        
        # 9. If authentication failed, return a 401 Unauthorized response with a descriptive error message.
        return Response(
            {"detail": "Invalid email or password. Please try again."},
            status=status.HTTP_401_UNAUTHORIZED
        )
