from chatbot.utils.vector_store import query_vector_db, OpenAIEmbeddings, Cassandra
from chatbot.utils.env import OPENAI_API_KEY

def show_all_data():
    print("\n📚 Fetching all data from vector store...")
    try:
        # Initialize embeddings
        embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)

        # Initialize vector store
        vector_store = Cassandra(
            embedding=embeddings,
            table_name="web_docs",
            session=None,
            keyspace=None,
        )

        # Get all documents
        docs = vector_store.similarity_search(
            "Show all documents",  # Generic query to fetch all
            k=100  # Increase this if you have more documents
        )

        print(f"\n✅ Found {len(docs)} documents\n")

        # Display each document with its metadata
        for i, doc in enumerate(docs, 1):
            print(f"\n📄 Document {i}:")
            print("Content:")
            print(doc.page_content)
            print("\nMetadata:")
            for key, value in doc.metadata.items():
                print(f"{key}: {value}")
            print("-" * 80)

    except Exception as e:
        print(f"\n❌ Error while fetching data: {e}")

if __name__ == "__main__":
    show_all_data()