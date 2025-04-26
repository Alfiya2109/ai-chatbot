from django.contrib import admin
from .models import *

# Register your models here.
admin.site.register(UserProfile)
admin.site.register(ChatLog)
admin.site.register(Feedback)
admin.site.register(ChatbotCategory)
admin.site.register(ChatbotSubCategory)