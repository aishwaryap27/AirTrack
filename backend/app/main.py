import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import DatabaseManager, ensure_indexes
from app.routes import flights, airports, airlines, analytics, simulation, admin

logging.basicConfig(level=logging.INFO if not settings.DEBUG else logging.DEBUG, format="%(asctime)s - %(levelname)s - %(name)s - %(message)s")
logger = logging.getLogger("airtrack")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB and verify indexes
    logger.info("Initializing AirTrack backend service...")
    try:
        DatabaseManager.connect()
        ensure_indexes()
        logger.info("MongoDB initialized and indexes verified.")
    except Exception as e:
        logger.error(f"Startup failure: Database connection could not be established: {e}")
        raise
    try:
        yield
    finally:
        # Shutdown
        logger.info("Shutting down AirTrack backend service...")
        DatabaseManager.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Big Data Air Traffic Data Management and Analytics Platform using MongoDB",
    version="1.0.0",
    lifespan=lifespan,
    debug=settings.DEBUG
)

# CORS Middleware
is_wildcard = "*" in settings.CORS_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False if is_wildcard else True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(flights.router, prefix=settings.API_PREFIX)
app.include_router(airports.router, prefix=settings.API_PREFIX)
app.include_router(airlines.router, prefix=settings.API_PREFIX)
app.include_router(analytics.router, prefix=settings.API_PREFIX)
app.include_router(simulation.router, prefix=settings.API_PREFIX)
app.include_router(admin.router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "project": "AirTrack — Air Traffic Data Management and Analytics Using MongoDB",
        "version": "1.0.0",
        "status": "ONLINE",
        "documentation": "/docs",
        "api_prefix": settings.API_PREFIX,
        "database": settings.MONGO_DB_NAME
    }

@app.get("/health")
def health(response: Response):
    try:
        db = DatabaseManager.get_db()
        db.command("ping")
        return {"status": "HEALTHY", "database": "CONNECTED", "database_name": settings.MONGO_DB_NAME}
    except Exception as e:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "DEGRADED", "database": "DISCONNECTED", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
