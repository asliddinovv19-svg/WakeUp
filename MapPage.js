import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import translations from '../i18n/translations';

// Leaflet loaded via CDN in public/index.html
const L = window.L;

const haversine = (p1, p2) => {
  const R = 6371000;
  const φ1 = p1[1] * Math.PI/180;
  const φ2 = p2[1] * Math.PI/180;
  const Δφ = (p2[1]-p1[1]) * Math.PI/180;
  const Δλ = (p2[0]-p1[0]) * Math.PI/180;
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

const polygonArea = (coords) => {
  if (coords.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    area += coords[i][0] * coords[j][1];
    area -= coords[j][0] * coords[i][1];
  }
  const degArea = Math.abs(area) / 2;
  return degArea * 111320 * 111320;
};

const formatDist = (m) => m >= 1000 ? `${(m/1000).toFixed(2)} km` : `${Math.round(m)} m`;
const formatTime = (s) => {
  const m = Math.floor(s/60); const sec = s%60;
  return `${m}:${sec.toString().padStart(2,'0')}`;
};
const formatArea = (sqm) => {
  if (sqm >= 1000000) return `${(sqm/1000000).toFixed(2)} km²`;
  if (sqm >= 1000) return `${(sqm/1000).toFixed(1)} ha`;
  return `${Math.round(sqm)} m²`;
};

const MapPage = () => {
  const { user, language, API, updateUser } = useAuth();
  const t = translations[language];
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const pathLayerRef = useRef(null);
  const territoryLayersRef = useRef([]);
  const markerRef = useRef(null);
  const watchRef = useRef(null);

  const [running, setRunning] = useState(false);
  const [path, setPath] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [territories, setTerritories] = useState([]);
  const [renaming, setRenaming] = useState(null);
  const [newName, setNewName] = useState('');
  const [showPanel, setShowPanel] = useState(false);

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([41.2995, 69.2401], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    mapInstance.current = map;
    fetchTerritories(map);

    // Try to center on user location
    navigator.geolocation?.getCurrentPosition(pos => {
      map.setView([pos.coords.latitude, pos.coords.longitude], 15);
    });

    return () => { map.remove(); mapInstance.current = null; };
  // eslint-disable-next-line
  }, []);

  const fetchTerritories = async (map) => {
    try {
      const { data } = await axios.get(`${API}/map/territories`);
      const terrs = data.territories || [];
      setTerritories(terrs);

      // Clear old layers
      territoryLayersRef.current.forEach(l => l.remove());
      territoryLayersRef.current = [];

      // Draw territories
      terrs.forEach(t => {
        const isMe = t.owner?._id === user?.id || t.owner?._id === user?._id;
        const latlngs = t.coordinates.map(c => [c[1], c[0]]);
        const poly = L.polygon(latlngs, {
          color: isMe ? '#00ff88' : '#ff6b35',
          fillColor: isMe ? '#00ff88' : '#ff6b35',
          fillOpacity: 0.25,
          weight: 2,
        });
        poly.bindPopup(`
          <div style="font-family:'Space Mono',monospace;font-size:12px;background:#111;color:#fff;padding:10px;border-radius:8px;">
            <b style="color:${isMe ? '#00ff88' : '#ff6b35'}">${t.name || (isMe ? 'Mening hududim' : t.owner?.username + "'s territory")}</b><br/>
            👤 @${t.owner?.username || 'unknown'}<br/>
            📐 ${formatArea(t.area)}
          </div>
        `, { className: 'dark-popup' });
        poly.addTo(map || mapInstance.current);
        territoryLayersRef.current.push(poly);
      });
    } catch (e) {}
  };

  // Timer
  useEffect(() => {
    let interval;
    if (running) {
      interval = setInterval(() => setElapsed(e => e + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [running]);

  const startRun = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation qo\'llab-quvvatlanmaydi');
      return;
    }
    setPath([]);
    setDistance(0);
    setElapsed(0);
    setStartTime(new Date());
    setRunning(true);

    watchRef.current = navigator.geolocation.watchPosition(
      pos => {
        const point = [pos.coords.longitude, pos.coords.latitude];
        setPath(prev => {
          const next = [...prev, point];
          // Update distance
          if (next.length > 1) {
            const d = haversine(next[next.length-2], next[next.length-1]);
            setDistance(prev2 => prev2 + d);
          }
          // Draw path on map
          if (mapInstance.current) {
            if (pathLayerRef.current) pathLayerRef.current.remove();
            const latlngs = next.map(p => [p[1], p[0]]);
            pathLayerRef.current = L.polyline(latlngs, {
              color: '#00ff88',
              weight: 4,
              opacity: 0.9,
            }).addTo(mapInstance.current);

            // Moving marker
            if (markerRef.current) markerRef.current.remove();
            markerRef.current = L.circleMarker([pos.coords.latitude, pos.coords.longitude], {
              radius: 8,
              color: '#00ff88',
              fillColor: '#00ff88',
              fillOpacity: 1,
            }).addTo(mapInstance.current);

            mapInstance.current.panTo([pos.coords.latitude, pos.coords.longitude]);
          }
          return next;
        });
      },
      err => {
        console.error(err);
        toast.error('GPS xatoligi');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  };

  const stopAndSave = async () => {
    if (watchRef.current) {
      navigator.geolocation.clearWatch(watchRef.current);
    }
    setRunning(false);

    if (path.length < 3) {
      toast.warning('Yugurish juda qisqa!');
      return;
    }

    const area = polygonArea(path);
    const endTime = new Date();

    try {
      const { data } = await axios.post(`${API}/user/run`, {
        path,
        distance: Math.round(distance),
        duration: elapsed,
        area: Math.round(area),
        startTime: startTime?.toISOString(),
        endTime: endTime.toISOString(),
      });

      // Save territory if area > 0
      if (area > 50) {
        const center = {
          lat: path.reduce((s, p) => s + p[1], 0) / path.length,
          lng: path.reduce((s, p) => s + p[0], 0) / path.length,
        };
        await axios.post(`${API}/map/territory`, {
          coordinates: path,
          area: Math.round(area),
          center,
        });
        updateUser({ 
          totalArea: (user?.totalArea || 0) + area,
          totalRuns: (user?.totalRuns || 0) + 1,
          totalDistance: (user?.totalDistance || 0) + distance
        });
        toast.success(`🎉 ${formatArea(area)} hudud egallandi!`);
        fetchTerritories();
      } else {
        toast.success(`Yugurish saqlandi! ${formatDist(distance)}`);
      }
    } catch (e) {
      toast.error('Saqlashda xatolik');
    }

    // Clear path
    if (pathLayerRef.current) { pathLayerRef.current.remove(); pathLayerRef.current = null; }
    if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
    setPath([]);
  };

  const renameTerritory = async (id) => {
    if (!newName.trim()) return;
    try {
      await axios.put(`${API}/map/territory/${id}/name`, { name: newName.trim() });
      toast.success('Hudud nomi o\'zgartirildi!');
      setRenaming(null);
      setNewName('');
      fetchTerritories();
    } catch (e) {
      toast.error('Xatolik');
    }
  };

  const myTerritories = territories.filter(t => 
    t.owner?._id === user?.id || t.owner?._id === user?._id
  );

  return (
    <div style={styles.page}>
      {/* Map */}
      <div ref={mapRef} style={styles.map} />

      {/* Run controls */}
      <div style={styles.controls}>
        {running ? (
          <>
            <div style={styles.runStats}>
              <div style={styles.statItem}>
                <div style={styles.statVal}>{formatDist(distance)}</div>
                <div style={styles.statLbl}>{t.distance}</div>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.statItem}>
                <div style={styles.statVal}>{formatTime(elapsed)}</div>
                <div style={styles.statLbl}>{t.duration}</div>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.statItem}>
                <div style={styles.statVal}>{path.length}</div>
                <div style={styles.statLbl}>pts</div>
              </div>
            </div>
            <button
              className="btn btn-danger btn-full"
              onClick={stopAndSave}
              style={{borderRadius: '40px'}}
            >
              ⏹ {t.stopTracking}
            </button>
          </>
        ) : (
          <button
            className="btn btn-primary btn-full"
            onClick={startRun}
            style={{borderRadius: '40px', padding: '16px'}}
          >
            🏃 {t.startTracking}
          </button>
        )}
      </div>

      {/* My territories panel */}
      <button style={styles.panelToggle} onClick={() => setShowPanel(!showPanel)}>
        {showPanel ? '✕' : '🏴'}
        {!showPanel && <span style={{marginLeft: 6, fontSize: 11}}>{t.myTerritories} ({myTerritories.length})</span>}
      </button>

      {showPanel && (
        <div style={styles.panel}>
          <div style={styles.panelTitle}>{t.myTerritories}</div>
          {myTerritories.length === 0 ? (
            <div style={styles.panelEmpty}>Hali hududingiz yo'q. Yuguring!</div>
          ) : (
            myTerritories.map(terr => (
              <div key={terr._id} style={styles.terrItem}>
                <div style={styles.terrInfo}>
                  <div style={styles.terrName}>{terr.name || 'Nomsiz hudud'}</div>
                  <div style={styles.terrArea}>{formatArea(terr.area)}</div>
                </div>
                {renaming === terr._id ? (
                  <div style={{display:'flex',gap:6}}>
                    <input
                      className="input"
                      style={{padding:'6px 10px',fontSize:13}}
                      placeholder={t.newName}
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                    />
                    <button className="btn btn-primary"
                      style={{padding:'6px 12px',fontSize:12}}
                      onClick={() => renameTerritory(terr._id)}>✓</button>
                    <button className="btn btn-ghost"
                      style={{padding:'6px 10px',fontSize:12}}
                      onClick={() => setRenaming(null)}>✕</button>
                  </div>
                ) : (
                  <button className="btn btn-ghost"
                    style={{padding:'6px 12px',fontSize:12}}
                    onClick={() => { setRenaming(terr._id); setNewName(terr.name || ''); }}>
                    ✏️
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Running pulse */}
      {running && <div style={styles.runningPulse}><span style={styles.pulseIcon}>🔴</span> LIVE</div>}
    </div>
  );
};

const styles = {
  page: {
    height: '100vh',
    position: 'relative',
    background: '#0a0a0a',
    paddingBottom: 'var(--nav-h)',
  },
  map: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 'calc(100vh - var(--nav-h))',
    zIndex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 'calc(var(--nav-h) + 16px)',
    left: '16px',
    right: '16px',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  runStats: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(10,10,10,0.95)',
    border: '1px solid rgba(0,255,136,0.3)',
    borderRadius: '40px',
    padding: '12px 20px',
    backdropFilter: 'blur(10px)',
  },
  statItem: { flex: 1, textAlign: 'center' },
  statVal: {
    fontFamily: 'var(--font-display)',
    fontSize: '18px',
    fontWeight: '900',
    color: 'var(--green)',
  },
  statLbl: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: '1px',
    height: '30px',
    background: 'var(--border)',
  },
  panelToggle: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    zIndex: 100,
    background: 'rgba(10,10,10,0.9)',
    border: '1px solid var(--border)',
    borderRadius: '40px',
    color: 'var(--text)',
    padding: '8px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    backdropFilter: 'blur(10px)',
  },
  panel: {
    position: 'absolute',
    top: '60px',
    left: '16px',
    right: '16px',
    zIndex: 100,
    background: 'rgba(10,10,10,0.97)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '16px',
    maxHeight: '50vh',
    overflowY: 'auto',
    backdropFilter: 'blur(20px)',
  },
  panelTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '12px',
    color: 'var(--green)',
  },
  panelEmpty: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--text-dim)',
    textAlign: 'center',
    padding: '20px 0',
  },
  terrItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 0',
    borderBottom: '1px solid var(--border)',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  terrInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  terrName: {
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text)',
  },
  terrArea: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--green)',
  },
  runningPulse: {
    position: 'absolute',
    top: '16px',
    right: '60px',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(10,10,10,0.9)',
    border: '1px solid rgba(255,59,59,0.5)',
    borderRadius: '40px',
    padding: '6px 14px',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    fontWeight: '700',
    color: '#ff3b3b',
    backdropFilter: 'blur(10px)',
  },
  pulseIcon: {
    animation: 'blink 1s infinite',
    fontSize: '10px',
  }
};

export default MapPage;
