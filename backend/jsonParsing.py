import json
import re
from datetime import datetime, timedelta
from collections import Counter
import math
import nltk
from tqdm import tqdm
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# --- Helper functions for file type detection ---
def is_image(filename):
    return filename.lower().endswith(('.png', '.jpg', '.jpeg'))

def is_gif(filename):
    return filename.lower().endswith('.gif')

def is_video(filename):
    return filename.lower().endswith(('.mp4', '.webm', '.mov', '.avi'))

def is_audio(filename):
    return filename.lower().endswith(('.mp3', '.wav', '.ogg', '.flac'))

def is_document(filename):
    return filename.lower().endswith(('.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'))

def contains_link(text):
    url_regex = re.compile(r'https?://\S+')
    return bool(url_regex.search(text))

# format timedelta helper function
def parse_timedelta(time_str):
    """
    Parses a time string in one of the following formats:
      - "HH:MM"
      - "HH:MM:SS"
      - "X days, HH:MM"
      - "X days, HH:MM:SS"
    Returns a timedelta object.
    """
    time_str = str(time_str)
    print(time_str)

    days = 0
    # Check if the time string contains a day component.
    if "day" in time_str:
        days_part, time_part = time_str.split(", ")
        days = int(days_part.split()[0])
    else:
        time_part = time_str

    # Split the time part by ":".
    parts = time_part.split(":")
    print(parts)

    if len(parts) == 2:
        # Format is HH:MM, assume 0 seconds.
        hours, minutes = map(int, parts)
        seconds = 0

    elif len(parts) == 3:
        # Format is HH:MM:SS.
        hours, minutes, seconds = map(float, parts)
        seconds = round(seconds)
    else:
        raise ValueError("Time string is not in a recognized format (expected HH:MM or HH:MM:SS)")
    
    return f"{int(days)} days, {int(hours)} hours, and {int(minutes)} minutes"
    
    # return timedelta(days=days, hours=hours, minutes=minutes, seconds=seconds)

# --- Regex for detecting Unicode emoji in text ---
emoji_pattern = re.compile("[" 
    u"\U0001F600-\U0001F64F"  # Emoticons
    u"\U0001F300-\U0001F5FF"  # Symbols & pictographs
    u"\U0001F680-\U0001F6FF"  # Transport & map symbols
    u"\U0001F1E0-\U0001F1FF"  # Flags
    "]+", flags=re.UNICODE)

# --- Stopwords list (expand as needed) ---
stopwords = {
    "the", "a", "an", "and", "or", "but", "if", "then", "else", "of", "at",
    "by", "for", "with", "about", "against", "between", "to", "from", "in",
    "out", "on", "off", "over", "under", "is", "it", "this", "that", "are",
    "was", "were", "be", "been", "has", "have", "had", "i", "you", "he", "she",
    "we", "they", "them", "my", "your", "his", "her", "our", "their", "what",
    "which", "who", "whom", "where", "when", "why", "how"
}

# --- Helper function to generate a Twemoji URL for a Unicode emoji ---
def emoji_to_url(emoji_char):
    code = "-".join(f"{ord(ch):x}" for ch in emoji_char)
    return f"https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/{code}.svg"

# --- Heuristic dryness scoring (no LLM) ---
def compute_message_dryness(message_text):
    """
    Computes a dryness score (0 to 1) based on several heuristic factors:
      - A logistic function on word count (fewer words → higher dryness).
      - A punctuation multiplier: messages with no exclamation or question marks are considered drier.
      - A sentiment multiplier from VADER: messages with very neutral sentiment are considered drier.
    """
    # Tokenize words.
    words = re.findall(r'\b\w+\b', message_text)
    word_count = len(words)
    
    # Use a logistic function on word count.
    # Midpoint set to 10 words and a scale factor of 2.
    dryness_word = 1 / (1 + math.exp((word_count - 10) / 2))
    
    # Punctuation multiplier: if the message has "!" or "?", reduce dryness.
    punctuation_multiplier = 0.8 if ('!' in message_text or '?' in message_text) else 1.0
    
    # Sentiment multiplier using VADER.
    analyzer = SentimentIntensityAnalyzer()
    compound = analyzer.polarity_scores(message_text)['compound']
    # Neutral messages (compound near 0) yield higher dryness.
    sentiment_multiplier = 1 - abs(compound)  # Ranges from 0 to 1.
    
    # Combine factors.
    dryness = dryness_word * punctuation_multiplier * sentiment_multiplier
    # Clamp to [0, 1]
    dryness = max(0, min(1, dryness))
    return dryness

# --- Heuristic humor scoring (no LLM) ---
def compute_message_humor(message_text):
    """
    Computes a humor score (0 to 1) using simple heuristics:
      - Counts laughter-related keywords ("lol", "haha", etc.).
      - Counts exclamation marks.
      - Counts emojis.
    The score is computed relative to the total number of words.
    """
    text_lower = message_text.lower()
    words = re.findall(r'\b\w+\b', text_lower)
    word_count = len(words)
    
    # Laughter keywords.
    laughter_keywords = ["lol", "haha", "lmao", "rofl", "xd"]
    laughter_count = sum(text_lower.count(kw) for kw in laughter_keywords)
    
    exclamation_count = message_text.count("!")
    emoji_count = len(emoji_pattern.findall(message_text))
    
    # Compute a raw humor score.
    # The numerator gives extra weight to laughter keywords.
    raw_humor = (2 * laughter_count + exclamation_count + emoji_count)
    # Denominator: use half the word count plus one to adjust scale.
    humor_ratio = raw_humor / (word_count / 2 + 1)
    # Multiply by a scaling factor (1.5) and then clip to 1.
    humor = min(1, humor_ratio * 1.5)
    return humor

# --- Heuristic romance scoring ---
def compute_message_romance(message_text):
    """
    Computes a romance score (0 to 1) using simple heuristics:
      - Counts romance-related keywords (e.g., "love", "darling", "romantic", etc.).
      - Counts heart-related emojis.
      - Adds a boost if the sentiment is highly positive.
    The score is computed relative to the total number of words and then scaled.
    """
    text_lower = message_text.lower()
    words = re.findall(r'\b\w+\b', text_lower)
    word_count = len(words)
    
    # Define romance keywords.
    romance_keywords = [
        "love", "loved", "loving", "adorable", "adore", "sweetheart",
        "dear", "darling", "romance", "romantic", "passion", "infatuation", "amour"
    ]
    romance_count = sum(text_lower.count(kw) for kw in romance_keywords)
    
    # Count heart-related emojis.
    heart_emojis = ["❤️", "😍", "😘", "💕", "💖", "💗", "💘", "💝"]
    heart_count = sum(message_text.count(emoji) for emoji in heart_emojis)
    
    # Use sentiment analysis for a positive boost.
    analyzer = SentimentIntensityAnalyzer()
    compound = analyzer.polarity_scores(message_text)['compound']
    sentiment_boost = compound if compound > 0.5 else 0
    
    # Combine counts: giving half weight to heart emojis.
    raw_romance = romance_count + 0.5 * heart_count + sentiment_boost
    
    # Normalize by word count.
    romance_ratio = (raw_romance / word_count) if word_count else 0
    
    # Scale to [0, 1]. The scaling factor can be adjusted based on your preferences.
    scaling_factor = 3
    romance_score = min(1, romance_ratio * scaling_factor)
    
    return romance_score

def funny_romance_label(final_score):
    if final_score >= 9:
        return "Passionate (swoon-worthy)"
    elif final_score >= 7:
        return "Romantic (but not a poet)"
    elif final_score >= 5:
        return "Somewhat Affectionate"
    elif final_score >= 3:
        return "Reserved (like a guarded heart)"
    else:
        return "Cold as ice (no romance)"

# --- Funny label functions for dryness and humor ---
def funny_dryness_label(final_score):
    if final_score >= 9:
        return "Bone Dry (Sahara level)"
    elif final_score >= 7:
        return "Desert Dry"
    elif final_score >= 5:
        return "Parched"
    elif final_score >= 3:
        return "Somewhat Moist"
    else:
        return "Hydrated (Not dry at all)"

def funny_humor_label(final_score):
    if final_score >= 9:
        return "Hilarious (Netflix special worthy)"
    elif final_score >= 7:
        return "Very Funny (Stand-up gold)"
    elif final_score >= 5:
        return "Decent Chuckles"
    elif final_score >= 3:
        return "Mildly Amusing"
    else:
        return "Not Funny (Better stick to memes)"

# --- Main parsing function ---
def parse_messages(data, target_username):
    # Load the JSON data.
    # If the JSON is wrapped in a dictionary with a "messages" key, extract it.
    if isinstance(data, dict) and "messages" in data:
        data = data["messages"]
    
    if not isinstance(data, list):
        raise ValueError("The JSON file does not contain a list of messages.")
    
    # Filter messages by username.
    user_messages = [
        msg for msg in data 
        if isinstance(msg, dict) and msg.get('author', {}).get('name') == target_username
    ]
    
    # Initialize basic message counters.
    stats = {
        "total_messages": len(user_messages),
        "messages_with_text": 0,
        "messages_with_links": 0,
        "messages_with_images": 0,
        "messages_with_gifs": 0,
        "messages_with_videos": 0,
        "messages_with_stickers": 0,
        "messages_with_audio_files": 0,
        "messages_with_documents": 0,
        "messages_with_other_files": 0,
        "edited_messages": 0,
    }
    
    # Lists for time, word, and emoji analyses.
    all_timestamps = []
    text_word_counts = []  # For each text message, store its count of meaningful words.
    all_words = []         # All meaningful words (for uniqueness, etc.)
    
    # Emoji usage counters.
    text_emoji_counter = Counter()
    inline_emoji_counter = Counter()
    inline_emoji_details = {}  # Maps inline emoji name to its imageUrl.
    emoji_count_total = 0  
    messages_with_emoji = 0

    total_emoji_reactions = 0
    emoji_counter_reactions = Counter()
    messages_with_reactions = 0

    # Time-related counters.
    year_counter = Counter()
    month_counter = Counter()
    day_counter = Counter()
    hour_counter = Counter()
    sorted_timestamps = []

    conversation_durations = []
    
    # Lists to collect per-message dryness, humor, and romance scores.
    dryness_scores = []
    humor_scores = []
    romance_scores = []
    
    # Wrap the loop with tqdm to show a progress bar.
    for msg in tqdm(user_messages, desc=f"Processing messages for {target_username}"):
        # Process timestamp.
        timestamp_str = msg.get('timestamp')
        if timestamp_str:
            try:
                dt = datetime.fromisoformat(timestamp_str)
            except ValueError:
                from dateutil.parser import isoparse
                dt = isoparse(timestamp_str)
            all_timestamps.append(dt)
            sorted_timestamps.append(dt)
            year_counter[dt.year] += 1
            month_counter[dt.strftime("%Y-%m")] += 1
            day_counter[dt.strftime("%Y-%m-%d")] += 1
            hour_counter[dt.strftime("%Y-%m-%d %I %p")] += 1
        
        if msg.get('timestampEdited'):
            stats["edited_messages"] += 1
        
        # Process text content.
        content = msg.get('content', '').strip()
        if content:
            stats["messages_with_text"] += 1
            if contains_link(content):
                stats["messages_with_links"] += 1
            
            # Tokenize and remove stopwords.
            words = re.findall(r'\b\w+\b', content.lower())
            meaningful_words = [word for word in words if word not in stopwords]
            text_word_counts.append(len(meaningful_words))
            all_words.extend(meaningful_words)
            
            # Count Unicode (text) emojis.
            emojis_found = emoji_pattern.findall(content)
            if emojis_found:
                messages_with_emoji += 1
                for em in emojis_found:
                    text_emoji_counter[em] += 1
                    emoji_count_total += 1
            
            # Compute dryness, humor, and romance scores using our heuristic functions.
            dryness_scores.append(compute_message_dryness(content))
            humor_scores.append(compute_message_humor(content))
            romance_scores.append(compute_message_romance(content))
        
        # Process inline (custom) emojis.
        inline_emojis = msg.get('inlineEmojis', [])
        if inline_emojis:
            messages_with_emoji += 1
            for em in inline_emojis:
                name = em.get('name')
                inline_emoji_counter[name] += 1
                emoji_count_total += 1
                if name not in inline_emoji_details:
                    inline_emoji_details[name] = em.get('imageUrl')
        
        # Process attachments.
        attachments = msg.get('attachments', [])
        for att in attachments:
            filename = att.get('fileName', '')
            if filename:
                if is_image(filename):
                    stats["messages_with_images"] += 1
                elif is_gif(filename):
                    stats["messages_with_gifs"] += 1
                elif is_video(filename):
                    stats["messages_with_videos"] += 1
                elif is_audio(filename):
                    stats["messages_with_audio_files"] += 1
                elif is_document(filename):
                    stats["messages_with_documents"] += 1
                else:
                    stats["messages_with_other_files"] += 1
        
        # Count stickers.
        stickers = msg.get('stickers', [])
        if stickers:
            stats["messages_with_stickers"] += 1

        # Process reactions.
        reactions = msg.get('reactions', [])
        if reactions:
            messages_with_reactions += 1
            for reaction in reactions:
                count = reaction.get('count', 0)
                total_emoji_reactions += count
                emoji_info = reaction.get('emoji', {})
                emoji_name = emoji_info.get('name')
                if emoji_name:
                    emoji_counter_reactions[emoji_name] += count
    
    # --- Time-based statistics ---
    sorted_timestamps.sort()
    longest_gap = timedelta(0)
    if len(sorted_timestamps) > 1:
        for i in range(1, len(sorted_timestamps)):
            gap = sorted_timestamps[i] - sorted_timestamps[i-1]
            if gap > longest_gap:
                longest_gap = gap
    longest_gap_string = parse_timedelta(longest_gap)

    if all_timestamps:
        total_days = (max(all_timestamps) - min(all_timestamps)).days + 1
        avg_messages_per_day = len(user_messages) / total_days if total_days > 0 else len(user_messages)
        # round avg message per day
        avg_messages_per_day = round(avg_messages_per_day, 3)
    else:
        avg_messages_per_day = 0

    if sorted_timestamps:
        conversation_start = sorted_timestamps[0]
        conversation_end = sorted_timestamps[0]
        for i in range(1, len(sorted_timestamps)):
            gap = sorted_timestamps[i] - sorted_timestamps[i-1]
            if gap <= timedelta(minutes=10):
                conversation_end = sorted_timestamps[i]
            else:
                conversation_durations.append(conversation_end - conversation_start)
                conversation_start = sorted_timestamps[i]
                conversation_end = sorted_timestamps[i]
        conversation_durations.append(conversation_end - conversation_start)
        longest_conversation = max(conversation_durations)
        
    else:
        longest_conversation = timedelta(0)

    longest_conversation_string = parse_timedelta(longest_conversation)
    
    total_meaningful_words = sum(text_word_counts)
    unique_words = set(all_words)
    avg_words_per_message = total_meaningful_words / len(text_word_counts) if text_word_counts else 0
    avg_words_per_message = round(avg_words_per_message, 3)

    most_active_year = year_counter.most_common(1)[0] if year_counter else ("N/A", 0)
    most_active_month = month_counter.most_common(1)[0] if month_counter else ("N/A", 0)
    most_active_day = day_counter.most_common(1)[0] if day_counter else ("N/A", 0)
    most_active_hour = hour_counter.most_common(1)[0] if hour_counter else ("N/A", 0)
    
    # --- Determine the most used emoji overall ---
    if text_emoji_counter:
        max_text_emoji, count_text = max(text_emoji_counter.items(), key=lambda x: x[1])
    else:
        max_text_emoji, count_text = None, 0
    
    if inline_emoji_counter:
        max_inline_emoji, count_inline = max(inline_emoji_counter.items(), key=lambda x: x[1])
    else:
        max_inline_emoji, count_inline = None, 0
    
    if count_text >= count_inline and max_text_emoji is not None:
        overall_emoji = max_text_emoji
        overall_count = count_text
        overall_url = emoji_to_url(overall_emoji)
    elif max_inline_emoji is not None:
        overall_emoji = max_inline_emoji
        overall_count = count_inline
        overall_url = inline_emoji_details.get(overall_emoji)
    else:
        overall_emoji = None
        overall_count = 0
        overall_url = None
    
    # --- Compute overall dryness, humor, and romance scores ---
    if dryness_scores:
        avg_dryness = sum(dryness_scores) / len(dryness_scores)
        final_dryness_score = round(avg_dryness * 9 + 1, 2)
    else:
        final_dryness_score = None
    
    if humor_scores:
        avg_humor = sum(humor_scores) / len(humor_scores)
        final_humor_score = round(avg_humor * 9 + 1, 2) + 2
        final_humor_score = round(final_humor_score, 3)
    else:
        final_humor_score = None

    if romance_scores:
        avg_romance = sum(romance_scores) / len(romance_scores)
        final_romance_score = round(avg_romance * 9 + 1, 2)
    else:
        final_romance_score = None
    
    funny_dry_label = funny_dryness_label(final_dryness_score) if final_dryness_score is not None else "No Data"
    funny_humor_label_text = funny_humor_label(final_humor_score) if final_humor_score is not None else "No Data"
    funny_romance_label_text = funny_romance_label(final_romance_score) if final_romance_score is not None else "No Data"
    
    result = {
        "Message Counts and Types": stats,
        "Activity Metrics": {
            "average_messages_per_day": avg_messages_per_day,
            "longest_period_without_messages": longest_gap_string,
            "longest_active_conversation": longest_conversation_string
        },
        "Time-Related Details": {
            "most_active_year": most_active_year,
            "most_active_month": most_active_month,
            "most_active_day": most_active_day,
            "most_active_hour": most_active_hour
        },
        "Word Usage Statistics": {
            "total_meaningful_words": total_meaningful_words,
            "unique_words_used": len(unique_words),
            "average_words_per_message": avg_words_per_message
        },
        "Emoji Usage (in text and reactions)": {
            "total_emoji_used": emoji_count_total,
            "messages_with_at_least_one_emoji": messages_with_emoji,
            "total_emoji_used_in_reactions": total_emoji_reactions,
            "unique_emoji_used_in_reactions": len(emoji_counter_reactions),
            "messages_with_at_least_one_emoji_reacted": messages_with_reactions
        },
        "Most Used Emoji": {
            "emoji": overall_emoji,
            "count": overall_count,
            "imageUrl": overall_url
        },
        "Dryness Score": final_dryness_score,
        "Funny Dryness Label": funny_dry_label, 
        "Humor Score": round(final_humor_score, 2) if final_humor_score is not None else None,
        "Funny Humor Label": funny_humor_label_text,
        "Romance Score": final_romance_score,
        "Funny Romance Label": funny_romance_label_text
    }
    
    return result

def get_unique_usernames(data):
    """
    Parses the JSON file and returns a list of unique usernames that have sent at least 5 messages.
    A user is considered to have sent a message if the 'content' field is non-empty.
    """
    if isinstance(data, dict) and "messages" in data:
        messages = data["messages"]
    elif isinstance(data, list):
        messages = data
    else:
        raise ValueError("The JSON file does not contain a list of messages.")
    
    message_counts = {}
    for msg in messages:
        if isinstance(msg, dict):
            content = msg.get('content', '')
            if content and content.strip():
                author = msg.get('author', {})
                username = author.get('name')
                if username:
                    message_counts[username] = message_counts.get(username, 0) + 1
    return [username for username, count in message_counts.items() if count >= 5]