import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { getEmployeesData } from '../services/api';

function Employees({ analysis }) {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeStats, setEmployeeStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching employee data...');
      const data = await getEmployeesData();
      console.log('Employee data received:', data);
      setEmployeeStats(data);
    } catch (error) {
      console.error('Error fetching employee data:', error);
      setError(error.message);
      setEmployeeStats({
        employees: [],
        totalEmployees: 0,
        avgTasksPerEmployee: 0,
        totalTasks: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !employeeStats) {
    return (
      <div style={{ padding: '30px', textAlign: 'center' }}>
        <div className="loading">Chargement des données employés...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '30px' }}>
        <div style={{ background: '#FEE2E2', padding: '20px', borderRadius: '8px', color: '#991B1B' }}>
          <h3>❌ Erreur</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!employeeStats.employees || employeeStats.employees.length === 0) {
    return (
      <div style={{ padding: '30px' }}>
        <h1 style={{ marginBottom: '30px', color: '#1E3A8A' }}>👥 Analyse des Employés</h1>
        <div style={{ background: '#FEF3C7', padding: '20px', borderRadius: '8px', color: '#92400E' }}>
          <h3>⚠️ Aucune donnée</h3>
          <p>Aucune donnée d'employé n'a été trouvée dans le système MES.</p>
        </div>
      </div>
    );
  }

  const { employees, totalEmployees, avgTasksPerEmployee, totalTasks } = employeeStats;

  // Données pour les graphiques
  const employeesByExperience = employees.reduce((acc, emp) => {
    acc[emp.experience] = (acc[emp.experience] || 0) + 1;
    return acc;
  }, {});

  const tasksPerEmployee = employees.map(e => ({
    name: e.name,
    tasks: e.tasksCount,
    delays: e.delays
  })).sort((a, b) => b.tasks - a.tasks).slice(0, 15);

  const delayRateByEmployee = employees.map(e => ({
    name: e.name,
    rate: e.delayRate,
    experience: e.experience
  })).sort((a, b) => b.rate - a.rate).slice(0, 15);

  const timeByEmployee = employees.map(e => ({
    name: e.name,
    time: e.totalTime / 60, // en heures
    avgTime: e.avgTimePerTask
  })).sort((a, b) => b.time - a.time).slice(0, 15);

  return (
    <div style={{ padding: '30px', overflowY: 'auto', height: '100%', background: '#f5f8fa' }}>
      <h1 style={{ marginBottom: '30px', color: '#1E3A8A' }}>👥 Analyse des Employés</h1>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="kpi-card" style={{ background: '#DBEAFE' }}>
          <div className="kpi-value" style={{ color: '#1E3A8A' }}>{totalEmployees}</div>
          <div className="kpi-label">Employés Actifs</div>
        </div>
        <div className="kpi-card" style={{ background: '#DBEAFE' }}>
          <div className="kpi-value" style={{ color: '#2563EB' }}>{totalTasks}</div>
          <div className="kpi-label">Tâches Totales</div>
        </div>
        <div className="kpi-card" style={{ background: '#EFF6FF' }}>
          <div className="kpi-value" style={{ color: '#1E40AF' }}>{avgTasksPerEmployee.toFixed(1)}</div>
          <div className="kpi-label">Tâches Moy./Employé</div>
        </div>
        <div className="kpi-card" style={{ background: '#EFF6FF' }}>
          <div className="kpi-value" style={{ color: '#3B82F6' }}>
            {(employees.reduce((sum, e) => sum + e.delayRate, 0) / employees.length).toFixed(1)}%
          </div>
          <div className="kpi-label">Taux de Retard Moyen</div>
        </div>
      </div>

      {/* Graphiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        {/* Répartition par niveau d'expérience */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>📊 Répartition par Niveau d'Expérience</h3>
          <Plot
            data={[{
              values: Object.values(employeesByExperience),
              labels: Object.keys(employeesByExperience),
              type: 'pie',
              marker: {
                colors: ['#1E3A8A', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD']
              },
              textinfo: 'label+percent',
              textposition: 'auto',
              hovertemplate: '<b>%{label}</b><br>%{value} employés<br>%{percent}<extra></extra>'
            }]}
            layout={{
              height: 350,
              showlegend: true,
              margin: { t: 20, b: 20, l: 20, r: 20 }
            }}
            config={{ displayModeBar: false }}
            style={{ width: '100%' }}
          />
        </div>

        {/* Nombre de tâches par employé */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>📈 Tâches par Employé (Top 15)</h3>
          <Plot
            data={[
              {
                x: tasksPerEmployee.map(e => e.tasks),
                y: tasksPerEmployee.map(e => e.name),
                type: 'bar',
                orientation: 'h',
                marker: {
                  color: tasksPerEmployee.map(e => e.tasks),
                  colorscale: [[0, '#93C5FD'], [0.5, '#3B82F6'], [1, '#1E3A8A']],
                  showscale: false
                },
                text: tasksPerEmployee.map(e => e.tasks),
                textposition: 'auto',
                hovertemplate: '<b>%{y}</b><br>%{x} tâches<extra></extra>'
              }
            ]}
            layout={{
              height: 400,
              margin: { t: 20, b: 40, l: 120, r: 20 },
              xaxis: { title: 'Nombre de tâches' },
              yaxis: { title: '' }
            }}
            config={{ displayModeBar: false }}
            style={{ width: '100%' }}
          />
        </div>

        {/* Taux de retard par employé */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>⚠️ Taux de Retard par Employé (Top 15)</h3>
          <Plot
            data={[
              {
                x: delayRateByEmployee.map(e => e.rate),
                y: delayRateByEmployee.map(e => e.name),
                type: 'bar',
                orientation: 'h',
                marker: {
                  color: delayRateByEmployee.map(e => e.rate),
                  colorscale: [[0, '#93C5FD'], [0.5, '#F59E0B'], [1, '#DC2626']],
                  showscale: false
                },
                text: delayRateByEmployee.map(e => e.rate.toFixed(1) + '%'),
                textposition: 'auto',
                hovertemplate: '<b>%{y}</b><br>%{x:.1f}% de retard<br>Expérience: ' + 
                  delayRateByEmployee.map(e => e.experience).join('<br>') + '<extra></extra>'
              }
            ]}
            layout={{
              height: 400,
              margin: { t: 20, b: 40, l: 120, r: 20 },
              xaxis: { title: 'Taux de retard (%)' },
              yaxis: { title: '' }
            }}
            config={{ displayModeBar: false }}
            style={{ width: '100%' }}
          />
        </div>

        {/* Temps total par employé */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>⏱️ Temps Total Travaillé (Top 15)</h3>
          <Plot
            data={[
              {
                x: timeByEmployee.map(e => e.time),
                y: timeByEmployee.map(e => e.name),
                type: 'bar',
                orientation: 'h',
                marker: {
                  color: timeByEmployee.map(e => e.time),
                  colorscale: [[0, '#DBEAFE'], [0.5, '#60A5FA'], [1, '#1E40AF']],
                  showscale: false
                },
                text: timeByEmployee.map(e => e.time.toFixed(1) + 'h'),
                textposition: 'auto',
                hovertemplate: '<b>%{y}</b><br>%{x:.1f} heures<br>Moy: ' + 
                  timeByEmployee.map(e => e.avgTime.toFixed(1) + ' min/tâche').join('<br>') + '<extra></extra>'
              }
            ]}
            layout={{
              height: 400,
              margin: { t: 20, b: 40, l: 120, r: 20 },
              xaxis: { title: 'Temps total (heures)' },
              yaxis: { title: '' }
            }}
            config={{ displayModeBar: false }}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Liste des employés */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginBottom: '15px', color: '#333' }}>📋 Liste Détaillée des Employés</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1E3A8A', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Nom</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Expérience</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Tâches</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Retards</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Taux Retard</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Postes</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Pièces</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Temps Total</th>
              </tr>
            </thead>
            <tbody>
              {employees.sort((a, b) => b.tasksCount - a.tasksCount).map((emp, idx) => (
                <tr 
                  key={emp.id}
                  style={{ 
                    background: idx % 2 === 0 ? '#F9FAFB' : 'white',
                    borderBottom: '1px solid #E5E7EB',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#EFF6FF'}
                  onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? '#F9FAFB' : 'white'}
                  onClick={() => setSelectedEmployee(selectedEmployee?.id === emp.id ? null : emp)}
                >
                  <td style={{ padding: '10px' }}>{emp.id}</td>
                  <td style={{ padding: '10px', fontWeight: '600' }}>{emp.name}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ 
                      background: emp.experience === 'Expert' ? '#1E3A8A' : 
                                 emp.experience === 'Expérimenté' ? '#2563EB' : 
                                 emp.experience === 'Intermédiaire' ? '#60A5FA' : '#93C5FD',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {emp.experience}
                    </span>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{emp.tasksCount}</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: emp.delays > 0 ? '#DC2626' : '#10B981' }}>
                    {emp.delays}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <span style={{ 
                      fontWeight: '600',
                      color: emp.delayRate > 50 ? '#DC2626' : emp.delayRate > 25 ? '#F59E0B' : '#10B981'
                    }}>
                      {emp.delayRate.toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ padding: '10px', fontSize: '12px' }}>
                    {emp.postes.length} poste{emp.postes.length > 1 ? 's' : ''}
                  </td>
                  <td style={{ padding: '10px', fontSize: '12px' }}>
                    {emp.pieces.length} pièce{emp.pieces.length > 1 ? 's' : ''}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    {(emp.totalTime / 60).toFixed(1)}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Détails de l'employé sélectionné */}
      {selectedEmployee && (
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          marginTop: '20px',
          borderLeft: '4px solid #1E3A8A'
        }}>
          <h3 style={{ marginBottom: '15px', color: '#1E3A8A' }}>
            📝 Détails - {selectedEmployee.name}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
            <div>
              <strong>Niveau d'expérience:</strong> {selectedEmployee.experience}
            </div>
            <div>
              <strong>Postes travaillés:</strong> {selectedEmployee.postes.join(', ')}
            </div>
            <div>
              <strong>Pièces manipulées:</strong> {selectedEmployee.pieces.join(', ')}
            </div>
            <div>
              <strong>Temps moyen/tâche:</strong> {selectedEmployee.avgTimePerTask.toFixed(1)} min
            </div>
          </div>
          <h4 style={{ marginTop: '15px', marginBottom: '10px', color: '#333' }}>Historique des tâches récentes:</h4>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {selectedEmployee.tasks.slice(0, 10).map((task, idx) => (
              <div key={idx} style={{ 
                padding: '8px', 
                background: idx % 2 === 0 ? '#F9FAFB' : 'white',
                borderRadius: '4px',
                marginBottom: '4px',
                fontSize: '13px'
              }}>
                <strong>{task.date}</strong> à {task.heure} - Poste {task.poste} - {task.piece} - {task.temps}
                {task.delay && <span style={{ color: '#DC2626', marginLeft: '10px' }}>⚠️ {task.delay}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Employees;
