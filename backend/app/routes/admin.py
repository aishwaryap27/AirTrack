import os
import subprocess
import sys
from fastapi import APIRouter, HTTPException
from app.database import get_database
from app.config import settings
from app.models.common import MessageResponse

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/status")
def get_system_status():
    """Returns database connection status, collection metrics, and index details."""
    try:
        db = get_database()
        # Ping
        db.command("ping")
        # Collect stats
        collections_info = []
        for col_name in ["flights", "airports", "airlines", "aircraft_types"]:
            col = db[col_name]
            count = col.count_documents({})
            indexes = [idx["name"] for idx in col.list_indexes()]
            collections_info.append({
                "collection": col_name,
                "document_count": count,
                "index_count": len(indexes),
                "indexes": indexes
            })

        db_stats = db.command("dbStats")

        return {
            "status": "HEALTHY",
            "database_name": settings.MONGO_DB_NAME,
            "mongo_uri": settings.MONGO_URI,
            "connected": True,
            "storage_size_mb": round(db_stats.get("storageSize", 0) / (1024 * 1024), 2),
            "data_size_mb": round(db_stats.get("dataSize", 0) / (1024 * 1024), 2),
            "collections_count": db_stats.get("collections", 0),
            "total_documents": db_stats.get("objects", 0),
            "collections": collections_info
        }
    except Exception as e:
        return {
            "status": "UNHEALTHY",
            "database_name": settings.MONGO_DB_NAME,
            "mongo_uri": settings.MONGO_URI,
            "connected": False,
            "error": str(e),
            "instructions": "Ensure MongoDB server is active on localhost:27017 or update MONGO_URI in backend/.env"
        }

@router.post("/reseed", response_model=MessageResponse)
def trigger_reseed():
    """Trigger re-seeding of synthetic dataset into MongoDB."""
    seed_script = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "scripts", "seed_mongodb.py")
    )
    if not os.path.exists(seed_script):
        raise HTTPException(status_code=500, detail="Seed script not found")

    try:
        res = subprocess.run([sys.executable, seed_script], capture_output=True, text=True, check=True)
        return MessageResponse(
            message="Database successfully re-seeded with synthetic aviation dataset.",
            details={"output": res.stdout[-300:]}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reseed database: {str(e)}")
