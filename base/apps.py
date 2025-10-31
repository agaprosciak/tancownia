from django.apps import AppConfig


class BaseConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'base'
    def ready(self):
        # Importujemy signals dopiero po załadowaniu modeli
        import base.signals.image_signals
        import base.signals.styles_signals
        import base.signals.rating_signals