import React, { useState, useEffect } from 'react';
import ProcessFlow from './components/ProcessFlow';
import AnalysisPanel from './components/AnalysisPanel';
import { getAnalysis, getFlowData } from './services/api';

function App() {
  const [analysis, setAnalysis] = useState(null);
  const [flowData, setFlowData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [analysisData, flow] = await Promise.all([
          getAnalysis(),
          getFlowData()
        ]);
        setAnalysis(analysisData);
        setFlowData(flow);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (error) {
    return (
      <div className="app">
        <div className="header">
          <h1>🔄 Process Mining App</h1>
        </div>
        <div className="loading" style={{ color: '#e74c3c' }}>
          Error: {error}. Make sure the backend server is running on port 3001.
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="header">
        <h1>Process Mining App</h1>
      </div>
      <div className="main-content">
        <AnalysisPanel analysis={analysis} />
        <div className="flow-container">
          {loading ? (
            <div className="loading">Loading process flow...</div>
          ) : (
            <ProcessFlow flowData={flowData} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
