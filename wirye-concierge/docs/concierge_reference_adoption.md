# Concierge Reference Adoption

`codex_reference_pack.zip`의 가이드를 기준으로, 현재 저장소 구조를 유지하면서 아래 패턴을 반영했다.

## 적용한 레이어

1. 대화/질의응답 레이어
2. 운영자 인박스 / handoff 레이어
3. 키오스크 / 디스플레이 레이어
4. 길찾기 / 음성 보조 레이어

## 참고 저장소와 차용 포인트

### 1) chatwoot/chatwoot
- 차용:
  - 대화 결과를 운영 인박스로 넘기는 `handoff` 상태 모델
  - 인박스 항목에 `status / assignee / tags / internal note`를 두는 운영 UX
- 차용하지 않음:
  - helpdesk 전체 도메인(CRM, 티켓 SLA, 다채널 풀스택) 복제

### 2) Hexastack/Hexabot
- 차용:
  - `위젯(키오스크 UI)`와 `운영 화면(어드민 인박스)` 분리
  - 런타임 대화 응답과 운영 데이터 스토어를 분리한 구조
- 차용하지 않음:
  - AGPL 코드 반입, 대규모 모놀리식 구조

### 3) Screenly/Anthias + MagicMirrorOrg/MagicMirror
- 차용:
  - 로비 홈에 `모듈형 카드(공지/다이닝/주변/응급)`를 별도 레이어로 배치
  - 표시 레이어(키오스크)와 운영 레이어(관리자)를 화면 단에서 분리
- 차용하지 않음:
  - 디바이스 프로비저닝/OS 레벨 제어

### 4) RasaHQ/rasa
- 차용:
  - 질의 결과에 `intent(action)`과 `confidence`를 명시
  - `fallback -> handoff` 전이 규칙
- 차용하지 않음:
  - 학습 파이프라인 중심 NLU 엔진 도입

### 5) OpenVoiceOS/ovos-core
- 차용:
  - 음성 입력 -> 질의응답 -> 음성 출력 파이프라인
  - 후속 질문(suggestions) 기반 음성/터치 혼합 UX
- 차용하지 않음:
  - 디바이스 런타임/메시지버스 전체 이식

## 이번 변경의 운영 효과

- 손님 질문이 실패하거나 직원 연결을 요청하면 자동으로 핸드오프 티켓이 생성된다.
- 운영자는 관리자 콘솔에서 티켓을 배정/해결하고 내부 메모를 남길 수 있다.
- 키오스크 홈은 단순 메뉴를 넘어 실시간 운영 정보를 모듈형으로 보여준다.
