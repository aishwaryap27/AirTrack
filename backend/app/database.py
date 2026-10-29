import logging
from pymongo import MongoClient, ASCENDING, DESCENDING, TEXT, GEOSPHERE
from pymongo.errors import ConnectionFailure
from app.config import settings

logger = logging.getLogger(__name__)

class DatabaseManager:
    client: MongoClient = None

    @classmethod
    def connect(cls):
        if cls.client is None:
            logger.info(f"Connecting to MongoDB at {settings.MONGO_URI}")
            cls.client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
            try:
                cls.client.admin.command("ping")
                logger.info(f"Connected to MongoDB database: {settings.MONGO_DB_NAME}")
            except ConnectionFailure as e:
                logger.error(f"Failed to connect to MongoDB: {e}")
                raise

    @classmethod
    def close(cls):
        if cls.client is not None:
            cls.client.close()
            cls.client = None
            logger.info("MongoDB connection closed.")

    @classmethod
    def get_db(cls):
        if cls.client is None:
            cls.connect()
        return cls.client[settings.MONGO_DB_NAME]

def get_database():
    return DatabaseManager.get_db()

def get_flights_col():
    return get_database()["flights"]

def get_airports_col():
    return get_database()["airports"]

def get_airlines_col():
    return get_database()["airlines"]

def get_aircraft_col():
    return get_database()["aircraft_types"]

def ensure_indexes():
    db = get_database()
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
        logger.info("MongoDB indexes verified/created successfully.")
    except Exception as e:
        logger.warning(f"Index creation note: {e}")
