# models.py
from django.contrib.auth.models import User
from django.db import models
import os

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

    category = models.ManyToManyField(ChatbotCategory, blank=True)
    subcategory = models.ManyToManyField(ChatbotSubCategory, blank=True)

    def __str__(self):
        return f"ChatLog #{self.pk}"


class Feedback(models.Model):
    chat_log = models.OneToOneField(ChatLog, on_delete=models.CASCADE)
    sales_user = models.ForeignKey(User, on_delete=models.CASCADE)
    correct_answer = models.TextField(blank=True, null=True)
    feedback_time = models.DateTimeField(auto_now=True)
    
class Files_upload(models.Model):
    file = models.FileField(upload_to='uploads/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{os.path.basename(self.file.name)} uploaded at {self.uploaded_at}"

class TextContent(models.Model):
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class ExcelFile(models.Model):
    file = models.FileField(upload_to='excel_files/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

class QAData(models.Model):
    question = models.TextField()
    answer = models.TextField()
    category = models.ManyToManyField(ChatbotCategory, blank=True)
    subcategory = models.ManyToManyField(ChatbotSubCategory, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class URLModel(models.Model):
    url = models.URLField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.url
