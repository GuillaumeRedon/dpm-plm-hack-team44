# RONDO - Process Mining Application

Application d'analyse de processus de fabrication qui exploite les données de plusieurs systèmes (ERP, MES, PLM) pour identifier les goulots d'étranglement, les inefficacités et les opportunités d'amélioration dans les processus d'assemblage aéronautique.

## Fonctionnalités

### 📅 Timeline
- **Visualisation temporelle interactive**: Affichage des opérations sur un axe temporel (6h-20h)
- **Filtre par date**: Sélection de dates spécifiques pour analyser les opérations
- **Détails des tâches**: Information complète sur chaque opération (poste, pièces, durée, retards)
- **Détection de retards**: Identification visuelle des opérations en retard

### 📊 Dashboard
- **KPIs en temps réel**: Métriques clés de performance (criticité, coûts, délais)
- **Graphiques avancés**: Visualisations Plotly interactives
  - Analyse de criticité des pièces
  - Répartition des coûts par système
  - Lead times et fournisseurs
  - Analyse des retards
- **Analyse multi-systèmes**: Intégration des données ERP, MES, PLM

### 🤖 IA Analysis
- **Analyse intelligente par Gemini AI**: Insights générés automatiquement
- **Recommandations stratégiques**: Suggestions d'amélioration basées sur les données
- **Détection de patterns**: Identification des tendances et anomalies

### 👥 Employees (caché en production)
- **Analytics RH**: Statistiques détaillées par employé
- **Performance tracking**: Suivi des tâches, temps et retards
- **Graphiques de distribution**: Expérience, charge de travail, taux de retard

## Architecture du projet

```
dpm-plm-hack-team44/
├── data/                          # Fichiers Excel sources (ERP, MES, PLM)
├── backend/                       # Backend Python/Flask
│   ├── app.py                     # Point d'entrée Flask
│   ├── requirements.txt           # Dépendances Python
│   ├── .env                       # Configuration (API Gemini)
│   ├── routes/
│   │   └── process_routes.py     # Routes API
│   └── services/
│       └── process_service.py    # Logique métier et analyse
├── frontend/                      # Frontend React
│   ├── public/
│   │   ├── index.html
│   │   └── logo_rondo.png        # Logo RONDO
│   ├── src/
│   │   ├── App.js                # Application principale
│   │   ├── index.css             # Styles globaux (thème bleu)
│   │   ├── components/
│   │   │   ├── ProcessFlow.js    # Timeline ReactFlow
│   │   │   ├── Dashboard.js      # Tableau de bord
│   │   │   ├── AIAnalysis.js     # Analyse IA
│   │   │   ├── AnalysisPanel.js  # Panneau latéral
│   │   │   ├── AdvancedCharts.js # Graphiques avancés
│   │   │   └── Employees.js      # Page employés (cachée)
│   │   └── services/
│   │       └── api.js            # Client API
│   └── package.json
└── README.md
```

## Démarrage rapide

### Prérequis

- **Python 3.9+** (pour le backend)
- **Node.js 16+** (pour le frontend)
- **Clé API Google Gemini** (pour l'analyse IA)

### Installation

#### 1. Backend Python

```bash
cd backend

# Créer un environnement virtuel (optionnel mais recommandé)
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # macOS/Linux

# Installer les dépendances
pip install -r requirements.txt

# Configurer l'API Gemini
# Créer un fichier .env avec:
GEMINI_API_KEY=votre_cle_api_ici
```

#### 2. Frontend React

```bash
cd frontend
npm install
```

### Lancement de l'application

#### 1. Démarrer le backend

```bash
cd backend
python app.py
```
Le serveur démarre sur **http://localhost:3001**

#### 2. Démarrer le frontend (nouveau terminal)

```bash
cd frontend
npm start
```
Le frontend démarre sur **http://localhost:3000**

## API Endpoints

### Routes principales

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/health` | GET | Health check du serveur |
| `/api/analysis` | GET | Analyse des goulots d'étranglement et inefficacités |
| `/api/flow` | GET | Données pour la timeline ReactFlow |
| `/api/flow?date=YYYY-MM-DD` | GET | Timeline filtrée par date |
| `/api/charts` | GET | Données pour les graphiques du dashboard |
| `/api/ai-analysis` | GET | Analyse générée par Gemini AI |
| `/api/processes` | GET | Données brutes de tous les processus |
| `/api/employees` | GET | Statistiques des employés |

### Formats de réponse

#### `/api/flow`
```json
{
  "nodes": [...],  // Nœuds ReactFlow avec positions temporelles
  "edges": [...],  // Connexions entre nœuds
  "availableDates": ["2024-01-15", "2024-01-16", ...]
}
```

#### `/api/analysis`
```json
{
  "bottlenecks": [{
    "system": "PLM",
    "item": "Nom de la pièce",
    "reason": "Long délai d'approvisionnement"
  }],
  "inefficiencies": [...],
  "improvements": [...]
}
```

## Fichiers de données

L'application nécessite 3 fichiers Excel dans le répertoire `data/`:

### 1. **ERP_Equipes Airplus.xlsx** - Données RH
Colonnes requises:
- `ID`, `Matricule`, `Prénom`, `Nom`, `Âge`
- `Niveau d'expérience`, `Qualification`, `Coût horaire`
- `Poste de montage`, `Statut`

### 2. **MES_Extraction.xlsx** - Données de production
Colonnes requises:
- `Poste`, `Nom`, `Nombre pièces`, `Référence`
- `Temps Prévu`, `Temps Réel`, `Date`
- `Heure Début`, `Heure Fin`
- `Aléas Industriels`, `Cause Potentielle`

### 3. **PLM_DataSet.xlsx** - Données produits
Colonnes requises:
- `Code/Référence`, `Désignation`
- `Fournisseur`, `Délai Approvisionnement`
- `Criticité`, `Coût Unitaire`

## Technologies utilisées

### Backend
- **Flask 3.0.0** - Framework web Python
- **Pandas 2.1.4** - Manipulation de données Excel
- **Google Generative AI** - Analyse IA avec Gemini
- **Flask-CORS** - Gestion des CORS

### Frontend
- **React 18.2.0** - Framework UI
- **ReactFlow** - Visualisation de timeline interactive
- **Plotly.js** - Graphiques interactifs avancés

### Style
- **Palette bleue professionnelle**:
  - Primary: `#1E3A8A` (dark blue)
  - Accent: `#2563EB`, `#3B82F6`, `#60A5FA`
  - Light: `#93C5FD`, `#DBEAFE`

## Optimisations

- ✅ **Appel API unique**: Un seul appel Gemini au chargement (économie de tokens)
- ✅ **Préselection de date**: Première date automatiquement sélectionnée
- ✅ **Axe temporel**: Échelle horaire 6h-20h avec graduations
- ✅ **Fusion ERP/MES**: Statistiques employés basées sur données croisées
- ✅ **UI responsive**: Layout adaptatif pour tous les écrans

## Notes de développement

### Page Employees cachée
La page `Employees` est développée mais cachée en production. Pour la réactiver:
1. Ouvrir `frontend/src/App.js`
2. Décommenter les lignes ~116-130 (bouton Employés)
3. Recharger l'application

### Configuration Gemini
Le backend nécessite une clé API Gemini dans `.env`:
```
GEMINI_API_KEY=votre_cle_ici
```
Obtenir une clé sur: https://makersuite.google.com/app/apikey