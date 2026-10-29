from typing import Optional
from pydantic import BaseModel, Field

class AircraftTypeBase(BaseModel):
    model: str
    manufacturer: str
    category: str
    seating_capacity: int = Field(..., ge=10, le=850)
    cruise_speed_kmh: int = Field(..., ge=200, le=1200)
    max_range_km: int = Field(..., ge=500, le=20000)
    engines: int = 2
    fuel_rate_kg_hr: int = 2000

class AircraftTypeResponse(AircraftTypeBase):
    id: Optional[str] = None
