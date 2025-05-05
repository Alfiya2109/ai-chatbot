# serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import (
    UserProfile,
    Feedback,
    ChatLog,
    ChatbotCategory,
    ChatbotSubCategory,
)

# ---------------------------
# Auth Serializers
# ---------------------------

from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile
from rest_framework_simplejwt.tokens import RefreshToken

class UserRegisterSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(write_only=True)
    # make role write‑only so DRF won’t look for `user.role` on reads
    role         = serializers.ChoiceField(
                       choices=UserProfile.ROLE_CHOICES,
                       write_only=True
                   )
    tokens       = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'username', 'password',
            'first_name', 'last_name',
            'email',
            'phone_number', 'role',
            'tokens'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'email':    {'required': True},
        }

    def create(self, validated_data):
        phone = validated_data.pop('phone_number')
        role  = validated_data.pop('role')
        # create_user will hash the password
        user  = User.objects.create_user(**validated_data)
        # now attach your profile
        UserProfile.objects.create(user=user, phone_number=phone, role=role)
        return user

    def get_tokens(self, user):
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access':  str(refresh.access_token),
        }

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=255)
    password = serializers.CharField(max_length=128, write_only=True)
    tokens = serializers.SerializerMethodField()

    def validate(self, data):
        username = data.get("username", None)
        password = data.get("password", None)

        user = authenticate(username=username, password=password)

        if user is None:
            raise serializers.ValidationError(
                'A user with this username and password combination was not found.'
            )

        return {
            'username': user.username,
            'user': user
        }

    def get_tokens(self, obj):
        user = obj.get('user') if isinstance(obj, dict) else obj
        tokens = RefreshToken.for_user(user)
        return {
            'refresh': str(tokens),
            'access': str(tokens.access_token),
        }

# ---------------------------
# Feedback & ChatLog
# ---------------------------

class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = '__all__'


# ---------------------------
# Category & Subcategory
# ---------------------------

class ChatbotSubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatbotSubCategory
        fields = ['id', 'name']

class ChatbotCategorySerializer(serializers.ModelSerializer):
    subcategories = ChatbotSubCategorySerializer(many=True, read_only=True)

    class Meta:
        model = ChatbotCategory
        fields = ['id', 'name', 'subcategories']

class ChatLogSerializer(serializers.ModelSerializer):
    category = serializers.SlugRelatedField(many=True, read_only=True, slug_field='name')
    subcategory = serializers.SlugRelatedField(many=True, read_only=True, slug_field='name')

    feedback = serializers.SerializerMethodField()

    class Meta:
        model = ChatLog
        fields = [
            'id', 'user', 'is_correct', 'question', 'gpt_answer', 'timestamp',
            'category', 'subcategory', 'feedback'
        ]

    def get_feedback(self, obj):
        try:
            feedback = Feedback.objects.get(chat_log=obj)
            return FeedbackSerializer(feedback).data
        except Feedback.DoesNotExist:
            return None
        
# #categories

# class ChatbotCategorySerializer(serializers.ModelSerializer):
#     class Meta:
#         model = ChatbotCategory
#         fields = ['id', 'name']

# For Files Upload
import os
from chatbot.models import Files_upload
class FilesUploadSerializer(serializers.ModelSerializer):
    file = serializers.FileField(use_url=True)

    class Meta:
        model = Files_upload
        fields = '__all__'

    def validate_file(self, value):
        ext = os.path.splitext(value.name)[1].lower()
        allowed_extensions = ['.pdf', '.doc', '.docx', '.txt']
        if ext not in allowed_extensions:
            raise serializers.ValidationError('Only .pdf, .doc, .docx, and .txt files are allowed.')
        return value

from chatbot.models import TextContent
class TextContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TextContent
        fields = '__all__'

from chatbot.models import ExcelFile
class ExcelFileSerializer(serializers.ModelSerializer):
    def validate_file(self, value):
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in ['.csv', '.xls', '.xlsx']:
            raise serializers.ValidationError("Only .csv, .xls, .xlsx files are allowed.")
        return value

    class Meta:
        model = ExcelFile
        fields = '__all__'

from chatbot.models import QAData
class QADataSerializer(serializers.ModelSerializer):
    class Meta:
        model = QAData
        fields = '__all__'

