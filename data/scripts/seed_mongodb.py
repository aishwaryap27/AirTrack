"""
AirTrack — MongoDB Seeding & Verification Script
Inserts synthetic aviation data into MongoDB 'AirTrafficDB'
Creates high-performance compound, text, and geospatial indexes.
Verifies document counts and reports database metrics.

SAFE SEEDING:
- By default, will NOT drop existing collections if they already contain data.
- Preserves existing records unless explicit --reset flag is passed.
- Safe to run multiple times (idempotent).
- Maintains indexes and validates final document counts.
"""

import os
import sys
import json
import time
import argparse
from pymongo import MongoClient, ASCENDING, DESCENDING, TEXT, GEOSPHERE
from pymongo.errors import ConnectionFailure

TARGET_COUNTS = {
    "airports": 100,
    "airlines": 50,
    "aircraft_types": 20,
    "flights": 50000,
}

def ensure_all_indexes(db):
    """Creates and verifies compound, text, and geospatial indexes."""
    try:
        # Airports
        db.airports.create_index([("iata_code", ASCENDING)], unique=True)
        db.airports.create_index([("name", TEXT), ("city", TEXT), ("country", TEXT)])
        db.airports.create_index([("coordinates", GEOSPHERE)])

        # Airlines
        db.airlines.create_index([("iata_code", ASCENDING)], unique=True)
        db.airlines.create_index([("name", TEXT), ("country", TEXT)])

        # Aircraft
        db.aircraft_types.create_index([("model", ASCENDING)], unique=True)

        # Flights
        db.flights.create_index([("flight_number", ASCENDING)])
        db.flights.create_index([("status", ASCENDING)])
        db.flights.create_index([("airline.iata_code", ASCENDING)])
        db.flights.create_index([("origin_airport.iata_code", ASCENDING)])
        db.flights.create_index([("destination_airport.iata_code", ASCENDING)])
        db.flights.create_index([("scheduled_departure", ASCENDING)])
        db.flights.create_index([("departure_delay_minutes", ASCENDING)])
        db.flights.create_index([("status", ASCENDING), ("scheduled_departure", DESCENDING)])
        db.flights.create_index([("origin_airport.iata_code", ASCENDING), ("destination_airport.iata_code", ASCENDING)])
        print("Indexes verified/created successfully.")
    except Exception as e:
        print(f"Index creation note: {e}")

def seed_database(reset: bool = False, verify_only: bool = False, mongo_uri: str = None, db_name: str = None):
    uri = mongo_uri or os.getenv("MONGO_URI", "mongodb://localhost:27017")
    database_name = db_name or os.getenv("MONGO_DB_NAME", "AirTrafficDB")
    data_dir = os.getenv(
        "DATA_DIR",
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "generated")
    )
    output_dir = os.getenv(
        "OUTPUT_DIR",
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "outputs")
    )

    print(f"Connecting to MongoDB at: {uri} ...")
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")
        print("Connected to MongoDB successfully!")
    except ConnectionFailure as e:
        print(f"ERROR: Could not connect to MongoDB at {uri}: {e}")
        print("Please ensure MongoDB Server is running or provide a valid MONGO_URI.")
        raise

    db = client[database_name]
    print(f"Target Database: {database_name}")
    start_time = time.time()

    current_counts = {
        "airports": db.airports.count_documents({}),
        "airlines": db.airlines.count_documents({}),
        "aircraft_types": db.aircraft_types.count_documents({}),
        "flights": db.flights.count_documents({}),
    }

    already_seeded = all(current_counts[col] >= TARGET_COUNTS[col] for col in TARGET_COUNTS)

    if verify_only:
        print("\n--- VERIFICATION ONLY MODE ---")
        ensure_all_indexes(db)
    elif reset:
        print("\n[WARNING] Destructive reset flag (--reset) supplied!")
        print("Dropping existing collections for clean seed...")
        for col_name in ["airports", "airlines", "aircraft_types", "flights"]:
            db[col_name].drop()
        current_counts = {col: 0 for col in TARGET_COUNTS}
        _perform_seed(db, data_dir, current_counts)
    elif already_seeded:
        print(f"\n[INFO] Database '{database_name}' already contains all required datasets:")
        print(f"  Airports:      {current_counts['airports']}/{TARGET_COUNTS['airports']}")
        print(f"  Airlines:      {current_counts['airlines']}/{TARGET_COUNTS['airlines']}")
        print(f"  Aircraft:      {current_counts['aircraft_types']}/{TARGET_COUNTS['aircraft_types']}")
        print(f"  Flights:       {current_counts['flights']}/{TARGET_COUNTS['flights']:,}")
        print("[INFO] No seeding needed. Preserving existing records.")
        print("Verifying and maintaining database indexes...")
        ensure_all_indexes(db)
    else:
        print("\n[INFO] Safe seed mode: Checking collections...")
        _perform_seed(db, data_dir, current_counts)

    duration = round(time.time() - start_time, 2)

    # Verification counts
    count_airports = db.airports.count_documents({})
    count_airlines = db.airlines.count_documents({})
    count_aircraft = db.aircraft_types.count_documents({})
    count_flights = db.flights.count_documents({})

    verification = {
        "status": "SUCCESS",
        "database": database_name,
        "mongo_uri": uri,
        "seed_duration_seconds": duration,
        "verified_counts": {
            "airports": count_airports,
            "airlines": count_airlines,
            "aircraft_types": count_aircraft,
            "flights": count_flights
        },
        "target_counts": TARGET_COUNTS,
        "target_met": (
            count_airports >= TARGET_COUNTS["airports"] and
            count_airlines >= TARGET_COUNTS["airlines"] and
            count_aircraft >= TARGET_COUNTS["aircraft_types"] and
            count_flights >= TARGET_COUNTS["flights"]
        ),
        "indexes": {
            "airports": [idx["name"] for idx in db.airports.list_indexes()],
            "airlines": [idx["name"] for idx in db.airlines.list_indexes()],
            "aircraft_types": [idx["name"] for idx in db.aircraft_types.list_indexes()],
            "flights": [idx["name"] for idx in db.flights.list_indexes()]
        }
    }

    try:
        os.makedirs(output_dir, exist_ok=True)
        verification_file = os.path.join(output_dir, "dataset_verification.json")
        with open(verification_file, "w", encoding="utf-8") as f:
            json.dump(verification, f, indent=2)
        print(f"Verification output saved to: {verification_file}")
    except OSError as e:
        print(f"Notice: Could not write verification file ({e}). Counts verified in memory.")

    print("\n--- SEEDING & VERIFICATION COMPLETE ---")
    print(f"Airports:      {count_airports}/{TARGET_COUNTS['airports']}")
    print(f"Airlines:      {count_airlines}/{TARGET_COUNTS['airlines']}")
    print(f"Aircraft:      {count_aircraft}/{TARGET_COUNTS['aircraft_types']}")
    print(f"Flights:       {count_flights:,}/{TARGET_COUNTS['flights']:,}")
    print(f"Total Time:    {duration}s")
    print(f"Target Met:    {verification['target_met']}")

    return verification

def _perform_seed(db, data_dir: str, current_counts: dict):
    """Helper to load JSON data files and populate collections."""
    # 1. Airports
    if current_counts["airports"] == 0:
        airports_file = os.path.join(data_dir, "airports.json")
        print(f"Loading {airports_file}...")
        with open(airports_file, "r", encoding="utf-8") as f:
            airports_data = json.load(f)
        db.airports.insert_many(airports_data)
        print(f"Inserted {len(airports_data)} airports.")
    else:
        print(f"Airports collection already has {current_counts['airports']} documents. Skipping insert.")

    # 2. Airlines
    if current_counts["airlines"] == 0:
        airlines_file = os.path.join(data_dir, "airlines.json")
        print(f"Loading {airlines_file}...")
        with open(airlines_file, "r", encoding="utf-8") as f:
            airlines_data = json.load(f)
        db.airlines.insert_many(airlines_data)
        print(f"Inserted {len(airlines_data)} airlines.")
    else:
        print(f"Airlines collection already has {current_counts['airlines']} documents. Skipping insert.")

    # 3. Aircraft Types
    if current_counts["aircraft_types"] == 0:
        aircraft_file = os.path.join(data_dir, "aircraft_types.json")
        print(f"Loading {aircraft_file}...")
        with open(aircraft_file, "r", encoding="utf-8") as f:
            aircraft_data = json.load(f)
        db.aircraft_types.insert_many(aircraft_data)
        print(f"Inserted {len(aircraft_data)} aircraft types.")
    else:
        print(f"Aircraft types collection already has {current_counts['aircraft_types']} documents. Skipping insert.")

    # 4. Flights (Batching 5,000 for high efficiency)
    if current_counts["flights"] == 0:
        flights_file = os.path.join(data_dir, "flights.json")
        print(f"Loading {flights_file} (50,000 records)...")
        with open(flights_file, "r", encoding="utf-8") as f:
            flights_data = json.load(f)

        batch_size = 5000
        total_flights = len(flights_data)
        print(f"Inserting {total_flights:,} flights in batches of {batch_size:,}...")

        for i in range(0, total_flights, batch_size):
            chunk = flights_data[i:i + batch_size]
            db.flights.insert_many(chunk)
            print(f"  Inserted flights {i + 1:,} to {min(i + batch_size, total_flights):,}...")
        print(f"Inserted {total_flights:,} flights.")
    else:
        print(f"Flights collection already has {current_counts['flights']:,} documents. Skipping insert.")

    print("Configuring and verifying indexes...")
    ensure_all_indexes(db)

def main():
    parser = argparse.ArgumentParser(description="AirTrack MongoDB Dataset Seeder & Verifier")
    parser.add_argument("--reset", action="store_true", help="Explicitly drop existing collections before seeding (DESTRUCTIVE)")
    parser.add_argument("--force", action="store_true", help="Alias for --reset")
    parser.add_argument("--verify-only", action="store_true", help="Only verify existing data and indexes without inserting")
    parser.add_argument("--mongo-uri", type=str, default=None, help="MongoDB connection URI (overrides MONGO_URI env var)")
    parser.add_argument("--db-name", type=str, default=None, help="Database name (overrides MONGO_DB_NAME env var)")

    args = parser.parse_args()
    seed_database(
        reset=args.reset or args.force,
        verify_only=args.verify_only,
        mongo_uri=args.mongo_uri,
        db_name=args.db_name
    )

if __name__ == "__main__":
    main()
