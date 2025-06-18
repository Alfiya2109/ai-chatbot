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
    Profile,  # <-- import Profile
    KnowledgeBase,
)
from .models import ChatSession, SitemapFetch, GoogleDriveFileData,GoogleDriveDocumentFileData,GoogleDriveExcelFileData

# ---------------------------
# Auth Serializers
# ---------------------------

from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile
from rest_framework_simplejwt.tokens import RefreshToken

class UserRegisterSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(write_only=True)
    profile = serializers.PrimaryKeyRelatedField(queryset=Profile.objects.all(), required=False, allow_null=True, write_only=True)
    knowledge_bases = serializers.PrimaryKeyRelatedField(queryset=KnowledgeBase.objects.all(), many=True, required=False, write_only=True)
    tokens       = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'username', 'password',
            'first_name', 'last_name',
            'email',
            'phone_number',
            'profile',
            'knowledge_bases',
            'tokens'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'email':    {'required': True},
        }

    def create(self, validated_data):
        phone = validated_data.pop('phone_number')
        profile = validated_data.pop('profile', None)
        knowledge_bases = validated_data.pop('knowledge_bases', [])
        # create_user will hash the password
        user  = User.objects.create_user(**validated_data)
        if not profile:
            profile = Profile.objects.first()
        user_profile = UserProfile.objects.create(user=user, phone_number=phone, profile=profile)
        if knowledge_bases:
            user_profile.knowledge_bases.set(knowledge_bases)
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
    category = serializers.PrimaryKeyRelatedField(queryset=ChatbotCategory.objects.all())

    class Meta:
        model = ChatbotSubCategory
        fields = ['id', 'name', 'category']

class ChatbotCategorySerializer(serializers.ModelSerializer):
    subcategories = ChatbotSubCategorySerializer(many=True, read_only=True)

    class Meta:
        model = ChatbotCategory
        fields = ['id', 'name', 'subcategories']

class ChatLogSerializer(serializers.ModelSerializer):
    # Display category and subcategory names
    category = serializers.SlugRelatedField(many=True, read_only=True, slug_field='name')
    subcategory = serializers.SlugRelatedField(many=True, read_only=True, slug_field='name')
    
    # Include feedback
    feedback = serializers.SerializerMethodField()

    # Replace user field with custom representation
    user = serializers.SerializerMethodField()

    # Replace session with title
    session_title = serializers.CharField(source='session.title', read_only=True)

    # Add tokens field
    tokens = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = ChatLog
        fields = [
            'id', 'user', 'session', 'session_title', 'is_correct',
            'question', 'gpt_answer', 'timestamp',
            'category', 'subcategory', 'feedback', 'tokens'
        ]
        read_only_fields = ['user', 'timestamp', 'session_title']

    def get_user(self, obj):
        if obj.user:
            return {
                "first_name": obj.user.first_name,
                "last_name": obj.user.last_name
            }
        return None

    def get_feedback(self, obj):
        try:
            feedback = Feedback.objects.get(chat_log=obj)
            return FeedbackSerializer(feedback).data
        except Feedback.DoesNotExist:
            return None
        
    def create(self, validated_data):
        return super().create(validated_data)
    
    

        
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
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    added_by = serializers.SlugRelatedField(slug_field='username', queryset=User.objects.all(), required=False, allow_null=True)
    updated_by = serializers.SlugRelatedField(slug_field='username', queryset=User.objects.all(), required=False, allow_null=True)
    knowledge_bases = serializers.SlugRelatedField(many=True, slug_field='name', queryset=KnowledgeBase.objects.all())

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
    added_by = serializers.SlugRelatedField(slug_field='username', queryset=User.objects.all(), required=False, allow_null=True)
    updated_by = serializers.SlugRelatedField(slug_field='username', queryset=User.objects.all(), required=False, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    knowledge_bases = serializers.SlugRelatedField(many=True, slug_field='name', queryset=KnowledgeBase.objects.all())
    class Meta:
        model = TextContent
        fields = '__all__'

from chatbot.models import ExcelFile
class ExcelFileSerializer(serializers.ModelSerializer):
    added_by = serializers.SlugRelatedField(slug_field='username', queryset=User.objects.all(), required=False, allow_null=True)
    updated_by = serializers.SlugRelatedField(slug_field='username', queryset=User.objects.all(), required=False, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    knowledge_bases = serializers.SlugRelatedField(many=True, slug_field='name', queryset=KnowledgeBase.objects.all())
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
    added_by = serializers.SlugRelatedField(slug_field='username', queryset=User.objects.all(), required=False, allow_null=True)
    updated_by = serializers.SlugRelatedField(slug_field='username', queryset=User.objects.all(), required=False, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    knowledge_bases = serializers.SlugRelatedField(many=True, slug_field='name', queryset=KnowledgeBase.objects.all())
    category = serializers.SlugRelatedField(many=True, slug_field='name', read_only=True)
    subcategory = serializers.SlugRelatedField(many=True, slug_field='name', read_only=True)
    class Meta:
        model = QAData
        fields = '__all__'

from chatbot.models import URLModel
class URLModelSerializer(serializers.ModelSerializer):
    added_by = serializers.SlugRelatedField(slug_field='username', queryset=User.objects.all(), required=False, allow_null=True)
    updated_by = serializers.SlugRelatedField(slug_field='username', queryset=User.objects.all(), required=False, allow_null=True)
    knowledge_bases = serializers.SlugRelatedField(many=True, slug_field='name', queryset=KnowledgeBase.objects.all())
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    class Meta:
        model = URLModel
        fields = '__all__'

#chathistory
from chatbot.models import ChatSession

class ChatSessionSerializer(serializers.ModelSerializer):
    chat_logs = ChatLogSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'created_at', 'chat_logs']

#userDetails

# serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    email = serializers.EmailField(source='user.email')
    created_at = serializers.DateTimeField(source='user.date_joined')  # User creation date
    phone_number = serializers.CharField()
    profile = serializers.PrimaryKeyRelatedField(queryset=Profile.objects.all(), allow_null=True)
    profile_name = serializers.CharField(source='profile.name', read_only=True)
    knowledge_bases = serializers.SerializerMethodField()
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    userprofile_id = serializers.IntegerField(source='id', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['userprofile_id', 'user_id', 'first_name', 'last_name', 'phone_number', 'email', 'created_at', 'profile', 'profile_name', 'knowledge_bases']

    def get_knowledge_bases(self, obj):
        return [{'id': kb.id, 'name': kb.name} for kb in obj.knowledge_bases.all()]

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = '__all__'

class KnowledgeBaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeBase
        fields = '__all__'

# Folder Upload Serializer
from .models import FileData, DocumentFileData, ExcelFileData

class DocumentFileDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentFileData
        fields = ['id', 'file', 'uploaded_at']

class ExcelFileDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExcelFileData
        fields = ['id', 'file', 'uploaded_at']

class FileDataSerializer(serializers.ModelSerializer):
    document_files = DocumentFileDataSerializer(many=True, read_only=True)
    excel_files = ExcelFileDataSerializer(many=True, read_only=True)
    knowledge_bases = serializers.PrimaryKeyRelatedField(queryset=KnowledgeBase.objects.all(), many=True, required=False)
    knowledge_bases_info = KnowledgeBaseSerializer(source='knowledge_bases', many=True, read_only=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    added_by = serializers.SlugRelatedField(slug_field='username', read_only=True)

    class Meta:
        model = FileData
        fields = ['id', 'title', 'description', 'knowledge_bases', 'knowledge_bases_info', 'created_at', 'added_by', 'document_files', 'excel_files']

class SitemapFetchSerializer(serializers.ModelSerializer):
    class Meta:
        model = SitemapFetch
        fields = ['id', 'url', 'fetched_at', 'urls', 'status', 'error']

class GoogleDriveFileDataSerializer(serializers.ModelSerializer):
    knowledge_bases = serializers.SerializerMethodField()

    class Meta:
        model = GoogleDriveFileData
        fields = [
            'id', 'file_id', 'file_name', 'mime_type', 'description',
            'knowledge_bases', 'added_by', 'uploaded_at', 'relative_path'  # <-- Add here
        ]

    def get_knowledge_bases(self, obj):
        return [kb.name for kb in obj.knowledge_bases.all()]

class GoogleDriveDocumentFileDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoogleDriveDocumentFileData
        fields = ['id', 'file_id', 'file_name', 'mime_type', 'file_data', 'uploaded_at']

class GoogleDriveExcelFileDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoogleDriveExcelFileData
        fields = ['id', 'file_id', 'file_name', 'mime_type', 'file_data', 'uploaded_at']

