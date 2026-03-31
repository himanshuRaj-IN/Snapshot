import { useState } from 'react';
import './SecurityLock.css';

interface Props {
  onUnlock: () => void;
}

export default function SecurityLock({ onUnlock }: Props) {
  const [input, setInput] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === 'hahaha') {
      onUnlock();
    } else {
      setIsError(true);
      setTimeout(() => setIsError(false), 600);
    }
  };

  return (
    <div className="security-lock-overlay">
      <div className={`security-lock-card ${isError ? 'shake' : ''}`}>
        <div className="lock-icon">🔒</div>
        <h2>Private Dashboard</h2>
        <p>This snapshot is protected. Please enter your secret code to continue.</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="••••••"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            autoComplete="current-password"
          />
          <button type="submit">Unlock Access</button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
          SESSION SECURED • 45S IDLE TIMEOUT
        </div>
      </div>
    </div>
  );
}
