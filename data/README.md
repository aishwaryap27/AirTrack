# AirTrack — Synthetic Aviation Dataset & Data Management

This directory contains the synthetic dataset generation tools, generated data artifacts, and database seeding scripts for the **AirTrack** Big Data Analytics platform.

## Dataset Specification

| Entity | Target Count | Actual Count | Source Schema |
| :--- | :--- | :--- | :--- |
| **Airports** | 100 | 100 | Real-world major international & regional hubs with GeoJSON Point coordinates, IATA/ICAO codes, elevation, and runway data |
| **Airlines** | 50 | 50 | International and domestic carriers with fleet size, callsign, airline alliances (Oneworld, Star Alliance, SkyTeam), and hub linkages |
| **Aircraft Types** | 20 | 20 | Commercial narrow-body, wide-body, regional jets, and turboprops with seat capacities, cruise speeds, ranges, and fuel burn coefficients |
| **Flight Records** | 50,000 | 50,000 | Six-month historical and active flight operations with realistic delays, delay cause attributions, load factors, fuel burn, and routing |

## Reproducibility
- **Random Seed**: `42`
- All timestamps, aircraft allocations, passenger counts, delay variations, and routes are generated deterministically.

## File Manifest
- `scripts/generate_data.py`: Generates the 4 JSON collections and saves to `data/generated/`.
- `scripts/seed_mongodb.py`: Connects to MongoDB `AirTrafficDB`, configures single, text, geospatial, and compound indexes, and inserts all records using efficient batching.
- `generated/airports.json`: 100 airport documents.
- `generated/airlines.json`: 50 airline documents.
- `generated/aircraft_types.json`: 20 aircraft type documents.
- `generated/flights.json`: 50,000 flight documents.
- `generated/summary.json`: Statistical breakdown of generated flight statuses and time window.

## Running Data Scripts
```bash
# Generate fresh data
python data/scripts/generate_data.py

# Seed MongoDB AirTrafficDB
python data/scripts/seed_mongodb.py
```
