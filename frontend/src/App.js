import React, { useState, useEffect } from 'react';
import ProcessFlow from './components/ProcessFlow';
import AnalysisPanel from './components/AnalysisPanel';
import Dashboard from './components/Dashboard';
import AIAnalysis from './components/AIAnalysis';
import Employees from './components/Employees';
import { getAnalysis, getFlowData, getAIAnalysis } from './services/api';

function App() {
  const [analysis, setAnalysis] = useState(null);
  const [flowData, setFlowData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [currentView, setCurrentView] = useState('timeline');

  useEffect(() => {
    async function fetchData() {
      try {
        const [analysisData, flow, aiData] = await Promise.all([
          getAnalysis(),
          getFlowData(selectedDate),
          getAIAnalysis()
        ]);
        setAnalysis(analysisData);
        setFlowData(flow);
        setAiAnalysis(aiData);
        if (flow.availableDates && flow.availableDates.length > 0) {
          setAvailableDates(flow.availableDates);
          // Présélectionner la première date si aucune n'est définie
          if (selectedDate === null) {
            setSelectedDate(flow.availableDates[0]);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedDate]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value || null);
  };

  if (error) {
    return (
      <div className="app">
        <div className="header">
          <h1>
            <img src="/logo_rondo.png" alt="RONDO Logo" style={{ height: '40px', marginRight: '15px', verticalAlign: 'middle' }} />
            RONDO
          </h1>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>
            <img src="/logo_rondo.png" alt="RONDO Logo" style={{ height: '40px', marginRight: '15px', verticalAlign: 'middle' }} />
            RONDO
          </h1>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button
              onClick={() => setCurrentView('timeline')}
              style={{
                padding: '8px 20px',
                borderRadius: '4px',
                border: 'none',
                background: currentView === 'timeline' ? 'white' : 'rgba(255,255,255,0.2)',
                color: currentView === 'timeline' ? '#1E3A8A' : 'white',
                fontWeight: currentView === 'timeline' ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              📅 Timeline
            </button>
            <button
              onClick={() => setCurrentView('dashboard')}
              style={{
                padding: '8px 20px',
                borderRadius: '4px',
                border: 'none',
                background: currentView === 'dashboard' ? 'white' : 'rgba(255,255,255,0.2)',
                color: currentView === 'dashboard' ? '#1E3A8A' : 'white',
                fontWeight: currentView === 'dashboard' ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setCurrentView('ai-analysis')}
              style={{
                padding: '8px 20px',
                borderRadius: '4px',
                border: 'none',
                background: currentView === 'ai-analysis' ? 'white' : 'rgba(255,255,255,0.2)',
                color: currentView === 'ai-analysis' ? '#1E3A8A' : 'white',
                fontWeight: currentView === 'ai-analysis' ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              🤖 IA Analysis
            </button>
            {/* Bouton Employés caché
            <button
              onClick={() => setCurrentView('employees')}
              style={{
                padding: '8px 20px',
                borderRadius: '4px',
                border: 'none',
                background: currentView === 'employees' ? 'white' : 'rgba(255,255,255,0.2)',
                color: currentView === 'employees' ? '#1E3A8A' : 'white',
                fontWeight: currentView === 'employees' ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              👥 Employés
            </button>
            */}
          </div>
        </div>
        {currentView === 'timeline' && (
          <div style={{ marginTop: '10px' }}>
            <label htmlFor="date-filter" style={{ marginRight: '10px', color: 'white' }}>
              Filtrer par date:
            </label>
            <select
              id="date-filter"
              value={selectedDate || ''}
              onChange={handleDateChange}
              style={{
                padding: '5px 10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="">Toutes les dates</option>
              {availableDates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="main-content">
        {currentView === 'timeline' ? (
          <>
            <AnalysisPanel analysis={analysis} />
            <div className="flow-container">
              {loading ? (
                <div className="loading">Loading process flow...</div>
              ) : (
                <ProcessFlow flowData={flowData} />
              )}
            </div>
          </>
        ) : currentView === 'dashboard' ? (
          <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <Dashboard analysis={analysis} />
          </div>
        ) : currentView === 'ai-analysis' ? (
          <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <AIAnalysis analysis={aiAnalysis} />
          </div>
        ) : currentView === 'employees' ? (
          <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <Employees analysis={analysis} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default App;
