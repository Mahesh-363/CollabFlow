import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        response.data = {
            'success': False,
            'error': {
                'status_code': response.status_code,
                'message': _get_message(response.data),
                'details': response.data,
            }
        }
    else:
        logger.error(f'Unhandled exception: {exc}', exc_info=True)
        response = Response({'success': False, 'error': {'status_code': 500, 'message': 'Server error.'}}, status=500)
    return response

def _get_message(data):
    if isinstance(data, dict):
        for key in ['detail', 'non_field_errors', 'message']:
            if key in data:
                val = data[key]
                return str(val[0]) if isinstance(val, list) else str(val)
        for key, val in data.items():
            return f"{key}: {val[0]}" if isinstance(val, list) else f"{key}: {val}"
    elif isinstance(data, list):
        return str(data[0]) if data else 'Validation error'
    return str(data)