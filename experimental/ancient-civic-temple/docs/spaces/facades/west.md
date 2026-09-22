# 서측 외피의 단독 소유

## 봉헌실의 연속 외벽 {#west-envelope}

<!--
@evidence principles/core/common.md#scope-preservation 긴 봉헌실의 서측 외벽 전 길이와 양끝 모서리·기단·처마 아래를 관찰 대상에서 빼지 않는다.
@evidence principles/core/common.md#substantive-completion 추가 창/출입구가 없는 서벽 범위와 연속 외측 표면, 북남 모서리 절단·지면 접촉을 정한다.
@evidence principles/core/common.md#declared-basis west 기준선과 남측 기단/상단 규칙, junctions의 대각 접합을 가져와 별도 벽 높이를 발명하지 않는다.
@evidence principles/design/spaces.md#space-topology 안쪽은 봉헌실 하나이며 바깥에서 새 출입구를 뚫어 주랑 직접 출입의 의미를 바꾸지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 서측 완결 외면은 west, 안쪽은 offering이며 모서리 절단이 외면을 다른 입면 owner에게 넘기지 않는다.
@evidence principles/design/spaces.md#space-verification-address 서측 정면·두 모서리·처마 아래에서 길이·접지·roof 두께를 읽고 무창 실내 밝기는 후속 렌더에 남긴다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 연속 회벽 요구를 창 없는 봉헌실 서측 외벽과 대각 끝 접합의 단독 면 소유로 확정한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work walls의 연속 회벽과 offering-room의 주랑 출입을 대조했다. 추가 외부 창 없이도 요구된 연결을 유지할 수 있으며 실제 주광 읽힘은 부모를 임의 수정하지 않고 렌더 질문으로 남겼다.
@evidence settings/20-envelope.md#walls 외벽 전 길이의 회벽·기단을 실제 닫힌 벽 표면에 연속 결속한다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 창이 없는 면도 두 끝과 처마 아래 관찰을 남겨 서측 전체를 생략할 수 없다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 전 길이의 무창 벽, 대각 끝 접합과 지면 접촉을 정해 서벽 실체의 경계를 닫는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb west 기준선과 south 높이 규칙을 소비하며 별도 벽 높이를 새로 고르지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 안쪽은 봉헌실 하나이고 새 외부 출입구 없이 기존 주랑 문으로 접근한다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 대각 절단 뒤에도 서측 외면은 west, 안쪽은 offering에 남아 모서리로 소유가 분열되지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 길이·접지·roof 두께를 외부에서 읽고 무창 방의 밝기는 실제 렌더 질문으로 남긴다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 회벽 요구에 창 없는 장벽의 구체 범위와 대각 끝 접합을 추가했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 연속 회벽과 봉헌실 직접 문은 양립한다. 무창 주광은 미검증으로 남겼고 상위 요구를 바꾸지 않았다.
@evidenceReview settings/20-envelope.md#walls #35026c5 회벽·기단을 전 길이의 닫힌 실체에 결속하며 임의 패치로 대신하지 않는다.
-->

[기준선](../building.md#plan-datums)의 west-outer~west-inner, north-outer~south-outer가 서측 외벽이다. 안쪽은 긴 봉헌실 하나이며 이 면에 추가 출입구·창을 만들지 않는다. 벽 상단의 지붕 접합과 기단 높이는 [남측](south.md#south-envelope)의 소유를 소비하고 위에는 서측 날개 지붕의 실제 처마가 돌출한다.

source `src/spaces/facades/west.ts`가 전 길이의 외측 회벽·기단 표면과 벽 실체를 소유한다. 북·남 입면과 만나는 두 모서리의 실체 범위는 [대각 접합](../junctions.md#wall-junctions)으로 자르며 서측 완결 외면은 그대로 유지한다. 석재·회벽의 연속을 마감 owner가 이 완결 면에 결속하며 임의 패치를 붙이지 않는다. 안쪽 면은 봉헌실 owner가 맡는다.

서측 정면 관찰과 두 끝 모서리, 처마 아래 관찰로 길이·기단 접지·지붕 두께를 읽는다. 개구부가 없다고 관찰에서 제외하지 않는다. 창을 만들지 않고도 봉헌실 내부가 주랑 문과 실제 환경광에서 읽히는지는 후속 렌더에서 검증한다.

외벽 하단은 [층의 지면 접합](../storey.md#wall-ground-contact)을 소비한다. 전 길이에서 외부 지면과 이어지는 벽 실체를 유지하되 봉헌실 바닥과 공간 아래 경계는 기존 층 높이에 둔다. 지면 아래 연장도 서측 외피 owner의 같은 실체다.
