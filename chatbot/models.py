# models.py
from django.contrib.auth.models import User
from django.db import models

class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('sales', 'Sales Team'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=15)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')

    def __str__(self):
        return f"{self.user.username} - {self.role}"
    
#categories


class ChatbotCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class ChatbotSubCategory(models.Model):
    category = models.ForeignKey(ChatbotCategory, related_name='subcategories', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name} ({self.category.name})"


class ChatLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    question = models.TextField()
    gpt_answer = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_correct = models.BooleanField(null=True, blank=True)
    category = models.ForeignKey(ChatbotCategory, on_delete=models.CASCADE, null=True)
    subcategory = models.ForeignKey(ChatbotSubCategory, on_delete=models.CASCADE, null=True, blank=True)  # <-- ADD THIS

    

class Feedback(models.Model):
    chat_log = models.OneToOneField(ChatLog, on_delete=models.CASCADE)
    sales_user = models.ForeignKey(User, on_delete=models.CASCADE)
    correct_answer = models.TextField(blank=True, null=True)
    feedback_time = models.DateTimeField(auto_now=True)
    


