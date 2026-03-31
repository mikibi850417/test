from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_admin_login_success() -> None:
    response = client.post(
        "/api/v1/admin/auth/login",
        json={"email": "admin@wirye.local", "password": "change_me_admin"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
