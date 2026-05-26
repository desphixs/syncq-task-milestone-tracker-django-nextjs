# Import standard APIView and response modules from Django REST Framework.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
# Import standard exceptions from DRF to handle secure error routing.
from rest_framework.exceptions import AuthenticationFailed
# Import Django's cryptographic signing tools.
from django.core.signing import TimestampSigner

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
        
        # Send a welcoming email card to the guest since they are brand new!
        try:
            from .emails import send_welcome_email
            send_welcome_email(to_email=user.email, full_name=user.full_name)
        except Exception:
            # We catch exceptions so that email server failure doesn't block the API registration response.
            pass
        
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

        # Dispatch custom welcome email ONLY if this is a newly provisioned user.
        if created:
            try:
                from .emails import send_welcome_email
                send_welcome_email(to_email=user.email, full_name=user.full_name)
            except Exception:
                # Catching any email failure to prevent login crashes.
                pass

        # Step 7: Issue our site's standard SimpleJWT Refresh and Access tokens to establish their session!
        refresh = RefreshToken.for_user(user)

        # 8. Return the authentic JWT token credentials to the calling frontend callback client.
        return Response({
            'data': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_200_OK)


# Define the custom Google OAuth authentication endpoint.
class GoogleLogin(APIView):
    """
    GOOGLE OAUTH LOGIN HANDSHAKE VIEW
    
    Analogy:
    Think of this view like a border control customs desk for visitors who carry a Google diplomatic passport.
    Instead of forcing the guest to fill out a standard local registration form and create a brand-new local password
    (which would be standard email & password signup), they simply present their Google authorization ticket code
    (the temporary oauth code). The bouncer verifies this ticket directly with Google's central database (token exchange API)
    to confirm the guest's credentials. If Google says they are verified, we get their profile data, match or
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

        # Step 2: Exchange the temporary Google code for a secure Google Access Token.
        # We dispatch a secure, server-to-server POST request to Google's token exchange endpoint.
        token_res = http_requests.post('https://oauth2.googleapis.com/token', data={
            'code': code,
            'client_id': settings.SOCIAL_AUTH['google']['client_id'],
            'client_secret': settings.SOCIAL_AUTH['google']['client_secret'],
            'redirect_uri': 'http://localhost:3000/callback/google', # Must match the client callback path
            'grant_type': 'authorization_code',
        })

        # If Google's server returns a non-200 failure code, report the handshake error.
        if token_res.status_code != 200:
            raise AuthenticationFailed("Failed to exchange authentication code with Google.")

        # Extract the secure access token from Google's JSON response body.
        access_token = token_res.json().get('access_token')
        if not access_token:
            raise AuthenticationFailed("Invalid authorization token returned from Google.")

        # Step 3: Use the Google access token to ask for the user's basic profile details (Name, Email, etc.).
        userinfo_res = http_requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )

        # If we failed to retrieve profile details, raise an AuthenticationFailed error.
        if userinfo_res.status_code != 200:
            raise AuthenticationFailed("Failed to fetch user profile details from Google.")

        # Parse the returned profile JSON data into an active dictionary.
        userinfo = userinfo_res.json()
        email = userinfo.get('email')
        
        # If no email address is returned in the Google profile, raise an authentication error.
        if not email:
            raise AuthenticationFailed("No email address returned from your Google account.")

        # Step 4: Sniff out the full name of the user from Google's profile.
        # We try to get the 'name' field first. If missing, we combine given_name (first) and family_name (last).
        full_name = userinfo.get('name') or f"{userinfo.get('given_name', '')} {userinfo.get('family_name', '')}".strip() or ''

        # Step 5: Log them in or automatically sign them up if they don't have an account yet!
        # We query our custom User model's database tables using objects.get_or_create.
        user, created = User.objects.get_or_create(
            email=email,
            defaults={'full_name': full_name}
        )

        # Dispatch custom welcome email ONLY if this is a newly provisioned user.
        if created:
            try:
                from .emails import send_welcome_email
                send_welcome_email(to_email=user.email, full_name=user.full_name)
            except Exception:
                # Catching any email failure to prevent login crashes.
                pass

        # Step 6: Issue our site's standard SimpleJWT Refresh and Access tokens to establish their session!
        refresh = RefreshToken.for_user(user)

        # 7. Return the authentic JWT token credentials to the calling frontend callback client.
        return Response({
            'data': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_200_OK)


class RequestMagicLinkView(APIView):
    """
    REQUEST MAGIC LINK VIEW
    
    Analogy:
    Think of this view like requesting a temporary, security-stamped VIP guest card
    for our hotel club lobby. Instead of asking you to remember a master key (your password),
    you provide your registered email. The bouncer prints a custom visa voucher containing
    a cryptographic stamp that is bound to your identity and is set to self-destruct (expire)
    after 15 minutes! The voucher is dropped straight into your email inbox.
    """
    # Allow any guest/unauthenticated user to request a magic link.
    permission_classes = [AllowAny]

    def post(self, request):
        # 1. Retrieve the email address from the incoming request payload.
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Check if the user exists and is active.
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # We return a 404 response if the email is not registered in our database.
            return Response({'error': 'No account found with this email address.'}, status=status.HTTP_404_NOT_FOUND)

        if not user.is_active:
            return Response({'error': 'This account is inactive. Please contact support.'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Leverage Django's internal cryptographic signing engine (TimestampSigner) to generate a secure signature.
        # This produces a time-restricted, tamper-proof signature containing the user's email.
        signer = TimestampSigner()
        token = signer.sign(user.email)

        # 4. Construct the full single-use authentication URL targeting our frontend.
        frontend_url = settings.FRONTEND_URL
        magic_link = f"{frontend_url}/auth/magic-link?token={token}"

        # 5. Dispatch the email with the secure hyperlink.
        try:
            from .emails import send_magic_link_email
            send_magic_link_email(
                to_email=email,
                magic_link=magic_link,
                full_name=user.full_name
            )
        except Exception:
            return Response({'error': 'Failed to send magic link. Please try again later.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Return a success report payload to the frontend.
        return Response({'message': 'Magic link sent! Check your inbox.'}, status=status.HTTP_200_OK)


