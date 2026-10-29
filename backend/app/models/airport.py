from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class CoordinatesGeoJSON(BaseModel):
    type: str = "Point"
    coordinates: List[float] # [lon, lat]

class AirportBase(BaseModel):
    iata_code: str = Field(..., min_length=3, max_length=4)
    icao_code: Optional[str] = None
    name: str
    city: str
    country: str
    latitude: float
    longitude: float
    timezone: str
    runways: int = Field(default=1, ge=1)
    elevation_ft: int = 0

class AirportCreate(AirportBase):
    pass

class AirportResponse(AirportBase):
    id: Optional[str] = None
    coordinates: Optional[Dict[str, Any]] = None

class AirportTrafficStats(BaseModel):
    iata_code: str
    name: str
    city: str
    total_departures: int
    total_arrivals: int
    total_movements: int
    avg_departure_delay: float
    avg_arrival_delay: float
