"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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

type ConciergeApiResponse = {
  reply?: string;
  tts?: string;
  route?: string;
  chunks?: string[];
  provider?: "gemini" | "fallback";
  suggestions?: string[];
  intent?: {
    action?: string;
    confidence?: number;
    matchedBy?: "keyword" | "llm" | "fallback";
  };
  handoff?: {
    requested?: boolean;
    reason?: string;
    itemId?: string;
  };
};

type VoiceResult = {
  reply: string;
  tts: string;
  route?: string;
  chunks: string[];
  provider: "gemini" | "fallback";
  suggestions: string[];
  intentAction: string;
  intentConfidence: number;
  handoffRequested: boolean;
  handoffReason?: string;
  handoffItemId?: string;
};

const ACTION_LABELS: Record<string, string> = {
  home: "홈",
  hotel: "호텔안내",
  dining: "다이닝",
  facilities: "부대시설",
  services: "서비스",
  transport: "교통",
  nearby: "주변추천",
  emergency: "응급",
  notices: "공지",
  faq: "FAQ",
};

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

async function requestConcierge(question: string): Promise<VoiceResult> {
  const response = await fetch("/api/concierge/chat", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ question }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`concierge api failed: ${response.status}`);
  }

  const payload = (await response.json()) as ConciergeApiResponse;
  const reply = typeof payload.reply === "string" ? payload.reply.trim() : "";
  if (!reply) {
    throw new Error("empty concierge reply");
  }

  const tts = typeof payload.tts === "string" ? payload.tts.trim() : "";
  const chunks = Array.isArray(payload.chunks)
    ? payload.chunks
        .filter((chunk): chunk is string => typeof chunk === "string")
        .map((chunk) => chunk.trim())
        .filter((chunk) => chunk.length > 0)
    : [];
  const suggestions = Array.isArray(payload.suggestions)
    ? payload.suggestions
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
        .slice(0, 3)
    : [];
  const intentAction =
    typeof payload.intent?.action === "string" && payload.intent.action.trim().length > 0
      ? payload.intent.action.trim()
      : "faq";
  const intentConfidenceRaw = Number(payload.intent?.confidence ?? 0);
  const intentConfidence =
    Number.isFinite(intentConfidenceRaw) && intentConfidenceRaw >= 0
      ? Math.min(1, intentConfidenceRaw)
      : 0;
  const handoffRequested = payload.handoff?.requested === true;

  return {
    reply,
    tts: tts.length > 0 ? tts : reply,
    route: payload.route,
    chunks,
    provider: payload.provider ?? "fallback",
    suggestions,
    intentAction,
    intentConfidence,
    handoffRequested,
    handoffReason: payload.handoff?.reason,
    handoffItemId: payload.handoff?.itemId,
  };
}

export function VoiceConcierge() {
  const router = useRouter();

  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuestion, setLastQuestion] = useState("");
  const [lastAnswer, setLastAnswer] = useState("음성 질문 버튼을 누르면 안내를 시작합니다.");
  const [lastChunks, setLastChunks] = useState<string[]>([]);
  const [lastProvider, setLastProvider] = useState<"gemini" | "fallback">("fallback");
  const [lastSuggestions, setLastSuggestions] = useState<string[]>([]);
  const [lastIntentAction, setLastIntentAction] = useState("faq");
  const [lastIntentConfidence, setLastIntentConfidence] = useState(0);
  const [lastHandoffItemId, setLastHandoffItemId] = useState("");
  const [typedQuestion, setTypedQuestion] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

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
      setInfoMessage("");
      setIsLoading(true);
      setLastQuestion(question);

      try {
        const result = await requestConcierge(question);
        if (result.route) {
          router.push(result.route);
        }
        setLastAnswer(result.reply);
        setLastChunks(result.chunks);
        setLastProvider(result.provider);
        setLastSuggestions(result.suggestions);
        setLastIntentAction(result.intentAction);
        setLastIntentConfidence(result.intentConfidence);
        setLastHandoffItemId(result.handoffItemId ?? "");
        if (result.handoffRequested) {
          setInfoMessage(
            `직원 연결 요청이 접수되었습니다.${result.handoffItemId ? ` (티켓: ${result.handoffItemId})` : ""}`,
          );
        }
        playReply(result.tts);
      } catch {
        const fallback = "일시적으로 답변을 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.";
        setLastAnswer(fallback);
        setLastChunks([fallback]);
        setLastProvider("fallback");
        setLastSuggestions([]);
        setLastIntentAction("faq");
        setLastIntentConfidence(0);
        setLastHandoffItemId("");
        setInfoMessage("");
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
    setInfoMessage("");
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
        <button
          className="voice-button ghost"
          type="button"
          disabled={isLoading}
          onClick={() => void askConcierge("직원 연결해줘")}
        >
          직원 연결
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
      {infoMessage ? <p className="voice-info">{infoMessage}</p> : null}
      {lastQuestion ? (
        <p className="voice-log">
          질문: <span>{lastQuestion}</span>
        </p>
      ) : null}
      <p className="voice-log">
        답변: <span>{lastAnswer}</span>
      </p>
      {lastChunks.length > 0 ? (
        <p className="voice-log">
          청크: <span>{lastChunks.join(" | ")}</span>
        </p>
      ) : null}
      <p className="voice-log">
        모드: <span>{lastProvider === "gemini" ? "Gemini" : "Fallback"}</span>
      </p>
      <p className="voice-log">
        의도:{" "}
        <span>
          {ACTION_LABELS[lastIntentAction] ?? lastIntentAction} ({Math.round(lastIntentConfidence * 100)}%)
        </span>
      </p>
      {lastHandoffItemId ? (
        <p className="voice-log">
          핸드오프 티켓: <span>{lastHandoffItemId}</span>
        </p>
      ) : null}
      {lastSuggestions.length > 0 ? (
        <div className="voice-suggestion-row">
          {lastSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="voice-suggestion-chip"
              disabled={isLoading}
              onClick={() => void askConcierge(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
