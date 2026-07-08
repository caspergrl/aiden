import { useState, useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { C, sans } from '../theme';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function PlacesInput({ value, onChange, placeholder, style }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen]               = useState(false);
  const [userPos, setUserPos]         = useState(null);
  const debounce    = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  useEffect(() => {
    const handler = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleChange(e) {
    const val = e.target.value;
    onChange(val);
    if (!MAPS_KEY || val.length < 3) { setSuggestions([]); setOpen(false); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => fetchSuggestions(val), 250);
  }

  async function fetchSuggestions(input) {
    try {
      const body = { input };
      if (userPos) {
        body.locationBias = {
          circle: { center: { latitude: userPos.lat, longitude: userPos.lng }, radius: 50000 },
        };
      }
      const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': MAPS_KEY },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      const items = (data.suggestions || [])
        .map(s => s.placePrediction?.text?.text)
        .filter(Boolean)
        .slice(0, 5);
      setSuggestions(items);
      setOpen(items.length > 0);
    } catch {
      setSuggestions([]);
      setOpen(false);
    }
  }

  function select(text) {
    onChange(text);
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        value={value}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        style={style}
      />
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 1000,
          background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)', overflow: 'hidden',
        }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onMouseDown={() => select(s)}
              style={{
                width: '100%', padding: '10px 14px', background: 'none', border: 'none',
                borderBottom: i < suggestions.length - 1 ? `1px solid ${C.border}` : 'none',
                cursor: 'pointer', textAlign: 'left', fontSize: 13, color: C.text,
                fontFamily: sans, display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <MapPin size={12} color={C.mutedLight} style={{ flexShrink: 0 }} />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
