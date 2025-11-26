import React from 'react';

function AnalysisPanel({ analysis }) {
  if (!analysis) {
    return <div className="loading">Loading analysis...</div>;
  }

  const renderStatValue = (key, value) => {
    if (typeof value === 'object') {
      return Object.entries(value).map(([k, v]) => (
        <div key={k} style={{ fontSize: '11px' }}>{k}: {v}</div>
      ));
    }
    return value;
  };

  return (
    <div className="sidebar">
      {/* Statistics Section */}
      <div className="section">
        <h2>📊 Statistics</h2>
        {Object.entries(analysis.statistics || {}).map(([system, stats]) => (
          <div key={system} style={{ marginBottom: '15px' }}>
            <div style={{ fontWeight: 600, marginBottom: '8px', color: '#667eea' }}>
              {system}
            </div>
            <div className="stats-grid">
              {Object.entries(stats).slice(0, 4).map(([key, value]) => (
                typeof value !== 'object' && (
                  <div key={key} className="stat-item">
                    <div className="stat-value">{value}</div>
                    <div className="stat-label">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                  </div>
                )
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottlenecks Section */}
      <div className="section">
        <h2>🚨 Bottlenecks ({analysis.bottlenecks?.length || 0})</h2>
        {analysis.bottlenecks?.slice(0, 5).map((item, idx) => (
          <div key={idx} className="card bottleneck">
            <div className="card-title">
              {item.part || item.activity || 'Unknown'}
            </div>
            <div className="card-detail">
              System: {item.system} {item.workstation ? `| ${item.workstation}` : ''}
            </div>
            <div className="card-detail">
              {item.delay && `Delay: ${item.delay}`}
              {item.leadTime && `Lead Time: ${item.leadTime}`}
            </div>
            <div className="card-detail" style={{ fontStyle: 'italic' }}>
              {item.reason || item.cause}
            </div>
          </div>
        ))}
      </div>

      {/* Inefficiencies Section */}
      <div className="section">
        <h2>⚠️ Inefficiencies ({analysis.inefficiencies?.length || 0})</h2>
        {analysis.inefficiencies?.slice(0, 5).map((item, idx) => (
          <div key={idx} className="card inefficiency">
            <div className="card-title">{item.type || item.activity}</div>
            <div className="card-detail">
              System: {item.system} {item.detail ? `| ${item.detail}` : ''}
            </div>
            <div className="card-detail">
              {item.value && `Value: ${item.value}`}
            </div>
            <div className="card-detail" style={{ fontStyle: 'italic' }}>
              {item.reason}
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
            <div className="card-detail" style={{ fontStyle: 'italic' }}>
              {item.reason}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AnalysisPanel;
