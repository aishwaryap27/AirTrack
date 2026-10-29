from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from app.database import get_airlines_col, get_flights_col
from app.utils.serializers import serialize_doc, serialize_docs
from app.models.airline import AirlineResponse, AirlinePerformanceMetric

router = APIRouter(prefix="/airlines", tags=["Airlines"])

@router.get("", response_model=List[AirlineResponse])
def get_airlines(
    alliance: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    col = get_airlines_col()
    query = {}
    if alliance and alliance != "All":
        query["alliance"] = alliance
    if search:
        query["$or"] = [
            {"iata_code": {"$regex": search.strip(), "$options": "i"}},
            {"name": {"$regex": search.strip(), "$options": "i"}},
            {"country": {"$regex": search.strip(), "$options": "i"}}
        ]
    cursor = col.find(query).sort([("name", 1)])
    return serialize_docs(list(cursor))

@router.get("/{iata_code}", response_model=AirlinePerformanceMetric)
def get_airline_performance(iata_code: str):
    code = iata_code.upper()
    airlines_col = get_airlines_col()
    flights_col = get_flights_col()

    airline = airlines_col.find_one({"iata_code": code})
    if not airline:
        raise HTTPException(status_code=404, detail="Airline not found")

    pipeline = [
        {"$match": {"airline.iata_code": code}},
        {
            "$group": {
                "_id": None,
                "total": {"$sum": 1},
                "on_time": {
                    "$sum": {
                        "$cond": [
                            {
                                "$and": [
                                    {"$lte": ["$departure_delay_minutes", 15]},
                                    {"$ne": ["$status", "Cancelled"]}
                                ]
                            },
                            1,
                            0
                        ]
                    }
                },
                "delayed": {
                    "$sum": {"$cond": [{"$gt": ["$departure_delay_minutes", 15]}, 1, 0]}
                },
                "cancelled": {
                    "$sum": {"$cond": [{"$eq": ["$status", "Cancelled"]}, 1, 0]}
                },
                "avg_delay": {"$avg": "$departure_delay_minutes"}
            }
        }
    ]
    res = list(flights_col.aggregate(pipeline))
    if not res:
        return AirlinePerformanceMetric(
            iata_code=code,
            name=airline["name"],
            country=airline["country"],
            alliance=airline.get("alliance", "None"),
            fleet_size=airline.get("fleet_size", 0),
            total_flights=0,
            on_time_flights=0,
            delayed_flights=0,
            cancelled_flights=0,
            on_time_rate=0.0,
            cancellation_rate=0.0,
            avg_delay_minutes=0.0
        )

    row = res[0]
    total = row["total"] or 1
    on_time = row["on_time"]
    cancelled = row["cancelled"]
    delayed = row["delayed"]

    return AirlinePerformanceMetric(
        iata_code=code,
        name=airline["name"],
        country=airline["country"],
        alliance=airline.get("alliance", "None"),
        fleet_size=airline.get("fleet_size", 0),
        total_flights=total,
        on_time_flights=on_time,
        delayed_flights=delayed,
        cancelled_flights=cancelled,
        on_time_rate=round((on_time / total) * 100, 2),
        cancellation_rate=round((cancelled / total) * 100, 2),
        avg_delay_minutes=round(row.get("avg_delay", 0.0) or 0.0, 1)
    )
