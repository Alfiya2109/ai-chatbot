import pandas as pd
import numpy as np
import datetime
from django.core.files.uploadedfile import UploadedFile

def extract_excel_metadata(file):
    print(f"[DEBUG] extract_excel_metadata called for file: {getattr(file, 'name', str(file))}")
    """
    Extracts metadata from an uploaded Excel file.
    Args:
        file: Django UploadedFile (request.FILES)
    Returns:
        dict: {
            "sheet_names": [...],
            "columns": {sheet: [...]},
            "data_types": {sheet: {column: dtype}},
            "sample_rows": {sheet: [...]},
            "row_count": {sheet: int}
        }
    """
    result = {
        "sheet_names": [],
        "columns": {},
        "data_types": {},
        "sample_rows": {},
        "row_count": {}
    }
    try:
        print("[DEBUG] Reading Excel file and extracting metadata...")
        # If file is Django UploadedFile, get file-like object
        if hasattr(file, 'open'):
            file.open('rb')
        excel = pd.read_excel(file, sheet_name=None)
        print(f"[DEBUG] Sheets found: {list(excel.keys())}")
        result["sheet_names"] = list(excel.keys())
        for sheet, df in excel.items():
            print(f"[DEBUG] Processing sheet: {sheet} with columns: {list(df.columns)}")
            result["columns"][sheet] = list(df.columns)
            # Convert dtypes to string for serialization
            result["data_types"][sheet] = {col: str(dtype) for col, dtype in df.dtypes.items()}
            # Convert sample rows to JSON-serializable format
            sample_rows = df.head(3).to_dict(orient="records")
            def make_json_serializable(obj):
                if isinstance(obj, (np.generic, np.ndarray)):
                    return obj.item() if hasattr(obj, 'item') else obj.tolist()
                if isinstance(obj, (datetime.datetime, datetime.date)):
                    return obj.isoformat()
                if hasattr(obj, 'to_pydatetime'):
                    return obj.to_pydatetime().isoformat()
                return obj
            for row in sample_rows:
                for k, v in row.items():
                    row[k] = make_json_serializable(v)
            result["sample_rows"][sheet] = sample_rows
            result["row_count"][sheet] = int(df.shape[0])

            # Store all unique values for key columns (for robust matching)
            key_columns = [col for col in df.columns if col.lower() in ["sales person", "customer name"]]
            result.setdefault("key_column_values", {})[sheet] = {}
            for col in key_columns:
                unique_vals = df[col].dropna().astype(str).str.strip().str.lower().unique().tolist()
                result["key_column_values"][sheet][col] = unique_vals
            print(f"[DEBUG] Key column values for {sheet}: {result['key_column_values'][sheet]}")
    except ValueError as e:
        print(f"[DEBUG] ValueError in extract_excel_metadata: {e}")
        result["error"] = str(e)
    except Exception as e:
        print(f"[DEBUG] Unexpected error in extract_excel_metadata: {e}")
        result["error"] = f"Unexpected error: {e}"
    finally:
        print("[DEBUG] extract_excel_metadata finished.")
        if hasattr(file, 'close'):
            try:
                file.close()
            except Exception:
                pass
    return result
