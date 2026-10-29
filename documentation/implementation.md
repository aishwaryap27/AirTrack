# AirTrack — Implementation Guide

## 1. Environment & Technical Stack

### 1.1 Backend Environment
- **Python**: 3.13 / 3.11+
- **Web Framework**: FastAPI (ASGI)
- **Server**: Uvicorn
- **Database Driver**: PyMongo 4.x
- **Data Validation**: Pydantic v2 & Pydantic-Settings
- **Data Science**: Pandas

### 1.2 Frontend Environment
- **Runtime**: Node.js v24.x
- **Framework**: React 19
- **Language**: TypeScript 5.8+
- **Build Tool**: Vite 8.x
- **Styling**: Tailwind CSS 3.4
- **Charts Engine**: Recharts 2.x
- **Icons**: Lucide React
- **HTTP Client**: Axios

### 1.3 Database Environment
- **Server**: MongoDB Community Server 7.x/8.x (Windows Service `MongoDB` actively running)
- **Database Name**: `AirTrafficDB`
- **Default Port**: 27017

---

## 2. Codebase Organization

```
AirTrack/
├── backend/
│   ├── app/
│   │   ├── main.py              # Application entry, CORS, lifespan, routes
│   │   ├── config.py            # Environment settings (Pydantic SettingsConfigDict)
│   │   ├── database.py          # PyMongo client lifecycle, index provisioning
│   │   ├── models/              # Pydantic schemas for all aviation entities
│   │   │   ├── common.py        # Generic PaginatedResponse, MessageResponse
│   │   │   ├── airport.py       # AirportBase, AirportResponse, TrafficStats
│   │   │   ├── airline.py       # AirlineBase, AirlinePerformanceMetric
│   │   │   ├── aircraft.py      # AircraftTypeBase, AircraftTypeResponse
│   │   │   ├── flight.py        # FlightBase, FlightCreate, FlightUpdate
│   │   │   └── analytics.py     # KPIOverview, DelayAnalytics, TrafficModels
│   │   ├── routes/              # Modular REST endpoint routers
│   │   │   ├── flights.py       # Full CRUD, filtering, pagination, sorting
│   │   │   ├── airports.py      # Airport listing and traffic summaries
│   │   │   ├── airlines.py      # Airline listing and performance queries
│   │   │   ├── analytics.py     # Aggregation pipeline API endpoints
│   │   │   ├── simulation.py    # Simulated active flights & telemetry
│   │   │   └── admin.py         # MongoDB health, collection stats, reseed
│   │   ├── analytics/
│   │   │   └── aggregations.py  # High-efficiency MongoDB aggregation pipelines
│   │   └── utils/
│   │       └── serializers.py   # BSON ObjectId to JSON string conversion
│   ├── tests/
│   │   └── test_api.py          # 18 automated Pytest test cases
│   ├── requirements.txt         # Pinned backend dependencies
│   └── .env                     # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # StatCard, StatusBadge, Modal, Pagination
│   │   │   └── layout/          # Header, Sidebar, Layout
│   │   ├── pages/               # 7 interactive views
│   │   │   ├── DashboardPage.tsx       # Overall KPIs & Recharts visuals
│   │   │   ├── LiveAirspacePage.tsx    # Interactive radar sweep monitor
│   │   │   ├── FlightsManagerPage.tsx  # CRUD operations & data table
│   │   │   ├── AnalyticsHubPage.tsx    # Tabbed delay, traffic, airline metrics
│   │   │   ├── AirportsPage.tsx        # 100 airports directory & modal
│   │   │   ├── AirlinesPage.tsx        # 50 airlines directory & modal
│   │   │   └── DatabaseStatusPage.tsx  # MongoDB health & Compass guide
│   │   ├── services/
│   │   │   └── api.ts           # Centralized Axios service client
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript interfaces
│   │   ├── App.tsx              # React Router configuration
│   │   ├── main.tsx             # React DOM entry point
│   │   └── index.css            # Tailwind directives & responsive table rules
│   ├── package.json
│   ├── tsconfig.app.json
│   ├── tailwind.config.js
│   └── vite.config.ts           # Vite config with backend proxy
│
├── data/
│   ├── generated/               # JSON datasets (50k flights, 100 airports, etc.)
│   ├── scripts/
│   │   ├── generate_data.py     # Deterministic synthetic data generator (seed 42)
│   │   └── seed_mongodb.py      # Batch insertion & index configuration
│   └── README.md
│
├── documentation/
│   ├── project_overview.md
│   ├── system_architecture.md
│   ├── database_design.md
│   ├── implementation.md
│   └── testing.md
│
├── outputs/
│   └── dataset_verification.json # Generation & seed audit log
├── README.md
└── .gitignore
```

---

## 3. Key Implementation Highlights

### 3.1 High-Efficiency In-Database Aggregations
All heavy numerical operations run inside MongoDB using native aggregation pipelines:
```python
# Extract from app/analytics/aggregations.py
def get_overview_kpis(db):
    pipeline = [
        {
            "$group": {
                "_id": None,
                "total_flights": {"$sum": 1},
                "on_time_count": {
                    "$sum": {
                        "$cond": [
                            {"$and": [{"$lte": ["$departure_delay_minutes", 15]}, {"$ne": ["$status", "Cancelled"]}]},
                            1, 0
                        ]
                    }
                },
                "avg_dep_delay": {"$avg": "$departure_delay_minutes"},
                "total_passengers": {"$sum": "$passenger_count"},
                "total_distance": {"$sum": "$distance_km"}
            }
        }
    ]
    return list(db.flights.aggregate(pipeline))[0]
```

### 3.2 Responsive Table Pattern (`modern-web-guidance`)
In `frontend/src/index.css` and `FlightsManagerPage.tsx`:
- The container uses `.table-wrapper` with `container-type: inline-size` and `overflow: auto`.
- The `thead` utilizes `position: sticky; inset-block-start: 0; z-index: 10;`.
- Accessible region semantics (`role="region"`, `tabindex="0"`) allow keyboard-only users to navigate the full 50,000 dataset easily.

---

## 4. Execution & Running Instructions

### 4.1 Running the Backend Service
From the project root:
```powershell
# Activate Python Virtual Environment
.\backend\venv\Scripts\Activate.ps1

# Run FastAPI backend using Uvicorn
uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```
Backend API will be accessible at:
- **Base API**: `http://localhost:8000/`
- **Interactive OpenAPI Documentation (Swagger)**: `http://localhost:8000/docs`
- **Alternative ReDoc**: `http://localhost:8000/redoc`

### 4.2 Running the Frontend Application
From the project root:
```powershell
cd frontend
npm run dev
```
Frontend will be accessible at:
- **Web Application**: `http://localhost:5173/`
