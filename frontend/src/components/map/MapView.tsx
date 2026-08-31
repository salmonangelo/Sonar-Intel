import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Contact, NavWaypoint } from '../../types/detection';
import { MapPin, Navigation, Compass, Layers } from 'lucide-react';

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

  // Default coordinate center (Arabian Sea / Coastal India test coordinates from demo)
  const defaultCenter: [number, number] = [76.5435, 11.2348];

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: [
                'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
              ],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors'
            }
          },
          layers: [
            {
              id: 'osm-tiles-layer',
              type: 'raster',
              source: 'osm-tiles',
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

      let bg = '#38bdf8';
      let shadow = '0 0 10px rgba(56, 189, 248, 0.6)';
      if (contact.priority === 'HIGH') {
        bg = '#ef4444';
        shadow = '0 0 12px rgba(239, 68, 68, 0.8)';
      } else if (contact.priority === 'MEDIUM') {
        bg = '#f59e0b';
        shadow = '0 0 10px rgba(245, 158, 11, 0.7)';
      }

      el.innerHTML = `
        <div style="
          background-color: ${bg};
          width: ${isSelected ? '22px' : '16px'};
          height: ${isSelected ? '22px' : '16px'};
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: ${shadow};
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: monospace;
          font-size: 8px;
          font-weight: bold;
          color: #000;
        ">
          ${contact.contact_id[contact.contact_id.length - 1]}
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
        essential: true
      });
    }
  }, [selectedContact]);

  return (
    <div className="relative flex-1 h-full w-full bg-[#070e1a] overflow-hidden select-none">
      {/* MapLibre DOM container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 p-2 rounded bg-[#070e1a]/90 backdrop-blur border border-[#1a2f4c] text-[11px] font-mono space-y-1 z-10">
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
          SPATIAL CONTACTS
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
          <span className="text-slate-300">HIGH PRIORITY</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b]" />
          <span className="text-slate-300">MEDIUM PRIORITY</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_6px_#38bdf8]" />
          <span className="text-slate-300">LOW PRIORITY</span>
        </div>
      </div>

      {/* Coordinate & Heading Telemetry */}
      {selectedContact && selectedContact.latitude != null && (
        <div className="absolute top-3 left-3 p-2 rounded bg-[#070e1a]/90 backdrop-blur border border-[#1a2f4c] text-xs font-mono text-cyan-300 flex items-center gap-2 z-10">
          <Navigation className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            {selectedContact.latitude.toFixed(6)}°N, {selectedContact.longitude?.toFixed(6)}°E
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-400">
            {selectedContact.localization_status}
          </span>
        </div>
      )}
    </div>
  );
};
