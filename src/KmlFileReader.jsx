import React, { useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
import * as tj from "togeojson";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./styles/kml.module.css";

const KmlFileReader = () => {
  const [geoData, setGeoData] = useState(null);
  const [summary, setSummary] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const kml = new DOMParser().parseFromString(e.target.result, "text/xml");

      //convert kML to GeoJSON
      const converted = tj.kml(kml);
      setGeoData(converted);

      // Calculate Summary
      const counts = {};
      converted.features.forEach((feature) => {
        const type = feature.geometry.type;
        counts[type] = (counts[type] || 0) + 1;
      });
      setSummary(counts);
    };
    reader.readAsText(file);
  };

  const calculateTotalLength = (coordinates) => {
    let totalLength = 0;
    for (let i = 1; i < coordinates.length; i++) {
      const [lat1, lon1] = coordinates[i - 1];
      const [lat2, lon2] = coordinates[i];
      const point1 = L.latLng(lat1, lon1);
      const point2 = L.latLng(lat2, lon2);
      totalLength += point1.distanceTo(point2) / 1000; // Convert to km
    }
    return totalLength.toFixed(2);
  };

  const handelReset = () => {
    setGeoData(null);
    setSummary(null);

    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  return (
    <div>
      <h2 className={styles.heading}>KML File Reader & Map Vivewer</h2>
      <input
        className={styles.fileInput}
        type="file"
        accept=".kml"
        onChange={handleFileUpload}
      />

      {geoData && (
        <div>
          <button
            className={styles.ctrlbtn}
            onClick={() => alert(JSON.stringify(summary, null, 2))}
          >
            Summary
          </button>
          <button
            className={styles.ctrlbtn}
            onClick={() => {
              const detailed = geoData.features
                .filter((f) => f.geometry.type.includes("Line"))
                .map((f) => ({
                  type: f.geometry.type,
                  length: calculateTotalLength(f.geometry.coordinates),
                }));
              alert(JSON.stringify(detailed, null, 2));
            }}
          >
            Detailed
          </button>

          <button className={styles.ctrlbtn} onClick={handelReset}>
            Reset
          </button>

          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            style={{ height: "500px", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {geoData.features.map((feature, index) => {
              if (feature.geometry.type === "Point") {
                return (
                  <Marker
                    key={index}
                    position={feature.geometry.coordinates.reverse()}
                  />
                );
              }
              if (feature.geometry.type.includes("Line")) {
                return (
                  <Polyline
                    key={index}
                    positions={feature.geometry.coordinates.map((c) =>
                      c.reverse()
                    )}
                    color="blue"
                  />
                );
              }
              return null;
            })}
          </MapContainer>
        </div>
      )}
    </div>
  );
};

export default KmlFileReader;
