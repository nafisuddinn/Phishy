import { useState } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState(''); /*takes in message input*/
  const [verdict, setVerdict] = useState('');
  const [scamType, setScamType] = useState('');
  const [confidence, setConfidence] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzeMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setError('');
    setVerdict('');
    setScamType('');
    setConfidence('');
    setReason('');

    try {
      const response = await fetch('http://127.0.0.1:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }), /*this is the inputted message. when "analyze" is clicked, it runs the backend method*/
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
  };

  return (
    <div className="container">
      <h1>Phishy AI 🐟</h1>
      <p>Paste a suspicious message to analyze:</p>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="e.g. 'You won a free iPhone!'"
      />

      <button onClick={analyzeMessage} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>

      {error && <p className="error">{error}</p>}

      {(verdict || confidence || scamType || reason) && (
        <div className="result">
          <p><strong>Scam Verdict:</strong> {verdict}</p>
          <p><strong>Scam Type:</strong> {scamType}</p>
          <p><strong>Confidence:</strong> {confidence}</p>
          <p><strong>Reason:</strong> {reason}</p>
        </div>
      )}
    </div>
  );
}

export default App;
