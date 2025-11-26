# Transformation Backend : JavaScript → Python ✅

## Ce qui a été fait

Le backend Node.js a été complètement transformé en **Python avec Flask**.

### Structure du nouveau backend Python

```
backend/
├── app.py                          # Point d'entrée principal Flask
├── requirements.txt                # Dépendances Python
├── routes/
│   ├── __init__.py
│   └── process_routes.py          # Routes API (anciennement processRoutes.js)
└── services/
    ├── __init__.py
    └── process_service.py         # Logique métier (anciennement processService.js)
```

### Équivalences JavaScript → Python

| JavaScript (Node.js) | Python (Flask) |
|---------------------|----------------|
| `express` | `Flask` |
| `cors` | `flask-cors` |
| `xlsx` (parsing Excel) | `pandas` + `openpyxl` |
| `require()` | `import` |
| `module.exports` | `return` ou classes |
| `async/await` | fonctions normales (pas besoin d'async pour I/O synchrone) |

## Installation et démarrage

### 1. Installer les dépendances Python

```bash
cd backend
pip install -r requirements.txt
```

### 2. Lancer le serveur backend Python

```bash
python app.py
```

Le serveur démarre sur **http://localhost:3001**

### 3. Lancer le frontend React (dans un autre terminal)

```bash
cd frontend
npm start
```

Le frontend démarre sur **http://localhost:3000**

## Comment modifier le code

### Modifier l'analyse des données

Éditez `backend/services/process_service.py` :

```python
def get_analysis(self):
    # ... votre logique ici ...
    
    # Exemple : ajouter une nouvelle amélioration
    analysis['improvements'].append({
        'system': 'MES',
        'suggestion': 'Votre suggestion',
        'reason': 'Votre raison'
    })
```

### Ajouter une nouvelle route API

Éditez `backend/routes/process_routes.py` :

```python
@process_bp.route('/nouvelle-route', methods=['GET'])
def nouvelle_fonction():
    try:
        # Votre logique
        return jsonify({'resultat': 'données'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

## Avantages de Python pour vous

1. **Syntaxe plus simple** : Pas de `{}`, `()`, `;` partout
2. **Pandas pour Excel** : Beaucoup plus simple que la lib JavaScript
3. **Débogage facile** : Ajoutez `print()` n'importe où
4. **Documentation** : Plus de ressources Python pour débutants

## Structure des données

Le backend charge 3 fichiers Excel :
- `ERP_Equipes Airplus.xlsx` → Données employés
- `MES_Extraction.xlsx` → Données fabrication
- `PLM_DataSet.xlsx` → Données pièces

Et génère une analyse avec :
- `statistics` : Statistiques par système
- `bottlenecks` : Goulots d'étranglement
- `inefficiencies` : Inefficacités détectées
- `improvements` : Suggestions d'amélioration

## Endpoints API disponibles

- `GET /health` → Vérifier que le serveur fonctionne
- `GET /api/processes` → Récupérer toutes les données brutes
- `GET /api/analysis` → Récupérer l'analyse complète
- `GET /api/flow` → Récupérer les données pour le graphique

## Tester l'API

Ouvrez dans votre navigateur :
- http://localhost:3001/health
- http://localhost:3001/api/analysis

Ou utilisez `curl` :
```bash
curl http://localhost:3001/api/analysis
```

## Fichiers JavaScript originaux (archivés)

Les anciens fichiers Node.js sont toujours présents :
- `src/index.js`
- `src/routes/processRoutes.js`
- `src/services/processService.js`
- `package.json`

Vous pouvez les supprimer si vous voulez, mais ils peuvent servir de référence.

## Besoin d'aide ?

Le code Python est commenté et structuré de façon simple. Chaque fonction a un but clair :

- `get_all_processes()` → Charge les fichiers Excel
- `get_analysis()` → Analyse les données
- `get_flow_data()` → Génère les données pour le graphique

Pour ajouter de nouvelles analyses, suivez le même modèle dans `get_analysis()`.
