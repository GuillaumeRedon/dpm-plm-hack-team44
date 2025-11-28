import React, { useState, useEffect } from 'react';
import { getCharts } from '../services/api';

function AdvancedCharts() {
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCharts() {
      try {
        const data = await getCharts();
        setCharts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCharts();
  }, []);

  if (loading) {
    return <div className="loading">Génération des graphiques avancés...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '30px', color: '#922B21' }}>
        <h2>Erreur lors du chargement des graphiques</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', overflowY: 'auto', height: '100%', background: '#f5f8fa', width: '100%' }}>
      <h1 style={{ marginBottom: '30px', color: '#1E3A8A' }}>📈 Analyses Avancées</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
        {/* Graphique 1 : Matrice de Transition */}
        {charts.transition_matrix && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <img 
              src={`data:image/png;base64,${charts.transition_matrix}`} 
              alt="Matrice de Transition"
              style={{ width: '100%', height: 'auto' }}
            />
            <div style={{ marginTop: '15px', padding: '15px', background: '#DBEAFE', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: 'var(--strong-blue)' }}>📊 Interprétation</h4>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                Cette heatmap révèle les transitions réelles entre postes de travail. 
                La diagonale représente le flux logique prévu, tandis que les cellules hors diagonale 
                indiquent des retours en arrière ou des sauts dans le processus - signaux de problèmes organisationnels.
              </p>
            </div>
          </div>
        )}

        {/* Graphique 2 : Variabilité des Goulots */}
        {charts.bottleneck_variability && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <img 
              src={`data:image/png;base64,${charts.bottleneck_variability}`} 
              alt="Variabilité des Goulots"
              style={{ width: '100%', height: 'auto' }}
            />
            <div style={{ marginTop: '15px', padding: '15px', background: '#DBEAFE', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1E3A8A' }}>🎯 Insight Clé</h4>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                Les boxplots révèlent non seulement les postes avec le plus grand retard moyen, 
                mais aussi leur variabilité (hauteur des boîtes). Un poste très variable indique 
                une instabilité opérationnelle nécessitant une analyse des causes racines.
              </p>
            </div>
          </div>
        )}

        {/* Graphique 3 : Corrélation PLM */}
        {charts.plm_correlation && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <img 
              src={`data:image/png;base64,${charts.plm_correlation}`} 
              alt="Corrélation Conception-Production"
              style={{ width: '100%', height: 'auto' }}
            />
            <div style={{ marginTop: '15px', padding: '15px', background: '#EFF6FF', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1E3A8A' }}>🔍 Découverte</h4>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                Ce scatter plot croise la complexité de conception (temps CAO) avec la difficulté d'assemblage. 
                Les pièces en haut à droite (forte masse + long temps CAO + long assemblage) sont des candidates 
                prioritaires pour une simplification en phase de design.
              </p>
            </div>
          </div>
        )}

        {/* Graphique 4 : Performance RH */}
        {charts.rh_performance && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <img 
              src={`data:image/png;base64,${charts.rh_performance}`} 
              alt="Performance RH"
              style={{ width: '100%', height: 'auto' }}
            />
            <div style={{ marginTop: '15px', padding: '15px', background: '#DBEAFE', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1B4F72' }}>💡 Action Recommandée</h4>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                Le retard total par niveau d'expérience révèle l'impact RH sur la performance. 
                Si les juniors génèrent le plus de retard, envisagez du mentoring ou une redistribution 
                des tâches complexes vers les profils seniors.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdvancedCharts;
