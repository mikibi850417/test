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

export type FaqSearchItem = {
  intent_id: string;
  question_example_ko?: string | null;
  question_example_en?: string | null;
  answer_template_ko?: string | null;
  answer_template_en?: string | null;
};

export type RankedFaqMatch<T extends FaqSearchItem> = {
  item: T;
  score: number;
  matchedChunk: string;
};

type RankOptions = {
  maxResults?: number;
  minScore?: number;
};

const STATIC_PLACEHOLDER_MAP: Record<string, string> = {
  "hotel_master.check_out_conflict_note": "운영 상황에 따라 변동될 수 있으니 프런트에 확인해 주세요",
  "hotel_master.luggage_storage_note": "체크아웃 이후에도 프런트에서 짐 보관을 도와드립니다",
  "hotel_policies.POLICY_LATE_CHECKIN.policy_detail_ko":
    "22시 이후 도착 예정이면 호텔로 사전 연락이 필요합니다",
  "hotel_policies.POLICY_POOL_RULES.policy_detail_ko":
    "수영장 이용 시 수모 착용이 필요하며 외부 음식과 유리 용기 반입은 제한됩니다",
  "hotel_dining.DINING_BREAKFAST.breakfast_free_policy": "48개월 미만 무료",
};

const NON_TEXT_REGEX = /[^\p{L}\p{N}\s]/gu;
const SPACE_REGEX = /\s+/g;
const SENTENCE_SPLIT_REGEX = /[\r\n]+|(?<=[.!?。！？])\s+/g;
const STOP_WORDS = new Set([
  "은",
  "는",
  "이",
  "가",
  "을",
  "를",
  "에",
  "의",
  "도",
  "좀",
  "좀요",
  "해주세요",
  "해줘",
  "알려줘",
  "알려주세요",
  "what",
  "is",
  "are",
  "the",
  "a",
  "an",
  "to",
  "for",
  "of",
  "and",
]);

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

function setValue(
  target: Record<string, string>,
  key: string,
  value: string | number | null | undefined,
) {
  const text = toText(value);
  if (text.length > 0) {
    target[key] = text;
  }
}

function ensurePunctuation(text: string): string {
  if (text.length === 0) {
    return text;
  }
  if (/[.!?。！？]$/.test(text)) {
    return text;
  }
  return `${text}.`;
}

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(NON_TEXT_REGEX, " ")
    .replace(SPACE_REGEX, " ")
    .trim();
}

function tokenize(text: string): string[] {
  const normalized = normalizeForMatch(text);
  if (!normalized) {
    return [];
  }

  const tokens = normalized
    .split(" ")
    .filter((token) => token.length > 1)
    .filter((token) => !STOP_WORDS.has(token));

  return Array.from(new Set(tokens));
}

function splitToChunks(text: string): string[] {
  return text
    .split(SENTENCE_SPLIT_REGEX)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);
}

function scoreChunk(question: string, chunk: string): number {
  const normalizedQuestion = normalizeForMatch(question);
  const normalizedChunk = normalizeForMatch(chunk);

  if (!normalizedQuestion || !normalizedChunk) {
    return 0;
  }

  const questionTokens = tokenize(normalizedQuestion);
  const chunkTokens = new Set(tokenize(normalizedChunk));
  let score = 0;

  if (normalizedChunk.includes(normalizedQuestion)) {
    score += 30;
  }

  let hitCount = 0;
  for (const token of questionTokens) {
    if (!chunkTokens.has(token)) {
      continue;
    }
    hitCount += 1;
    score += Math.min(6, token.length);
  }

  if (questionTokens.length > 0) {
    const coverage = hitCount / questionTokens.length;
    score += Math.round(coverage * 20);
  }

  return score;
}

function pickTopScoredChunks(question: string, chunks: string[], maxChunks: number): string[] {
  if (chunks.length <= 1 || maxChunks <= 0) {
    return chunks.slice(0, Math.max(0, maxChunks));
  }

  const scored = chunks
    .map((chunk, index) => ({ chunk, index, score: scoreChunk(question, chunk) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, maxChunks)
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.chunk);

  if (scored.length > 0) {
    return scored;
  }

  return chunks.slice(0, 1);
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
    return "안내 가능한 답변이 아직 없습니다.";
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
      .replace(SPACE_REGEX, " ")
      .replace(/\s+([,.!?。！？])/g, "$1")
      .replace(/(현장 확인 필요\s+){2,}/g, "현장 확인 필요 ")
      .trim(),
  );

  if (unresolvedCount > 0) {
    return `${cleaned} 일부 정보는 실시간 확인이 필요합니다.`;
  }

  return cleaned;
}

export function rankFaqByQuestion<T extends FaqSearchItem>(
  items: T[],
  question: string,
  options?: RankOptions,
): RankedFaqMatch<T>[] {
  if (items.length === 0) {
    return [];
  }

  const maxResults = options?.maxResults ?? 3;
  const minScore = options?.minScore ?? 12;
  const normalizedQuestion = normalizeForMatch(question);

  if (!normalizedQuestion) {
    return items.slice(0, maxResults).map((item) => ({
      item,
      score: 0,
      matchedChunk: "",
    }));
  }

  const ranked = items
    .map((item) => {
      const searchable = [
        item.question_example_ko,
        item.question_example_en,
        item.answer_template_ko,
        item.answer_template_en,
      ]
        .filter(Boolean)
        .join("\n");

      const chunks = splitToChunks(searchable);
      if (chunks.length === 0) {
        return null;
      }

      let bestScore = 0;
      let bestChunk = "";
      for (const chunk of chunks) {
        const chunkScore = scoreChunk(normalizedQuestion, chunk);
        if (chunkScore <= bestScore) {
          continue;
        }
        bestScore = chunkScore;
        bestChunk = chunk;
      }

      if (bestScore <= 0) {
        return null;
      }

      return {
        item,
        score: bestScore,
        matchedChunk: bestChunk,
      };
    })
    .filter((entry): entry is RankedFaqMatch<T> => entry !== null)
    .sort((a, b) => b.score - a.score);

  const filtered = ranked.filter((entry) => entry.score >= minScore);
  if (filtered.length > 0) {
    return filtered.slice(0, maxResults);
  }

  return ranked.slice(0, maxResults);
}

export function extractRelevantAnswerChunks(
  answer: string | null | undefined,
  question: string,
  maxChunks = 2,
): string {
  if (!answer) {
    return "";
  }

  const chunks = splitToChunks(answer);
  if (chunks.length === 0) {
    return "";
  }

  const selected = pickTopScoredChunks(question, chunks, maxChunks);
  if (selected.length === 0) {
    return "";
  }

  return ensurePunctuation(selected.join(" ").replace(SPACE_REGEX, " ").trim());
}
