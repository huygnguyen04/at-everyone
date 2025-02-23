import numpy as np
import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"
# Import the functions and objects from your two files.
# Adjust the module names below as needed.
from topicModeling import find_favorite_topic, embedder
from jsonParsing import parse_messages
from sklearn.preprocessing import StandardScaler

def parse_timedelta(time_str):
    """
    Converts a time string into a total number of seconds.
    Handles two cases:
      - "H:MM:SS.ssssss" (e.g., "1:01:37.073000")
      - "X days, H:MM:SS.ssssss" (e.g., "253 days, 7:32:45.267000")
    """
    if "days" in time_str:
        # Expected format: "253 days, 7:32:45.267000"
        days_part, time_part = time_str.split(" days, ")
        days = int(days_part.strip())
        h, m, s = time_part.split(":")
        total_seconds = days * 86400 + int(h) * 3600 + int(m) * 60 + float(s)
    else:
        # Expected format: "1:01:37.073000"
        h, m, s = time_str.split(":")
        total_seconds = int(h) * 3600 + int(m) * 60 + float(s)
    return total_seconds

def getEmbedding(favorite_label, stats):

    # === 1. Favorite Topic Embedding ===
    topic_embedding = embedder.encode([favorite_label])
    
    # 1. Total number of messages.
    total_messages = stats.get("Message Counts and Types", {}).get("total_messages", 0)
    
    # 2. Average messages per day.
    avg_messages_per_day = stats.get("Activity Metrics", {}).get("average_messages_per_day", 0)
    
    # 3. Longest active conversation (in seconds).
    longest_active_str = stats.get("Activity Metrics", {}).get("longest_active_conversation", "0:00:00")
    longest_active_conv = parse_timedelta(longest_active_str)
    
    # 4. Longest period without messages (in seconds).
    longest_period_str = stats.get("Activity Metrics", {}).get("longest_period_without_messages", "0:00:00")
    longest_period = parse_timedelta(longest_period_str)
    
    # 5. Dryness Score.
    dryness = stats.get("Dryness Score", 0)
    
    # 6. Humor Score.
    humor = stats.get("Humor Score", 0)
    
    # 7. Messages with at least one emoji.
    messages_with_emoji = stats.get("Emoji Usage (in text and reactions)", {}).get("messages_with_at_least_one_emoji", 0)
    
    # 8. Count of most used emoji.
    most_used_emoji_count = stats.get("Most Used Emoji", {}).get("count", 0)
    
    # 9. Average words per minute (using average words per message).
    avg_words_per_message= stats.get("Word Usage Statistics", {}).get("average_words_per_message", 0)
    
    # 10. Total meaningful words.
    total_meaningful_words = stats.get("Word Usage Statistics", {}).get("total_meaningful_words", 0)
    
    # 11. Unique words used.
    unique_words_used = stats.get("Word Usage Statistics", {}).get("unique_words_used", 0)
    
    # 12. Number of messages on the most active day.
    most_active_day_info = stats.get("Time-Related Details", {}).get("most_active_day", (None, 0))
    most_active_day_count = most_active_day_info[1] if isinstance(most_active_day_info, (tuple, list)) else 0
    
    # Create the stats vector (12-dimensional).
    stats_vector = np.array([
        total_messages, 
        avg_messages_per_day,

        # change to date time
        longest_active_conv,
        longest_period,

        dryness,
        humor,
        messages_with_emoji,

        # this needs to be a tuple, + image url
        most_used_emoji_count,
        avg_words_per_message,
        total_meaningful_words,
        unique_words_used,

        # this needs to be a tuple, + date
        most_active_day_count
    ], dtype=np.float32)
    
    stats_vector = np.expand_dims(stats_vector, axis=0)

    combined_vector = np.concatenate([topic_embedding, stats_vector], axis=1)

    return combined_vector
