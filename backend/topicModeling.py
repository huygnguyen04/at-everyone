import os
import json
import re
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from collections import defaultdict
from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.feature_extraction.text import TfidfVectorizer
from keybert import KeyBERT
from openai import OpenAI  # Using the new client format
from dotenv import load_dotenv

import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"


load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")

# --- Setup: Download required NLTK data ---
nltk.download('punkt')
nltk.download('punkt_tab')
nltk.download('stopwords')
nltk.download('vader_lexicon')

# --- Setup OpenAI GPT-4o Client ---
client = OpenAI(api_key=api_key)  # Make sure your API key is set appropriately (e.g., via the OPENAI_API_KEY env variable)

# --- Setup SentenceTransformer for embeddings ---
embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# --- Setup KeyBERT using the same embedding model ---
kw_model = KeyBERT("all-MiniLM-L6-v2")

# --- Function to clean and tokenize text using NLTK's default stopwords ---
def clean_text(text):
    text = text.lower()  # Lowercase
    text = re.sub(r'http\S+|www\.\S+', '', text)  # Remove URLs
    text = re.sub(r'[^a-z\s]', '', text)  # Remove non-alphabetical characters
    tokens = word_tokenize(text)
    tokens = [word for word in tokens if word not in stopwords.words('english')]
    return tokens

# --- Function to auto-label the topic using GPT-4o via the OpenAI API ---
def auto_label_topic_with_hf(keywords, topn=10):
    prompt = (
        f"Here are some keywords that represent a discussion topic: {', '.join(keywords)}. "
        "Based solely on these keywords, provide one single, descriptive word that summarizes the topic. "
        "Answer with one word only, no extra text or punctuation."
    )
    completion = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "developer", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ]
    )
    # Following the provided format; adjust extraction as needed.
    label = completion.choices[0].message.content.strip().split()[0]
    return label

# --- Function to compute top keywords from aggregated tokens using KeyBERT ---
def compute_cluster_keywords(tokens, topn=10):
    aggregated_text = " ".join(tokens)
    extracted_keywords = kw_model.extract_keywords(
        aggregated_text,
        keyphrase_ngram_range=(1, 1),  # Single words
        stop_words=None,               # No custom stopword filtering
        top_n=topn
    )
    # Normalize KeyBERT scores to percentages:
    total_score = sum(score for _, score in extracted_keywords)
    normalized_keywords = [(kw, (score / total_score) * 100) for kw, score in extracted_keywords]
    return normalized_keywords

# --- Main function to process the chat history and find the favorite topic ---
def find_favorite_topic(username, data):
    # --- Load the JSON file ---

    if isinstance(data, dict) and "messages" in data:
        messages = data["messages"]
    else:
        messages = data

    # --- Filter messages from the target user and compute cleaned tokens & sentiment ---
    sia = SentimentIntensityAnalyzer()
    filtered_target_messages = []    # raw messages with non-empty cleaned tokens
    filtered_cleaned_docs = []       # list of token lists
    filtered_sentiment_scores = []   # sentiment scores

    for msg in messages:
        if isinstance(msg, dict) and msg.get("author", {}).get("name") == username:
            content = msg.get("content", "")
            if content.strip():
                tokens = clean_text(content)
                if tokens:  # Only keep messages with non-empty token lists
                    filtered_target_messages.append(content)
                    filtered_cleaned_docs.append(tokens)
                    filtered_sentiment_scores.append(sia.polarity_scores(content)['compound'])

    if not filtered_target_messages:
        return {"keywords": [], "label": ""}

    # --- Compute sentence embeddings for each valid message ---
    embeddings = embedder.encode(filtered_target_messages, show_progress_bar=True)

    # --- Cluster embeddings using KMeans and choose the optimal number using silhouette score ---
    best_k = None
    best_score = -1
    best_labels = None
    for k in range(2, min(10, len(filtered_target_messages))):
        kmeans = KMeans(n_clusters=k, random_state=42)
        labels = kmeans.fit_predict(embeddings)
        score = silhouette_score(embeddings, labels)
        if score > best_score:
            best_score = score
            best_k = k
            best_labels = labels

    # --- Aggregate data by cluster ---
    cluster_data = defaultdict(lambda: {"indices": [], "count": 0, "sentiment_sum": 0.0, "tokens": []})
    for i, label in enumerate(best_labels):
        cluster_data[label]["indices"].append(i)
        cluster_data[label]["count"] += 1
        cluster_data[label]["sentiment_sum"] += filtered_sentiment_scores[i]
        cluster_data[label]["tokens"].extend(filtered_cleaned_docs[i])

    # --- Compute aggregated TF-IDF scores for each cluster ---
    cluster_texts = {}
    for label, data_dict in cluster_data.items():
        aggregated_text = " ".join(data_dict["tokens"])
        cluster_texts[label] = aggregated_text

    labels_sorted = sorted(cluster_texts.keys())
    texts = [cluster_texts[label] for label in labels_sorted]

    tfidf_vectorizer = TfidfVectorizer()
    tfidf_matrix = tfidf_vectorizer.fit_transform(texts)

    cluster_tfidf_scores = {}
    for i, label in enumerate(labels_sorted):
        sum_tfidf = tfidf_matrix[i].sum()
        cluster_tfidf_scores[label] = sum_tfidf

    # --- Compute a combined score for each cluster (tfidf_sum * (1 + average sentiment)) ---
    cluster_scores = {}
    for label, data_dict in cluster_data.items():
        count = data_dict["count"]
        avg_sentiment = data_dict["sentiment_sum"] / count
        tfidf_score = cluster_tfidf_scores[label]
        combined_score = tfidf_score * (1 + avg_sentiment)
        cluster_scores[label] = combined_score

    favorite_cluster = max(cluster_scores, key=cluster_scores.get)

    # --- Extract keywords from the favorite cluster using KeyBERT and normalize scores to percentages ---
    extracted_keywords = compute_cluster_keywords(cluster_data[favorite_cluster]["tokens"], topn=10)
    keywords = [{"keyword": keyword, "score": score} for keyword, score in extracted_keywords]

    # --- Generate a one-word label for the favorite topic using GPT-4o ---
    favorite_label = auto_label_topic_with_hf([kw["keyword"] for kw in keywords], topn=10)

    return {"keywords": keywords, "label": favorite_label}

# Example usage:
'''
username = "fnweeaboo"
file_path = "chat_history.json"
result = find_favorite_topic(username, file_path)
print("\nFavorite Topic Details (Embedding-Based Clustering with KeyBERT and TF-IDF + Sentiment):")
print(f"One-word label: {result['label']}")
print("Extracted Keywords (with normalized percentages):")
for keyword_info in result["keywords"]:
    print(f"  {keyword_info['keyword']}: {keyword_info['score']:.1f}%")
'''