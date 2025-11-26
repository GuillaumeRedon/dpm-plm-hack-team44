import os
import pandas as pd
from pathlib import Path

class ProcessService:
    def __init__(self):
        # Chemin vers le répertoire data
        self.data_dir = Path(__file__).parent.parent.parent / 'data'
        
        self.files = {
            'ERP': 'ERP_Equipes Airplus.xlsx',
            'MES': 'MES_Extraction.xlsx',
            'PLM': 'PLM_DataSet.xlsx'
        }
    
    def _parse_excel(self, file_path):
        """Parse un fichier Excel et retourne les données sous forme de liste de dictionnaires"""
        df = pd.read_excel(file_path)
        # Convertir les objets datetime en chaînes pour la sérialisation JSON
        for col in df.columns:
            if df[col].dtype == 'datetime64[ns]':
                df[col] = df[col].astype(str)
            elif df[col].dtype == 'object':
                # Convertir les objets time et autres types non-sérialisables
                df[col] = df[col].apply(lambda x: str(x) if pd.notna(x) and not isinstance(x, (int, float, str, bool)) else x)
        return df.to_dict('records')
    
    # def _time_to_minutes(self, time_str):
    #     """Convertit une chaîne de temps (HH:MM:SS) en minutes"""
    #     if not time_str or pd.isna(time_str):
    #         return 0
    #     try:
    #         parts = str(time_str).split(':')
    #         if len(parts) == 3:
    #             hours, minutes, seconds = map(int, parts)
    #             return hours * 60 + minutes + seconds / 60
    #     except:
    #         pass
    #     return 0
    
    def _time_to_minutes(self, time_str):
        """Convertit une chaîne de temps (HH:MM:SS) en minutes"""
        if not time_str or pd.isna(time_str):
            return 0
        try:
            parts = str(time_str).split(':')
            if len(parts) == 3:
                hours, minutes, seconds = map(int, parts)
                return round(hours * 60 + minutes + seconds / 60)*15
        except:
            pass
        return 0
    
    def time_to_seconds(self, time_str):
        """Convertit une chaîne de temps (HH:MM:SS) en secondes"""
        if not time_str or pd.isna(time_str):
            return 0
        try:
            parts = str(time_str).split(':')
            if len(parts) == 3:
                hours, minutes, seconds = map(int, parts)
                return round((hours * 3600 + minutes * 60 + seconds)/10)
        except:
            pass
        return 0
    
    def get_all_processes(self):
        """Charge tous les fichiers Excel du répertoire data"""
        all_data = {}
        
        for system_name, file_name in self.files.items():
            file_path = self.data_dir / file_name
            if file_path.exists():
                all_data[system_name] = self._parse_excel(file_path)
        
        return all_data
    
    def get_analysis(self):
        """Analyse les processus pour identifier bottlenecks, inefficiencies, et improvements"""
        all_data = self.get_all_processes()
        analysis = {
            'bottlenecks': [],
            'inefficiencies': [],
            'improvements': [],
            'statistics': {}
        }
        
        # Analyse des données ERP (Équipes/Employés)
        if 'ERP' in all_data:
            erp = all_data['ERP']
            costs = [float(r.get('Coût horaire (€)', 0) or 0) for r in erp]
            ages = [int(r.get('Âge', 0) or 0) for r in erp]
            avg_cost = sum(costs) / len(costs) if costs else 0
            avg_age = sum(ages) / len(ages) if ages else 0
            
            analysis['statistics']['ERP'] = {
                'totalEmployees': len(erp),
                'avgHourlyCost': round(avg_cost, 2),
                'avgAge': round(avg_age, 1),
                'experienceLevels': {}
            }
            
            # Compter les niveaux d'expérience
            for emp in erp:
                level = emp.get("Niveau d'expérience", 'Unknown')
                analysis['statistics']['ERP']['experienceLevels'][level] = \
                    analysis['statistics']['ERP']['experienceLevels'].get(level, 0) + 1
            
            # Identifier les employés avec coûts élevés
            for emp in erp:
                cost = float(emp.get('Coût horaire (€)', 0) or 0)
                if cost > avg_cost * 1.3:
                    analysis['inefficiencies'].append({
                        'system': 'ERP',
                        'type': 'High Labor Cost',
                        'detail': f"{emp.get('Prénom', '')} {emp.get('Nom', '')} ({emp.get('Qualification', '')})",
                        'value': f"€{cost:.2f}/h vs avg €{avg_cost:.2f}/h",
                        'reason': 'Hourly cost exceeds average by 30%+'
                    })
            
            # Vérifier les lacunes de compétences
            junior_count = sum(1 for e in erp if e.get("Niveau d'expérience") == 'Débutant')
            if junior_count > len(erp) * 0.3:
                analysis['improvements'].append({
                    'system': 'ERP',
                    'suggestion': 'Implement mentorship program',
                    'reason': f"{int((junior_count/len(erp))*100)}% of workforce are beginners"
                })
        
        # Analyse des données MES (Fabrication)
        if 'MES' in all_data:
            mes = all_data['MES']
            
            # Calculer les délais
            time_delays = []
            for r in mes:
                planned = self.time_to_seconds(r.get('Temps Prévu'))
                actual = self.time_to_seconds(r.get('Temps Réel'))
                delay = actual - planned
                time_delays.append({
                    **r,
                    'planned': planned,
                    'actual': actual,
                    'delay': delay
                })
            
            total_delay = sum(max(0, r['delay']) for r in time_delays)
            avg_delay = total_delay / len(mes) if mes else 0
            
            analysis['statistics']['MES'] = {
                'totalOperations': len(mes),
                'totalDelayMinutes': round(total_delay, 1),
                'avgDelayMinutes': round(avg_delay, 1),
                'issuesByType': {}
            }
            
            # Compter les problèmes par type
            for op in mes:
                issue = op.get('Aléas Industriels', 'None')
                analysis['statistics']['MES']['issuesByType'][issue] = \
                    analysis['statistics']['MES']['issuesByType'].get(issue, 0) + 1
            
            # Identifier les bottlenecks (opérations avec délais significatifs)
            for op in time_delays:
                if op['delay'] > 10:  # Plus de 10 minutes de délai
                    analysis['bottlenecks'].append({
                        'system': 'MES',
                        'activity': op.get('Nom', ''),
                        'workstation': f"Poste {op.get('Poste', '')}",
                        'plannedTime': op.get('Temps Prévu', ''),
                        'actualTime': op.get('Temps Réel', ''),
                        'delay': f"+{op['delay']:.1f} min",
                        'issue': op.get('Aléas Industriels', 'Unknown'),
                        'cause': op.get('Cause Potentielle', 'Not specified')
                    })
            
            # Trouver les problèmes récurrents
            issue_counts = {}
            for op in mes:
                issue = op.get('Aléas Industriels')
                if issue:
                    issue_counts[issue] = issue_counts.get(issue, 0) + 1
            
            for issue, count in issue_counts.items():
                if count >= 3:
                    analysis['improvements'].append({
                        'system': 'MES',
                        'suggestion': f'Address recurring issue: {issue}',
                        'reason': f'Occurred {count} times - consider preventive measures'
                    })
        
        # Analyse des données PLM (Cycle de vie produit)
        if 'PLM' in all_data:
            plm = all_data['PLM']
            costs = [float(r.get('Coût achat pièce (€)', 0) or 0) for r in plm]
            total_cost = sum(costs)
            avg_cost = total_cost / len(plm) if plm else 0
            
            analysis['statistics']['PLM'] = {
                'totalParts': len(plm),
                'totalPartsCost': f"€{total_cost:,.0f}",
                'avgPartCost': f"€{avg_cost:.2f}",
                'criticalParts': sum(1 for p in plm if p.get('Criticité') == 'Critique'),
                'supplierCount': len(set(p.get('Fournisseur', '') for p in plm))
            }
            
            # Identifier les pièces critiques avec longs délais
            for part in plm:
                if part.get('Criticité') == 'Critique':
                    lead_time = str(part.get('Délai Approvisionnement', ''))
                    if '20' in lead_time or '25' in lead_time:
                        analysis['bottlenecks'].append({
                            'system': 'PLM',
                            'activity': 'Supply Chain',
                            'part': part.get('Désignation', ''),
                            'reference': part.get('Code / Référence', ''),
                            'leadTime': lead_time,
                            'criticality': part.get('Criticité', ''),
                            'supplier': part.get('Fournisseur', ''),
                            'reason': 'Critical part with long lead time'
                        })
            
            # Vérifier les pièces coûteuses
            for part in plm:
                cost = float(part.get('Coût achat pièce (€)', 0) or 0)
                if cost > 50000:
                    analysis['inefficiencies'].append({
                        'system': 'PLM',
                        'type': 'High Part Cost',
                        'detail': f"{part.get('Désignation', '')} ({part.get('Code / Référence', '')})",
                        'value': f"€{cost:,.0f}",
                        'reason': 'Consider alternative suppliers or design optimization'
                    })
            
            # Risque de concentration des fournisseurs
            supplier_parts = {}
            for part in plm:
                supplier = part.get('Fournisseur', '')
                supplier_parts[supplier] = supplier_parts.get(supplier, 0) + 1
            
            for supplier, count in supplier_parts.items():
                if count > len(plm) * 0.25:
                    analysis['improvements'].append({
                        'system': 'PLM',
                        'suggestion': f'Diversify supplier base for {supplier}',
                        'reason': f'{count} parts ({int((count/len(plm))*100)}%) from single supplier'
                    })
        
        return analysis
    
    def get_flow_data(self):
        """Génère une timeline des tâches du projet basée sur l'enchaînement temporel"""
        all_data = self.get_all_processes()
        nodes = []
        edges = []
        
        if 'MES' not in all_data:
            return {'nodes': nodes, 'edges': edges}
        
        mes = all_data['MES']
        
        # Fonction pour parser date et heure en datetime pour un tri correct
        def get_datetime(op):
            try:
                date_str = str(op.get('Date', ''))
                time_str = str(op.get('Heure Début', ''))
                
                # Si la date contient déjà l'heure, utiliser seulement la partie date
                if ' ' in date_str:
                    date_str = date_str.split()[0]
                
                datetime_str = f"{date_str} {time_str}"
                return pd.to_datetime(datetime_str, errors='coerce')
            except:
                return pd.NaT
        
        
        # Trier les opérations par date et heure de début
        sorted_ops = sorted(mes, key=lambda x: get_datetime(x))
        
        # Grouper les opérations par nom de tâche
        task_groups = {}
        task_order = []  # Pour garder l'ordre d'apparition
        for op in sorted_ops:
            task_name = op.get('Nom', 'Unknown')
            if task_name not in task_groups:
                task_groups[task_name] = []
                task_order.append(task_name)
            task_groups[task_name].append(op)
        
        # Configuration de l'affichage
        x_start = 8*900 - 250 # Commencer à 8 heures (en minutes) + padding
        y_spacing = 100
        
        # Créer un en-tête
        nodes.append({
            'id': 'header',
            'type': 'input',
            'data': {
                'label': '📊 Timeline du Projet',
                'stats': f'{len(sorted_ops)} opérations | {len(task_groups)} types de tâches'
            },
            'position': {'x': x_start, 'y': 0},
            'style': {
                'background': '#228be6',
                'color': 'white',
                'padding': '15px',
                'fontSize': '14px',
                'fontWeight': 'bold'
            }
        })
        
        # Créer les nœuds pour chaque groupe de tâches
        y_position = 100
        
        for task_name in task_order:
            operations = task_groups[task_name]
            
            # Label de la ligne (nom de la tâche)
            lane_label_id = f'lane-{task_name.replace(" ", "-")}'
            nodes.append({
                'id': lane_label_id,
                'data': {
                    'label': task_name,
                    'count': f'{len(operations)} fois'
                },
                'position': {'x': x_start, 'y': y_position },
                'style': {
                    'background': '#e9ecef',
                    'border': '2px solid #495057',
                    'borderRadius': '8px',
                    'padding': '12px',
                    'fontSize': '13px',
                    'fontWeight': '600',
                    'minWidth': '200px',
                    'maxWidth': '200px',
                    'textAlign': 'left'
                }
            })
            
            # Ajouter chaque occurrence de cette tâche
            prev_node_id = None
            for idx, op in enumerate(operations):
                poste = op.get('Poste', '')
                temps_prevu = str(op.get('Temps Prévu', ''))
                temps_reel = str(op.get('Temps Réel', ''))
                has_delay = op.get('Aléas Industriels')
                nb_pieces = op.get('Nombre pièces', 0)
                start_time = str(op.get('Heure Début', ''))

                node_id = f'task-{task_name.replace(" ", "-")}-{idx}'
                
                # Calculer la largeur du nœud basée sur la durée
                duration_minutes = self._time_to_minutes(temps_reel)
                node_width = max(100, int(duration_minutes))  # Min 100px, 3px par minute
                
                # Créer le nœud
                nodes.append({
                    'id': node_id,
                    'type': 'custom',  # Type personnalisé pour appliquer les styles
                    'data': {
                        'label': f'#{idx + 1}',
                        'poste': f'Poste {poste}',
                        'pieces': f'📦 {nb_pieces}',
                        'duration': f'⏱️ {temps_reel}',
                        'time': f"{str(op.get('Heure Début', ''))} - {str(op.get('Heure Fin', ''))}",
                        'date': str(op.get('Date', '')).split()[0] if op.get('Date') else '',
                        'delay': f'⚠️ {has_delay}' if has_delay else '✓',
                        'hasDelay': bool(has_delay),  # Pour le style conditionnel
                        'width': node_width  # Largeur dynamique
                    },
                    'position': {
                        'x': self._time_to_minutes(start_time),
                        'y': y_position
                    },
                    'style': {
                        'width': f'{node_width}px',
                        'height': 'auto'
                    }
                })
                
                # Connecter avec le nœud précédent dans cette ligne
                if prev_node_id:
                    edges.append({
                        'id': f'edge-{prev_node_id}-{node_id}',
                        'source': prev_node_id,
                        'target': node_id,
                        'animated': bool(has_delay),
                        'style': {
                            'stroke': '#ff6b6b' if has_delay else '#4dabf7',
                            'strokeWidth': 2
                        }
                    })
                
                prev_node_id = node_id
            
            # Passer à la ligne suivante
            y_position += y_spacing
        
        return {'nodes': nodes, 'edges': edges}
