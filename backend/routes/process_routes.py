from flask import Blueprint, jsonify
from services.process_service import ProcessService

process_bp = Blueprint('process', __name__)
service = ProcessService()

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
        flow_data = service.get_flow_data()
        return jsonify(flow_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
