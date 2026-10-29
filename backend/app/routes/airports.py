import math
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from app.database import get_airports_col, get_flights_col
from app.utils.serializers import serialize_doc, serialize_docs
from app.models.common import PaginatedResponse
from app.models.airport import AirportResponse, AirportTrafficStats

router = APIRouter(prefix="/airports", tags=["Airports"])

@router.get("", response_model=PaginatedResponse[AirportResponse])
def get_airports(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    country: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    col = get_airports_col()
    query = {}
    if country:
        query["country"] = country
    if search:
        query["$or"] = [
            {"iata_code": {"$regex": search.strip(), "$options": "i"}},
            {"name": {"$regex": search.strip(), "$options": "i"}},
            {"city": {"$regex": search.strip(), "$options": "i"}}
        ]

    total = col.count_documents(query)
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    skip = (page - 1) * page_size

    cursor = col.find(query).sort([("name", 1)]).skip(skip).limit(page_size)
    items = serialize_docs(list(cursor))

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{iata_code}", response_model=AirportResponse)
def get_airport(iata_code: str):
    col = get_airports_col()
    doc = col.find_one({"iata_code": iata_code.upper()})
    if not doc:
        raise HTTPException(status_code=404, detail="Airport not found")
    return serialize_doc(doc)

@router.get("/{iata_code}/traffic", response_model=AirportTrafficStats)
def get_airport_traffic(iata_code: str):
    code = iata_code.upper()
    airports_col = get_airports_col()
    flights_col = get_flights_col()

    airport = airports_col.find_one({"iata_code": code})
    if not airport:
        raise HTTPException(status_code=404, detail="Airport not found")

    dep_pipeline = [
        {"$match": {"origin_airport.iata_code": code}},
        {
            "$group": {
                "_id": None,
                "count": {"$sum": 1},
                "avg_delay": {"$avg": "$departure_delay_minutes"}
            }
        }
    ]
    dep_res = list(flights_col.aggregate(dep_pipeline))
    deps = dep_res[0]["count"] if dep_res else 0
    avg_dep_delay = dep_res[0]["avg_delay"] if dep_res else 0.0

    arr_pipeline = [
        {"$match": {"destination_airport.iata_code": code}},
        {
            "$group": {
                "_id": None,
                "count": {"$sum": 1},
                "avg_delay": {"$avg": "$arrival_delay_minutes"}
            }
        }
    ]
    arr_res = list(flights_col.aggregate(arr_pipeline))
    arrs = arr_res[0]["count"] if arr_res else 0
    avg_arr_delay = arr_res[0]["avg_delay"] if arr_res else 0.0

    return AirportTrafficStats(
        iata_code=code,
        name=airport["name"],
        city=airport["city"],
        total_departures=deps,
        total_arrivals=arrs,
        total_movements=deps + arrs,
        avg_departure_delay=round(avg_dep_delay or 0.0, 1),
        avg_arrival_delay=round(avg_arr_delay or 0.0, 1)
    )
