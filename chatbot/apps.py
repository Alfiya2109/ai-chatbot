from django.apps import AppConfig


class ChatbotConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chatbot'

def ready(self):
    import chatbot.signals
    
    
    
import os
import whisper
from pydub import AudioSegment
from django.conf import settings
from datetime import datetime
 
AUDIO_DIR = os.path.join(settings.MEDIA_ROOT, "recordings")
os.makedirs(AUDIO_DIR, exist_ok=True)
 
def convert_to_wav(input_file_path):
    if input_file_path.endswith(".wav"):
        return input_file_path
    # AudioSegment.converter = r"C:\ffmpeg\bin\ffmpeg.exe"
    audio = AudioSegment.from_file(input_file_path)
    wav_path = input_file_path.rsplit(".", 1)[0] + ".wav"
    audio.export(wav_path, format="wav")
    return wav_path
 
def transcribe_audio_whisper(file_path):
    model = whisper.load_model("base")  # You can use "small", "medium", or "large"
    result = model.transcribe(file_path)
    return result.get("text", "")
   
 

 