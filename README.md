# 🧠 AI Chatbot with Data Analytics & Document QA

This project is a Django-based AI chatbot that answers user queries using both:

- 🤖 **Context-aware semantic reasoning** (from uploaded documents/text/Q&A)
- 📊 **Intelligent data analysis** (from uploaded Excel files using GPT and pandas)

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
