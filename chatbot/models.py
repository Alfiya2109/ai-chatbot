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
    
#chatHistory

class ChatSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_sessions')
    title = models.CharField(max_length=255, default="New Chat", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.title}"

    def generate_title(self):
        first_log = self.chat_logs.order_by('timestamp').first()
        if first_log and first_log.question:
            return " ".join(first_log.question.strip().split()[:6]) + "..."
        return "New Chat"

    def save(self, *args, **kwargs):
        if not self.title or self.title.strip() == "New Chat":
            self.title = self.generate_title()
        super().save(*args, **kwargs)




class ChatLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='chat_logs', null=True, blank=True)
    question = models.TextField()
    gpt_answer = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_correct = models.BooleanField(null=True, blank=True)
    tokens = models.IntegerField(null=True, blank=True)

    category = models.ManyToManyField(ChatbotCategory, blank=True)
    subcategory = models.ManyToManyField(ChatbotSubCategory, blank=True)

    def __str__(self):
        return f"ChatLog #{self.pk}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)

        if self.session:
            if not self.session.title or self.session.title.strip() == "New Chat":
                self.session.title = self.session.generate_title()
                self.session.save()




class Feedback(models.Model):
    chat_log = models.OneToOneField(ChatLog, on_delete=models.CASCADE)
    sales_user = models.ForeignKey(User, on_delete=models.CASCADE)
    correct_answer = models.TextField(blank=True, null=True)
    feedback_time = models.DateTimeField(auto_now=True)
    
class Files_upload(models.Model):
    file = models.FileField(upload_to='uploads/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='files_uploaded')

    def __str__(self):
        return f"{os.path.basename(self.file.name)} uploaded at {self.uploaded_at}"

class TextContent(models.Model):
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='texts_uploaded')

class ExcelFile(models.Model):
    file = models.FileField(upload_to='excel_files/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='excels_uploaded')

class QAData(models.Model):
    question = models.TextField()
    answer = models.TextField()
    category = models.ManyToManyField(ChatbotCategory, blank=True)
    subcategory = models.ManyToManyField(ChatbotSubCategory, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='qadata_uploaded')

class URLModel(models.Model):
    url = models.URLField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='urls_uploaded')

    def __str__(self):
        return self.url

# Folder Upload Model
from django.utils import timezone
class FileData(models.Model):
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.title

class DocumentFileData(models.Model):
    file = models.FileField(upload_to='documents/')
    file_data = models.ForeignKey(FileData, on_delete=models.CASCADE, related_name='document_files')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return os.path.basename(self.file.name)

class ExcelFileData(models.Model):
    file = models.FileField(upload_to='excel/')
    file_data = models.ForeignKey(FileData, on_delete=models.CASCADE, related_name='excel_files')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return os.path.basename(self.file.name)

class SitemapFetch(models.Model):
    url = models.URLField(unique=True)
    fetched_at = models.DateTimeField(auto_now_add=True)
    urls = models.JSONField(default=list)
    status = models.CharField(max_length=32, default='pending')
    error = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.url