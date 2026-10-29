from typing import List, Dict, Any
from fastapi import APIRouter
from app.database import get_database
from app.analytics.aggregations import (
    get_overview_kpis,
    get_delay_analytics,
    get_airport_traffic_analytics,
    get_airline_performance_analytics,
    get_status_distribution,
    get_monthly_trends
)
from app.models.analytics import (
    KPIOverview,
    DelayAnalyticsResponse,
    AirportTrafficResponse,
    StatusDistributionItem,
    MonthlyTrendItem
)
from app.models.airline import AirlinePerformanceMetric

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview", response_model=KPIOverview)
def api_overview():
    db = get_database()
    return get_overview_kpis(db)

@router.get("/delays", response_model=DelayAnalyticsResponse)
def api_delays():
    db = get_database()
    return get_delay_analytics(db)

@router.get("/airport-traffic", response_model=AirportTrafficResponse)
def api_airport_traffic():
    db = get_database()
    return get_airport_traffic_analytics(db)

@router.get("/airline-performance", response_model=List[AirlinePerformanceMetric])
def api_airline_performance():
    db = get_database()
    return get_airline_performance_analytics(db)

@router.get("/status-distribution", response_model=List[StatusDistributionItem])
def api_status_distribution():
    db = get_database()
    return get_status_distribution(db)

@router.get("/monthly-trends", response_model=List[MonthlyTrendItem])
def api_monthly_trends():
    db = get_database()
    return get_monthly_trends(db)
