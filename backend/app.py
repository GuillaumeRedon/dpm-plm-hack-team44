from flask import Flask, jsonify
from flask_cors import CORS
from routes.process_routes import process_bp
import traceback

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(process_bp, url_prefix='/api')

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})

@app.errorhandler(Exception)
def handle_error(e):
    print(f"Error occurred: {str(e)}")
    traceback.print_exc()
    return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=3001)
