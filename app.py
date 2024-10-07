import os
import subprocess
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

app = Flask(__name__)
CORS(app)  # Allow CORS for all domains on all routes

logging.basicConfig(level=logging.INFO)

ALLOWED_PATTERNS = set(os.getenv('ALLOWED_PATTERNS', '').split(','))
FABRIC_PATH = os.getenv('FABRIC_PATH', 'fabric')

def get_patterns():
    patterns_dir = os.getenv('PATTERNS_DIR', 'patterns')
    patterns = []
    for item in os.listdir(patterns_dir):
        if os.path.isdir(os.path.join(patterns_dir, item)) and item in ALLOWED_PATTERNS:
            patterns.append(item)
    return patterns

@app.route('/patterns', methods=['GET'])
def list_patterns():
    patterns = get_patterns()
    return jsonify(patterns)

@app.route('/run-pattern', methods=['POST'])
def run_pattern():
    data = request.json
    pattern = data.get('pattern')
    params = data.get('params', [])

    if pattern not in ALLOWED_PATTERNS:
        return jsonify({'error': 'Pattern not allowed'}), 403

    fabric_command = [FABRIC_PATH]
    
    if pattern:
        fabric_command.extend(['--pattern', pattern])

    youtube_url = next((param for param in params if param.startswith('-y')), None)
    if youtube_url:
        youtube_index = params.index(youtube_url)
        fabric_command.extend(['-y', params[youtube_index + 1]])
        params = params[:youtube_index] + params[youtube_index + 2:]

    # Sanitize and validate params here
    sanitized_params = [param for param in params if param.isalnum() or param in ['-', '_']]
    fabric_command.extend(sanitized_params)

    logging.info(f"Executing command: {' '.join(fabric_command)}")

    try:
        result = subprocess.run(fabric_command, capture_output=True, text=True, timeout=300)  # 5 minutes timeout
        if result.returncode != 0:
            logging.error(f"Command failed with error: {result.stderr}")
            return jsonify({'error': result.stderr}), 500
        return jsonify({'output': result.stdout})
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Command execution timed out'}), 504
    except Exception as e:
        logging.exception("An error occurred while running the fabric command")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
