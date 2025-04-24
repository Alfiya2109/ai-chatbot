from rest_framework.views import APIView
from rest_framework.response import Response
from .utils.scraper import scrape_entire_website
from .utils.vector_store import store_in_vector_db, query_vector_db
from .serializers import *
from django.contrib.auth.models import *
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.generics import UpdateAPIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import render
from django.conf import settings
from rest_framework import generics, filters, status
from django.db.models import Count
from .models import Feedback
from django.views import View
from django.http import JsonResponse


class ChatLogListView(generics.ListAPIView):
    queryset = ChatLog.objects.all().order_by('-timestamp')
    serializer_class = ChatLogSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['question', 'gpt_answer']

    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        if status_filter == 'incorrect':
            queryset = queryset.filter(is_correct=False)
        elif status_filter == 'correct':
            queryset = queryset.filter(is_correct=True)
        elif status_filter == 'unreviewed':
            queryset = queryset.filter(is_correct__isnull=True)
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
    def get(self, request):
        categories = ChatbotCategory.objects.all()
        serializer = ChatbotCategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)



