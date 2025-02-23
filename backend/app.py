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
from generateCommentary import create_wrapped_commentary
from datetime import datetime  # Import datetime to generate conversation ID


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
    last_conversation = TextField(
        null=True, default=""
    )  # NEW COLUMN to track conversation source

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

    # Generate a unique conversation ID for this file upload
    conversation_id = datetime.now().isoformat()

    usernames = get_unique_usernames(data)[0:10]

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

        # Upsert into ConversationHistory (local table): since we cleared it, we can create new entries.
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
            global_entry.last_conversation = (
                conversation_id  # Update the conversation ID
            )
            global_entry.save()
        except GlobalConversationHistory.DoesNotExist:
            GlobalConversationHistory.create(
                username=username,
                favorite_topic=favorite_topic_label,
                keywords=keywords_str,
                stats=stats_str,
                embedding=embedding_str,
                last_conversation=conversation_id,  # Set conversation ID for new records
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
        "last_conversation": record.last_conversation,  # Include the conversation ID
    }
    db.close()
    return jsonify(response), 200


@app.route("/api/getmainuser", methods=["GET"])
def get_main_user():
    print("Main user:", username)
    return jsonify({"username": username}), 200


@app.route("/api/local_graph", methods=["GET"])
def get_local_graph():
    data = {}
    for record in ConversationHistory.select(
        ConversationHistory.username,
        ConversationHistory.favorite_topic,
        ConversationHistory.keywords,
        ConversationHistory.stats,
        ConversationHistory.three_d_embedding,
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

    print("Local Data: ", data)
    return jsonify(data)


@app.route("/api/global_graph", methods=["GET"])
def get_global_graph():
    # colors = [
    #     "#f43f5e",
    #     "#ec4899",
    #     "#d946ef",
    #     "#a855f7",
    #     "#8b5cf6",
    #     "#6366f1",
    #     "#3b82f6",
    #     "#0ea5e9",
    #     "#06b6d4",
    #     "#14b8a6",
    #     "#10b981",
    #     "#22c55e",
    #     "#84cc16",
    #     "#ef4444",
    # ]
    colors = [
        "#10b981",
        "#a855f7",
        "#ec4899",
        "#0ea5e9",
        "#6366f1",
        "#f43f5e",
        "#ef4444",
        "#84cc16",
        "#14b8a6",
        "#3b82f6",
        "#8b5cf6",
        "#d946ef",
        "#22c55e",
        "#06b6d4",
    ]
    data = {}
    color_map = {}
    color_index = 0

    for record in GlobalConversationHistory.select(
        GlobalConversationHistory.username,
        GlobalConversationHistory.favorite_topic,
        GlobalConversationHistory.keywords,
        GlobalConversationHistory.stats,
        GlobalConversationHistory.three_d_embedding,
        GlobalConversationHistory.last_conversation,
    ):
        data[record.username] = {
            "favorite_topic": record.favorite_topic,
            "keywords": record.keywords,
            "stats": record.stats,
            "three_d_embedding": record.three_d_embedding,
            "color": record.last_conversation,
        }

    data = safe_eval_dict(data)

    for user in data:
        keyword = sorted(
            data[user]["keywords"], key=lambda x: x["score"], reverse=True
        )[:5]
        data[user]["keywords"] = keyword

        lc = data[user]["color"]
        if lc not in color_map:
            color_map[lc] = colors[color_index % len(colors)]
            color_index += 1
        data[user]["color"] = color_map[lc]

    print("Gobal Data: ", data)
    return jsonify(data)


@app.route("/generateCommentary", methods=["POST"])
def generate_commentary():
    data = request.get_json()
    metric_value = data.get("metric")
    metric_name = data.get("name")
    if metric_value is None or metric_name is None:
        return jsonify({"error": "Invalid input"}), 400

    # Generate commentary using the metric value (converted to string)
    commentary = create_wrapped_commentary(
        metric_name + str(metric_value) + data.get("description")
    )

    # Mapping from metric names to a brief description.
    description_mapping = {
        "Total Emojis Used": "The total number of emojis used across all messages.",
        "Messages with at Least One Emoji": "Count of messages that include at least one emoji.",
        "Total Emoji Used in Reactions": "Total count of emojis used in reaction responses.",
        "Unique Emoji Used in Reactions": "Number of distinct emojis used in reactions.",
        "Messages with at Least One Emoji Reacted": "Count of messages that received an emoji reaction.",
        "Most Used Emoji": "The emoji that appears most frequently in conversations.",
        "Dryness Score": "A score representing how dry or unengaging the conversation is.",
        "Humor Score": "A score indicating the level of humor in the conversation.",
        "Romance Score": "A score indicating how romantic the conversation is.",
    }
    description = description_mapping.get(metric_name, "No description available.")
    return jsonify({"commentary": commentary, "description": description})


if __name__ == "__main__":
    app.run(debug=True)
