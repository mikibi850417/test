"""add import job approval fields

Revision ID: 0003_import_job_approval
Revises: 0002_publish_snapshot_checksum
Create Date: 2026-04-01 00:00:02.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0003_import_job_approval"
down_revision: Union[str, Sequence[str], None] = "0002_publish_snapshot_checksum"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("import_jobs", sa.Column("approved_by", sa.String(), nullable=True))
    op.add_column("import_jobs", sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("import_jobs", "approved_at")
    op.drop_column("import_jobs", "approved_by")
