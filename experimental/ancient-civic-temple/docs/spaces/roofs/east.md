# 동측 업무 날개의 지붕

## 마당 앞에서 끝나는 덮개 {#east-roof}

<!--
@evidence principles/core/common.md#scope-preservation 세 업무방과 동쪽 주랑을 덮으면서 후면 서비스 마당의 열린 하늘을 보존한다.
@evidence principles/core/common.md#substantive-completion 동측 지지선과 Z=-2.3~9.95m 영역, 마당/보관실 공유벽 위 북쪽 끝을 정한다.
@evidence principles/core/common.md#declared-basis 높이·경사·돌출은 공통 접합, 경계 참조면은 기준선을 소비하고 공유벽 중심에서 처마를 재지 않는다.
@evidence principles/design/spaces.md#space-topology 북쪽은 마당 앞에서 끝나며 주랑 위 겹침만 북쪽 canopy와 합성해 마당을 실내 방으로 바꾸지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority east roof는 상면/용마루/외부 하부를 소유하고 각 업무방 천장과 주랑 노출 하부는 방 owner에게 준다.
@evidence principles/design/spaces.md#space-verification-address 동측 입면·마당에서 올려다본 북끝·세 방 천장·중정 처마로 열린 마당과 덮인 보관실이 뒤바뀌는 오류를 찾는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 우측 연속 업무방과 후면 마당의 요구에 roof 북단이 멈출 정확한 공유벽 및 돌출 참조면을 더한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work service-yard의 열린 위쪽과 roof-form의 처마를 대조했다. 공유벽에서 끝나는 짧은 날개로 양립하므로 마당을 덮거나 업무방을 줄이지 않았다.
@evidence settings/30-interiors.md#service-yard 마당 하늘에는 북쪽 돌출 처마 이외의 업무 날개 roof를 연장하지 않는다.
@evidence settings/20-envelope.md#roof-form 업무 날개에 Z 방향 용마루와 외벽/중정 경계를 기준으로 한 처마를 부여한다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 세 업무방과 동쪽 주랑을 덮되 후면 마당 하늘은 별도 열린 영역으로 남는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 북쪽 끝을 마당/보관실 공유벽 위에 두고 Z축 용마루의 짧은 날개를 정했다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb yard-front에서 북쪽 돌출을 재므로 공유벽 중심을 처마 참조면으로 바꾸지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 주랑 위 겹침은 canopy와 합성하지만 마당을 지붕 아래 방으로 만들지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 업무방 낮은 천장과 주랑 노출 하부는 각 공간이 받고 east는 외부 roof를 소유한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 마당에서 북쪽 끝을 올려다보는 관찰이 열린 마당/덮인 보관실의 뒤바뀜을 드러낸다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 연속 업무방 요구에 열린 마당 앞에서 멈출 공유벽과 실제 돌출 참조면을 더했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 짧은 날개의 끝에서 처마만 남기면 열린 마당과 roof 요구가 양립해 방을 줄일 필요가 없다.
@evidenceReview settings/30-interiors.md#service-yard #bc0ce16 마당으로 넘어가는 것은 돌출 처마뿐이며 업무 roof의 본체를 연장하지 않는다.
@evidenceReview settings/20-envelope.md#roof-form #e18ede4 Z 방향 용마루와 외벽/중정 기준 처마가 우측 날개의 실제 경사 매스를 정한다.
-->

지지선은 [중정 동쪽 기준선](../building.md#plan-datums)과 X=10.2m, Z=-2.3~9.95m다. X 방향 단면의 중점에 Z 방향 용마루가 있고 높이·경사·돌출은 [공통 접합](assembly.md#roof-junctions)을 따른다. 북쪽 끝은 서비스 마당/보관실 공유 벽 위다. 돌출 처마를 제외하고 마당 하늘을 덮지 않는다.

끝선의 참조면은 서쪽 east-court, 동쪽 east-outer, 북쪽 yard-front, 남쪽 south-outer다. 각 면에서 공통 돌출을 바깥쪽으로 적용하므로 북쪽 돌출은 마당 쪽 벽면에서 잰다. 주랑 위 후보 부분도 같은 북쪽 끝선을 쓰고 북쪽 덮개와 합성한다. 외벽 또는 공유 벽 중심에서 돌출 길이를 재지 않는다.

source `src/spaces/roofs/east.ts`가 업무 날개 상면·용마루·외부 처마 하부를 소유한다. 관리실·기록실·보관실의 낮은 천장과 주랑의 노출 하부는 각각 자기 공간 소유가 받는다. 북쪽 주랑 덮개와의 교차선은 같은 assembly 규칙을 쓰며 서비스 마당을 평평한 지붕 아래 방으로 바꾸지 않는다.

동측 입면, 마당에서 북쪽 지붕 끝을 올려다보는 장면, 세 방 천장과 중정 쪽 처마를 검사한다. 마당의 열린 면이나 보관실의 덮인 면이 서로 바뀌면 이 지붕과 공간의 공유 경계부터 수리한다.
