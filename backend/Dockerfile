FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# FIX: In newer Debian versions, 'libgl1-mesa-glx' is removed. 
# We use 'libgl1' instead.
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Cloud Run injects the PORT variable automatically
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}