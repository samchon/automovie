# 후면 제실의 높은 박공

## 후면 축의 용마루 {#sanctuary-roof}

<!--
@evidence principles/core/common.md#scope-preservation 후면 제실의 높은 박공·양 경사면·용마루·외부 처마와 높은 창 위 roof 두께를 남긴다.
@evidence principles/core/common.md#substantive-completion X=±5.75m와 전후 지지선, X=0의 Z 방향 용마루 및 네 후보 끝 참조면을 정한다.
@evidence principles/core/common.md#declared-basis 공통 경사/높이로 계산한 약 5.873m를 설정 허용과 비교하며 실제 기와나 목재 완성이 아니라고 밝힌다.
@evidence principles/design/spaces.md#space-topology 북남 박공이 제실 위를 닫고 날개/주랑과 겹친 끝만 합성에서 잘리며 제실 벽과 층은 움직이지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority roof 상부/외부 하부는 sanctuary roof, 박공 벽면은 입면/주랑, 내부 하부는 제실 공간으로 배정한다.
@evidence principles/design/spaces.md#space-verification-address 정후면에서 높은 박공을, 내부에서 목재 단면을, 창 위에서 roof 두께의 충돌을 확인한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 후면의 높은 박공 정체성에 양 지지선과 축상 용마루의 방향·높이를 더한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work roof-form의 허용 높이에 공통 경사의 제실 폭을 적용했다. 계산 용마루가 허용 안에 있어 공간을 낮추거나 설정 상한을 늘리지 않았다.
@evidence settings/20-envelope.md#roof-form 낮은 날개보다 높은 제실 박공을 설정 허용 높이 안의 축상 용마루로 정한다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 높은 박공의 두 경사면과 외부 하부, 높은 창 위 두께까지 한 roof에 남겼다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 X=0의 Z 방향 용마루와 네 후보 끝 참조면이 있어 후면 축 roof를 재현할 입력이 있다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 약 5.873m는 공통 경사에서 계산한 매스 값이며 기와/목재가 완성됐다는 주장이 아니다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 후보 처마를 합성에서 잘라도 제실의 벽이나 층을 이동시키지 않는다고 명시했다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 박공 벽 외면과 방 내부 하부를 roof 상면 소유에서 분리해 같은 면의 이중 저작을 막는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 창 위 roof 두께와 내부 높은 단면을 함께 보므로 외관 실루엣만의 검사가 아니다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 높은 후면 roof 약속에 양 지지선과 축상 용마루의 방향/높이를 추가했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 공통 경사로 계산한 제실 용마루가 설정 허용 안이라 상한 확대나 방 축소가 필요하지 않았다.
@evidenceReview settings/20-envelope.md#roof-form #e18ede4 낮은 날개 위 박공을 남기면서 설정 허용 높이 안의 매스를 선택했다.
-->

[제실 공간](../rooms/sanctuary.md#sanctuary-volume) 위의 지지선은 X=±5.75m, 북쪽 Z=-9.95m, 남쪽 Z=-4.0m다. [공통 높이·경사](assembly.md#roof-junctions)를 소비한 용마루는 X=0의 Z 방향 직선이고, 박공은 북·남을 향한다. 이 매스의 계산 용마루는 약 5.873m로 [설정 허용 높이](../../settings/20-envelope.md#roof-form) 안이다.

후보 끝선의 참조면은 [기준선](../building.md#plan-datums)의 서쪽 west-room, 동쪽 east-room, 북쪽 north-outer, 남쪽 north-ring이다. 각 면에서 공통 돌출을 바깥쪽으로 적용한다. 북측의 노출 박공 처마는 외벽 바깥면을 기준으로 돌출하며, 날개·주랑과 겹친 후보 끝은 assembly에서 자른다. 이 끝선 변경은 층이나 제실의 벽 위치를 바꾸지 않는다.

source `src/spaces/roofs/sanctuary.ts`가 두 경사 상면, 용마루, 외부 처마 하부와 끝 두께를 한 소유로 맡는다. 박공 벽의 외면은 북측 입면 및 제실 남쪽의 주랑 내면이고, 내부 노출 하부는 제실의 표면 소유다. 높은 창은 같은 박공 벽의 [void](../openings.md#clerestories)를 소비한다. 서측 날개와 만나는 면은 공통 교차 규칙으로 자른다.

정면·후면에서 낮은 날개 위 박공이 읽히는지, 내부에서 높은 목재 단면이 남는지, 창 위에 지붕 두께가 들어가는지를 관찰한다. 이는 지붕 매스 선택이며 실제 기와·목재 모듈이나 렌더 완료가 아니다.
