from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class KPIOverview(BaseModel):
    total_flights: int
    on_time_rate: float
    delayed_rate: float
    cancelled_rate: float
    avg_departure_delay: float
    avg_arrival_delay: float
    total_passengers: int
    total_distance_km: float
    active_flights_count: int

class DelayCauseItem(BaseModel):
    cause: str
    label: str
    total_minutes: int
    avg_minutes: float
    percentage: float

class HourlyDelayItem(BaseModel):
    hour: int
    flight_count: int
    avg_delay_minutes: float

class DayOfWeekDelayItem(BaseModel):
    day_number: int
    day_name: str
    flight_count: int
    avg_delay_minutes: float

class DelayedRouteItem(BaseModel):
    route: str
    origin: str
    destination: str
    flight_count: int
    avg_delay_minutes: float

class DelayAnalyticsResponse(BaseModel):
    causes: List[DelayCauseItem]
    hourly_trends: List[HourlyDelayItem]
    day_of_week_trends: List[DayOfWeekDelayItem]
    top_delayed_routes: List[DelayedRouteItem]

class AirportTrafficItem(BaseModel):
    iata_code: str
    name: str
    city: str
    country: str
    departures: int
    arrivals: int
    total_movements: int

class PopularRouteItem(BaseModel):
    route: str
    origin: str
    destination: str
    flight_count: int
    avg_duration_minutes: float
    distance_km: float

class AirportTrafficResponse(BaseModel):
    busiest_airports: List[AirportTrafficItem]
    popular_routes: List[PopularRouteItem]

class StatusDistributionItem(BaseModel):
    status: str
    count: int
    percentage: float

class MonthlyTrendItem(BaseModel):
    month: str # YYYY-MM
    flight_count: int
    avg_delay_minutes: float
    total_passengers: int

class ActiveSimulatedFlight(BaseModel):
    flight_number: str
    airline_code: str
    airline_name: str
    origin_code: str
    origin_city: str
    dest_code: str
    dest_city: str
    aircraft_model: str
    latitude: float
    longitude: float
    altitude_ft: int
    groundspeed_kmh: int
    heading_deg: int
    progress_percent: float
    status: str
    departure_time: str
    scheduled_arrival: str
