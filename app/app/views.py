import datetime
import json
import re
import secrets
import string

from django.conf import (
    settings,
)
from django.http import (
    HttpResponse,
    HttpResponseBadRequest,
    HttpResponseNotAllowed,
    JsonResponse,
)
import psycopg2
import requests

from app.models import (
    Database,
    Privilage,
)


def healthcheck_view(_):
    return HttpResponse('OK')


def databases_view(request):
    response = \
        HttpResponseNotAllowed(['GET']) if request.method != 'GET' else \
        HttpResponseBadRequest(json.dumps({'detail': 'The Authorization header must be set.'})) if 'HTTP_AUTHORIZATION' not in request.META else \
        _databases(request.META['HTTP_AUTHORIZATION'])

    return response


def _databases(auth):
    me_response = requests.get(settings.AUTHBROKER_URL + 'api/v1/user/me/', headers={
        'Authorization': auth,
    })
    databases_reponse = \
        JsonResponse({'databases': _public_databases() + _private_databases(me_response.json()['email'])}) if me_response.status_code == 200 else \
        HttpResponse(me_response.text, status=me_response.status_code)

    return databases_reponse


def _public_databases():
    return [{
        'id': database.id,
        'memorable_name': database.memorable_name,
        'db_name': settings.DATABASES_DATA[database.memorable_name]['NAME'],
        'db_host': settings.DATABASES_DATA[database.memorable_name]['HOST'],
        'db_port': int(settings.DATABASES_DATA[database.memorable_name]['PORT']),
        'db_user': settings.DATABASES_DATA[database.memorable_name]['USER'],
        'db_password': settings.DATABASES_DATA[database.memorable_name]['PASSWORD'],
    } for database in Database.objects.all().filter(is_public=True).order_by(
        'memorable_name', 'created_date', 'id',
    )]


def _private_databases(email_address):
    password_alphabet = string.ascii_letters + string.digits
    user_alphabet = string.ascii_lowercase + string.digits

    def postgres_user():
        unique_enough = ''.join(secrets.choice(user_alphabet) for i in range(5))
        return 'user_' + re.sub('[^a-z0-9]', '_', email_address.lower()) + '_' + unique_enough

    def postgres_password():
        return ''.join(secrets.choice(password_alphabet) for i in range(64))

    def grant_select_permissions(database, user, password, tables):
        tomorrow = (datetime.date.today() + datetime.timedelta(days=1)).isoformat()
        dsn = f'host={database["HOST"]} port={database["PORT"]} dbname={database["NAME"]} user={database["USER"]} password={database["PASSWORD"]} sslmode=require'
        with \
                psycopg2.connect(dsn) as conn, \
                conn.cursor() as cur:

            cur.execute(f"CREATE USER {user} WITH PASSWORD '{password}' VALID UNTIL '{tomorrow}';")
            cur.execute(f"GRANT CONNECT ON DATABASE {database['NAME']} TO {user};")
            cur.execute(f"GRANT USAGE ON SCHEMA public TO {user};")
            cur.execute(f"GRANT SELECT ON {tables} IN SCHEMA public TO {user};")

    def get_new_credentials(database, tables):
        user = postgres_user()
        password = postgres_password()
        grant_select_permissions(database, user, password, tables)

        return {
            'db_name': database['NAME'],
            'db_host': database['HOST'],
            'db_port': database['PORT'],
            'db_user': user,
            'db_password': password,
        }

    return [{
        'id': privilage.database.id,
        'memorable_name': privilage.database.memorable_name,
        **get_new_credentials(settings.DATABASES_DATA[privilage.database.memorable_name], privilage.tables)
    } for privilage in Privilage.objects.all().filter(
        database__is_public=False,
        user__email=email_address,
    ).order_by(
        'database__memorable_name', 'database__created_date', 'database__id',
    )]


class HttpResponseUnauthorized(HttpResponse):
    status_code = 401
