from django.contrib import admin
from django.forms import ModelForm
from django.forms.widgets import CheckboxSelectMultiple
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
