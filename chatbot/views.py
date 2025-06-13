from rest_framework.views import APIView
from rest_framework.response import Response
from .utils.scraper import scrape_entire_website
from urllib.parse import urlparse
from .utils.vector_store import store_in_vector_db, query_vector_db, remove_from_vector_db, clear_vector_db
from .serializers import *
from django.contrib.auth.models import *
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.generics import UpdateAPIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser

from rest_framework import generics, filters, status
from django.db.models import Count
from .models import Feedback, URLModel, SitemapFetch
from django.views import View
from django.http import JsonResponse
from django.db import models
import subprocess
import os
import uuid
from django.utils import timezone
from django.core.mail import send_mail
from datetime import timedelta

class ChatLogListView(generics.ListCreateAPIView):
    queryset = ChatLog.objects.all().order_by('-timestamp')
    serializer_class = ChatLogSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['question', 'gpt_answer']
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by is_correct status
        status_filter = self.request.query_params.get('status')
        if status_filter == 'incorrect':
            queryset = queryset.filter(is_correct=False)
        elif status_filter == 'correct':
            queryset = queryset.filter(is_correct=True)
        elif status_filter == 'unreviewed':
            queryset = queryset.filter(is_correct__isnull=True)

        # Support multiple values for category (keep field name 'category')
        category_filter = self.request.query_params.getlist('category')
        if category_filter:
            queryset = queryset.filter(category__name__in=category_filter).distinct()

        # Support multiple values for subcategory (keep field name 'subcategory')
        subcategory_filter = self.request.query_params.getlist('subcategory')
        if subcategory_filter:
            queryset = queryset.filter(subcategory__name__in=subcategory_filter).distinct()

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

def get_queryset(self):
    queryset = super().get_queryset()

    # Filter by is_correct status
    status_filter = self.request.query_params.get('status')
    if status_filter == 'incorrect':
        queryset = queryset.filter(is_correct=False)
    elif status_filter == 'correct':
        queryset = queryset.filter(is_correct=True)
    elif status_filter == 'unreviewed':
        queryset = queryset.filter(is_correct__isnull=True)

    # Support multiple values for category (keep field name 'category')
    category_filter = self.request.query_params.getlist('category')
    if category_filter:
        queryset = queryset.filter(category__name__in=category_filter).distinct()

    # Support multiple values for subcategory (keep field name 'subcategory')
    subcategory_filter = self.request.query_params.getlist('subcategory')
    if subcategory_filter:
        queryset = queryset.filter(subcategory__name__in=subcategory_filter).distinct()

    return queryset


class CorrectAnswerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            chat_log = ChatLog.objects.get(pk=pk)
        except ChatLog.DoesNotExist:
            return Response({"error": "ChatLog not found"}, status=404)

        corrected_answer = request.data.get("correct_answer")
        is_correct = request.data.get("is_correct", None)

        if not corrected_answer:
            return Response({"error": "Corrected answer is required."}, status=400)

        # Update ChatLog's answer and is_correct field
        chat_log.gpt_answer = corrected_answer
        if is_correct is not None:
            chat_log.is_correct = is_correct
        chat_log.save()

        # Create or update the Feedback record
        feedback, created = Feedback.objects.update_or_create(
            chat_log=chat_log,
            defaults={
                "sales_user": request.user,
                "correct_answer": corrected_answer,
            }
        )

        return Response({
            "message": "Answer updated and feedback saved.",
            "corrected_answer": corrected_answer,
            "feedback_id": feedback.id,
            "chat_log_id": chat_log.id
        }, status=status.HTTP_200_OK)

class FeedbackSummaryView(View):
    def get(self, request):
        total = ChatLog.objects.count()
        correct = ChatLog.objects.filter(is_correct=True).count()
        incorrect = total - correct
        accuracy = (correct / total * 100) if total else 0

        return JsonResponse({
            "total_feedback": total,
            "correct_answers": correct,
            "incorrect_answers": incorrect,
            "accuracy_rate": f"{accuracy:.2f}%"
        })


class TopQuestionsView(View):
    def get(self, request):
        top_questions = (
            ChatLog.objects
            .values("question")
            .annotate(count=Count("id"))
            .order_by("-count")[:5]
        )
        return JsonResponse(list(top_questions), safe=False)

class AccuracyOverTimeView(View):
    def get(self, request):
        # Group feedback by date and calculate accuracy per day
        from django.db.models.functions import TruncDate

        grouped = (
            ChatLog.objects
            .annotate(date=TruncDate("timestamp"))
            .values("date")
            .annotate(
                total=Count("id"),
                correct=Count("id", filter=models.Q(is_correct=True))
            )
        )
        results = []
        for g in grouped:
            accuracy = (g['correct'] / g['total']) * 100 if g['total'] else 0
            results.append({"date": g['date'], "accuracy": round(accuracy, 2)})
        return JsonResponse(results, safe=False)

class UpdateFeedbackView(UpdateAPIView):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        feedback = self.get_object()

        # Allow updates only by the sales user who created the feedback
        if feedback.sales_user != request.user:
            return Response({"error": "Not authorized to update this feedback."}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(feedback, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class FeedbackCreateView(APIView):
    def post(self, request, pk):
        try:
            chat_log = ChatLog.objects.get(pk=pk)
        except ChatLog.DoesNotExist:
            return Response({'error': 'ChatLog not found'}, status=404)

        data = request.data.copy()
        data['chat_log'] = chat_log.id
        data['sales_user'] = request.user.id

        serializer = FeedbackSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class FeedbackUpsertView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            chat_log = ChatLog.objects.get(pk=pk)
        except ChatLog.DoesNotExist:
            return Response({'error': 'ChatLog not found'}, status=404)

        data = request.data.copy()
        data['chat_log'] = chat_log.id
        data['sales_user'] = request.user.id

        # Save feedback text
        feedback, created = Feedback.objects.update_or_create(
            chat_log=chat_log,
            defaults={
                'sales_user': request.user,
                'correct_answer': data.get('correct_answer', '')
            }
        )

        # Set ChatLog is_correct here
        if 'is_correct' in data:
            chat_log.is_correct = data['is_correct']
            chat_log.save()

        return Response({
            'message': 'Feedback processed successfully.',
            'feedback': FeedbackSerializer(feedback).data
        }, status=201 if created else 200)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens for the user
        refresh = RefreshToken.for_user(user)
        
        data = serializer.data
        data['tokens'] = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
        
        headers = self.get_success_headers(serializer.data)
        return Response(data, status=status.HTTP_201_CREATED, headers=headers)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        user = None
        user_profile = None
        try:
            user = User.objects.get(username=username)
            user_profile = UserProfile.objects.get(user=user)
        except (User.DoesNotExist, UserProfile.DoesNotExist):
            pass

        # Check lockout before authentication
        if user_profile:
            if user_profile.is_locked:
                now = timezone.now()
                if user_profile.lockout_time and now < user_profile.lockout_time + timedelta(hours=1):
                    return Response({'detail': 'Account is locked due to multiple failed login attempts. Please try again after 1 hour.'}, status=403)
                else:
                    # Unlock after 1 hour
                    user_profile.is_locked = False
                    user_profile.failed_login_attempts = 0
                    user_profile.lockout_time = None
                    user_profile.save()

        serializer = UserLoginSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            # Failed login
            if user_profile:
                user_profile.failed_login_attempts += 1
                if user_profile.failed_login_attempts >= 3:
                    user_profile.is_locked = True
                    user_profile.lockout_time = timezone.now()
                    user_profile.save()
                    # Send email notification
                    send_mail(
                        'Account Locked - AI Chatbot',
                        'Your account has been locked due to 3 consecutive failed login attempts. It will be unlocked automatically after 1 hour.',
                        'no-reply@yourdomain.com',
                        [user.email],
                        fail_silently=True,
                    )
                    return Response({'detail': 'Account is locked due to multiple failed login attempts. Please try again after 1 hour.'}, status=403)
                user_profile.save()
            return Response({'detail': 'Invalid username or password.'}, status=401)

        # Successful login
        if user_profile:
            user_profile.failed_login_attempts = 0
            user_profile.is_locked = False
            user_profile.lockout_time = None
            user_profile.save()
        user_data = serializer.validated_data
        user = user_data.get('user')
        try:
            user_profile = UserProfile.objects.get(user=user)
            profile_name = user_profile.profile.name if user_profile.profile else None
        except UserProfile.DoesNotExist:
            profile_name = None
        return Response({
            'username': user_data.get('username'),
            'profile': profile_name,
            'tokens': serializer.get_tokens(user)
        }, status=status.HTTP_200_OK)

class EmbedWebsiteAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        url = request.data.get("url")
        if not url:
            return Response({"error": "URL is required."}, status=400)
        
        pages = scrape_entire_website(url)
        store_in_vector_db(pages)
        return Response({"message": "Website embedded successfully."})

class AskWebsiteAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        question = request.data.get("question")
        session_id = request.data.get("session")  # Get session from request
        if not question:
            return Response({"error": "Question is required."}, status=400)

        # Get both answer and tokens from vector_store
        answer, tokens = query_vector_db(question)

        # Store the chat in ChatLog, including session if provided
        chatlog_kwargs = {
            'user': request.user,
            'question': question,
            'gpt_answer': answer,
            'tokens': tokens,
        }
        if session_id:
            chatlog_kwargs['session_id'] = session_id
        ChatLog.objects.create(**chatlog_kwargs)

        return Response({"answer": answer, "tokens": tokens})
    
#categories view
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import ChatbotCategory
from .serializers import ChatbotCategorySerializer

class ChatbotCategoryListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        categories = ChatbotCategory.objects.prefetch_related('subcategories').all()
        serializer = ChatbotCategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ChatbotCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChatbotSubCategoryListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        subcategories = ChatbotSubCategory.objects.all()
        serializer = ChatbotSubCategorySerializer(subcategories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ChatbotSubCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk=None):
        # PATCH /api/subcategories/<id>/
        subcategory_id = pk or request.data.get('id')
        if not subcategory_id:
            return Response({'error': 'Subcategory id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            subcategory = ChatbotSubCategory.objects.get(pk=subcategory_id)
        except ChatbotSubCategory.DoesNotExist:
            return Response({'error': 'Subcategory not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ChatbotSubCategorySerializer(subcategory, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


from .file_reader import read_uploaded_file


class UploadAndTrainAPIView(APIView):
    def post(self, request):
        input_type = request.data.get("type")  # "file", "text", "qna"
        pages = []

        try:
            if input_type == "file":
                uploaded_file = request.FILES.get("file")
                if not uploaded_file:
                    return Response({"error": "No file provided."}, status=400)

                content = read_uploaded_file(uploaded_file)
                pages = [(uploaded_file.name, content)]

            elif input_type == "text":
                raw_text = request.data.get("text", "")
                if not raw_text:
                    return Response({"error": "Text not provided."}, status=400)
                pages = [("manual_input", raw_text)]

            elif input_type == "qna":
                question = request.data.get("question")
                answer = request.data.get("answer")
                category = request.data.get("category", "general")
                subcategory = request.data.get("subcategory", "")
                if not question or not answer:
                    return Response({"error": "Q&A not provided."}, status=400)

                content = f"Category: {category}\nSubcategory: {subcategory}\nQ: {question}\nA: {answer}"
                pages = [("qna_input", content)]

            else:
                return Response({"error": "Invalid type."}, status=400)

            # Store in vector DB
            store_in_vector_db(pages)

            return Response({"message": "Trained successfully ✅"})

        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
# views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import ChatLog, ChatbotCategory

class UpdateChatLogCategoryByNameAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, chatlog_id):
        # Ensure the ChatLog exists
        try:
            chat_log = ChatLog.objects.get(id=chatlog_id)
        except ChatLog.DoesNotExist:
            return Response({"error": "ChatLog not found."}, status=status.HTTP_404_NOT_FOUND)

        # Fetch category names from the request
        category_names = request.data.get("category_names", [])
        if not isinstance(category_names, list):
            return Response({"error": "category_names must be a list of names."}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure categories exist in the database
        categories = ChatbotCategory.objects.filter(name__in=category_names)
        if categories.count() != len(category_names):
            return Response({"error": "Some categories not found."}, status=status.HTTP_400_BAD_REQUEST)

        # Assign selected categories to the ChatLog
        chat_log.category.set(categories)  # Replace existing categories
        chat_log.save()

        return Response({
            "message": "Categories updated successfully.",
            "chatlog_id": chat_log.id,
            "category_names": category_names
        }, status=status.HTTP_200_OK)

# views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import ChatLog, ChatbotSubCategory

class UpdateChatLogSubCategoryByNameAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, chatlog_id):
        # Ensure the ChatLog exists
        try:
            chat_log = ChatLog.objects.get(id=chatlog_id)
        except ChatLog.DoesNotExist:
            return Response({"error": "ChatLog not found."}, status=status.HTTP_404_NOT_FOUND)

        # Fetch subcategory names from the request
        subcategory_names = request.data.get("subcategory_names", [])
        if not isinstance(subcategory_names, list):
            return Response({"error": "subcategory_names must be a list of names."}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure subcategories exist in the database
        subcategories = ChatbotSubCategory.objects.filter(name__in=subcategory_names)
        if subcategories.count() != len(subcategory_names):
            return Response({"error": "Some subcategories not found."}, status=status.HTTP_400_BAD_REQUEST)

        # Assign selected subcategories to the ChatLog
        chat_log.subcategory.set(subcategories)  # Replace existing subcategories
        chat_log.save()

        return Response({
            "message": "Subcategories updated successfully.",
            "chatlog_id": chat_log.id,
            "subcategory_names": subcategory_names
        }, status=status.HTTP_200_OK)


# File Uploder
from chatbot.models import Files_upload
from chatbot.serializers import FilesUploadSerializer

class FileUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        files = Files_upload.objects.all()
        serializer = FilesUploadSerializer(files, many=True)
        data = serializer.data
        # Add username for each file
        for i, file in enumerate(files):
            data[i]['added_by'] = file.added_by.username if file.added_by else None
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        # Do NOT use request.data.copy() for file uploads!
        data = request.data  # Use the original, do not copy (avoids deepcopy error)
        # Always use the authenticated user
        user = request.user if request.user and request.user.is_authenticated else None
        serializer = FilesUploadSerializer(data=data)
        if serializer.is_valid():
            serializer.save(added_by=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk=None):
        try:
            file = Files_upload.objects.get(pk=pk)
            identifier = file.id  # Use a unique identifier for the file
            file.delete()
            try:
                remove_from_vector_db(identifier)  # Remove from vector DB
            except Exception as e:
                return Response({"error": f"Failed to remove from vector DB: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response({"message": "File deleted"}, status=status.HTTP_204_NO_CONTENT)
        except Files_upload.DoesNotExist:
            return Response({"error": "File not found"}, status=status.HTTP_404_NOT_FOUND)
        
class TextContentView(APIView):
    def get(self, request):
        texts = TextContent.objects.all()
        serializer = TextContentSerializer(texts, many=True)
        data = serializer.data
        for i, text in enumerate(texts):
            data[i]['added_by'] = text.added_by.username if text.added_by else None
        return Response(data)

    def post(self, request):
        data = request.data.copy()
        data.pop('added_by', None)
        user = request.user if request.user and request.user.is_authenticated else None
        serializer = TextContentSerializer(data=data)
        if serializer.is_valid():
            serializer.save(added_by=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        try:
            text = TextContent.objects.get(pk=pk)
            identifier = text.id  # Use a unique identifier for the text
            text.delete()
            try:
                remove_from_vector_db(identifier)  # Remove from vector DB
            except Exception as e:
                return Response({"error": f"Failed to remove from vector DB: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response({"message": "Text deleted"}, status=status.HTTP_204_NO_CONTENT)
        except TextContent.DoesNotExist:
            return Response({"error": "Text not found"}, status=status.HTTP_404_NOT_FOUND)      

class ExcelFileView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        files = ExcelFile.objects.all()
        serializer = ExcelFileSerializer(files, many=True)
        data = serializer.data
        for i, file in enumerate(files):
            data[i]['added_by'] = file.added_by.username if file.added_by else None
        return Response(data)

    def post(self, request):
        data = request.data.copy()
        data.pop('added_by', None)
        user = request.user if request.user and request.user.is_authenticated else None
        serializer = ExcelFileSerializer(data=data)
        if serializer.is_valid():
            serializer.save(added_by=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    def delete(self, request, pk=None):
        try:
            file = ExcelFile.objects.get(pk=pk)
            identifier = file.id  # Use a unique identifier for the Excel file
            file.delete()
            try:
                remove_from_vector_db(identifier)  # Remove from vector DB
            except Exception as e:
                return Response({"error": f"Failed to remove from vector DB: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response({"message": "File deleted"}, status=status.HTTP_204_NO_CONTENT)
        except ExcelFile.DoesNotExist:
            return Response({"error": "File not found"}, status=status.HTTP_404_NOT_FOUND)
     
class QADataView(APIView):
    def get(self, request):
        items = QAData.objects.all()
        serializer = QADataSerializer(items, many=True)
        data = serializer.data
        for i, item in enumerate(items):
            data[i]['added_by'] = item.added_by.username if item.added_by else None
        return Response(data)

    def post(self, request):
        data = request.data.copy()
        data.pop('added_by', None)
        user = request.user if request.user and request.user.is_authenticated else None
        serializer = QADataSerializer(data=data)
        if serializer.is_valid():
            serializer.save(added_by=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk=None):
        try:
            item = QAData.objects.get(pk=pk)
            identifier = item.id  # Use a unique identifier for the Q&A item
            item.delete()
            try:
                remove_from_vector_db(identifier)  # Remove from vector DB
            except Exception as e:
                return Response({"error": f"Failed to remove from vector DB: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response({"message": "Item deleted"}, status=status.HTTP_204_NO_CONTENT)
        except QAData.DoesNotExist:
            return Response({"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND)


class ClearVectorDBView(APIView):
    permission_classes = [IsAuthenticated]  # Restrict access to authenticated users

    def delete(self, request):
        try:
            clear_vector_db()
            return Response({"message": "Vector DB cleared successfully."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class URLManagementAPIView(APIView):
    def get(self, request):
        urls = URLModel.objects.all()
        serializer = URLModelSerializer(urls, many=True)
        data = serializer.data
        # Add username for added_by and updated_by
        for i, url in enumerate(urls):
            data[i]['added_by'] = url.added_by.username if url.added_by else None
            data[i]['updated_by'] = url.updated_by.username if url.updated_by else None
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user if request.user and request.user.is_authenticated else None
        data = request.data.copy()
        data['added_by'] = user.username if user else None
        serializer = URLModelSerializer(data=data)
        if serializer.is_valid():
            url_instance = serializer.save(added_by=user)
            return Response(URLModelSerializer(url_instance).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            url = URLModel.objects.get(pk=pk)
            identifier = str(url.id)
            url.delete()
            try:
                remove_from_vector_db(identifier)
            except Exception as e:
                return Response({"error": f"Failed to remove from vector DB: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response({"message": "URL deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
        except URLModel.DoesNotExist:
            return Response({"error": "URL not found."}, status=status.HTTP_404_NOT_FOUND)
        


 
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework import status
import os
 
from .apps import convert_to_wav, transcribe_audio_whisper
 
TEMP_DIR = os.path.join("media", "temp")
os.makedirs(TEMP_DIR, exist_ok=True)
 
class TranscribeAudioAPIView(APIView):
    parser_classes = [MultiPartParser]
 
    def post(self, request):
        audio_file = request.FILES.get("audio")
 
        if not audio_file:
            return Response({"error": "No audio file provided"}, status=400)
 
        temp_path = os.path.join(TEMP_DIR, audio_file.name)
 
        with open(temp_path, "wb") as f:
            for chunk in audio_file.chunks():
                f.write(chunk)
 
        try:
            wav_path = convert_to_wav(temp_path)
            transcript = transcribe_audio_whisper(wav_path)
 
            # Clean up
            os.remove(temp_path)
            if wav_path != temp_path:
                os.remove(wav_path)
 
            return Response({"transcript": transcript}, status=200)
 
        except Exception as e:
            return Response({"error": str(e)}, status=500)
 
         
       
#chathistory
from rest_framework import permissions, status

class ChatSessionListCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sessions = ChatSession.objects.filter(user=request.user).order_by('-created_at')
        serializer = ChatSessionSerializer(sessions, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ChatSessionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChatSessionRetrieveUpdateDestroyAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return ChatSession.objects.get(pk=pk, user=user)
        except ChatSession.DoesNotExist:
            return None

    def get(self, request, pk):
        session = self.get_object(pk, request.user)
        if not session:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ChatSessionSerializer(session)
        return Response(serializer.data)

    def put(self, request, pk):
        session = self.get_object(pk, request.user)
        if not session:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ChatSessionSerializer(session, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        session = self.get_object(pk, request.user)
        if not session:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ChatSessionSerializer(session, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        session = self.get_object(pk, request.user)
        if not session:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChatSessionAddMessageAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            session = ChatSession.objects.get(pk=pk, user=request.user)
        except ChatSession.DoesNotExist:
            return Response({"detail": "Chat session not found."}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data['session'] = session.pk
        serializer = ChatLogSerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#userdetails

class UserProfileListAPI(APIView):
    def get(self, request):
        user_profiles = UserProfile.objects.select_related('user').all()
        serializer = UserProfileSerializer(user_profiles, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

from rest_framework.decorators import api_view, permission_classes
import os
import openai
from openai import OpenAI

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def summarize_question(request):
    text = request.data.get('text', '').strip()
    if not text:
        return Response({'error': 'No text provided.'}, status=400)
    # Use OpenAI GPT to generate a session title (openai>=1.0.0)
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        return Response({'error': 'OpenAI API key not set.'}, status=500)
    client = OpenAI(api_key=api_key)
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that summarizes a user's first chat message into a short, clear session title (max 8 words)."},
                {"role": "user", "content": text}
            ],
            max_tokens=16,
            temperature=0.5,
        )
        summary = response.choices[0].message.content.strip()
    except Exception as e:
        return Response({'error': f'Failed to generate summary: {str(e)}'}, status=500)
    return Response({'summary': summary})

class ProfileListCreateAPI(generics.ListCreateAPIView):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = []  # Allow any user (including unauthenticated) to access

class ProfileRetrieveUpdateAPI(generics.RetrieveUpdateAPIView):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

from rest_framework.permissions import IsAuthenticated
from .models import UserProfile, Profile
from .serializers import UserProfileSerializer, ProfileSerializer

class CurrentUserProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_profile = None
        try:
            user_profile = UserProfile.objects.select_related('profile').get(user=request.user)
        except Exception:
            return Response({'error': 'UserProfile not found.'}, status=404)
        userprofile_data = UserProfileSerializer(user_profile).data
        profile_data = ProfileSerializer(user_profile.profile).data if user_profile.profile else None

        # Determine allowed tabs based on user_profile and profile permissions
        allowed_tabs = []
        # Check UserProfile fields
        if user_profile.files_access: allowed_tabs.append('Files')
        if user_profile.text_access: allowed_tabs.append('Text')
        if user_profile.excel_access: allowed_tabs.append('Excel/CSV')
        if user_profile.qna_access: allowed_tabs.append('Q&A')
        if user_profile.url_access: allowed_tabs.append('URL')
        if user_profile.chat_history_access: allowed_tabs.append('History')
        
        if user_profile.user_details_access: allowed_tabs.append('User Details')
        # Optionally, check Profile fields (if you want to merge both)
        if user_profile.profile:
            if user_profile.profile.files_access and 'Files' not in allowed_tabs: allowed_tabs.append('Files')
            if user_profile.profile.text_access and 'Text' not in allowed_tabs: allowed_tabs.append('Text')
            if user_profile.profile.excel_access and 'Excel/CSV' not in allowed_tabs: allowed_tabs.append('Excel/CSV')
            if user_profile.profile.qna_access and 'Q&A' not in allowed_tabs: allowed_tabs.append('Q&A')
            if user_profile.profile.url_access and 'URL' not in allowed_tabs: allowed_tabs.append('URL')
            if user_profile.profile.chat_history_access and 'History' not in allowed_tabs: allowed_tabs.append('History')
        # Remove 'Profile' from always-allowed tabs, only add if allowed
        allowed_tabs.append('Chatbot')  # Always allow Chatbot for navigation
        # Only add 'Profile' if user_profile_access is True in either userprofile or profile
        if (user_profile.user_profile_access or (user_profile.profile and getattr(user_profile.profile, 'user_profile_access', False))):
            allowed_tabs.append('Profile')

        return Response({
            'userprofile': userprofile_data,
            'profile': profile_data,
            'allowed_tabs': allowed_tabs
        }, status=200)

# Add to your urls.py:
# path('api/userprofiles/me/', CurrentUserProfileAPIView.as_view(), name='current-user-profile')

from .models import KnowledgeBase
from .serializers import KnowledgeBaseSerializer
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

class KnowledgeBaseListCreateAPIView(generics.ListCreateAPIView):
    queryset = KnowledgeBase.objects.all()
    serializer_class = KnowledgeBaseSerializer
    permission_classes = [IsAuthenticated]

class KnowledgeBaseRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = KnowledgeBase.objects.all()
    serializer_class = KnowledgeBaseSerializer
    permission_classes = [IsAuthenticated]
    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

class ChatbotCategoryDetailAPIView(APIView):
    permission_classes = [AllowAny]

    def get_object(self, pk):
        try:
            return ChatbotCategory.objects.get(pk=pk)
        except ChatbotCategory.DoesNotExist:
            return None

    def get(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ChatbotCategorySerializer(category)
        return Response(serializer.data)

    def put(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ChatbotCategorySerializer(category, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import UserProfile, Profile, KnowledgeBase
from .serializers import UserProfileSerializer

class UserProfileUpdateAPI(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            user_profile = UserProfile.objects.get(pk=pk)
        except UserProfile.DoesNotExist:
            return Response({'error': 'UserProfile not found'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        # Handle profile update
        profile_id = data.get('profile')
        if profile_id:
            try:
                profile = Profile.objects.get(pk=profile_id)
                user_profile.profile = profile
            except Profile.DoesNotExist:
                return Response({'error': 'Profile not found'}, status=status.HTTP_400_BAD_REQUEST)
        # Handle knowledge_bases update
        kb_ids = data.get('knowledge_bases', [])
        if isinstance(kb_ids, list):
            kbs = KnowledgeBase.objects.filter(id__in=kb_ids)
            user_profile.knowledge_bases.set(kbs)
        user_profile.save()
        serializer = UserProfileSerializer(user_profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

class JogetSSOLoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        if not username:
            return Response({'error': 'Username required'}, status=400)
        User = get_user_model()
        user, created = User.objects.get_or_create(username=username, defaults={"email": username})
        # Optionally set more user fields here if available from Joget
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'username': user.username,
            'created': created
        })


# Folder Upload View
DOC_EXTENSIONS = {'.pdf', '.doc', '.docx', '.txt'}
EXCEL_EXTENSIONS = {'.csv', '.xls', '.xlsx'}

def list_files_in_folder(folder_path):
    doc_files = []
    excel_files = []
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            full_path = os.path.join(root, file)
            if ext in DOC_EXTENSIONS:
                doc_files.append(full_path)
            elif ext in EXCEL_EXTENSIONS:
                excel_files.append(full_path)
    return {"doc_files": doc_files, "excel_files": excel_files}

from rest_framework import viewsets, status
from django.core.files import File
import shutil
import requests
from bs4 import BeautifulSoup

class FileDataViewSet(viewsets.ModelViewSet):
    queryset = FileData.objects.all()
    serializer_class = FileDataSerializer
    parser_classes = (MultiPartParser, FormParser)

    def create(self, request, *args, **kwargs):
        import requests
        from django.conf import settings
        folder_path = request.data.get('folder_path')
        if not folder_path or not os.path.exists(folder_path):
            return Response({"error": "Valid folder path is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Create FileData instance
        file_data = FileData.objects.create(
            title=os.path.basename(folder_path)
        )

        # Prepare for internal API call
        # Get the current host (assumes running on localhost)
        api_url = request.build_absolute_uri('/upload-and-train/')
        headers = {}
        if request.auth:
            headers['Authorization'] = f'Bearer {request.auth}'

        # Process files in the folder
        for root, dirs, files in os.walk(folder_path):
            for file in files:
                file_path = os.path.join(root, file)
                ext = os.path.splitext(file)[1].lower()
                if ext in DOC_EXTENSIONS:
                    with open(file_path, 'rb') as f:
                        DocumentFileData.objects.create(
                            file_data=file_data,
                            file=File(f, name=file)
                        )
                        # Call upload-and-train API
                        f.seek(0)
                        files_data = {'file': (file, f, 'application/octet-stream')}
                        data = {'type': 'file'}
                        try:
                            requests.post(api_url, files=files_data, data=data, headers=headers, timeout=60)
                        except Exception as e:
                            pass  # Optionally log error
                elif ext in EXCEL_EXTENSIONS:
                    with open(file_path, 'rb') as f:
                        ExcelFileData.objects.create(
                            file_data=file_data,
                            file=File(f, name=file)
                        )
                        # Call upload-and-train API
                        f.seek(0)
                        files_data = {'file': (file, f, 'application/octet-stream')}
                        data = {'type': 'file'}
                        try:
                            requests.post(api_url, files=files_data, data=data, headers=headers, timeout=60)
                        except Exception as e:
                            pass  # Optionally log error

        serializer = self.get_serializer(file_data)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data) 

class ExcelFileViewSet(viewsets.ModelViewSet):
    queryset = ExcelFile.objects.all()
    serializer_class = ExcelFileSerializer
    parser_classes = (MultiPartParser, FormParser)

    def perform_create(self, serializer):
        user = self.request.user if self.request.user and self.request.user.is_authenticated else None
        serializer.save(added_by=user)

class FileUploadViewSet(viewsets.ModelViewSet):
    queryset = Files_upload.objects.all()
    serializer_class = FilesUploadSerializer
    parser_classes = (MultiPartParser, FormParser)

    def perform_create(self, serializer):
        user = self.request.user if self.request.user and self.request.user.is_authenticated else None
        serializer.save(added_by=user)


class SitemapFetchAPIView(APIView):
    def post(self, request):
        url = request.data.get('url')
        if not url:
            return Response({'error': 'No URL provided.'}, status=status.HTTP_400_BAD_REQUEST)
        fetch, created = SitemapFetch.objects.get_or_create(url=url)
        try:
            urls = self.get_sitemap_links(url)
            fetch.urls = urls
            fetch.status = 'success'
            fetch.error = ''
            fetch.save()
            serializer = SitemapFetchSerializer(fetch)
            return Response(serializer.data)
        except Exception as e:
            fetch.status = 'error'
            fetch.error = str(e)
            fetch.save()
            return Response({'error': str(e)}, status=500)

    def get(self, request):
        url = request.query_params.get('url')
        if url:
            try:
                fetch = SitemapFetch.objects.get(url=url)
                serializer = SitemapFetchSerializer(fetch)
                return Response(serializer.data)
            except SitemapFetch.DoesNotExist:
                return Response({'error': 'Not found.'}, status=404)
        else:
            fetches = SitemapFetch.objects.all().order_by('-fetched_at')
            serializer = SitemapFetchSerializer(fetches, many=True)
            return Response(serializer.data)

    def delete(self, request):
        url = request.data.get('url') or request.query_params.get('url')
        if url:
            deleted, _ = SitemapFetch.objects.filter(url=url).delete()
            if deleted:
                return Response({'message': 'Deleted.'}, status=204)
            else:
                return Response({'error': 'Not found.'}, status=404)
        else:
            SitemapFetch.objects.all().delete()
            return Response({'message': 'All records deleted.'}, status=204)

    def get_sitemap_links(self, sitemap_url, domain=None, seen=None, urls=None):
        if domain is None:
            domain = urlparse(sitemap_url).netloc.lower()
        if seen is None:
            seen = set()
        if urls is None:
            urls = set()
        if sitemap_url in seen:
            return
        seen.add(sitemap_url)
        blacklist = {"https://sitemaps.org/", "https://yoa.st/1y5"}
        if sitemap_url.endswith('.xml'):
            response = requests.get(sitemap_url)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'xml')
            links = [loc.text for loc in soup.find_all('loc')]
            for link in links:
                if link.endswith('.xml'):
                    self.get_sitemap_links(link, domain, seen, urls)
                else:
                    link_netloc = urlparse(link).netloc.lower()
                    if (
                        link_netloc == domain and
                        not link.lower().endswith((
                            '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.ico')) and
                        link not in blacklist
                    ):
                        urls.add(link)
        return list(urls)
    
class TokenByUsernameView(APIView):
    permission_classes = [AllowAny]
 
    def post(self, request):
        # Try to get username from request body first, then from query params
        username = request.data.get('username') or request.query_params.get('username')
 
        if not username:
            return Response({'error': 'Username is required'}, status=400)
 
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'Invalid username'}, status=404)
 
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })
 

