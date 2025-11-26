const API_BASE = 'http://localhost:3001/api';

export async function getProcesses() {
  const response = await fetch(`${API_BASE}/processes`);
  if (!response.ok) throw new Error('Failed to fetch processes');
  return response.json();
}

export async function getAnalysis() {
  const response = await fetch(`${API_BASE}/analysis`);
  if (!response.ok) throw new Error('Failed to fetch analysis');
  return response.json();
}

export async function getFlowData() {
  const response = await fetch(`${API_BASE}/flow`);
  if (!response.ok) throw new Error('Failed to fetch flow data');
  return response.json();
}
