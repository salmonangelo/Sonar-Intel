import os
import pandas as pd
import numpy as np

def generate_indian_ocean_nav_files():
    os.makedirs("data/demo/navigation", exist_ok=True)
    os.makedirs("data/raw", exist_ok=True)

    tracks = [
        {
            "name": "viator_04_nav.csv",
            "base_lat": 13.04500,  # Bay of Bengal / Deep Offshore Corridor (15 km East of Chennai)
            "base_lon": 80.40500,
            "heading": 42.0,
            "pings": 150,
            "d_lat": 0.000320,
            "d_lon": 0.000280
        },
        {
            "name": "corsican_02_nav.csv",
            "base_lat": 8.02000,   # Indian Ocean (South of Kanyakumari / Cape Comorin)
            "base_lon": 77.65000,
            "heading": 115.0,
            "pings": 150,
            "d_lat": 0.000280,
            "d_lon": 0.000350
        },
        {
            "name": "artificial_reef_02_nav.csv",
            "base_lat": 9.24500,   # Gulf of Mannar / Palk Strait (Indian Ocean Marine Sanctuary)
            "base_lon": 79.36500,
            "heading": 65.0,
            "pings": 150,
            "d_lat": 0.000300,
            "d_lon": 0.000320
        },
        {
            "name": "survey_001_nav.csv",
            "base_lat": 18.91500,  # Arabian Sea (Off Mumbai Coast, West Indian Waters)
            "base_lon": 72.72500,
            "heading": 34.5,
            "pings": 150,
            "d_lat": 0.000350,
            "d_lon": 0.000250
        }
    ]

    for t in tracks:
        rows = []
        for p in range(t["pings"]):
            lat = t["base_lat"] + (p * t["d_lat"])
            lon = t["base_lon"] + (p * t["d_lon"])
            rows.append({
                "ping_id": p + 1,
                "timestamp": f"2026-08-31T10:{p//60:02d}:{p%60:02d}Z",
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "heading": t["heading"],
                "altitude": 12.0,
                "range": 50.0
            })
        
        df = pd.DataFrame(rows)
        p1 = os.path.join("data/demo/navigation", t["name"])
        df.to_csv(p1, index=False)
        print(f"Generated Indian Ocean navigation track: {p1} ({t['base_lat']}°N, {t['base_lon']}°E)")
        
        # Also mirror in raw directory
        p2 = os.path.join("data/raw", t["name"].upper())
        df.to_csv(p2, index=False)

if __name__ == "__main__":
    generate_indian_ocean_nav_files()
