# Import the default exception handler from Django REST Framework to use as our base.
from rest_framework.views import exception_handler
# Import standard Response and status modules to return structured error responses.
from rest_framework.response import Response
from rest_framework import status

# Define our custom global exception handler function.
def custom_exception_handler(exc, context):
    # 1. Call DRF's native exception handler first to see if it is a built-in REST exception.
    # If the exception is a known DRF exception (ValidationError, PermissionDenied, NotFound, etc.),
    # DRF returns a Response object. If it is a generic Python/Django error, DRF returns None.
    response = exception_handler(exc, context)

    # 2. Handle built-in Django REST Framework exceptions.
    if response is not None:
        # Initialize an empty list to compile clean, user-friendly error messages.
        error_messages = []
        
        # Verify if the raw DRF error payload is structured as a dictionary.
        if isinstance(response.data, dict):
            # Iterate through the dictionary fields and their corresponding list of error details.
            for field, details in response.data.items():
                # If the key is 'detail' (used for general errors like AuthenticationFailed),
                # we do not want to prefix the final message with the key name 'detail'.
                if field == 'detail':
                    # Check if the details is a list of error strings.
                    if isinstance(details, list):
                        # Join all lists into a single space-separated string.
                        error_messages.append(" ".join([str(detail) for detail in details]))
                    else:
                        # Append the single error details string.
                        error_messages.append(str(details))
                else:
                    # For field-specific validation errors (e.g., 'email': ['This field is required']),
                    # we format them clearly as "field: error message" to keep them highly readable.
                    if isinstance(details, list):
                        # Join list messages with spaces.
                        joined_details = " ".join([str(detail) for detail in details])
                        error_messages.append(f"{field}: {joined_details}")
                    elif isinstance(details, dict):
                        # Handle nested dictionaries if any nested fields exist.
                        nested_details = [f"{k}: {v}" for k, v in details.items()]
                        error_messages.append(f"{field}: {' '.join(nested_details)}")
                    else:
                        # Append the value directly.
                        error_messages.append(f"{field}: {details}")
            
            # Combine all error messages from the list into a single actionable text string.
            final_message = " ".join(error_messages)
        # Check if the raw DRF error payload is structured as a list of strings instead of a dict.
        elif isinstance(response.data, list):
            # Join all elements in the list with a space.
            final_message = " ".join([str(item) for item in response.data])
        else:
            # Fall back to converting the entire error payload directly to a string representation.
            final_message = str(response.data)
        
        # Override the default response data with our unified standard JSON structure.
        # - status: Fixed value of "error".
        # - data: Fixed value of None to maintain format compatibility.
        # - message: The compiled, clean, human-readable actionable error message.
        response.data = {
            "status": "error",
            "data": None,
            "message": final_message
        }
    
    # 3. Handle generic Python/Django system exceptions (e.g., Database conflicts, Attribute errors).
    else:
        # Extract the raw exception message as the base description.
        raw_error_message = str(exc)
        
        # Instantiate a custom DRF Response wrapping the unhandled exception context in our format.
        # We assign an HTTP 500 Internal Server Error status code.
        response = Response(
            {
                "status": "error",
                "data": None,
                "message": f"An unexpected server error occurred: {raw_error_message}"
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
    # Return the standardized response object.
    return response
