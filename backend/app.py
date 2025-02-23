from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Home route
@app.route('/')
def index():
    return "Hello, World!"

# API endpoint example
@app.route('/api/data', methods=['GET'])
def get_data():
    # Replace this with your actual data retrieval logic
    data = {"message": "This is a sample API endpoint."}
    return jsonify(data)

# Form handling route
@app.route('/form', methods=['GET', 'POST'])
def handle_form():
    if request.method == 'POST':
        # Process the form data here
        user_input = request.form.get('user_input', '')
        # Add your processing logic here
        return f"Received input: {user_input}"
    # Render a template for GET requests; make sure you have a 'form.html' in your templates folder
    return render_template('form.html')

if __name__ == '__main__':
    app.run(debug=True)