import { useState, useEffect } from 'react';
import './App.css';
import ScanHistory from './ScanHistory';
import ThreatFeed from './ThreatFeed';
import 'leaflet/dist/leaflet.css';
import ThreatMap from './ThreatMap';

function App() {
  const [message, setMessage] = useState('');
  const [verdict, setVerdict] = useState('');
  const [scamType, setScamType] = useState('');
  const [confidence, setConfidence] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showFeed, setShowFeed] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    const existingId = localStorage.getItem('phishy-user-id');
    if (!existingId) {
      localStorage.setItem('phishy-user-id', crypto.randomUUID());
    }
  }, []);

  const submitAnalysis = async (lat = 0, lon = 0) => {
    const userId = localStorage.getItem('phishy-user-id');

    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, userId, lat, lon }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Analyze request failed');
      }

      setVerdict(data.verdict || 'Unknown');
      setScamType(data.type || 'Unknown');
      setConfidence(data.confidence || 'Unknown');
      setReason(data.reason || 'No explanation provided.');
    } catch (err) {
      console.error('Error analyzing message:', err);
      setError('Failed to analyze message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const analyzeMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setError('');
    setVerdict('');
    setScamType('');
    setConfidence('');
    setReason('');

    if (!navigator.geolocation) {
      submitAnalysis(0, 0);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        submitAnalysis(latitude, longitude);
      },
      () => {
        submitAnalysis(0, 0);
      }
    );
  };

  return (
    <>
      {showMap ? (
        <div className="map-fullscreen">
          <ThreatMap onBack={() => setShowMap(false)} />
        </div>
      ) : (
        <div className="container">
          <h1>Phishy 🐟</h1>

          {showHistory ? (
            <>
              <ScanHistory />
              <div className="button-row">
                <button className="history-button" onClick={() => setShowHistory(false)}>
                  ← Back to Analyzer
                </button>
              </div>
            </>
          ) : showFeed ? (
            <>
              <ThreatFeed />
              <div className="button-row">
                <button className="feed-button" onClick={() => setShowFeed(false)}>
                  ← Back to Analyzer
                </button>
              </div>
            </>
          ) : (
            <>
              <p>Paste a suspicious message to analyze:</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. 'You won a free iPhone!'"
              />

              <div className="button-row">
                <button onClick={analyzeMessage} disabled={loading}>
                  {loading ? 'Analyzing...' : 'Analyze'}
                </button>
                <button onClick={() => setShowHistory(true)}>📜 View My Scan History</button>
                <button onClick={() => setShowFeed(true)}>🌍 View Community Threat Feed</button>
                <button onClick={() => setShowMap(true)}>🗺️ View Scam Location Map</button>
              </div>

              {error && <p className="error">{error}</p>}

              {(verdict || confidence || scamType || reason) && (
                <div className="result response-container">
                  <p><strong>Scam Verdict:</strong> {verdict}</p>
                  <p><strong>Scam Type:</strong> {scamType}</p>
                  <p><strong>Chance of Scam:</strong> {confidence}</p>
                  <p><strong>Reason:</strong> {reason}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}

export default App;
