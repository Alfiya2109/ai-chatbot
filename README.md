# 🧠 Enterprise AI Chatbot & Document Management System (DMS)

> 🔗 **Live Chatbot Demo**: [https://iqra-ai-chatbot-aozl.vercel.app/login](https://iqra-ai-chatbot-aozl.vercel.app/login)  
> 📁 **Document Management Portal (DMS)**: [https://iqra-ai-chatbot-aozl.vercel.app/train](https://iqra-ai-chatbot-aozl.vercel.app/train)  
> 🔑 **Demo Login Credentials**: Username: `admin@gmail.com` &bull; Password: `admin123`

---

This enterprise-grade platform combines a conversational AI chatbot with a full Document Management System (DMS) and Vector Database training pipeline:

- 🤖 **Conversational AI & Semantic Search**: Multi-turn dialogue with LangChain, AstraDB vector embeddings, and OpenAI GPT synthesis.
- 📁 **Full-Stack Document Ingestion**: Ingests PDF, DOCX, XLSX, PPT, and Web URLs with automated parsing and chunking.
- 📊 **Intelligent Data Analytics**: Real-time analytical querying over spreadsheets with GPT-generated pandas code.

---

## 🚀 Features

- ✅ Upload and manage knowledge bases (PDF, DOCX, TXT, Q&A, Excel)
- ✅ Ask general questions based on uploaded content using semantic search (RAG)
- ✅ Ask analytical questions about Excel data (e.g., “What’s the average sales in Jan?”)
- ✅ GPT-generated pandas code to analyze Excel files in real-time
- ✅ Secure sandboxed code execution
- ✅ Excel metadata extraction for precise analysis
- ✅ Question-type classification and automatic routing
- ✅ Result formatting (text, tables, charts)
- ✅ Chat logs for every interaction

---

## 🏗️ Architecture Overview

```mermaid
flowchart TD
    A[User Uploads File or Asks Question] --> B{Is it a question?}
    B -->|No| C[Store Metadata (ExcelMetadata)]
    B -->|Yes| D[classify_question_type()]
    D -->|Analytical| E[Match Excel File + Generate Pandas Code via GPT]
    D -->|General| F[Query Vector DB + Generate Answer via GPT]
    E --> G[Execute Pandas Code Securely]
    G --> H[Return Answer/Table/Chart]
    F --> H
