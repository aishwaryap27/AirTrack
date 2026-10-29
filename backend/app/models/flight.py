from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class FlightAirlineInfo(BaseModel):
    iata_code: str
    name: str
    country: Optional[str] = None
    alliance: Optional[str] = None

class FlightAircraftInfo(BaseModel):
    model: str
    manufacturer: Optional[str] = None
    category: Optional[str] = None
    capacity: Optional[int] = 180

class FlightAirportInfo(BaseModel):
    iata_code: str
    name: str
    city: str
    country: str
    latitude: float
    longitude: float
    timezone: Optional[str] = None

class DelayBreakdown(BaseModel):
    carrier_delay: int = 0
    weather_delay: int = 0
    nas_delay: int = 0
    security_delay: int = 0
    late_aircraft_delay: int = 0

class FlightBase(BaseModel):
    flight_number: str
    airline: FlightAirlineInfo
    aircraft: FlightAircraftInfo
    origin_airport: FlightAirportInfo
    destination_airport: FlightAirportInfo
    scheduled_departure: str
    scheduled_arrival: str
    actual_departure: Optional[str] = None
    actual_arrival: Optional[str] = None
    status: str = "Scheduled"
    departure_delay_minutes: int = 0
    arrival_delay_minutes: int = 0
    delays: DelayBreakdown = Field(default_factory=DelayBreakdown)
    distance_km: float = 0.0
    flight_duration_minutes: int = 0
    passenger_count: int = 0
    fuel_burn_kg: float = 0.0
    terminal: Optional[str] = "T1"
    gate: Optional[str] = "A1"

class FlightCreate(BaseModel):
    flight_number: str
    airline_code: str
    aircraft_model: str
    origin_code: str
    destination_code: str
    scheduled_departure: str
    scheduled_arrival: Optional[str] = None
    status: str = "Scheduled"
    terminal: Optional[str] = "T1"
    gate: Optional[str] = "A1"

class FlightUpdate(BaseModel):
    status: Optional[str] = None
    departure_delay_minutes: Optional[int] = None
    arrival_delay_minutes: Optional[int] = None
    actual_departure: Optional[str] = None
    actual_arrival: Optional[str] = None
    terminal: Optional[str] = None
    gate: Optional[str] = None
    carrier_delay: Optional[int] = None
    weather_delay: Optional[int] = None
    nas_delay: Optional[int] = None
    security_delay: Optional[int] = None
    late_aircraft_delay: Optional[int] = None

class FlightResponse(FlightBase):
    id: Optional[str] = None
