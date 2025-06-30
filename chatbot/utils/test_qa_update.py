"""
Test script to verify Q&A PATCH API functionality
This script tests the Q&A update functionality to ensure vector DB synchronization works.
"""

import requests
import json

# Configuration
BASE_URL = "https://aichatbotbackend.iqratechnology.com"
API_ENDPOINT = f"{BASE_URL}/api/qa/"

def test_qa_update():
    """Test Q&A update functionality"""
    
    # Test data - you'll need to replace these with actual values from your system
    qa_id = 1  # Replace with an actual Q&A ID
    access_token = "your_access_token_here"  # Replace with actual token
    
    # Sample update data
    update_data = {
        "question": "What is the updated test question?",
        "answer": "This is the updated test answer.",
        "description": "Updated description for testing",
        "category": [1],  # Replace with actual category IDs
        "subcategory": [1],  # Replace with actual subcategory IDs
        "knowledge_bases": ["Test Knowledge Base"]  # Replace with actual KB names
    }
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        # Make PATCH request
        response = requests.patch(
            f"{API_ENDPOINT}{qa_id}/",
            json=update_data,
            headers=headers
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Q&A update successful!")
            return True
        else:
            print("❌ Q&A update failed!")
            return False
            
    except Exception as e:
        print(f"❌ Error during API call: {str(e)}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Q&A PATCH API...")
    test_qa_update()
