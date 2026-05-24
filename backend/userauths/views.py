# Import standard APIView and response modules from Django REST Framework.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
# Import standard exceptions from DRF to handle secure error routing.
from rest_framework.exceptions import AuthenticationFailed

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
        
        # 2. Validate serializer fields. Setting raise_exception=True raises a ValidationError
        # exception which is intercepted and standardized by our custom global exception handler!
        serializer.is_valid(raise_exception=True)
        
        # 3. Save the new User model instance to the database.
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


# Define the custom user login endpoint.
class LoginView(APIView):
    # Allow any guest/unauthenticated user to access the login endpoint.
    permission_classes = [AllowAny]

    # Handle incoming HTTP POST requests for authenticating users.
    def post(self, request):
        # 1. Bind the incoming email and password request data to our LoginSerializer.
        serializer = LoginSerializer(data=request.data)
        
        # 2. Validate fields, raising a ValidationError if parameters are missing or invalid.
        serializer.is_valid(raise_exception=True)
        
        # 3. Extract the validated email and password values.
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        # 4. Use Django's built-in authenticate function to verify credentials in the database.
        user = authenticate(request, email=email, password=password)
        
        # 5. Check if the authentication was successful.
        if user is not None:
            # Check if the user's active status is enabled.
            if not user.is_active:
                # If suspended or inactive, raise an AuthenticationFailed exception.
                raise AuthenticationFailed("This account is inactive. Please contact support.")
            
            # 6. Generate a cryptographically signed JWT Refresh Token for the user.
            refresh = RefreshToken.for_user(user)
            
            # Extract the access token string (the short-term token).
            access_token = str(refresh.access_token)
            # Extract the refresh token string (the long-term token).
            refresh_token = str(refresh)
            
            # 7. Build the JSON response body containing both access and refresh tokens.
            # Returning both allows our secure Next.js Server Actions (which execute privately on the server)
            # to easily read the tokens from the JSON body and manage them in the client's browser cookies!
            response_body = {
                "message": "Login successful.",
                "access": access_token,
                "refresh": refresh_token,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name
                }
            }
            
            # Initialize the DRF Response object with our structured body.
            response = Response(response_body, status=status.HTTP_200_OK)
            
            # 8. Nest the long-term refresh token inside a secure, HttpOnly, SameSite browser cookie.
            # This is a helpful backup for clients who connect directly to Django without a BFF.
            response.set_cookie(
                key='refresh_token',
                value=refresh_token,
                httponly=True,
                secure=True,
                samesite='Lax'
            )
            
            # Return the response containing the JSON body and secure cookie header.
            return response
        
        # 9. If authentication failed, raise an AuthenticationFailed exception to invoke our global handler.
        raise AuthenticationFailed("Invalid email or password. Please try again.")

