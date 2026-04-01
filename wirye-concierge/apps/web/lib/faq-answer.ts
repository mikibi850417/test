type HomePayload = {
  hotel?: {
    check_in_time?: string | null;
    check_out_time?: string | null;
    phone?: string | null;
  };
};

type DiningPayload = {
  items?: Array<{
    dining_id: string;
    venue_name_kr?: string | null;
    floor_location?: string | null;
    hours_mon?: string | null;
    operating_hours?: string | null;
    breakfast_adult_price_krw?: number | null;
    breakfast_child_price_krw?: number | null;
  }>;
};

type FacilityPayload = {
  items?: Array<{
    facility_id: string;
    facility_name?: string | null;
    hours_mon?: string | null;
    hours_sat?: string | null;
    hours_sun?: string | null;
    fee_note?: string | null;
    age_policy_note?: string | null;
  }>;
};

type ServicePayload = {
  items?: Array<{
    service_id: string;
    service_name?: string | null;
    fee_note?: string | null;
  }>;
};

type TransportPayload = {
  items?: Array<{
    transport_id: string;
    route_detail?: string | null;
  }>;
};

type NearbyPayload = {
  items?: Array<{
    place_id: string;
    name_kr?: string | null;
    walk_minutes_display?: number | null;
  }>;
};

type EmergencyPayload = {
  items?: Array<{
    emergency_id: string;
    contact_name?: string | null;
    phone?: string | null;
  }>;
};

export type FaqTemplateContext = {
  home?: HomePayload | null;
  dining?: DiningPayload | null;
  facilities?: FacilityPayload | null;
  services?: ServicePayload | null;
  transport?: TransportPayload | null;
  nearby?: NearbyPayload | null;
  emergency?: EmergencyPayload | null;
};

const STATIC_PLACEHOLDER_MAP: Record<string, string> = {
  "hotel_master.check_out_conflict_note": "프런트 데스크에서 최신 정보",
  "hotel_master.luggage_storage_note": "짐은 체크인 전후로 프런트 데스크 보관 요청이 가능합니다.",
  "hotel_policies.POLICY_LATE_CHECKIN.policy_detail_ko":
    "22:00 이후 도착 예정이면 호텔로 사전 연락이 필요합니다.",
  "hotel_policies.POLICY_POOL_RULES.policy_detail_ko":
    "실내수영복, 수모, 수경 착용이 필요하며 외부 음식물과 물놀이 용품 반입은 제한됩니다.",
  "hotel_dining.DINING_BREAKFAST.breakfast_free_policy": "48개월 미만 무료",
};

function toText(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return "";
    }
    return Number.isInteger(value) ? value.toLocaleString("ko-KR") : value.toString();
  }

  return value.trim();
}

function setValue(target: Record<string, string>, key: string, value: string | number | null | undefined) {
  const text = toText(value);
  if (text.length > 0) {
    target[key] = text;
  }
}

function ensurePunctuation(text: string): string {
  if (text.length === 0) {
    return text;
  }
  if (/[.!?]$/.test(text)) {
    return text;
  }
  return `${text}.`;
}

export function buildFaqPlaceholderMap(context: FaqTemplateContext): Record<string, string> {
  const map: Record<string, string> = { ...STATIC_PLACEHOLDER_MAP };
  const hotel = context.home?.hotel;

  if (hotel) {
    setValue(map, "hotel_master.check_in_time", hotel.check_in_time);
    setValue(map, "hotel_master.check_out_time", hotel.check_out_time);
    setValue(map, "hotel_master.phone_main", hotel.phone);
  }

  for (const item of context.dining?.items ?? []) {
    const prefix = `hotel_dining.${item.dining_id}`;
    setValue(map, `${prefix}.venue_name`, item.venue_name_kr);
    setValue(map, `${prefix}.floor_location`, item.floor_location);
    setValue(map, `${prefix}.hours_mon`, item.hours_mon ?? item.operating_hours);
    setValue(map, `${prefix}.breakfast_adult_price_krw`, item.breakfast_adult_price_krw);
    setValue(map, `${prefix}.breakfast_child_price_krw`, item.breakfast_child_price_krw);
  }

  for (const item of context.facilities?.items ?? []) {
    const prefix = `hotel_facilities.${item.facility_id}`;
    setValue(map, `${prefix}.facility_name`, item.facility_name);
    setValue(map, `${prefix}.hours_mon`, item.hours_mon);
    setValue(map, `${prefix}.hours_sat`, item.hours_sat);
    setValue(map, `${prefix}.hours_sun`, item.hours_sun);
    setValue(map, `${prefix}.fee_note`, item.fee_note);
    setValue(map, `${prefix}.age_policy_note`, item.age_policy_note);
  }

  for (const item of context.services?.items ?? []) {
    const prefix = `hotel_services.${item.service_id}`;
    setValue(map, `${prefix}.service_name`, item.service_name);
    setValue(map, `${prefix}.fee_note`, item.fee_note);
  }

  for (const item of context.transport?.items ?? []) {
    const prefix = `transport_access.${item.transport_id}`;
    setValue(map, `${prefix}.route_detail`, item.route_detail);
  }

  for (const item of context.nearby?.items ?? []) {
    const prefix = `nearby_places.${item.place_id}`;
    setValue(map, `${prefix}.place_name`, item.name_kr);
    setValue(map, `${prefix}.walk_time_min`, item.walk_minutes_display);
  }

  for (const item of context.emergency?.items ?? []) {
    const prefix = `emergency_safety.${item.emergency_id}`;
    setValue(map, `${prefix}.contact_name`, item.contact_name);
    setValue(map, `${prefix}.phone`, item.phone);
  }

  return map;
}

export function resolveFaqTemplate(
  template: string | null | undefined,
  placeholderMap: Record<string, string>,
): string {
  if (!template || template.trim().length === 0) {
    return "안내 가능한 답변이 없습니다.";
  }

  let unresolvedCount = 0;
  const replaced = template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, token: string) => {
    const key = token.trim();
    const value = placeholderMap[key];
    if (value && value.trim().length > 0) {
      return value.trim();
    }
    unresolvedCount += 1;
    return "현장 확인 필요";
  });

  const cleaned = ensurePunctuation(
    replaced
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([,.!?])/g, "$1")
      .replace(/현장 확인 필요\s+현장 확인 필요/g, "현장 확인 필요")
      .trim(),
  );

  if (unresolvedCount > 0) {
    return `${cleaned} 일부 항목은 프런트 데스크에서 최신 정보를 확인해 주세요.`;
  }

  return cleaned;
}
