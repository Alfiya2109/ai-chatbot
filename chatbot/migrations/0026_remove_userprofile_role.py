from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('chatbot', '0025_userprofile_profile'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='userprofile',
            name='role',
        ),
    ]
