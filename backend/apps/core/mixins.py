# backend/apps/core/mixins.py
from rest_framework.response import Response
from rest_framework import status


class StandardResponseMixin:
    """
    Mixin that wraps all DRF responses in:
    { "success": True, "data": ..., "message": "..." }
    Use this on any APIView or ViewSet.
    """

    def success(self, data=None, message="", status_code=status.HTTP_200_OK):
        return Response(
            {"success": True, "data": data, "message": message},
            status=status_code,
        )

    def error(self, message="", errors=None, status_code=status.HTTP_400_BAD_REQUEST):
        return Response(
            {"success": False, "data": None, "message": message, "errors": errors},
            status=status_code,
        )