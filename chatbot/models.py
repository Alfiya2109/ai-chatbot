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

class ChatLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    question = models.TextField()
    gpt_answer = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_correct = models.BooleanField(null=True, blank=True)  #

class Feedback(models.Model):
    chat_log = models.OneToOneField(ChatLog, on_delete=models.CASCADE)
    sales_user = models.ForeignKey(User, on_delete=models.CASCADE)
    correct_answer = models.TextField(blank=True, null=True)
    feedback_time = models.DateTimeField(auto_now=True)
