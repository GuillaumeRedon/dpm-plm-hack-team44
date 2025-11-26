import React from 'react';

function AnalysisPanel({ analysis }) {
  if (!analysis) {
    return <div className="loading">Loading analysis...</div>;
  }

  return (
    <div className="sidebar">
      {/* Statistics Section */}
      <div className="section">
        <h2>📊 Statistics</h2>
        {Object.entries(analysis.statistics || {}).map(([system, stats]) => (
          <div key={system} style={{ marginBottom: '15px' }}>
            <div style={{ fontWeight: 600, marginBottom: '8px', color: '#667eea' }}>
              {system.toUpperCase()}
            </div>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{stats.totalRecords}</div>
                <div className="stat-label">Records</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.avgDuration}</div>
                <div className="stat-label">Avg Duration</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottlenecks Section */}
      <div className="section">
        <h2>🚨 Bottlenecks ({analysis.bottlenecks?.length || 0})</h2>
        {analysis.bottlenecks?.slice(0, 5).map((item, idx) => (
          <div key={idx} className="card bottleneck">
            <div className="card-title">{item.activity}</div>
            <div className="card-detail">
              System: {item.system} | Case: {item.caseId}
            </div>
            <div className="card-detail">
              Duration: {item.duration} | {item.reason}
            </div>
          </div>
        ))}
      </div>

      {/* Inefficiencies Section */}
      <div className="section">
        <h2>⚠️ Inefficiencies ({analysis.inefficiencies?.length || 0})</h2>
        {analysis.inefficiencies?.slice(0, 5).map((item, idx) => (
          <div key={idx} className="card inefficiency">
            <div className="card-title">{item.activity}</div>
            <div className="card-detail">
              System: {item.system} | Case: {item.caseId}
            </div>
            <div className="card-detail">
              Occurrences: {item.occurrences} | {item.reason}
            </div>
          </div>
        ))}
      </div>

      {/* Improvements Section */}
      <div className="section">
        <h2>💡 Improvements ({analysis.improvements?.length || 0})</h2>
        {analysis.improvements?.map((item, idx) => (
          <div key={idx} className="card improvement">
            <div className="card-title">{item.suggestion}</div>
            <div className="card-detail">
              System: {item.system}
            </div>
            <div className="card-detail">{item.reason}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AnalysisPanel;
