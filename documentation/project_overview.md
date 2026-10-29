# AirTrack — Project Overview

## 1. Project Identification
- **Project Name**: AirTrack
- **Full Title**: Air Traffic Data Management and Analytics Using MongoDB
- **Domain**: Big Data Analytics / Database Engineering / Aviation Information Systems
- **Target Database**: MongoDB Community Server (`AirTrafficDB`)
- **Application Type**: Full-Stack Big Data Analytics Web Application

---

## 2. Academic Project Objective
The primary objective of **AirTrack** is to demonstrate how a modern Document-Oriented NoSQL Database (MongoDB) and a high-performance Python/FastAPI backend coupled with a modern React frontend can effectively ingest, index, query, aggregate, and visualize high-volume aviation operations data.

Using a synthetic corpus of **50,000 commercial flight records**, **100 international airports**, **50 airlines**, and **20 aircraft types**, the system demonstrates:
1. **Schema Design**: Balancing embedding vs. referencing for aviation entities with GeoJSON coordinate support.
2. **Indexing Strategy**: Implementing single-field, compound, text, and 2dsphere geospatial indexes to optimize queries across 50,000 documents without full collection scans.
3. **MongoDB Aggregation Pipelines**: Leveraging multi-stage pipelines (`$group`, `$facet`, `$project`, `$sort`, `$cond`) for real-time analytics.
4. **CRUD Lifecycle**: Managing commercial flight records with validation and dynamic distance calculations.
5. **Interactive Telemetry Visualization**: Demonstrating real-time simulated flight progress, headings, altitudes, and radar sweeps.

---

## 3. Important Academic Disclaimer
> **ACADEMIC DEMONSTRATION NOTICE**:  
> AirTrack is an academic demonstration developed for Big Data Analytics and database management coursework using a deterministically generated synthetic dataset. It is **NOT** an operational Air Traffic Control (ATC) system, does not connect to live radar feeds, ADS-B transponders, collision avoidance systems, or FAA/Eurocontrol networks, and must not be used for actual aeronautical navigation.

---

## 4. Key Functional Modules

### 4.1 Executive Dashboard
- Airspace high-level Key Performance Indicators (KPIs): Total Flights, On-Time Rate (≤15 min departure delay), Delayed Rate, Average Delay, Active Aircraft, Total Passengers.
- Status distribution donut chart (Landed, Delayed, Scheduled, Cancelled, Diverted, En Route).
- Multi-month operations volume and delay trend analysis.
- Root delay cause breakdown (Carrier, Weather, NAS, Late Aircraft, Security).
- Busiest airport movements leaderboard and recent movements table.

### 4.2 Simulated Live Airspace Monitor
- Interactive radar sweep scope with range rings (100–400 NM), crosshairs, and rotating beam.
- 94 simultaneously plotted active en-route aircraft targets with simulated coordinates, altitudes, groundspeeds, and headings.
- Searchable flight cards with progress bars and detail modal showing waypoint trajectory.

### 4.3 Flight Operations Manager (CRUD)
- Multi-criteria querying: flight number search, status filter, airline selector, origin/destination IATA lookups, minimum delay filters.
- Responsive data table adhering to modern web best practices (sticky headers, container queries, accessible scrolling).
- Operations: Schedule New Flight, View Manifest & Delay Diagnostics, Edit Flight Status & Delays, Delete Record.

### 4.4 Aviation Big Data Analytics Hub
- **Delay Diagnostics**: Diurnal 24-hour delay curves, day-of-week trends, and top 10 most delayed flight corridors.
- **Airport Traffic & Corridors**: Top 10 busiest airports with departures vs. arrivals stacked analysis and top 10 popular routes.
- **Airline Benchmarking**: 50 airlines ranking table sortable by on-time rate, lowest delay, and volume.
- **MongoDB Architecture Playground**: Transparent inspection of the underlying MongoDB aggregation pipelines.

### 4.5 Airport & Airline Directories
- 100 international airports directory with coordinates, elevations, and traffic drill-down modal.
- 50 airlines directory with alliance memberships, fleet sizes, and on-time performance metrics.

### 4.6 MongoDB Database & System Diagnostics
- Connection state monitor for local MongoDB Server (`AirTrafficDB`).
- Live collection document counts, storage sizing, and index manifests.
- Instructions for inspecting the collections directly in **MongoDB Compass**.
- One-click dataset re-seeding engine.
