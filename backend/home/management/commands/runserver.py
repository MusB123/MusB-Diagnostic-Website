import os
from django.conf import settings
from django.core.management.commands.runserver import Command as RunserverCommand


class Command(RunserverCommand):
    """
    Custom runserver command that displays a premium startup header.
    """
    def inner_run(self, *args, **options):
        # 1. Get the port safely
        addrport = options.get('addrport') or '8000'
        port = addrport.split(':')[-1]
        
        # 2. Check MongoDB status
        try:
            from musb_backend import mongodb

            db = mongodb.get_db()
            if getattr(settings, 'MONGO_USE_MOCK', False):
                db_status = "Mock DB (MONGO_USE_MOCK=true)"
            else:
                db_status = f"MongoDB ({settings.MONGO_DB_NAME})"
        except Exception as exc:
            db_status = f"MongoDB error: {exc}"

        # 3. Print the Premium Header
        # Using simple ASCII for maximum compatibility across terminals
        print("\n" + "=" * 41)
        print(f">>> SERVER STATUS: RUNNING on port {port}")
        print(f">>> DATABASE STATUS: {db_status}")
        print("=" * 41 + "\n")

        # 4. Continue with standard Django runserver
        super().inner_run(*args, **options)
