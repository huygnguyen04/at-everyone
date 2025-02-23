from flask import Flask, request, jsonify
import json
from flask_cors import CORS
from jsonParsing import parse_messages, get_unique_usernames
from generateEmbedding import getEmbedding
from topicModeling import find_favorite_topic
from pca import pca_to_3
import numpy as np
from sklearn.preprocessing import StandardScaler
from peewee import Model, TextField, SqliteDatabase
from flask_cors import CORS
import orm
import ast


def safe_eval_dict(data):
    if isinstance(data, dict):
        return {key: safe_eval_dict(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [safe_eval_dict(item) for item in data]
    elif isinstance(data, str):
        try:
            return ast.literal_eval(data)
        except (ValueError, SyntaxError):
            return data
    else:
        return data


app = Flask(__name__)
CORS(app)

# Connect to the database
db = SqliteDatabase("conversationhistory.db")


# Base model for Peewee models
class BaseModel(Model):
    class Meta:
        database = db


# Local conversation history: cleared on every file upload
class ConversationHistory(BaseModel):
    username = TextField(primary_key=True)
    favorite_topic = TextField()  # e.g., the topic label
    keywords = TextField()  # stored as a JSON string
    stats = TextField()  # stored as a JSON string of all stats
    embedding = TextField()  # stored as a JSON string of the embedding
    three_d_embedding = TextField(null=True, default="")  # new column for 3D embedding

    class Meta:
        table_name = "conversationhistory"


# Global conversation history: accumulates or updates records over time
class GlobalConversationHistory(BaseModel):
    username = TextField(primary_key=True)
    favorite_topic = TextField()
    keywords = TextField()
    stats = TextField()
    embedding = TextField()
    three_d_embedding = TextField(null=True, default="")

    class Meta:
        table_name = "globalconversationhistory"


# Ensure tables exist
db.connect()
db.create_tables([ConversationHistory, GlobalConversationHistory], safe=True)
db.close()

username = ""


@app.route("/processUsername", methods=["POST"])
def process_username():
    global username
    data = request.get_json()
    username = data.get("username")

    return jsonify({"message": "Username processed", "username": username}), 200


@app.route("/upload", methods=["POST"])
def upload_file():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file provided"}), 400

    try:
        data = json.load(file)
        print("Received JSON")
    except Exception as e:
        print("Error processing file:", e)
        return jsonify({"error": "Invalid JSON file"}), 400

    # Open a new connection
    db.connect()

    # Clear the conversationhistory table on each new upload
    ConversationHistory.delete().execute()

    usernames = get_unique_usernames(data)[0:3]

    for username in usernames:
        # Compute values for each user
        topic = find_favorite_topic(username, data)
        stats = parse_messages(data, username)
        embedding = getEmbedding(topic, stats)

        favorite_topic_label = topic.get("label")
        keywords = topic.get("keywords")

        keywords_str = json.dumps(keywords)
        stats_str = json.dumps(stats)
        embedding_str = json.dumps(embedding.tolist())

        # Upsert into ConversationHistory (local table): since we cleared it, we can just create new entries.
        entry = ConversationHistory.create(
            username=username,
            favorite_topic=favorite_topic_label,
            keywords=keywords_str,
            stats=stats_str,
            embedding=embedding_str,
        )

        # For GlobalConversationHistory, update if record exists; otherwise, create new record.
        try:
            global_entry = GlobalConversationHistory.get(
                GlobalConversationHistory.username == username
            )
            global_entry.favorite_topic = favorite_topic_label
            global_entry.keywords = keywords_str
            global_entry.stats = stats_str
            global_entry.embedding = embedding_str
            global_entry.save()
        except GlobalConversationHistory.DoesNotExist:
            GlobalConversationHistory.create(
                username=username,
                favorite_topic=favorite_topic_label,
                keywords=keywords_str,
                stats=stats_str,
                embedding=embedding_str,
            )

    # Retrieve all records from ConversationHistory to compute 3D embeddings.
    records = list(ConversationHistory.select())
    all_embeddings = []
    for record in records:
        embedding_value = json.loads(record.embedding)
        all_embeddings.append(embedding_value)

    # Convert list of embeddings to a NumPy array.
    embedding_matrix = np.array(all_embeddings)
    # Squeeze the matrix in case of extra dimensions.
    embedding_matrix = (
        np.squeeze(embedding_matrix, axis=1)
        if embedding_matrix.ndim > 1 and embedding_matrix.shape[1] == 1
        else embedding_matrix
    )
    scaler = StandardScaler()
    embedding_matrix = scaler.fit_transform(embedding_matrix)

    resultantMatrix = pca_to_3(embedding_matrix)

    # Update three_d_embedding for both tables based on the conversationhistory records.
    for i, record in enumerate(records):
        three_d = resultantMatrix[i]  # a NumPy array with shape (3,)
        three_d_str = json.dumps(three_d.tolist())
        record.three_d_embedding = three_d_str
        record.save()

        # Update corresponding record in GlobalConversationHistory
        try:
            global_entry = GlobalConversationHistory.get(
                GlobalConversationHistory.username == record.username
            )
            global_entry.three_d_embedding = three_d_str
            global_entry.save()
        except GlobalConversationHistory.DoesNotExist:
            # Shouldn't happen since we inserted/updated earlier
            pass

    db.close()
    return jsonify({"message": "File received and processed."}), 200


@app.route("/getconversationhistory", methods=["GET"])
def get_conversation_history():
    global username
    if not username:
        return jsonify({"error": "Username not set"}), 400

    db.connect()
    try:
        record = GlobalConversationHistory.get(
            GlobalConversationHistory.username == username
        )
    except GlobalConversationHistory.DoesNotExist:
        db.close()
        return jsonify({"error": "No conversation history found for username"}), 404

    response = {
        "username": record.username,
        "favorite_topic": record.favorite_topic,
        "keywords": json.loads(record.keywords),
        "stats": json.loads(record.stats),
        "embedding": json.loads(record.embedding),
        "three_d_embedding": json.loads(record.three_d_embedding)
        if record.three_d_embedding
        else None,
    }
    db.close()
    return jsonify(response), 200


@app.route("/api/local_graph", methods=["GET"])
def get_local_graph():
    data = {}
    for record in orm.ConversationHistory.select(
        orm.ConversationHistory.username,
        orm.ConversationHistory.favorite_topic,
        orm.ConversationHistory.keywords,
        orm.ConversationHistory.stats,
        orm.ConversationHistory.three_d_embedding,
    ):
        data[record.username] = {
            "favorite_topic": record.favorite_topic,
            "keywords": record.keywords,
            "stats": record.stats,
            "three_d_embedding": record.three_d_embedding,
        }

        data = safe_eval_dict(data)

        for user in data:
            keyword = sorted(
                data[user]["keywords"], key=lambda x: x["score"], reverse=True
            )[:5]
            data[user]["keywords"] = keyword

    return jsonify(data)


if __name__ == "__main__":
    app.run(debug=True)
