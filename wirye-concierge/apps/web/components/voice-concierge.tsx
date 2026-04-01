"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  buildFaqPlaceholderMap,
  extractRelevantAnswerChunks,
  rankFaqByQuestion,
  resolveFaqTemplate,
} from "@/lib/faq-answer";
import { fetchPublicPath } from "@/lib/public-api";

type SpeechRecognitionResultLike = {
  transcript?: string;
};

type SpeechRecognitionEventLike = {
  results?: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};

type ListPayload<T> = { items?: T[] };

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
  breakfast_adult_price_krw?: number | null;
  breakfast_child_price_krw?: number | null;
};

type FacilityItem = {
  facility_id: string;
  facility_name?: string | null;
  hours_mon?: string | null;
  hours_sat?: string | null;
  hours_sun?: string | null;
  fee_note?: string | null;
  age_policy_note?: string | null;
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

type VoiceResult = {
  reply: string;
  route?: string;
};

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

function pickSpeechVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const exactKo = voices.find((voice) => voice.lang.toLowerCase() === "ko-kr");
  if (exactKo) {
    return exactKo;
  }
  const anyKo = voices.find((voice) => voice.lang.toLowerCase().startsWith("ko"));
  if (anyKo) {
    return anyKo;
  }
  return voices[0] ?? null;
}

function speak(text: string, onError?: () => void): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  try {
    const synth = window.speechSynthesis;
    const selectedVoice = pickSpeechVoice(synth.getVoices());
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedVoice?.lang ?? "ko-KR";
    utterance.voice = selectedVoice ?? null;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onerror = () => onError?.();

    synth.resume();
    synth.speak(utterance);
    return true;
  } catch {
    onError?.();
    return false;
  }
}

function stopSpeaking() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  window.speechSynthesis.cancel();
}

async function answerFromFaq(question: string): Promise<VoiceResult> {
  const [faqData, homeData, diningData, facilitiesData, servicesData, transportData, nearbyData, emergencyData] =
    await Promise.all([
      fetchPublicPath<ListPayload<FaqItem>>(`/faq/search?q=${encodeURIComponent(question)}`),
      fetchPublicPath<HomePayload>("/home"),
      fetchPublicPath<ListPayload<DiningItem>>("/dining"),
      fetchPublicPath<ListPayload<FacilityItem>>("/facilities"),
      fetchPublicPath<ListPayload<ServiceItem>>("/services"),
      fetchPublicPath<ListPayload<TransportItem>>("/transport"),
      fetchPublicPath<ListPayload<NearbyItem>>("/nearby-places"),
      fetchPublicPath<ListPayload<EmergencyItem>>("/emergency"),
    ]);

  const items = faqData?.items ?? [];
  if (items.length === 0) {
    return {
      route: "/faq",
      reply: "질문과 일치하는 안내를 찾지 못했습니다. 다른 표현으로 다시 말씀해 주세요.",
    };
  }

  const placeholderMap = buildFaqPlaceholderMap({
    home: homeData,
    dining: diningData,
    facilities: facilitiesData,
    services: servicesData,
    transport: transportData,
    nearby: nearbyData,
    emergency: emergencyData,
  });

  const ranked = rankFaqByQuestion(items, question, { maxResults: 3, minScore: 10 });
  if (ranked.length === 0) {
    return {
      route: `/faq?q=${encodeURIComponent(question)}`,
      reply: "관련 안내는 찾았지만 정확한 답변 매칭이 어려웠습니다. 화면에서 항목을 확인해 주세요.",
    };
  }

  const focusedAnswers = ranked
    .map(({ item }) => resolveFaqTemplate(item.answer_template_ko, placeholderMap))
    .map((resolved) => extractRelevantAnswerChunks(resolved, question, 2))
    .filter((answer) => answer.length > 0);

  const uniqueAnswers = Array.from(new Set(focusedAnswers)).slice(0, 2);
  if (uniqueAnswers.length === 0) {
    return {
      route: `/faq?q=${encodeURIComponent(question)}`,
      reply: "관련 FAQ를 찾았지만 답변을 구성하지 못했습니다. 화면에서 상세 내용을 확인해 주세요.",
    };
  }

  const reply =
    uniqueAnswers.length === 1 ? uniqueAnswers[0] : `${uniqueAnswers[0]} 추가로, ${uniqueAnswers[1]}`;

  return {
    route: `/faq?q=${encodeURIComponent(question)}`,
    reply,
  };
}

async function buildVoiceResult(question: string): Promise<VoiceResult> {
  const action = detectAction(question);

  if (action === "home") {
    return {
      route: "/",
      reply: "메인 화면으로 이동했습니다. 원하는 내용을 말씀해 주세요.",
    };
  }

  if (action === "hotel") {
    const payload = await fetchPublicPath<HomePayload>("/home");
    const hotel = payload?.hotel;
    if (!hotel) {
      return answerFromFaq(question);
    }
    return {
      route: "/hotel",
      reply: `${hotel.name_kr ?? "호텔"} 안내입니다. 체크인은 ${hotel.check_in_time ?? "정보 없음"}부터 가능하고 체크아웃은 ${hotel.check_out_time ?? "정보 없음"}까지입니다. 대표 전화번호는 ${hotel.phone ?? "정보 없음"}입니다.`,
    };
  }

  if (action === "dining") {
    const payload = await fetchPublicPath<ListPayload<DiningItem>>("/dining");
    const items = payload?.items ?? [];
    if (items.length === 0) {
      return answerFromFaq(question);
    }
    return {
      route: "/dining",
      reply: `다이닝은 총 ${items.length}곳입니다. 대표 장소는 ${pickTopLabels(items.map((item) => item.venue_name_kr ?? item.dining_id))}입니다.`,
    };
  }

  if (action === "facilities") {
    const payload = await fetchPublicPath<ListPayload<FacilityItem>>("/facilities");
    const items = payload?.items ?? [];
    if (items.length === 0) {
      return answerFromFaq(question);
    }
    return {
      route: "/facilities",
      reply: `부대시설은 총 ${items.length}개이며 ${pickTopLabels(items.map((item) => item.facility_name ?? item.facility_id))} 순으로 확인하실 수 있습니다.`,
    };
  }

  if (action === "services") {
    const payload = await fetchPublicPath<ListPayload<ServiceItem>>("/services");
    const items = payload?.items ?? [];
    if (items.length === 0) {
      return answerFromFaq(question);
    }
    return {
      route: "/services",
      reply: `호텔 서비스는 총 ${items.length}개이며 ${pickTopLabels(items.map((item) => item.service_name ?? item.service_id))} 등을 제공합니다.`,
    };
  }

  if (action === "transport") {
    const payload = await fetchPublicPath<ListPayload<TransportItem>>("/transport");
    const items = payload?.items ?? [];
    if (items.length === 0) {
      return answerFromFaq(question);
    }
    const recommendedCount = items.filter((item) => item.recommended_yn).length;
    return {
      route: "/transport",
      reply: `교통 안내는 총 ${items.length}건입니다. 추천 경로는 ${recommendedCount}건이며 ${pickTopLabels(items.map((item) => item.origin_name ?? item.transport_id))} 기준으로 볼 수 있습니다.`,
    };
  }

  if (action === "nearby") {
    const payload = await fetchPublicPath<ListPayload<NearbyItem>>("/nearby-places");
    const items = payload?.items ?? [];
    if (items.length === 0) {
      return answerFromFaq(question);
    }
    return {
      route: "/nearby",
      reply: `주변 추천 장소는 총 ${items.length}곳이며 ${pickTopLabels(items.map((item) => item.name_kr ?? item.place_id))}부터 확인하실 수 있습니다.`,
    };
  }

  if (action === "emergency") {
    const payload = await fetchPublicPath<ListPayload<EmergencyItem>>("/emergency");
    const items = payload?.items ?? [];
    if (items.length === 0) {
      return answerFromFaq(question);
    }
    return {
      route: "/emergency",
      reply: `응급 연락처는 총 ${items.length}건이며 ${pickTopLabels(items.map((item) => item.contact_name ?? item.emergency_id))} 정보를 먼저 확인하실 수 있습니다.`,
    };
  }

  if (action === "notices") {
    const payload = await fetchPublicPath<ListPayload<NoticeItem>>("/notices");
    const items = payload?.items ?? [];
    if (items.length === 0) {
      return {
        route: "/notices",
        reply: "현재 적용 중인 공지사항이 없습니다.",
      };
    }
    return {
      route: "/notices",
      reply: `현재 공지사항은 ${items.length}건이며 ${pickTopLabels(items.map((item) => item.title ?? item.notice_id))} 순으로 확인할 수 있습니다.`,
    };
  }

  return answerFromFaq(question);
}

export function VoiceConcierge() {
  const router = useRouter();

  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuestion, setLastQuestion] = useState("");
  const [lastAnswer, setLastAnswer] = useState("음성 질문 버튼을 누르면 안내를 시작합니다.");
  const [typedQuestion, setTypedQuestion] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const pendingTranscriptRef = useRef("");
  const speechPrimedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hasRecognition = Boolean(
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
        (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
          .webkitSpeechRecognition,
    );
    const hasSynthesis = "speechSynthesis" in window;
    if (!hasRecognition || !hasSynthesis) {
      setIsSupported(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // no-op
        }
      }
      stopSpeaking();
    };
  }, []);

  const statusText = useMemo(() => {
    if (!isSupported) {
      return "현재 브라우저에서는 음성 기능을 지원하지 않습니다.";
    }
    if (isListening) {
      return "듣는 중입니다. 질문을 말씀해 주세요.";
    }
    if (isLoading) {
      return "질문을 분석하고 답변을 준비하고 있습니다.";
    }
    return "음성 대기 중입니다.";
  }, [isSupported, isListening, isLoading]);

  const playReply = useCallback((text: string) => {
    window.setTimeout(() => {
      const started = speak(text, () => {
        setErrorMessage("음성 재생에 실패했습니다. 브라우저 권한과 스피커 상태를 확인해 주세요.");
      });
      if (!started) {
        setErrorMessage("이 기기에서는 음성 재생을 사용할 수 없습니다.");
      }
    }, 120);
  }, []);

  const askConcierge = useCallback(
    async (rawQuestion: string) => {
      const question = rawQuestion.trim();
      if (question.length === 0) {
        return;
      }

      setErrorMessage("");
      setIsLoading(true);
      setLastQuestion(question);

      try {
        const result = await buildVoiceResult(question);
        if (result.route) {
          router.push(result.route);
        }
        setLastAnswer(result.reply);
        playReply(result.reply);
      } catch {
        const fallback = "일시적으로 답변을 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.";
        setLastAnswer(fallback);
        playReply(fallback);
      } finally {
        setIsLoading(false);
      }
    },
    [playReply, router],
  );

  const startListening = useCallback(() => {
    if (!isSupported || typeof window === "undefined") {
      setErrorMessage("현재 환경에서는 음성 인식을 사용할 수 없습니다.");
      return;
    }

    type BrowserWindow = Window & typeof globalThis & {
      SpeechRecognition?: {
        new (): SpeechRecognitionLike;
      };
      webkitSpeechRecognition?: {
        new (): SpeechRecognitionLike;
      };
    };

    const browserWindow = window as BrowserWindow;
    const RecognitionConstructor =
      browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;

    if (!RecognitionConstructor) {
      setErrorMessage("음성 인식 기능을 찾지 못했습니다.");
      return;
    }

    if ("speechSynthesis" in window) {
      const synth = window.speechSynthesis;
      synth.getVoices();
      if (!speechPrimedRef.current) {
        const warmup = new SpeechSynthesisUtterance(" ");
        warmup.volume = 0;
        synth.speak(warmup);
        synth.cancel();
        speechPrimedRef.current = true;
      }
    }

    stopSpeaking();
    setErrorMessage("");
    pendingTranscriptRef.current = "";

    if (!recognitionRef.current) {
      const recognition = new RecognitionConstructor();
      recognition.lang = "ko-KR";
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
        const transcript = pendingTranscriptRef.current.trim();
        if (transcript.length > 0) {
          pendingTranscriptRef.current = "";
          void askConcierge(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setErrorMessage("음성 인식에 실패했습니다. 다시 시도해 주세요.");
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        const transcript = event.results?.[0]?.[0]?.transcript ?? "";
        if (transcript.length > 0) {
          pendingTranscriptRef.current = transcript;
          try {
            recognition.stop();
          } catch {
            // no-op
          }
        }
      };

      recognitionRef.current = recognition;
    }

    try {
      recognitionRef.current.start();
    } catch {
      setIsListening(false);
      setErrorMessage("마이크를 시작하지 못했습니다. 브라우저 마이크 권한을 확인해 주세요.");
    }
  }, [askConcierge, isSupported]);

  const stopListening = useCallback(() => {
    pendingTranscriptRef.current = "";
    if (!recognitionRef.current) {
      return;
    }
    try {
      recognitionRef.current.stop();
    } catch {
      // no-op
    }
    setIsListening(false);
  }, []);

  return (
    <aside className="voice-assistant" aria-live="polite">
      <div className="voice-assistant-header">
        <div>
          <p className="voice-eyebrow">Live Voice Concierge</p>
          <strong>음성 안내</strong>
        </div>
        <span className="voice-status">{statusText}</span>
      </div>

      <div className="voice-actions">
        <button
          className="voice-button"
          type="button"
          onClick={isListening ? stopListening : startListening}
          disabled={!isSupported || isLoading}
        >
          {isListening ? "듣는 중지" : "음성 질문"}
        </button>
        <button className="voice-button ghost" type="button" onClick={() => playReply(lastAnswer)}>
          답변 다시 듣기
        </button>
        <button className="voice-button ghost" type="button" onClick={stopSpeaking}>
          음성 멈춤
        </button>
      </div>

      <div className="voice-typed-row">
        <input
          className="voice-input"
          type="text"
          value={typedQuestion}
          onChange={(event) => setTypedQuestion(event.target.value)}
          placeholder="마이크 대신 질문을 입력해도 됩니다."
          disabled={isLoading}
        />
        <button
          className="voice-button"
          type="button"
          disabled={isLoading || typedQuestion.trim().length === 0}
          onClick={() => {
            const question = typedQuestion;
            setTypedQuestion("");
            void askConcierge(question);
          }}
        >
          질문
        </button>
      </div>

      {errorMessage ? <p className="voice-error">{errorMessage}</p> : null}
      {lastQuestion ? (
        <p className="voice-log">
          질문: <span>{lastQuestion}</span>
        </p>
      ) : null}
      <p className="voice-log">
        답변: <span>{lastAnswer}</span>
      </p>
    </aside>
  );
}
