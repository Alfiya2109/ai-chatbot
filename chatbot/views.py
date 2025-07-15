from .utils.gpt_helpers import classify_question_type, generate_analysis_code, format_analysis_result
from .utils.match_file import find_matching_excel_files
from .utils.exec_sandbox import execute_pandas_code
import pandas as pd
import io
import traceback
from rest_framework.views import APIView
from rest_framework.response import Response
from sympy import re
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
from .models import *
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
        
        # Get the selected knowledge base(s)
        kb_value = request.data.getlist("knowledge_bases") if hasattr(request.data, 'getlist') else None
        if not kb_value or not isinstance(kb_value, list) or not kb_value:
            # fallback to single knowledge_base or knowledge_bases as string
            kb_value = request.data.get("knowledge_base") or request.data.get("knowledge_bases")
            if kb_value:
                if isinstance(kb_value, list):
                    knowledge_bases = kb_value
                else:
                    knowledge_bases = [kb_value]
            else:
                knowledge_bases = []
        else:
            knowledge_bases = kb_value
        
        if not knowledge_bases:
            return Response({"error": "Knowledge base is required for training."}, status=400)
        
        try:
            description = request.data.get("description", "")
            print(f'[DEBUG] Embedding website: {url} with description: {description}')
            pages = [(page_url, text, description) for page_url, text in scrape_entire_website(url)]
            from chatbot.models import KnowledgeBase
            # Try to convert all to int, if fail, treat as name
            kb_ids = []
            kb_names = []
            for kb in knowledge_bases:
                try:
                    kb_ids.append(int(kb))
                except Exception:
                    kb_names.append(str(kb))
            # Get all names from IDs
            if kb_ids:
                kb_names += list(KnowledgeBase.objects.filter(id__in=kb_ids).values_list('name', flat=True))
            if not kb_names:
                return Response({"error": "No valid knowledge base found."}, status=400)
            store_in_vector_db(pages, knowledge_base=kb_names)
            return Response({"message": "Website embedded successfully."})
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class AskWebsiteAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        question = request.data.get("question")
        session_id = request.data.get("session")
        if not question:
            return Response({"error": "Question is required."}, status=400)

        # Classify question type
        qtype = classify_question_type(question)
        if qtype == "analytical":
            # Analytical flow
            try:
                # 1. Find relevant Excel files
                matches = find_matching_excel_files(question)
                if not matches:
                    return Response({"error": "No relevant Excel file found for analysis."}, status=404)
                # For simplicity, use the first match
                meta = matches[0]
                # 2. Load the first sheet as DataFrame
                file_field = getattr(meta, 'file', None)
                if not file_field:
                    # Try to find ExcelFile with matching file_name
                    from .models import ExcelFile
                    try:
                        excel_file = ExcelFile.objects.filter(file__icontains=meta.file_name).first()
                        if not excel_file:
                            return Response({"error": "Excel file not found on disk."}, status=404)
                        file_field = excel_file.file
                    except Exception:
                        return Response({"error": "Excel file not found on disk."}, status=404)
                file_path = file_field.path if hasattr(file_field, 'path') else file_field.name
                with open(file_path, 'rb') as f:
                    excel_bytes = f.read()
                excel_io = io.BytesIO(excel_bytes)
                # Use the first sheet
                sheet_name = meta.sheet_names[0] if meta.sheet_names else None
                if not sheet_name:
                    return Response({"error": "No sheet name found in metadata."}, status=404)
                df = pd.read_excel(excel_io, sheet_name=sheet_name)
                # 3. Generate analysis code
                metadata_dict = {
                    'columns': meta.columns,
                    'data_types': meta.data_types,
                    'sample_rows': meta.sample_rows
                }
                code = generate_analysis_code(question, metadata_dict)
                # 4. Clean code of markdown formatting, import statements, Excel file loading, and sheet dict access before execution
                import re
                clean_code = re.sub(r'```(?:python)?|```', '', code)
                clean_code = re.sub(r'^\s*import .*$', '', clean_code, flags=re.MULTILINE)
                # Remove lines that load the Excel file
                clean_code = re.sub(r'^.*pd\.read_excel\(.*$', '', clean_code, flags=re.MULTILINE)
                # Replace DataFrame variable names assigned from read_excel with 'df'
                clean_code = re.sub(r'\bsales_order_df\b', 'df', clean_code)
                # Replace df['Sheet Name'] with df (if present)
                sheet_name = sheet_name if 'sheet_name' in locals() else (meta.sheet_names[0] if meta.sheet_names else None)
                if sheet_name:
                    pattern = rf"df\s*\[\s*['\"]{re.escape(sheet_name)}['\"]\s*\]"
                    clean_code = re.sub(pattern, 'df', clean_code)
                clean_code = clean_code.strip()
                result = execute_pandas_code(clean_code, df)
                # 5. Post-process: If result is a DataFrame and question asks for total/sum/count, try to extract value
                keywords = ['total', 'sum', 'count']
                if isinstance(result, pd.DataFrame) and any(k in question.lower() for k in keywords):
                    # Try to find the most likely numeric column
                    numeric_cols = result.select_dtypes(include='number').columns
                    if len(numeric_cols) == 1:
                        value = result[numeric_cols[0]].sum()
                        formatted = f"The total {numeric_cols[0]} is {value}."
                        print(f"[DEBUG] Post-processed DataFrame to single value: {formatted}")
                    elif len(numeric_cols) > 1:
                        # Try to match column name in question
                        match_col = None
                        for col in numeric_cols:
                            if col.lower() in question.lower():
                                match_col = col
                                break
                        if match_col:
                            value = result[match_col].sum()
                            formatted = f"The total {match_col} is {value}."
                            print(f"[DEBUG] Post-processed DataFrame to single value: {formatted}")
                        else:
                            formatted = format_analysis_result(result)
                    else:
                        formatted = format_analysis_result(result)
                else:
                    formatted = format_analysis_result(result)
                # Store the chat in ChatLog
                from .models import ChatLog
                chatlog_kwargs = {
                    'user': request.user,
                    'question': question,
                    'gpt_answer': formatted,
                    'tokens': None,
                }
                if session_id:
                    chatlog_kwargs['session_id'] = session_id
                ChatLog.objects.create(**chatlog_kwargs)
                return Response({"answer": formatted, "code": code})
            except Exception as e:
                tb = traceback.format_exc()
                return Response({"error": f"Analytical flow failed: {e}", "trace": tb}, status=500)
        else:
            # General flow (vector DB + GPT)
            from .models import UserProfile, ChatLog
            try:
                user_profile = UserProfile.objects.get(user=request.user)
                user_kbs = list(user_profile.knowledge_bases.values_list('name', flat=True))
            except UserProfile.DoesNotExist:
                return Response({"error": "User profile not found."}, status=400)
            if not user_kbs:
                return Response({"error": "No knowledge base assigned to user."}, status=400)
            # Get both answer and tokens from vector_store, filtered by knowledge base
            answer, tokens = query_vector_db(question, knowledge_bases=user_kbs)
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
from .utils.vector_store import store_in_vector_db

class JogetFileUploadAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        file = request.FILES.get('file')
        # Accept both single and multiple knowledge bases
        knowledge_bases = request.data.getlist('knowledge_bases') or request.data.get('knowledge_bases') or []
        if not knowledge_bases:
            # Fallback to single knowledge_base for backward compatibility
            kb = request.data.get('knowledge_base')
            if kb:
                knowledge_bases = [kb]
        form_id = request.POST.get('form_id')

        if not file or not knowledge_bases or not form_id:
            return Response({'error': 'Missing required fields.'}, status=status.HTTP_400_BAD_REQUEST)

        ext = os.path.splitext(file.name)[1].lower()
        is_excel = ext in ['.xls', '.xlsx', '.csv']

        from chatbot.models import Files_upload, KnowledgeBase
        from chatbot.serializers import FilesUploadSerializer

        # Get or create KnowledgeBase objects
        kb_objs = []
        for kb in knowledge_bases:
            obj, _ = KnowledgeBase.objects.get_or_create(name=kb)
            kb_objs.append(obj)

        user = request.user if request.user and request.user.is_authenticated else None  # <-- Add this line

        file_obj = Files_upload.objects.create(
            file=file,
            description=form_id,
            added_by=user,
            updated_by=user
        )
        file_obj.knowledge_bases.set(kb_objs)
        file_obj.save()

        # --- Train vector database with file content ---
        try:
            with file_obj.file.open('rb') as f:
                content = read_uploaded_file(f)
            pages = [(file_obj.file.name, content, form_id)]
            from chatbot.models import KnowledgeBase
            if isinstance(knowledge_bases, list):
                knowledge_bases = list(KnowledgeBase.objects.filter(id__in=knowledge_bases).values_list('name', flat=True))
            else:
                knowledge_bases = [knowledge_bases]
            store_in_vector_db(pages, knowledge_base=knowledge_bases)
        except Exception as e:
            return Response({'error': f'File saved but failed to train vector DB: {str(e)}'}, status=500)

        # Build file URL for client access
        from django.conf import settings
        file_url = request.build_absolute_uri(settings.MEDIA_URL + file_obj.file.name)

        response_data = {
            'filename': file.name,
            'type': 'excel' if is_excel else 'document',
            'path': file_obj.file.name,
            'url': file_url,
            'knowledge_bases': [kb.name for kb in kb_objs],
            'form_id': form_id
        }

        return Response({'message': 'File received, saved, and trained in vector DB.', 'data': response_data}, status=status.HTTP_200_OK)

class UploadAndTrainAPIView(APIView):
    def post(self, request):
        print(f"[DEBUG] Received data: {request.data}")
        input_type = request.data.get("type")  # "file", "text", "qna"
        pages = []
        # Get the selected knowledge base (assume single selection for simplicity)
        knowledge_base = None
        kb_ids = request.data.getlist("knowledge_bases") or request.data.get("knowledge_bases") or []
        if not kb_ids:
            kb_id = request.data.get("knowledge_base")
            if kb_id:
                kb_ids = [kb_id]
        if not kb_ids:
            return Response({"error": "Knowledge base is required for training."}, status=400)
        from chatbot.models import KnowledgeBase
        kb_names = list(KnowledgeBase.objects.filter(id__in=kb_ids).values_list('name', flat=True))
        try:
            if input_type == "file":
                uploaded_file = request.FILES.get("file")
                if not uploaded_file:
                    return Response({"error": "No file provided."}, status=400)
                content = read_uploaded_file(uploaded_file)
                pages = [(uploaded_file.name, content, request.data.get("description", ""))]
            elif input_type == "text":
                raw_text = request.data.get("text", "")
                if not raw_text:
                    return Response({"error": "Text not provided."}, status=400)
                pages = [("manual_input", raw_text, request.data.get("description", ""))]
            elif input_type == "qna":
                question = request.data.get("question")
                answer = request.data.get("answer")
                category = request.data.get("category", "general")
                subcategory = request.data.get("subcategory", "")
                if not question or not answer:
                    return Response({"error": "Q&A not provided."}, status=400)
                content = f"Category: {category}\nSubcategory: {subcategory}\nQ: {question}\nA: {answer}"
                pages = [("qna_input", content , request.data.get("description", ""))]
            else:
                return Response({"error": "Invalid type."}, status=400)
            print(f"[DEBUG] Description: {request.data.get('description', '')}")
            # Store in vector DB with knowledge base metadata
            print(f"[DEBUG] Calling store_in_vector_db with kb_names: {kb_names}")
            store_in_vector_db(pages, knowledge_base=kb_names)
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
            text_item = serializer.save(added_by=user)
            
            # Add to vector database
            try:
                # Get knowledge base names
                kb_names = list(text_item.knowledge_bases.values_list('name', flat=True))
                
                # Create content for vector DB
                description_str = f"Description: {text_item.description}" if text_item.description else ""
                
                # Format content for vector DB
                full_content = f"{description_str}\n{text_item.content}" if description_str else text_item.content
                
                # Store in vector DB
                pages = [(f"text_{text_item.id}", full_content, text_item.description or "")]
                if kb_names:
                    store_in_vector_db(pages, knowledge_base=kb_names)
                
                print(f"✅ Added text content {text_item.id} to vector DB")
                
            except Exception as e:
                print(f"❌ Error adding text content {text_item.id} to vector DB: {str(e)}")
                # Continue even if vector DB update fails, as the database save was successful
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk=None):
        try:
            text = TextContent.objects.get(pk=pk)
            data = request.data.copy()
            data.pop('added_by', None)
            user = request.user if request.user and request.user.is_authenticated else None
            serializer = TextContentSerializer(text, data=data, partial=True)
            if serializer.is_valid():
                # Save the updated text
                updated_text = serializer.save(updated_by=user)
                
                # Update vector database
                try:
                    # Remove old text content from vector DB
                    remove_from_vector_db(f"text_{text.id}")
                    
                    # Get updated knowledge base names
                    updated_kb_names = list(updated_text.knowledge_bases.values_list('name', flat=True))
                    
                    # Create new content for vector DB
                    description_str = f"Description: {updated_text.description}" if updated_text.description else ""
                    
                    # Format content for vector DB
                    full_content = f"{description_str}\n{updated_text.content}" if description_str else updated_text.content
                    
                    # Store updated content in vector DB
                    pages = [(f"text_{updated_text.id}", full_content, updated_text.description or "")]
                    if updated_kb_names:
                        store_in_vector_db(pages, knowledge_base=updated_kb_names)
                    
                    print(f"✅ Updated text content {text.id} in vector DB")
                    
                except Exception as e:
                    print(f"❌ Error updating vector DB for text content {text.id}: {str(e)}")
                    # Continue even if vector DB update fails, as the database update was successful
                
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except TextContent.DoesNotExist:
            return Response({"error": "Text not found"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk=None):
        try:
            text = TextContent.objects.get(pk=pk)
            identifier = f"text_{text.id}"  # Use the same identifier format used when storing
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
        from .utils.excel_tools import extract_excel_metadata
        from .models import ExcelMetadata
        data = request.data.copy()
        data.pop('added_by', None)
        user = request.user if request.user and request.user.is_authenticated else None
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        # Save ExcelFile as before
        serializer = ExcelFileSerializer(data=data)
        if serializer.is_valid():
            excel_file_instance = serializer.save(added_by=user)

            # Extract metadata and save to ExcelMetadata
            metadata = extract_excel_metadata(file)
            ExcelMetadata.objects.create(
                file_name=file.name,
                sheet_names=metadata.get('sheet_names', []),
                columns=metadata.get('columns', {}),
                data_types=metadata.get('data_types', {}),
                sample_rows=metadata.get('sample_rows', {}),
                row_count=metadata.get('row_count', {}),
                uploaded_by=user
            )

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    def delete(self, request, pk=None):
        try:
            file = ExcelFile.objects.get(pk=pk)
            identifier = file.id  # Use a unique identifier for the Excel file
            # Delete associated ExcelMetadata
            from .models import ExcelMetadata
            metadata_qs = ExcelMetadata.objects.filter(excel_file=file)
            deleted_count = metadata_qs.count()
            metadata_qs.delete()
            print(f"[DEBUG] Deleted {deleted_count} ExcelMetadata records associated with ExcelFile id={file.id}")
            file.delete()
            try:
                remove_from_vector_db(identifier)  # Remove from vector DB
            except Exception as e:
                return Response({"error": f"Failed to remove from vector DB: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response({"message": "File and associated metadata deleted"}, status=status.HTTP_204_NO_CONTENT)
        except ExcelFile.DoesNotExist:
            return Response({"error": "File not found"}, status=status.HTTP_404_NOT_FOUND)
     
class QADataView(APIView):
    def get(self, request):
        items = QAData.objects.all()
        serializer = QADataSerializer(items, many=True)
        data = serializer.data
        for i, item in enumerate(items):
            data[i]['added_by'] = item.added_by.username if item.added_by else None
            data[i]['updated_by'] = item.updated_by.username if item.updated_by else None
            # Format knowledge bases with both id and name
            data[i]['knowledge_bases'] = [{'id': kb.id, 'name': kb.name} for kb in item.knowledge_bases.all()]
            # Format categories with both id and name
            data[i]['category'] = [{'id': cat.id, 'name': cat.name} for cat in item.category.all()]
            # Format subcategories with both id and name  
            data[i]['subcategory'] = [{'id': subcat.id, 'name': subcat.name} for subcat in item.subcategory.all()]
        return Response(data)

    def post(self, request):
        data = request.data.copy()
        data.pop('added_by', None)
        user = request.user if request.user and request.user.is_authenticated else None
        serializer = QADataSerializer(data=data)
        if serializer.is_valid():
            qa_item = serializer.save(added_by=user)
            
            # Add to vector database
            try:
                # Get knowledge base names
                kb_names = list(qa_item.knowledge_bases.values_list('name', flat=True))
                
                # Create content for vector DB
                categories = [cat.name for cat in qa_item.category.all()]
                subcategories = [subcat.name for subcat in qa_item.subcategory.all()]
                category_str = f"Category: {', '.join(categories)}" if categories else ""
                subcategory_str = f"Subcategory: {', '.join(subcategories)}" if subcategories else ""
                description_str = f"Description: {qa_item.description}" if qa_item.description else ""
                
                content_parts = [part for part in [category_str, subcategory_str, description_str] if part]
                metadata_content = "\n".join(content_parts)
                
                full_content = f"{metadata_content}\nQ: {qa_item.question}\nA: {qa_item.answer}"
                
                # Store in vector DB
                pages = [(f"qa_{qa_item.id}", full_content, qa_item.description or "")]
                if kb_names:
                    store_in_vector_db(pages, knowledge_base=kb_names)
                
                print(f"✅ Added Q&A item {qa_item.id} to vector DB")
                
            except Exception as e:
                print(f"❌ Error adding Q&A item {qa_item.id} to vector DB: {str(e)}")
                # Continue even if vector DB update fails, as the database save was successful
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, pk=None):
        try:
            item = QAData.objects.get(pk=pk)
            old_item_data = {
                'question': item.question,
                'answer': item.answer,
                'description': item.description,
                'knowledge_bases': list(item.knowledge_bases.values_list('name', flat=True))
            }
            
            data = request.data.copy()
            data.pop('added_by', None)
            data.pop('updated_by', None)
            user = request.user if request.user and request.user.is_authenticated else None
            
            serializer = QADataSerializer(item, data=data, partial=True)
            if serializer.is_valid():
                # Save the updated item
                updated_item = serializer.save(updated_by=user)
                
                # Update vector database
                try:
                    # Remove old Q&A content from vector DB
                    remove_from_vector_db(f"qa_{item.id}")
                    
                    # Get updated knowledge base names
                    updated_kb_names = list(updated_item.knowledge_bases.values_list('name', flat=True))
                    
                    # Create new content for vector DB
                    categories = [cat.name for cat in updated_item.category.all()]
                    subcategories = [subcat.name for subcat in updated_item.subcategory.all()]
                    category_str = f"Category: {', '.join(categories)}" if categories else ""
                    subcategory_str = f"Subcategory: {', '.join(subcategories)}" if subcategories else ""
                    description_str = f"Description: {updated_item.description}" if updated_item.description else ""
                    
                    content_parts = [part for part in [category_str, subcategory_str, description_str] if part]
                    metadata_content = "\n".join(content_parts)
                    
                    full_content = f"{metadata_content}\nQ: {updated_item.question}\nA: {updated_item.answer}"
                    
                    # Store updated content in vector DB
                    pages = [(f"qa_{updated_item.id}", full_content, updated_item.description or "")]
                    if updated_kb_names:
                        store_in_vector_db(pages, knowledge_base=updated_kb_names)
                    
                    print(f"✅ Updated Q&A item {item.id} in vector DB")
                    
                except Exception as e:
                    print(f"❌ Error updating vector DB for Q&A item {item.id}: {str(e)}")
                    # Continue even if vector DB update fails, as the database update was successful
                
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except QAData.DoesNotExist:
            return Response({"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, pk=None):
        try:
            item = QAData.objects.get(pk=pk)
            identifier = f"qa_{item.id}"  # Use the same identifier format used when storing
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

class ProfileRetrieveUpdateAPI(generics.RetrieveUpdateDestroyAPIView):
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
        if user_profile.ppt_access: allowed_tabs.append('PPT')
        if user_profile.chat_history_access: allowed_tabs.append('History')
        if user_profile.user_details_access: allowed_tabs.append('User Details')
        # Optionally, check Profile fields (if you want to merge both)
        if user_profile.profile:
            if user_profile.profile.files_access and 'Files' not in allowed_tabs: allowed_tabs.append('Files')
            if user_profile.profile.text_access and 'Text' not in allowed_tabs: allowed_tabs.append('Text')
            if user_profile.profile.excel_access and 'Excel/CSV' not in allowed_tabs: allowed_tabs.append('Excel/CSV')
            if user_profile.profile.qna_access and 'Q&A' not in allowed_tabs: allowed_tabs.append('Q&A')
            if user_profile.profile.url_access and 'URL' not in allowed_tabs: allowed_tabs.append('URL')
            if user_profile.profile.ppt_access and 'PPT' not in allowed_tabs: allowed_tabs.append('PPT')
            if user_profile.profile.chat_history_access and 'History' not in allowed_tabs: allowed_tabs.append('History')
        allowed_tabs.append('Chatbot')  # Always allow Chatbot for navigation
        # Only add 'Profile' if user_profile_access is True in either userprofile or profile
        if (user_profile.user_profile_access or (user_profile.profile and getattr(user_profile.profile, 'user_profile_access', False))):
            allowed_tabs.append('Profile')

        return Response({
            'userprofile': userprofile_data,
            'profile': profile_data,
            'allowed_tabs': allowed_tabs
        }, status=200)

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

    def delete(self, request, pk):
        try:
            user_profile = UserProfile.objects.get(pk=pk)
            # Also delete the associated User
            user = user_profile.user
            user_profile.delete()
            user.delete()
            return Response({'message': 'User profile deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except UserProfile.DoesNotExist:
            return Response({'error': 'UserProfile not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'Failed to delete user profile: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        import tempfile
        from django.conf import settings
        import os
        import requests
        folder_name = request.data.get('folder_name') or 'uploaded_folder'
        description = request.data.get('description', '')
        knowledge_bases = request.data.getlist('knowledge_bases') if 'knowledge_bases' in request.data else []
        files = request.FILES.getlist('files')
        relative_paths = request.data.getlist('relative_paths') if 'relative_paths' in request.data else None
        if not files or (relative_paths and len(files) != len(relative_paths)):
            return Response({'error': 'No files or mismatched relative paths.'}, status=status.HTTP_400_BAD_REQUEST)

        # Create a temp directory to reconstruct the folder
        base_upload_dir = os.path.join(settings.MEDIA_ROOT, 'uploads', folder_name)
        os.makedirs(base_upload_dir, exist_ok=True)

        # Create FileData instance with description
        file_data = FileData.objects.create(
                title=folder_name,
                description=description,
                added_by=request.user if request.user.is_authenticated else None
            )        
        if knowledge_bases:
            file_data.knowledge_bases.set(knowledge_bases)

        # Get knowledge base names for vector DB storage
        from chatbot.models import KnowledgeBase
        kb_names = list(KnowledgeBase.objects.filter(id__in=knowledge_bases).values_list('name', flat=True))
        
        # Import required functions
        from .file_reader import read_uploaded_file
        from .utils.vector_store import store_in_vector_db
        
        vector_pages = []
        vector_db_errors = []

        for idx, file in enumerate(files):
            rel_path = relative_paths[idx] if relative_paths else file.name
            save_path = os.path.join(base_upload_dir, rel_path)
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            with open(save_path, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)
            
            ext = os.path.splitext(file.name)[1].lower()
            if ext in DOC_EXTENSIONS:
                doc_file_data = DocumentFileData.objects.create(
                    file_data=file_data,
                    file=os.path.relpath(save_path, settings.MEDIA_ROOT)
                )
                # Process file for vector DB
                try:
                    # Create a temporary Django file object for reading
                    with open(save_path, 'rb') as f:
                        from django.core.files.uploadedfile import SimpleUploadedFile
                        temp_file = SimpleUploadedFile(file.name, f.read())
                        content = read_uploaded_file(temp_file)
                        if content.strip():  # Only add if content is not empty
                            vector_pages.append((f"doc_{doc_file_data.id}_{file.name}", content, description))
                except Exception as e:
                    vector_db_errors.append(f"Error processing {file.name}: {str(e)}")
                    print(f"❌ Error processing document {file.name} for vector DB: {str(e)}")
                    
            elif ext in EXCEL_EXTENSIONS:
                excel_file_data = ExcelFileData.objects.create(
                    file_data=file_data,
                    file=os.path.relpath(save_path, settings.MEDIA_ROOT)
                )
                # Process file for vector DB
                try:
                    # Create a temporary Django file object for reading
                    with open(save_path, 'rb') as f:
                        from django.core.files.uploadedfile import SimpleUploadedFile
                        temp_file = SimpleUploadedFile(file.name, f.read())
                        content = read_uploaded_file(temp_file)
                        if content.strip():  # Only add if content is not empty
                            vector_pages.append((f"excel_{excel_file_data.id}_{file.name}", content, description))
                except Exception as e:
                    vector_db_errors.append(f"Error processing {file.name}: {str(e)}")
                    print(f"❌ Error processing Excel file {file.name} for vector DB: {str(e)}")

        # Store all processed files in vector DB at once
        if vector_pages and kb_names:
            try:
                print(f"[DEBUG] Storing {len(vector_pages)} files in vector DB with knowledge bases: {kb_names}")
                store_in_vector_db(vector_pages, knowledge_base=kb_names)
                print(f"✅ Successfully stored folder '{folder_name}' files in vector DB")
            except Exception as e:
                vector_db_errors.append(f"Vector DB storage error: {str(e)}")
                print(f"❌ Error storing folder files in vector DB: {str(e)}")
        elif not vector_pages:
            print(f"⚠️ No valid content found in uploaded files for folder '{folder_name}'")
        elif not kb_names:
            print(f"⚠️ No knowledge bases found for folder '{folder_name}'")

        serializer = self.get_serializer(file_data)
        response_data = serializer.data
        
        # Add vector DB processing information to response
        if vector_db_errors:
            response_data['vector_db_errors'] = vector_db_errors
            response_data['message'] = f"Folder uploaded successfully, but {len(vector_db_errors)} files had vector DB errors."
        else:
            response_data['message'] = f"Folder '{folder_name}' uploaded and processed successfully."
        
        return Response(response_data, status=status.HTTP_201_CREATED)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data) 

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Remove all associated document and excel files from vector DB
        from .utils.vector_store import remove_from_vector_db
        errors = []
        for doc in instance.document_files.all():
            try:
                # Use the same identifier format as in create method
                remove_from_vector_db(f"doc_{doc.id}_{doc.file.name}")
            except Exception as e:
                errors.append(f"DocumentFileData {doc.id}: {str(e)}")
        for excel in instance.excel_files.all():
            try:
                # Use the same identifier format as in create method
                remove_from_vector_db(f"excel_{excel.id}_{excel.file.name}")
            except Exception as e:
                errors.append(f"ExcelFileData {excel.id}: {str(e)}")
        response = super().destroy(request, *args, **kwargs)
        if errors:
            return Response({"message": "Folder deleted, but some vector DB removals failed.", "errors": errors}, status=status.HTTP_200_OK)
        return response

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


from .models import GoogleDriveFileData, GoogleDriveDocumentFileData, GoogleDriveExcelFileData
from .serializers import GoogleDriveFileDataSerializer, GoogleDriveDocumentFileDataSerializer, GoogleDriveExcelFileDataSerializer

class GoogleDriveFileDataViewSet(viewsets.ModelViewSet):
    queryset = GoogleDriveFileData.objects.all()
    serializer_class = GoogleDriveFileDataSerializer

    def create(self, request, *args, **kwargs):
        file_id = request.data.get('file_id')
        file_name = request.data.get('file_name')
        mime_type = request.data.get('mime_type', None)
        description = request.data.get('description', '')
        knowledge_bases = request.data.get('knowledge_bases', [])
        user = request.user if request.user.is_authenticated else None
        instance = GoogleDriveFileData.objects.create(
            file_id=file_id,
            file_name=file_name,
            mime_type=mime_type,
            description=description,
            added_by=user
        )
        if knowledge_bases:
            instance.knowledge_bases.set(knowledge_bases)
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        from .utils.vector_store import remove_from_vector_db
        instance = self.get_object()
        identifier = instance.id
        instance.delete()
        try:
            remove_from_vector_db(identifier)
            print(f"[VECTOR DB] Deleted '{identifier}' from vector database.")
        except Exception as e:
            print(f"[VECTOR DB] Failed to delete '{identifier}' from vector database: {e}")
        return Response(status=status.HTTP_204_NO_CONTENT)

class GoogleDriveUploadAPIView(APIView):
    """
    Accepts a list of Google Drive files, determines their type, and saves them to the correct model.
    Expects POST data as a list of files with file_id, file_name, mime_type, and access_token.
    """
    def post(self, request, *args, **kwargs):
        # print("GoogleDriveUploadAPIView: POST called")
        import requests
        from .utils.vector_store import store_in_vector_db
        from .file_reader import read_uploaded_file
        import tempfile

        files = request.data.get('files', [])
        # print(f"Received files: {files}")
        folder_name = request.data.get('folder_name', '')
        # print(f"Received folder_name: {folder_name}")
        description = request.data.get('description', '')
        # print(f"Received description: {description}")
        knowledge_bases = request.data.get('knowledge_bases', [])
        # print(f"Received knowledge_bases: {knowledge_bases}")
        access_token = request.data.get('access_token')
        # print(f"Received access_token: {'Yes' if access_token else 'No'}")
        user = request.user if request.user.is_authenticated else None
        # print(f"User: {user}")

        if not files or not isinstance(files, list):
            print("No files provided or invalid format.")
            return Response({'error': 'No files provided or invalid format.'}, status=status.HTTP_400_BAD_REQUEST)

        doc_exts = ['.pdf', '.doc', '.docx', '.txt']
        excel_exts = ['.xls', '.xlsx', '.csv']
        created_docs = []
        created_excels = []

        for idx, file in enumerate(files):
            # print(f"Processing file {idx+1}/{len(files)}: {file}")
            file_id = file.get('file_id')
            file_name = file.get('file_name')
            mime_type = file.get('mime_type', '')
            ext = os.path.splitext(file_name)[1].lower()
            # print(f"File info - id: {file_id}, name: {file_name}, mime: {mime_type}, ext: {ext}")

            parent = GoogleDriveFileData.objects.create(
                file_id=file_id,
                file_name=file_name,
                mime_type=mime_type,
                description=description,
                added_by=user,
                relative_path=file.get('relative_path', '')  # <-- Add this
            )
            # print(f"Created GoogleDriveFileData: {parent.id}")

            if knowledge_bases:
                parent.knowledge_bases.set(knowledge_bases)
                # print(f"Set knowledge_bases for file {parent.id}")

            # Download file from Google Drive and store in vector DB
            if access_token:
                drive_url = f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media"
                headers = {"Authorization": f"Bearer {access_token}"}
                # print(f"Attempting to download file from Google Drive: {drive_url}")
                r = requests.get(drive_url, headers=headers)
                # print(f"Download status code: {r.status_code}")
                if r.status_code == 200:
                    content = r.content
                    # print(f"Downloaded content length: {len(content)}")
                    try:
                        # Save content to a temp file to use read_uploaded_file
                        with tempfile.NamedTemporaryFile(delete=True, suffix=os.path.splitext(file_name)[1]) as tmp_file:
                            tmp_file.write(content)
                            tmp_file.flush()
                            tmp_file.seek(0)
                            # Use read_uploaded_file to extract text
                            extracted_text = read_uploaded_file(tmp_file)
                            pages = [(file_name, extracted_text, description)]
                            # print(f"Prepared pages for vector DB: {pages[0][0]}, length: {len(pages[0][1])}")
                            from chatbot.models import KnowledgeBase
                            if isinstance(knowledge_bases, list):
                                kb_names = list(KnowledgeBase.objects.filter(id__in=knowledge_bases).values_list('name',flat=True))
                            else:
                                kb_names=[knowledge_bases]
                            store_in_vector_db(pages,knowledge_base=kb_names)
                            print(f"[VECTOR DB] Uploaded '{file_name}' to vector database.")
                    except Exception as e:
                        print(f"[VECTOR DB] Exception while uploading '{file_name}' to vector database: {e}")
                else:
                    print(f"[VECTOR DB] Failed to download '{file_name}' from Google Drive for vector DB upload. Response: {r.text}")
            else:
                print("No access token provided, skipping download and vector DB upload.")

            if ext in doc_exts:
                doc = GoogleDriveDocumentFileData.objects.create(
                    file_id=file_id,
                    file_name=file_name,
                    mime_type=mime_type,
                    file_data=parent
                )
                created_docs.append(doc)
                # print(f"Created GoogleDriveDocumentFileData: {doc.id}")
            elif ext in excel_exts:
                excel = GoogleDriveExcelFileData.objects.create(
                    file_id=file_id,
                    file_name=file_name,
                    mime_type=mime_type,
                    file_data=parent
                )
                created_excels.append(excel)
                # print(f"Created GoogleDriveExcelFileData: {excel.id}")
            else:
                print(f"File extension {ext} not recognized as doc or excel.")

        # print("All files processed. Returning response.")
        return Response({
            'documents': GoogleDriveDocumentFileDataSerializer(created_docs, many=True).data,
            'excels': GoogleDriveExcelFileDataSerializer(created_excels, many=True).data
        }, status=status.HTTP_201_CREATED)


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.files.storage import default_storage
import os

class JogetFileUploadAPIView(APIView):
    def post(self, request):
        file = request.FILES.get('file')
        # Accept both single and multiple knowledge bases
        knowledge_bases = request.data.getlist('knowledge_bases') or request.data.get('knowledge_bases') or []
        if not knowledge_bases:
            # Fallback to single knowledge_base for backward compatibility
            kb = request.data.get('knowledge_base')
            if kb:
                knowledge_bases = [kb]
        form_id = request.POST.get('form_id')

        if not file or not knowledge_bases or not form_id:
            return Response({'error': 'Missing required fields.'}, status=status.HTTP_400_BAD_REQUEST)

        ext = os.path.splitext(file.name)[1].lower()
        is_excel = ext in ['.xls', '.xlsx', '.csv']

        from chatbot.models import Files_upload, KnowledgeBase
        from chatbot.serializers import FilesUploadSerializer

        # Get or create KnowledgeBase objects
        kb_objs = []
        for kb in knowledge_bases:
            obj, _ = KnowledgeBase.objects.get_or_create(name=kb)
            kb_objs.append(obj)

        user = request.user if request.user and request.user.is_authenticated else None  # <-- Add this line
        print(f"User: {user}")
        file_obj = Files_upload.objects.create(
            file=file,
            description=form_id,
            added_by=user,
            updated_by=user
        )
        file_obj.knowledge_bases.set(kb_objs)
        file_obj.save()

        # --- Train vector database with file content ---
        try:
            # Use the saved file from storage
            with file_obj.file.open('rb') as f:
                content = read_uploaded_file(f)
            pages = [(file_obj.file.name, content, form_id or "")]
            from chatbot.models import KnowledgeBase
            if isinstance(knowledge_bases, list):
                knowledge_bases = list(KnowledgeBase.objects.filter(id__in=knowledge_bases).values_list('name', flat=True))
            else:
                knowledge_bases = [knowledge_bases]
            store_in_vector_db(pages, knowledge_base=knowledge_bases)
        except Exception as e:
            return Response({'error': f'File saved but failed to train vector DB: {str(e)}'}, status=500)

        # Build file URL for client access
        from django.conf import settings
        file_url = request.build_absolute_uri(settings.MEDIA_URL + file_obj.file.name)

        response_data = {
            'filename': file.name,
            'type': 'excel' if is_excel else 'document',
            'path': file_obj.file.name,
            'url': file_url,
            'knowledge_bases': [kb.name for kb in kb_objs],
            'form_id': form_id
        }

        return Response({'message': 'File received, saved, and trained in vector DB.', 'data': response_data}, status=status.HTTP_200_OK)

    def get(self, request):
        """
        List files uploaded via JogetFileUploadAPIView.
        You can filter by form_id or knowledge_base using query params.
        """
        form_id = request.query_params.get('form_id')
        knowledge_base = request.query_params.get('knowledge_base')
        queryset = Files_upload.objects.all()
        if form_id:
            queryset = queryset.filter(description__icontains=form_id)
        if knowledge_base:
            queryset = queryset.filter(knowledge_bases__name__icontains=knowledge_base)
        serializer = FilesUploadSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request):
        """
        Delete a file uploaded via JogetFileUploadAPIView and remove it from the vector database.
        Expects 'file_id' and 'file_type' ('document' or 'excel') in the request data.
        """
        file_id = request.data.get('file_id')
        file_type = request.data.get('file_type')  # 'document' or 'excel'

        if not file_id or not file_type:
            return Response({'error': 'file_id and file_type are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if file_type == 'document':
            from chatbot.models import Files_upload
            try:
                file_obj = Files_upload.objects.get(id=file_id)
                file_obj.delete()
                remove_from_vector_db(file_id)
                return Response({'message': 'Document file deleted and removed from vector DB.'}, status=status.HTTP_204_NO_CONTENT)
            except Files_upload.DoesNotExist:
                return Response({'error': 'Document file not found.'}, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                return Response({'error': f'Failed to remove from vector DB: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        elif file_type == 'excel':
            from chatbot.models import ExcelFile
            try:
                file_obj = ExcelFile.objects.get(id=file_id)
                file_obj.delete()
                remove_from_vector_db(file_id)
                return Response({'message': 'Excel file deleted and removed from vector DB.'}, status=status.HTTP_204_NO_CONTENT)
            except ExcelFile.DoesNotExist:
                return Response({'error': 'Excel file not found.'}, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                return Response({'error': f'Failed to remove from vector DB: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response({'error': 'Invalid file_type. Must be "document" or "excel".'}, status=status.HTTP_400_BAD_REQUEST)

class BulkDeleteFileUploadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        try:
            ids = request.data.get('ids', [])
            if not ids:
                return Response({"error": "No IDs provided"}, status=status.HTTP_400_BAD_REQUEST)
            
            files = Files_upload.objects.filter(id__in=ids)
            if not files.exists():
                return Response({"error": "No files found with provided IDs"}, status=status.HTTP_404_NOT_FOUND)
            
            # Remove from vector DB for each file
            for file in files:
                try:
                    remove_from_vector_db(file.id)
                except Exception as e:
                    # Log error but continue with deletion
                    print(f"Failed to remove file {file.id} from vector DB: {str(e)}")
            
            deleted_count = files.count()
            files.delete()
            
            return Response({
                "message": f"Successfully deleted {deleted_count} files",
                "deleted_count": deleted_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BulkDeleteTextContentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        try:
            ids = request.data.get('ids', [])
            if not ids:
                return Response({"error": "No IDs provided"}, status=status.HTTP_400_BAD_REQUEST)
            
            texts = TextContent.objects.filter(id__in=ids)
            if not texts.exists():
                return Response({"error": "No text content found with provided IDs"}, status=status.HTTP_404_NOT_FOUND)
            
            # Remove from vector DB for each text
            for text in texts:
                try:
                    remove_from_vector_db(text.id)
                except Exception as e:
                    print(f"Failed to remove text {text.id} from vector DB: {str(e)}")
            
            deleted_count = texts.count()
            texts.delete()
            
            return Response({
                "message": f"Successfully deleted {deleted_count} text entries",
                "deleted_count": deleted_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BulkDeleteExcelFileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        try:
            ids = request.data.get('ids', [])
            if not ids:
                return Response({"error": "No IDs provided"}, status=status.HTTP_400_BAD_REQUEST)
            
            files = ExcelFile.objects.filter(id__in=ids)
            if not files.exists():
                return Response({"error": "No Excel files found with provided IDs"}, status=status.HTTP_404_NOT_FOUND)
            
            # Remove from vector DB for each file
            for file in files:
                try:
                    remove_from_vector_db(file.id)
                except Exception as e:
                    print(f"Failed to remove Excel file {file.id} from vector DB: {str(e)}")
            
            deleted_count = files.count()
            files.delete()
            
            return Response({
                "message": f"Successfully deleted {deleted_count} Excel files",
                "deleted_count": deleted_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BulkDeleteQADataView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        try:
            ids = request.data.get('ids', [])
            if not ids:
                return Response({"error": "No IDs provided"}, status=status.HTTP_400_BAD_REQUEST)
            
            qa_items = QAData.objects.filter(id__in=ids)
            if not qa_items.exists():
                return Response({"error": "No Q&A items found with provided IDs"}, status=status.HTTP_404_NOT_FOUND)
            
            # Remove from vector DB for each Q&A item
            for item in qa_items:
                try:
                    remove_from_vector_db(item.id)
                except Exception as e:
                    print(f"Failed to remove Q&A item {item.id} from vector DB: {str(e)}")
            
            deleted_count = qa_items.count()
            qa_items.delete()
            
            return Response({
                "message": f"Successfully deleted {deleted_count} Q&A items",
                "deleted_count": deleted_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BulkDeleteURLView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        try:
            ids = request.data.get('ids', [])
            if not ids:
                return Response({"error": "No IDs provided"}, status=status.HTTP_400_BAD_REQUEST)
            
            urls = URLModel.objects.filter(id__in=ids)
            if not urls.exists():
                return Response({"error": "No URLs found with provided IDs"}, status=status.HTTP_404_NOT_FOUND)
            
            # Remove from vector DB for each URL
            for url in urls:
                try:
                    remove_from_vector_db(str(url.id))
                except Exception as e:
                    print(f"Failed to remove URL {url.id} from vector DB: {str(e)}")
            
            deleted_count = urls.count()
            urls.delete()
            
            return Response({
                "message": f"Successfully deleted {deleted_count} URLs",
                "deleted_count": deleted_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BulkDeleteFolderView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        try:
            ids = request.data.get('ids', [])
            if not ids:
                return Response({"error": "No IDs provided"}, status=status.HTTP_400_BAD_REQUEST)
            
            folders = FileData.objects.filter(id__in=ids)
            if not folders.exists():
                return Response({"error": "No folders found with provided IDs"}, status=status.HTTP_404_NOT_FOUND)
            
            # Remove from vector DB for each folder
            for folder in folders:
                try:
                    remove_from_vector_db(folder.id)
                except Exception as e:
                    print(f"Failed to remove folder {folder.id} from vector DB: {str(e)}")
            
            deleted_count = folders.count()
            folders.delete()
            
            return Response({
                "message": f"Successfully deleted {deleted_count} folders",
                "deleted_count": deleted_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PPTFileView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        files = PPTFile.objects.all()
        serializer = PPTFileSerializer(files, many=True)
        data = serializer.data
        for i, file in enumerate(files):
            data[i]['added_by'] = file.added_by.username if file.added_by else None
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        from .file_reader import extract_text_from_ppt
        from .utils.vector_store import store_in_vector_db
        data = request.data.copy()
        data.pop('added_by', None)
        user = request.user if request.user and request.user.is_authenticated else None
        serializer = PPTFileSerializer(data=data)
        if serializer.is_valid():
            ppt_file = serializer.save(added_by=user)
            # Vector DB integration: extract content and store
            try:
                if 'file' in request.FILES:
                    ppt_file_obj = request.FILES['file']
                    content = extract_text_from_ppt(ppt_file_obj)
                    ppt_file.content = content
                    ppt_file.save()
                    # Store in vector DB if knowledge_bases are set
                    kb_names = list(ppt_file.knowledge_bases.values_list('name', flat=True))
                    if content and kb_names:
                        pages = [(ppt_file.file.name if ppt_file.file else "ppt_file", content, ppt_file.description or "")]
                        store_in_vector_db(pages, knowledge_base=kb_names)
            except Exception as e:
                print(f"[VECTOR DB] PPT vector storage error: {e}")
            return Response(PPTFileSerializer(ppt_file).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk=None):
        try:
            ppt_file = PPTFile.objects.get(pk=pk)
        except PPTFile.DoesNotExist:
            return Response({'error': 'PPT file not found'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data.pop('added_by', None)
        user = request.user if request.user and request.user.is_authenticated else None
        serializer = PPTFileSerializer(ppt_file, data=data, partial=True)
        if serializer.is_valid():
            ppt_file = serializer.save(added_by=user)
            return Response(PPTFileSerializer(ppt_file).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        from .utils.vector_store import remove_from_vector_db
        try:
            ppt_file = PPTFile.objects.get(pk=pk)
            identifier = f"ppt_{ppt_file.id}" if hasattr(ppt_file, 'id') else str(pk)
            ppt_file.delete()
            try:
                remove_from_vector_db(identifier)
            except Exception as e:
                print(f"Failed to remove PPT file {identifier} from vector DB: {str(e)}")
            return Response({'message': 'PPT file deleted'}, status=status.HTTP_204_NO_CONTENT)
        except PPTFile.DoesNotExist:
            return Response({'error': 'PPT file not found'}, status=status.HTTP_404_NOT_FOUND)

class BulkDeletePPTFileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        try:
            ids = request.data.get('ids', [])
            if not ids:
                return Response({"error": "No IDs provided"}, status=status.HTTP_400_BAD_REQUEST)
            
            files = PPTFile.objects.filter(id__in=ids)
            if not files.exists():
                return Response({"error": "No PPT files found with provided IDs"}, status=status.HTTP_404_NOT_FOUND)
            
            # Remove from vector DB for each PPT file
            from .utils.vector_store import remove_from_vector_db
            for file in files:
                try:
                    identifier = f"ppt_{file.id}" if hasattr(file, 'id') else str(file.pk)
                    remove_from_vector_db(identifier)
                except Exception as e:
                    print(f"Failed to remove PPT file {identifier} from vector DB: {str(e)}")
            
            deleted_count = files.count()
            files.delete()
            
            return Response({
                "message": f"Successfully deleted {deleted_count} PPT files",
                "deleted_count": deleted_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
