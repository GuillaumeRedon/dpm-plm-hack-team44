const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001/api';

export async function getAnalysis() {
  const response = await fetch(`${API_BASE}/analysis`);
  if (!response.ok) throw new Error('Failed to fetch analysis');
  return response.json();
}

export async function getFlowData(date = null) {
  const url = date ? `${API_BASE}/flow?date=${date}` : `${API_BASE}/flow`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch flow data');
  return response.json();
}

export async function getCharts() {
  const response = await fetch(`${API_BASE}/charts`);
  if (!response.ok) throw new Error('Failed to fetch charts');
  return response.json();
}

export async function getProcesses() {
  const response = await fetch(`${API_BASE}/processes`);
  if (!response.ok) throw new Error('Failed to fetch processes');
  return response.json();
}

export async function getAllProcesses() {
  const response = await fetch(`${API_BASE}/processes`);
  if (!response.ok) throw new Error('Failed to fetch all processes');
  return response.json();
}

export async function getAIAnalysis() {
  const response = await fetch(`${API_BASE}/ai-analysis`);
  if (!response.ok) throw new Error('Failed to fetch AI analysis');
  return response.json();
}

export async function getEmployeesData() {
  const response = await fetch(`${API_BASE}/employees`);
  if (!response.ok) throw new Error('Failed to fetch employees data');
  return response.json();
}
