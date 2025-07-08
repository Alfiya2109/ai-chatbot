#!/usr/bin/env python3
"""
Test script to verify that text content updates are properly synchronized with the vector database.

This script will:
1. Create a text content item
2. Update the text content
3. Verify that the chatbot uses the updated content (not the old content)
4. Clean up the test data

Usage:
    python test_text_vectordb_sync.py

Make sure your Django server is running on http://127.0.0.1:8000
"""

import requests
import json
import time

# Configuration - Update these values for your setup
BASE_URL = "http://127.0.0.1:8000"
USERNAME = "admin"  # Replace with your admin username
PASSWORD = "admin"  # Replace with your admin password

def get_auth_token():
    """Get authentication token"""
    login_url = f"{BASE_URL}/api/login/"
    response = requests.post(login_url, json={
        'username': USERNAME,
        'password': PASSWORD
    })
    
    if response.status_code == 200:
        data = response.json()
        token = data.get('tokens', {}).get('access') or data.get('access_token') or data.get('token')
        return token
    else:
        print(f"❌ Login failed: {response.status_code} - {response.text}")
        return None

def test_text_content_vectordb_sync():
    """Test that text content updates are synchronized with vector database"""
    print("🔍 Testing Text Content Vector DB Synchronization...")
    print("=" * 60)
    
    # Get authentication token
    token = get_auth_token()
    if not token:
        return False
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Step 1: Create initial text content
    print("1️⃣ Creating initial text content...")
    text_data = {
        "content": "This is ORIGINAL content about vector database testing.",
        "description": "Test content for vector DB sync verification",
        "knowledge_bases": []  # You can add specific knowledge base IDs if needed
    }
    
    response = requests.post(f"{BASE_URL}/api/textcontent/", 
                           json=text_data, headers=headers)
    
    if response.status_code != 201:
        print(f"❌ Failed to create text content: {response.status_code} - {response.text}")
        return False
    
    text_item = response.json()
    text_id = text_item['id']
    print(f"✅ Created text content with ID: {text_id}")
    
    # Wait a moment for vector DB to process
    time.sleep(2)
    
    # Step 2: Test chatbot with original content
    print("2️⃣ Testing chatbot response with original content...")
    chat_response = test_chatbot_query("vector database testing", headers)
    print(f"Original response: {chat_response[:100]}...")
    
    # Step 3: Update the text content
    print("3️⃣ Updating text content...")
    updated_data = {
        "content": "This is UPDATED content about vector database testing with new information.",
        "description": "UPDATED test content for vector DB sync verification"
    }
    
    response = requests.patch(f"{BASE_URL}/api/textcontent/{text_id}/", 
                            json=updated_data, headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Failed to update text content: {response.status_code} - {response.text}")
        cleanup_text_content(text_id, headers)
        return False
    
    print(f"✅ Updated text content {text_id}")
    
    # Wait for vector DB to process the update
    time.sleep(3)
    
    # Step 4: Test chatbot with updated content
    print("4️⃣ Testing chatbot response with updated content...")
    updated_response = test_chatbot_query("vector database testing", headers)
    print(f"Updated response: {updated_response[:100]}...")
    
    # Step 5: Verify the update worked
    print("5️⃣ Verifying vector DB synchronization...")
    if "UPDATED" in updated_response and "ORIGINAL" not in updated_response:
        print("✅ SUCCESS: Vector DB sync is working! Chatbot uses updated content.")
        success = True
    elif "UPDATED" in updated_response and "ORIGINAL" in updated_response:
        print("⚠️  PARTIAL: Both old and new content found in response.")
        success = False
    elif "ORIGINAL" in updated_response:
        print("❌ FAILED: Vector DB sync not working. Chatbot still uses old content.")
        success = False
    else:
        print("❓ UNCLEAR: Neither original nor updated content clearly found in response.")
        print(f"Full response: {updated_response}")
        success = False
    
    # Step 6: Cleanup
    print("6️⃣ Cleaning up test data...")
    cleanup_text_content(text_id, headers)
    
    return success

def test_chatbot_query(query, headers):
    """Test chatbot with a query"""
    chat_url = f"{BASE_URL}/api/ask/"
    response = requests.post(chat_url, json={
        "question": query
    }, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        return data.get('answer', 'No answer received')
    else:
        return f"Error: {response.status_code}"

def cleanup_text_content(text_id, headers):
    """Clean up test text content"""
    response = requests.delete(f"{BASE_URL}/api/textcontent/{text_id}/", headers=headers)
    if response.status_code in [204, 200]:
        print(f"✅ Cleaned up text content {text_id}")
    else:
        print(f"⚠️  Failed to cleanup text content {text_id}: {response.status_code}")

if __name__ == "__main__":
    print("Text Content Vector Database Synchronization Test")
    print("=" * 50)
    print("This test verifies that text content updates are properly")
    print("synchronized with the vector database.")
    print()
    
    success = test_text_content_vectordb_sync()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 TEST PASSED: Vector DB synchronization is working!")
        print("Your text content updates will now be reflected in chatbot responses.")
    else:
        print("❌ TEST FAILED: Vector DB synchronization needs attention.")
        print("Check the server logs for any error messages.")
    
    exit(0 if success else 1)
