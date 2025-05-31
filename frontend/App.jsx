import { useState, useEffect} from 'react'; /*useEffect is for an Anonymous UUID User History Tracking */
import './App.css';
import ScanHistory from './ScanHistory';
import ThreatFeed from './ThreatFeed';
import 'leaflet/dist/leaflet.css'; /*this the map library to show the map visuals */
import ThreatMap from './ThreatMap';





function App() {
  const [message, setMessage] = useState(''); /*takes in message input*/
  const [verdict, setVerdict] = useState('');
  const [scamType, setScamType] = useState('');
  const [confidence, setConfidence] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showFeed, setShowFeed] = useState(false);
  const [showMap, setShowMap] = useState(false);



  useEffect(() => {
  const existingId = localStorage.getItem("phishy-user-id"); /* we get the user's assigned ID from the DynamoDB table*/
  if (!existingId) {
    localStorage.setItem("phishy-user-id", crypto.randomUUID()); /*randomly generated 36 character identification number get inputted into the table when a analysis is done*/
  }
}, []);

  const analyzeMessage = async () => {
    if (!message.trim()) return;

    const userId = localStorage.getItem("phishy-user-id");
    setLoading(true);
    setError('');
    setVerdict('');
    setScamType('');
    setConfidence('');
    setReason('');

    /*Get the user's geolocation to put on the map */
    navigator.geolocation.getCurrentPosition(
       async (position) => {
      const { latitude, longitude } = position.coords;

    try {
      const response = await fetch('http://127.0.0.1:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message, 
          userId, 
          lat: latitude, 
          lon: longitude
      }),
      });

      const data = await response.json();
      console.log("RESPONSE FROM BACKEND:", data); // 🔍 Debug

      /*Preset values of each category -- change from the return values in the backend*/
      setVerdict(data.verdict || 'Unknown');
      setScamType(data.type || 'Unknown');
      setConfidence(data.confidence || 'Unknown');
      setReason(data.reason || 'No explanation provided.');
    } catch (err) {
      console.error('Error analyzing message:', err);
      setError('Failed to analyze message. Please try again.');
    }

    setLoading(false);
  },
  
  
  (error) => {
        console.error("Geolocation error:", error);
        setError('Location permission is required to submit analysis.');
        setLoading(false);
      }
    );
  };



  return (
    <>
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
      </> )

      :showFeed ? (
        <>
        <ThreatFeed />
        <div className = "button-row">
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
         {!showHistory && !showFeed && (
          <button onClick={analyzeMessage} disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze'}
            </button>
           )}
            {!showFeed && (
              <button onClick={() => setShowHistory(!showHistory)}>
                {showHistory ? "← Back to Analyzer" : "📜 View My Scan History"}
                </button>
              )}
              <button onClick={() => {
                setShowFeed(!showFeed);
                setShowHistory(false); // ensure only one view at a time
                }}>
                  {showFeed ? "← Back to Analyzer" : "🌍 View Community Threat Feed"}
                  </button>
                  </div>
                  
                  <button onClick={() => {
                    setShowMap(!showMap);
                    setShowHistory(false);
                    setShowFeed(false);
                    }}>
                      {showMap ? "← Back to Analyzer" : "🗺️ View Scam Location Map"}
                      </button>
                      
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
  
  {showMap && (
      <div className="map-wrapper">
        <ThreatMap />
      </div>
    )}
    </>
  );
}


export default App;
