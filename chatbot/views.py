from rest_framework.views import APIView
from rest_framework.response import Response
from .utils.scraper import scrape_entire_website
from .utils.vector_store import store_in_vector_db, query_vector_db, remove_from_vector_db, clear_vector_db
from .serializers import *
from django.contrib.auth.models import *
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.generics import UpdateAPIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser

from rest_framework import generics, filters, status
from django.db.models import Count
from .models import Feedback, URLModel
from django.views import View
from django.http import JsonResponse
from django.db import models
import subprocess
import os
import uuid

class ChatLogListView(generics.ListAPIView):
    queryset = ChatLog.objects.all().order_by('-timestamp')
    serializer_class = ChatLogSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['question', 'gpt_answer']

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
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_data = serializer.validated_data
        
        # Get the user's role from UserProfile
        user = user_data.get('user')
        try:
            user_profile = UserProfile.objects.get(user=user)
            role = user_profile.role
        except UserProfile.DoesNotExist:
            role = 'user'  # Default role
        
        return Response({
            'username': user_data.get('username'),
            'role': role,
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
        if not question:
            return Response({"error": "Question is required."}, status=400)

        answer = query_vector_db(question)

        # Store the chat in ChatLog
        ChatLog.objects.create(
            user=request.user,
            question=question,
            gpt_answer=answer
        )

        return Response({"answer": answer})
    
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

class ChatbotSubCategoryListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        subcategories = ChatbotSubCategory.objects.all()
        serializer = ChatbotSubCategorySerializer(subcategories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


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
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = FilesUploadSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
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
        return Response(serializer.data)

    def post(self, request):
        serializer = TextContentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
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
        return Response(serializer.data)

    def post(self, request):
        serializer = ExcelFileSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
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
        return Response(serializer.data)

    def post(self, request):
        serializer = QADataSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
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
        url_list = [
            {
                "id": url.id,
                "url": url.url,
                "created_at": url.created_at
            }
            for url in urls
        ]
        return Response(url_list, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        try:
            url = URLModel.objects.get(pk=pk)
            identifier = str(url.id)  # Convert identifier to string for compatibility
            url.delete()

            try:
                remove_from_vector_db(identifier)  # Remove from vector DB
            except Exception as e:
                return Response({"error": f"Failed to remove from vector DB: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response({"message": "URL deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
        except URLModel.DoesNotExist:
            return Response({"error": "URL not found."}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        url = request.data.get("url")
        if not url:
            return Response({"error": "URL is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            new_url = URLModel.objects.create(url=url)
            return Response({"id": new_url.id, "url": new_url.url, "created_at": new_url.created_at}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        


import os
import uuid
import subprocess
import whisper



class TranscribeAudio(APIView):
    def post(self, request):
        audio_file = request.FILES.get('audio')

        if not audio_file:
            return Response({"error": "No audio file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            temp_dir = "temp_audio"
            os.makedirs(temp_dir, exist_ok=True)

            # Save uploaded WebM/Opus audio
            file_id = uuid.uuid4()
            input_path = os.path.join(temp_dir, f"{uuid.uuid4()}.webm")
            with open(input_path, 'wb+') as f:
                for chunk in audio_file.chunks():
                    f.write(chunk)

            # Convert to WAV using ffmpeg
            output_path = os.path.join(temp_dir, f"{file_id}.wav")
            ffmpeg_path = os.path.abspath(os.path.join("ffmpeg", "bin", "ffmpeg.exe"))

            command = [
                ffmpeg_path,  # assumes ffmpeg is in PATH; otherwise use full path
                '-y',
                '-i', input_path,
                '-ac', '1',
                '-ar', '16000',
                '-sample_fmt', 's16',
                output_path
            ]
            result = subprocess.run(command, capture_output=True)
            if result.returncode != 0:
                return Response({"error": f"ffmpeg error: {result.stderr.decode()}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Load Whisper and transcribe
            model = whisper.load_model("base")  # Options: tiny, base, small, medium, large
            result = model.transcribe(output_path)
            transcription = result['text']

            return Response({"transcription": transcription})

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
