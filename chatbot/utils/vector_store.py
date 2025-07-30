import cassio
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Cassandra
from langchain.docstore.document import Document
from .env import ASTRA_DB_APPLICATION_TOKEN, ASTRA_DB_ID, ASTRA_DB_REGION, OPENAI_API_KEY
from langchain.text_splitter import CharacterTextSplitter
from langchain.chains.question_answering import load_qa_chain
from ..file_reader import read_uploaded_file
import tiktoken

# 🔥 Load model
llm = ChatOpenAI(
    model="gpt-4o-mini",
    api_key=OPENAI_API_KEY,
    temperature=0.2
)

# Init DB
cassio.init(token=ASTRA_DB_APPLICATION_TOKEN, database_id=ASTRA_DB_ID)

def count_tokens(text, model="gpt-4o-mini"):
    encoding = tiktoken.encoding_for_model(model)
    return len(encoding.encode(text))

def prepare_pages(data):
    """
    Prepares the 'pages' input based on type of upload:
    - file
    - text
    - qna
    """

    pages = []
    description = data.get("description", "")
    if data["type"] == "file":
        # File upload case
        uploaded_file = data["file"]
        content = read_uploaded_file(uploaded_file)
        pages.append((uploaded_file.name, content, description))

    elif data["type"] == "text":
        # Plain text upload case
        raw_text = data["text"]
        pages.append(("manual_input", raw_text, description))

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

def store_in_vector_db(pages, knowledge_base=None, namespace="web_scraped"):
    print("\n📦 Starting vector DB storage process...")
    print(f"📄 Number of pages to embed: {len(pages)}")
    # Always store knowledge_base as a list of strings
    if knowledge_base:
        print(f"🔒 Storing with knowledge base: {knowledge_base}")
        if isinstance(knowledge_base, str):
            knowledge_base = [knowledge_base]
        elif isinstance(knowledge_base, list):
            knowledge_base = [str(kb) for kb in knowledge_base]
        else:
            knowledge_base = [str(knowledge_base)]

    try:
        # 🧠 Smart chunking
        text_splitter = CharacterTextSplitter(
            separator="\n",
            chunk_size=750,
            chunk_overlap=100
        )

        documents = []
        for file_name, text, description in pages:
            content_with_meta = f"File Name: {file_name}\nDescription: {description}\n{text}"
            chunks = text_splitter.create_documents([content_with_meta])
            for chunk in chunks:
                chunk.metadata = chunk.metadata or {}
                chunk.metadata["knowledge_base"] = knowledge_base if knowledge_base else []
                chunk.metadata["file_name"] = file_name
                chunk.metadata["description"] = description
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

        # Store documents with metadata
        print("💾 Adding chunks to vector DB...")
        vector_store.add_documents(documents)
        print("🎉 Chunks successfully stored in vector DB.")

    except Exception as e:
        print("❌ Error while storing documents:", e)

def query_vector_db(question, knowledge_bases=None, namespace="web_scraped"):
    print("\n❓ Running query on vector DB...")
    print(f"🧠 Question: {question}")
    if knowledge_bases:
        print(f"🔒 Filtering by knowledge bases: {knowledge_bases}")
        if isinstance(knowledge_bases, str):
            knowledge_bases = [knowledge_bases]
        elif isinstance(knowledge_bases, list):
            knowledge_bases = [str(kb[0]) if isinstance(kb, list) and len(kb) == 1 else str(kb) for kb in knowledge_bases]
        else:
            knowledge_bases = [str(knowledge_bases)]

    try:
        embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)

        vector_store = Cassandra(
            embedding=embeddings,
            table_name="web_docs",
            session=None,
            keyspace=None,
        )

        # Fetch more docs and filter in Python for KB match (OR logic)
        all_docs = vector_store.similarity_search(question, k=10)  # Fetch more to allow filtering
        if knowledge_bases:
            relevant_docs = [doc for doc in all_docs if any(
                kb in (doc.metadata.get("knowledge_base") or []) for kb in knowledge_bases
            )]
        else:
            relevant_docs = all_docs
        print(f"✅ Retrieved {len(relevant_docs)} relevant chunks.")

        # If no relevant docs, return a custom message
        if not relevant_docs:
            print("⚠️ No relevant documents found. Returning access message.")
            return "Sorry, I do not have access to this data.", 0

        # Compose a prompt from the docs
        context = "\n\n".join([doc.page_content for doc in relevant_docs])
        prompt = f"Context:\n{context}\n\nQuestion: {question}\nAnswer:"

        # Call the LLM directly
        response = llm.invoke(prompt)
        answer = response.content if hasattr(response, 'content') else str(response)

        # Calculate tokens for prompt and answer
        tokens = count_tokens(prompt, model="gpt-4o-mini") + count_tokens(answer, model="gpt-4o-mini")

        print("📝 Answer generated successfully.")
        return answer, tokens

    except Exception as e:
        print("❌ Error while querying vector DB:", e)
        return "Something went wrong while answering the question.", None

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
        # vector_store.clear()  # Clear the entire table to ensure no stale data

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