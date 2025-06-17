from django.contrib import admin
from django.forms import ModelForm
from django.forms.widgets import CheckboxSelectMultiple
from django.utils.html import format_html
from .models import *

# Define a custom form to use checkboxes
class ChatLogForm(ModelForm):
    class Meta:
        model = ChatLog
        fields = '__all__'
        widgets = {
            'category': CheckboxSelectMultiple,  # This makes the category field use checkboxes
            'subcategory': CheckboxSelectMultiple,  # This makes the subcategory field use checkboxes
        }

# ChatLog admin customization
class ChatLogAdmin(admin.ModelAdmin):
    form = ChatLogForm
    # list_display = ('id', 'user', 'timestamp', 'is_correct')
    filter_horizontal = ('category', 'subcategory')  # Optionally keep the horizontal filter if needed

# Register your models here
admin.site.register(UserProfile)
admin.site.register(Feedback)
admin.site.register(ChatbotCategory)
admin.site.register(ChatbotSubCategory)
admin.site.register(ChatLog, ChatLogAdmin)
admin.site.register(Files_upload)
admin.site.register(TextContent)
admin.site.register(ExcelFile)
admin.site.register(QAData)
admin.site.register(ChatSession)
admin.site.register(Profile)
admin.site.register(KnowledgeBase)

# admin for folder upload
@admin.register(FileData)
class FileDataAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at')
    search_fields = ('title',)
    list_filter = ('created_at',)

@admin.register(DocumentFileData)
class DocumentFileDataAdmin(admin.ModelAdmin):
    list_display = ('file', 'file_data', 'uploaded_at')
    search_fields = ('file',)
    list_filter = ('uploaded_at', 'file_data')

@admin.register(ExcelFileData)
class ExcelFileDataAdmin(admin.ModelAdmin):
    list_display = ('file', 'file_data', 'uploaded_at')
    search_fields = ('file',)
    list_filter = ('uploaded_at', 'file_data')

@admin.register(SitemapFetch)
class SitemapFetchAdmin(admin.ModelAdmin):
    list_display = ('url', 'fetched_at', 'status')
    search_fields = ('url',)
    readonly_fields = ('fetched_at', 'urls', 'status', 'error')

@admin.register(GoogleDriveFileData)
class GoogleDriveFileDataAdmin(admin.ModelAdmin):
    list_display = ('file_id', 'file_name', 'mime_type', 'uploaded_at', 'view_link')
    search_fields = ('file_id', 'file_name')

    def view_link(self, obj):
        url = f"https://drive.google.com/file/d/{obj.file_id}/view"
        return format_html('<a href="{}" target="_blank">View</a>', url)
    view_link.short_description = "View on Google Drive"

@admin.register(GoogleDriveDocumentFileData)
class GoogleDriveDocumentFileDataAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'file_id', 'file_data', 'uploaded_at', 'view_on_drive')
    search_fields = ('file_name', 'file_id')
    list_filter = ('uploaded_at', 'file_data')
    readonly_fields = ('view_on_drive',)

    def view_on_drive(self, obj):
        url = f"https://drive.google.com/file/d/{obj.file_id}/view"
        return format_html('<a href="{}" target="_blank">View on Google Drive</a>', url)
    view_on_drive.short_description = "View on Google Drive"

@admin.register(GoogleDriveExcelFileData)
class GoogleDriveExcelFileDataAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'file_id', 'file_data', 'uploaded_at', 'view_on_drive')
    search_fields = ('file_name', 'file_id')
    list_filter = ('uploaded_at', 'file_data')
    readonly_fields = ('view_on_drive',)

    def view_on_drive(self, obj):
        url = f"https://drive.google.com/file/d/{obj.file_id}/view"
        return format_html('<a href="{}" target="_blank">View on Google Drive</a>', url)
    view_on_drive.short_description = "View on Google Drive"

