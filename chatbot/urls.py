from django.urls import path, re_path, include
from .views import *
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from django.views.generic import TemplateView
from .views import FeedbackUpsertView
from .views import ChatbotCategoryListAPIView
from .views import FileUploadView
from .views import FileUploadView, TextContentView, ExcelFileView, QADataView

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
    path('chatlogs/<int:chatlog_id>/update-category/', UpdateChatLogCategoryByNameAPIView.as_view(), name='update_chatlog_category'),
    path('chatlogs/<int:chatlog_id>/update-subcategory/', UpdateChatLogSubCategoryByNameAPIView.as_view(), name='update_chatlog_subcategory'),
    path("filesupload/", FileUploadView.as_view(), name="files_upload"),
    path("filesupload/<int:pk>/", FileUploadView.as_view(), name="file_delete"),
    path("filesupload/", FileUploadView.as_view(), name="files_upload"),
    path("textupload/", TextContentView.as_view(), name="text_upload"),
    path("textupload/<int:pk>/", TextContentView.as_view(), name="text_delete"),
    path("excelupload/", ExcelFileView.as_view(), name="excel_upload"),
    path("excelupload/<int:pk>/", ExcelFileView.as_view(), name="excel_delete"),
    path("qa/", QADataView.as_view(), name="qa_data"),
    path("qa/<int:pk>/", QADataView.as_view(), name="qa_data_detail"),
]


