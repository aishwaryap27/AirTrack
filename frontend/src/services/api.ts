import axios from 'axios';
import {
  Flight,
  Airport,
  AirportTrafficStats,
  Airline,
  AirlinePerformanceMetric,
  KPIOverview,
  DelayAnalyticsResponse,
  AirportTrafficResponse,
  StatusDistributionItem,
  MonthlyTrendItem,
  ActiveSimulatedFlight,
  PaginatedResponse,
  SystemStatus
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Analytics
  getKPIOverview: async (): Promise<KPIOverview> => {
    const res = await apiClient.get<KPIOverview>('/analytics/overview');
    return res.data;
  },

  getDelayAnalytics: async (): Promise<DelayAnalyticsResponse> => {
    const res = await apiClient.get<DelayAnalyticsResponse>('/analytics/delays');
    return res.data;
  },

  getAirportTrafficAnalytics: async (): Promise<AirportTrafficResponse> => {
    const res = await apiClient.get<AirportTrafficResponse>('/analytics/airport-traffic');
    return res.data;
  },

  getAirlinePerformance: async (): Promise<AirlinePerformanceMetric[]> => {
    const res = await apiClient.get<AirlinePerformanceMetric[]>('/analytics/airline-performance');
    return res.data;
  },

  getStatusDistribution: async (): Promise<StatusDistributionItem[]> => {
    const res = await apiClient.get<StatusDistributionItem[]>('/analytics/status-distribution');
    return res.data;
  },

  getMonthlyTrends: async (): Promise<MonthlyTrendItem[]> => {
    const res = await apiClient.get<MonthlyTrendItem[]>('/analytics/monthly-trends');
    return res.data;
  },

  // Flights
  getFlights: async (params: {
    page?: number;
    page_size?: number;
    status?: string;
    airline?: string;
    origin?: string;
    destination?: string;
    date_from?: string;
    date_to?: string;
    min_delay?: number;
    search?: string;
    sort_by?: string;
    sort_dir?: string;
  }): Promise<PaginatedResponse<Flight>> => {
    const res = await apiClient.get<PaginatedResponse<Flight>>('/flights', { params });
    return res.data;
  },

  getFlight: async (id: string): Promise<Flight> => {
    const res = await apiClient.get<Flight>(`/flights/${id}`);
    return res.data;
  },

  createFlight: async (payload: {
    flight_number: string;
    airline_code: string;
    aircraft_model: string;
    origin_code: string;
    destination_code: string;
    scheduled_departure: string;
    scheduled_arrival?: string;
    status?: string;
    terminal?: string;
    gate?: string;
  }): Promise<Flight> => {
    const res = await apiClient.post<Flight>('/flights', payload);
    return res.data;
  },

  updateFlight: async (id: string, payload: Partial<Flight>): Promise<Flight> => {
    const res = await apiClient.put<Flight>(`/flights/${id}`, payload);
    return res.data;
  },

  deleteFlight: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/flights/${id}`);
    return res.data;
  },

  // Airports
  getAirports: async (params: {
    page?: number;
    page_size?: number;
    country?: string;
    search?: string;
  }): Promise<PaginatedResponse<Airport>> => {
    const res = await apiClient.get<PaginatedResponse<Airport>>('/airports', { params });
    return res.data;
  },

  getAirport: async (iata_code: string): Promise<Airport> => {
    const res = await apiClient.get<Airport>(`/airports/${iata_code}`);
    return res.data;
  },

  getAirportTraffic: async (iata_code: string): Promise<AirportTrafficStats> => {
    const res = await apiClient.get<AirportTrafficStats>(`/airports/${iata_code}/traffic`);
    return res.data;
  },

  // Airlines
  getAirlines: async (params?: { alliance?: string; search?: string }): Promise<Airline[]> => {
    const res = await apiClient.get<Airline[]>('/airlines', { params });
    return res.data;
  },

  getAirlineDetail: async (iata_code: string): Promise<AirlinePerformanceMetric> => {
    const res = await apiClient.get<AirlinePerformanceMetric>(`/airlines/${iata_code}`);
    return res.data;
  },

  // Simulation
  getActiveSimulationFlights: async (): Promise<ActiveSimulatedFlight[]> => {
    const res = await apiClient.get<ActiveSimulatedFlight[]>('/simulation/active');
    return res.data;
  },

  getSimulationStats: async (): Promise<any> => {
    const res = await apiClient.get('/simulation/stats');
    return res.data;
  },

  // Admin / Database
  getSystemStatus: async (): Promise<SystemStatus> => {
    const res = await apiClient.get<SystemStatus>('/admin/status');
    return res.data;
  },

  reseedDatabase: async (): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/admin/reseed');
    return res.data;
  }
};
