import {
  buildFaqPlaceholderMap,
  extractRelevantAnswerChunks,
  rankFaqByQuestion,
  resolveFaqTemplate,
} from "@/lib/faq-answer";
import { fetchPublicPath } from "@/lib/public-api";

type VoiceAction =
  | "home"
  | "hotel"
  | "dining"
  | "facilities"
  | "services"
  | "transport"
  | "nearby"
  | "emergency"
  | "notices"
  | "faq";

type ListPayload<T> = {
  items?: T[];
};

type HomePayload = {
  hotel?: {
    name_kr?: string | null;
    phone?: string | null;
    check_in_time?: string | null;
    check_out_time?: string | null;
  };
};

type DiningItem = {
  dining_id: string;
  venue_name_kr?: string | null;
  floor_location?: string | null;
  hours_mon?: string | null;
  operating_hours?: string | null;
};

type FacilityItem = {
  facility_id: string;
  facility_name?: string | null;
  hours_mon?: string | null;
  hours_sat?: string | null;
  hours_sun?: string | null;
};

type ServiceItem = {
  service_id: string;
  service_name?: string | null;
  fee_note?: string | null;
};

type TransportItem = {
  transport_id: string;
  origin_name?: string | null;
  recommended_yn?: boolean | null;
  route_detail?: string | null;
};

type NearbyItem = {
  place_id: string;
  name_kr?: string | null;
  walk_minutes_display?: number | null;
};

type EmergencyItem = {
  emergency_id: string;
  contact_name?: string | null;
  phone?: string | null;
};

type NoticeItem = {
  notice_id: string;
  title?: string | null;
};

type FaqItem = {
  intent_id: string;
  question_example_ko?: string | null;
  question_example_en?: string | null;
  answer_template_ko?: string | null;
  answer_template_en?: string | null;
};

type FaqHit = {
  question: string;
  answer: string;
  score: number;
};

type ConciergeContext = {
  home: HomePayload | null;
  dining: ListPayload<DiningItem> | null;
  facilities: ListPayload<FacilityItem> | null;
  services: ListPayload<ServiceItem> | null;
  transport: ListPayload<TransportItem> | null;
  nearby: ListPayload<NearbyItem> | null;
  emergency: ListPayload<EmergencyItem> | null;
  notices: ListPayload<NoticeItem> | null;
  faqHits: FaqHit[];
};

type GeminiPart = {
  text?: string;
};

type GeminiApiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
};

export type ConciergeResponse = {
  reply: string;
  tts: string;
  route: string;
  chunks: string[];
  provider: "gemini" | "fallback";
  reason?: string;
};

const SPACE_REGEX = /\s+/g;
const PLACEHOLDER_REGEX = /\{\{\s*[^}]+?\s*\}\}/g;
const SENTENCE_SPLIT_REGEX = /[\r\n]+|(?<=[.!?。！？])\s+/g;

const ROUTE_BY_ACTION: Record<VoiceAction, string> = {
  home: "/",
  hotel: "/hotel",
  dining: "/dining",
  facilities: "/facilities",
  services: "/services",
  transport: "/transport",
  nearby: "/nearby",
  emergency: "/emergency",
  notices: "/notices",
  faq: "/faq",
};

const ROUTE_ALIAS_TO_ACTION: Record<string, VoiceAction> = {
  "/": "home",
  home: "home",
  main: "home",
  hotel: "hotel",
  dining: "dining",
  facilities: "facilities",
  facility: "facilities",
  services: "services",
  service: "services",
  transport: "transport",
  nearby: "nearby",
  emergency: "emergency",
  notices: "notices",
  notice: "notices",
  faq: "faq",
};

function normalizeText(input: string): string {
  return input.trim().toLowerCase();
}

function hasAnyKeyword(source: string, keywords: string[]): boolean {
  return keywords.some((keyword) => source.includes(keyword));
}

function detectAction(question: string): VoiceAction {
  const q = normalizeText(question);

  if (hasAnyKeyword(q, ["홈", "메인", "처음", "home", "main"])) {
    return "home";
  }
  if (
    hasAnyKeyword(q, [
      "호텔",
      "체크인",
      "체크아웃",
      "전화",
      "번호",
      "주소",
      "hotel",
      "checkin",
      "checkout",
    ])
  ) {
    return "hotel";
  }
  if (hasAnyKeyword(q, ["다이닝", "식당", "레스토랑", "조식", "석식", "카페", "dining", "breakfast"])) {
    return "dining";
  }
  if (hasAnyKeyword(q, ["시설", "부대시설", "피트니스", "수영장", "사우나", "facility", "gym"])) {
    return "facilities";
  }
  if (hasAnyKeyword(q, ["서비스", "룸서비스", "컨시어지", "프런트", "service", "concierge"])) {
    return "services";
  }
  if (hasAnyKeyword(q, ["교통", "가는 길", "지하철", "버스", "공항", "택시", "transport", "subway", "airport"])) {
    return "transport";
  }
  if (hasAnyKeyword(q, ["주변", "근처", "관광", "명소", "맛집", "nearby", "attraction"])) {
    return "nearby";
  }
  if (hasAnyKeyword(q, ["응급", "병원", "약국", "경찰", "비상", "emergency", "hospital", "pharmacy"])) {
    return "emergency";
  }
  if (hasAnyKeyword(q, ["공지", "알림", "노티스", "notice", "announcement"])) {
    return "notices";
  }
  return "faq";
}

function pickTopLabels(values: Array<string | null | undefined>, limit = 3): string {
  return values
    .filter((value): value is string => Boolean(value && value.trim()))
    .slice(0, limit)
    .join(", ");
}

function sanitizeText(input: string): string {
  return input
    .replace(PLACEHOLDER_REGEX, "")
    .replace(SPACE_REGEX, " ")
    .trim();
}

function ensurePunctuation(text: string): string {
  if (!text) {
    return text;
  }
  if (/[.!?。！？]$/.test(text)) {
    return text;
  }
  return `${text}.`;
}

function truncateText(text: string, maxLength = 240): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function toChunks(text: string, maxChunks = 2): string[] {
  const chunks = text
    .split(SENTENCE_SPLIT_REGEX)
    .map((chunk) => sanitizeText(chunk))
    .filter((chunk) => chunk.length > 0);
  if (chunks.length === 0) {
    return [];
  }
  return chunks.slice(0, maxChunks);
}

function parseModelJson(rawText: string): Record<string, unknown> | null {
  const noFence = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = noFence.indexOf("{");
  const end = noFence.lastIndexOf("}");
  if (start < 0 || end < 0 || end <= start) {
    return null;
  }

  const jsonSlice = noFence.slice(start, end + 1);
  try {
    const parsed = JSON.parse(jsonSlice);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }
  return null;
}

function normalizeRoute(routeValue: string | null | undefined, action: VoiceAction, question: string): string {
  const fallbackRoute =
    action === "faq" ? `/faq?q=${encodeURIComponent(question)}` : ROUTE_BY_ACTION[action];
  if (!routeValue) {
    return fallbackRoute;
  }

  const normalized = routeValue.trim().toLowerCase();
  if (normalized.startsWith("/")) {
    if (normalized === "/faq") {
      return `/faq?q=${encodeURIComponent(question)}`;
    }
    return normalized;
  }

  const aliasAction = ROUTE_ALIAS_TO_ACTION[normalized];
  if (!aliasAction) {
    return fallbackRoute;
  }
  if (aliasAction === "faq") {
    return `/faq?q=${encodeURIComponent(question)}`;
  }
  return ROUTE_BY_ACTION[aliasAction];
}

async function loadFaqItems(question: string): Promise<FaqItem[]> {
  const [searched, full] = await Promise.all([
    fetchPublicPath<ListPayload<FaqItem>>(`/faq/search?q=${encodeURIComponent(question)}`),
    fetchPublicPath<ListPayload<FaqItem>>("/faq/search?q="),
  ]);

  const merged = [...(searched?.items ?? []), ...(full?.items ?? [])];
  const deduped = new Map<string, FaqItem>();
  for (const item of merged) {
    if (!item.intent_id || deduped.has(item.intent_id)) {
      continue;
    }
    deduped.set(item.intent_id, item);
  }
  return Array.from(deduped.values());
}

async function loadConciergeContext(question: string): Promise<ConciergeContext> {
  const [home, dining, facilities, services, transport, nearby, emergency, notices, faqItems] =
    await Promise.all([
      fetchPublicPath<HomePayload>("/home"),
      fetchPublicPath<ListPayload<DiningItem>>("/dining"),
      fetchPublicPath<ListPayload<FacilityItem>>("/facilities"),
      fetchPublicPath<ListPayload<ServiceItem>>("/services"),
      fetchPublicPath<ListPayload<TransportItem>>("/transport"),
      fetchPublicPath<ListPayload<NearbyItem>>("/nearby-places"),
      fetchPublicPath<ListPayload<EmergencyItem>>("/emergency"),
      fetchPublicPath<ListPayload<NoticeItem>>("/notices"),
      loadFaqItems(question),
    ]);

  const placeholderMap = buildFaqPlaceholderMap({
    home,
    dining,
    facilities,
    services,
    transport,
    nearby,
    emergency,
  });

  const rankedFaq = rankFaqByQuestion(faqItems, question, { maxResults: 5, minScore: 8 });
  const faqHits: FaqHit[] = rankedFaq
    .map(({ item, score }) => {
      const resolved = resolveFaqTemplate(item.answer_template_ko, placeholderMap);
      const answer = extractRelevantAnswerChunks(resolved, question, 2);
      const questionText = item.question_example_ko ?? item.question_example_en ?? item.intent_id;
      return {
        question: sanitizeText(questionText),
        answer: sanitizeText(answer),
        score,
      };
    })
    .filter((entry) => entry.answer.length > 0);

  return {
    home,
    dining,
    facilities,
    services,
    transport,
    nearby,
    emergency,
    notices,
    faqHits,
  };
}

function buildContextSummary(context: ConciergeContext) {
  return {
    hotel: {
      name: context.home?.hotel?.name_kr ?? null,
      phone: context.home?.hotel?.phone ?? null,
      check_in_time: context.home?.hotel?.check_in_time ?? null,
      check_out_time: context.home?.hotel?.check_out_time ?? null,
    },
    dining: (context.dining?.items ?? []).slice(0, 8).map((item) => ({
      name: item.venue_name_kr ?? item.dining_id,
      floor: item.floor_location,
      hours: item.hours_mon ?? item.operating_hours,
    })),
    facilities: (context.facilities?.items ?? []).slice(0, 8).map((item) => ({
      name: item.facility_name ?? item.facility_id,
      hours_mon: item.hours_mon,
      hours_sat: item.hours_sat,
      hours_sun: item.hours_sun,
    })),
    services: (context.services?.items ?? []).slice(0, 8).map((item) => ({
      name: item.service_name ?? item.service_id,
      fee_note: item.fee_note,
    })),
    transport: (context.transport?.items ?? []).slice(0, 8).map((item) => ({
      origin: item.origin_name ?? item.transport_id,
      recommended: item.recommended_yn ?? false,
      route_detail: item.route_detail,
    })),
    nearby: (context.nearby?.items ?? []).slice(0, 8).map((item) => ({
      name: item.name_kr ?? item.place_id,
      walk_minutes: item.walk_minutes_display,
    })),
    emergency: (context.emergency?.items ?? []).slice(0, 8).map((item) => ({
      name: item.contact_name ?? item.emergency_id,
      phone: item.phone,
    })),
    notices: (context.notices?.items ?? []).slice(0, 5).map((item) => ({
      title: item.title ?? item.notice_id,
    })),
    faq_hits: context.faqHits.slice(0, 5).map((hit) => ({
      question: hit.question,
      answer: hit.answer,
      score: hit.score,
    })),
  };
}

function buildGeminiPrompt(question: string, context: ConciergeContext, action: VoiceAction): string {
  const summary = JSON.stringify(buildContextSummary(context), null, 2);
  return [
    "너는 위례 밀리토피아 호텔 로비 키오스크의 한국어 컨시어지 AI다.",
    "아래 DATA_CONTEXT에 있는 정보만 근거로 답변하라.",
    "데이터에 없는 사실은 추측하지 말고, 정보가 없으면 '현재 등록된 정보에서 확인되지 않습니다. 프런트 데스크로 문의해 주세요.'라고 답하라.",
    "출력은 반드시 JSON 객체 하나만 반환한다.",
    `route 허용값: ${Object.keys(ROUTE_BY_ACTION).join(", ")}`,
    'JSON 형식: {"answer":"문장","tts":"문장","route":"faq","chunks":["문장1","문장2"]}',
    "answer와 tts는 각각 1~2문장, 최대 220자로 간결하게 작성한다.",
    "chunks는 answer를 1~2개 문장으로 나눈 배열이어야 한다.",
    "문장에 플레이스홀더(예: {{hotel_master.check_out_time}})를 절대 포함하지 마라.",
    "",
    `USER_QUESTION: ${question}`,
    `RECOMMENDED_ROUTE: ${action}`,
    "DATA_CONTEXT:",
    summary,
  ].join("\n");
}

function buildActionSummary(action: VoiceAction, context: ConciergeContext): string | null {
  if (action === "hotel") {
    const hotel = context.home?.hotel;
    if (!hotel) {
      return null;
    }
    return `${hotel.name_kr ?? "호텔"} 안내입니다. 체크인은 ${hotel.check_in_time ?? "정보 없음"}부터 가능하고 체크아웃은 ${hotel.check_out_time ?? "정보 없음"}까지입니다. 대표 전화번호는 ${hotel.phone ?? "정보 없음"}입니다.`;
  }

  if (action === "dining") {
    const items = context.dining?.items ?? [];
    if (items.length === 0) {
      return null;
    }
    return `다이닝은 총 ${items.length}곳입니다. 대표 장소는 ${pickTopLabels(items.map((item) => item.venue_name_kr ?? item.dining_id))}입니다.`;
  }

  if (action === "facilities") {
    const items = context.facilities?.items ?? [];
    if (items.length === 0) {
      return null;
    }
    return `부대시설은 총 ${items.length}개이며 ${pickTopLabels(items.map((item) => item.facility_name ?? item.facility_id))} 순으로 확인하실 수 있습니다.`;
  }

  if (action === "services") {
    const items = context.services?.items ?? [];
    if (items.length === 0) {
      return null;
    }
    return `호텔 서비스는 총 ${items.length}개이며 ${pickTopLabels(items.map((item) => item.service_name ?? item.service_id))} 등을 제공합니다.`;
  }

  if (action === "transport") {
    const items = context.transport?.items ?? [];
    if (items.length === 0) {
      return null;
    }
    const recommendedCount = items.filter((item) => item.recommended_yn).length;
    return `교통 안내는 총 ${items.length}건입니다. 추천 경로는 ${recommendedCount}건이며 ${pickTopLabels(items.map((item) => item.origin_name ?? item.transport_id))} 기준으로 확인할 수 있습니다.`;
  }

  if (action === "nearby") {
    const items = context.nearby?.items ?? [];
    if (items.length === 0) {
      return null;
    }
    return `주변 추천 장소는 총 ${items.length}곳이며 ${pickTopLabels(items.map((item) => item.name_kr ?? item.place_id))}부터 확인하실 수 있습니다.`;
  }

  if (action === "emergency") {
    const items = context.emergency?.items ?? [];
    if (items.length === 0) {
      return null;
    }
    return `응급 연락처는 총 ${items.length}건이며 ${pickTopLabels(items.map((item) => item.contact_name ?? item.emergency_id))} 정보를 먼저 확인하실 수 있습니다.`;
  }

  if (action === "notices") {
    const items = context.notices?.items ?? [];
    if (items.length === 0) {
      return "현재 적용 중인 공지사항이 없습니다.";
    }
    return `현재 공지사항은 ${items.length}건이며 ${pickTopLabels(items.map((item) => item.title ?? item.notice_id))} 순으로 확인할 수 있습니다.`;
  }

  if (action === "home") {
    return "메인 화면으로 이동했습니다. 원하시는 정보를 말씀해 주세요.";
  }

  return null;
}

function buildFallbackResponse(question: string, action: VoiceAction, context: ConciergeContext): ConciergeResponse {
  const faqChunks = context.faqHits
    .slice(0, 2)
    .map((hit) => sanitizeText(hit.answer))
    .filter((answer) => answer.length > 0);

  if (faqChunks.length > 0) {
    const replyText = ensurePunctuation(truncateText(faqChunks.join(" 추가로, ")));
    return {
      reply: replyText,
      tts: replyText,
      route: `/faq?q=${encodeURIComponent(question)}`,
      chunks: toChunks(replyText, 2),
      provider: "fallback",
      reason: "faq_chunk_fallback",
    };
  }

  const actionSummary = buildActionSummary(action, context);
  if (actionSummary) {
    const cleaned = ensurePunctuation(truncateText(sanitizeText(actionSummary)));
    const route = action === "faq" ? `/faq?q=${encodeURIComponent(question)}` : ROUTE_BY_ACTION[action];
    return {
      reply: cleaned,
      tts: cleaned,
      route,
      chunks: toChunks(cleaned, 2),
      provider: "fallback",
      reason: "action_summary_fallback",
    };
  }

  const defaultReply =
    "현재 등록된 정보에서 확인되지 않습니다. 프런트 데스크로 문의해 주세요.";
  return {
    reply: defaultReply,
    tts: defaultReply,
    route: `/faq?q=${encodeURIComponent(question)}`,
    chunks: [defaultReply],
    provider: "fallback",
    reason: "default_fallback",
  };
}

async function callGemini(
  question: string,
  action: VoiceAction,
  context: ConciergeContext,
): Promise<ConciergeResponse | null> {
  const llmEnabled = (process.env.CONCIERGE_LLM_ENABLED ?? "true").toLowerCase() !== "false";
  if (!llmEnabled) {
    return null;
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash-lite";
  const timeoutMsRaw = Number(process.env.CONCIERGE_LLM_TIMEOUT_MS ?? "8000");
  const timeoutMs = Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0 ? timeoutMsRaw : 8000;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const prompt = buildGeminiPrompt(question, context, action);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
          maxOutputTokens: 512,
          responseMimeType: "application/json",
        },
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as GeminiApiResponse;
    const rawText = (payload.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("\n")
      .trim();
    if (!rawText) {
      return null;
    }

    const parsed = parseModelJson(rawText);
    const answerCandidate =
      parsed && typeof parsed.answer === "string" ? parsed.answer : rawText;
    const answer = ensurePunctuation(truncateText(sanitizeText(answerCandidate)));
    if (!answer) {
      return null;
    }

    const ttsCandidate =
      parsed && typeof parsed.tts === "string" ? parsed.tts : answer;
    const tts = ensurePunctuation(truncateText(sanitizeText(ttsCandidate)));

    const chunkRaw =
      parsed && Array.isArray(parsed.chunks)
        ? parsed.chunks
            .filter((chunk): chunk is string => typeof chunk === "string")
            .map((chunk) => sanitizeText(chunk))
            .filter((chunk) => chunk.length > 0)
            .slice(0, 2)
        : [];

    const routeFromModel = parsed && typeof parsed.route === "string" ? parsed.route : null;
    const normalizedRoute = normalizeRoute(routeFromModel, action, question);
    const chunks = chunkRaw.length > 0 ? chunkRaw : toChunks(answer, 2);

    return {
      reply: answer,
      tts: tts || answer,
      route: normalizedRoute,
      chunks,
      provider: "gemini",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function buildConciergeResponse(rawQuestion: string): Promise<ConciergeResponse> {
  const question = rawQuestion.trim();
  if (!question) {
    const reply = "질문을 말씀해 주세요.";
    return {
      reply,
      tts: reply,
      route: "/",
      chunks: [reply],
      provider: "fallback",
      reason: "empty_question",
    };
  }

  const action = detectAction(question);
  const context = await loadConciergeContext(question);
  const llmResult = await callGemini(question, action, context);
  if (llmResult) {
    return llmResult;
  }

  return buildFallbackResponse(question, action, context);
}
