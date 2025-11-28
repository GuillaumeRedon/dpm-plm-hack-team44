import pandas as pd
import numpy as np
from pathlib import Path
import base64
from io import BytesIO
import matplotlib
matplotlib.use('Agg')  # Backend non-GUI
import matplotlib.pyplot as plt
import seaborn as sns

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
                df[col] = df[col].apply(lambda x: str(x) if pd.notna(x) and not isinstance(x, (int, float, str, bool)) else x)
        return df.to_dict('records')
    
    def _time_to_minutes(self, time_str):
        """Convertit une chaîne de temps (HH:MM:SS) en minutes pour le positionnement sur la timeline"""
        if not time_str or pd.isna(time_str):
            return 0
        try:
            parts = str(time_str).split(':')
            if len(parts) == 3:
                hours, minutes, seconds = map(int, parts)
                return round((hours * 60 + minutes + seconds / 60) * 15)
        except:
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
                planned = self._time_to_minutes(r.get('Temps Prévu')) / 15  # Convertir en minutes réelles
                actual = self._time_to_minutes(r.get('Temps Réel')) / 15
                delay = actual - planned
                time_delays.append({
                    **r,
                    'planned': planned,
                    'actual': actual,
                    'delay': delay
                })
            
            total_delay = sum(max(0, r['delay']) for r in time_delays)
            avg_delay = total_delay / len(mes) if mes else 0
            
            # Calculer les coûts par activité (colonne Nom)
            cost_by_activity = {}
            for r in time_delays:
                activity = r.get('Nom', 'Unknown')
                # Estimer le coût: temps réel * coût horaire moyen (estimation à 35€/h)
                cost = r['actual'] / 60 * 35  # Convertir minutes en heures et multiplier par tarif
                if activity in cost_by_activity:
                    cost_by_activity[activity] += cost
                else:
                    cost_by_activity[activity] = cost
            
            # Garder les top 10 activités les plus coûteuses
            top_activities = sorted(cost_by_activity.items(), key=lambda x: x[1], reverse=True)[:10]
            
            analysis['statistics']['MES'] = {
                'totalOperations': len(mes),
                'totalDelayMinutes': round(total_delay, 1),
                'avgDelayMinutes': round(avg_delay, 1),
                'issuesByType': {},
                'costByActivity': {name: round(cost, 2) for name, cost in top_activities}
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
    
    def get_flow_data(self, date_filter=None):
        """Génère une timeline des tâches du projet basée sur l'enchaînement temporel"""
        all_data = self.get_all_processes()
        nodes = []
        edges = []
        
        if 'MES' not in all_data:
            return {'nodes': nodes, 'edges': edges, 'availableDates': []}
        
        mes = all_data['MES']
        
        # Extraire toutes les dates disponibles
        available_dates = set()
        for op in mes:
            date_str = str(op.get('Date', ''))
            if ' ' in date_str:
                date_str = date_str.split()[0]
            if date_str and date_str != 'nan':
                available_dates.add(date_str)
        
        available_dates = sorted(list(available_dates))
        
        # Filtrer par date si spécifié
        if date_filter:
            mes = [op for op in mes if str(op.get('Date', '')).startswith(date_filter)]
        
        if not mes:
            return {'nodes': nodes, 'edges': edges, 'availableDates': available_dates}
        
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
        x_start = 8 * 900 - 250  # Position de départ
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
        
        # Garder trace de tous les nœuds avec leur timestamp pour les connexions temporelles
        all_task_nodes = []
        
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
                
                # Calculer la largeur du nœud basée sur la durée réelle
                duration_minutes = self._time_to_minutes(temps_reel)
                node_width = max(50, int(duration_minutes))
                
                # Calculer le pourcentage du temps prévu par rapport au temps réel
                planned_minutes = self._time_to_minutes(temps_prevu)
                if duration_minutes > 0:
                    planned_percentage = (planned_minutes / duration_minutes) * 100
                else:
                    planned_percentage = 100
                
                # Créer le nœud
                nodes.append({
                    'id': node_id,
                    'type': 'custom',  # Type personnalisé pour appliquer les styles
                    'data': {
                        'label': f'{task_name} #{idx + 1}',
                        'poste': f'Poste {poste}',
                        'pieces': f'Pièces: {nb_pieces}',
                        'duration': f'⏱️ {temps_reel}',
                        'time': f"{str(op.get('Heure Début', ''))} - {str(op.get('Heure Fin', ''))}",
                        'date': str(op.get('Date', '')).split()[0] if op.get('Date') else '',
                        'delay': f'⚠️ {has_delay}' if has_delay else '✓',
                        'hasDelay': bool(has_delay),  # Pour le style conditionnel
                        'width': node_width,  # Largeur dynamique
                        'plannedPercentage': min(100, planned_percentage)  # Pourcentage du temps prévu vs réel
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
                
                # Sauvegarder les infos pour les connexions temporelles
                all_task_nodes.append({
                    'id': node_id,
                    'datetime': get_datetime(op),
                    'has_delay': bool(has_delay)
                })
                
                prev_node_id = node_id
            
            # Passer à la ligne suivante
            y_position += y_spacing
        
        # Créer les connexions temporelles entre tous les nœuds
        sorted_task_nodes = sorted(all_task_nodes, key=lambda x: x['datetime'])
        for i in range(len(sorted_task_nodes) - 1):
            current_node = sorted_task_nodes[i]
            next_node = sorted_task_nodes[i + 1]
            
            # Créer une connexion temporelle
            edges.append({
                'id': f'edge-time-{i}',
                'source': current_node['id'],
                'target': next_node['id'],
                'animated': current_node['has_delay'] or next_node['has_delay'],
                'style': {
                    'stroke': '#4dabf7',
                    'strokeWidth': 2
                }
            })
        
        return {'nodes': nodes, 'edges': edges, 'availableDates': available_dates}
    
    def _time_to_hours(self, time_str):
        """Convertit HH:MM:SS en heures décimales"""
        if pd.isna(time_str) or str(time_str).lower() == 'nan':
            return 0.0
        try:
            parts = str(time_str).strip().split(':')
            if len(parts) == 3:
                h, m, s = map(int, parts)
                return h + m/60 + s/3600
            return 0.0
        except:
            return 0.0
    
    def _plot_to_base64(self, fig):
        """Convertit une figure matplotlib en string base64"""
        buffer = BytesIO()
        fig.savefig(buffer, format='png', bbox_inches='tight', dpi=100)
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        plt.close(fig)
        return image_base64
    
    def get_advanced_charts(self):
        """Génère les données pour les 3 graphiques avancés (format JSON pour Plotly)"""
        charts = {}
        
        # Charger les données
        df_mes_path = self.data_dir / 'MES_Extraction.xlsx'
        df_plm_path = self.data_dir / 'PLM_DataSet.xlsx'
        df_erp_path = self.data_dir / 'ERP_Equipes Airplus.xlsx'
        
        df_mes = pd.read_excel(df_mes_path, sheet_name='MES')
        df_plm = pd.read_excel(df_plm_path)
        df_erp = pd.read_excel(df_erp_path, sheet_name='RESSOURCES')
        
        # Nettoyage MES
        df_mes['Poste'] = pd.to_numeric(df_mes['Poste'], errors='coerce').fillna(0).astype(int)
        df_mes['Temps_Prévu_H'] = df_mes['Temps Prévu'].apply(self._time_to_hours)
        df_mes['Temps_Réel_H'] = df_mes['Temps Réel'].apply(self._time_to_hours)
        df_mes['Retard_H'] = df_mes['Temps_Réel_H'] - df_mes['Temps_Prévu_H']
        
        # Nettoyage ERP
        df_erp = df_erp.dropna(subset=['Poste de montage'])
        df_erp['Poste_Num'] = df_erp['Poste de montage'].astype(str).str.extract(r'(\d+)').astype(float)
        
        # ==========================================
        # GRAPHIQUE 1 : VARIABILITÉ & GOULOTS (BOXPLOT)
        # ==========================================
        top_postes = df_mes.groupby('Poste')['Retard_H'].mean().sort_values(ascending=False).head(10).index.tolist()
        df_filtered = df_mes[df_mes['Poste'].isin(top_postes)]
        
        # Préparer les données pour boxplot Plotly
        boxplot_data = []
        for poste in sorted(top_postes):
            poste_data = df_filtered[df_filtered['Poste'] == poste]['Retard_H'].tolist()
            boxplot_data.append({
                'poste': str(poste),
                'values': poste_data
            })
        
        charts['bottleneck_variability'] = {
            'type': 'boxplot',
            'data': boxplot_data
        }
        
        # ==========================================
        # GRAPHIQUE 2 : CORRÉLATION CONCEPTION (PLM)
        # ==========================================
        df_mes_exploded = df_mes.copy()
        df_mes_exploded['Ref_List'] = df_mes_exploded['Référence'].astype(str).str.split(';')
        df_mes_exploded = df_mes_exploded.explode('Ref_List')
        df_mes_exploded['Ref_List'] = df_mes_exploded['Ref_List'].str.strip()
        
        df_plm_merged = df_mes_exploded.merge(df_plm, left_on='Ref_List', right_on='Code / Référence', how='inner')
        
        if len(df_plm_merged) > 0:
            # Limiter à 150 points pour performance
            sample_size = min(150, len(df_plm_merged))
            df_sample = df_plm_merged.sample(n=sample_size, random_state=42)
            
            scatter_data = []
            for _, row in df_sample.iterrows():
                scatter_data.append({
                    'caoTime': float(row['Temps CAO (h)']),
                    'assemblyTime': float(row['Temps_Réel_H']),
                    'criticality': str(row['Criticité']),
                    'mass': float(row['Masse (kg)']),
                    'reference': str(row['Code / Référence'])
                })
            
            charts['plm_correlation'] = {
                'type': 'scatter',
                'data': scatter_data
            }
        
        # ==========================================
        # GRAPHIQUE 3 : PERFORMANCE RH (ERP)
        # ==========================================
        df_rh_merged = df_mes.merge(df_erp, left_on='Poste', right_on='Poste_Num', how='inner')
        df_rh_merged['Retard_H'] = df_rh_merged['Retard_H'].fillna(0)
        
        if len(df_rh_merged) > 0:
            rh_performance = df_rh_merged.groupby('Niveau d\'expérience')['Retard_H'].sum().to_dict()
            
            bar_data = []
            for level, total_delay in rh_performance.items():
                bar_data.append({
                    'level': str(level),
                    'totalDelay': float(total_delay)
                })
            
            charts['rh_performance'] = {
                'type': 'bar',
                'data': bar_data
            }
        
        # ==========================================
        # GRAPHIQUE 4 : RETARD TOTAL CUMULÉ PAR POSTE
        # ==========================================
        delay_by_poste = df_mes.groupby('Poste').agg(
            Total_Delay_H=('Retard_H', 'sum')
        ).reset_index()
        delay_by_poste_top = delay_by_poste.sort_values(by='Total_Delay_H', ascending=False).head(10)
        
        charts['delay_by_poste'] = {
            'type': 'bar',
            'data': [
                {
                    'poste': int(row['Poste']),
                    'totalDelay': float(row['Total_Delay_H'])
                }
                for _, row in delay_by_poste_top.iterrows()
            ]
        }
        
        # ==========================================
        # GRAPHIQUE 5 : TEMPS VS EMPLOYÉS PAR ACTIVITÉ
        # ==========================================
        employees_per_poste = df_erp.groupby('Poste_Num').size().reset_index(name='Employee_Count')
        unique_postes_per_nom = df_mes.groupby('Nom')['Poste'].unique()
        nom_stats = []
        
        for nom, postes in unique_postes_per_nom.items():
            total_time = df_mes[df_mes['Nom'] == nom]['Temps_Réel_H'].sum()
            relevant_employees = employees_per_poste[employees_per_poste['Poste_Num'].isin(postes)]
            total_employees = relevant_employees['Employee_Count'].sum()
            nom_stats.append({
                'nom': str(nom),
                'totalTime': float(total_time),
                'totalEmployees': int(total_employees)
            })
        
        # Trier et limiter à 12
        nom_stats = sorted(nom_stats, key=lambda x: x['totalTime'], reverse=True)[:12]
        
        charts['time_vs_employees'] = {
            'type': 'bar',
            'data': nom_stats
        }
        
        # ==========================================
        # GRAPHIQUE 6 : IMPACT FOURNISSEURS (RETARDS)
        # ==========================================
        df_mes_exploded2 = df_mes.copy()
        df_mes_exploded2['Référence_List'] = df_mes_exploded2['Référence'].astype(str).str.split(';')
        df_mes_exploded2 = df_mes_exploded2.explode('Référence_List')
        df_mes_exploded2['Référence_List'] = df_mes_exploded2['Référence_List'].str.strip().str.strip('"')
        
        df_merged_supplier = df_mes_exploded2.merge(
            df_plm[['Code / Référence', 'Fournisseur']],
            left_on='Référence_List',
            right_on='Code / Référence',
            how='inner'
        )
        
        supplier_delay = df_merged_supplier[df_merged_supplier['Retard_H'] > 0].groupby('Fournisseur')['Retard_H'].sum().reset_index()
        supplier_delay = supplier_delay.sort_values(by='Retard_H', ascending=True).tail(12)
        
        charts['supplier_impact'] = {
            'type': 'bar_horizontal',
            'data': [
                {
                    'supplier': str(row['Fournisseur']),
                    'delay': float(row['Retard_H'])
                }
                for _, row in supplier_delay.iterrows()
            ]
        }
        
        # ==========================================
        # GRAPHIQUE 7 : IMPACT FINANCIER PAR FOURNISSEUR
        # ==========================================
        cost_per_poste = df_erp.groupby('Poste_Num')['Coût horaire (€)'].mean().reset_index()
        
        df_final_cost = df_merged_supplier.merge(
            cost_per_poste,
            left_on='Poste',
            right_on='Poste_Num',
            how='left'
        )
        
        df_final_cost['Cout_Retard_Euro'] = df_final_cost['Retard_H'] * df_final_cost['Coût horaire (€)']
        supplier_cost_impact = df_final_cost.groupby('Fournisseur')['Cout_Retard_Euro'].sum().reset_index()
        supplier_cost_impact = supplier_cost_impact.sort_values(by='Cout_Retard_Euro', ascending=True).tail(12)
        
        charts['supplier_financial_impact'] = {
            'type': 'bar_horizontal',
            'data': [
                {
                    'supplier': str(row['Fournisseur']),
                    'cost': float(row['Cout_Retard_Euro'])
                }
                for _, row in supplier_cost_impact.iterrows()
            ]
        }
        
        # ==========================================
        # GRAPHIQUE 8 : MATRICE 4D (BUBBLE CHART)
        # ==========================================
        df_bubble = df_final_cost[df_final_cost['Retard_H'] > 0.08].copy()
        df_plm_renamed = df_plm.rename(columns={'Code / Référence': 'Référence_List'})
        df_bubble = df_bubble.merge(
            df_plm_renamed[['Référence_List', 'Criticité']],
            on='Référence_List',
            how='left'
        )
        df_bubble['Criticité'] = df_bubble['Criticité'].fillna('Non Classé')
        df_bubble['Cout_Retard'] = df_bubble['Retard_H'] * df_bubble['Coût horaire (€)']
        
        # Limiter à 100 points pour performance
        if len(df_bubble) > 100:
            df_bubble = df_bubble.sample(n=100, random_state=42)
        
        bubble_data = []
        for _, row in df_bubble.iterrows():
            bubble_data.append({
                'poste': int(row['Poste']),
                'delay': float(row['Retard_H']),
                'cost': float(row['Cout_Retard']),
                'criticality': str(row['Criticité']),
                'name': str(row['Nom']),
                'supplier': str(row['Fournisseur'])
            })
        
        charts['risk_matrix'] = {
            'type': 'bubble',
            'data': bubble_data
        }
        
        return charts
    
    def get_employees_data(self):
        """Génère les statistiques par poste de travail à partir des données MES (pas d'info employé individuel)"""
        all_data = self.get_all_processes()
        
        if 'MES' not in all_data or 'ERP' not in all_data:
            return {'employees': [], 'totalEmployees': 0, 'avgTasksPerEmployee': 0, 'totalTasks': 0}
        
        mes = all_data['MES']
        erp = all_data['ERP']
        
        # Créer un dictionnaire des employés depuis ERP
        erp_employees = {}
        for emp in erp:
            emp_id = emp.get('ID') or emp.get('Employé') or emp.get('Matricule')
            if emp_id:
                erp_employees[emp_id] = {
                    'id': emp_id,
                    'name': f"{emp.get('Prénom', '')} {emp.get('Nom', '')}".strip() or f"Employé {emp_id}",
                    'experience': emp.get("Niveau d'expérience", 'Inconnu'),
                    'qualification': emp.get('Qualification', ''),
                    'cost': emp.get('Coût horaire (€)', 0)
                }
        
        # Analyser les tâches MES et les regrouper par poste
        poste_stats = {}
        task_list = []
        
        for task in mes:
            poste = str(task.get('Poste', 'Inconnu'))
            piece = str(task.get('Référence', task.get('Nom', '')))
            temps = task.get('Temps Réel', '0:0:0')
            delay = task.get('Aléas Industriels')
            date = str(task.get('Date', ''))
            heure_debut = str(task.get('Heure Début', ''))
            nom_tache = str(task.get('Nom', ''))
            
            if poste not in poste_stats:
                poste_stats[poste] = {
                    'tasks': [],
                    'totalTime': 0,
                    'delays': 0,
                    'tasksCount': 0,
                    'pieces': set()
                }
            
            stat = poste_stats[poste]
            stat['tasksCount'] += 1
            stat['pieces'].add(piece)
            if delay:
                stat['delays'] += 1
            
            # Convertir temps en minutes
            if temps:
                parts = str(temps).split(':')
                if len(parts) == 3:
                    try:
                        hours = int(parts[0])
                        minutes = int(parts[1])
                        seconds = int(parts[2])
                        total_minutes = hours * 60 + minutes + seconds / 60
                        stat['totalTime'] += total_minutes
                    except:
                        pass
            
            stat['tasks'].append({
                'nom': nom_tache,
                'piece': piece,
                'temps': str(temps),
                'delay': str(delay) if delay else None,
                'date': date,
                'heure': heure_debut
            })
        
        # Créer une liste d'employés fictifs basée sur les postes et ERP
        employees = []
        emp_counter = 1
        
        # Utiliser les vrais employés d'ERP
        for emp_id, emp_data in erp_employees.items():
            # Attribuer une portion des tâches à chaque employé (distribution simulée)
            # Prendre un poste aléatoire ou le premier disponible
            if poste_stats:
                sample_poste = list(poste_stats.keys())[emp_counter % len(poste_stats)]
                stats = poste_stats[sample_poste]
                
                # Diviser les tâches du poste entre les employés
                tasks_portion = max(1, stats['tasksCount'] // len(erp_employees))
                time_portion = stats['totalTime'] / len(erp_employees)
                delays_portion = max(0, stats['delays'] // len(erp_employees))
                
                employees.append({
                    'id': emp_data['id'],
                    'name': emp_data['name'],
                    'experience': emp_data['experience'],
                    'postes': [sample_poste],
                    'pieces': list(list(stats['pieces'])[:3]),  # Limiter à 3 pièces
                    'tasks': stats['tasks'][:5],  # Limiter à 5 dernières tâches
                    'totalTime': round(time_portion, 2),
                    'delays': delays_portion,
                    'tasksCount': tasks_portion,
                    'avgTimePerTask': round(time_portion / tasks_portion, 2) if tasks_portion > 0 else 0,
                    'delayRate': round((delays_portion / tasks_portion) * 100, 2) if tasks_portion > 0 else 0
                })
                emp_counter += 1
        
        total_tasks = sum(e['tasksCount'] for e in employees)
        
        return {
            'employees': employees,
            'totalEmployees': len(employees),
            'avgTasksPerEmployee': round(total_tasks / len(employees), 1) if employees else 0,
            'totalTasks': total_tasks
        }
