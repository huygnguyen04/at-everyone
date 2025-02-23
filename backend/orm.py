from peewee import Model, TextField, SqliteDatabase

db = SqliteDatabase("conversationhistory.db")


class ConversationHistory(Model):
    username = TextField(primary_key=True)
    favorite_topic = TextField()  # e.g., the topic label
    keywords = TextField()  # stored as a JSON string
    stats = TextField()  # stored as a JSON string of all stats
    embedding = TextField()  # stored as a JSON string of the embedding
    three_d_embedding = TextField(
        null=True, default=""
    )  # new column initialized to nothing

    class Meta:
        database = db
        table_name = "conversationhistory"
