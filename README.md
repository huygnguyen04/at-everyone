# @everyone

**@everyone** is a Discord analytics tool that parses raw JSON data from your Discord messages and generates custom and engaging metrics personalized to you. These metrics are then used to build a high-dimensional embedding for each user, which is projected into a 3D semantic space. This interactive visualization lets you see your closest connections based on conversational similarity. Additionally, you’ll get personalized commentary that explains your unique metrics, giving you a deeper understanding of your Discord activity.

## Setup

1. **Backend Setup**  
   - Navigate to the `backend` directory:  
     ```bash
     cd backend
     ```  
   - Install required Python packages:  
     ```bash
     pip install -r requirements.txt
     ```  
   - Create a `.env` file in the `backend` directory and set your OpenAI key:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     ```

2. **Frontend Setup**  
   - Navigate to the `frontend` directory:  
     ```bash
     cd frontend
     ```  
   - Install the required dependencies (using npm):  
     ```bash
     npm install
     ```  
   - Follow any additional installation instructions that may appear.

## How to Run

1. **Run the Backend**  
   - In the `backend` directory:  
     ```bash
     python app.py
     ```  

2. **Run the Frontend**  
   - In the `frontend` directory:  
     ```bash
     npm run dev
     ```  
   - Copy the URL generated or go to [http://localhost:3000](http://localhost:3000) in your browser.

3. **Start the Analytics**  
   - Enter a `.json` file in the interface to start the analytics process.

## License
This project is licensed under the MIT License - see the LICENSE.md file for details.
