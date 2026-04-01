import Link from "next/link";

import {
  buildFaqPlaceholderMap,
  extractRelevantAnswerChunks,
  rankFaqByQuestion,
  resolveFaqTemplate,
} from "@/lib/faq-answer";
import { fetchPublicPath } from "@/lib/public-api";

type FaqItem = {
  intent_id: string;
  question_example_ko?: string | null;
  question_example_en?: string | null;
  answer_template_ko?: string | null;
  answer_template_en?: string | null;
};

type FaqPayload = {
  items?: FaqItem[];
};

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

export default async function FaqPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() || "체크아웃";

  const [
    faqData,
    homeData,
    diningData,
    facilitiesData,
    servicesData,
    transportData,
    nearbyData,
    emergencyData,
  ] = await Promise.all([
    fetchPublicPath<FaqPayload>(`/faq/search?q=${encodeURIComponent(query)}`),
    fetchPublicPath<HomePayload>("/home"),
    fetchPublicPath<DiningPayload>("/dining"),
    fetchPublicPath<FacilityPayload>("/facilities"),
    fetchPublicPath<ServicePayload>("/services"),
    fetchPublicPath<TransportPayload>("/transport"),
    fetchPublicPath<NearbyPayload>("/nearby-places"),
    fetchPublicPath<EmergencyPayload>("/emergency"),
  ]);

  const placeholderMap = buildFaqPlaceholderMap({
    home: homeData,
    dining: diningData,
    facilities: facilitiesData,
    services: servicesData,
    transport: transportData,
    nearby: nearbyData,
    emergency: emergencyData,
  });

  const rankedItems = rankFaqByQuestion(faqData?.items ?? [], query, {
    maxResults: 8,
    minScore: 8,
  });

  const items = rankedItems.map(({ item }) => {
    const resolved = resolveFaqTemplate(item.answer_template_ko, placeholderMap);
    return {
      ...item,
      resolvedAnswer: extractRelevantAnswerChunks(resolved, query, 2),
    };
  });

  return (
    <main>
      <section className="card card-hero">
        <p className="eyebrow">Smart FAQ</p>
        <h1 className="page-title">FAQ</h1>
        <p className="page-subtitle">검색어: {query}</p>
      </section>

      <section className="list">
        {items.length === 0 ? <div className="list-item empty-state">검색 결과가 없습니다.</div> : null}
        {items.map((item) => (
          <article className="list-item" key={item.intent_id}>
            <div className="list-item-head">
              <h3>{item.question_example_ko ?? item.intent_id}</h3>
              <span className="chip">FAQ Match</span>
            </div>
            <p>{item.resolvedAnswer}</p>
          </article>
        ))}
      </section>

      <Link className="button back-button" href="/">
        홈으로
      </Link>
    </main>
  );
}
