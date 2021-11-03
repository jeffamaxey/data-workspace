from django.contrib.auth import get_user_model
from django.urls import reverse


def test_impersonate_start(staff_client):
    user = get_user_model().objects.create(
        is_staff=False, is_superuser=False, email='test@test.com'
    )
    response = staff_client.get(reverse("impersonation:start", args=(user.id,)), follow=True)

    assert response.status_code == 200
    assert staff_client.session['impersonated_user'] == user


def test_impersonate_stop(staff_client):
    user = get_user_model().objects.create(
        is_staff=False, is_superuser=False, email='test@test.com'
    )
    staff_client.get(reverse("impersonation:start", args=(user.id,)), follow=True)
    assert staff_client.session['impersonated_user'] == user

    staff_client.get(reverse("impersonation:stop"), follow=True)
    assert 'impersonated_user' not in staff_client.session
