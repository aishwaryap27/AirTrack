"""
AirTrack — MongoDB Seeding & Verification Script
Inserts synthetic aviation data into MongoDB 'AirTrafficDB'
Creates high-performance compound, text, and geospatial indexes.
Verifies document counts and reports database metrics.
"""

import os
import json
import time
from pymongo import MongoClient, ASCENDING, DESCENDING, TEXT, GEOSPHERE
from pymongo.errors import ConnectionFailure

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB_NAME", "AirTrafficDB")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "generated")
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def seed_database():
    print(f"Connecting to MongoDB at: {MONGO_URI} ...")
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        # Test connection
        client.admin.command("ping")
        print("Connected to MongoDB successfully!")
    except ConnectionFailure as e:
        print(f"ERROR: Could not connect to MongoDB at {MONGO_URI}: {e}")
        print("Please ensure MongoDB Server is running or provide a valid MONGO_URI in .env.")
        raise

    db = client[DB_NAME]
    print(f"Target Database: {DB_NAME}")

    start_time = time.time()

    # 1. Reset collections
    print("Dropping existing collections for clean seed...")
    for col_name in ["airports", "airlines", "aircraft_types", "flights"]:
        db[col_name].drop()

    # 2. Seed Airports
    print("Loading airports.json...")
    with open(os.path.join(DATA_DIR, "airports.json"), "r", encoding="utf-8") as f:
        airports_data = json.load(f)
    db.airports.insert_many(airports_data)
    db.airports.create_index([("iata_code", ASCENDING)], unique=True)
    db.airports.create_index([("name", TEXT), ("city", TEXT), ("country", TEXT)])
    db.airports.create_index([("coordinates", GEOSPHERE)])
    print(f"Inserted {len(airports_data)} airports and configured indexes.")

    # 3. Seed Airlines
    print("Loading airlines.json...")
    with open(os.path.join(DATA_DIR, "airlines.json"), "r", encoding="utf-8") as f:
        airlines_data = json.load(f)
    db.airlines.insert_many(airlines_data)
    db.airlines.create_index([("iata_code", ASCENDING)], unique=True)
    db.airlines.create_index([("name", TEXT), ("country", TEXT)])
    print(f"Inserted {len(airlines_data)} airlines and configured indexes.")

    # 4. Seed Aircraft Types
    print("Loading aircraft_types.json...")
    with open(os.path.join(DATA_DIR, "aircraft_types.json"), "r", encoding="utf-8") as f:
        aircraft_data = json.load(f)
    db.aircraft_types.insert_many(aircraft_data)
    db.aircraft_types.create_index([("model", ASCENDING)], unique=True)
    print(f"Inserted {len(aircraft_data)} aircraft types and configured indexes.")

    # 5. Seed Flights (Batching 5,000 for high efficiency)
    print("Loading flights.json (50,000 records)...")
    with open(os.path.join(DATA_DIR, "flights.json"), "r", encoding="utf-8") as f:
        flights_data = json.load(f)

    batch_size = 5000
    total_flights = len(flights_data)
    print(f"Inserting {total_flights} flights in batches of {batch_size}...")

    for i in range(0, total_flights, batch_size):
        chunk = flights_data[i:i + batch_size]
        db.flights.insert_many(chunk)
        print(f"  Inserted flights {i + 1} to {min(i + batch_size, total_flights)}...")

    # Create Flight Indexes
    print("Creating flights indexes for aggregation and search performance...")
    db.flights.create_index([("flight_number", ASCENDING)])
    db.flights.create_index([("status", ASCENDING)])
    db.flights.create_index([("airline.iata_code", ASCENDING)])
    db.flights.create_index([("origin_airport.iata_code", ASCENDING)])
    db.flights.create_index([("destination_airport.iata_code", ASCENDING)])
    db.flights.create_index([("scheduled_departure", ASCENDING)])
    db.flights.create_index([("departure_delay_minutes", ASCENDING)])
    db.flights.create_index([("status", ASCENDING), ("scheduled_departure", DESCENDING)])
    db.flights.create_index([("origin_airport.iata_code", ASCENDING), ("destination_airport.iata_code", ASCENDING)])
    print("Flight indexes created successfully!")

    duration = round(time.time() - start_time, 2)

    # Verification counts
    count_airports = db.airports.count_documents({})
    count_airlines = db.airlines.count_documents({})
    count_aircraft = db.aircraft_types.count_documents({})
    count_flights = db.flights.count_documents({})

    verification = {
        "status": "SUCCESS",
        "database": DB_NAME,
        "mongo_uri": MONGO_URI,
        "seed_duration_seconds": duration,
        "verified_counts": {
            "airports": count_airports,
            "airlines": count_airlines,
            "aircraft_types": count_aircraft,
            "flights": count_flights
        },
        "target_counts": {
            "airports": 100,
            "airlines": 50,
            "aircraft_types": 20,
            "flights": 50000
        },
        "target_met": (
            count_airports == 100 and
            count_airlines == 50 and
            count_aircraft == 20 and
            count_flights == 50000
        ),
        "indexes": {
            "airports": [idx["name"] for idx in db.airports.list_indexes()],
            "airlines": [idx["name"] for idx in db.airlines.list_indexes()],
            "aircraft_types": [idx["name"] for idx in db.aircraft_types.list_indexes()],
            "flights": [idx["name"] for idx in db.flights.list_indexes()]
        }
    }

    verification_file = os.path.join(OUTPUT_DIR, "dataset_verification.json")
    with open(verification_file, "w", encoding="utf-8") as f:
        json.dump(verification, f, indent=2)

    print("\n--- SEEDING & VERIFICATION COMPLETE ---")
    print(f"Airports:      {count_airports}/100")
    print(f"Airlines:      {count_airlines}/50")
    print(f"Aircraft:      {count_aircraft}/20")
    print(f"Flights:       {count_flights}/50,000")
    print(f"Total Time:    {duration}s")
    print(f"Target Met:    {verification['target_met']}")
    print(f"Verification output saved to: {verification_file}")

    return verification

if __name__ == "__main__":
    seed_database()
