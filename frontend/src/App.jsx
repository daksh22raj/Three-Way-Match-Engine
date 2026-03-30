import React, { useState } from 'react';
import Upload from './Upload';
import MatchResult from './MatchResult';
import './index.css';

function App() {
  const [lastUploadedPo, setLastUploadedPo] = useState(null);

  return (
    <div className="container">
      <header className="header">
        <h1>Three-Way Match Engine</h1>
        <p>Intelligent document parsing and automated reconciliation</p>
      </header>

      <div className="dashboard-grid">
        <div>
          <Upload onUploadSuccess={setLastUploadedPo} />
        </div>
        <div>
          <MatchResult prefillPo={lastUploadedPo} />
        </div>
      </div>
    </div>
  );
}

export default App;
