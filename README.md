# Process Mining Application

A simple process mining application template that analyzes CSV data from multiple systems to identify bottlenecks, inefficiencies, and improvement opportunities.

## Features

- **Multi-system data analysis**: Processes CSV files from 3 different systems
- **Bottleneck detection**: Identifies activities with unusually high durations
- **Inefficiency analysis**: Detects repeated activities within the same case
- **Improvement suggestions**: Provides recommendations based on process patterns
- **Visual process flow**: Interactive ReactFlow visualization of process flows
- **Statistics dashboard**: Shows key metrics for each system

## Project Structure

```
├── backend/
│   ├── data/               # CSV data files (3 systems)
│   ├── src/
│   │   ├── index.js        # Express server entry point
│   │   ├── routes/         # API routes
│   │   └── services/       # Business logic
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
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

- `GET /api/processes` - Returns all process data from CSV files
- `GET /api/analysis` - Returns analysis results (bottlenecks, inefficiencies, improvements)
- `GET /api/flow` - Returns flow data formatted for ReactFlow visualization
- `GET /health` - Health check endpoint

## CSV Data Format

Each CSV file should have the following columns:
- `case_id` - Unique identifier for the process case
- `activity` - Name of the activity
- `timestamp` - When the activity occurred
- `duration` - Duration of the activity (in time units)
- `resource` - System or resource handling the activity

## Technologies Used

- **Backend**: Node.js, Express, csv-parser
- **Frontend**: React, ReactFlow
- **Styling**: CSS