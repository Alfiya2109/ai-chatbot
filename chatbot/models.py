# models.py
from django.contrib.auth.models import User
from django.db import models
import os

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=15)

    # Login security
    failed_login_attempts = models.IntegerField(default=0)
    is_locked = models.BooleanField(default=False)
    lockout_time = models.DateTimeField(null=True, blank=True)

    # Access permissions
    files_access = models.BooleanField(default=False)
    text_access = models.BooleanField(default=False)
    excel_access = models.BooleanField(default=False)
    qna_access = models.BooleanField(default=False)
    url_access = models.BooleanField(default=False)
    chat_history_access = models.BooleanField(default=False)
    user_profile_access = models.BooleanField(default=False)
    user_details_access = models.BooleanField(default=False)
    profile = models.ForeignKey('Profile', on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    knowledge_bases = models.ManyToManyField('KnowledgeBase', blank=True, related_name='user_profiles')

    def __str__(self):
        return f"{self.user.username} - {self.profile.name if self.profile else 'No Profile'}"

    
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
    description = models.TextField(blank=True, null=True)  # New field
    
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # New field
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='files_uploaded')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='files_updated')  # New field
    knowledge_bases = models.ManyToManyField('KnowledgeBase', blank=True, related_name='files_documents')

    def __str__(self):
        return f"{os.path.basename(self.file.name)} uploaded at {self.uploaded_at}"

class TextContent(models.Model):
    content = models.TextField()
    description = models.TextField(blank=True, null=True)  # New field
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # New field
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='texts_uploaded')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='texts_updated')  # New field
    knowledge_bases = models.ManyToManyField('KnowledgeBase', blank=True, related_name='text_documents')

class ExcelFile(models.Model):
    file = models.FileField(upload_to='excel_files/')
    description = models.TextField(blank=True, null=True)  # New field
    
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # New field
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='excels_uploaded')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='excels_updated')  # New field
    knowledge_bases = models.ManyToManyField('KnowledgeBase', blank=True, related_name='excel_documents')

class QAData(models.Model):
    question = models.TextField()
    answer = models.TextField()
    description = models.TextField(blank=True, null=True)  # New field
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # New field
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='qadata_uploaded')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='qadata_updated')  # New field
    category = models.ManyToManyField(ChatbotCategory, blank=True)
    subcategory = models.ManyToManyField(ChatbotSubCategory, blank=True)
    knowledge_bases = models.ManyToManyField('KnowledgeBase', blank=True, related_name='qa_documents')

class URLModel(models.Model):
    url = models.URLField(max_length=500)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='urls_uploaded')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='urls_updated')
    knowledge_bases = models.ManyToManyField('KnowledgeBase', blank=True, related_name='url_documents')

    def __str__(self):
        return self.url

class Profile(models.Model):
    
    name = models.CharField(max_length=100, unique=True)
    files_access = models.BooleanField(default=False)
    text_access = models.BooleanField(default=False)
    excel_access = models.BooleanField(default=False)
    qna_access = models.BooleanField(default=False)
    url_access = models.BooleanField(default=False)
    chat_history_access = models.BooleanField(default=False)
    user_profile_access = models.BooleanField(default=False)
    user_details_access = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name}"

class KnowledgeBase(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name


# Folder Upload Model
from django.utils import timezone
class FileData(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    knowledge_bases = models.ManyToManyField('KnowledgeBase', blank=True, related_name='folder_files')
    created_at = models.DateTimeField(default=timezone.now)
    added_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='folders_uploaded')

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

class GoogleDriveFileData(models.Model):
    file_id = models.CharField(max_length=255)
    file_name = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    knowledge_bases = models.ManyToManyField('KnowledgeBase', blank=True)
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    relative_path = models.CharField(max_length=1024, blank=True, null=True)  # <-- Add this line

    def __str__(self):
        return self.file_name

class GoogleDriveDocumentFileData(models.Model):
    file_id = models.CharField(max_length=255)  # Google Drive file ID
    file_name = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=100, blank=True, null=True)
    file_data = models.ForeignKey(GoogleDriveFileData, on_delete=models.CASCADE, related_name='google_drive_document_files')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file_name

class GoogleDriveExcelFileData(models.Model):
    file_id = models.CharField(max_length=255)  # Google Drive file ID
    file_name = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=100, blank=True, null=True)
    file_data = models.ForeignKey(GoogleDriveFileData, on_delete=models.CASCADE, related_name='google_drive_excel_files')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file_name

class SitemapFetch(models.Model):
    url = models.URLField(unique=True)
    fetched_at = models.DateTimeField(auto_now_add=True)
    urls = models.JSONField(default=list)
    status = models.CharField(max_length=32, default='pending')
    error = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.url
