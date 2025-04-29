from django.urls import path, re_path, include
from .views import *
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from django.views.generic import TemplateView
from .views import FeedbackUpsertView
from .views import ChatbotCategoryListAPIView

# API endpoints
urlpatterns = [
    path("embed-website/", EmbedWebsiteAPIView.as_view()),
    path("ask/", AskWebsiteAPIView.as_view()),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('chatlogs/', ChatLogListView.as_view(), name='chatlog-list'),
    path('chatlogs/<int:pk>/feedback/', FeedbackCreateView.as_view(), name='feedback-create'),
    path('feedback/<int:pk>/update/', UpdateFeedbackView.as_view(), name='update-feedback'),
    path('feedbacks/upsert/<int:pk>/', FeedbackUpsertView.as_view(), name='feedback-upsert'),
    path('stats/summary/', FeedbackSummaryView.as_view(), name='feedback-summary'),
    path('stats/top-questions/', TopQuestionsView.as_view(), name='top-questions'),
    path('stats/accuracy-over-time/', AccuracyOverTimeView.as_view(), name='accuracy-over-time'),
    path('chatlog/<int:pk>/correct/', CorrectAnswerView.as_view(), name='correct-answer'),
    path('categories/', ChatbotCategoryListAPIView.as_view(), name='chatbot-categories'),
    # path('api/categories/', ChatbotCategoryListAPIView.as_view(), name='chatbot-categories'),
    path("upload-and-train/", UploadAndTrainAPIView.as_view(), name="upload_and_train"),
    

]


