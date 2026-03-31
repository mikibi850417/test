from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = Field(default="wirye-militopia-kiosk", alias="APP_NAME")
    app_env: Literal["development", "staging", "production"] = Field(
        default="development", alias="APP_ENV"
    )

    database_url: str = Field(
        default="postgresql+psycopg://wirye_app:change_me@postgres:5432/wirye_kiosk",
        alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://redis:6379/0", alias="REDIS_URL")
    snapshot_dir: str = Field(default="/app/data/snapshots", alias="SNAPSHOT_DIR")
    import_tmp_dir: str = Field(default="/app/data/imports", alias="IMPORT_TMP_DIR")
    jwt_secret: str = Field(default="change_me_super_long_secret", alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    admin_bootstrap_email: str = Field(default="admin@wirye.local", alias="ADMIN_BOOTSTRAP_EMAIL")
    admin_bootstrap_password: str = Field(default="change_me_admin", alias="ADMIN_BOOTSTRAP_PASSWORD")


@lru_cache
def get_settings() -> Settings:
    return Settings()
