# 외피의 물리 접합

## 벽 끝과 모서리의 맞닿음 {#wall-junctions}

<!--
@evidence principles/core/common.md#scope-preservation 네 외곽 모서리·spine T 접합·현관 반환부를 모두 처리하되 방 수나 통행 관계를 바꾸지 않는다.
@evidence principles/core/common.md#substantive-completion 외곽은 등거리 대각면, 가지 벽은 관통벽 접면에서 끝내는 규칙으로 중복 체적을 없앤다.
@evidence principles/core/common.md#declared-basis 공유 기준선과 경계 인접성을 입력으로 받아 같은 두께의 모서리 영역 배정을 유도한다.
@evidence principles/design/spaces.md#space-topology 접촉 내부 면은 두 공간 사이의 새 통로나 노출 마감이 아니며 기존 L/T 연결을 닫는 접면이다.
@evidence principles/design/spaces.md#space-boundary-authority junctions는 절단 입력만 계산하고 실제 벽과 완결 외측 면은 입면/boundaries의 원래 owner에 남긴다.
@evidence principles/design/spaces.md#space-verification-address 모든 L/T 접합의 양면과 단면에서 빈 틈·겹친 체적·노출 내부 끝마개를 기준선 허용값과 대조한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 회벽 외피의 연속 요구를 대각 맞댐과 가지 벽 끝 범위로 구체화해 서로 다른 입면의 실체 중첩을 막는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work walls의 두꺼운 실체와 fixed-graph의 직사각 외곽을 함께 읽었다. 같은 두께의 대각 접합과 내부 T 접합으로 연속 면을 만들 수 있어 상위 외곽을 변형하지 않았다.
@evidence settings/20-envelope.md#walls 회벽 외피의 모서리가 겹친 상자 끝으로 보이지 않게 실제 벽 접촉을 닫는다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 외곽 L 접합뿐 아니라 spine T와 현관 반환부도 포함하고 방/문 관계는 바꾸지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 모서리의 등거리 대각면과 가지 벽의 접면 종료 규칙이 체적 중첩을 해소한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 같은 두께의 모서리 배정은 공유 기준선과 인접 관계에서 유도된다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 내부 접촉면은 새 통로나 노출 마감이 아니라 기존 벽의 맞닿음으로 정의된다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 junctions는 절단 계산만 맡고 벽과 외측 완결 면은 입면/boundaries에 남는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 모든 L/T의 단면/양면에서 빈 틈·중복·내부 끝마개를 대조해 모서리 하나만의 확인을 거부한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 연속 회벽 요구에 서로 다른 입면 실체가 겹치지 않는 대각 영역 배정을 더했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 직사각 외곽과 두꺼운 벽을 대각/T 접합으로 함께 유지할 수 있어 외곽 변형이 필요하지 않았다.
@evidenceReview settings/20-envelope.md#walls #35026c5 외측 면 전 길이를 각 입면에 남겨 겹친 상자의 끝이 회벽 모서리를 대신하지 않는다.
-->

[공유 기준선](building.md#plan-datums)과 [경계의 인접 관계](openings.md#boundary-ownership)를 소비한다. 이 결정은 방의 수·경계·문·통행을 바꾸지 않고, 같은 벽 교차부를 두 실체가 동시에 차지하지 않게 한다. source 예정 소유 `src/spaces/junctions.ts`는 경계의 절단 입력과 접면 관계를 계산하고 완결 입면이나 방 표면을 소유하지 않는다. 물리벽은 기존 입면 또는 boundaries 소유가 그 입력으로 만든다.

직사각형 외곽의 네 모서리는 바깥 꼭짓점과 안쪽 꼭짓점을 잇는 수직 대각면으로 맞댄다. 같은 두께의 두 외벽이 겹치는 정사각 영역에서 각 입면의 바깥 평면까지의 수평 거리가 작은 쪽 벽에 체적을 배정한다. 같은 거리인 대각면은 부피 없는 공통 접면이다. 따라서 서·동·남·북의 완결 외측 면은 각각 원래 입면에 전 길이로 남고, 모서리에서 다른 입면의 끝마개를 겹쳐 그리지 않는다. 낮은 마당 벽도 같은 평면 접합을 쓰되 높이는 그 벽의 기존 소유를 따른다.

내부 T 접합은 관통하는 벽의 접면에서 가지 벽을 끝낸다. 서·동 spine은 north-inner~south-inner 사이에 놓이고, 제실 남벽의 X 끝은 west-ring/east-ring, 오른쪽 가로 벽의 X 끝은 east-room/east-inner다. 이로써 외벽·spine과 가지 벽의 접면은 맞닿고 체적은 겹치지 않는다. 현관 후퇴벽의 X 끝은 west-porch-outer/east-porch-outer이며 반환벽은 entrance-front에서 south-outer까지다. 반환벽의 바깥 X 면이 남측 외벽의 중앙 절단 끝에 맞닿는다. 현관 후퇴벽·반환벽은 남측 외피의 물리 소유이고 boundaries가 두 번째 실체를 만들지 않는다.

접면의 양쪽 element와 면 주소는 보존하되 접촉 내부 면을 노출 마감이나 두꺼운 틈으로 그리지 않는다. 외부/방 쪽의 완결 시각 표면은 [소유 지도](ownership.md#surface-map)를 유지한다. 판정은 [관찰 소유](observations.md#geometry-observations)의 실제 모든 L/T 접합 단면에서 빈 틈·중복 체적·노출된 내부 끝마개를 읽고 공유 기준선의 허용 오차와 비교한다. 아직 이 접합을 구현하거나 측정한 결과는 없으므로 unverified다.

## 박공과 지붕 아래의 닫힌 경계 {#gable-closures}

<!--
@evidence principles/core/common.md#scope-preservation 날개·제실·포치 박공, 마당-보관실 끝벽과 열린 주랑 위 높이 차이를 각각 폐쇄 owner에 배정한다.
@evidence principles/core/common.md#substantive-completion 벽 두께 안 roof 하부까지의 상단과 roof-only 높이 차이 폐쇄를 구분한 접점 표를 제공한다.
@evidence principles/core/common.md#declared-basis 높이와 경사 자체는 합성된 roof를 소비하며 이 표는 기존 벽의 연장과 노출 표면 귀속을 정한다.
@evidence principles/design/spaces.md#space-topology 마당 앞 높은 끝벽과 주랑 위 열린 접합을 구분해 지붕 접합을 바닥부터 막는 새 벽으로 만들지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 박공 외면·실내 하부·roof 끝면의 담당을 기존 입면·방·roof에 돌리고 junctions가 새 표면 owner가 되지 않는다.
@evidence principles/design/spaces.md#space-verification-address 박공 양면과 하부 단면에 창·문 head를 놓아 누광·벽 돌출·마당 폐쇄·주랑 차단을 각각 찾는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 박공 및 노출 천장 요구에 벽 연장과 roof 끝면만으로 닫는 접점별 경계를 더한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work roof-form의 박공과 ceilings의 제실/주랑 노출 하부를 고정 순환에 대조했다. 통행을 막지 않는 roof 높이 차이 폐쇄가 가능해 새 방이나 평천장으로 부모를 고치지 않았다.
@evidence settings/20-envelope.md#roof-form 처마 기준에서 벽을 수평 절단하지 않고 박공과 경사 roof 하부까지 이어 닫는다.
@evidence settings/20-envelope.md#ceilings 비거주 구조 틈은 추가 실내로 만들지 않고 제실·주랑의 노출 하부를 기존 공간 표면에 남긴다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 마당-보관실 끝벽과 포치 뒤 높이차까지 배정해 보이는 정면 박공만 닫지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 벽 연장과 roof 끝면만의 폐쇄를 접점 표로 구별해 열린 주랑의 높이차를 처리한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 실제 roof 하부가 벽 상단을 정하며 이 H2는 경사/높이를 새로 선택하지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 주랑 위 구간에는 바닥부터의 벽이 없고 마당 앞 기존 끝벽만 roof 아래까지 이어진다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 박공 양면과 내부 하부를 기존 입면/방/roof로 돌려 junctions가 표면 공동 소유가 되지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 창/문 head와 박공 단면을 함께 읽어 벽 돌출·누광·마당 폐쇄·통행 차단을 반증한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 박공 약속에 기존 벽 범위와 roof-only 폐쇄 범위를 구별한 접점별 결정을 추가했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 순환을 막지 않고 높이차만 닫는 방법이 있어 새 방이나 평천장을 부모에 요구하지 않았다.
@evidenceReview settings/20-envelope.md#roof-form #e18ede4 처마 기준에서 벽을 수평 절단하지 않고 각 위치의 경사 하부까지 닫는다.
@evidenceReview settings/20-envelope.md#ceilings #c397437 낮은 천장 위 빈틈에 내부용 마감/문/관찰 방을 새로 만들지 않아 노출 하부와 비거주 틈을 구별한다.
-->

[지붕 합성](roofs/assembly.md#roof-junctions)의 상면·평행 하부면을 소비한다. 지붕 밑 벽의 상단은 벽 두께 안 각 위치의 실제 지붕 하부까지 닫는다. 처마 기준 높이에서 수평으로 자르거나 그 높이를 경사지붕 위로 돌출시키지 않는다. 아래 표는 기존 경계의 높이와 노출 면을 배정하며 주랑의 열린 cell 사이에 새로운 바닥부터의 막음벽을 만들지 않는다.

| 지붕 끝/접점 | 실체 경계와 노출 표면 소유 |
| --- | --- |
| 서측 날개 북·남 박공 | 북·남 외벽의 연장. 바깥은 해당 입면, 아래 방 쪽은 봉헌실/주랑 소유 |
| 제실 북·남 박공 | 북측 외벽과 boundary-sanctuary-south의 연장. 북쪽 바깥은 북측 입면, 남쪽은 주랑, 제실 쪽은 제실 소유 |
| 동측 날개 북쪽, 마당과 맞닿는 구간 | boundary-yard-storage를 지붕 하부까지 연장. 마당 쪽은 service-yard, 보관실 천장 아래쪽은 storage 소유 |
| 동측 날개 북쪽, 주랑 위 구간 | 북쪽 주랑 덮개와 합성된 지붕 접합. 낮은 지붕 상면과 높은 지붕 하부 사이의 노출 높이 차이만 동측 roof owner의 외측 끝면으로 닫으며 기존 주랑 cell 사이를 바닥부터 막는 벽은 없음 |
| 동측 날개 남쪽 박공 | 남측 외벽의 연장. 바깥은 남측 입면, 아래 방 쪽은 관리실/주랑 소유 |
| 포치 정면 박공 | 포치 수평 보 위 삼각 막음. 남측 입면 소유이며 보 아래 현관 통과 공간은 열림 |
| 포치 뒤와 남쪽 덮개의 높이 차이 | 현관 후퇴벽·반환벽의 평면 범위 안에서는 기존 벽을 연장해 폐쇄. 그 범위를 넘어선 notch 가장자리는 두 roof 면 사이의 높이 차이만 남쪽 주랑 roof의 끝면으로 닫고 아래 주랑은 열어 둠. 벽 쪽의 현관/주랑 마감과 바깥 면은 기존 소유 유지 |

마당의 낮은 북·동 외벽 높이를 보관실 북쪽 박공에 복사하지 않는다. 지붕이 교차하는 곳에서는 합성 뒤 노출된 끝 단면과 표에 명시된 높이 차이를 닫고, 다른 지붕에 붙어 숨은 절단면을 외부 띠로 추가하지 않는다. 낮은 천장 위 구조 빈틈에는 내부용 새 마감·문·층·관찰 방을 만들지 않는다. source에서 접합 계산은 junctions, 벽 실체는 기존 경계, 지붕 실체는 각 roof owner가 받는다.

관찰은 모든 박공 끝의 양면·지붕 하부 단면과 마당에서 보관실 북쪽 끝을 올려다보는 위치를 포함한다. 높은 창 void와 문 head의 상단도 이 단면에 함께 놓는다. 누광 틈, 지붕을 뚫는 벽 상단, 마당 하늘의 잘못된 폐쇄, 주랑 통행을 가르는 막음 중 하나라도 있으면 해당 접합과 소비자를 수리한다. 실체·그림자·방 읽힘은 unverified다.
