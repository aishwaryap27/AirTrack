# AirTrack — Full-Stack Deployment Guide (Docker Compose & AWS EC2)

This guide documents the procedures for deploying the complete **AirTrack** application stack (React 19 frontend, FastAPI backend, and MongoDB Community Server) using Docker Compose for both local development/testing and production hosting on an **AWS EC2 Ubuntu LTS** instance.

---

## 1. Architecture & Port Exposure Overview

AirTrack operates as a single-origin containerized microservice topology connected via a private Docker bridge network (`airtrack-net`).

```
                    ┌────────────────────────────────────────────────────────┐
                    │               AWS EC2 Host (Ubuntu LTS)                │
                    │                                                        │
 Internet / User ──►│ Port 80 (HTTP)                                         │
                    │     │                                                  │
                    │     ▼                                                  │
                    │ ┌──────────────────────┐                               │
                    │ │ airtrack-frontend    │                               │
                    │ │ (Nginx Reverse Proxy)│                               │
                    │ └──────┬───────────────┘                               │
                    │        │                                               │
                    │        │ Internal Docker Network (airtrack-net)        │
                    │        ▼                                               │
                    │ ┌──────────────────────┐      ┌──────────────────────┐ │
                    │ │ airtrack-backend     │─────►│ airtrack-mongo       │ │
                    │ │ (FastAPI :8000)      │      │ (MongoDB :27017)     │ │
                    │ └──────────────────────┘      └──────────┬───────────┘ │
                    │                                          │             │
                    │                                          ▼             │
                    │                               Named Volume:            │
                    │                               airtrack_mongodb_data    │
                    └────────────────────────────────────────────────────────┘
```

### Security & Exposure Posture:
- **`airtrack-frontend` (Nginx)**: The **only** container publishing a port to the host (`80:80`).
- **`airtrack-backend` (FastAPI)**: Runs internally on port 8000. **No host port published**. Reverse-proxied via Nginx at `/api/` and `/health`.
- **`airtrack-mongo` (MongoDB)**: Runs internally on port 27017. **No host port published**. Never exposed to the public internet.
- **Single-Origin Routing**: Eliminates browser CORS issues in production while preventing service discovery exposure.

---

## Part A: Local Docker Compose Deployment

### 1. Prerequisites
- **Docker Engine** 24.0+ and **Docker Compose V2** (`docker compose version`).
- Git installed.
- (Optional for host running without Docker) Python 3.13, Node.js 22.

### 2. Configuration Setup
Create your local environment file from the example:
```bash
cp .env.example .env
```
Default configuration values in `.env`:
```env
PROJECT_NAME=AirTrack — Air Traffic Data Management and Analytics
DEBUG=False
PORT=80
API_PREFIX=/api
MONGO_URI=mongodb://mongo:27017
MONGO_DB_NAME=AirTrafficDB
CORS_ORIGINS=*
```

### 3. Build Container Images
Build the backend (Python 3.13 slim) and frontend (multi-stage Node.js 22 + Nginx Alpine) images:
```bash
docker compose build
```

### 4. Start the Application Stack
Start all services in detached mode:
```bash
docker compose up -d
```
The startup sequence automatically enforces dependency health:
1. `airtrack-mongo` initializes and passes internal health check (`mongosh ping`).
2. `airtrack-backend` starts once MongoDB is healthy, establishes connection pool, verifies indexes, and passes health check.
3. `airtrack-frontend` starts once backend is healthy and opens Nginx on port 80.

### 5. Check Service Status & Health
Verify all three containers report `(healthy)`:
```bash
docker compose ps
```
Expected output:
```
NAME                IMAGE               STATUS                    PORTS
airtrack-backend    airtrack-backend    Up (healthy)              8000/tcp
airtrack-frontend   airtrack-frontend   Up (healthy)              0.0.0.0:80->80/tcp
airtrack-mongo      mongo:7.0           Up (healthy)              27017/tcp
```

### 6. View Live Service Logs
```bash
# View all services in real time
docker compose logs -f

# View backend logs specifically
docker compose logs -f backend

# View frontend / Nginx access logs
docker compose logs -f frontend
```

### 7. Seed the Database
AirTrack uses a safe, non-destructive, idempotent seeding script. To seed an empty database with the 50,000 flight corpus:
```bash
docker compose exec backend python /app/data/scripts/seed_mongodb.py
```
Expected output:
```
Connecting to MongoDB at: mongodb://mongo:27017 ...
Connected to MongoDB successfully!
Target Database: AirTrafficDB

[INFO] Safe seed mode: Checking collections...
Loading /app/data/generated/airports.json...
Inserted 100 airports.
Loading /app/data/generated/airlines.json...
Inserted 50 airlines.
Loading /app/data/generated/aircraft_types.json...
Inserted 20 aircraft types.
Loading /app/data/generated/flights.json (50,000 records)...
Inserting 50,000 flights in batches of 5,000...
...
Indexes verified/created successfully.

--- SEEDING & VERIFICATION COMPLETE ---
Airports:      100/100
Airlines:      50/50
Aircraft:      20/20
Flights:       50,000/50,000
Target Met:    True
```

> **Safe Idempotency**: If you execute the command again, it detects the existing documents and will **not** drop or duplicate data:
> ```bash
> [INFO] Database 'AirTrafficDB' already contains all required datasets:
>   Airports:      100/100
>   Airlines:      50/50
>   Aircraft:      20/20
>   Flights:       50,000/50,000
> [INFO] No seeding needed. Preserving existing records.
> ```

> **Explicit Destructive Reset**: If you intentionally want to drop existing collections and re-seed from scratch:
> ```bash
> docker compose exec backend python /app/data/scripts/seed_mongodb.py --reset
> ```

### 8. Verification & Application Access
Open your web browser and navigate to:
- **Web Application**: `http://localhost/`
- **Airspace Radar Scope**: `http://localhost/airspace`
- **Flight Operations Manager**: `http://localhost/flights`
- **Database Status & Diagnostics**: `http://localhost/database`
- **Health Check Endpoint**: `http://localhost/health`
- **Interactive OpenAPI Documentation**: `http://localhost/docs`

### 9. Stopping & Restarting Services
```bash
# Stop containers without removing volume data
docker compose stop

# Restart containers (data is completely preserved)
docker compose start

# Graceful restart of all containers
docker compose restart

# Tear down containers (named volume airtrack_mongodb_data is preserved)
docker compose down

# Tear down containers AND remove database volume (DESTRUCTIVE)
docker compose down -v
```

---

## Part B: AWS EC2 Deployment (Ubuntu LTS)

### 1. Recommended EC2 Instance Provisioning
- **AMI**: Ubuntu Server 24.04 LTS (Noble Numbat) or 22.04 LTS (Jammy Jellyfish), 64-bit (x86_64).
- **Instance Type**:
  - Minimum: `t3.medium` (2 vCPU, 4 GB RAM) — suitable for indexing 50,000 records.
  - Recommended: `t3.large` or `c6i.large` (2 vCPU, 4–8 GB RAM) — recommended for higher analytics concurrency.
- **Storage**: At least **30 GB** gp3 SSD (accommodates Docker images, MongoDB indexes, and system overhead).

---

### 2. AWS Security Group Configuration

Configure the EC2 Security Group inbound rules strictly according to the principle of least privilege:

| Type | Protocol | Port Range | Source | Justification |
| :--- | :--- | :--- | :--- | :--- |
| **SSH** | TCP | 22 | `YOUR_PUBLIC_IP/32` | Administrative shell access restricted to your exact IP |
| **HTTP** | TCP | 80 | `0.0.0.0/0` (or company subnet) | Public access to Nginx web frontend & reverse proxy |
| **HTTPS** | TCP | 443 | `0.0.0.0/0` | SSL/TLS access (for future domain configuration) |

> [!CAUTION]
> **DO NOT open Port 27017 (MongoDB) or Port 8000 (FastAPI)** in the AWS Security Group. Both services communicate strictly across Docker's private bridge network.

---

### 3. Install Docker Engine on Ubuntu EC2

SSH into your Ubuntu instance:
```bash
ssh -i /path/to/your-key.pem ubuntu@<EC2-PUBLIC-IP>
```

Install official Docker Engine and Docker Compose V2 plugin:
```bash
# Update package index and install certificates
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# Add Docker official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository to Apt sources
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker packages
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable Docker service and grant ubuntu user permissions
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu

# Apply group membership without logging out
newgrp docker

# Verify installations
docker --version
docker compose version
```

---

### 4. Clone Repository & Configure Environment

Clone the repository to the EC2 instance:
```bash
git clone https://github.com/<your-username>/AirTrack.git
cd AirTrack
```

Set up the production environment file:
```bash
cp .env.example .env
```

Review/edit the `.env` settings:
```bash
nano .env
```
Ensure production variables:
```env
PROJECT_NAME=AirTrack — Air Traffic Data Management and Analytics
DEBUG=False
PORT=80
API_PREFIX=/api
MONGO_URI=mongodb://mongo:27017
MONGO_DB_NAME=AirTrafficDB
CORS_ORIGINS=*
```

---

### 5. Launch the Application Stack

Build and start the services:
```bash
docker compose up -d --build
```

Verify service health:
```bash
docker compose ps
```

---

### 6. Seed the MongoDB Database on EC2

Run the seeding command inside the backend container to populate the MongoDB persistent volume:
```bash
docker compose exec backend python /app/data/scripts/seed_mongodb.py
```
This loads:
- **100** airports
- **50** airlines
- **20** aircraft types
- **50,000** flights
- All geospatial, text, and compound indexes.

---

### 7. Accessing the Deployment
In your web browser, enter:
```
http://<EC2-PUBLIC-IP>/
```
- Test navigation across Dashboard, Airspace, Flights, Analytics, and Database status.
- Press **Ctrl+F5** or reload directly on `/flights` to confirm Nginx SPA fallback routing functions properly.

---

### 8. Application Updates (CI/CD Deployment Flow)
When you push updates to GitHub, update the EC2 instance with zero data loss:
```bash
cd ~/AirTrack

# Pull latest code
git pull origin main

# Rebuild and recreate only changed containers
docker compose up -d --build

# Verify container status
docker compose ps
```
The persistent named volume `airtrack_mongodb_data` remains untouched, preserving all flight records and updates.

---

### 9. Database Backup & Disaster Recovery

#### A. Take a Database Backup:
```bash
# Create local backup directory on EC2
mkdir -p ~/backups

# Dump database to host archive
docker compose exec -T mongo mongodump \
  --db=AirTrafficDB \
  --archive > ~/backups/airtrack_dump_$(date +%Y%m%d_%H%M%S).archive
```

#### B. Restore from Backup:
```bash
# Restore archive into MongoDB container
docker compose exec -T mongo mongorestore \
  --archive < ~/backups/airtrack_dump_<TIMESTAMP>.archive \
  --drop
```

---

## Part C: Troubleshooting & Diagnostics

### 1. MongoDB Connection Failures
**Symptom**: `airtrack-backend` status is `(unhealthy)` or exits immediately.
- **Cause**: Backend cannot reach MongoDB at `mongodb://mongo:27017`.
- **Diagnostic**:
  ```bash
  docker compose logs backend
  docker compose logs mongo
  ```
- **Check MongoDB Health**:
  ```bash
  docker compose exec mongo mongosh --eval 'db.runCommand("ping")'
  ```
- **Verification**: Check if Docker network is healthy:
  ```bash
  docker network inspect airtrack-network
  ```

### 2. Frontend 502 Bad Gateway / Connection Refused
**Symptom**: Nginx displays `502 Bad Gateway` when browsing `/api/...` or `/health`.
- **Cause**: Backend container is restarting or failing health check.
- **Diagnostic**:
  ```bash
  docker compose ps
  docker compose logs --tail=50 backend
  ```
- Check if backend is listening on `0.0.0.0:8000` inside the container:
  ```bash
  docker compose exec backend python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8000/health').read().decode())"
  ```

### 3. SPA 404 on Browser Refresh
**Symptom**: Navigating to `http://<EC2-IP>/flights` directly returns Nginx `404 Not Found`.
- **Cause**: Nginx is attempting to find a directory `/flights` instead of delegating to `index.html`.
- **Fix**: Verify `frontend/nginx.conf` contains the SPA fallback rule:
  ```nginx
  location / {
      try_files $uri $uri/ /index.html;
  }
  ```

### 4. Database Seeding Script Fails
**Symptom**: Seeding script reports `FileNotFoundError` or permission issues.
- **Cause**: Dataset files missing from `/app/data/generated`.
- **Diagnostic**:
  ```bash
  docker compose exec backend ls -lah /app/data/generated
  ```
- Verify that `data/generated/flights.json` exists (~75 MB) and is accessible.
- If data directory is corrupted, run safe verify mode:
  ```bash
  docker compose exec backend python /app/data/scripts/seed_mongodb.py --verify-only
  ```

### 5. Inspecting Container Resource Usage
```bash
docker stats --no-stream
```
Monitor CPU and memory consumption across `airtrack-mongo`, `airtrack-backend`, and `airtrack-frontend`.
