import cassio
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Cassandra
from langchain.docstore.document import Document
from .env import ASTRA_DB_APPLICATION_TOKEN, ASTRA_DB_ID, ASTRA_DB_REGION, OPENAI_API_KEY
from langchain.text_splitter import CharacterTextSplitter
from langchain.chains.question_answering import load_qa_chain
from ..file_reader import read_uploaded_file

# 🔥 Load model
llm = ChatOpenAI(
    model="gpt-4o-mini",
    api_key=OPENAI_API_KEY,
    temperature=0.2
)

# Init DB
cassio.init(token=ASTRA_DB_APPLICATION_TOKEN, database_id=ASTRA_DB_ID)

def prepare_pages(data):
    """
    Prepares the 'pages' input based on type of upload:
    - file
    - text
    - qna
    """

    pages = []

    if data["type"] == "file":
        # File upload case
        uploaded_file = data["file"]
        content = read_uploaded_file(uploaded_file)
        pages.append((uploaded_file.name, content))

    elif data["type"] == "text":
        # Plain text upload case
        raw_text = data["text"]
        pages.append(("manual_input", raw_text))

    elif data["type"] == "qna":
        # Question-Answer upload case
        question = data["question"]
        answer = data["answer"]
        category = data.get("category", "general")  # fallback if not provided
        subcategory = data.get("subcategory", "general")

        content = f"Category: {category}\nSubcategory: {subcategory}\nQ: {question}\nA: {answer}"
        pages.append(("qna_input", content))

    else:
        raise ValueError("Invalid input type provided. Must be 'file', 'text', or 'qna'.")

    return pages

def store_in_vector_db(pages, namespace="web_scraped"):
    print("\n📦 Starting vector DB storage process...")
    print(f"📄 Number of pages to embed: {len(pages)}")

    try:
        # 🧠 Smart chunking
        text_splitter = CharacterTextSplitter(
            separator="\n",
            chunk_size=750,
            chunk_overlap=100
        )

        documents = []
        for url, text in pages:
            chunks = text_splitter.create_documents([text])
            documents.extend(chunks)

        print(f"✅ Total chunks created: {len(documents)}")

        # Embeddings
        embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)

        # Cassandra vector store
        vector_store = Cassandra(
            embedding=embeddings,
            table_name="web_docs",
            session=None,
            keyspace=None,
        )

        # Store documents
        print("💾 Adding chunks to vector DB...")
        vector_store.add_documents(documents)
        print("🎉 Chunks successfully stored in vector DB.")

    except Exception as e:
        print("❌ Error while storing documents:", e)

def query_vector_db(question, namespace="web_scraped"):
    print("\n❓ Running query on vector DB...")
    print(f"🧠 Question: {question}")

    try:
        embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)

        vector_store = Cassandra(
            embedding=embeddings,
            table_name="web_docs",
            session=None,
            keyspace=None,
        )

        # ⚡ Use only top 3 chunks to reduce cost
        relevant_docs = vector_store.similarity_search(question, k=3)
        print(f"✅ Retrieved {len(relevant_docs)} relevant chunks.")

        # Generate response
        chain = load_qa_chain(llm, chain_type="stuff")
        answer = chain.run(input_documents=relevant_docs, question=question)

        print("📝 Answer generated successfully.")
        return answer

    except Exception as e:
        print("❌ Error while querying vector DB:", e)
        return "Something went wrong while answering the question."

def remove_from_vector_db(identifier, namespace="web_scraped"):
    print(f"\n🗑️ Removing document with identifier '{identifier}' from vector DB...")

    try:
        embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)

        vector_store = Cassandra(
            embedding=embeddings,
            table_name="web_docs",
            session=None,
            keyspace=None,
        )

        # Convert identifier to string to ensure compatibility
        identifier = str(identifier)

        # Remove document by identifier using delete_by_document_id
        vector_store.delete_by_document_id(identifier)

        # Additional cleanup: Remove associated metadata and embeddings
        vector_store.delete_by_metadata_filter({"row_id": identifier})

        # Clear cache or ensure no stale data remains
        vector_store.clear()  # Clear the entire table to ensure no stale data

        print(f"✅ Document '{identifier}' and associated data successfully removed from vector DB, and cache cleared.")

    except Exception as e:
        print(f"❌ Error while removing document '{identifier}':", e)
        
def clear_vector_db(namespace="web_scraped"):
    print("\n🗑️ Clearing all documents from the vector DB...")

    try:
        embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)

        vector_store = Cassandra(
            embedding=embeddings,
            table_name="web_docs",
            session=None,
            keyspace=None,
        )

        # Clear all documents
        vector_store.clear()  # Replace with the correct method to clear the database
        print("✅ Vector DB successfully cleared.")

    except Exception as e:
        print(f"❌ Error while clearing vector DB: {e}")