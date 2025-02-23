from jsonParsing import parse_messages, get_unique_usernames
from generateEmbedding import getEmbedding
from topicModeling import find_favorite_topic
from pca import pca_to_3
import numpy as np
from sklearn.preprocessing import StandardScaler

import json
from peewee import Model, TextField, SqliteDatabase

# Initialize the database (creates conversationhistory.db in the current directory)
db = SqliteDatabase('conversationhistory.db')

class ConversationHistory(Model):
    username = TextField(primary_key=True)
    favorite_topic = TextField()  # e.g., the topic label
    keywords = TextField()        # stored as a JSON string
    stats = TextField()           # stored as a JSON string of all stats
    embedding = TextField()       # stored as a JSON string of the embedding
    three_d_embedding = TextField(null=True, default="")  # new column initialized to nothing

    class Meta:
        database = db
        table_name = 'conversationhistory'

# Connect to the database, clear existing data, and create the table.
db.connect()
db.create_tables([ConversationHistory])

json_file = "chat_history.json"
usernames = get_unique_usernames(json_file)

# Iterate over the usernames and store the conversation data.
for username in usernames:
    # Retrieve topic, stats, and embedding for each user.
    topic = find_favorite_topic(username, json_file)
    stats = parse_messages(json_file, username)
    embedding = getEmbedding(topic, stats)

    favorite_topic_label = topic.get("label")
    keywords = topic.get("keywords")

    keywords_str = json.dumps(keywords)
    stats_str = json.dumps(stats)
    embedding_str = json.dumps(embedding.tolist())

    # Try to get the record; if it exists, update it; otherwise, create a new one.
    entry, created = ConversationHistory.get_or_create(
        username=username,
        defaults={
            "favorite_topic": favorite_topic_label,
            "keywords": keywords_str,
            "stats": stats_str,
            "embedding": embedding_str,
        }
    )
    if not created:
        # Record already exists, so update its fields.
        entry.favorite_topic = favorite_topic_label
        entry.keywords = keywords_str
        entry.stats = stats_str
        entry.embedding = embedding_str
        entry.save()

records = ConversationHistory.select()

# Initialize a list to collect embeddings.
all_embeddings = []

# Loop through each record, load the JSON string into a list (or array), and append it.
for record in records:
    # Assuming record.embedding is stored as a JSON string like "[1,3,3]"
    embedding = json.loads(record.embedding)
    all_embeddings.append(embedding)

# Convert the list of embeddings into a NumPy array (matrix).
embedding_matrix = np.array(all_embeddings)
embedding_matrix = np.squeeze(embedding_matrix, axis=1)
scaler = StandardScaler()
embedding_matrix = scaler.fit_transform(embedding_matrix)

resultantMatrix = pca_to_3(embedding_matrix)

for i, record in enumerate(records):
    # Get the i-th row from the resultant matrix.
    three_d = resultantMatrix[i]  # this is a NumPy array of shape (3,)
    # Convert it to a list and then to a JSON string.
    record.three_d_embedding = json.dumps(three_d.tolist())
    record.save()

db.close()
