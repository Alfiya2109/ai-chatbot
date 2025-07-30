#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'web_chatbot.settings')
django.setup()

# Now import and run the function
from chatbot.utils.show_all_data import show_all_data

if __name__ == "__main__":
    show_all_data()
