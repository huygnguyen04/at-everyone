# @everyone

**@everyone** is a Discord analytics tool that parses your Discord messages and generates custom and engaging metrics personalized to you. These metrics are then used to build a high-dimensional embedding for each user, which is projected into a 3D semantic space. This interactive visualization lets you see your closest connections based on conversational similarity. Additionally, you’ll get personalized commentary that explains your unique metrics, giving you a deeper understanding of your Discord activity.

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
     npm install --force
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

## API Endpoints

### `/processUsername`

- **Method**: POST
- **Description**: Processes the provided username and sets it as the current user.
- **Request Payload**:
    ```json
    {
      "username": "<username>"
    }
    ```
- **Response**:
    ```json
    {
      "message": "Username processed",
      "username": "<username>"
    }
    ```

### `/upload`

- **Method**: POST
- **Description**: Uploads a JSON file containing conversation data, processes the file to update both local and global conversation histories, and computes 3D embeddings.
- **Request Payload**:  
    - A form-data file upload (JSON file)
- **Response**:
    ```json
    {
      "message": "File received and processed."
    }
    ```

### `/getconversationhistory`

- **Method**: GET
- **Description**: Retrieves the conversation history for the current user from the global conversation history.
- **Response**:
    ```json
    {
      "username": "<username>",
      "favorite_topic": "<favorite_topic>",
      "keywords": [ ... ],
      "stats": { ... },
      "embedding": [ ... ],
      "three_d_embedding": [ ... ] | null,
      "last_conversation": "<conversation_id>"
    }
    ```

### `/api/getmainuser`

- **Method**: GET
- **Description**: Returns the current main username.
- **Response**:
    ```json
    {
      "username": "<username>"
    }
    ```

### `/api/local_graph`

- **Method**: GET
- **Description**: Retrieves a local graph representing conversation history, including favorite topics, keywords, stats, and 3D embeddings for each user.
- **Response**:
    ```json
    {
      "<username>": {
        "favorite_topic": "<favorite_topic>",
        "keywords": [ ... ],
        "stats": { ... },
        "three_d_embedding": [ ... ]
      },
      ...
    }
    ```

### `/api/global_graph`

- **Method**: GET
- **Description**: Retrieves a global graph of conversation histories with color mapping for each user based on their last conversation.
- **Response**:
    ```json
    {
      "<username>": {
        "favorite_topic": "<favorite_topic>",
        "keywords": [ ... ],
        "stats": { ... },
        "three_d_embedding": [ ... ],
        "color": "<color>"
      },
      ...
    }
    ```

### `/generateCommentary`

- **Method**: POST
- **Description**: Generates commentary based on a provided metric value, its name, and an additional description.
- **Request Payload**:
    ```json
    {
      "metric": "<metric_value>",
      "name": "<metric_name>",
      "description": "<additional description>"
    }
    ```
- **Response**:
    ```json
    {
      "commentary": "<generated commentary>",
      "description": "<metric description>"
    }
    ```
## Project Structure
```plaintext
├── LICENSE.md
├── README.md
├── backend
│   ├── app.py
│   ├── chat_history.json
│   ├── conversationhistory.db
│   ├── generateCommentary.py
│   ├── generateEmbedding.py
│   ├── jsonParsing.py
│   ├── pca.py
│   ├── requirements.txt
│   ├── topicModeling.py
└── frontend
    ├── README.md
    ├── next.config.ts
    ├── package.json
    ├── public
    │   ├── discord-loading.gif
    │   ├── file.svg
    │   ├── globe.svg
    │   ├── next.svg
    │   ├── vercel.svg
    │   └── window.svg
    ├── src
    │   ├── app
    │   │   ├── global-graph
    │   │   │   └── page.tsx
    │   │   ├── globals.css
    │   │   ├── layout.tsx
    │   │   ├── local-graph
    │   │   │   └── page.tsx
    │   │   ├── metrics
    │   │   │   └── page.tsx
    │   │   └── page.tsx
    │   ├── components
    │   │   ├── GhostButton.tsx
    │   │   ├── loadingscreen.tsx
    │   │   └── ui
    │   │       ├── button.tsx
    │   │       ├── card.tsx
    │   │       ├── command.tsx
    │   │       ├── dialog.tsx
    │   │       ├── label.tsx
    │   │       ├── popover.tsx
    │   │       ├── select.tsx
    │   │       ├── sheet.tsx
    │   │       ├── tabs.tsx
    │   │       └── toggle.tsx
    │   └── lib
    │       └── utils.ts
    ├── tailwind.config.ts
    └── tsconfig.json
```

## Documentation
Further technical documentation can be found [here](https://docs.google.com/presentation/d/1Qg3NIIRwOzJD4uYUOTcN3bIabBKEsWeNhSO5_0ZB9-0/edit?usp=sharing).

## License
This project is licensed under the MIT License - see the LICENSE.md file for details.
