"""phase1 baseline with public content domain

Revision ID: 0001_phase1_baseline
Revises:
Create Date: 2026-03-31 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0001_phase1_baseline"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "hotel_master",
        sa.Column("hotel_id", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("name_ko", sa.String(), nullable=False),
        sa.Column("name_en", sa.String(), nullable=True),
        sa.Column("address_road", sa.String(), nullable=True),
        sa.Column("phone_main", sa.String(), nullable=True),
        sa.Column("check_in_time", sa.String(), nullable=True),
        sa.Column("check_out_time", sa.String(), nullable=True),
        sa.Column("latitude", sa.Numeric(), nullable=True),
        sa.Column("longitude", sa.Numeric(), nullable=True),
        sa.Column("source_confidence", sa.String(), nullable=True),
        sa.Column("verification_status", sa.String(), nullable=True),
        sa.Column("last_verified_at", sa.Date(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("hotel_id"),
    )

    op.create_table(
        "import_jobs",
        sa.Column("import_job_id", sa.String(), nullable=False),
        sa.Column("file_name", sa.String(), nullable=False),
        sa.Column("file_hash", sa.String(), nullable=True),
        sa.Column("source_type", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("created_by", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("import_job_id"),
    )

    op.create_table(
        "job_runs",
        sa.Column("job_run_id", sa.String(), nullable=False),
        sa.Column("import_job_id", sa.String(), nullable=False),
        sa.Column("run_status", sa.String(), nullable=False),
        sa.Column("rows_total", sa.Integer(), nullable=False),
        sa.Column("rows_succeeded", sa.Integer(), nullable=False),
        sa.Column("rows_failed", sa.Integer(), nullable=False),
        sa.Column("error_summary", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["import_job_id"], ["import_jobs.import_job_id"]),
        sa.PrimaryKeyConstraint("job_run_id"),
    )

    op.create_table(
        "audit_logs",
        sa.Column("audit_id", sa.String(), nullable=False),
        sa.Column("actor", sa.String(), nullable=False),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("entity_type", sa.String(), nullable=False),
        sa.Column("entity_id", sa.String(), nullable=True),
        sa.Column("detail_json", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("audit_id"),
    )

    op.create_table(
        "hotel_dining",
        sa.Column("dining_id", sa.String(), nullable=False),
        sa.Column("hotel_id", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("venue_name", sa.String(), nullable=False),
        sa.Column("venue_type", sa.String(), nullable=True),
        sa.Column("floor_location", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("breakfast_yn", sa.Boolean(), nullable=True),
        sa.Column("lunch_yn", sa.Boolean(), nullable=True),
        sa.Column("dinner_yn", sa.Boolean(), nullable=True),
        sa.Column("bar_yn", sa.Boolean(), nullable=True),
        sa.Column("hours_mon", sa.String(), nullable=True),
        sa.Column("hours_tue", sa.String(), nullable=True),
        sa.Column("hours_wed", sa.String(), nullable=True),
        sa.Column("hours_thu", sa.String(), nullable=True),
        sa.Column("hours_fri", sa.String(), nullable=True),
        sa.Column("hours_sat", sa.String(), nullable=True),
        sa.Column("hours_sun", sa.String(), nullable=True),
        sa.Column("holiday_hours", sa.String(), nullable=True),
        sa.Column("pricing_notes", sa.Text(), nullable=True),
        sa.Column("breakfast_adult_price_krw", sa.Integer(), nullable=True),
        sa.Column("breakfast_child_price_krw", sa.Integer(), nullable=True),
        sa.Column("source_confidence", sa.String(), nullable=True),
        sa.Column("last_verified_at", sa.Date(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["hotel_id"], ["hotel_master.hotel_id"]),
        sa.PrimaryKeyConstraint("dining_id"),
    )

    op.create_table(
        "hotel_facilities",
        sa.Column("facility_id", sa.String(), nullable=False),
        sa.Column("hotel_id", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("facility_name", sa.String(), nullable=False),
        sa.Column("facility_type", sa.String(), nullable=True),
        sa.Column("floor_location", sa.String(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("hours_mon", sa.String(), nullable=True),
        sa.Column("hours_tue", sa.String(), nullable=True),
        sa.Column("hours_wed", sa.String(), nullable=True),
        sa.Column("hours_thu", sa.String(), nullable=True),
        sa.Column("hours_fri", sa.String(), nullable=True),
        sa.Column("hours_sat", sa.String(), nullable=True),
        sa.Column("hours_sun", sa.String(), nullable=True),
        sa.Column("fee_required_yn", sa.Boolean(), nullable=True),
        sa.Column("fee_note", sa.Text(), nullable=True),
        sa.Column("age_limit_min", sa.Integer(), nullable=True),
        sa.Column("age_policy_note", sa.Text(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("source_confidence", sa.String(), nullable=True),
        sa.Column("last_verified_at", sa.Date(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["hotel_id"], ["hotel_master.hotel_id"]),
        sa.PrimaryKeyConstraint("facility_id"),
    )

    op.create_table(
        "hotel_services",
        sa.Column("service_id", sa.String(), nullable=False),
        sa.Column("hotel_id", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("service_name", sa.String(), nullable=False),
        sa.Column("service_category", sa.String(), nullable=True),
        sa.Column("request_channel", sa.String(), nullable=True),
        sa.Column("service_hours", sa.String(), nullable=True),
        sa.Column("reservation_required_yn", sa.Boolean(), nullable=True),
        sa.Column("fee_required_yn", sa.Boolean(), nullable=True),
        sa.Column("fee_note", sa.Text(), nullable=True),
        sa.Column("language_support_csv", sa.Text(), nullable=True),
        sa.Column("service_note", sa.Text(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("source_confidence", sa.String(), nullable=True),
        sa.Column("last_verified_at", sa.Date(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["hotel_id"], ["hotel_master.hotel_id"]),
        sa.PrimaryKeyConstraint("service_id"),
    )

    op.create_table(
        "transport_access",
        sa.Column("transport_id", sa.String(), nullable=False),
        sa.Column("hotel_id", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("origin_name", sa.String(), nullable=False),
        sa.Column("origin_type", sa.String(), nullable=True),
        sa.Column("transport_mode", sa.String(), nullable=True),
        sa.Column("recommended_yn", sa.Boolean(), nullable=True),
        sa.Column("distance_km", sa.Numeric(), nullable=True),
        sa.Column("duration_min", sa.Integer(), nullable=True),
        sa.Column("fare_note", sa.Text(), nullable=True),
        sa.Column("first_service_time", sa.String(), nullable=True),
        sa.Column("last_service_time", sa.String(), nullable=True),
        sa.Column("route_detail", sa.Text(), nullable=True),
        sa.Column("source_confidence", sa.String(), nullable=True),
        sa.Column("last_verified_at", sa.Date(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["hotel_id"], ["hotel_master.hotel_id"]),
        sa.PrimaryKeyConstraint("transport_id"),
    )

    op.create_table(
        "nearby_places",
        sa.Column("place_id", sa.String(), nullable=False),
        sa.Column("hotel_id", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("place_name", sa.String(), nullable=False),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("subcategory", sa.String(), nullable=True),
        sa.Column("description_short", sa.Text(), nullable=True),
        sa.Column("address", sa.String(), nullable=True),
        sa.Column("latitude", sa.Numeric(), nullable=True),
        sa.Column("longitude", sa.Numeric(), nullable=True),
        sa.Column("hotel_distance_km", sa.Numeric(), nullable=True),
        sa.Column("walk_time_min", sa.Integer(), nullable=True),
        sa.Column("drive_time_min", sa.Integer(), nullable=True),
        sa.Column("transit_time_min", sa.Integer(), nullable=True),
        sa.Column("child_friendly_yn", sa.Boolean(), nullable=True),
        sa.Column("pet_friendly_yn", sa.Boolean(), nullable=True),
        sa.Column("late_night_yn", sa.Boolean(), nullable=True),
        sa.Column("tags_csv", sa.Text(), nullable=True),
        sa.Column("source_confidence", sa.String(), nullable=True),
        sa.Column("verification_status", sa.String(), nullable=True),
        sa.Column("last_verified_at", sa.Date(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["hotel_id"], ["hotel_master.hotel_id"]),
        sa.PrimaryKeyConstraint("place_id"),
    )

    op.create_table(
        "nearby_routes",
        sa.Column("route_id", sa.String(), nullable=False),
        sa.Column("hotel_id", sa.String(), nullable=False),
        sa.Column("destination_place_id", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("start_point", sa.String(), nullable=True),
        sa.Column("transport_mode", sa.String(), nullable=True),
        sa.Column("estimated_duration_min", sa.Integer(), nullable=True),
        sa.Column("step_1", sa.Text(), nullable=True),
        sa.Column("step_2", sa.Text(), nullable=True),
        sa.Column("step_3", sa.Text(), nullable=True),
        sa.Column("step_4", sa.Text(), nullable=True),
        sa.Column("stairs_yn", sa.Boolean(), nullable=True),
        sa.Column("elevator_yn", sa.Boolean(), nullable=True),
        sa.Column("wheelchair_note", sa.Text(), nullable=True),
        sa.Column("source_confidence", sa.String(), nullable=True),
        sa.Column("last_verified_at", sa.Date(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["destination_place_id"], ["nearby_places.place_id"]),
        sa.ForeignKeyConstraint(["hotel_id"], ["hotel_master.hotel_id"]),
        sa.PrimaryKeyConstraint("route_id"),
    )

    op.create_table(
        "emergency_safety",
        sa.Column("emergency_id", sa.String(), nullable=False),
        sa.Column("hotel_id", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("contact_name", sa.String(), nullable=False),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("address", sa.String(), nullable=True),
        sa.Column("hotel_distance_km", sa.Numeric(), nullable=True),
        sa.Column("drive_time_min", sa.Integer(), nullable=True),
        sa.Column("available_24h_yn", sa.Boolean(), nullable=True),
        sa.Column("language_support_note", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("source_confidence", sa.String(), nullable=True),
        sa.Column("last_verified_at", sa.Date(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["hotel_id"], ["hotel_master.hotel_id"]),
        sa.PrimaryKeyConstraint("emergency_id"),
    )

    op.create_table(
        "faq_intents",
        sa.Column("intent_id", sa.String(), nullable=False),
        sa.Column("hotel_id", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("intent_group", sa.String(), nullable=True),
        sa.Column("user_question_example_ko", sa.Text(), nullable=True),
        sa.Column("user_question_example_en", sa.Text(), nullable=True),
        sa.Column("answer_template_ko", sa.Text(), nullable=True),
        sa.Column("answer_template_en", sa.Text(), nullable=True),
        sa.Column("primary_sheet", sa.String(), nullable=True),
        sa.Column("primary_lookup_key", sa.String(), nullable=True),
        sa.Column("escalation_required_yn", sa.Boolean(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["hotel_id"], ["hotel_master.hotel_id"]),
        sa.PrimaryKeyConstraint("intent_id"),
    )

    op.create_table(
        "kiosk_devices",
        sa.Column("device_id", sa.String(), nullable=False),
        sa.Column("hotel_id", sa.String(), nullable=False),
        sa.Column("device_name", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("current_url", sa.String(), nullable=True),
        sa.Column("app_version", sa.String(), nullable=True),
        sa.Column("content_version", sa.String(), nullable=True),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["hotel_id"], ["hotel_master.hotel_id"]),
        sa.PrimaryKeyConstraint("device_id"),
    )

    op.create_table(
        "temporary_notices",
        sa.Column("notice_id", sa.String(), nullable=False),
        sa.Column("hotel_id", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("target_type", sa.String(), nullable=True),
        sa.Column("target_id", sa.String(), nullable=True),
        sa.Column("notice_title", sa.String(), nullable=True),
        sa.Column("notice_body", sa.Text(), nullable=True),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("impact_level", sa.String(), nullable=True),
        sa.Column("alternate_option", sa.Text(), nullable=True),
        sa.Column("source_confidence", sa.String(), nullable=True),
        sa.Column("last_verified_at", sa.Date(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["hotel_id"], ["hotel_master.hotel_id"]),
        sa.PrimaryKeyConstraint("notice_id"),
    )

    op.create_table(
        "conflicts_log",
        sa.Column("conflict_id", sa.String(), nullable=False),
        sa.Column("hotel_id", sa.String(), nullable=False),
        sa.Column("entity_type", sa.String(), nullable=False),
        sa.Column("entity_id", sa.String(), nullable=True),
        sa.Column("field_name", sa.String(), nullable=False),
        sa.Column("value_a", sa.Text(), nullable=True),
        sa.Column("source_a_url", sa.Text(), nullable=True),
        sa.Column("value_b", sa.Text(), nullable=True),
        sa.Column("source_b_url", sa.Text(), nullable=True),
        sa.Column("recommended_action", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("last_verified_at", sa.Date(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("resolved_value", sa.Text(), nullable=True),
        sa.Column("resolved_note", sa.Text(), nullable=True),
        sa.Column("resolved_by", sa.String(), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["hotel_id"], ["hotel_master.hotel_id"]),
        sa.PrimaryKeyConstraint("conflict_id"),
    )

    op.create_table(
        "publish_versions",
        sa.Column("publish_version_id", sa.String(), nullable=False),
        sa.Column("hotel_id", sa.String(), nullable=False),
        sa.Column("version_no", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="draft"),
        sa.Column("snapshot_path", sa.String(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["hotel_id"], ["hotel_master.hotel_id"]),
        sa.PrimaryKeyConstraint("publish_version_id"),
    )


def downgrade() -> None:
    op.drop_table("publish_versions")
    op.drop_table("conflicts_log")
    op.drop_table("temporary_notices")
    op.drop_table("kiosk_devices")
    op.drop_table("faq_intents")
    op.drop_table("emergency_safety")
    op.drop_table("nearby_routes")
    op.drop_table("nearby_places")
    op.drop_table("transport_access")
    op.drop_table("hotel_services")
    op.drop_table("hotel_facilities")
    op.drop_table("hotel_dining")
    op.drop_table("audit_logs")
    op.drop_table("job_runs")
    op.drop_table("import_jobs")
    op.drop_table("hotel_master")
