from django.core.management.base import BaseCommand
from chatbot.models import UserProfile, Profile

class Command(BaseCommand):
    help = 'Assign the first available Profile to all UserProfiles without a profile.'

    def handle(self, *args, **options):
        default_profile = Profile.objects.first()
        if not default_profile:
            self.stdout.write(self.style.ERROR('No Profile found. Please create at least one Profile.'))
            return
        updated = UserProfile.objects.filter(profile__isnull=True).update(profile=default_profile)
        self.stdout.write(self.style.SUCCESS(f'Assigned profile "{default_profile.name}" to {updated} users.'))
