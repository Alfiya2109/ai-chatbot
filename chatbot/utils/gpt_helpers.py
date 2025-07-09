import base64
import io
import pandas as pd

def format_analysis_result(result):
    print(f"[DEBUG] format_analysis_result called with type: {type(result)}")
    """
    Formats the analysis result for display:
    - If number: return as plain text
    - If DataFrame/Series: summarize as a short, user-friendly answer
    - If matplotlib plot: return base64 PNG string
    - Otherwise: string representation
    """
    # Number (int, float)
    if isinstance(result, (int, float)):
        answer = str(result)
        print(f"[DEBUG] Returning numeric answer: {answer}")
        return answer
    # Pandas DataFrame
    if isinstance(result, pd.DataFrame):
        # If single value, summarize
        if result.size == 1:
            value = result.values[0][0]
            answer = f"The answer is {value}."
            print(f"[DEBUG] Returning single-value DataFrame answer: {answer}")
            return answer
        # If single row, summarize
        if len(result) == 1:
            row = result.iloc[0]
            summary = ', '.join([f"{col}: {row[col]}" for col in result.columns])
            answer = f"The answer is: {summary}."
            print(f"[DEBUG] Returning single-row DataFrame answer: {answer}")
            return answer
        # If single column, summarize
        if len(result.columns) == 1:
            col = result.columns[0]
            total = result[col].sum() if pd.api.types.is_numeric_dtype(result[col]) else None
            if total is not None:
                answer = f"The total {col} is {total}."
                print(f"[DEBUG] Returning single-column DataFrame sum answer: {answer}")
                return answer
        # Otherwise, return the table as HTML (limit to 50 rows for safety)
        answer = result.head(50).to_html(index=False)
        print(f"[DEBUG] Returning DataFrame as HTML table with up to 50 rows.")
        return answer
    # Pandas Series
    if isinstance(result, pd.Series):
        if result.size == 1:
            value = result.iloc[0]
            answer = f"The answer is {value}."
            print(f"[DEBUG] Returning single-value Series answer: {answer}")
            return answer
        # If numeric, sum
        if pd.api.types.is_numeric_dtype(result):
            total = result.sum()
            answer = f"The total is {total}."
            print(f"[DEBUG] Returning Series sum answer: {answer}")
            return answer
        # Otherwise, list first few values
        answer = f"The result is: {result.head(3).to_list()} (showing up to 3 values)."
        print(f"[DEBUG] Returning Series head summary: {answer}")
        return answer
    # Matplotlib Figure
    try:
        import matplotlib.pyplot as plt
        from matplotlib.figure import Figure
        if isinstance(result, plt.Figure) or (hasattr(result, '__class__') and result.__class__.__name__ == 'Figure'):
            buf = io.BytesIO()
            result.savefig(buf, format='png')
            buf.seek(0)
            img_base64 = base64.b64encode(buf.read()).decode('utf-8')
            answer = f"data:image/png;base64,{img_base64}"
            print(f"[DEBUG] Returning matplotlib image answer.")
            return answer
    except ImportError:
        pass
    # Fallback: string representation
    answer = str(result)
    print(f"[DEBUG] Returning fallback string answer: {answer}")
    return answer

import os
from openai import OpenAI

def classify_question_type(question: str) -> str:
    print(f"[DEBUG] classify_question_type called with question: {question}")
    """
    Classifies a question as 'general' or 'analytical' using OpenAI Chat API.
    Args:
        question (str): The question to classify.
    Returns:
        str: 'general' or 'analytical'
    """
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        raise RuntimeError('OPENAI_API_KEY environment variable not set')
    client = OpenAI(api_key=api_key)
    prompt = (
        "Classify the following question as 'general' or 'analytical'. "
        "Respond with only one word: 'general' or 'analytical'.\n"
        f"Question: {question}"
    )
    try:
        print("[DEBUG] Sending classification request to OpenAI API...")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that classifies questions."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1,
            temperature=0
        )
        answer = response.choices[0].message.content.strip().lower()
        print(f"[DEBUG] OpenAI classification response: {answer}")
        # Accept partial responses like 'anal' or 'gen' as well
        if answer.startswith("anal"):
            return "analytical"
        if answer.startswith("gen"):
            return "general"
        if answer in ("general", "analytical"):
            return answer
        # fallback: try to extract from response
        if "general" in answer:
            return "general"
        if "analytical" in answer or "anal" in answer:
            return "analytical"
        return "general"  # default fallback
    except Exception as e:
        print(f"[DEBUG] Error in classify_question_type: {e}")
        return "general"

def generate_analysis_code(question, metadata):
    print(f"[DEBUG] generate_analysis_code called with question: {question} and metadata keys: {list(metadata.keys())}")
    """
    Generates Python pandas code to answer the question using the provided Excel metadata.
    Args:
        question (str): The user's analytical question.
        metadata (dict): Excel metadata with keys: columns, data_types, sample_rows, etc.
    Returns:
        str: Generated Python code as a string.
    """
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        raise RuntimeError('OPENAI_API_KEY environment variable not set')
    client = OpenAI(api_key=api_key)
    # Prepare prompt
    prompt = (
        "You are a Python data analyst. The Excel data is already loaded in a pandas DataFrame called df. "
        "Do not use pd.read_excel or import any modules. Only use the provided df to answer the user's question. "
        "Use only the columns listed below. Do not invent or guess column names. If a column is not present, do not use it.\n"
        "Always assign your answer to a variable called result.\n"
        "- If the answer is a value, result = <value>\n"
        "- If the answer is a table, result = <DataFrame>\n"
        "- If the answer is a plot, result = <figure>\n"
        "Do not print or return anything else. Only return the code, do not include explanations.\n"
        f"Columns: {metadata.get('columns')}\n"
        f"Data types: {metadata.get('data_types')}\n"
        f"Sample rows: {metadata.get('sample_rows')}\n"
        f"Question: {question}"
    )
    try:
        print("[DEBUG] Sending code generation request to OpenAI API...",
        f"Columns: {metadata.get('columns')}\n",
        f"Data types: {metadata.get('data_types')}\n",
        f"Sample rows: {metadata.get('sample_rows')}\n",
        f"Question: {question}")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that writes pandas code for data analysis."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=512,
            temperature=0.2
        )
        code = response.choices[0].message.content.strip()
        print(f"[DEBUG] OpenAI code generation response: {code[:100]}...")
        return code
    except Exception as e:
        print(f"[DEBUG] Error in generate_analysis_code: {e}")
        return f"# Error generating code: {e}"