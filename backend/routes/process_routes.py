from flask import Blueprint, jsonify
from services.process_service import ProcessService
from services.ai_analysis_service import AIAnalysisService

process_bp = Blueprint('process', __name__)
service = ProcessService()
ai_service = AIAnalysisService()

@process_bp.route('/processes', methods=['GET'])
def get_all_processes():
    """Get all processes from all systems"""
    try:
        data = service.get_all_processes()
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@process_bp.route('/analysis', methods=['GET'])
def get_analysis():
    """Get analysis results (bottlenecks, inefficiencies, improvements)"""
    try:
        analysis = service.get_analysis()
        return jsonify(analysis)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@process_bp.route('/flow', methods=['GET'])
def get_flow():
    """Get process flow data for visualization"""
    try:
        from flask import request
        date_filter = request.args.get('date')
        flow_data = service.get_flow_data(date_filter=date_filter)
        return jsonify(flow_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@process_bp.route('/charts', methods=['GET'])
def get_charts():
    """Get advanced analysis charts (base64 encoded images)"""
    try:
        charts = service.get_advanced_charts()
        return jsonify(charts)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@process_bp.route('/ai-analysis', methods=['GET'])
def get_ai_analysis():
    """Get AI-powered analysis of potential causes"""
    try:
        analysis = ai_service.get_causes_analysis()
        return jsonify(analysis)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@process_bp.route('/employees', methods=['GET'])
def get_employees():
    """Get employee statistics and data"""
    try:
        employees_data = service.get_employees_data()
        return jsonify(employees_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
