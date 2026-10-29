"""
AirTrack — MongoDB Big Data Analytics & Aggregation Pipelines
Implements multi-stage aggregation pipelines for aviation performance metrics.
"""

from typing import Dict, Any, List

def get_overview_kpis(db) -> Dict[str, Any]:
    """Calculate overall airspace KPIs via a single high-efficiency aggregation pipeline."""
    pipeline = [
        {
            "$group": {
                "_id": None,
                "total_flights": {"$sum": 1},
                "on_time_count": {
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
                "delayed_count": {
                    "$sum": {
                        "$cond": [{"$gt": ["$departure_delay_minutes", 15]}, 1, 0]
                    }
                },
                "cancelled_count": {
                    "$sum": {
                        "$cond": [{"$eq": ["$status", "Cancelled"]}, 1, 0]
                    }
                },
                "en_route_count": {
                    "$sum": {
                        "$cond": [{"$eq": ["$status", "En Route"]}, 1, 0]
                    }
                },
                "avg_dep_delay": {"$avg": "$departure_delay_minutes"},
                "avg_arr_delay": {"$avg": "$arrival_delay_minutes"},
                "total_passengers": {"$sum": "$passenger_count"},
                "total_distance": {"$sum": "$distance_km"}
            }
        }
    ]

    res = list(db.flights.aggregate(pipeline))
    if not res:
        return {
            "total_flights": 0,
            "on_time_rate": 0.0,
            "delayed_rate": 0.0,
            "cancelled_rate": 0.0,
            "avg_departure_delay": 0.0,
            "avg_arrival_delay": 0.0,
            "total_passengers": 0,
            "total_distance_km": 0.0,
            "active_flights_count": 0
        }

    row = res[0]
    total = row.get("total_flights", 1) or 1
    on_time_rate = round((row.get("on_time_count", 0) / total) * 100, 2)
    delayed_rate = round((row.get("delayed_count", 0) / total) * 100, 2)
    cancelled_rate = round((row.get("cancelled_count", 0) / total) * 100, 2)

    return {
        "total_flights": total,
        "on_time_rate": on_time_rate,
        "delayed_rate": delayed_rate,
        "cancelled_rate": cancelled_rate,
        "avg_departure_delay": round(row.get("avg_dep_delay", 0.0) or 0.0, 2),
        "avg_arrival_delay": round(row.get("avg_arr_delay", 0.0) or 0.0, 2),
        "total_passengers": int(row.get("total_passengers", 0)),
        "total_distance_km": round(row.get("total_distance", 0.0), 1),
        "active_flights_count": int(row.get("en_route_count", 0))
    }

def get_delay_analytics(db) -> Dict[str, Any]:
    """Analyze delay causes, hourly and day-of-week trends, and top delayed routes."""
    # 1. Delay causes aggregation
    causes_pipeline = [
        {
            "$group": {
                "_id": None,
                "carrier": {"$sum": "$delays.carrier_delay"},
                "weather": {"$sum": "$delays.weather_delay"},
                "nas": {"$sum": "$delays.nas_delay"},
                "security": {"$sum": "$delays.security_delay"},
                "late_aircraft": {"$sum": "$delays.late_aircraft_delay"},
                "delayed_flight_count": {
                    "$sum": {"$cond": [{"$gt": ["$departure_delay_minutes", 15]}, 1, 0]}
                }
            }
        }
    ]
    cause_res = list(db.flights.aggregate(causes_pipeline))
    causes_list = []
    if cause_res:
        c = cause_res[0]
        delayed_n = max(1, c.get("delayed_flight_count", 1))
        raw_causes = [
            ("carrier", "Carrier / Airline Issue", c.get("carrier", 0)),
            ("weather", "Severe Weather", c.get("weather", 0)),
            ("nas", "Airspace / ATC (NAS)", c.get("nas", 0)),
            ("late_aircraft", "Late Arriving Aircraft", c.get("late_aircraft", 0)),
            ("security", "Security Incident", c.get("security", 0))
        ]
        total_delay_min = sum(item[2] for item in raw_causes) or 1
        for key, label, minutes in raw_causes:
            causes_list.append({
                "cause": key,
                "label": label,
                "total_minutes": int(minutes),
                "avg_minutes": round(minutes / delayed_n, 1),
                "percentage": round((minutes / total_delay_min) * 100, 2)
            })

    # 2. Hourly delay trends: using substring for ISO date format "YYYY-MM-DDTHH:MM:SS"
    hourly_pipeline = [
        {
            "$project": {
                "hour": {"$toInt": {"$substr": ["$scheduled_departure", 11, 2]}},
                "departure_delay_minutes": 1
            }
        },
        {
            "$group": {
                "_id": "$hour",
                "flight_count": {"$sum": 1},
                "avg_delay_minutes": {"$avg": "$departure_delay_minutes"}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    hourly_res = list(db.flights.aggregate(hourly_pipeline))
    hourly_trends = [
        {
            "hour": h["_id"],
            "flight_count": h["flight_count"],
            "avg_delay_minutes": round(h.get("avg_delay_minutes", 0.0) or 0.0, 1)
        }
        for h in hourly_res if h["_id"] is not None
    ]

    # 3. Day of week trends: parse date to day of week (1=Sun, 2=Mon... 7=Sat)
    dow_pipeline = [
        {
            "$project": {
                "dow": {
                    "$dayOfWeek": {
                        "$dateFromString": {
                            "dateString": {"$substr": ["$scheduled_departure", 0, 19]}
                        }
                    }
                },
                "departure_delay_minutes": 1
            }
        },
        {
            "$group": {
                "_id": "$dow",
                "flight_count": {"$sum": 1},
                "avg_delay_minutes": {"$avg": "$departure_delay_minutes"}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    dow_res = list(db.flights.aggregate(dow_pipeline))
    day_names = {1: "Sunday", 2: "Monday", 3: "Tuesday", 4: "Wednesday", 5: "Thursday", 6: "Friday", 7: "Saturday"}
    day_of_week_trends = [
        {
            "day_number": d["_id"],
            "day_name": day_names.get(d["_id"], f"Day {d['_id']}"),
            "flight_count": d["flight_count"],
            "avg_delay_minutes": round(d.get("avg_delay_minutes", 0.0) or 0.0, 1)
        }
        for d in dow_res if d["_id"] in day_names
    ]

    # 4. Top delayed routes (minimum 10 flights)
    routes_pipeline = [
        {
            "$group": {
                "_id": {
                    "orig": "$origin_airport.iata_code",
                    "dest": "$destination_airport.iata_code"
                },
                "flight_count": {"$sum": 1},
                "avg_delay_minutes": {"$avg": "$departure_delay_minutes"}
            }
        },
        {"$match": {"flight_count": {"$gte": 5}}},
        {"$sort": {"avg_delay_minutes": -1}},
        {"$limit": 10}
    ]
    routes_res = list(db.flights.aggregate(routes_pipeline))
    top_delayed_routes = [
        {
            "route": f"{r['_id']['orig']} → {r['_id']['dest']}",
            "origin": r["_id"]["orig"],
            "destination": r["_id"]["dest"],
            "flight_count": r["flight_count"],
            "avg_delay_minutes": round(r["avg_delay_minutes"] or 0.0, 1)
        }
        for r in routes_res
    ]

    return {
        "causes": causes_list,
        "hourly_trends": hourly_trends,
        "day_of_week_trends": day_of_week_trends,
        "top_delayed_routes": top_delayed_routes
    }

def get_airport_traffic_analytics(db, limit: int = 10) -> Dict[str, Any]:
    """Compute busiest airports by movements and top popular flight corridors."""
    # Group by origin for departures
    dep_pipeline = [
        {
            "$group": {
                "_id": "$origin_airport.iata_code",
                "name": {"$first": "$origin_airport.name"},
                "city": {"$first": "$origin_airport.city"},
                "country": {"$first": "$origin_airport.country"},
                "departures": {"$sum": 1}
            }
        }
    ]
    dep_dict = {item["_id"]: item for item in db.flights.aggregate(dep_pipeline)}

    # Group by destination for arrivals
    arr_pipeline = [
        {
            "$group": {
                "_id": "$destination_airport.iata_code",
                "arrivals": {"$sum": 1}
            }
        }
    ]
    arr_dict = {item["_id"]: item["arrivals"] for item in db.flights.aggregate(arr_pipeline)}

    # Combine
    combined = []
    all_codes = set(dep_dict.keys()).union(set(arr_dict.keys()))
    for code in all_codes:
        dep_info = dep_dict.get(code, {})
        deps = dep_info.get("departures", 0)
        arrs = arr_dict.get(code, 0)
        combined.append({
            "iata_code": code,
            "name": dep_info.get("name", code),
            "city": dep_info.get("city", "Unknown"),
            "country": dep_info.get("country", "Unknown"),
            "departures": deps,
            "arrivals": arrs,
            "total_movements": deps + arrs
        })

    combined.sort(key=lambda x: x["total_movements"], reverse=True)
    busiest_airports = combined[:limit]

    # Top popular routes
    pop_routes_pipeline = [
        {
            "$group": {
                "_id": {
                    "orig": "$origin_airport.iata_code",
                    "dest": "$destination_airport.iata_code"
                },
                "flight_count": {"$sum": 1},
                "avg_duration": {"$avg": "$flight_duration_minutes"},
                "distance_km": {"$first": "$distance_km"}
            }
        },
        {"$sort": {"flight_count": -1}},
        {"$limit": 10}
    ]
    popular_routes_res = list(db.flights.aggregate(pop_routes_pipeline))
    popular_routes = [
        {
            "route": f"{r['_id']['orig']} → {r['_id']['dest']}",
            "origin": r["_id"]["orig"],
            "destination": r["_id"]["dest"],
            "flight_count": r["flight_count"],
            "avg_duration_minutes": round(r["avg_duration"] or 0.0, 1),
            "distance_km": round(r.get("distance_km", 0.0), 1)
        }
        for r in popular_routes_res
    ]

    return {
        "busiest_airports": busiest_airports,
        "popular_routes": popular_routes
    }

def get_airline_performance_analytics(db) -> List[Dict[str, Any]]:
    """Performance rankings for all 50 airlines using aggregation grouping."""
    pipeline = [
        {
            "$group": {
                "_id": "$airline.iata_code",
                "name": {"$first": "$airline.name"},
                "country": {"$first": "$airline.country"},
                "alliance": {"$first": "$airline.alliance"},
                "total_flights": {"$sum": 1},
                "on_time_flights": {
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
                "delayed_flights": {
                    "$sum": {
                        "$cond": [{"$gt": ["$departure_delay_minutes", 15]}, 1, 0]
                    }
                },
                "cancelled_flights": {
                    "$sum": {
                        "$cond": [{"$eq": ["$status", "Cancelled"]}, 1, 0]
                    }
                },
                "avg_delay_minutes": {"$avg": "$departure_delay_minutes"}
            }
        },
        {"$sort": {"total_flights": -1}}
    ]

    res = list(db.flights.aggregate(pipeline))
    # Fetch airline fleet size lookup
    fleet_lookup = {a["iata_code"]: a.get("fleet_size", 0) for a in db.airlines.find({}, {"iata_code": 1, "fleet_size": 1})}

    results = []
    for row in res:
        code = row["_id"]
        total = row["total_flights"] or 1
        on_time = row["on_time_flights"]
        delayed = row["delayed_flights"]
        cancelled = row["cancelled_flights"]
        results.append({
            "iata_code": code,
            "name": row.get("name") or code,
            "country": row.get("country") or "Unknown",
            "alliance": row.get("alliance") or "None",
            "fleet_size": fleet_lookup.get(code, 0),
            "total_flights": total,
            "on_time_flights": on_time,
            "delayed_flights": delayed,
            "cancelled_flights": cancelled,
            "on_time_rate": round((on_time / total) * 100, 2),
            "cancellation_rate": round((cancelled / total) * 100, 2),
            "avg_delay_minutes": round(row.get("avg_delay_minutes", 0.0) or 0.0, 1)
        })

    # Sort primarily by on-time rate descending
    results.sort(key=lambda x: x["on_time_rate"], reverse=True)
    return results

def get_status_distribution(db) -> List[Dict[str, Any]]:
    """Flight status distribution across all records."""
    pipeline = [
        {
            "$group": {
                "_id": "$status",
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"count": -1}}
    ]
    res = list(db.flights.aggregate(pipeline))
    total = sum(r["count"] for r in res) or 1
    return [
        {
            "status": r["_id"],
            "count": r["count"],
            "percentage": round((r["count"] / total) * 100, 2)
        }
        for r in res
    ]

def get_monthly_trends(db) -> List[Dict[str, Any]]:
    """Monthly breakdown of flights, delays, and passenger volumes."""
    pipeline = [
        {
            "$project": {
                "month": {"$substr": ["$scheduled_departure", 0, 7]},
                "departure_delay_minutes": 1,
                "passenger_count": 1
            }
        },
        {
            "$group": {
                "_id": "$month",
                "flight_count": {"$sum": 1},
                "avg_delay_minutes": {"$avg": "$departure_delay_minutes"},
                "total_passengers": {"$sum": "$passenger_count"}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    res = list(db.flights.aggregate(pipeline))
    return [
        {
            "month": r["_id"],
            "flight_count": r["flight_count"],
            "avg_delay_minutes": round(r.get("avg_delay_minutes", 0.0) or 0.0, 1),
            "total_passengers": int(r.get("total_passengers", 0))
        }
        for r in res if r["_id"]
    ]
