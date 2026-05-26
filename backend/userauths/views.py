# Import standard APIView and response modules from Django REST Framework.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
# Import standard exceptions from DRF to handle secure error routing.
from rest_framework.exceptions import AuthenticationFailed
# Import Django's cryptographic signing tools.
from django.core.signing import TimestampSigner, SignatureExpired, BadSignature
# Import our custom database models to track token consumption and secure OTPs.
from .models import UsedToken, UserOTP, Profile
# Import python's standard random and datetime modules to generate secure OTP codes and lifespans.
import random
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password

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
from .serializers import RegisterSerializer, LoginSerializer, UserProfileSerializer, PasswordChangeSerializer

# Import the JWT generation tool from SimpleJWT.
from rest_framework_simplejwt.tokens import RefreshToken

# Import our custom AuthAnonRateThrottle to restrict unauthenticated request spams.
from .throttles import AuthAnonRateThrottle

# Define the custom user registration endpoint.
class RegisterView(APIView):
    # Allow any guest/unauthenticated user to access the registration endpoint.
    permission_classes = [AllowAny]
    # Assign our unauthenticated rate throttle limits to register requests.
    throttle_classes = [AuthAnonRateThrottle]

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
    # Assign our unauthenticated rate throttle limits to login requests.
    throttle_classes = [AuthAnonRateThrottle]

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
    # Assign our unauthenticated rate throttle limits to magic link request generators.
    throttle_classes = [AuthAnonRateThrottle]

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


class VerifyMagicLinkView(APIView):
    """
    VERIFY MAGIC LINK VIEW
    
    Analogy:
    Think of this like arriving at our hotel club lobby customs desk holding your
    temporary signature voucher. The customs officer reads the cryptographic stamp
    using their secret verification key. They verify that the stamp is mathematically authentic,
    belongs to a registered active citizen, and has not passed its 15-minute self-destruct limit.
    If everything is green, they file your voucher in the 'consumed' cabinet (the UsedToken database)
    so it can never be used again, and hand you your official room key (JWT cookies) to log you in!
    """
    # Allow any guest/unauthenticated user to verify their token.
    permission_classes = [AllowAny]
    # Assign our unauthenticated rate throttle limits to magic link verifiers.
    throttle_classes = [AuthAnonRateThrottle]

    def post(self, request):
        # 1. Retrieve the token from query parameters or request body payload.
        # This dynamic double-check supports both query strings and JSON payloads.
        token = request.query_params.get('token', '').strip() or request.data.get('token', '').strip()
        if not token:
            return Response({'error': 'Token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Check if this token signature has already been consumed (replay attack protection).
        if UsedToken.objects.filter(token=token).exists():
            return Response({'error': 'This magic link has already been used. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Leverage TimestampSigner to unsign and cryptographically verify the token.
        signer = TimestampSigner()
        try:
            # We enforce a maximum lifespan age of 15 minutes (900 seconds).
            email = signer.unsign(token, max_age=900)
        except SignatureExpired:
            return Response({'error': 'This magic link has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)
        except BadSignature:
            return Response({'error': 'Invalid or corrupted magic link. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        # 4. Find the user in the database.
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'No user account found matching this magic link.'}, status=status.HTTP_404_NOT_FOUND)

        if not user.is_active:
            return Response({'error': 'This account is inactive. Please contact support.'}, status=status.HTTP_400_BAD_REQUEST)

        # 5. Invalidate the token signature immediately by recording it in our UsedToken archive.
        UsedToken.objects.create(token=token)

        # 6. Issue standard SimpleJWT Access and Refresh session credentials.
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        # 7. Package the return payload response.
        response_body = {
            "message": "Authenticated successfully.",
            "access": access_token,
            "refresh": refresh_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name
            }
        }

        response = Response(response_body, status=status.HTTP_200_OK)

        # 8. Nest the refresh token inside a secure, HttpOnly, Lax browser cookie.
        response.set_cookie(
            key='refresh_token',
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite='Lax'
        )

        return response


class RequestOTPView(APIView):
    """
    REQUEST OTP VIEW
    
    Analogy:
    Think of this like asking a bank clerk to send a temporary security code to your phone.
    The clerk checks your ID (email). If you are a registered customer and your account is active,
    the clerk shreds any old, unused sticky notes containing previous codes for safety.
    Then, the clerk generates a fresh, random 6-digit numeric combination, scrambles it (make_password)
    so no one else can read it, saves it with a 5-minute self-destruct timer, and writes it down in the secure ledger.
    During debugging, we write the code clearly to the server console log so you can inspect it!
    """
    # Allow any guest/unauthenticated user to request an OTP code.
    permission_classes = [AllowAny]
    # Assign our unauthenticated rate throttle limits to OTP requests.
    throttle_classes = [AuthAnonRateThrottle]

    def post(self, request):
        # 1. Retrieve the email address from the incoming request payload.
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Check if the user exists and is active.
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'No account found with this email address.'}, status=status.HTTP_404_NOT_FOUND)

        if not user.is_active:
            return Response({'error': 'This account is inactive. Please contact support.'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Automatically purge any pre-existing unused OTP records for this user (Lifecycle Handling).
        UserOTP.objects.filter(user=user).delete()

        # 4. Generate a secure, random 6-digit numeric combination.
        otp_digits = "".join(random.choices("0123456789", k=6))

        # 5. Scramble and hash the code using make_password, then save it with a 5-minute lifespan.
        expires_at = timezone.now() + timedelta(minutes=5)
        hashed_code = make_password(otp_digits)
        UserOTP.objects.create(user=user, code=hashed_code, expires_at=expires_at)

        # 6. Dispatch the beautiful HTML email to the user with the secure passcode.
        try:
            from .emails import send_otp_email
            send_otp_email(
                to_email=email,
                otp_code=otp_digits,
                full_name=user.full_name
            )
        except Exception:
            return Response({'error': 'Failed to send OTP code. Please try again later.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 7. Wire the system to write the generated numeric sequence clearly to the server terminal shell for inspection during debugging.
        print("\n" + "=" * 50)
        print(f"🔥 DEBUG OTP DISPATCH FOR: {user.email}")
        print(f"👉 YOUR SECURE 6-DIGIT CODE IS: {otp_digits}")
        print(f"⏰ EXPIRES AT: {expires_at.strftime('%Y-%m-%d %H:%M:%S')} (5 MINUTES LIFESPAN)")
        print("=" * 50 + "\n")

        # Return a success report payload.
        return Response({'message': '6-digit verification code successfully sent to your email.'}, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    """
    VERIFY OTP VIEW
    
    Analogy:
    Think of this like typing the 6-digit code at the entrance turnstile.
    The gatekeeper checks if you have a registered ticket (email) and asks for the code.
    They read the scrambled code in their secure ledger, decrypt/compare it, and verify that the 5-minute
    self-destruct timer has not expired.
    
    Crucially, we build a consecutive failure tracker: if you guess incorrectly 3 consecutive times,
    we instantly shred your ticket (delete the OTP record), completely locking the pipeline
    and requiring you to request a brand-new code from scratch!
    """
    # Allow any guest/unauthenticated user to verify their OTP.
    permission_classes = [AllowAny]
    # Assign our unauthenticated rate throttle limits to OTP verifications.
    throttle_classes = [AuthAnonRateThrottle]

    def post(self, request):
        # 1. Retrieve the email and code from request payload.
        email = request.data.get('email', '').strip().lower()
        otp_code = request.data.get('otp', '').strip()

        if not email or not otp_code:
            return Response({'error': 'Email address and verification code are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Check if the user exists and is active.
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'No user account found matching this email.'}, status=status.HTTP_404_NOT_FOUND)

        if not user.is_active:
            return Response({'error': 'This account is inactive. Please contact support.'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Retrieve the active OTP record for this user.
        try:
            otp_record = UserOTP.objects.get(user=user)
        except UserOTP.DoesNotExist:
            return Response({'error': 'No active verification session found. Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)

        # 4. Check if the verification code has already expired.
        if timezone.now() > otp_record.expires_at:
            otp_record.delete()
            return Response({'error': 'This verification code has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        # 5. Check if the typed code matches our scrambled code in the database.
        if check_password(otp_code, otp_record.code):
            # Atomic Invalidation: Clean up the OTP record instantly upon successful verification.
            otp_record.delete()

            # Issue standard SimpleJWT session credentials.
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            response_body = {
                "message": "Authenticated successfully.",
                "access": access_token,
                "refresh": refresh_token,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name
                }
            }

            response = Response(response_body, status=status.HTTP_200_OK)

            # Nest the refresh token inside a secure HttpOnly cookie.
            response.set_cookie(
                key='refresh_token',
                value=refresh_token,
                httponly=True,
                secure=True,
                samesite='Lax'
            )

            return response
        else:
            # 6. Consecutive Failure Tracker: Increment attempt counts on incorrect entries.
            otp_record.attempts += 1
            otp_record.save()

            # If the user reaches 3 failed attempts, wipe the session immediately.
            if otp_record.attempts >= 3:
                otp_record.delete()
                return Response({
                    'error': 'Incorrect code entered 3 consecutive times. Your verification session has been locked. Please request a new code.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Otherwise, return an error specifying how many attempts remain.
            attempts_remaining = 3 - otp_record.attempts
            return Response({
                'error': f'Incorrect verification code. You have {attempts_remaining} attempts remaining.'
            }, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    """
    USER PROFILE RETRIEVAL AND UPDATE VIEW
    
    Analogy:
    Think of this view like the clerk's counter at a secure members-only fitness club.
    When a member approaches:
    1. They must show their valid membership card (IsAuthenticated token).
    2. GET: The clerk reads the files in their locker (bio, avatar, full name, email, settings) and reads them back.
    3. PUT/PATCH: The member hands over a sheet of updates. The clerk updates the file.
       If the member's extended info record is somehow missing (e.g. database artifact glitch),
       the clerk smartly creates a blank profile template first, then applies the updates so nothing breaks!
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # Smart check: Ensure a Profile exists before serializing to be extra bulletproof
        Profile.objects.get_or_create(user=user)
        
        serializer = UserProfileSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        user = request.user
        # Smart check: Ensure a Profile exists before updating to satisfy user constraints
        Profile.objects.get_or_create(user=user)
        
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Profile updated successfully.",
                "user": serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        # PATCH is just a shorthand delegation for our partial-supported PUT handler
        return self.put(request)


class PasswordChangeView(APIView):
    """
    SECURE PASSWORD CHANGE VIEW
    
    Analogy:
    Think of this view like a secure banking portal password updater.
    1. The customer presents their active Bearer security token card (IsAuthenticated).
    2. They fill out a form providing their current password, their new chosen password,
       and their confirmation password.
    3. The cashier (the serializer) validates that their current password matches the active
       database hash securely.
    4. If the check succeeds, the cashier hashes the new password using set_password(),
       stores the new hash in the database, and returns a successful response.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        # Pass request inside context so the serializer can access the authenticated user
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            # Update the user's password using the standard set_password hashing routine
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            return Response({
                "message": "Password changed successfully."
            }, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CloudinarySignatureView(APIView):
    """
    CLOUDINARY SIGNATURE GENERATOR VIEW
    
    Analogy:
    Think of this view like a secure ticket-issuing booth at a private museum.
    1. The visitor presents their verified VIP entry card (IsAuthenticated Bearer token).
    2. They request a signed key pass to deposit a package in locker #24 (request.user.id).
    3. The clerk generates a timestamp, sorts the locker details, hashes them using the bank's secret code
       (CLOUDINARY_API_SECRET), and stamps a unique digital seal (signature).
    4. The visitor takes this stamped pass and goes straight to the locker company (Cloudinary)
       to deposit their file, without our central server having to carry the heavy package!
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        import time
        import hashlib
        
        timestamp = int(time.time())
        # Set up parameters to sign according to Cloudinary instructions
        folder_path = f"user_uploads/{request.user.id}"
        
        params_to_sign = {
            'timestamp': timestamp,
            'folder': folder_path,
        }
        
        # Sort parameter keys alphabetically
        sorted_params = sorted(params_to_sign.items())
        
        # Construct key=value query string
        query_string = "&".join(f"{k}={v}" for k, v in sorted_params)
        
        # Append the hidden api_secret directly at the end of the query string
        string_to_sign = f"{query_string}{settings.CLOUDINARY_API_SECRET}"
        
        # Calculate SHA-1 hexadecimal hash digest signature
        signature = hashlib.sha1(string_to_sign.encode('utf-8')).hexdigest()
        
        return Response({
            'signature': signature,
            'timestamp': timestamp,
            'api_key': settings.CLOUDINARY_API_KEY,
            'cloud_name': settings.CLOUDINARY_CLOUD_NAME,
            'folder': folder_path
        }, status=status.HTTP_200_OK)


class DeleteAccountView(APIView):
    """
    GDPR-COMPLIANT ACCOUNT DELETION VIEW

    Analogy:
    Imagine you are a member of an exclusive country club. You walk up to the receptionist
    and request to completely delete your membership folder (GDPR Right to be Forgotten).
    Before taking such a serious and destructive action, the receptionist asks for your physical
    security password to prove you are indeed the actual owner of the folder.

    Once confirmed, the club checks its compliance handbook (Django settings configuration):
    1. HARD DELETE: We grab your entire folder and throw it directly into a roaring paper shredder (user.delete()).
       Every single record is permanently turned to ash and erased from the universe.
    2. SOFT DELETE: If the club is legally required to keep your billing invoices, we can't shred
       the physical folder. Instead, we use white-out to permanently scrub your name, biography,
       and avatar, replace your email with a randomized ID code (so you can never be identified),
       change the password to a random lock we throw away, and mark the card "INACTIVE".
       Your transactions are preserved, but you have been completely forgotten!
    """
    # Force the user to be securely logged in to execute account deletion.
    permission_classes = [IsAuthenticated]

    def post(self, request):
        import uuid  # Import Python's unique ID generator to scramble soft-deleted email fields
        
        # 1. Retrieve the password from the incoming request payload.
        password = request.data.get('password', '').strip()
        
        # 2. Check if a password was provided.
        if not password:
            return Response(
                {"error": "Password confirmation is required to delete your account."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Fetch the currently authenticated user object from the request.
        user = request.user
        
        # 3. Check if the provided password matches the hashed password in our database.
        if not user.check_password(password):
            return Response(
                {"error": "Incorrect password. Account deletion aborted."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # 4. Check our compliance settings to determine the deletion configuration.
        # We check settings.py for ACCOUNT_DELETION_HARD_DELETE, defaulting to False (soft-delete).
        hard_delete = getattr(settings, 'ACCOUNT_DELETION_HARD_DELETE', False)
        
        if hard_delete:
            # 5. HARD DELETE ROUTINE (Irreversible database purge)
            # This deletes the user record from the SQLite database.
            # Because related tables like UserOTP and Profile are linked via models.CASCADE,
            # they are automatically deleted!
            user.delete()
            
            return Response({
                "success": True,
                "message": "Your account and all associated data have been permanently and irreversibly deleted in compliance with GDPR regulations."
            }, status=status.HTTP_200_OK)
            
        else:
            # 6. SOFT DELETE / ANONYMIZATION ROUTINE (GDPR-Compliant Scrubbing)
            # We scrub all personal identifying information (PII) from the User model first.
            user.full_name = "Deleted User"
            
            # Scramble the email using a unique, randomized ID code to prevent uniqueness collisions.
            user.email = f"deleted_{uuid.uuid4().hex[:12]}@staqed.internal"
            
            import secrets  # Import Python's secure random generation module
            
            # Change the password to a randomized string that is discarded, locking the user out forever.
            user.set_password(secrets.token_hex(32))
            
            # Deactivate the user so they can never authenticate or request fresh codes again.
            user.is_active = False
            
            # Commit the scrubbed user model changes to the database.
            user.save()
            
            # 7. Profile Scrubbing
            # If the user has a profile record, we must clean all biographical and visual information.
            profile = getattr(user, 'profile', None)
            if profile:
                profile.bio = ""
                profile.avatar = ""
                profile.email_notification = False
                profile.public_profile = False
                profile.save()
                
            return Response({
                "success": True,
                "message": "Your account has been successfully closed, and all personally identifiable information (PII) has been permanently scrubbed under GDPR compliance rules."
            }, status=status.HTTP_200_OK)





