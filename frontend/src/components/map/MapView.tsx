import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Contact, NavWaypoint } from '../../types/detection';
import { 
  Layers, 
  Compass, 
  Maximize2, 
  Plus, 
  Minus, 
  Home, 
  Globe,
  X,
  MapPin,
  ShieldAlert,
  Crosshair,
  ExternalLink,
  Activity,
  CheckCircle2
} from 'lucide-react';

interface MapViewProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  navTrack: NavWaypoint[];
  onSelectContact: (contact: Contact) => void;
}

// Curated active ocean candidates with distinct risk levels (Red = High Risk, Orange = Medium Risk, Green = Low Risk)
// Exactly 4 curated candidates situated safely in the offshore Indian Ocean corridor (> 12-16 km offshore)
export const DEFAULT_OCEAN_CANDIDATES: Contact[] = [
  {
    contact_id: 'C001',
    survey_id: 'SURV_VIATOR_04_BENCHMARK',
    class_name: 'shipwreck_structural_rib',
    confidence: 0.88,
    bbox: { x1: 609, y1: 1024, x2: 753, y2: 1118 },
    priority: 'HIGH',
    review_status: 'AI_CANDIDATE',
    localization_status: 'ESTIMATED',
    latitude: 13.072000,
    longitude: 80.416000,
    shadow_evidence: 0.88,
    context_score: 0.91,
    data_quality: 0.95,
    review_note: 'Prominent acoustic shadow deficit; high risk wreck target',
    model_version: 'Acoustic-YOLOv8s-v1.0'
  },
  {
    contact_id: 'C002',
    survey_id: 'SURV_VIATOR_04_BENCHMARK',
    class_name: 'iron_hull_plate',
    confidence: 0.83,
    bbox: { x1: 1021, y1: 1053, x2: 1151, y2: 1154 },
    priority: 'HIGH',
    review_status: 'AI_CANDIDATE',
    localization_status: 'ESTIMATED',
    latitude: 13.070000,
    longitude: 80.414000,
    shadow_evidence: 0.82,
    context_score: 0.87,
    data_quality: 0.92,
    review_note: 'Heavy iron hull plate contact with sharp specular highlight',
    model_version: 'Acoustic-YOLOv8s-v1.0'
  },
  {
    contact_id: 'C003',
    survey_id: 'SURV_VIATOR_04_BENCHMARK',
    class_name: 'cargo_crate_debris',
    confidence: 0.67,
    bbox: { x1: 419, y1: 977, x2: 640, y2: 1136 },
    priority: 'MEDIUM',
    review_status: 'AI_CANDIDATE',
    localization_status: 'ESTIMATED',
    latitude: 13.068000,
    longitude: 80.412000,
    shadow_evidence: 0.64,
    context_score: 0.75,
    data_quality: 0.88,
    review_note: 'Medium risk rectangular container debris cluster',
    model_version: 'Acoustic-YOLOv8s-v1.0'
  },
  {
    contact_id: 'C004',
    survey_id: 'SURV_VIATOR_04_BENCHMARK',
    class_name: 'anchor_chain_link',
    confidence: 0.42,
    bbox: { x1: 290, y1: 1024, x2: 638, y2: 1079 },
    priority: 'LOW',
    review_status: 'CONFIRMED',
    localization_status: 'ESTIMATED',
    latitude: 13.066000,
    longitude: 80.410000,
    shadow_evidence: 0.38,
    context_score: 0.45,
    data_quality: 0.96,
    review_note: 'Low risk benign mooring tackle contact (Confirmed)',
    model_version: 'Acoustic-YOLOv8s-v1.0'
  }
];

export const DEFAULT_NAV_TRACK: NavWaypoint[] = [
  { ping_id: 1, latitude: 13.036000, longitude: 80.380000, heading: 42.0 },
  { ping_id: 25, latitude: 13.052000, longitude: 80.396000, heading: 42.0 },
  { ping_id: 50, latitude: 13.064000, longitude: 80.408000, heading: 42.0 },
  { ping_id: 75, latitude: 13.076000, longitude: 80.420000, heading: 42.0 },
  { ping_id: 100, latitude: 13.088000, longitude: 80.432000, heading: 42.0 },
  { ping_id: 125, latitude: 13.104000, longitude: 80.448000, heading: 42.0 }
];

// Helper to determine dot color and floating card style based on actual Risk Level & Review Status
function getRiskTheme(contact: Contact) {
  const isConfirmed = contact.review_status === 'CONFIRMED';
  const riskPercent = Math.round((contact.confidence || 0.80) * 100);

  // Confirmed / Verified Debris -> Emerald Green
  if (isConfirmed) {
    return {
      bg: '#10b981',
      dotColor: '#10b981',
      glow: '0 0 16px rgba(16, 185, 129, 0.95)',
      ringColor: 'rgba(16, 185, 129, 0.45)',
      badgeBg: 'bg-emerald-50',
      badgeBorder: 'border-emerald-200',
      badgeText: 'text-emerald-700',
      riskPillBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      label: 'Confirmed Debris',
      type: 'low'
    };
  }

  // Low Priority -> Green (< 50% or priority LOW)
  if (contact.priority === 'LOW' || (contact.priority !== 'HIGH' && contact.priority !== 'MEDIUM' && riskPercent < 50)) {
    return {
      bg: '#10b981',
      dotColor: '#10b981',
      glow: '0 0 16px rgba(16, 185, 129, 0.95)',
      ringColor: 'rgba(16, 185, 129, 0.45)',
      badgeBg: 'bg-emerald-50',
      badgeBorder: 'border-emerald-200',
      badgeText: 'text-emerald-700',
      riskPillBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      label: 'Low Risk',
      type: 'low'
    };
  }
  
  // Medium Priority -> Orange (50% to 74% or priority MEDIUM)
  if (contact.priority === 'MEDIUM' || (contact.priority !== 'HIGH' && riskPercent < 75)) {
    return {
      bg: '#f97316',
      dotColor: '#f97316',
      glow: '0 0 16px rgba(249, 115, 22, 0.95)',
      ringColor: 'rgba(249, 115, 22, 0.45)',
      badgeBg: 'bg-amber-50',
      badgeBorder: 'border-amber-200',
      badgeText: 'text-amber-700',
      riskPillBg: 'bg-amber-50 text-amber-700 border-amber-200',
      label: 'Medium Risk',
      type: 'medium'
    };
  }

  // High Priority -> Red (>= 75% or priority HIGH)
  return {
    bg: '#ef4444',
    dotColor: '#ef4444',
    glow: '0 0 18px rgba(239, 68, 68, 0.95)',
    ringColor: 'rgba(239, 68, 68, 0.5)',
    badgeBg: 'bg-rose-50',
    badgeBorder: 'border-rose-200',
    badgeText: 'text-rose-700',
    riskPillBg: 'bg-rose-50 text-rose-700 border-rose-200',
    label: 'High Risk',
    type: 'high'
  };
}

// Mathematical projection helper to strictly align candidate dots directly onto the surveyor trackline
function snapToTrackline(
  lat: number,
  lng: number,
  track: NavWaypoint[]
): { latitude: number; longitude: number } {
  if (!track || track.length === 0) return { latitude: lat, longitude: lng };
  if (track.length === 1) return { latitude: track[0].latitude, longitude: track[0].longitude };

  let minDistanceSq = Infinity;
  let bestLat = lat;
  let bestLng = lng;

  for (let i = 0; i < track.length - 1; i++) {
    const p1 = track[i];
    const p2 = track[i + 1];
    if (p1.latitude == null || p1.longitude == null || p2.latitude == null || p2.longitude == null) continue;

    const x1 = p1.longitude;
    const y1 = p1.latitude;
    const x2 = p2.longitude;
    const y2 = p2.latitude;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;

    if (lenSq < 1e-12) {
      const dSq = (lng - x1) ** 2 + (lat - y1) ** 2;
      if (dSq < minDistanceSq) {
        minDistanceSq = dSq;
        bestLat = y1;
        bestLng = x1;
      }
      continue;
    }

    const t = Math.max(0, Math.min(1, ((lng - x1) * dx + (lat - y1) * dy) / lenSq));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    const distSq = (lng - projX) ** 2 + (lat - projY) ** 2;

    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      bestLat = projY;
      bestLng = projX;
    }
  }

  return {
    latitude: Number(bestLat.toFixed(6)),
    longitude: Number(bestLng.toFixed(6))
  };
}

// 100% Free, open, high-resolution tile sources with ZERO API keys, ZERO watermarks & ZERO missing tile banners.
const BASEMAP_STYLES = {
  osm: {
    name: 'OpenStreetMap Hydrographic Standard',
    tiles: [
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    ],
    referenceTiles: [],
    maxzoom: 19,
    referenceMaxzoom: 19,
    attribution: '© OpenStreetMap contributors'
  },
  tactical_dark: {
    name: 'Dark Map',
    tiles: [
      'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
    ],
    referenceTiles: [
      'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}'
    ],
    maxzoom: 16,
    referenceMaxzoom: 16,
    attribution: '© Esri, HERE, Garmin'
  },
  osm_hot: {
    name: 'OSM Maritime & Coastal Chart',
    tiles: [
      'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
    ],
    referenceTiles: [],
    maxzoom: 19,
    referenceMaxzoom: 19,
    attribution: '© OpenStreetMap contributors, Humanitarian OSM Team'
  },
  satellite: {
    name: 'Maritime Satellite + High-Res Labels',
    tiles: [
      'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    ],
    referenceTiles: [
      'https://services.arcgisonline.com/arcgis/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
    ],
    maxzoom: 12,
    referenceMaxzoom: 12,
    attribution: '© Esri, Maxar, Earthstar Geographics'
  },
  bathymetry: {
    name: 'Indian Ocean Bathymetry & Seabed Relief',
    tiles: [
      'https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}'
    ],
    referenceTiles: [
      'https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}'
    ],
    maxzoom: 10,
    referenceMaxzoom: 10,
    attribution: '© Esri, GEBCO, NOAA, National Geographic'
  },
  topo: {
    name: 'World Topographic & Coastal Contours',
    tiles: [
      'https://services.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
    ],
    referenceTiles: [],
    maxzoom: 18,
    referenceMaxzoom: 18,
    attribution: '© Esri, USGS, NOAA'
  }
};

type BasemapKey = keyof typeof BASEMAP_STYLES;

function createMapLibreStyle(styleConf: typeof BASEMAP_STYLES[BasemapKey]) {
  const sources: Record<string, any> = {
    'basemap-source': {
      type: 'raster',
      tiles: styleConf.tiles,
      tileSize: 256,
      maxzoom: styleConf.maxzoom || 19,
      attribution: styleConf.attribution
    }
  };

  const layers: any[] = [
    {
      id: 'basemap-layer',
      type: 'raster',
      source: 'basemap-source',
      minzoom: 0,
      maxzoom: 22
    }
  ];

  if (styleConf.referenceTiles && styleConf.referenceTiles.length > 0) {
    sources['reference-source'] = {
      type: 'raster',
      tiles: styleConf.referenceTiles,
      tileSize: 256,
      maxzoom: styleConf.referenceMaxzoom || styleConf.maxzoom || 19
    };
    layers.push({
      id: 'reference-layer',
      type: 'raster',
      source: 'reference-source',
      minzoom: 0,
      maxzoom: 22
    });
  }

  return {
    version: 8,
    sources,
    layers
  };
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
  const [activeBasemap, setActiveBasemap] = useState<BasemapKey>('osm');
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);
  const [showTrackline, setShowTrackline] = useState<boolean>(true); // Trackline visible by default
  const [activeFloatingCard, setActiveFloatingCard] = useState<Contact | null>(selectedContact || null);

  // Sync floating card when selectedContact changes externally
  useEffect(() => {
    if (selectedContact) {
      setActiveFloatingCard(selectedContact);
    }
  }, [selectedContact]);

  // 1. Construct a continuous, high-fidelity surveyor trackline
  const effectiveNavTrack: NavWaypoint[] = React.useMemo(() => {
    if (navTrack && navTrack.length > 1) {
      return navTrack;
    }
    return DEFAULT_NAV_TRACK;
  }, [navTrack]);

  // 2. Memoize strictly 4 ocean candidates aligned directly onto the surveyor trackline
  const effectiveContacts = React.useMemo(() => {
    const rawList = (contacts && contacts.length > 0) ? contacts : DEFAULT_OCEAN_CANDIDATES;
    const sourceContacts = rawList.slice(0, 4);

    return sourceContacts.map((c, idx) => {
      let targetLat = c.latitude;
      let targetLng = c.longitude;

      // Check if this contact has duplicate or clustered coordinates with preceding contacts
      const isClusteredWithPreceding = idx > 0 && sourceContacts.slice(0, idx).some(
        prev => prev.latitude != null && prev.longitude != null &&
          Math.abs(prev.latitude - (targetLat ?? 0)) < 0.003 &&
          Math.abs(prev.longitude - (targetLng ?? 0)) < 0.003
      );

      if (targetLat == null || targetLng == null || isClusteredWithPreceding) {
        // Distribute proportionally along the surveyor trackline
        const waypointRatios = [0.80, 0.60, 0.40, 0.20];
        const ratio = waypointRatios[idx] ?? ((idx + 1) / (sourceContacts.length + 1));
        const ptIndex = Math.max(
          0,
          Math.min(effectiveNavTrack.length - 1, Math.round(ratio * (effectiveNavTrack.length - 1)))
        );
        targetLat = effectiveNavTrack[ptIndex]?.latitude ?? (13.0520 + idx * 0.0120);
        targetLng = effectiveNavTrack[ptIndex]?.longitude ?? (80.3960 + idx * 0.0120);
      }

      // Mathematical projection: snap candidate center directly onto the surveyor trackline
      const snapped = snapToTrackline(targetLat, targetLng, effectiveNavTrack);

      return {
        ...c,
        latitude: snapped.latitude,
        longitude: snapped.longitude,
        localization_status: c.localization_status || 'ESTIMATED'
      };
    });
  }, [contacts, effectiveNavTrack]);

  // Counts by actual risk theme
  const highCount = effectiveContacts.filter(c => getRiskTheme(c).type === 'high').length;
  const medCount = effectiveContacts.filter(c => getRiskTheme(c).type === 'medium').length;
  const lowCount = effectiveContacts.filter(c => getRiskTheme(c).type === 'low').length;

  // Default coordinate center (framing both Chennai coastal land on left and ocean survey on right)
  const defaultCenter: [number, number] = [80.3650, 13.0700];

  // Render high-visibility surveyor trackline, glowing corridor & swath boundary
  const renderTrackline = (map: maplibregl.Map) => {
    if (!map) return;

    const trackSourceId = 'towfish-track-source';
    const trackGlowId = 'towfish-track-glow';
    const trackOutlineId = 'towfish-track-outline';
    const trackLayerId = 'towfish-track-line';
    const trackCoreId = 'towfish-track-core';
    const swathBandId = 'towfish-swath-band';

    if (!showTrackline || !effectiveNavTrack || effectiveNavTrack.length === 0) {
      try {
        if (map.getLayer(trackCoreId)) map.removeLayer(trackCoreId);
        if (map.getLayer(trackLayerId)) map.removeLayer(trackLayerId);
        if (map.getLayer(trackOutlineId)) map.removeLayer(trackOutlineId);
        if (map.getLayer(trackGlowId)) map.removeLayer(trackGlowId);
        if (map.getLayer(swathBandId)) map.removeLayer(swathBandId);
        if (map.getSource(trackSourceId)) map.removeSource(trackSourceId);
      } catch (e) {}
      return;
    }

    const coordinates = effectiveNavTrack
      .filter(p => p.latitude != null && p.longitude != null)
      .map(p => [p.longitude, p.latitude]);

    if (coordinates.length < 2) return;

    const geoData: any = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coordinates
      }
    };

    const existingSource = map.getSource(trackSourceId) as maplibregl.GeoJSONSource | undefined;
    if (existingSource && typeof existingSource.setData === 'function') {
      existingSource.setData(geoData);
      return;
    }

    try {
      map.addSource(trackSourceId, {
        type: 'geojson',
        data: geoData
      });

      // 1. Swath Acoustic Footprint Band (50m Port/Starboard Coverage)
      map.addLayer({
        id: swathBandId,
        type: 'line',
        source: trackSourceId,
        paint: {
          'line-color': '#0284c7',
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 14, 11, 28, 16, 65],
          'line-opacity': 0.25
        }
      });

      // 2. High-Contrast Outer Navy Outline
      map.addLayer({
        id: trackOutlineId,
        type: 'line',
        source: trackSourceId,
        paint: {
          'line-color': '#0f172a',
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 5.5, 11, 7, 16, 11],
          'line-opacity': 0.85
        }
      });

      // 3. Glowing Neon Cyan Aura
      map.addLayer({
        id: trackGlowId,
        type: 'line',
        source: trackSourceId,
        paint: {
          'line-color': '#00d4ff',
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 3.5, 11, 5, 16, 8],
          'line-opacity': 0.95
        }
      });

      // 4. Primary Vessel / Towfish Dashed Trackline
      map.addLayer({
        id: trackLayerId,
        type: 'line',
        source: trackSourceId,
        paint: {
          'line-color': '#2563eb',
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 2.5, 11, 3.5, 16, 5],
          'line-opacity': 1.0,
          'line-dasharray': [3, 2]
        }
      });

      // 5. Razor Sharp White Core Line
      map.addLayer({
        id: trackCoreId,
        type: 'line',
        source: trackSourceId,
        paint: {
          'line-color': '#ffffff',
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.2, 11, 1.8, 16, 2.2],
          'line-opacity': 1.0
        }
      });
    } catch (err) {
      console.warn('Trackline rendering note:', err);
    }
  };

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    try {
      const initialStyle = BASEMAP_STYLES[activeBasemap] || BASEMAP_STYLES.osm;
      const styleObject = createMapLibreStyle(initialStyle);

      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: styleObject as any,
        center: selectedContact && selectedContact.longitude != null && selectedContact.latitude != null
          ? [selectedContact.longitude, selectedContact.latitude]
          : defaultCenter,
        zoom: selectedContact ? 16 : 10.8,
        minZoom: 1,
        maxZoom: 22,
        attributionControl: false
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: false }), 'top-right');
      map.addControl(new maplibregl.ScaleControl({ maxWidth: 150, unit: 'metric' }), 'bottom-right');

      map.on('load', () => {
        mapInstance.current = map;
        setMapReady(true);
        renderTrackline(map);
        map.resize();
      });

      return () => {
        map.remove();
        mapInstance.current = null;
      };
    } catch (err) {
      console.warn('MapLibre init error:', err);
    }
  }, []);

  // Resize map when container changes
  useEffect(() => {
    if (mapInstance.current && mapReady) {
      mapInstance.current.resize();
    }
  }, [mapReady]);

  // Switch basemap layer dynamically
  const handleSwitchBasemap = (key: BasemapKey) => {
    setActiveBasemap(key);
    setShowLayerMenu(false);
    if (!mapInstance.current || !mapReady) return;
    const map = mapInstance.current;
    const styleConf = BASEMAP_STYLES[key];
    const styleObj = createMapLibreStyle(styleConf);

    map.setStyle(styleObj as any);
    map.once('style.load', () => {
      renderTrackline(map);
      map.resize();
    });
  };

  // Redraw trackline when settings or track changes
  useEffect(() => {
    if (!mapInstance.current || !mapReady) return;
    renderTrackline(mapInstance.current);
  }, [effectiveNavTrack, mapReady, showTrackline, activeBasemap]);

  // Track whether initial framing has occurred
  const hasInitializedCamera = useRef<boolean>(false);

  // Render Candidate Dots with High-Performance Dynamic Zoom Scaling (Zero Land Overlap)
  useEffect(() => {
    if (!mapInstance.current || !mapReady) return;
    const map = mapInstance.current;

    // Clear old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    const validContacts = effectiveContacts.filter(
      c => c.latitude != null && c.longitude != null
    );

    // Track structured sub-elements for fast CSS-only zoom resizing (no DOM destroying)
    const markerElements: {
      el: HTMLElement;
      halo: HTMLElement;
      dot: HTMLElement;
      label: HTMLElement;
      tag: HTMLElement;
      contact: Contact;
      isSelected: boolean;
      riskTheme: ReturnType<typeof getRiskTheme>;
    }[] = [];

    validContacts.forEach(contact => {
      const isSelected = selectedContact?.contact_id === contact.contact_id;
      const riskPercent = Math.round((contact.confidence || 0.80) * 100);
      const riskTheme = getRiskTheme(contact);

      const el = document.createElement('div');
      el.className = 'candidate-map-marker';
      el.style.cursor = 'pointer';
      el.style.position = 'relative';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.zIndex = isSelected ? '40' : '20';
      el.setAttribute('title', `${contact.contact_id}: ${contact.class_name.replace(/_/g, ' ')} (${riskPercent}% Risk)`);

      // 1. Pulsing Halo Ring
      const halo = document.createElement('div');
      halo.className = 'marker-halo';
      halo.style.position = 'absolute';
      halo.style.borderRadius = '50%';
      halo.style.backgroundColor = riskTheme.ringColor;
      halo.style.pointerEvents = 'none';
      halo.style.transition = 'width 0.15s ease-out, height 0.15s ease-out';
      if (isSelected) {
        halo.style.animation = 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite';
      }

      // 2. Main Colored Dot Pip
      const dot = document.createElement('div');
      dot.className = 'marker-dot';
      dot.style.position = 'relative';
      dot.style.borderRadius = '50%';
      dot.style.backgroundColor = riskTheme.bg;
      dot.style.border = '2px solid #ffffff';
      dot.style.boxShadow = riskTheme.glow;
      dot.style.display = 'flex';
      dot.style.alignItems = 'center';
      dot.style.justifyContent = 'center';
      dot.style.fontFamily = "'JetBrains Mono', monospace";
      dot.style.fontWeight = '800';
      dot.style.color = '#ffffff';
      dot.style.transition = 'width 0.15s ease-out, height 0.15s ease-out, font-size 0.15s ease-out';

      // 3. Target Label Inside Dot (visible at mid & detailed zooms)
      const label = document.createElement('span');
      label.className = 'marker-label';
      label.style.pointerEvents = 'none';
      label.textContent = contact.contact_id;
      dot.appendChild(label);

      // 4. Floating Risk Pill Below Dot (visible only at detailed close zooms)
      const tag = document.createElement('div');
      tag.className = 'marker-tag';
      tag.style.position = 'absolute';
      tag.style.top = '100%';
      tag.style.marginTop = '4px';
      tag.style.whiteSpace = 'nowrap';
      tag.style.background = 'rgba(15, 23, 42, 0.9)';
      tag.style.backdropFilter = 'blur(4px)';
      tag.style.color = '#ffffff';
      tag.style.fontFamily = "'Inter', sans-serif";
      tag.style.fontSize = '9.5px';
      tag.style.fontWeight = '700';
      tag.style.padding = '1.5px 6px';
      tag.style.borderRadius = '6px';
      tag.style.border = '1px solid rgba(255, 255, 255, 0.25)';
      tag.style.pointerEvents = 'none';
      tag.style.boxShadow = '0 4px 10px rgba(0,0,0,0.4)';
      tag.textContent = `${riskPercent}% Risk`;

      el.appendChild(halo);
      el.appendChild(dot);
      el.appendChild(tag);

      markerElements.push({
        el,
        halo,
        dot,
        label,
        tag,
        contact,
        isSelected,
        riskTheme
      });

      // Selection on Click / Touch
      const handleCandidateClick = (e: Event) => {
        e.stopPropagation();
        onSelectContact(contact);
        setActiveFloatingCard(contact);
        if (contact.longitude != null && contact.latitude != null && mapInstance.current) {
          mapInstance.current.flyTo({
            center: [contact.longitude, contact.latitude],
            zoom: 16,
            essential: true,
            duration: 600
          });
        }
      };

      el.addEventListener('click', handleCandidateClick);
      el.addEventListener('touchend', handleCandidateClick);

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([contact.longitude!, contact.latitude!])
        .addTo(map);

      markersRef.current[contact.contact_id] = marker;
    });

    // High-Performance Dynamic Sizing based on Zoom Level
    const updateMarkerSizes = () => {
      if (!mapInstance.current) return;
      const zoom = mapInstance.current.getZoom();

      markerElements.forEach(({ el, halo, dot, label, tag, contact, isSelected }) => {
        if (zoom < 7.5) {
          // Tier 1: Macro Country/Peninsula Overview (zoom < 7.5) - Micro jewel pip (6px-9px), text/tag hidden
          const dotSize = isSelected ? 9 : 6;
          el.style.width = `${dotSize}px`;
          el.style.height = `${dotSize}px`;
          dot.style.width = `${dotSize}px`;
          dot.style.height = `${dotSize}px`;
          dot.style.borderWidth = '1px';
          halo.style.display = isSelected ? 'block' : 'none';
          halo.style.width = '12px';
          halo.style.height = '12px';
          label.style.display = 'none';
          tag.style.display = 'none';
        } else if (zoom < 10.0) {
          // Tier 2: Regional View (7.5 <= zoom < 10.0) - Compact colored dot (11px-15px), subtle halo, text/tag hidden
          const dotSize = isSelected ? 15 : 11;
          el.style.width = `${dotSize}px`;
          el.style.height = `${dotSize}px`;
          dot.style.width = `${dotSize}px`;
          dot.style.height = `${dotSize}px`;
          dot.style.borderWidth = '2px';
          halo.style.display = 'block';
          halo.style.width = `${dotSize + 8}px`;
          halo.style.height = `${dotSize + 8}px`;
          label.style.display = 'none';
          tag.style.display = 'none';
        } else if (zoom < 13.0) {
          // Tier 3: Standard Dashboard & Coastal Corridor View (10.0 <= zoom < 13.0) - Prominent 22px-28px dot with clear Target ID inside
          const dotSize = isSelected ? 28 : 22;
          const haloSize = isSelected ? 38 : 30;
          el.style.width = `${haloSize}px`;
          el.style.height = `${haloSize}px`;
          dot.style.width = `${dotSize}px`;
          dot.style.height = `${dotSize}px`;
          dot.style.borderWidth = '2.5px';
          halo.style.display = 'block';
          halo.style.width = `${haloSize}px`;
          halo.style.height = `${haloSize}px`;
          label.style.display = 'inline-block';
          label.textContent = contact.contact_id;
          label.style.fontSize = isSelected ? '10px' : '8.5px';
          tag.style.display = 'none';
        } else {
          // Tier 4: Detailed Target Inspection (zoom >= 13.0) - Full 28px-34px dot with full target ID and floating risk badge
          const dotSize = isSelected ? 34 : 28;
          const haloSize = isSelected ? 46 : 38;
          el.style.width = `${haloSize}px`;
          el.style.height = `${haloSize}px`;
          dot.style.width = `${dotSize}px`;
          dot.style.height = `${dotSize}px`;
          dot.style.borderWidth = '2.5px';
          halo.style.display = 'block';
          halo.style.width = `${haloSize}px`;
          halo.style.height = `${haloSize}px`;
          label.style.display = 'inline-block';
          label.textContent = contact.contact_id;
          label.style.fontSize = isSelected ? '11px' : '9.5px';
          tag.style.display = 'block';
        }
      });
    };

    // Initial size calculation
    updateMarkerSizes();

    // Listen to zoom events for instant reactive scaling
    map.on('zoom', updateMarkerSizes);

    // Initial framing (only once on load - frames coastal land on left and ocean survey on right)
    if (!hasInitializedCamera.current && validContacts.length > 0) {
      if (selectedContact && selectedContact.longitude != null && selectedContact.latitude != null) {
        map.flyTo({
          center: [selectedContact.longitude, selectedContact.latitude],
          zoom: 16,
          essential: true,
          duration: 600
        });
      } else {
        const bounds = new maplibregl.LngLatBounds();
        // Include coastal land margin (80.2750° E, 13.0300° N) so a little bit of land is clearly visible on the west side
        bounds.extend([80.2750, 13.0300]);
        bounds.extend([80.4550, 13.1100]);
        validContacts.forEach(c => bounds.extend([c.longitude!, c.latitude!]));
        if (effectiveNavTrack) {
          effectiveNavTrack.forEach(p => {
            if (p.longitude != null && p.latitude != null) bounds.extend([p.longitude, p.latitude]);
          });
        }
        map.fitBounds(bounds, { padding: 40, maxZoom: 11.2, duration: 600 });
      }
      hasInitializedCamera.current = true;
    }

    return () => {
      map.off('zoom', updateMarkerSizes);
    };
  }, [effectiveContacts, selectedContact, mapReady, onSelectContact, effectiveNavTrack]);

  // Center map when selectedContact changes externally
  useEffect(() => {
    if (!mapInstance.current || !selectedContact) return;
    if (selectedContact.longitude != null && selectedContact.latitude != null) {
      mapInstance.current.flyTo({
        center: [selectedContact.longitude, selectedContact.latitude],
        zoom: 16,
        essential: true,
        speed: 1.4
      });
    }
  }, [selectedContact]);

  const handleRecenter = () => {
    if (!mapInstance.current) return;
    if (selectedContact && selectedContact.longitude != null && selectedContact.latitude != null) {
      mapInstance.current.flyTo({
        center: [selectedContact.longitude, selectedContact.latitude],
        zoom: 16,
        essential: true,
        duration: 800
      });
    } else {
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([80.2750, 13.0300]); // Include coastal land margin
      bounds.extend([80.4550, 13.1100]);
      const validContacts = effectiveContacts.filter(c => c.latitude != null && c.longitude != null);
      validContacts.forEach(c => bounds.extend([c.longitude!, c.latitude!]));
      if (effectiveNavTrack) {
        effectiveNavTrack.forEach(p => {
          if (p.longitude != null && p.latitude != null) bounds.extend([p.longitude, p.latitude]);
        });
      }
      mapInstance.current.fitBounds(bounds, { padding: 40, maxZoom: 11.2, duration: 800 });
    }
  };

  const handleIndiaMacroView = () => {
    if (!mapInstance.current) return;
    mapInstance.current.flyTo({
      center: [78.9629, 13.5937],
      zoom: 4.8,
      essential: true,
      duration: 1200
    });
  };

  const handleZoomIn = () => {
    if (mapInstance.current) mapInstance.current.zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    if (mapInstance.current) mapInstance.current.zoomOut({ duration: 300 });
  };

  return (
    <div className="w-full h-full relative overflow-hidden rounded-[20px] border border-[#e2e8f0] bg-[#0c121e]">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Top Left: Basemap Switcher & Navigation Overview */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="h-9 px-3.5 rounded-full bg-white/95 backdrop-blur shadow-tactile border border-[#e2e8f0] text-[#0f172a] text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Layers className="w-4 h-4 text-[#1d4ed8]" />
            <span>{BASEMAP_STYLES[activeBasemap].name}</span>
          </button>

          {showLayerMenu && (
            <div className="absolute top-11 left-0 w-64 bg-white rounded-2xl border border-[#e2e8f0] shadow-xl p-2 z-30 space-y-1 font-sans">
              <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider px-2 py-1">
                Indian Maritime Chart Style
              </div>
              {(Object.keys(BASEMAP_STYLES) as BasemapKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => handleSwitchBasemap(key)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    activeBasemap === key ? 'bg-blue-50 text-[#1d4ed8]' : 'text-[#0f172a] hover:bg-slate-50'
                  }`}
                >
                  <span>{BASEMAP_STYLES[key].name}</span>
                  {activeBasemap === key && <span className="w-2 h-2 rounded-full bg-[#1d4ed8]" />}
                </button>
              ))}

              <div className="border-t border-slate-100 my-1 pt-1">
                <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider px-2 py-1">
                  Trajectory Line
                </div>
                <button
                  onClick={() => setShowTrackline(!showTrackline)}
                  className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between hover:bg-slate-50 text-[#0f172a] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-0.5 bg-[#1d4ed8] rounded-full inline-block" />
                    Survey Trackline
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${showTrackline ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                    {showTrackline ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recenter / Fit Swath button */}
        <button
          onClick={handleRecenter}
          title="Fit bounds to Indian Ocean survey candidates"
          className="h-9 px-3 rounded-full bg-white/95 backdrop-blur shadow-tactile border border-[#e2e8f0] text-[#0f172a] text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 transition-all cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5 text-[#64748b]" />
          <span>Show All</span>
        </button>

        {/* India Macro Overview Button */}
        <button
          onClick={handleIndiaMacroView}
          title="View entire Indian Peninsula and Indian Ocean region"
          className="h-9 px-3 rounded-full bg-white/95 backdrop-blur shadow-tactile border border-[#e2e8f0] text-[#0f172a] text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 transition-all cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-[#1d4ed8]" />
          <span>Reset View</span>
        </button>
      </div>

      {/* Top Right: Zoom & Control Toolbar */}
      <div className="absolute top-4 right-14 z-20 flex flex-col items-center bg-white/95 backdrop-blur rounded-2xl border border-[#e2e8f0] shadow-tactile p-1 gap-0.5 font-sans">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="w-8 h-8 rounded-xl hover:bg-slate-100 text-[#0f172a] font-bold text-sm flex items-center justify-center transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
        <div className="w-5 h-px bg-slate-200" />
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="w-8 h-8 rounded-xl hover:bg-slate-100 text-[#0f172a] font-bold text-sm flex items-center justify-center transition-colors cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="w-5 h-px bg-slate-200" />
        <button
          onClick={handleRecenter}
          title="Reset View to Candidates"
          className="w-8 h-8 rounded-xl hover:bg-slate-100 text-[#1d4ed8] flex items-center justify-center transition-colors cursor-pointer"
        >
          <Home className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Candidate Telemetry Card (Translucent, Clear & Crisp Glassmorphism) */}
      {activeFloatingCard && (() => {
        const theme = getRiskTheme(activeFloatingCard);
        const riskPct = Math.round((activeFloatingCard.confidence || 0.80) * 100);
        return (
          <div 
            className="absolute top-14 left-4 z-30 w-64 max-w-[calc(100vw-32px)] rounded-2xl p-3.5 bg-white/75 backdrop-blur-xl border border-white/80 shadow-[0_12px_32px_-4px_rgba(15,23,42,0.12),0_0_0_1px_rgba(255,255,255,0.6)_inset] transition-all duration-300 animate-in fade-in zoom-in-95 font-sans"
          >
            {/* Top Row: Title, ID & Close Button */}
            <div className="flex items-start justify-between gap-1.5 border-b border-slate-200/50 pb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span 
                  className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
                  style={{ backgroundColor: theme.dotColor }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#0f172a] font-extrabold text-xs tracking-tight font-display truncate">
                      Candidate {activeFloatingCard.contact_id}
                    </span>
                    <span 
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${theme.badgeBg} ${theme.badgeBorder} ${theme.badgeText}`}
                    >
                      {activeFloatingCard.priority}
                    </span>
                  </div>
                  <span className="text-[10.5px] text-[#64748b] font-medium capitalize block truncate">
                    {activeFloatingCard.class_name.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveFloatingCard(null)}
                title="Dismiss Card"
                className="w-5 h-5 rounded-lg bg-slate-200/50 hover:bg-slate-300/70 text-[#64748b] hover:text-[#0f172a] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Risk & Coordinates (Translucent Clear Chips) */}
            <div className="my-2.5 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/75 backdrop-blur-md border border-white/90 shadow-xs">
                <span className="text-[11px] font-semibold text-[#475569] flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#64748b]" />
                  Risk Rating
                </span>
                <span 
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${theme.riskPillBg}`}
                >
                  {riskPct}% • {theme.label}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-white/75 backdrop-blur-md border border-white/90 shadow-xs text-[10px] space-y-1">
                <div className="flex items-center justify-between text-[9px] text-[#64748b] uppercase font-sans font-bold">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#1d4ed8]" />
                    Fix (WGS-84)
                  </span>
                  <span className="text-[#1d4ed8] font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-50/80 border border-blue-100">
                    {activeFloatingCard.localization_status || 'ESTIMATED'}
                  </span>
                </div>
                <div className="text-[10.5px] font-mono font-bold text-[#0f172a]">
                  {activeFloatingCard.latitude?.toFixed(6) ?? '13.086396'}° N, {activeFloatingCard.longitude?.toFixed(6) ?? '80.383111'}° E
                </div>
              </div>
            </div>

            {/* Card Actions */}
            <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  if (activeFloatingCard.longitude != null && activeFloatingCard.latitude != null && mapInstance.current) {
                    mapInstance.current.flyTo({
                      center: [activeFloatingCard.longitude, activeFloatingCard.latitude],
                      zoom: 16,
                      essential: true,
                      duration: 600
                    });
                  }
                }}
                className="flex-1 py-1.5 px-2 rounded-xl bg-white/80 hover:bg-white text-[#0f172a] text-[11px] font-semibold border border-white/90 flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
              >
                <Crosshair className="w-3.5 h-3.5 text-[#1d4ed8]" />
                <span>Center</span>
              </button>

              <button
                onClick={() => {
                  onSelectContact(activeFloatingCard);
                }}
                className="flex-1 py-1.5 px-2 rounded-xl bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-tactile shadow-blue-glow"
              >
                <span>Select Target</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* Bottom Left: Map Legend Overlay (Green = Low Risk, Orange = Medium Risk, Red = High Risk) */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur border border-[#e2e8f0] rounded-2xl p-3.5 shadow-tactile text-xs font-sans space-y-2 min-w-[200px]">
        <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-1">
          <span>Legend</span>
          <span className="font-mono text-[#1d4ed8] font-bold">{effectiveContacts.length} Targets</span>
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] inline-block shadow-xs animate-pulse" />
              <span className="text-[#0f172a] font-medium">High</span>
            </span>
            <span className="font-mono font-bold text-rose-600">({highCount})</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f97316] inline-block shadow-xs" />
              <span className="text-[#0f172a] font-medium">Medium</span>
            </span>
            <span className="font-mono font-bold text-orange-600">({medCount})</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] inline-block shadow-xs" />
              <span className="text-[#0f172a] font-medium">Low</span>
            </span>
            <span className="font-mono font-bold text-emerald-600">({lowCount})</span>
          </div>
        </div>
      </div>

      {/* Bottom Right: Spatial Telemetry Badge */}
      <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur border border-[#e2e8f0] rounded-xl px-3.5 py-2 shadow-tactile text-xs font-sans">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#0f172a] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            <span>Location Synced</span>
          </div>
          <div className="h-3 w-px bg-slate-200" />
          <span className="text-[11px] font-mono text-[#64748b]">
            {effectiveContacts.filter(c => c.latitude != null).length} / {effectiveContacts.length} Marked
          </span>
        </div>
      </div>
    </div>
  );
};
