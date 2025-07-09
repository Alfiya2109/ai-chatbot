
# Windows-compatible version (no signal/alarm):
import pandas as pd
import sys
import io
import threading

class TimeoutException(Exception):
    pass

def _exec_code_with_timeout(code, global_vars, local_vars, output_holder, exception_holder):
    try:
        # If the code is a single expression, evaluate and store as 'result'
        code_lines = [line.strip() for line in code.strip().split('\n') if line.strip()]
        if len(code_lines) == 1 and not code_lines[0].startswith(('def ', 'class ', 'for ', 'while ', 'if ', 'with ', 'import ', 'from ', '#')) and '=' not in code_lines[0]:
            local_vars['result'] = eval(code_lines[0], global_vars, local_vars)
        else:
            exec(code, global_vars, local_vars)
    except Exception as e:
        exception_holder.append(e)

def execute_pandas_code(code: str, dataframe: pd.DataFrame, timeout: float = 3.0):
    print(f"[DEBUG] execute_pandas_code called with code: {code[:100]}... and DataFrame shape: {dataframe.shape}")
    """
    Executes GPT-generated pandas code safely on a given DataFrame.
    Restricts builtins, disables dangerous modules, and enforces a timeout (Windows compatible).
    Returns printed output or resulting DataFrame.
    """
    safe_builtins = {
        'abs': abs, 'min': min, 'max': max, 'sum': sum, 'len': len, 'range': range,
        'enumerate': enumerate, 'zip': zip, 'list': list, 'dict': dict, 'set': set, 'tuple': tuple,
        'float': float, 'int': int, 'str': str, 'print': print, 'map': map, 'filter': filter,
        'any': any, 'all': all, 'sorted': sorted, 'reversed': reversed, 'isinstance': isinstance,
        'type': type, 'next': next, 'round': round
    }
    local_vars = {'df': dataframe.copy()}
    global_vars = {'__builtins__': safe_builtins, 'pd': pd}
    old_stdout = sys.stdout
    sys.stdout = mystdout = io.StringIO()
    output_holder = []
    exception_holder = []
    print("[DEBUG] Starting code execution thread...")
    thread = threading.Thread(target=_exec_code_with_timeout, args=(code, global_vars, local_vars, output_holder, exception_holder))
    thread.start()
    thread.join(timeout)
    print("[DEBUG] Code execution thread finished.")
    sys.stdout = old_stdout
    if thread.is_alive():
        print("[DEBUG] Timeout: Code execution exceeded time limit.")
        return "Timeout: Code execution exceeded time limit."
    if exception_holder:
        print(f"[DEBUG] Exception during code execution: {exception_holder[0]}")
        return f"Error: {exception_holder[0]}"
    output = mystdout.getvalue().strip()
    # Try to get the value of the last expression if not assigned to 'result'
    if 'result' in local_vars:
        print("[DEBUG] Returning 'result' from executed code.")
        return local_vars['result']
    # Always try to evaluate the last line as an expression if not assignment
    try:
        code_lines = [line.strip() for line in code.strip().split('\n') if line.strip()]
        if code_lines:
            last_line = code_lines[-1]
            if not last_line.startswith(('def ', 'class ', 'for ', 'while ', 'if ', 'with ', 'import ', 'from ', '#')) and '=' not in last_line:
                print(f"[DEBUG] Fallback: Evaluating last expression after exec: {last_line}")
                value = eval(last_line, global_vars, local_vars)
                print(f"[DEBUG] Fallback: Returning value of last expression: {value}")
                return value
    except Exception as e:
        print(f"[DEBUG] Could not evaluate last expression (fallback): {e}")
    if 'df' in local_vars:
        print("[DEBUG] Returning 'df' from executed code.")
        return local_vars['df']
    print(f"[DEBUG] Returning output from executed code: {output[:100]}...")
    return output
