import os
from pathlib import Path
import pandas as pd
import google.generativeai as genai
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

class AIAnalysisService:
    def __init__(self):
        self.data_dir = Path(__file__).parent.parent.parent / 'data'
        
        # Configurer Gemini API
        api_key = os.getenv('GEMINI_API_KEY')
        
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in .env file")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('models/gemini-2.5-flash')
    
    def get_causes_analysis(self):
        """Analyse les causes potentielles avec Gemini"""
        try:
            # Charger les données MES
            df_mes_path = self.data_dir / 'MES_Extraction.xlsx'
            df_mes = pd.read_excel(df_mes_path, sheet_name='MES')
            
            # Extraire toutes les causes potentielles non vides
            causes = df_mes['Cause Potentielle'].dropna().tolist()
            
            if not causes:
                return {
                    'summary': 'Aucune cause potentielle trouvée dans les données.',
                    'total_causes': 0,
                    'main_categories': [],
                    'recommendations': []
                }
            
            # Limiter à 20 causes pour tests et regrouper les similaires
            causes_sample = causes[:20]
            causes_text = "\n".join([f"- {cause}" for cause in causes_sample])
            
            prompt = f"""Analyse ces {len(causes_sample)} causes de retards de production (échantillon de {len(causes)} causes totales) et fournis un résumé structuré en français :

Causes identifiées :
{causes_text}

Fournis en JSON :
1. Un résumé général en 2 phrases
2. Les 3-4 catégories principales
3. Les 2-3 recommandations prioritaires

Format JSON strict :
{{
  "summary": "résumé court",
  "main_categories": [
    {{"category": "nom", "percentage": 30, "description": "1 phrase"}},
    ...
  ],
  "recommendations": [
    {{"priority": "Haute", "action": "action concrète"}},
    ...
  ]
}}"""
            
            # Appeler Gemini API
            response = self.model.generate_content(prompt)
            
            # Parser la réponse JSON
            import json
            response_text = response.text.strip()
            
            # Nettoyer la réponse si elle contient des markdown code blocks
            if response_text.startswith('```'):
                response_text = response_text.split('```')[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            analysis = json.loads(response_text)
            analysis['total_causes'] = len(causes)
            
            return analysis
            
        except Exception as e:
            print(f"Error in AI analysis: {str(e)}")
            return {
                'error': str(e),
                'summary': 'Erreur lors de l\'analyse IA.',
                'total_causes': 0,
                'main_categories': [],
                'recommendations': []
            }
