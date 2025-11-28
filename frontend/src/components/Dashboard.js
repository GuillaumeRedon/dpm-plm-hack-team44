import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { getCharts, getProcesses } from '../services/api';

function Dashboard({ analysis }) {
  const [advancedCharts, setAdvancedCharts] = useState(null);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [allWorkstations, setAllWorkstations] = useState([]);

  useEffect(() => {
    async function fetchCharts() {
      try {
        const data = await getCharts();
        setAdvancedCharts(data);
      } catch (err) {
        console.error('Error loading advanced charts:', err);
      } finally {
        setChartsLoading(false);
      }
    }
    fetchCharts();
  }, []);

  useEffect(() => {
    async function fetchAllWorkstations() {
      try {
        const processes = await getProcesses();
        console.log('Processes MES loaded:', processes.MES?.length || 0, 'operations');
        
        if (processes.MES) {
          // Calculer les performances de tous les postes
          const postePerformance = {};
          
          processes.MES.forEach(op => {
            const poste = op.Poste || 'Unknown';
            const tempsPrevu = parseTimeToMinutes(op['Temps Prévu']);
            const tempsReel = parseTimeToMinutes(op['Temps Réel']);
            const retard = tempsReel - tempsPrevu;
            
            if (!postePerformance[poste]) {
              postePerformance[poste] = { total: 0, count: 0 };
            }
            postePerformance[poste].total += retard;
            postePerformance[poste].count += 1;
          });
          
          // Convertir en tableau et trier par retard moyen croissant
          const workstations = Object.entries(postePerformance)
            .map(([poste, data]) => ({
              poste: `Poste ${poste}`,
              delay: data.total / data.count
            }))
            .sort((a, b) => b.delay - a.delay);
          
          console.log('All workstations calculated:', workstations.length, 'postes');
          setAllWorkstations(workstations);
        }
      } catch (err) {
        console.error('Error loading workstations:', err);
      }
    }
    fetchAllWorkstations();
  }, []);

  // Helper pour convertir HH:MM:SS en minutes
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const parts = String(timeStr).split(':');
    if (parts.length === 3) {
      const [hours, minutes, seconds] = parts.map(Number);
      return hours * 60 + minutes + seconds / 60;
    }
    return 0;
  };

  if (!analysis || !analysis.statistics) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const { statistics, bottlenecks, inefficiencies, improvements } = analysis;

  // Prepare data for charts
  const experienceData = statistics.ERP?.experienceLevels || {};
  const experienceLabels = Object.keys(experienceData);
  const experienceValues = Object.values(experienceData);

  const issuesData = statistics.MES?.issuesByType || {};
  const issueLabels = Object.keys(issuesData);
  const issueValues = Object.values(issuesData);

  // Top bottlenecks for bar chart
  const topBottlenecks = bottlenecks.slice(0, 8);
  const bottleneckNames = topBottlenecks.map(b => b.processName || b.task || 'Unknown');
  const bottleneckDelays = topBottlenecks.map(b => {
    const delay = b.avgDelay || b.delay || 0;
    return typeof delay === 'number' ? delay : parseFloat(delay) || 0;
  });

  // Inefficiencies by type
  const inefficiencyTypes = {};
  inefficiencies.forEach(ineff => {
    const type = ineff.type || 'Other';
    inefficiencyTypes[type] = (inefficiencyTypes[type] || 0) + 1;
  });

  // Time evolution data (bottleneck trends) - Filter to show only top deltas (real - objective)
  const bottlenecksWithDelta = bottlenecks.map((b, i) => {
    const delay = b.avgDelay || b.delay || 0;
    const delayValue = typeof delay === 'number' ? delay : parseFloat(delay) || 0;
    const expected = delayValue * 0.7;
    const delta = delayValue - expected;
    return {
      index: i,
      delay: delayValue,
      expected: expected,
      delta: delta,
      name: b.processName || b.task || `Poste ${i + 1}`
    };
  }).sort((a, b) => b.delta - a.delta).slice(0, 15); // Top 15 plus gros deltas

  const timeLabels = bottlenecksWithDelta.map(b => b.name);
  const delayTrend = bottlenecksWithDelta.map(b => b.delay);
  const expectedTime = bottlenecksWithDelta.map(b => b.expected);

  // Cost breakdown by activity (from MES "Nom" column)
  const costLabels = [];
  const costValues = [];
  if (statistics.MES?.costByActivity) {
    const costByActivity = statistics.MES.costByActivity;
    Object.entries(costByActivity).forEach(([activity, cost]) => {
      costLabels.push(activity);
      costValues.push(cost);
    });
  }

  // Workstation efficiency data - Use all workstations from MES data if available, sorted by delay
  const workstationData = (allWorkstations.length > 0 
    ? allWorkstations 
    : bottlenecks.map((b, i) => ({
        poste: b.processName || b.task || `Poste ${i+1}`,
        delay: typeof (b.avgDelay || b.delay) === 'number' ? (b.avgDelay || b.delay) : parseFloat(b.avgDelay || b.delay) || 0,
        system: b.system || 'MES'
      }))
  ).sort((a, b) => a.delay - b.delay); // Tri par retard décroissant
  
  console.log('Total workstations:', workstationData.length, 'from', allWorkstations.length > 0 ? 'MES data' : 'bottlenecks');

  return (
    <div style={{ padding: '30px', overflowY: 'auto', height: '100%', background: '#f5f8fa', width: '100%' }}>
      <h1 style={{ marginBottom: '30px', color: '#1E3A8A' }}>📊 Dashboard Analytics</h1>

      {/* KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {statistics.ERP && (
          <>
            <div className="kpi-card">
              <div className="kpi-value">{statistics.ERP.totalEmployees}</div>
              <div className="kpi-label">Total Employés</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">€{statistics.ERP.avgHourlyCost}</div>
              <div className="kpi-label">Coût Horaire Moyen</div>
            </div>
          </>
        )}
        {statistics.MES && (
          <>
            <div className="kpi-card">
              <div className="kpi-value">{statistics.MES.totalOperations}</div>
              <div className="kpi-label">Total Opérations</div>
            </div>
            <div className="kpi-card" style={{ background: '#DBEAFE' }}>
              <div className="kpi-value" style={{ color: '#1E3A8A' }}>{statistics.MES.totalDelayMinutes.toFixed(0)} min</div>
              <div className="kpi-label">Délai Total</div>
            </div>
          </>
        )}
        {statistics.PLM && (
          <>
            <div className="kpi-card">
              <div className="kpi-value">{statistics.PLM.totalParts}</div>
              <div className="kpi-label">Total Pièces</div>
            </div>
            <div className="kpi-card" style={{ background: '#DBEAFE' }}>
              <div className="kpi-value" style={{ color: '#1E40AF' }}>{statistics.PLM.criticalParts}</div>
              <div className="kpi-label">Pièces Critiques</div>
            </div>
          </>
        )}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '30px' }}>
        
        {/* Experience Levels Pie Chart */}
        {experienceLabels.length > 0 && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--strong-blue)' }}>Niveaux d'Expérience</h3>
            <Plot
              data={[{
                values: experienceValues,
                labels: experienceLabels,
                type: 'pie',
                marker: {
                  colors: ['#1E3A8A', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD']
                },
                textinfo: 'label+percent',
                textposition: 'outside',
                automargin: true
              }]}
              layout={{
                height: 350,
                margin: { t: 20, b: 20, l: 20, r: 20 },
                showlegend: false,
                paper_bgcolor: 'white',
                plot_bgcolor: 'white'
              }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%', height: '350px' }}
            />
          </div>
        )}

        {/* Cost Breakdown Chart */}
        {costLabels.length > 0 && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--strong-blue)' }}>Répartition des Coûts par Activité (Top 10)</h3>
            <Plot
              data={[{
                labels: costLabels,
                values: costValues,
                type: 'pie',
                hole: 0.4,
                marker: {
                  colors: [
                    '#1E3A8A', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD',
                    '#1E40AF', '#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA'
                  ]
                },
                textinfo: 'label+percent',
                textposition: 'auto',
                hovertemplate: '%{label}<br>€%{value:.2f}<br>%{percent}<extra></extra>'
              }]}
              layout={{
                height: 350,
                margin: { t: 20, b: 20, l: 20, r: 20 },
                showlegend: true,
                legend: { orientation: 'v', x: 1, y: 0.5 },
                paper_bgcolor: 'white',
                plot_bgcolor: 'white',
                annotations: [{
                  text: `Total<br>€${costValues.reduce((a, b) => a + b, 0).toFixed(0)}`,
                  showarrow: false,
                  font: { size: 14, color: 'var(--strong-blue)', weight: 'bold' }
                }]
              }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%', height: '350px' }}
            />
          </div>
        )}

        {/* Advanced Chart 1: Variabilité des Goulots (Boxplot) */}
        {advancedCharts?.bottleneck_variability && advancedCharts.bottleneck_variability.data && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--strong-blue)' }}>Analyse de la Variabilité</h3>
            <Plot
              data={advancedCharts.bottleneck_variability.data.map(item => ({
                y: item.values,
                type: 'box',
                name: `Poste ${item.poste}`,
                marker: { color: '#2563EB' },
                boxmean: true
              }))}
              layout={{
                height: 350,
                margin: { t: 20, b: 60, l: 60, r: 20 },
                xaxis: { title: 'Postes', showticklabels: true },
                yaxis: { title: 'Heures de Retard', gridcolor: '#e0e0e0' },
                paper_bgcolor: 'white',
                plot_bgcolor: 'white',
                showlegend: false,
                shapes: [{
                  type: 'line',
                  x0: 0,
                  x1: advancedCharts.bottleneck_variability.data.length,
                  y0: 0,
                  y1: 0,
                  line: { color: '#27ae60', width: 2, dash: 'dash' }
                }]
              }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%', height: '350px' }}
            />
          </div>
        )}

        {/* Advanced Chart 2: Corrélation PLM (Scatter) */}
        {advancedCharts?.plm_correlation && advancedCharts.plm_correlation.data && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--strong-blue)' }}>Impact Conception-Production</h3>
            <Plot
              data={[
                ...Object.entries(
                  advancedCharts.plm_correlation.data.reduce((acc, item) => {
                    if (!acc[item.criticality]) acc[item.criticality] = [];
                    acc[item.criticality].push(item);
                    return acc;
                  }, {})
                ).map(([criticality, items]) => ({
                  x: items.map(d => d.caoTime),
                  y: items.map(d => d.assemblyTime),
                  type: 'scatter',
                  mode: 'markers',
                  name: criticality,
                  marker: {
                    size: items.map(d => Math.sqrt(d.mass) * 2),
                    opacity: 0.7
                  },
                  text: items.map(d => `${d.reference}<br>Masse: ${d.mass.toFixed(1)}kg`),
                  hovertemplate: '%{text}<br>CAO: %{x:.1f}h<br>Assemblage: %{y:.1f}h<extra></extra>'
                }))
              ]}
              layout={{
                height: 350,
                margin: { t: 20, b: 60, l: 60, r: 20 },
                xaxis: { title: 'Temps CAO (h)', gridcolor: '#e0e0e0' },
                yaxis: { title: 'Temps Assemblage (h)', gridcolor: '#e0e0e0' },
                paper_bgcolor: 'white',
                plot_bgcolor: 'white',
                showlegend: true,
                legend: { x: 0, y: 1.1, orientation: 'h' }
              }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%', height: '350px' }}
            />
          </div>
        )}

        {/* Advanced Chart 3: Performance RH (Bar) */}
        {advancedCharts?.rh_performance && advancedCharts.rh_performance.data && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--strong-blue)' }}>Retard par Niveau d'Expérience</h3>
            <Plot
              data={[{
                x: advancedCharts.rh_performance.data.map(d => d.level),
                y: advancedCharts.rh_performance.data.map(d => d.totalDelay),
                type: 'bar',
                marker: {
                  color: advancedCharts.rh_performance.data.map((d, i) => {
                    const colors = ['#1E3A8A', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'];
                    return colors[i % colors.length];
                  })
                },
                text: advancedCharts.rh_performance.data.map(d => `${d.totalDelay.toFixed(1)}h`),
                textposition: 'outside',
                hovertemplate: '%{x}<br>Retard total: %{y:.1f}h<extra></extra>'
              }]}
              layout={{
                height: 350,
                margin: { t: 20, b: 80, l: 60, r: 20 },
                xaxis: { title: 'Niveau d\'Expérience', tickangle: -45 },
                yaxis: { title: 'Heures de Retard Cumulées', gridcolor: '#e0e0e0' },
                paper_bgcolor: 'white',
                plot_bgcolor: 'white',
                showlegend: false
              }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%', height: '350px' }}
            />
          </div>
        )}

        {/* Advanced Chart 4: Retard Total par Poste */}
        {advancedCharts?.delay_by_poste && advancedCharts.delay_by_poste.data && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--strong-blue)' }}>Retard Total Cumulé par Poste (Goulots d'Étranglement)</h3>
            <Plot
              data={[{
                x: advancedCharts.delay_by_poste.data.map(d => `Poste ${d.poste}`),
                y: advancedCharts.delay_by_poste.data.map(d => d.totalDelay),
                type: 'bar',
                marker: {
                  color: advancedCharts.delay_by_poste.data.map(d => d.totalDelay),
                  colorscale: [[0, '#DBEAFE'], [0.5, '#60A5FA'], [1, '#1E3A8A']],
                  showscale: false
                },
                text: advancedCharts.delay_by_poste.data.map(d => `${d.totalDelay.toFixed(1)}h`),
                textposition: 'outside',
                hovertemplate: '%{x}<br>Retard total: %{y:.1f}h<extra></extra>'
              }]}
              layout={{
                height: 350,
                margin: { t: 20, b: 60, l: 60, r: 20 },
                xaxis: { title: 'Poste d\'Assemblage', tickangle: -45 },
                yaxis: { title: 'Retard Total (Heures)', gridcolor: '#e0e0e0' },
                paper_bgcolor: 'white',
                plot_bgcolor: 'white',
                showlegend: false
              }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%', height: '350px' }}
            />
          </div>
        )}

        {/* Advanced Chart 5: Temps vs Employés */}
        {advancedCharts?.time_vs_employees && advancedCharts.time_vs_employees.data && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--strong-blue)' }}>Temps Consacré par Activité vs Force de Travail</h3>
            <Plot
              data={[{
                x: advancedCharts.time_vs_employees.data.map(d => d.nom),
                y: advancedCharts.time_vs_employees.data.map(d => d.totalTime),
                type: 'bar',
                marker: {
                  color: advancedCharts.time_vs_employees.data.map(d => d.totalEmployees),
                  colorscale: [[0, '#DBEAFE'], [0.5, '#3B82F6'], [1, '#1E3A8A']],
                  showscale: true,
                  colorbar: {
                    title: 'Employés',
                    titleside: 'right'
                  }
                },
                text: advancedCharts.time_vs_employees.data.map(d => `${d.totalTime.toFixed(1)}h`),
                textposition: 'outside',
                hovertemplate: '%{x}<br>Temps: %{y:.1f}h<br>Employés: %{marker.color}<extra></extra>'
              }]}
              layout={{
                height: 350,
                margin: { t: 20, b: 100, l: 60, r: 60 },
                xaxis: { title: 'Activité', tickangle: -45 },
                yaxis: { title: 'Temps Total (Heures)', gridcolor: '#e0e0e0' },
                paper_bgcolor: 'white',
                plot_bgcolor: 'white',
                showlegend: false
              }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%', height: '350px' }}
            />
          </div>
        )}

        {/* Advanced Chart 6: Impact Fournisseurs */}
        {advancedCharts?.supplier_impact && advancedCharts.supplier_impact.data && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--strong-blue)' }}>Impact des Fournisseurs sur les Retards de Production</h3>
            <Plot
              data={[{
                x: advancedCharts.supplier_impact.data.map(d => d.delay),
                y: advancedCharts.supplier_impact.data.map(d => d.supplier),
                type: 'bar',
                orientation: 'h',
                marker: {
                  color: advancedCharts.supplier_impact.data.map(d => d.delay),
                  colorscale: [[0, '#DBEAFE'], [0.5, '#60A5FA'], [1, '#1E40AF']],
                  showscale: false
                },
                text: advancedCharts.supplier_impact.data.map(d => `${d.delay.toFixed(1)}h`),
                textposition: 'outside',
                hovertemplate: '%{y}<br>Retard cumulé: %{x:.1f}h<extra></extra>'
              }]}
              layout={{
                height: 400,
                margin: { t: 20, b: 40, l: 150, r: 60 },
                xaxis: { title: 'Retard Cumulé (Heures)', gridcolor: '#e0e0e0' },
                yaxis: { title: 'Fournisseur', automargin: true },
                paper_bgcolor: 'white',
                plot_bgcolor: 'white',
                showlegend: false
              }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%', height: '400px' }}
            />
          </div>
        )}

        {/* Advanced Chart 7: Impact Financier par Fournisseur */}
        {advancedCharts?.supplier_financial_impact && advancedCharts.supplier_financial_impact.data && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--strong-blue)' }}>Impact Financier des Retards par Fournisseur</h3>
            <Plot
              data={[{
                x: advancedCharts.supplier_financial_impact.data.map(d => d.cost),
                y: advancedCharts.supplier_financial_impact.data.map(d => d.supplier),
                type: 'bar',
                orientation: 'h',
                marker: {
                  color: advancedCharts.supplier_financial_impact.data.map(d => d.cost),
                  colorscale: [[0, '#DBEAFE'], [0.5, '#3B82F6'], [1, '#1E3A8A']],
                  showscale: false
                },
                text: advancedCharts.supplier_financial_impact.data.map(d => `€${d.cost.toFixed(0)}`),
                textposition: 'outside',
                hovertemplate: '%{y}<br>Coût: €%{x:.2f}<extra></extra>'
              }]}
              layout={{
                height: 400,
                margin: { t: 20, b: 40, l: 150, r: 80 },
                xaxis: { title: 'Coût Main-d\'Oeuvre Gaspillée (€)', gridcolor: '#e0e0e0' },
                yaxis: { title: 'Fournisseur', automargin: true },
                paper_bgcolor: 'white',
                plot_bgcolor: 'white',
                showlegend: false
              }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%', height: '400px' }}
            />
          </div>
        )}

        {/* Advanced Chart 8: Matrice des Risques (Bubble) */}
        {advancedCharts?.risk_matrix && advancedCharts.risk_matrix.data && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--strong-blue)' }}>Matrice des Risques de Production (Flux x Retard x Coût x Criticité)</h3>
            <Plot
              data={
                Object.entries(
                  advancedCharts.risk_matrix.data.reduce((acc, item) => {
                    if (!acc[item.criticality]) acc[item.criticality] = [];
                    acc[item.criticality].push(item);
                    return acc;
                  }, {})
                ).map(([criticality, items]) => {
                  const colorMap = {
                    'Critique': '#1E3A8A',
                    'Haute': '#1E40AF',
                    'Moyenne': '#2563EB',
                    'Basse': '#60A5FA',
                    'Non Classé': '#93C5FD'
                  };
                  return {
                    x: items.map(d => d.poste),
                    y: items.map(d => d.delay),
                    mode: 'markers',
                    type: 'scatter',
                    name: criticality,
                    marker: {
                      size: items.map(d => Math.sqrt(d.cost) * 5),
                      color: colorMap[criticality] || '#95A5A6',
                      opacity: 0.7,
                      sizemode: 'diameter',
                      sizemin: 8
                    },
                    text: items.map(d => `${d.name}<br>Fournisseur: ${d.supplier}<br>Coût: €${d.cost.toFixed(2)}`),
                    hovertemplate: 'Poste %{x}<br>Retard: %{y:.2f}h<br>%{text}<extra></extra>'
                  };
                })
              }
              layout={{
                height: 500,
                margin: { t: 20, b: 60, l: 60, r: 20 },
                xaxis: { title: 'Flux de Production (Numéro de Poste)', gridcolor: '#e0e0e0' },
                yaxis: { title: 'Temps de Retard (Heures)', gridcolor: '#e0e0e0' },
                paper_bgcolor: 'white',
                plot_bgcolor: 'white',
                showlegend: true,
                legend: { x: 0, y: 1.1, orientation: 'h' },
                shapes: [{
                  type: 'line',
                  x0: 0,
                  x1: Math.max(...advancedCharts.risk_matrix.data.map(d => d.poste)),
                  y0: 1.0,
                  y1: 1.0,
                  line: { color: 'red', width: 2, dash: 'dash' }
                }],
                annotations: [{
                  x: Math.max(...advancedCharts.risk_matrix.data.map(d => d.poste)) * 0.9,
                  y: 1.0,
                  text: 'Seuil Critique (1h)',
                  showarrow: false,
                  yshift: 10,
                  font: { color: 'red', size: 10 }
                }]
              }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%', height: '500px' }}
            />
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <div style={{ background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderLeft: '4px solid #1E3A8A' }}>
          <h3 style={{ color: '#1E3A8A', marginBottom: '10px', fontSize: '16px' }}>🚨 Bottlenecks</h3>
          <div style={{ fontSize: '42px', fontWeight: 'bold', color: '#1E3A8A', marginBottom: '5px' }}>{bottlenecks.length}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Goulots d'étranglement identifiés</div>
          {bottlenecks.length > 0 && (
            <div style={{ marginTop: '15px', fontSize: '12px', color: '#888' }}>
              Plus critique: {bottlenecks[0].processName || bottlenecks[0].task}
            </div>
          )}
        </div>

        <div style={{ background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderLeft: '4px solid #2563EB' }}>
          <h3 style={{ color: '#2563EB', marginBottom: '10px', fontSize: '16px' }}>⚠️ Inefficiencies</h3>
          <div style={{ fontSize: '42px', fontWeight: 'bold', color: '#2563EB', marginBottom: '5px' }}>{inefficiencies.length}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Inefficiences détectées</div>
          {statistics.MES && (
            <div style={{ marginTop: '15px', fontSize: '12px', color: '#888' }}>
              Délai moyen: {statistics.MES.avgDelayMinutes.toFixed(1)} min
            </div>
          )}
        </div>

        <div style={{ background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderLeft: '4px solid #3B82F6' }}>
          <h3 style={{ color: '#1E40AF', marginBottom: '10px', fontSize: '16px' }}>💡 Improvements</h3>
          <div style={{ fontSize: '42px', fontWeight: 'bold', color: '#1E40AF', marginBottom: '5px' }}>{improvements.length}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Suggestions d'amélioration</div>
          {statistics.PLM && (
            <div style={{ marginTop: '15px', fontSize: '12px', color: '#888' }}>
              Focus: Supply chain optimization
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
