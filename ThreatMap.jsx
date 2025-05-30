import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

function HeatLayer({ heatPoints }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !heatPoints.length) return;

    // Remove previous layers
    map.eachLayer((layer) => {
      if (layer._leaflet_id && layer instanceof L.HeatLayer) {
        map.removeLayer(layer);
      }
    });

    const heat = L.heatLayer(heatPoints, {
      radius: 25,
      maxZoom: 15,
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, heatPoints]);

  return null;
}

function ThreatMap() {
  const [heatPoints, setHeatPoints] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/heatmap')  // Make sure this is the endpoint that returns lat, lon, intensity
      .then(res => res.json())
      .then(data => {
        const points = (data.feed || []).map(entry => [
          entry.lat,
          entry.lon,
          entry.intensity
        ]);
        setHeatPoints(points);
      })
      .catch(err => console.error("Failed to load map feed:", err));
  }, []);

  return (
    <div className="map-wrapper">
      <h2>🌍 Scam Heatmap</h2>
      <MapContainer center={[40.7128, -74.0060]} zoom={3} style={{ height: '500px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        <HeatLayer heatPoints={heatPoints} />
      </MapContainer>

      <div className="legend">
        <p><strong>🔥 Heatmap Intensity</strong></p>
        <p><span className="legend-box high"></span> High Frequency</p>
        <p><span className="legend-box medium"></span> Medium Frequency</p>
        <p><span className="legend-box low"></span> Low Frequency</p>
      </div>
    </div>
  );
}

export default ThreatMap;
