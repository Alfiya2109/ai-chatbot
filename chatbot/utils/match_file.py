import re
from difflib import get_close_matches
from chatbot.models import ExcelMetadata

def find_matching_excel_files(question: str):
    print(f"[DEBUG] find_matching_excel_files called with question: {question}")
    """
    Finds ExcelMetadata records where the question mentions any column names.
    Uses fuzzy match if exact match is not found.
    Returns a queryset or list of matching ExcelMetadata objects.
    """
    # Normalize question
    question_lower = question.lower()
    # Get all ExcelMetadata records
    all_metadata = ExcelMetadata.objects.all()
    print(f"[DEBUG] Total ExcelMetadata records: {all_metadata.count()}")
    matches = []
    for meta in all_metadata:
        print(f"[DEBUG] Checking ExcelMetadata: {meta.file_name}")
        columns = []
        # meta.columns is a dict: {sheet: [col1, col2, ...]}
        for sheet_cols in meta.columns.values():
            columns.extend(sheet_cols)
        columns_lower = [col.lower() for col in columns]
        # Only match by columns (not values)
        # If all required columns are present, consider it a match
        required_cols = []
        # Try to extract possible column names from the question (words that match any column)
        words = re.findall(r'\w+', question_lower)
        for col in columns_lower:
            for word in words:
                if word in col:
                    required_cols.append(col)
        # If at least 2 columns match, consider it a candidate (tune as needed)
        if len(required_cols) >= 2:
            matches.append(meta)
            print(f"[DEBUG] Matched by columns: {required_cols}")
    print(f"[DEBUG] Matched ExcelMetadata count: {len(matches)}")
    return matches
