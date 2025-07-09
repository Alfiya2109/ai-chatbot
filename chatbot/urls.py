from django.urls import path, re_path, include
from .views import *
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from django.views.generic import TemplateView

from rest_framework.routers import DefaultRouter
router = DefaultRouter()
router.register(r'folder-upload', FileDataViewSet, basename='folder-upload')
router.register(r'excel-files', ExcelFileViewSet, basename='excel-files')
router.register(r'document-files', FileUploadViewSet, basename='document-files')
router.register(r'google-drive-files', GoogleDriveFileDataViewSet, basename='google-drive-files')

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
    path('categories/<int:pk>/', ChatbotCategoryDetailAPIView.as_view(), name='chatbot-category-detail'),
    path('subcategories/', ChatbotSubCategoryListAPIView.as_view(), name='chatbot-subcategories'),
    path('subcategories/<int:pk>/', ChatbotSubCategoryListAPIView.as_view(), name='chatbot-subcategory-detail'),
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
    path('clear-vector-db/', ClearVectorDBView.as_view(), name='clear-vector-db'), #Used Delete method to clear vector db
    path("urls/", URLManagementAPIView.as_view(), name="url_management"),
    path("urls/<int:pk>/", URLManagementAPIView.as_view(), name="url_delete"),
    path("transcribe/", TranscribeAudioAPIView.as_view(), name="transcribe-audio"),
    path('chatsessions/', ChatSessionListCreateAPIView.as_view(), name='chat-session-list-create'),
    path('chatsessions/<int:pk>/', ChatSessionRetrieveUpdateDestroyAPIView.as_view(), name='chat-session-detail'),
    path('chatsessions/<int:pk>/add_message/', ChatSessionAddMessageAPIView.as_view(), name='chat-session-add-message'),
    path('userprofiles/', UserProfileListAPI.as_view(), name='userprofile-list'),
    path('chatbot/summarize/', summarize_question, name='summarize-question'),
    path('profiles/', ProfileListCreateAPI.as_view(), name='profile-list-create'),
    path('profiles/<int:pk>/', ProfileRetrieveUpdateAPI.as_view(), name='profile-detail-update'),
    path('userprofiles/me/', CurrentUserProfileAPIView.as_view(), name='current-user-profile'),
    path('knowledgebase/', KnowledgeBaseListCreateAPIView.as_view(), name='knowledgebase-list-create'),
    path('knowledgebase/<int:pk>/', KnowledgeBaseRetrieveUpdateDestroyAPIView.as_view(), name='knowledgebase-detail'),
    path('userprofiles/<int:pk>/update/', UserProfileUpdateAPI.as_view(), name='userprofile-update'),
    path('joget-sso-login/', JogetSSOLoginAPIView.as_view(), name='joget-sso-login'),
    # Bulk delete endpoints
    path('bulk-delete-files/', BulkDeleteFileUploadView.as_view(), name='bulk-delete-files'),
    path('bulk-delete-textcontents/', BulkDeleteTextContentView.as_view(), name='bulk-delete-text'),
    path('bulk-delete-excel/', BulkDeleteExcelFileView.as_view(), name='bulk-delete-excel'),
    path('bulk-delete-qa/', BulkDeleteQADataView.as_view(), name='bulk-delete-qa'),
    path('bulk-delete-urls/', BulkDeleteURLView.as_view(), name='bulk-delete-urls'),
    path('bulk-delete-folders/', BulkDeleteFolderView.as_view(), name='bulk-delete-folders'),
    path('ppt/', PPTFileView.as_view(), name='ppt-file'),
    path('ppt/<int:pk>/', PPTFileView.as_view(), name='ppt-file-detail'),
    path('ppt/bulk-delete/', BulkDeletePPTFileView.as_view(), name='bulk-delete-ppt'),
    path('', include(router.urls)),
    path('sitemap-fetch/', SitemapFetchAPIView.as_view(), name='sitemap-fetch'),
    path('token/username/', TokenByUsernameView.as_view(), name='token_by_username'),
    path('chatbot/google-drive/upload-folder/', GoogleDriveUploadAPIView.as_view(), name='google-drive-upload-folder'),
    path("jogetfileupload/", JogetFileUploadAPIView.as_view(), name="joget_file_upload"),
]

