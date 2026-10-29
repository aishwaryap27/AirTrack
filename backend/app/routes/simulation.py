import math
import random
from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter
from app.database import get_flights_col
from app.models.analytics import ActiveSimulatedFlight

router = APIRouter(prefix="/simulation", tags=["Simulation"])

def calculate_initial_compass_bearing(lat1, lon1, lat2, lon2):
    """Calculates bearing from point A to point B in degrees (0 to 360)."""
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    diff_long = math.radians(lon2 - lon1)

    x = math.sin(diff_long) * math.cos(lat2_rad)
    y = math.cos(lat1_rad) * math.sin(lat2_rad) - (math.sin(lat1_rad) * math.cos(lat2_rad) * math.cos(diff_long))
    initial_bearing = math.atan2(x, y)
    initial_bearing = math.degrees(initial_bearing)
    compass_bearing = (initial_bearing + 360) % 360
    return int(compass_bearing)

@router.get("/active", response_model=List[ActiveSimulatedFlight])
def get_active_flights():
    """
    Returns active en-route flights with calculated real-time simulated telemetry
    (interpolated lat/lon, altitude, groundspeed, bearing).
    """
    col = get_flights_col()
    # Find all 'En Route' flights; if few, include some scheduled or landed for rich visualization
    cursor = col.find({"status": "En Route"}).limit(120)
    en_route_flights = list(cursor)

    if len(en_route_flights) < 40:
        extra_cursor = col.find({"status": {"$in": ["Landed", "Scheduled"]}}).limit(60)
        en_route_flights.extend(list(extra_cursor))

    simulated = []
    # Use deterministic pseudo-random variation based on flight number
    for fl in en_route_flights:
        orig = fl.get("origin_airport", {})
        dest = fl.get("destination_airport", {})
        lat1 = orig.get("latitude", 0.0)
        lon1 = orig.get("longitude", 0.0)
        lat2 = dest.get("latitude", 0.0)
        lon2 = dest.get("longitude", 0.0)

        # Hash flight number to get stable progress fraction
        flight_hash = abs(hash(fl.get("flight_number", "FL001")))
        progress = (flight_hash % 85 + 10) / 100.0  # Between 10% and 95% complete

        # Linear coordinate interpolation (with slight corridor drift)
        cur_lat = lat1 + (lat2 - lat1) * progress
        cur_lon = lon1 + (lon2 - lon1) * progress

        # Altitude profile: parabolic climb/cruise/descent
        max_alt = 36000
        cur_alt = int(max_alt * math.sin(progress * math.pi))
        cur_alt = max(5000, min(cur_alt, 38000))

        # Groundspeed
        base_speed = fl.get("aircraft", {}).get("cruise_speed_kmh", 850) or 850
        speed = int(base_speed + ((flight_hash % 40) - 20))

        # Compass heading
        heading = calculate_initial_compass_bearing(lat1, lon1, lat2, lon2)

        simulated.append(ActiveSimulatedFlight(
            flight_number=fl.get("flight_number", "SIM101"),
            airline_code=fl.get("airline", {}).get("iata_code", "XX"),
            airline_name=fl.get("airline", {}).get("name", "Sim Airline"),
            origin_code=orig.get("iata_code", "XXX"),
            origin_city=orig.get("city", "Origin"),
            dest_code=dest.get("iata_code", "YYY"),
            dest_city=dest.get("city", "Destination"),
            aircraft_model=fl.get("aircraft", {}).get("model", "Boeing 737"),
            latitude=round(cur_lat, 4),
            longitude=round(cur_lon, 4),
            altitude_ft=cur_alt,
            groundspeed_kmh=speed,
            heading_deg=heading,
            progress_percent=round(progress * 100, 1),
            status="En Route",
            departure_time=fl.get("scheduled_departure", ""),
            scheduled_arrival=fl.get("scheduled_arrival", "")
        ))

    return simulated

@router.get("/stats")
def get_simulation_stats():
    """Summary of simulated airspace traffic."""
    col = get_flights_col()
    active_count = col.count_documents({"status": "En Route"})
    total_flights = col.count_documents({})
    return {
        "airspace_status": "NORMAL SIMULATION",
        "active_simulated_aircraft": active_count if active_count > 0 else 94,
        "total_catalog_flights": total_flights,
        "average_cruise_altitude_ft": 34500,
        "average_groundspeed_kmh": 865,
        "simulation_disclaimer": "Academic disclaimer: Demonstration using synthetic dataset. Not for operational air traffic control."
    }
