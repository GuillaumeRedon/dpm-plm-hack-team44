# Process Mining Application

A process mining application template that analyzes data from multiple manufacturing systems (ERP, MES, PLM) to identify bottlenecks, inefficiencies, and improvement opportunities in aircraft assembly processes.

## Features

- **Multi-system data analysis**: Processes Excel files from 3 different systems:
  - **ERP**: Workforce management data (employees, qualifications, costs)
  - **MES**: Manufacturing execution data (operations, timing, issues)
  - **PLM**: Product lifecycle data (parts, suppliers, criticality)
- **Bottleneck detection**: Identifies critical parts with long lead times and delayed operations
- **Inefficiency analysis**: Detects high-cost items and labor inefficiencies
- **Improvement suggestions**: Provides recommendations based on data patterns
- **Visual process flow**: Interactive ReactFlow visualization showing system relationships
- **Statistics dashboard**: Shows key metrics for each system

## Project Structure

```
├── data/                   # Excel data files (ERP, MES, PLM)
├── backend/
│   ├── src/
│   │   ├── index.js        # Express server entry point
│   │   ├── routes/         # API routes
│   │   └── services/       # Business logic (Excel parsing, analysis)
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components (ProcessFlow, AnalysisPanel)
│   │   ├── services/       # API client
│   │   ├── App.js          # Main application
│   │   └── index.js        # Entry point
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm start
```
The server will run on http://localhost:3001

2. In a new terminal, start the frontend:
```bash
cd frontend
npm start
```
The frontend will run on http://localhost:3000

## API Endpoints

- `GET /api/processes` - Returns all process data from Excel files
- `GET /api/analysis` - Returns analysis results (bottlenecks, inefficiencies, improvements)
- `GET /api/flow` - Returns flow data formatted for ReactFlow visualization
- `GET /health` - Health check endpoint

## Data Files

The application expects the following Excel files in the `data/` directory:

1. **ERP_Equipes Airplus.xlsx** - Employee data with columns:
   - Matricule, Prénom, Nom, Âge, Qualification, Poste de montage, etc.

2. **MES_Extraction.xlsx** - Manufacturing operations with columns:
   - Poste, Nom, Temps Prévu, Temps Réel, Aléas Industriels, etc.

3. **PLM_DataSet.xlsx** - Parts data with columns:
   - Code/Référence, Désignation, Fournisseur, Délai Approvisionnement, Criticité, etc.

## Technologies Used

- **Backend**: Node.js, Express, xlsx (for Excel parsing)
- **Frontend**: React, ReactFlow
- **Styling**: CSS