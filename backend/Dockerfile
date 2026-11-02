# Official Python 3.13 slim base image
FROM python:3.13-slim

WORKDIR /app

# Optimize Python execution in container
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Install dependencies with layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code (venv and .env excluded via .dockerignore)
COPY . .

# Expose backend port internally
EXPOSE 8000

# Container health check using Python standard library (no extra tools needed)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request, sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=5).getcode() == 200 else 1)"

# Run production Uvicorn ASGI server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
