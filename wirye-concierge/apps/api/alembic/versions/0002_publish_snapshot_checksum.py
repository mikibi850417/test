"""add snapshot checksum to publish versions

Revision ID: 0002_publish_snapshot_checksum
Revises: 0001_phase1_baseline
Create Date: 2026-03-31 00:00:01.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0002_publish_snapshot_checksum"
down_revision: Union[str, Sequence[str], None] = "0001_phase1_baseline"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("publish_versions", sa.Column("snapshot_checksum", sa.String(length=64), nullable=True))


def downgrade() -> None:
    op.drop_column("publish_versions", "snapshot_checksum")
