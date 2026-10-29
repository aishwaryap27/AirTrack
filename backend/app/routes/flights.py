import math
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query, status

from app.database import get_flights_col, get_airports_col, get_airlines_col, get_aircraft_col
from app.utils.serializers import serialize_doc, serialize_docs
from app.models.common import PaginatedResponse, MessageResponse
from app.models.flight import FlightResponse, FlightCreate, FlightUpdate

router = APIRouter(prefix="/flights", tags=["Flights"])

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

@router.get("", response_model=PaginatedResponse[FlightResponse])
def get_flights(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Flight status filter"),
    airline: Optional[str] = Query(None, description="Airline IATA code"),
    origin: Optional[str] = Query(None, description="Origin airport IATA code"),
    destination: Optional[str] = Query(None, description="Destination airport IATA code"),
    date_from: Optional[str] = Query(None, description="Scheduled departure >= date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Scheduled departure <= date (YYYY-MM-DD)"),
    min_delay: Optional[int] = Query(None, description="Minimum departure delay in minutes"),
    search: Optional[str] = Query(None, description="Search flight number"),
    sort_by: str = Query("scheduled_departure", description="Sort field"),
    sort_dir: str = Query("desc", pattern="^(asc|desc)$", description="Sort direction")
):
    col = get_flights_col()
    query = {}

    if status and status != "All":
        query["status"] = status
    if airline:
        query["airline.iata_code"] = airline.upper()
    if origin:
        query["origin_airport.iata_code"] = origin.upper()
    if destination:
        query["destination_airport.iata_code"] = destination.upper()
    if min_delay is not None:
        query["departure_delay_minutes"] = {"$gte": min_delay}
    if search:
        query["flight_number"] = {"$regex": search.strip(), "$options": "i"}

    # Date filtering
    if date_from or date_to:
        date_q = {}
        if date_from:
            date_q["$gte"] = f"{date_from}T00:00:00"
        if date_to:
            date_q["$lte"] = f"{date_to}T23:59:59"
        query["scheduled_departure"] = date_q

    # Sorting
    direction = -1 if sort_dir == "desc" else 1
    allowed_sorts = {
        "scheduled_departure": "scheduled_departure",
        "departure_delay_minutes": "departure_delay_minutes",
        "distance_km": "distance_km",
        "passenger_count": "passenger_count",
        "flight_number": "flight_number",
        "status": "status"
    }
    sort_field = allowed_sorts.get(sort_by, "scheduled_departure")

    total = col.count_documents(query)
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    skip = (page - 1) * page_size

    cursor = col.find(query).sort([(sort_field, direction)]).skip(skip).limit(page_size)
    items = serialize_docs(list(cursor))

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{flight_id}", response_model=FlightResponse)
def get_flight(flight_id: str):
    col = get_flights_col()
    doc = None
    if ObjectId.is_valid(flight_id):
        doc = col.find_one({"_id": ObjectId(flight_id)})
    if not doc:
        doc = col.find_one({"flight_number": flight_id.upper()})

    if not doc:
        raise HTTPException(status_code=404, detail="Flight record not found")
    return serialize_doc(doc)

@router.post("", response_model=FlightResponse, status_code=status.HTTP_201_CREATED)
def create_flight(payload: FlightCreate):
    flights_col = get_flights_col()
    airports_col = get_airports_col()
    airlines_col = get_airlines_col()
    aircraft_col = get_aircraft_col()

    # Look up airline
    airline_doc = airlines_col.find_one({"iata_code": payload.airline_code.upper()})
    if not airline_doc:
        raise HTTPException(status_code=400, detail=f"Airline '{payload.airline_code}' does not exist")

    # Look up aircraft
    aircraft_doc = aircraft_col.find_one({"model": payload.aircraft_model})
    if not aircraft_doc:
        # Fallback to default aircraft
        aircraft_doc = aircraft_col.find_one()

    # Look up origin & destination
    origin_doc = airports_col.find_one({"iata_code": payload.origin_code.upper()})
    if not origin_doc:
        raise HTTPException(status_code=400, detail=f"Origin airport '{payload.origin_code}' does not exist")

    dest_doc = airports_col.find_one({"iata_code": payload.destination_code.upper()})
    if not dest_doc:
        raise HTTPException(status_code=400, detail=f"Destination airport '{payload.destination_code}' does not exist")

    if payload.origin_code.upper() == payload.destination_code.upper():
        raise HTTPException(status_code=400, detail="Origin and destination airports must be distinct")

    # Calculate distance and duration
    dist_km = haversine_km(
        origin_doc["latitude"], origin_doc["longitude"],
        dest_doc["latitude"], dest_doc["longitude"]
    )
    speed = aircraft_doc.get("cruise_speed_kmh", 840)
    flight_dur = int((dist_km / speed) * 60) + 30 # +30 min taxi

    # Flight document structure
    doc = {
        "flight_number": payload.flight_number.upper(),
        "airline": {
            "iata_code": airline_doc["iata_code"],
            "name": airline_doc["name"],
            "country": airline_doc["country"],
            "alliance": airline_doc.get("alliance", "None")
        },
        "aircraft": {
            "model": aircraft_doc["model"],
            "manufacturer": aircraft_doc.get("manufacturer", "Boeing"),
            "category": aircraft_doc.get("category", "Narrow-body"),
            "capacity": aircraft_doc.get("seating_capacity", 180)
        },
        "origin_airport": {
            "iata_code": origin_doc["iata_code"],
            "name": origin_doc["name"],
            "city": origin_doc["city"],
            "country": origin_doc["country"],
            "latitude": origin_doc["latitude"],
            "longitude": origin_doc["longitude"],
            "timezone": origin_doc.get("timezone", "UTC")
        },
        "destination_airport": {
            "iata_code": dest_doc["iata_code"],
            "name": dest_doc["name"],
            "city": dest_doc["city"],
            "country": dest_doc["country"],
            "latitude": dest_doc["latitude"],
            "longitude": dest_doc["longitude"],
            "timezone": dest_doc.get("timezone", "UTC")
        },
        "scheduled_departure": payload.scheduled_departure,
        "scheduled_arrival": payload.scheduled_arrival or payload.scheduled_departure,
        "actual_departure": None,
        "actual_arrival": None,
        "status": payload.status,
        "departure_delay_minutes": 0,
        "arrival_delay_minutes": 0,
        "delays": {
            "carrier_delay": 0,
            "weather_delay": 0,
            "nas_delay": 0,
            "security_delay": 0,
            "late_aircraft_delay": 0
        },
        "distance_km": dist_km,
        "flight_duration_minutes": flight_dur,
        "passenger_count": int(aircraft_doc.get("seating_capacity", 180) * 0.85),
        "fuel_burn_kg": round((flight_dur / 60) * aircraft_doc.get("fuel_rate_kg_hr", 2500), 1),
        "terminal": payload.terminal,
        "gate": payload.gate
    }

    result = flights_col.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc

@router.put("/{flight_id}", response_model=FlightResponse)
def update_flight(flight_id: str, payload: FlightUpdate):
    col = get_flights_col()
    if not ObjectId.is_valid(flight_id):
        raise HTTPException(status_code=400, detail="Invalid MongoDB ObjectId")

    update_fields = {}
    if payload.status is not None:
        update_fields["status"] = payload.status
    if payload.departure_delay_minutes is not None:
        update_fields["departure_delay_minutes"] = payload.departure_delay_minutes
    if payload.arrival_delay_minutes is not None:
        update_fields["arrival_delay_minutes"] = payload.arrival_delay_minutes
    if payload.actual_departure is not None:
        update_fields["actual_departure"] = payload.actual_departure
    if payload.actual_arrival is not None:
        update_fields["actual_arrival"] = payload.actual_arrival
    if payload.terminal is not None:
        update_fields["terminal"] = payload.terminal
    if payload.gate is not None:
        update_fields["gate"] = payload.gate

    # Delays breakdown updates
    for field in ["carrier_delay", "weather_delay", "nas_delay", "security_delay", "late_aircraft_delay"]:
        val = getattr(payload, field, None)
        if val is not None:
            update_fields[f"delays.{field}"] = val

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    updated = col.find_one_and_update(
        {"_id": ObjectId(flight_id)},
        {"$set": update_fields},
        return_document=True
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Flight record not found")
    return serialize_doc(updated)

@router.delete("/{flight_id}", response_model=MessageResponse)
def delete_flight(flight_id: str):
    col = get_flights_col()
    if not ObjectId.is_valid(flight_id):
        raise HTTPException(status_code=400, detail="Invalid MongoDB ObjectId")

    res = col.delete_one({"_id": ObjectId(flight_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Flight record not found")
    return MessageResponse(message=f"Flight {flight_id} deleted successfully")
