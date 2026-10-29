export interface FlightAirlineInfo {
  iata_code: string;
  name: string;
  country?: string;
  alliance?: string;
}

export interface FlightAircraftInfo {
  model: string;
  manufacturer?: string;
  category?: string;
  capacity?: number;
}

export interface FlightAirportInfo {
  iata_code: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface DelayBreakdown {
  carrier_delay: number;
  weather_delay: number;
  nas_delay: number;
  security_delay: number;
  late_aircraft_delay: number;
}

export interface Flight {
  id?: string;
  flight_number: string;
  airline: FlightAirlineInfo;
  aircraft: FlightAircraftInfo;
  origin_airport: FlightAirportInfo;
  destination_airport: FlightAirportInfo;
  scheduled_departure: string;
  scheduled_arrival: string;
  actual_departure?: string | null;
  actual_arrival?: string | null;
  status: 'Landed' | 'Scheduled' | 'Delayed' | 'Cancelled' | 'Diverted' | 'En Route' | string;
  departure_delay_minutes: number;
  arrival_delay_minutes: number;
  delays: DelayBreakdown;
  distance_km: number;
  flight_duration_minutes: number;
  passenger_count: number;
  fuel_burn_kg: number;
  terminal?: string;
  gate?: string;
}

export interface Airport {
  id?: string;
  iata_code: string;
  icao_code?: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  runways: number;
  elevation_ft: number;
}

export interface AirportTrafficStats {
  iata_code: string;
  name: string;
  city: string;
  total_departures: number;
  total_arrivals: number;
  total_movements: number;
  avg_departure_delay: number;
  avg_arrival_delay: number;
}

export interface Airline {
  id?: string;
  iata_code: string;
  icao_code?: string;
  name: string;
  country: string;
  callsign?: string;
  fleet_size: number;
  alliance: string;
  hub_airports: string[];
}

export interface AirlinePerformanceMetric {
  iata_code: string;
  name: string;
  country: string;
  alliance: string;
  fleet_size: number;
  total_flights: number;
  on_time_flights: number;
  delayed_flights: number;
  cancelled_flights: number;
  on_time_rate: number;
  cancellation_rate: number;
  avg_delay_minutes: number;
}

export interface KPIOverview {
  total_flights: number;
  on_time_rate: number;
  delayed_rate: number;
  cancelled_rate: number;
  avg_departure_delay: number;
  avg_arrival_delay: number;
  total_passengers: number;
  total_distance_km: number;
  active_flights_count: number;
}

export interface DelayCauseItem {
  cause: string;
  label: string;
  total_minutes: number;
  avg_minutes: number;
  percentage: number;
}

export interface HourlyDelayItem {
  hour: number;
  flight_count: number;
  avg_delay_minutes: number;
}

export interface DayOfWeekDelayItem {
  day_number: number;
  day_name: string;
  flight_count: number;
  avg_delay_minutes: number;
}

export interface DelayedRouteItem {
  route: string;
  origin: string;
  destination: string;
  flight_count: number;
  avg_delay_minutes: number;
}

export interface DelayAnalyticsResponse {
  causes: DelayCauseItem[];
  hourly_trends: HourlyDelayItem[];
  day_of_week_trends: DayOfWeekDelayItem[];
  top_delayed_routes: DelayedRouteItem[];
}

export interface AirportTrafficItem {
  iata_code: string;
  name: string;
  city: string;
  country: string;
  departures: number;
  arrivals: number;
  total_movements: number;
}

export interface PopularRouteItem {
  route: string;
  origin: string;
  destination: string;
  flight_count: number;
  avg_duration_minutes: number;
  distance_km: number;
}

export interface AirportTrafficResponse {
  busiest_airports: AirportTrafficItem[];
  popular_routes: PopularRouteItem[];
}

export interface StatusDistributionItem {
  status: string;
  count: number;
  percentage: number;
}

export interface MonthlyTrendItem {
  month: string;
  flight_count: number;
  avg_delay_minutes: number;
  total_passengers: number;
}

export interface ActiveSimulatedFlight {
  flight_number: string;
  airline_code: string;
  airline_name: string;
  origin_code: string;
  origin_city: string;
  dest_code: string;
  dest_city: string;
  aircraft_model: string;
  latitude: number;
  longitude: number;
  altitude_ft: number;
  groundspeed_kmh: number;
  heading_deg: number;
  progress_percent: number;
  status: string;
  departure_time: string;
  scheduled_arrival: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SystemStatus {
  status: string;
  database_name: string;
  mongo_uri: string;
  connected: boolean;
  storage_size_mb?: number;
  data_size_mb?: number;
  collections_count?: number;
  total_documents?: number;
  collections?: Array<{
    collection: string;
    document_count: number;
    index_count: number;
    indexes: string[];
  }>;
  error?: string;
  instructions?: string;
}
