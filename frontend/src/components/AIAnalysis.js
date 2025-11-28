import React from 'react';

function AIAnalysis({ analysis }) {
  if (!analysis) {
    return (
      <div style={{ padding: '30px', textAlign: 'center' }}>
        <div className="loading" style={{ fontSize: '18px', color: '#666' }}>
          🤖 Chargement de l'analyse IA...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', overflowY: 'auto', height: '100%', background: '#f5f8fa', width: '100%' }}>
      <h1 style={{ marginBottom: '10px', color: '#1E3A8A' }}>
        🤖 Analyse IA des Causes Potentielles
      </h1>
      <p style={{ marginBottom: '30px', color: '#666', fontSize: '14px' }}>
        Propulsé par Google Gemini Flash 2.5 • {analysis.total_causes} causes analysées
      </p>

      {/* Summary Card */}
      <div style={{ 
        background: 'white', 
        padding: '30px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '30px',
        borderLeft: '4px solid #2563EB'
      }}>
        <h2 style={{ color: '#2563EB', marginBottom: '15px', fontSize: '20px' }}>
          📋 Résumé Général
        </h2>
        <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#333' }}>
          {analysis.summary}
        </p>
      </div>

      {/* Main Categories */}
      {analysis.main_categories && analysis.main_categories.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#1E3A8A', marginBottom: '20px', fontSize: '20px' }}>
            📊 Catégories Principales de Causes
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {analysis.main_categories.map((cat, index) => (
              <div 
                key={index}
                style={{ 
                  background: 'white', 
                  padding: '25px', 
                  borderRadius: '8px', 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  borderTop: `4px solid ${getColorForIndex(index)}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ color: '#333', fontSize: '18px', margin: 0 }}>
                    {cat.category}
                  </h3>
                  <div style={{ 
                    fontSize: '28px', 
                    fontWeight: 'bold', 
                    color: getColorForIndex(index)
                  }}>
                    {cat.percentage}%
                  </div>
                </div>
                <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6', margin: 0 }}>
                  {cat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div>
          <h2 style={{ color: '#16A085', marginBottom: '20px', fontSize: '20px' }}>
            💡 Recommandations Prioritaires
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {analysis.recommendations.map((rec, index) => (
              <div 
                key={index}
                style={{ 
                  background: 'white', 
                  padding: '25px', 
                  borderRadius: '8px', 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '20px'
                }}
              >
                <div style={{ 
                  background: getPriorityColor(rec.priority), 
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap'
                }}>
                  {rec.priority}
                </div>
                <p style={{ fontSize: '15px', color: '#333', lineHeight: '1.7', margin: 0, flex: 1 }}>
                  {rec.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getColorForIndex(index) {
  const colors = ['#1E3A8A', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'];
  return colors[index % colors.length];
}

function getPriorityColor(priority) {
  const priorityLower = priority.toLowerCase();
  if (priorityLower.includes('haute') || priorityLower.includes('high')) return '#1E3A8A';
  if (priorityLower.includes('moyenne') || priorityLower.includes('medium')) return '#2563EB';
  return '#60A5FA';
}

export default AIAnalysis;
