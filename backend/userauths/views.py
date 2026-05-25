# Import standard APIView and response modules from Django REST Framework.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
# Import standard exceptions from DRF to handle secure error routing.
from rest_framework.exceptions import AuthenticationFailed

# Import requests as http_requests to manage standard client-side API exchanges.
import requests as http_requests
# Import settings to grab client credentials loaded from environment files.
from django.conf import settings
# Import get_user_model to retrieve our active custom user database tables.
from django.contrib.auth import get_user_model

# Fetch the active custom User database table model.
User = get_user_model()

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


# Define the custom GitHub OAuth authentication endpoint.
class GitHubLogin(APIView):
    """
    GITHUB OAUTH LOGIN HANDSHAKE VIEW
    
    Analogy:
    Think of this view like a border control kiosk for visitors who carry a GitHub diplomatic passport.
    Instead of asking the visitor to fill out a registration form and create a brand-new local password
    (which would be email & password login), they simply present their GitHub ticket code (the temp oauth code).
    The bouncer checks this ticket directly with the GitHub central database (token exchange API) to verify
    the visitor's credentials. If GitHub confirms they are verified, we get their profile data, match or
    create a local user filing card for them in our system, and issue our own site's VIP access tokens!
    """
    
    # Allow any unauthenticated guest user to initialize the social login check.
    permission_classes = [AllowAny]

    def post(self, request):
        # 1. Retrieve the temporary oauth exchange code from the client request payload.
        code = request.data.get('code')
        if not code:
            # If the code is missing from the payload, raise an AuthenticationFailed error.
            raise AuthenticationFailed("Temporary authorization code is required.")

        # Step 2: Exchange the temporary GitHub code for a secure GitHub Access Token.
        # We dispatch a secure, server-to-server POST request to GitHub's token exchange endpoint.
        token_res = http_requests.post('https://github.com/login/oauth/access_token', data={
            'code': code,
            'client_id': settings.SOCIAL_AUTH['github']['client_id'],
            'client_secret': settings.SOCIAL_AUTH['github']['client_secret'],
            'redirect_uri': 'http://localhost:3000/callback/github',
        }, headers={'Accept': 'application/json'}) # GitHub needs this header to send JSON back

        # If GitHub's server returns a non-200 failure code, report the handshake error.
        if token_res.status_code != 200:
            raise AuthenticationFailed("Failed to exchange authentication code with GitHub.")

        # Extract the secure access token from GitHub's JSON response body.
        access_token = token_res.json().get('access_token')
        if not access_token:
            raise AuthenticationFailed("Invalid authorization token returned from GitHub.")

        # Step 3: Fetch the user's basic GitHub profile details (Username, full name, avatar, etc.).
        userinfo_res = http_requests.get(
            'https://api.github.com/user',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        # Step 4: Specifically ask for their email list (since GitHub emails are often kept private).
        email_res = http_requests.get(
            'https://api.github.com/user/emails',
            headers={'Authorization': f'Bearer {access_token}'}
        )

        # If we failed to retrieve profile details, raise an AuthenticationFailed error.
        if userinfo_res.status_code != 200:
            raise AuthenticationFailed("Failed to fetch user profile details from GitHub.")

        # Parse the returned profile JSON data into an active dictionary.
        userinfo = userinfo_res.json()

        # Step 5: Sniff out the primary, verified email address from GitHub's response context.
        email = userinfo.get('email')
        if not email and email_res.status_code == 200:
            emails = email_res.json()
            # Find the specific email marked as 'primary' and 'verified' in their account emails array.
            primary = next((e for e in emails if e.get('primary') and e.get('verified')), None)
            email = primary['email'] if primary else None

        # If no verified primary email address is available, raise a database access error.
        if not email:
            raise AuthenticationFailed("No verified primary email address returned from your GitHub account.")

        # Step 6: Log them in or automatically sign them up if they don't have an account yet!
        # We query our custom User model's database tables using objects.get_or_create.
        full_name = userinfo.get('name') or userinfo.get('login') or ''
        user, created = User.objects.get_or_create(
            email=email,
            defaults={'full_name': full_name}
        )

        # Step 7: Issue our site's standard SimpleJWT Refresh and Access tokens to establish their session!
        refresh = RefreshToken.for_user(user)

        # 8. Return the authentic JWT token credentials to the calling frontend callback client.
        return Response({
            'data': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_200_OK)

