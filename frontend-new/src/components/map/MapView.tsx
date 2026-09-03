import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Contact, NavWaypoint } from '../../types/detection';

interface MapViewProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  navTrack: NavWaypoint[];
  onSelectContact: (contact: Contact) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  contacts,
  selectedContact,
  navTrack,
  onSelectContact
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const [mapReady, setMapReady] = useState<boolean>(false);

  // Default coordinate center (Coastal India test coordinates)
  const defaultCenter: [number, number] = [76.5435, 11.2348];

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'carto-dark': {
              type: 'raster',
              tiles: [
                'https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
                'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
              ],
              tileSize: 256,
              attribution: '© CartoDB, © OpenStreetMap'
            }
          },
          layers: [
            {
              id: 'carto-dark-layer',
              type: 'raster',
              source: 'carto-dark',
              minzoom: 0,
              maxzoom: 19
            }
          ]
        },
        center: defaultCenter,
        zoom: 15,
        attributionControl: false
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

      map.on('load', () => {
        mapInstance.current = map;
        setMapReady(true);
      });

      return () => {
        map.remove();
        mapInstance.current = null;
      };
    } catch (err) {
      console.warn('MapLibre init error:', err);
    }
  }, []);

  // Update Markers
  useEffect(() => {
    if (!mapInstance.current || !mapReady) return;
    const map = mapInstance.current;

    // Clear old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    contacts.forEach(contact => {
      if (contact.latitude == null || contact.longitude == null) return;

      const isSelected = selectedContact?.contact_id === contact.contact_id;
      const el = document.createElement('div');
      el.className = 'cursor-pointer select-none transition-transform hover:scale-125';

      let bg = '#ff383c'; // Placely Vivid Red for high priority
      let glow = '0 0 14px rgba(255, 56, 60, 0.8)';
      if (contact.priority === 'MEDIUM') {
        bg = '#ffd400'; // Placely Yellow Accent
        glow = '0 0 12px rgba(255, 212, 0, 0.8)';
      } else if (contact.priority === 'LOW') {
        bg = '#8e8e93';
        glow = '0 0 8px rgba(142, 142, 147, 0.6)';
      }

      el.innerHTML = `
        <div style="
          background-color: ${bg};
          width: ${isSelected ? '26px' : '20px'};
          height: ${isSelected ? '26px' : '20px'};
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: ${glow};
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          font-weight: 800;
          color: ${contact.priority === 'MEDIUM' ? '#1f1f1f' : '#ffffff'};
        ">
          ${contact.contact_id}
        </div>
      `;

      el.addEventListener('click', () => {
        onSelectContact(contact);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([contact.longitude, contact.latitude])
        .addTo(map);

      markersRef.current[contact.contact_id] = marker;
    });
  }, [contacts, selectedContact, mapReady, onSelectContact]);

  // Center map on selected contact
  useEffect(() => {
    if (!mapInstance.current || !selectedContact) return;
    if (selectedContact.longitude != null && selectedContact.latitude != null) {
      mapInstance.current.flyTo({
        center: [selectedContact.longitude, selectedContact.latitude],
        zoom: 16,
        essential: true,
        speed: 1.2
      });
    }
  }, [selectedContact]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};
