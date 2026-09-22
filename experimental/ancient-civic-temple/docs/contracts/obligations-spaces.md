<!--
@evidenceReview discovery/design/designs.md#work-specific-design-requirements #1c8460c 사용자 최초 표면 분해 요구가 후속 model/material/instance/viewer의 같은 면 재저작을 막는 별도 인터페이스인지 읽었다. ownership 표와 단독 source 주소가 현재 설계 답이고 CJS·좌표·fidelity는 기존 settings 소유를 참조하므로 같은 규칙을 다시 채택하지 않는다.
@evidenceReview discovery/design/spaces.md#work-specific-space-requirements #a751db6 대표 view로 줄일 수 없는 topology 전집합과 오목 주랑 추가 관찰을 실제 observations/colonnade에 대조했다. 이는 두 local 의무의 고유 범위이며 문폭·층·직접 문은 공유 공간 계약의 답으로 남아 새 법규나 인증을 발명하지 않았다.
@evidence discovery/core/common.md#shared-local-boundary 사용자 브리프는 대표 view 선택을 허용하지 않고 compiled topology 전체의 관찰 분모를 고정한다. 또한 완결 시각 표면을 입면·방·층별 단독 소유로 최초 공간 설계에 배정하도록 요구하므로 두 독립적인 공간 population 의무를 보존했다.
@evidence discovery/core/common.md#canonical-realization surface-ownership은 docs/spaces/ownership.md의 입면·방·층·지붕 단독 배정으로, compiled-observations는 docs/spaces/observations.md의 actual topology 전집합 유도 규칙으로 현재 설계에 실현된다. temple-space-obligations claim은 spaces 전체 H2와 예약 aggregate를 선택하며 draft에서는 evidence coverage가 비활성이다. settings의 납품·좌표·검토와 기술·판정 경계는 해당 settings 소유에 남고 실제 source/compiled 관찰은 아직 없다.
@evidence discovery/design/designs.md#work-specific-design-requirements 완결 표면을 최초 경계에서 한 owner에게 배정하는 조건은 후속 모델·재료·반복·viewer가 같은 표면을 갈라 재저작하지 못하게 한다. surface-ownership의 spaces 의무와 docs/spaces/ownership.md의 실제 경계/소유 경로가 이 인터페이스를 배정한다. 좌표·단위·CJS·fidelity는 settings 기존 소유를 소비하며 별도 중복 규칙을 만들지 않는다.
@evidence discovery/design/spaces.md#work-specific-space-requirements 중정 구멍이 있는 한 주랑의 내부 모서리·cell 관찰과 전 입면/개구부 관찰은 대표 view만으로 줄일 수 없으므로 compiled-observations가 추가 공간 의무다. docs/spaces/observations.md가 전집합과 미해결 위치 보존을, rooms/colonnade.md가 오목한 실제 영역을, ownership.md가 모든 완결 면의 단독 경로를 정한다. 문 순폭·동선·층·경계는 공유 공간 의무의 구체 답이며 새 법규나 접근 인증을 채택하지 않는다.
@evidence discovery/core/settings.md#directive-promise-subject-requirements 고정 단층 그래프와 약 430㎡는 10-building.md, reference별 시각 정체성은 20-envelope.md·30-interiors.md·40-environment.md에 배치했다. 00-delivery.md의 operative-subjects는 공동체·운반 포락·분수 물·관찰자·환경까지 소유를 분류하고 인물 구현과 실제 역사 복원은 범위 밖으로 구분한다.
@evidenceReview discovery/core/common.md#shared-local-boundary #ae499c0 사용자 요구와 공유 공간 의무를 대조했을 때 완결 시각 표면의 최초 단독 배정과 compiled topology 전수 관찰은 각각 별도 실패 경계를 가진다. 회벽 색·방 용도 같은 기존 질문의 구체 답은 새 규칙으로 중복시키지 않았다.
@evidenceReview discovery/core/common.md#canonical-realization #5a6e541 spaces draft의 ownership 표를 입면·방·층·지붕 파일과, observations의 전집합 규칙을 고리 주랑 cell 설계와 대조했다. 두 계약 target과 전체 spaces/예약 account claim은 유지되며 draft의 coverage 비활성은 compiled 관찰 완료가 아니다. source 경로는 후속 소유 지정으로 분명히 표시돼 있다.
@evidenceReview discovery/core/settings.md#directive-promise-subject-requirements #1c99050 브리프의 단층·방 관계·규모는 10-building, 다섯 이미지의 부재·집기·환경은 20/30/35/40, 전달·GPU·판정 실패 경계는 50-production에 실제 본문으로 존재한다. operative-subjects의 공동체·물·카메라도 소유가 있고 인물 구현과 역사 복원은 명시 제외다.
-->

# 신전 공간 population의 추가 의무

이 문서는 사용자 브리프의 완결 표면 단독 소유와 topology 전체 관찰이라는 두 독립 조건을 spaces에 배정한다. 일반적인 공간 사용·형상·재료의 사실은 settings 및 공유 공간 계약이 소유한다. settings와 이 계약/claim의 선언은 공간 설계나 compiled 관찰 완료를 뜻하지 않는다.

## 완결 표면의 소유 {#surface-ownership}

권위는 사용자 직접 지시다. 최초 매스·공간 그래프가 닫히기 전에 spaces 전체가 모든 노출 입면, 각 방의 내부 표면, 단층의 바닥과 천장/지붕 하부에 대해 완결 시각 표면 단위의 단독 owner를 선언해야 한다. 공유 물리벽의 양쪽 마감은 각기 다른 시각 표면이고 물리벽 자체의 topology owner는 하나다. 지붕 상부·처마 하부와 방별 천장도 빠뜨리지 않는다. ownership 지도는 실제 경계/host와 연결하고 design 및 후속 source의 소유 경로를 지정한다. 한 파일에 큰 건물 전체를 먼저 넣고 뒤에서 표면을 쪼개는 방법은 허용하지 않는다. 필요한 공간이 나중에 드러나면 최초 경계 owner를 다시 검토한다.

Review question: 실제 공간의 모든 완결 시각 표면이 입면·방·층 소유 지도에 정확히 한 번 귀속되고, 서로 다른 사람이 같은 표면을 나누어 저작할 여지를 남기지 않았는가?

Sources: 사용자 「저작 브리프 — 중소형 고대 지중해 시민 신전」의 표면 분해 및 단계 지시, 2026-09-21.

## 컴파일된 관찰 분모 {#compiled-observations}

권위는 사용자 직접 지시다. spaces의 관찰 설계는 실제 compiled topology에서 외부 setting 하나, 모든 노출 입면과 그 입면들이 만나는 모서리, 모든 노출 지붕과 하부, 모든 개구부와 출입구를 빠짐없이 유도하는 규칙을 갖는다. 각 공간은 자기 내부의 threshold 하나, 네 안쪽 모서리, 중심의 네 방위를 답한다. 연속 주랑처럼 오목하거나 구멍이 있는 공간은 대표 네 모서리로 줄이지 않고 추가 내부 경계 모서리와 각 구간 중심 관찰을 더한다. 건물 외부와 공간 내부의 관찰을 서로 대신하지 않는다. 다섯 reference 비교는 별도 추가 질문이다. source 구현 뒤 매 round에는 현재 compiled ID·위치·binding을 따라 실제 관찰 목록과 미해결 항목을 갱신한다. 숫자는 산출물, 자기 자신과 그 방으로 읽히는가는 현재 프레임이 답한다. 검사 절개만으로 외관 납품 프레임을 대신하지 않는다.

Review question: 실제 topology의 노출 면·경계·공간·개구부 중 관찰 질문과 현재 결과 또는 정직한 unverified 상태에 연결되지 않은 것이 하나라도 있는가?

Sources: 사용자 「저작 브리프 — 중소형 고대 지중해 시민 신전」의 매 round 읽히는 것 및 다섯 reference 지시, 2026-09-21.
