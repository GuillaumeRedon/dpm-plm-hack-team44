# Backend Python (Flask)

## Installation

1. Installer les dépendances Python :
```bash
cd backend
pip install -r requirements.txt
```

## Démarrage du serveur

```bash
python app.py
```

Le serveur démarre sur http://localhost:3001

## Structure

- `app.py` : Point d'entrée principal de l'application Flask
- `routes/process_routes.py` : Définition des routes API
- `services/process_service.py` : Logique métier pour l'analyse des données

## API Endpoints

- `GET /health` : Vérifier l'état du serveur
- `GET /api/processes` : Obtenir toutes les données des systèmes
- `GET /api/analysis` : Obtenir l'analyse (bottlenecks, inefficiencies, improvements)
- `GET /api/flow` : Obtenir les données pour la visualisation du flux

## Modification du code

Tous les fichiers sont en Python, faciles à comprendre et modifier :

- **app.py** : Configuration Flask de base
- **routes/process_routes.py** : Routes HTTP (comme des URLs)
- **services/process_service.py** : Toute la logique d'analyse des fichiers Excel

Pour modifier l'analyse, éditez `services/process_service.py`.
