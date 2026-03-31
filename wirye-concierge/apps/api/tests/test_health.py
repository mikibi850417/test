from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_public_health() -> None:
    response = client.get("/api/v1/public/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
