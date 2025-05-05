import pandas as pd
import PyPDF2
import docx

def read_pdf(file):
    pdf_reader = PyPDF2.PdfReader(file)
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text() or ""
    return text

def read_docx(file):
    doc = docx.Document(file)
    return "\n".join([para.text for para in doc.paragraphs])

def read_csv(file):
    df = pd.read_csv(file)
    return df.to_string(index=False)

def read_excel(file):
    df = pd.read_excel(file).fillna("")
    rows = []
    for _, row in df.iterrows():
        row_text = " | ".join(f"{col.strip()}: {str(row[col]).strip()}" for col in df.columns)
        rows.append(row_text)
    return "\n".join(rows)


def read_text(file):
    return file.read().decode('utf-8')

def read_uploaded_file(file):
    filename = file.name.lower()
    if filename.endswith('.pdf'):
        return read_pdf(file)
    elif filename.endswith('.docx'):
        return read_docx(file)
    elif filename.endswith('.csv'):
        return read_csv(file)
    elif filename.endswith(('.xls', '.xlsx')):
        return read_excel(file)
    elif filename.endswith('.txt'):
        return read_text(file)
    else:
        return "Unsupported file format."
