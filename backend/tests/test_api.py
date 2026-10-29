import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "AirTrack" in data["project"]
    assert data["status"] == "ONLINE"

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["HEALTHY", "DEGRADED"]

def test_admin_status():
    response = client.get("/api/admin/status")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["database_name"] == "AirTrafficDB"

def test_analytics_overview():
    response = client.get("/api/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["total_flights"] > 0
    assert "on_time_rate" in data
    assert "delayed_rate" in data
    assert "total_passengers" in data

def test_analytics_delays():
    response = client.get("/api/analytics/delays")
    assert response.status_code == 200
    data = response.json()
    assert "causes" in data
    assert len(data["causes"]) > 0
    assert "hourly_trends" in data
    assert "day_of_week_trends" in data

def test_analytics_airport_traffic():
    response = client.get("/api/analytics/airport-traffic")
    assert response.status_code == 200
    data = response.json()
    assert "busiest_airports" in data
    assert len(data["busiest_airports"]) > 0
    assert "popular_routes" in data

def test_analytics_airline_performance():
    response = client.get("/api/analytics/airline-performance")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    first = data[0]
    assert "iata_code" in first
    assert "on_time_rate" in first

def test_analytics_status_distribution():
    response = client.get("/api/analytics/status-distribution")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

def test_analytics_monthly_trends():
    response = client.get("/api/analytics/monthly-trends")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_flights_pagination():
    response = client.get("/api/flights?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) == 10
    assert data["total"] >= 50000
    assert data["page"] == 1
    assert data["total_pages"] > 1

def test_get_flights_filters():
    # Filter by airline AA
    response = client.get("/api/flights?airline=AA&page_size=5")
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert item["airline"]["iata_code"] == "AA"

    # Filter by status Landed
    response2 = client.get("/api/flights?status=Landed&page_size=5")
    assert response2.status_code == 200
    data2 = response2.json()
    for item in data2["items"]:
        assert item["status"] == "Landed"

def test_flight_crud_lifecycle():
    # 1. Create a flight
    create_payload = {
        "flight_number": "TEST9999",
        "airline_code": "DL",
        "aircraft_model": "Boeing 737-800",
        "origin_code": "JFK",
        "destination_code": "LAX",
        "scheduled_departure": "2026-11-01T10:00:00",
        "scheduled_arrival": "2026-11-01T13:30:00",
        "status": "Scheduled",
        "terminal": "T4",
        "gate": "B22"
    }
    create_res = client.post("/api/flights", json=create_payload)
    assert create_res.status_code == 201
    created_data = create_res.json()
    flight_id = created_data["id"]
    assert created_data["flight_number"] == "TEST9999"
    assert created_data["origin_airport"]["iata_code"] == "JFK"
    assert created_data["destination_airport"]["iata_code"] == "LAX"

    # 2. Get single flight
    get_res = client.get(f"/api/flights/{flight_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == flight_id

    # 3. Update the flight
    update_payload = {
        "status": "Delayed",
        "departure_delay_minutes": 45,
        "carrier_delay": 45
    }
    update_res = client.put(f"/api/flights/{flight_id}", json=update_payload)
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["status"] == "Delayed"
    assert updated_data["departure_delay_minutes"] == 45
    assert updated_data["delays"]["carrier_delay"] == 45

    # 4. Delete the flight
    del_res = client.delete(f"/api/flights/{flight_id}")
    assert del_res.status_code == 200

    # 5. Verify deleted
    get_after_del = client.get(f"/api/flights/{flight_id}")
    assert get_after_del.status_code == 404

def test_get_airports():
    response = client.get("/api/airports?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 100
    assert len(data["items"]) == 10

def test_get_airport_detail_and_traffic():
    response = client.get("/api/airports/JFK")
    assert response.status_code == 200
    data = response.json()
    assert data["iata_code"] == "JFK"
    assert "John F. Kennedy" in data["name"]

    traffic_res = client.get("/api/airports/JFK/traffic")
    assert traffic_res.status_code == 200
    traffic_data = traffic_res.json()
    assert traffic_data["iata_code"] == "JFK"
    assert traffic_data["total_movements"] > 0

def test_get_airlines():
    response = client.get("/api/airlines")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 50

def test_get_airline_performance():
    response = client.get("/api/airlines/DL")
    assert response.status_code == 200
    data = response.json()
    assert data["iata_code"] == "DL"
    assert "Delta" in data["name"]
    assert data["total_flights"] > 0

def test_simulation_active():
    response = client.get("/api/simulation/active")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    flight = data[0]
    assert "latitude" in flight
    assert "longitude" in flight
    assert "altitude_ft" in flight
    assert "groundspeed_kmh" in flight
    assert "heading_deg" in flight
    assert "progress_percent" in flight

def test_simulation_stats():
    response = client.get("/api/simulation/stats")
    assert response.status_code == 200
    data = response.json()
    assert "active_simulated_aircraft" in data
    assert "disclaimer" in data["simulation_disclaimer"].lower()
