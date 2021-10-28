import json

from cryptography.fernet import Fernet
from django.conf import settings
from notifications_python_client.notifications import NotificationsAPIClient


def generate_token(data):
    fernet = Fernet(settings.FERNET_EMAIL_TOKEN_KEY)

    return fernet.encrypt(json.dumps(data).encode('utf-8'))


def decrypt_token(token):
    fernet = Fernet(settings.FERNET_EMAIL_TOKEN_KEY)

    return json.loads(fernet.decrypt(token).decode('utf-8'))


def send_email(request, template_id, email_address, personalisation=None, reference=None):
    if 'impersonated_user' in request.session:
        pass

    client = NotificationsAPIClient(settings.NOTIFY_API_KEY)

    client.send_email_notification(
        template_id=template_id,
        email_address=email_address,
        personalisation=personalisation,
        reference=reference,
    )
