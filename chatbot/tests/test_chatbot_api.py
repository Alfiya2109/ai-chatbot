import openpyxl
import requests

def test_ask_api():
    # Load the Excel file
    workbook = openpyxl.load_workbook('Chatbot Test Data.xlsx')
    sheet = workbook.active

    # Iterate through each row in the Excel file
    for row in sheet.iter_rows(min_row=2, values_only=True):
        question = row[1]  # Assuming the first column contains the questions

        # Make a POST request to the Ask API
        response = requests.post(
            'http://localhost:8000/api/ask/',
            json={"question": question},
            headers={"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzQ0ODQ5NjYyLCJpYXQiOjE3NDQ4NDI0NjIsImp0aSI6IjMwMmYxMWNlYWZkZjRjOWJiYWNmNTUwY2EyMWVhYjgyIiwidXNlcl9pZCI6Mn0.8UFvVq7Z_tB-IQJtje9lRKISbPYa0z00nVQTa_jfM10"}  # Replace with a valid token
        )

        # Print the question and response
        print(f"Question: {question}")
        print(f"Response: {response.json()}\n")

if __name__ == "__main__":
    test_ask_api()