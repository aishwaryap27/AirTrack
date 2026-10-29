from typing import Optional, List
from pydantic import BaseModel, Field

class AirlineBase(BaseModel):
    iata_code: str = Field(..., min_length=2, max_length=3)
    icao_code: Optional[str] = None
    name: str
    country: str
    callsign: Optional[str] = None
    fleet_size: int = 1
    alliance: str = "None"
    hub_airports: List[str] = []

class AirlineCreate(AirlineBase):
    pass

class AirlineResponse(AirlineBase):
    id: Optional[str] = None

class AirlinePerformanceMetric(BaseModel):
    iata_code: str
    name: str
    country: str
    alliance: str
    fleet_size: int
    total_flights: int
    on_time_flights: int
    delayed_flights: int
    cancelled_flights: int
    on_time_rate: float
    cancellation_rate: float
    avg_delay_minutes: float
