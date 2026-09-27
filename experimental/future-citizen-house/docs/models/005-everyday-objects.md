# 시민 주택의 생활 사물 모델

[공통 단위·주소·관찰](000-representation.md#model-address-and-scale)을 따른다. 방별 독립 물체를 세는 작업 목록은 `.wiki/사물-목록.md`에 있으며 이 문서는 종류별 재사용 형상만 정한다. 아래 변종은 `state`로 판별하고 같은 state는 동일한 부품과 치수를 낸다. 각 표의 수치는 m 단위의 국소 점유다. 이 설계는 재료의 실제 결합·방별 배치·작동 구현을 주장하지 않는다.

## 직물과 출입 매트 {#household-textiles}

<!--
@evidence principles/core/common.md#scope-preservation 쿠션·베개·담요·여분 침구·시트·식탁·욕실·출입 매트의 고정 변종만 내고 풀림·세탁 동작은 주장하지 않는다.
@evidence principles/core/common.md#substantive-completion 각 직물의 닫힌 body와 둘레·받침 face를 내고 접힌 셋의 V홈 및 outdoor-mat의 교차 홈을 실제 형상으로 만든다.
@evidence principles/core/common.md#declared-basis ref02 침실 직물, ref03 소파·식탁, ref04 손님 침구 가능성을 받고 각 상태 W/H/D와 홈 비율은 이 절에서 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation upper-program의 침대·linen 수납과 ground-program의 공용실·주방에 침구·행주·출입 매트의 독립 직물 원형을 더한다.
@evidence principles/design/models.md#representation-contract 접힘 홈 바닥 아래는 연속 고체로 남고 outdoor-mat 홈은 가장자리 테두리와 밑면 두께를 남긴다.
@evidence principles/design/models.md#spatial-convention 놓이는 면 중심 원점, 보는 앞 +Z로 두며 bedding-set 점유는 상층 open-shelf의 지정 칸과 대조한다.
@evidence principles/design/models.md#reviewable-structure 정면·상부·45°에서 각 몸체 두께·V형 접힘·격자 홈·독립 직물 경계를 확인한다.
@evidence principles/design/models.md#model-observable-style-basis ref02·03·04의 직물 밀도를 역할별로 받고 ref01·05에서 보이지 않는 봉제 세부를 만들지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 표의 모든 W/H/D 상태에 upper·edge·sole을 내고 얇은 매트에는 underside를 따로 내어 전체 점유를 닫는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work upper-program의 침대·linen 수납과 ground-program의 주방·현관을 시험했다. 침구는 매트리스, 행주는 상판, 매트는 출입 바닥에 놓는 고정 직물이며 정확한 수량과 위치는 배치가 정하므로 방 기능·가변 상태를 늘리지 않는다.
@evidence settings/002-household.md#upper-program 침대와 linen 수납을 침구 원형의 사용·보관 목적지로 받는다.
@evidence settings/002-household.md#ground-program 주방과 현관을 행주·출입 매트의 가능한 목적지로 받는다.
@evidence settings/003-spatial-basis.md#surface-decomposition 직물·매트의 독립 형상과 face 주소를 models가 정한다.
@evidenceReview principles/core/common.md#scope-preservation  열 개 @inventory는 고정된 쿠션·침구·천·매트 몸체만 내고 풀림·세탁·물성은 미검증으로 둔다.
@evidenceReview principles/core/common.md#substantive-completion  각 body의 @part·@envelope에 접촉면이 있고 접힌 세 직물의 V 홈과 outdoor-mat의 교차 홈이 본문 식으로 정해진다.
@evidenceReview principles/core/common.md#declared-basis  ref02 침실, ref03 소파·식탁, ref04 손님 침구를 목적지로 받고 W/H/D와 홈 비율은 로컬 수치다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation  침대·linen과 공용실·주방의 부모 용도에 침구·행주·매트의 별도 국소 직물 원형을 추가한다.
@evidenceReview principles/design/models.md#representation-contract  접힘 V 홈 아래 body를 이어 두고 outdoor-mat 격자에는 바깥 테두리와 양수 바닥 두께를 남긴다.
@evidenceReview principles/design/models.md#spatial-convention  모든 상태는 놓이는 면 중심 원점·관찰 앞 +Z이고 bedding-set은 upper-storage의 shelf-3·4 사이 칸과 비교하도록 밝힌다.
@evidenceReview principles/design/models.md#reviewable-structure  body/upper·edge·sole와 얇은 매트의 underside가 정면·상부·45°에서 두께와 홈을 관찰하게 한다.
@evidenceReview principles/design/models.md#model-observable-style-basis  ref02·03·04의 방별 직물 밀도를 쓰되 ref01·05에서 보이지 않는 봉제 세부는 만들지 않는다.
@evidenceReview principles/design/models.md#model-scale-layer-completion  열 상태 각각의 @envelope와 @part body가 표의 W/H/D를 닫고 얇은 매트의 받침면도 주소로 남긴다.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work  침대·linen·주방·현관 목적지에 고정 직물 종류를 대조했고 수량과 놓일 위치는 배치가 정해 방·상태 확장이 없다.
@evidenceReview settings/002-household.md#upper-program  상층 침대와 linen 보관 목적지에 pillow·blanket·bedding-set·folded-sheet 변종을 연결한다.
@evidenceReview settings/002-household.md#ground-program  1층 주방과 현관을 dishcloth·entry-mat·outdoor-mat의 가능한 목적지로 받는다.
@evidenceReview settings/003-spatial-basis.md#surface-decomposition  독립 body/upper·edge·sole 및 매트 underside 주소와 정지 홈 형상을 모델에 둔다.
-->

`household-textiles`는 소파 쿠션, 베개, 담요, 여분 침구 세트, 접힌 시트, 식탁 매트, 행주, 욕실 매트와 실내외 출입 매트를 직물과 고무의 치수·표면 상태 변종으로 만든다. 각 상태는 하나의 닫힌 몸체이며 침대 매트리스나 소파 본체에 합치지 않는다. 표의 원점은 놓이는 면의 중심이고 +Z는 물체를 보는 앞이다. 테두리 봉제선은 `body/edge`, 노출 윗면은 `body/upper`, 받침면은 `body/sole`로 나누며 얇은 매트는 뒷면도 별도 `body/underside`다. 접힌 직물은 위아래 층의 실루엣을 한 부품 안에서 접힌 자국으로 표현하되 풀림 동작은 만들지 않는다.

직물 상태의 W×H×D는 표의 `body` 구간 길이다. `curved` 상태는 반경 min(H/2,W/12,D/12)로 XZ 평면의 네 모서리를 각각 여섯 호 구간으로 둥글리고, Y 단면은 바닥 y=0과 평평한 중앙 상면 y=H를 유지한다. `sofa-cushion`, `pillow`, `dishcloth`에는 별도 crown을 만들지 않는다. `blanket`, `bedding-set`, `folded-sheet`은 상면에서 X 방향으로 뻗는 중앙 z=0의 V형 접힘 홈 하나를 낸다. 홈의 양쪽 경계는 z=±D/24, 바닥은 y=H−H/8, 단면은 두 직선이며 홈 바닥 아래 몸체는 연속 고체다. `bedding-set`의 지정 수납칸은 상층 수납실의 `cabinet-and-shelf/open-shelf/1100x2600x500/open` shelf-3의 윗면과 shelf-4의 아랫면 사이 칸이며 여분 침구의 0.55×0.16×0.42m 점유를 그 안에서 instances가 대조한다. `box` 상태는 표 AABB를 채운 평평한 판이다. `outdoor-mat`만 상면에 X·Z 양 방향 격자 홈을 낸다. 홈 중심은 X축에서 x=−W/2+(k+1/2)W/8, Z축에서 z=−D/2+(j+1/2)D/8로 놓고 k,j=0..7의 여덟 줄씩을 서로 교차시킨다. 각 줄의 폭은 D/100, 깊이는 H/7이다. X 중심을 가진 줄은 Z 방향으로 z=−D/2+D/100..D/2−D/100만 절삭하고 Z 중심을 가진 줄은 X 방향으로 x=−W/2+D/100..W/2−D/100만 절삭한다. 따라서 네 바깥 edge마다 길이 방향 끝에서 홈 폭 D/100의 연속 테두리가 남는다. 홈 바닥과 몸체 밑면 사이의 양수 두께를 유지한다. 네 중립 관찰에서 접힘 홈·봉제 edge·빈 주변 면을 판독한다.

각 상태의 정확한 점유는 아래 표가 소유한다. `body`의 윗면·둘레·밑면은 모두 face 주소를 가지며 접촉하는 밑면도 geometry에서 빠지지 않는다.

ref02의 침실 직물과 ref03의 소파·식탁 밀도, ref04의 손님 침구 가능성을 기준으로 정면·상부·45°에서 개별 직물의 두께와 독립된 경계가 읽혀야 한다. ref01·05는 이 직물의 세부를 주지 않는다. 섬유 물성·세탁 성능은 `unverified`다.

@flat-contact sofa-cushion: body, support, -Y, 0, -0.20..0.20, -0.17..0.17
@flat-contact pillow: body, support, -Y, 0, -0.28..0.28, -0.17..0.17
@flat-contact blanket: body, support, -Y, 0, -0.60..0.60, -0.80..0.80
@flat-contact bedding-set: body, support, -Y, 0, -0.22..0.22, -0.17..0.17
@flat-contact folded-sheet: body, support, -Y, 0, -0.17..0.17, -0.13..0.13
@flat-contact dishcloth: body, support, -Y, 0, -0.13..0.13, -0.10..0.10

@inventory sofa-cushion: body
@inventory pillow: body
@inventory blanket: body
@inventory bedding-set: body
@inventory folded-sheet: body
@inventory placemat: body
@inventory dishcloth: body
@inventory bath-mat: body
@inventory entry-mat: body
@inventory outdoor-mat: body

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | sofa-cushion | * | bounds | -0.24..0.24 | 0..0.16 | -0.21..0.21 | - |
| @part | sofa-cushion | body | curved | -0.24..0.24 | 0..0.16 | -0.21..0.21 | support |
| @envelope | pillow | * | bounds | -0.34..0.34 | 0..0.14 | -0.215..0.215 | - |
| @part | pillow | body | curved | -0.34..0.34 | 0..0.14 | -0.215..0.215 | support |
| @envelope | blanket | * | bounds | -0.7..0.7 | 0..0.045 | -0.9..0.9 | - |
| @part | blanket | body | curved | -0.7..0.7 | 0..0.045 | -0.9..0.9 | support |
| @envelope | bedding-set | * | bounds | -0.275..0.275 | 0..0.16 | -0.21..0.21 | - |
| @part | bedding-set | body | curved | -0.275..0.275 | 0..0.16 | -0.21..0.21 | support |
| @envelope | folded-sheet | * | bounds | -0.21..0.21 | 0..0.09 | -0.165..0.165 | - |
| @part | folded-sheet | body | curved | -0.21..0.21 | 0..0.09 | -0.165..0.165 | support |
| @envelope | placemat | * | bounds | -0.22..0.22 | 0..0.006 | -0.155..0.155 | - |
| @part | placemat | body | box | -0.22..0.22 | 0..0.006 | -0.155..0.155 | support |
| @envelope | dishcloth | * | bounds | -0.17..0.17 | 0..0.018 | -0.14..0.14 | - |
| @part | dishcloth | body | curved | -0.17..0.17 | 0..0.018 | -0.14..0.14 | support |
| @envelope | bath-mat | * | bounds | -0.375..0.375 | 0..0.012 | -0.24..0.24 | - |
| @part | bath-mat | body | box | -0.375..0.375 | 0..0.012 | -0.24..0.24 | support |
| @envelope | entry-mat | * | bounds | -0.45..0.45 | 0..0.014 | -0.275..0.275 | - |
| @part | entry-mat | body | box | -0.45..0.45 | 0..0.014 | -0.275..0.275 | support |
| @envelope | outdoor-mat | * | bounds | -0.45..0.45 | 0..0.014 | -0.275..0.275 | - |
| @part | outdoor-mat | body | box | -0.45..0.45 | 0..0.014 | -0.275..0.275 | support |

<!-- @authored-address-state:start -->
@address-state sofa-cushion: body
@address-state pillow: body
@address-state blanket: body
@address-state bedding-set: body
@address-state folded-sheet: body
@address-state placemat: body
@address-state dishcloth: body
@address-state bath-mat: body
@address-state entry-mat: body
@address-state outdoor-mat: body
<!-- @authored-address-state:end -->

## 주방 상부장 부착 배기 후드 {#kitchen-extractor}

<!--
@evidence principles/core/common.md#scope-preservation 상부장 아래 얇은 후드 외형만 내고 유량·배관·소음·전원 성능을 주장하지 않는다.
@evidence principles/core/common.md#substantive-completion 닫힌 body 밑면에 좌우 두 filter를 틈 두고 붙여 금속 판과 망 면을 별도 주소로 낸다.
@evidence principles/core/common.md#declared-basis ref03의 조리면 위 상부장 위치를 받고 상부장 cleat·깊이와의 접촉은 이 절과 cabinet 치수로 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation ground-program의 induction cooktop과 common-room의 주방 영역에 놓을 선택 기구로 돌출 몸체·좌우 필터의 후드를 더한다.
@evidence principles/design/models.md#representation-contract body와 두 필터는 불투명 닫힌 부품이며 중앙 틈을 남기고 흡입 구멍의 실제 유량 형상은 만들지 않는다.
@evidence principles/design/models.md#spatial-convention body 상면 중심 원점, 조리대 폭 +X, 필터 쪽 -Y, 사용자 쪽 +Z로 두고 뒤면을 벽 datum에 붙인다.
@evidence principles/design/models.md#reviewable-structure 정면·밑면·45°에서 금속 판, 두 filter의 별도 아래면과 중앙 간격을 확인한다.
@evidence principles/design/models.md#model-observable-style-basis ref03의 상부장 아래 조리 위치를 받으며 외피·욕실 설비를 후드 상세로 옮기지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 상부장 밑면 접촉은 뒤쪽 깊이 구간 전체로 닫고 나머지 앞쪽 상면은 상부장 전면 밖으로 돌출한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work ground-program의 induction cooktop, common-room의 주방, surface-decomposition의 설비 형상 소유를 시험했다. 후드는 상부장 밑면에 닿는 선택 물체이며 필터 형상만 정의하고 배기 성능·새 방·작동 상태를 요구하지 않는다.
@evidence settings/002-household.md#ground-program 주방 induction cooktop을 그 위에 놓일 후드의 사용 근거로 받되 후드 자체는 모델 선택이다.
@evidence spaces/002-spatial-graph.md#common-room 연속 공용실 주방을 후드의 목적지로 받고 실제 상부장 정렬은 instances에 남긴다.
@evidence settings/003-spatial-basis.md#surface-decomposition 후드 몸체·필터의 형상·face를 models가 정하고 환기 성능은 주장하지 않는다.
@evidenceReview principles/core/common.md#scope-preservation  @inventory는 상부장 밑 얇은 body와 필터 둘만 내고 유량·배관·소음·전원은 미검증으로 둔다.
@evidenceReview principles/core/common.md#substantive-completion  @part body 아래에 filter-left·right가 각각 붙고 x=-0.01..0.01m 중앙 틈과 별도 금속 망 면을 남긴다.
@evidenceReview principles/core/common.md#declared-basis  ref03 조리면 위 상부장 하단을 목적지로 받아 cleatDepth·외함 깊이와의 접촉 관계를 이 H2에 명시한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation  induction cooktop과 common-room 주방에 별도 얇은 후드 몸체 및 좌우 필터의 선택 기구 형상을 더한다.
@evidenceReview principles/design/models.md#representation-contract  세 @part는 닫힌 불투명 판이며 중앙 틈을 흡입 구멍이나 작동 배기 경로로 주장하지 않는다.
@evidenceReview principles/design/models.md#spatial-convention  body 상면 중심 원점, 조리대 폭 +X, 필터 -Y, 사용자 +Z 및 뒤쪽 벽 접촉 Z 하한을 지정한다.
@evidenceReview principles/design/models.md#reviewable-structure  body/underside와 filter-*/underside·edge가 정면·밑면·45°에서 두 필터와 중앙 틈을 보이게 한다.
@evidenceReview principles/design/models.md#model-observable-style-basis  ref03 상부장 아래 조리 위치만 사용하고 외피나 욕실 설비를 후드 형상으로 옮기지 않는다.
@evidenceReview principles/design/models.md#model-scale-layer-completion  상부장 cleat·깊이 식으로 body 상면의 뒤쪽 접촉과 앞쪽 돌출을 나누며 @envelope는 0.64×0.48×0.097m다.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work  주방 cooktop·common-room과 기구 형상 권한에 선택 후드를 대조했고 필터 외형만 내어 새 방·작동 상태가 없다.
@evidenceReview settings/002-household.md#ground-program  주방 induction cooktop을 후드의 가능한 아래 기구로 받아 후드 자체는 저작 선택으로 둔다.
@evidenceReview spaces/002-spatial-graph.md#common-room  공용실 주방을 설치 목적지로 받고 상부장과 cooktop의 world 정렬은 배치에 남긴다.
@evidenceReview settings/003-spatial-basis.md#surface-decomposition  body/upper·underside와 filter-left·right/underside·contact를 안정 형상·마감 면 주소로 낸다.
-->

ref03의 조리면 위 상부장 하단에 얇은 금속 배기 후드를 둔다. `body` 상면의 폭·깊이 중심이 원점이고 +X는 조리대 폭, −Y는 아래쪽 필터 면, +Z는 사용자가 서는 쪽이다. 벽의 안쪽 평면은 원점에서 D/2 뒤인 `@part body`의 Z 하한이며 그 뒤쪽 면이 벽에 닿는다. `wall/2900x980x360` 상부장의 cleatDepth를 c, 외함 깊이를 D_c라 두면 밑면은 이 국소 좌표에서 z=−D/2+c..−D/2+c+D_c이다. `body` 상면 y=0의 바로 그 구간 전체가 상부장 밑면에 닿고 z=−D/2+c+D_c..+D/2의 앞쪽 상면은 상부장 전면보다 돌출한다. 벽 조리대·쿡탑과 후드의 world 정렬은 instances가 결정한다. 환기량·배관·소음 성능은 `unverified`다.

후드는 표에 정한 몸체와 밑면의 좌우 필터 두 장으로 읽힌다. 몸체의 상면은 상부장 밑면 datum과 접촉하고, 필터는 몸체 아래면에 서로 틈을 두고 붙는다. 안정 주소는 `body/upper/underside/edge`, `filter-left/underside/edge/contact`, `filter-right/underside/edge/contact`이며 각 필터의 노출 아래면은 별도 금속 망 face로 구별한다. 흡입 구멍의 실제 유량은 만들지 않으며 몸체·필터·끝면은 차단된 불투명 형상이다.

정면·밑면·45°의 중립 관찰에서 조리대 위 금속 판, 좌우 필터, 중앙 틈을 확인한다. ref03의 상부장 아래 조리 위치를 따르고 ref01·02·04·05의 외피·욕실 설비를 주방 기구의 형상으로 옮기지 않는다. 전원과 배기 연결은 `unverified`다.

@material-face default: filter-left/underside
@material-face default: filter-right/underside
@inventory default: body, filter-left, filter-right

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | default | * | bounds | -0.32..0.32 | -0.097..0 | -0.24..0.24 | - |
| @part | default | body | box | -0.32..0.32 | -0.09..0 | -0.24..0.24 | underside,filter-left,filter-right |
| @part | default | filter-left | box | -0.27..-0.01 | -0.097..-0.09 | -0.18..0.18 | body |
| @part | default | filter-right | box | 0.01..0.27 | -0.097..-0.09 | -0.18..0.18 | body |

<!-- @authored-address-state:start -->
@address-state default: body, filter-left, filter-right
<!-- @authored-address-state:end -->

## 신발·의복·우산 {#personal-articles}

<!--
@evidence principles/core/common.md#scope-preservation 신발 한 짝·코트·일상 옷·옷걸이·닫힌 우산·꽂이를 prototype으로 내고 짝·여덟 벌의 수는 instances에 둔다.
@evidence principles/core/common.md#substantive-completion 신발 발목 절삭, 옷 걸림 구멍, hanger 고리·어깨, 열린 우산꽂이의 실제 접촉면을 닫는다.
@evidence principles/core/common.md#declared-basis 현관·옷장 수납 호출을 받고 의복 실루엣·구멍 반지름·걸이 좌표는 이 절의 모델 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation ground-program의 신발 수납과 upper-program의 wardrobe에 신발·의복·우산의 독립 원형 및 서로 다른 걸림 구조를 더한다.
@evidence principles/design/models.md#representation-contract 코트·옷의 loop-inner를 실제 Z 관통 구멍으로 만들고 hanger 어깨·hook 접합부는 연속 고체로 잇는다.
@evidence principles/design/models.md#spatial-convention 바닥 소품은 접촉 중심, 걸린 셋은 상부 걸림점 y=0을 원점으로 하여 -Y로 내려가며 모두 +Z를 앞에 둔다.
@evidence principles/design/models.md#reviewable-structure 정면에서 신발·옷 윤곽, 상부와 측면에서 열린 걸림면과 옷장 봉·코트 걸이의 비관통 접촉을 본다.
@evidence principles/design/models.md#model-observable-style-basis 현관 신발·의복·우산의 생활 밀도를 따르되 개인의 직업·상표·섬유 무늬를 형상 근거로 만들지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 각 W/H/D 상태에 닫힌 body와 필요한 loop-inner·hook·우산꽂이 rim을 내고 hanger의 7.5° facet 걸림을 수치로 둔다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work ground-program의 신발 수납·현관과 upper-program의 침실 wardrobe를 시험했다. 신발의 바닥 접촉, 의복의 봉 구멍, 우산의 손잡이는 선택 생활 물품 원형에 닫히고 실제 수량·걸림은 배치가 정하므로 새 수납실이 필요하지 않다.
@evidence settings/002-household.md#ground-program 현관의 신발 수납을 신발·우산의 가능한 목적지로 받는다.
@evidence settings/002-household.md#upper-program 침실 wardrobe를 의복·걸이 원형의 보관 목적지로 받는다.
@evidence settings/003-spatial-basis.md#surface-decomposition 신발·의복·우산의 재사용 형상·face를 models가 소유한다.
@evidenceReview principles/core/common.md#scope-preservation  @inventory는 신발 한 짝·코트·옷·걸이·우산·꽂이 원형만 두고 짝과 여덟 벌의 반복은 instances에 남긴다.
@evidenceReview principles/core/common.md#substantive-completion  shoe의 발목 절삭, coat·garment의 @bore-z, hanger hook과 umbrella-stand @bore가 보이는 빈 곳과 지지를 정한다.
@evidenceReview principles/core/common.md#declared-basis  현관·옷장 수납 목적지를 받고 W/H/D, 걸림 구멍과 hook facet은 이 H2의 모델 식·표가 정한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation  1층 신발 수납과 상층 wardrobe에 바닥 신발·우산 및 매달린 의복·걸이의 별도 소품을 더한다.
@evidenceReview principles/design/models.md#representation-contract  @bore-z coat·garment는 실제 관통 loop를 내고 hanger의 두 shoulder와 hook은 한 연속 body로 잇는다.
@evidenceReview principles/design/models.md#spatial-convention  바닥 세 원형은 접지 중심, 매달린 세 원형은 y=0 걸림점 원점이며 모두 전면 +Z라고 본문이 정한다.
@evidenceReview principles/design/models.md#reviewable-structure  body/sole·toe, body/loop-inner, body/hook-inner, 우산꽂이 inner가 정면·위·측면에서 걸림과 빈 곳을 보여준다.
@evidenceReview principles/design/models.md#model-observable-style-basis  현관·침실 생활 물품의 실루엣만 받고 특정 직업·브랜드·섬유 문양은 발행하지 않는다.
@evidenceReview principles/design/models.md#model-scale-layer-completion  여섯 @envelope와 @part, hook 7.5° facet 및 선반·봉 접촉 좌표가 각 원형의 점유를 닫는다.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work  신발 수납·현관과 침실 wardrobe에 여섯 원형을 대조했고 짝·옷 수량과 실제 봉 배치는 instances에 남아 새 방이 없다.
@evidenceReview settings/002-household.md#ground-program  현관 신발 수납을 shoe·umbrella·umbrella-stand의 가능한 목적지로 받는다.
@evidenceReview settings/002-household.md#upper-program  침실 wardrobe를 garment·hanger의 보관 목적지로 받고 반복 수는 정하지 않는다.
@evidenceReview settings/003-spatial-basis.md#surface-decomposition  shoe/sole, coat·garment/loop-inner, hanger/hook-inner와 stand/inner를 안정 소품 face로 낸다.
-->

@material-face shoe: body/sole

`personal-articles`는 신발 한 짝, 걸린 코트와 일상 옷 한 벌, 옷걸이, 닫힌 우산과 우산꽂이를 독립 물체로 둔다. 신발 두 짝은 두 instance이고 옷 여덟 벌도 여덟 instance다. 신발·우산·꽂이는 바닥 접촉 중심이 원점이고, 코트·옷·옷걸이는 상부 걸림점이 y=0인 원점에서 −Y로 아래로 뻗는다. 후속 instances가 이 걸림점을 실제 옷장 봉에 맞춘다. 모두 +Z가 전면이다. 신발의 굽·발등·앞코는 닫힌 단일 `body/sole/upper/toe`의 서로 다른 face, 옷과 우산은 접힌 외형의 `body/front/back/edge` face이고 관통 탭을 가진 코트·일상 옷은 `body/loop-inner`를 더한다. 옷걸이의 고리와 어깨는 같은 연속 부품의 `body/hook/hook-inner/shoulder/shoulder-joint`로 구별하고 우산꽂이는 열린 `body/outer/inner/rim/sole`의 두께 있는 통이다.

`shoe`의 밑창은 XZ 전폭·전깊이와 y=0..H/8을 채운다. 윗몸체는 뒤 z=−D/2에서 y=H/8..H, 앞 z=D/2에서 y=H/8..H/2를 잇는 X 전폭의 닫힌 경사 쐐기다. 발목 개구는 중심 (x=0,z=−D/4), X 반경 W/4·Z 반경 D/8의 타원이며 y=H/2부터 윗면까지 절삭해 H/8 이상의 밑창을 남긴다. `garment`는 XY 윤곽을 Z=±D/2 사이에 압출하고 `coat`의 몸판·소매는 같은 XY 윤곽을 Z=+D/30..+D/2 사이에 압출한다. 코트의 뒤쪽 걸림 탭과 앞쪽 몸판은 목 아래 x=±W/16, y=−H/8..−3H/32, z=−D/2..+D/15의 닫힌 연결판으로 이어진다. 이 판은 걸이 팔의 최하단보다 아래에 놓이며 탭·몸판과 양수 부피로 겹친다. 닫힌 윤곽의 꼭짓점은 목 중심 (0,−H/16)에서 시작해 오른 어깨 (W/2,−H/8), 오른 소매 끝 (W/2,−H/2), 오른 겨드랑이 (3W/8,−H/2), 오른 허리 (7W/20,−3H/4), 오른 밑단 (7W/20,−H), 왼 밑단 (−7W/20,−H), 왼 허리 (−7W/20,−3H/4), 왼 겨드랑이 (−3W/8,−H/2), 왼 소매 끝 (−W/2,−H/2), 왼 어깨 (−W/2,−H/8)를 차례로 지나 시작점으로 닫는다. 허리 폭은 어깨 폭의 0.7배다. 몸판과 소매는 한 연속 고체다. `garment`는 목 위 x=±W/24, y=−H/8..0, z=±D/4의 닫힌 걸림 탭을 가진다. 탭 중심 (x=0,y=−H/16)의 반지름 0.0125m인 Z축 구멍을 몸판의 Z 전깊이 −D/2..D/2까지 절삭한다. 구멍은 탭의 양쪽 X에 W/24−0.0125m, 위쪽에 H/16−0.0125m, 아래쪽에 H/16−0.0125m의 양수 고체를 남긴다. 옷장 rod의 같은 24각 단면을 구멍과 동축으로 놓고 아래를 보는 안쪽 facet을 `body/loop-inner` 걸림면으로 발행한다. 옷 원점 높이는 rod 중심 높이+H/16이고, 원점 Z는 rod에 해당하는 옷장 변종의 rod 중심 Z다. 관통 구멍이 몸판의 목 아래로 걸친 구간에서도 봉과 옷이 교차하지 않는다. `coat`는 목 위 x=±W/16, y=−H/8..0, z=−D/2..−D/3의 닫힌 걸림 탭을 가진다. 코트 탭의 중심 (x=0,y=−H/16)에서 반지름 0.025m의 Z축 구멍을 탭 전체 깊이로 절삭하고, 아래를 보는 안쪽 24각 면을 `body/loop-inner` 걸림면으로 발행한다. 걸이 팔의 중심과 구멍의 중심을 맞추려면 코트 원점 높이를 걸이 팔 중심 높이+H/16으로 둔다. 코트 원점 깊이는 걸이 끝봉의 앞면−D/30으로 두며, 이때 탭의 world Z 범위는 원점−D/2..원점−D/3이고 끝봉 뒤 열린 구간 안에 있다. 몸판의 뒤쪽 world Z 경계는 끝봉 앞면에 닿고 연결판의 world Y 상한은 걸이 팔 아래면보다 낮다. 여기서 코트 W/H/D와 걸이 W/H/D는 각자의 표에서 읽으며 서로 혼동하지 않는다. `hanger`는 X 폭 W의 어깨 두 선분 중심선을 (−W/2+W/80,−H+W/80),(0,−H/2),(W/2−W/80,−H+W/80)로 잇고 각 선분은 XY 평면에서 W/40 폭, Z 전깊이 D를 가진다. 두 바깥 중심선 끝은 공통 끝 규칙의 XY 반원 반지름 W/80을 바깥으로 붙여 Z 전깊이로 압출하므로 X=±W/2와 Y=−H에 닿는다. 어깨 두 선분이 만나는 (0,−H/2)에 반지름 W/40의 XY 원판을 Z 전깊이로 압출한 `body/shoulder-joint`를 합쳐 V형 틈을 메우고, 이 원판은 두 어깨와 수직 목의 뿌리에 양수 부피로 이어진다. 갈고리는 어깨 중앙 (0,−H/2)에서 (0,−H/8)까지 올라가는 지름 W/40의 수직 목과, 중심 (r,−H/8)·반지름 r=0.0125+W/80인 XY 상부 반원으로 잇는다. 반원의 왼쪽 끝은 목의 상단에 닿고 관 단면 지름은 W/40이다. 위쪽에는 중심 x=r, X 폭 W/20·Z 전깊이 D·y=−W/80..0의 평평한 끝 탭을 같은 고체로 합친다. 갈고리 반원은 12개 직선 중심선 구간을 가지며 각 구간의 24각 관 단면을 이등분 mitre 평면에서 이어 내부 교차면을 제거한다. 곡률 중심을 보는 안쪽에 단면 한 facet의 중심을 두고 첫 꼭짓점은 그 방향에서 φ만큼 떨어뜨린다. φ=7.5°이며 아래 `@scalar-control hanger-hook-section-phase-deg`가 그 값을 소유한다. 목의 Y축 단면은 공통 규칙의 +X 첫 꼭짓점에서 시작하고 목의 마지막 W/40 길이에서 회전각 φ·(y−(−H/8−W/40))/(W/40)으로 선형 비틀어 반원의 첫 mitre 단면 위상에 접합한다. 이 전이 구간은 봉에 닿는 반원 안쪽 12개 facet에 포함하지 않는다. 반원의 안쪽 mitre 면 거리는 (r−W/80)cosφ=0.0125cosφ m이고 옷장 rod의 24각 apothem 0.0125cosφ m와 일치한다. 봉과 동축으로 놓고 봉의 24각 위상을 맞출 때 반원의 아래를 보는 안쪽 facet 12개가 각각 양수 면적으로 닿으며 이 면을 `body/hook-inner`로 발행한다. 한 facet의 면적은 약 0.0000044722353m², 전체 면적은 약 0.000053666824m²이며 아래 두 `@scalar-control` 행이 두 검산값을 각각 소유한다. 위상은 봉 주위 배치 회전으로 맞추되 관 자체의 단면 위상은 바꾸지 않는다. 옷장에 걸 때 옷·옷걸이 둘 다 Y축으로 90° 돌려 폭 W를 옷장 깊이 방향으로, 두께 D를 봉 길이 방향으로 둔다. `umbrella`는 y=0..H/16의 XZ 직사각형 접지판과 y=H/16..7H/8의 24각 원뿔대, y=7H/8..H의 24각 손잡이를 합친다. 접지판은 X/Z 각각 W/2 폭이며 원뿔대 반지름은 아래 W/8, 위 W/2, 손잡이 반지름 W/6이다. 이 판의 밑면 전체가 지면과 유한 면으로 접한다. `umbrella-stand`의 원형 외벽·개구와 바닥은 아래 `@bore`의 반지름·Y 구간이 단일 소유자다. 모든 열린 둘레에는 안팎 벽과 rim의 닫힌 두께를 내며 표의 AABB를 넘는 장식은 추가하지 않는다.

각 상태의 정확한 점유는 아래 표가 소유한다. 신발 밑창, 옷의 앞뒤, 옷걸이 고리, 우산 고리와 우산꽂이 안쪽은 각 상태에서 실제로 존재하는 face만 발행한다.

ref02 침실과 현관 수납 기능 및 ref04 작업실의 절제된 생활 밀도를 바탕으로 정면·측면·45°에서 신발·의복·우산 실루엣을 판별한다. ref01·03·05의 보이지 않는 브랜드는 만들지 않는다. 실제 착용·젖은 우산 배수는 `unverified`다.

@bore-z coat: body, 0, -0.07, 0.025, -0.075..-0.05
@bore-z garment: body, 0, -0.045, 0.0125, -0.055..0.055
@suspension-face coat: body/loop-inner
@suspension-face garment: body/loop-inner
@suspension-face hanger: body/hook-inner
@bore umbrella-stand: body, 0.115, 0.031..0.55

@scalar-control hanger-hook-section-phase-deg: 7.5
@scalar-control hanger-hook-facet-area-m2: 0.0000044722353
@scalar-control hanger-hook-total-area-m2: 0.000053666824
@scalar-control garment-waist-width-ratio: 0.7

@flat-contact shoe: body, support, -Y, 0, -0.05..0.05, -0.12..0.12
@flat-contact umbrella: body, support, -Y, 0, -0.02..0.02, -0.02..0.02

@inventory shoe: body
@inventory coat: body
@inventory garment: body
@inventory hanger: body
@inventory umbrella: body
@inventory umbrella-stand: body

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | shoe | * | bounds | -0.055..0.055 | 0..0.13 | -0.145..0.145 | - |
| @part | shoe | body | curved | -0.055..0.055 | 0..0.13 | -0.145..0.145 | support |
| @envelope | coat | * | bounds | -0.31..0.31 | -1.12..0 | -0.075..0.075 | - |
| @part | coat | body | hollow | -0.31..0.31 | -1.12..0 | -0.075..0.075 | suspension |
| @envelope | garment | * | bounds | -0.24..0.24 | -0.72..0 | -0.055..0.055 | - |
| @part | garment | body | hollow | -0.24..0.24 | -0.72..0 | -0.055..0.055 | suspension |
| @envelope | hanger | * | bounds | -0.21..0.21 | -0.2..0 | -0.0175..0.0175 | - |
| @part | hanger | body | curved | -0.21..0.21 | -0.2..0 | -0.0175..0.0175 | suspension |
| @envelope | umbrella | * | bounds | -0.045..0.045 | 0..0.88 | -0.045..0.045 | - |
| @part | umbrella | body | curved | -0.045..0.045 | 0..0.88 | -0.045..0.045 | support |
| @envelope | umbrella-stand | * | bounds | -0.13..0.13 | 0..0.55 | -0.13..0.13 | - |
| @part | umbrella-stand | body | hollow | -0.13..0.13 | 0..0.55 | -0.13..0.13 | support |

<!-- @authored-address-state:start -->
@address-state shoe: body
@address-state coat: body
@address-state garment: body
@address-state hanger: body
@address-state umbrella: body
@address-state umbrella-stand: body
<!-- @authored-address-state:end -->

## 식탁 식기와 용기 {#dining-wares}

<!--
@evidence principles/core/common.md#scope-preservation 기존 서빙 볼은 재사용하고 접시·포크·숟가락·칼·물병·꽃병만 새 식기 변종으로 낸다.
@evidence principles/core/common.md#substantive-completion 낮은 접시 내벽, 네 갈래 포크, 움푹한 숟가락, 날 단면, 열린 병 목을 실제 절삭과 닫힌 두께로 만든다.
@evidence principles/core/common.md#declared-basis ref02·03의 여섯 자리 식탁 규모를 받고 접시 0.004m 최소 벽과 식기 단면은 이 모델이 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation operative-subjects의 여섯 식사 자리와 ground-program의 식탁에 접시·식기·병의 독립 소품 원형을 더한다.
@evidence principles/design/models.md#representation-contract 접시는 y=0..H/4의 0.11m 바닥 원판과 0.106m bore 사이 벽을 남기고 병은 닫힌 바닥·열린 목을 가진다.
@evidence principles/design/models.md#spatial-convention 식탁 접촉면 중심 원점, 손잡이/사용자 쪽 +Z로 두며 모든 금속 식기는 y=0의 양수 면적에 닿는다.
@evidence principles/design/models.md#reviewable-structure 상부에서 여섯 독립 세트와 네 이빨·숟가락 음각, 정면·45°에서 접시 rim과 병 목을 본다.
@evidence principles/design/models.md#model-observable-style-basis ref02·03 식탁의 인원 규모를 받되 다른 참조에 없는 식품·브랜드를 생성하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 각 상태 W/H/D와 plate bore·병 profile·식기 grip/head 점유를 표로 닫아 낮은 접시가 평판이 되지 않게 한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work operative-subjects의 여섯 자리와 ground-program의 식탁을 시험했다. 접시·식기·병은 상판 위 선택 소품이며 그릇 바닥 접촉과 국소 두께만 정하고 반복 수·상차림은 배치가 정하므로 방 프로그램을 고치지 않는다.
@evidence settings/002-household.md#operative-subjects 가족 네 명과 방문자 두 명의 식사 자리 규모를 소품 반복의 배경으로 받는다.
@evidence settings/002-household.md#ground-program 식탁을 식기·용기 원형의 지지 상판으로 받는다.
@evidence settings/003-spatial-basis.md#surface-decomposition 접시·식기·병의 개별 형상과 face 주소를 models가 정한다.
@evidenceReview principles/core/common.md#scope-preservation  기존 tabletop-props의 서빙 볼을 재사용하고 @inventory에는 접시·세 금속 식기·두 병만 추가한다.
@evidenceReview principles/core/common.md#substantive-completion  plate @bore, fork 세 관통 틈, spoon 음각, knife 날 단면과 두 병의 열린 목을 본문 식으로 정의한다.
@evidenceReview principles/core/common.md#declared-basis  ref02·03의 여섯 자리 규모를 받고 접시 0.004m 최소 벽과 식기 단면은 이 H2의 로컬 결정이다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation  operative-subjects의 여섯 식사 자리와 ground-program 식탁에 독립 접시·식기·병 원형을 더한다.
@evidenceReview principles/design/models.md#representation-contract  접시 0.11m 바닥 원판과 0.106m bore 사이 벽을 남기고 water-bottle·flower-vase는 닫힌 바닥과 열린 목을 낸다.
@evidenceReview principles/design/models.md#spatial-convention  모든 식기의 식탁 접촉면 중심 원점·사용자 쪽 +Z를 정하고 fork·spoon·knife의 @flat-contact가 y=0에 있다.
@evidenceReview principles/design/models.md#reviewable-structure  plate body/rim, 병 body/inner 및 금속 body/grip·head가 상부·정면·45°에서 낮은 개구와 식기 끝을 분리한다.
@evidenceReview principles/design/models.md#model-observable-style-basis  ref02·03 식탁의 여섯 자리 규모만 받고 식품·브랜드는 만들지 않는다.
@evidenceReview principles/design/models.md#model-scale-layer-completion  여섯 @envelope와 @part가 각 W/H/D, plate bore·병 목·식기 grip/head 점유를 닫는다.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work  여섯 자리 식탁에 선택 소품 여섯 종류를 대조했고 세트 반복과 상차림 위치는 배치가 결정한다.
@evidenceReview settings/002-household.md#operative-subjects  가족 네 명과 방문자 두 명의 식사 규모를 식기 세트 반복의 배경으로 받고 원형 자체는 한 종류씩만 낸다.
@evidenceReview settings/002-household.md#ground-program  식탁을 식기·병 원형의 지지 상판으로 받아 @flat-contact support y=0을 둔다.
@evidenceReview settings/003-spatial-basis.md#surface-decomposition  plate body/rim, 병 body/inner와 금속 body/grip·head·underside를 안정 face 주소로 낸다.
-->

`dining-wares`는 기존 그릇·컵과 별도로 접시, 포크, 숟가락, 식사용 칼, 물병, 꽃병을 같은 식사 소품 계열의 명시 변종으로 소유한다. 원점은 식탁에 닿는 면의 중심이고 +Z는 손잡이 또는 사용자가 향하는 쪽이다. 접시는 열린 얕은 접시의 `body/upper/underside/rim`, 병은 닫힌 바닥과 열린 목의 `body/outer/inner/rim/sole`, 금속 식기는 일체형 두께를 가진 `body/grip/head/edge/underside`로 나눈다. 서빙 볼은 기존 `tabletop-props/bowl`을 재사용한다.

접시는 y=0..H/4에서 반지름 0.11m의 평평한 닫힌 바닥 원판을 갖고, y=H/4..H에서 바깥 반지름을 그 바닥 반지름에서 W/2까지 선형으로 벌린다. `@bore plate`의 개구 반지름 0.106m와 바닥 외반지름 0.11m 사이에는 y=H/4에서 0.004m의 벽이 남는다. 위쪽 안쪽 개구와 바닥 높이는 `@bore`가 정하며 높이 H에서 rim을 닫는다. 아래 외곽의 y=0 원판 전부는 `body/underside`다. 물병은 `@cavity-profile`의 바닥·몸통·어깨·목 단면을 잇는 열린 회전체이고 꽃병은 `@bore`에 적힌 개구와 바닥을 가진 24각 원통이다. 포크는 z=−D/2..D/4의 X 폭 W/2·Y 두께 H/2 손잡이와 z=D/4..D/2의 X 전폭·y=0..H 머리를 한 고체로 합친다. 머리의 X 폭을 7등분하여 두 번째·네 번째·여섯 번째 칸을 z=3D/8..D/2에서 관통 절삭하면 같은 폭의 네 이빨과 세 틈이 남는다. 숟가락은 z=−D/2..D/4의 X 폭 W/3·Y 두께 H/2 손잡이와 중심 z=D/3, X 반경 W/2·Z 반경 D/6, y=0..H의 24각 타원 머리를 합친다. 머리 윗면은 같은 중심의 X 반경 W/3·Z 반경 D/9, 깊이 5H/6의 타원형으로 절삭하며 바닥에 H/6을 남긴다. 칼은 z=−D/2..0, x=±W/4, y=0..H/2의 X 폭 W/2 손잡이와 z=0..D/2의 X 폭 W 날을 합친다. 날은 −X 등쪽에서 y=0..H, +X 날끝에서 y=0..H/4인 선형 단면으로 닫는다. 세 식기의 밑면은 y=0의 양수 면적 접지면이다. 식기 간 독립 경계가 식탁 거리에서 사라지는 경우 상부 중립 view에서 개수를 확인한다.

각 상태의 정확한 점유는 아래 표가 소유한다. 접시의 윗면과 바닥, 병의 안팎, 금속 식기의 잡는 부분과 머리는 각 형상의 가시·비가시 삼각형을 함께 분할한다.

ref02와 ref03의 여섯 자리 식탁에 여섯 세트가 서로 독립해 놓이는 규모를 채택한다. 정면·상부·45°에서 접시의 낮은 개구, 식기 끝, 병 목이 구별되어야 한다. ref01·04·05는 식기 세부를 제공하지 않는다. 식품 안전·급수는 `unverified`다.

@bore plate: body, 0.106, 0.008..0.032
@scalar-control plate-floor-radius-m: 0.11
@scalar-control plate-wall-at-bore-m: 0.004
@cavity-profile water-bottle: body, round, 12, 2/3, 18, 0.011
@bore flower-vase: body, 0.061, 0.025..0.3

@flat-contact fork: body, support, -Y, 0, -0.005..0.005, -0.09..0
@flat-contact spoon: body, support, -Y, 0, -0.005..0.005, -0.09..0
@flat-contact table-knife: body, support, -Y, 0, -0.005..0.005, -0.10..0

@inventory plate: body
@inventory fork: body
@inventory spoon: body
@inventory table-knife: body
@inventory water-bottle: body
@inventory flower-vase: body

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | plate | * | bounds | -0.135..0.135 | 0..0.032 | -0.135..0.135 | - |
| @part | plate | body | hollow | -0.135..0.135 | 0..0.032 | -0.135..0.135 | support |
| @envelope | fork | * | bounds | -0.0125..0.0125 | 0..0.012 | -0.105..0.105 | - |
| @part | fork | body | curved | -0.0125..0.0125 | 0..0.012 | -0.105..0.105 | support |
| @envelope | spoon | * | bounds | -0.0225..0.0225 | 0..0.017 | -0.1025..0.1025 | - |
| @part | spoon | body | curved | -0.0225..0.0225 | 0..0.017 | -0.1025..0.1025 | support |
| @envelope | table-knife | * | bounds | -0.0115..0.0115 | 0..0.012 | -0.1125..0.1125 | - |
| @part | table-knife | body | curved | -0.0115..0.0115 | 0..0.012 | -0.1125..0.1125 | support |
| @envelope | water-bottle | * | bounds | -0.0475..0.0475 | 0..0.285 | -0.0475..0.0475 | - |
| @part | water-bottle | body | hollow | -0.0475..0.0475 | 0..0.285 | -0.0475..0.0475 | support |
| @envelope | flower-vase | * | bounds | -0.07..0.07 | 0..0.3 | -0.07..0.07 | - |
| @part | flower-vase | body | hollow | -0.07..0.07 | 0..0.3 | -0.07..0.07 | support |

<!-- @authored-address-state:start -->
@address-state plate: body
@address-state fork: body
@address-state spoon: body
@address-state table-knife: body
@address-state water-bottle: body
@address-state flower-vase: body
<!-- @authored-address-state:end -->

## 조리 도구와 소형 기기 {#kitchen-smallwares}

<!--
@evidence principles/core/common.md#scope-preservation 주방의 열한 소형 도구·용기 상태만 내고 조리·가열·전기 성능은 주장하지 않는다.
@evidence principles/core/common.md#substantive-completion 열린 냄비·팬·병과 slot 절삭 기기, 여섯 rib 건조대, 손잡이와 vessel 주둥이를 각 형상에 낸다.
@evidence principles/core/common.md#declared-basis ref03 주방 조리대·섬의 소품 밀도와 ref02 주방 기능을 받고 제품별 W/H/D·구멍은 이 절에서 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation ground-program의 주방 island·sink·cooktop에 놓을 선택 물품으로 용기·판·슬롯 기기·건조대의 독립 형상을 더한다.
@evidence principles/design/models.md#representation-contract 주전자·커피 주둥이의 숨은 시작은 높은 모선에서 0.0390·0.0446m이며 몸통 전면 0.0451·0.0512m 안쪽이라 교선 밖에서 드러난다.
@evidence principles/design/models.md#spatial-convention 조리대 접촉 중심 원점, 손잡이/조작 쪽 +Z로 두고 모든 상태의 지지 아래면과 출구 방향을 구분한다.
@evidence principles/design/models.md#reviewable-structure 상부·정면·45°에서 열린 용기 내부, 슬롯 안벽, 주둥이 출구, 건조대의 다섯 빈 칸을 확인한다.
@evidence principles/design/models.md#model-observable-style-basis ref03의 조리대·섬 위 작은 도구를 받고 ref02는 기능 범위에 쓰며 다른 참조에서 제품 세부를 추정하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 표의 상태별 W/H/D와 bore·cavity-profile·vessel-attachments를 결합해 열린 내부·손잡이·받침 점유를 닫는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work ground-program의 island·sink·cooktop과 household-program의 생활 물품 범위를 시험했다. 작은 조리 도구의 상판 접촉·고정 실루엣은 선택 원형이고 조리 성능·수량·위치는 약속하지 않아 새 공간·상태를 요구하지 않는다.
@evidence settings/002-household.md#ground-program 주방 island·sink·cooktop을 작은 조리 도구가 놓이는 기능 상판으로 받는다.
@evidence settings/002-household.md#household-program 생활 흔적을 물품으로 표현하는 범위에서 주방 소품을 저작 선택한다.
@evidence settings/003-spatial-basis.md#surface-decomposition 용기·판·기기의 재사용 형상·face를 models가 정한다.
@evidenceReview principles/core/common.md#scope-preservation  열한 @inventory는 주방 소형 물체의 고정 외형만 내고 조리·가열·전기 성능은 unverified로 둔다.
@evidenceReview principles/core/common.md#substantive-completion  @bore 용기, @cavity-profile 병, 슬롯 절삭 기기와 drying-rack 여섯 rib가 열린 곳과 받침을 구분한다.
@evidenceReview principles/core/common.md#declared-basis  ref03의 조리대·섬 소품 밀도와 ref02 주방 용도를 받고 제품별 W/H/D와 구멍은 이 H2가 정한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation  island·sink·cooktop에 놓을 선택 물품으로 냄비·판·슬롯 기기·건조대 등의 독립 실루엣을 더한다.
@evidenceReview principles/design/models.md#representation-contract  kettle·coffee-brewer 주둥이의 숨은 시작 Z가 높은 모선의 몸통 전면 Z보다 안쪽이라는 본문 수치가 접합을 닫는다.
@evidenceReview principles/design/models.md#spatial-convention  상판 접촉 중심 원점과 조작·손잡이 쪽 +Z를 정의하며 utensil·drying-rack의 @flat-contact가 y=0이다.
@evidenceReview principles/design/models.md#reviewable-structure  body/inner, slot-wall, spout-inner와 rib-side가 상부·정면·45°에서 용기·기기·건조대의 빈 곳을 보이게 한다.
@evidenceReview principles/design/models.md#model-observable-style-basis  ref03은 조리대·섬 위 물체 규모, ref02는 주방 기능 근거로만 쓰며 다른 사진의 제품 세부는 추정하지 않는다.
@evidenceReview principles/design/models.md#model-scale-layer-completion  열한 @envelope와 @part에 bore·cavity-profile·vessel-attachments가 결합되어 각 몸체와 손잡이 점유를 닫는다.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work  island·sink·cooktop과 생활 물품 범위에 국소 소형 도구를 대조했고 조리 성능·수량·위치는 요구하지 않는다.
@evidenceReview settings/002-household.md#ground-program  주방 island·sink·cooktop을 조리 소품의 가능한 지지·사용 상판으로 받는다.
@evidenceReview settings/002-household.md#household-program  생활 흔적을 만드는 물품 범위에서 열한 주방 도구 원형을 저작 선택한다.
@evidenceReview settings/003-spatial-basis.md#surface-decomposition  용기 body/inner·rim, 기기 slot-wall, 주둥이 spout-inner와 건조대 rib-side를 재사용 face로 정한다.
-->

`kitchen-smallwares`는 냄비, 팬, 도마, 칼 블록, 조리 도구통, 조리 도구, 주전자, 토스터, 커피 기구, 식기 건조대와 유리 보관병을 같은 주방 소형 물체 모집단으로 둔다. 원점은 조리대 접촉 중심이고 +Z가 손잡이 또는 조작 면이다. 팬과 냄비는 독립 `body/inner/outer/base/rim`, 보관병·주전자·커피 기구는 `body/outer/inner/neck/sole`, 도마와 토스터는 `body/top/side/underside`를 쓴다. 손잡이나 투입구는 본체 실루엣의 일부로 형성하되 part 주소를 중복하지 않는다. `kettle`·`coffee-brewer`의 주둥이는 `body/spout-outer/spout-inner/spout-rim`, 손잡이 구멍은 `body/grip-outer/grip-inner/grip-edge`로 분할한다. `knife-block`은 `body/top/slot-wall/slot-floor/side/sole`, `utensil`은 `body/grip/head/edge/sole`, `drying-rack`은 `body/base-upper/rib-side/rib-top/slot-floor/sole`이다. `glass-jar`의 열린 목에는 `body/rim`을 추가한다.

`pan`, `utensil-crock`, `glass-jar`의 몸통은 X 폭 W의 24각 Y축 회전체이고 `pot`의 원통 몸통은 지름 D의 24각 Y축 회전체이며 열린 입구·바닥은 각 `@bore`의 반지름과 Y 구간을 따른다. `pot` 몸통 중심은 z=0, 바깥 반지름 D/2이고 양쪽 귀는 x=−W/2..−W/2+W/8 및 +W/2−W/8..+W/2, y=H/2..H/2+H/12, z=±D/8의 닫힌 직육면체를 몸통에 합친다. 두 귀의 안쪽 끝 x=±(W/2−W/8)은 몸통 원통 안에 들어가므로 귀와 몸통은 양수 부피로 이어진다. `pan` 몸통 중심 Z는 0이고 바깥 반지름 W/2다. +Z 손잡이는 z=7W/16..표의 +Z 경계, x=±W/18, y=H/2..3H/4의 닫힌 직육면체로서 몸통과 양수 부피로 겹친다. `kettle`과 `coffee-brewer`는 `@cavity-profile`의 몸통·어깨·목을 24각 단면으로 잇는다. 주둥이 중심 높이는 spoutY×H이고, 숨은 연결부의 Z 시작은 주둥이 원통의 가장 높은 모선 높이(spoutY×H+외반지름)에서 잰 몸통 중심 Z+R_out−벽 두께/2다. 이 시작 Z는 `kettle` 0.0390m, `coffee-brewer` 0.0446m로서 해당 높이의 몸통 전면 0.0451m, 0.0512m보다 각각 안쪽이다. 노출 외면은 몸통 외면과의 교선에서 시작해 표의 +Z 경계까지 +Z축 원통으로 잇는다. 중심 높이·통로·외벽 두께는 `@vessel-attachments`와 profile에서 계산한다. 원통을 몸통과 합친 뒤 통로를 공동까지 절삭하고 출구 둘레를 rim으로 닫는다. 손잡이 고리는 profile의 높이별 바깥 반지름 R(y)의 +X쪽에서 x=R(y)−벽 두께/2..R, y=gripY×H, z=몸통 중심 Z±gripZ×W인 판을 합친 뒤 지정 holeX·holeY 사각형을 Z 관통 절삭한다. `cutting-board`는 표의 XZ 판 전폭, y=0..H를 채우고 중심 z=3D/8의 X 폭 W/4·Z 길이 D/8 구멍을 전 두께 절삭한다. `knife-block`은 표의 닫힌 상자 윗면에 X 중심을 −W/3,0,+W/3으로 둔 세 슬롯을 낸다. 각 슬롯의 X 폭은 W/10, 중심 z=0인 Z 길이는 D/2, 깊이는 상면에서 H/8이며 상자 바닥은 그대로 닫힌다. `toaster`는 같은 방법으로 X 중심 ±W/4의 슬롯 둘을 폭 W/8, 중심 z=0인 Z 길이 D/2, 깊이는 상면에서 H/6으로 낸다. `utensil`은 z=−D/2..D/4의 X 폭 W/3·Y 두께 H/2 막대와 z=D/4..D/2의 X 전폭·Y 전높이 머리를 합친 닫힌 단일 고체다. `drying-rack`은 XZ 전폭의 y=0..H/8 받침과 X 중심 x=(j−5/2)W/7, j=0..5의 여섯 세로 rib를 합친다. 각 rib는 X 폭 W/40, y=H/8..H, Z 전깊이여서 사이에 같은 간격의 다섯 빈 슬롯이 생긴다. 절삭 안쪽 벽과 아래면도 face로 발행한다.

각 상태의 정확한 점유는 아래 표가 소유한다. 열린 용기는 안쪽·바깥쪽·림·바닥을 닫힌 두께로 구분하고, 가전 외함은 슬롯의 안쪽 벽까지 face 주소에 포함한다.

ref03의 주방 조리대·섬 위에서 작은 도구가 가전과 겹쳐 보이지 않는지 상부·정면·45°에서 확인한다. ref02는 주방 기능의 범위를 보여 주며 ref01·04·05는 도구 제품 형상을 특정하지 않는다. 조리·전기·열 성능은 `unverified`다.

@bore pot: body, 0.124, 0.014..0.17
@bore pan: body, 0.13, 0.012..0.095
@bore utensil-crock: body, 0.057, 0.016..0.19
@cavity-profile kettle: body, round, 12, 2/3, 18, 0.024
@cavity-profile coffee-brewer: body, round, 12, 2/3, 18, 0.027
@vessel-attachments kettle,coffee-brewer: body, 3/4, 1/2, 3/4..19/20, 4/5..9/10, 4/5..9/10, 1/20
@scalar-control kettle-spout-root-z-m: 0.0390
@scalar-control coffee-brewer-spout-root-z-m: 0.0446
@scalar-control kettle-body-at-spout-top-z-m: 0.0451
@scalar-control coffee-brewer-body-at-spout-top-z-m: 0.0512
@bore glass-jar: body, 0.048, 0.016..0.19

@flat-contact utensil: body, support, -Y, 0, -0.005..0.005, -0.14..0
@flat-contact drying-rack: body, support, -Y, 0, -0.18..0.18, -0.13..0.13

@inventory pot: body
@inventory pan: body
@inventory cutting-board: body
@inventory knife-block: body
@inventory utensil-crock: body
@inventory utensil: body
@inventory kettle: body
@inventory toaster: body
@inventory coffee-brewer: body
@inventory drying-rack: body
@inventory glass-jar: body

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | pot | * | bounds | -0.175..0.175 | 0..0.17 | -0.14..0.14 | - |
| @part | pot | body | hollow | -0.175..0.175 | 0..0.17 | -0.14..0.14 | support |
| @envelope | pan | * | bounds | -0.15..0.15 | 0..0.095 | -0.15..0.24 | - |
| @part | pan | body | hollow | -0.15..0.15 | 0..0.095 | -0.15..0.24 | support |
| @envelope | cutting-board | * | bounds | -0.155..0.155 | 0..0.018 | -0.21..0.21 | - |
| @part | cutting-board | body | box | -0.155..0.155 | 0..0.018 | -0.21..0.21 | support |
| @envelope | knife-block | * | bounds | -0.08..0.08 | 0..0.23 | -0.09..0.09 | - |
| @part | knife-block | body | box | -0.08..0.08 | 0..0.23 | -0.09..0.09 | support |
| @envelope | utensil-crock | * | bounds | -0.065..0.065 | 0..0.19 | -0.065..0.065 | - |
| @part | utensil-crock | body | hollow | -0.065..0.065 | 0..0.19 | -0.065..0.065 | support |
| @envelope | utensil | * | bounds | -0.0225..0.0225 | 0..0.022 | -0.155..0.155 | - |
| @part | utensil | body | curved | -0.0225..0.0225 | 0..0.022 | -0.155..0.155 | support |
| @envelope | kettle | * | bounds | -0.11..0.11 | 0..0.25 | -0.135..0.135 | - |
| @part | kettle | body | hollow | -0.11..0.11 | 0..0.25 | -0.135..0.135 | support |
| @envelope | toaster | * | bounds | -0.145..0.145 | 0..0.21 | -0.095..0.095 | - |
| @part | toaster | body | box | -0.145..0.145 | 0..0.21 | -0.095..0.095 | support |
| @envelope | coffee-brewer | * | bounds | -0.12..0.12 | 0..0.34 | -0.15..0.15 | - |
| @part | coffee-brewer | body | hollow | -0.12..0.12 | 0..0.34 | -0.15..0.15 | support |
| @envelope | drying-rack | * | bounds | -0.21..0.21 | 0..0.16 | -0.155..0.155 | - |
| @part | drying-rack | body | curved | -0.21..0.21 | 0..0.16 | -0.155..0.155 | support |
| @envelope | glass-jar | * | bounds | -0.055..0.055 | 0..0.19 | -0.055..0.055 | - |
| @part | glass-jar | body | hollow | -0.055..0.055 | 0..0.19 | -0.055..0.055 | support |

<!-- @authored-address-state:start -->
@address-state pot: body
@address-state pan: body
@address-state cutting-board: body
@address-state knife-block: body
@address-state utensil-crock: body
@address-state utensil: body
@address-state kettle: body
@address-state toaster: body
@address-state coffee-brewer: body
@address-state drying-rack: body
@address-state glass-jar: body
<!-- @authored-address-state:end -->

## 욕실 위생 소품 {#bath-accessories}

<!--
@evidence principles/core/common.md#scope-preservation 비누·휴지·칫솔·병·휴지통·빨래 바구니의 고정 형상만 내고 충전물·위생·급배수는 주장하지 않는다.
@evidence principles/core/common.md#substantive-completion 열린 컵·bin·basket, 닫힌 병 캡, 롤 관통 구멍과 두 팔의 걸이, 칫솔 head를 상태별로 닫는다.
@evidence principles/core/common.md#declared-basis ref02 욕실·서비스 코어의 위생기구와 구별되는 크기를 받고 각 소품 W/H/D는 이 절의 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation upper-program의 욕실·세탁실과 upper-bathroom의 위생 목적지에 용기·벽 걸이·소모품·바구니의 다른 지지 형상을 더한다.
@evidence principles/design/models.md#representation-contract 롤의 중심을 비우고 네 겹 tissue-pack 원통·받침을 연속 외곽으로 합치며 열려야 할 컵·bin의 bore를 남긴다.
@evidence principles/design/models.md#spatial-convention 바닥·선반 물체는 받침 중심 원점, tissue-holder는 벽 접촉 아래 중심 원점이며 앞은 +Z다.
@evidence principles/design/models.md#reviewable-structure 정면·상부·45°에서 기구보다 작은 규모와 열린 용기 내부, 롤 중심, 걸이 팔을 확인한다.
@evidence principles/design/models.md#model-observable-style-basis ref02 위생실·세탁 공간을 받아 생활 소품을 두되 다른 그림에 없는 상표와 내용물은 재현하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 상태별 표 점유에서 vessel cap·bore·rect void와 body face를 실제 있는 표면에만 발행한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work upper-program의 욕실 vanity·세탁실과 upper-bathroom의 위생 목적지를 시험했다. 컵·휴지·바구니의 받침과 두 팔 걸이의 벽 접촉은 선택 소품의 고정 형상이고 위치·롤 장착은 배치가 정하므로 방 기능을 고치지 않는다.
@evidence settings/002-household.md#upper-program 욕실 vanity와 설비·세탁실을 작은 위생 물품의 사용 장소로 받는다.
@evidence spaces/002-spatial-graph.md#upper-bathroom 위생 소품은 상층 욕실의 고정 물체로 제공하고 접근 영역은 배치에 남긴다.
@evidence settings/003-spatial-basis.md#surface-decomposition 컵·bin·걸이·바구니의 형상과 face 주소는 models가 정한다.
@evidenceReview principles/core/common.md#scope-preservation  열 개 @inventory는 위생 소품의 고정 외형만 내고 내용물·배관·위생 성능을 내지 않는다.
@evidenceReview principles/core/common.md#substantive-completion  컵·bin·basket의 @bore·@void, 닫힌 병 목, tissue-roll 구멍과 tissue-holder 두 팔의 본문 식이 상태를 구분한다.
@evidenceReview principles/core/common.md#declared-basis  ref02 욕실·서비스 코어의 생활 물품 크기를 근거로 받고 각 W/H/D와 걸이 접촉은 로컬로 고른다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation  상층 욕실·세탁실 목적지에 컵·소모품·벽 걸이·바구니의 서로 다른 받침 원형을 더한다.
@evidenceReview principles/design/models.md#representation-contract  tissue-roll @bore는 관통하고 tissue-pack 네 원통·받침은 내부 교차면 없는 한 몸체이며 컵·bin은 열린다.
@evidenceReview principles/design/models.md#spatial-convention  바닥·선반 물체는 받침 중심, tissue-holder는 벽 접촉 아래 중심 원점이고 전면은 +Z다.
@evidenceReview principles/design/models.md#reviewable-structure  body/inner·rim, tissue body/end와 holder body/arm이 정면·상부·45°에서 작은 크기와 빈 중심을 보인다.
@evidenceReview principles/design/models.md#model-observable-style-basis  ref02 위생실·세탁 공간의 생활 물품 역할을 받고 다른 사진의 상표나 충전 내용은 만들지 않는다.
@evidenceReview principles/design/models.md#model-scale-layer-completion  열 개 @envelope와 @part에 병 @cavity-profile, bin @bore, basket @void 및 걸이 좌표가 각 상태를 닫는다.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work  욕실 vanity·세탁실과 upper-bathroom 용도에 작은 고정 물체를 대조했고 실제 위치·롤 장착은 배치에 남는다.
@evidenceReview settings/002-household.md#upper-program  욕실 vanity 및 상층 설비·세탁실을 위생 물품의 가능한 사용 목적지로 받는다.
@evidenceReview spaces/002-spatial-graph.md#upper-bathroom  상층 욕실에 둘 국소 위생 소품 원형을 제공하고 사람 접근 영역은 정하지 않는다.
@evidenceReview settings/003-spatial-basis.md#surface-decomposition  컵·bin의 body/inner·rim, 걸이 body/arm, 병 cap-side를 안정 모델 면으로 정한다.
-->

`bath-accessories`는 비누 용기, 휴지 걸이, 휴지 한 롤과 묶음, 칫솔 컵, 칫솔, 샴푸 병, 세제 병, 욕실 휴지통, 빨래 바구니를 공통 욕실·세탁 소품의 치수 상태로 둔다. 바닥·선반 물체의 원점은 놓이는 면 중심이고 휴지 걸이의 원점은 벽 접촉면의 아래 중심이다. +Z는 사용자가 바라보는 전면이다. 걸이는 벽 접촉 `body/back/arm`, 컵·바구니는 `body/outer/inner/rim/sole`, 막힌 병은 `body/outer/inner/rim/sole/cap-top/cap-side`와 비누 용기만의 `body/pump-top`, 소모품은 `body/outer/end/sole`을 사용한다. 실제 충전물·배관·배출은 별도 system과 instance가 결정한다. `toothbrush`는 `body/handle/head/side/sole`, `waste-bin`은 `body/outer/inner/rim/sole`을 상태별 고정 face 집합으로 쓴다.

`toothbrush-cup`과 `waste-bin`은 24각 원형 외벽, `laundry-basket`은 네모 외벽이다. 각각의 내벽·바닥 높이는 바로 아래 `@bore` 또는 `@void`가 단독으로 정한다. 병 세 상태는 `@cavity-profile`의 몸통·어깨·목과 `@vessel-closure`의 캡으로 닫는다. 비누 용기의 펌프는 캡 상면의 중심 XZ 폭을 각각 몸통 W/4·D/4로 나눈 `body/pump-top` face이며 추가 돌출 체적은 없다. 휴지 롤은 `@radial`의 바깥·안쪽 반지름과 `@bore`의 Y 범위를 쓰는 24각 Y축 고리다. `tissue-pack`은 Z축 원통 넷을 양수 부피로 겹쳐 한 닫힌 외곽으로 합친다. 각 원통의 반지름 r=5min(W,H)/16, Z 길이는 D, 중심은 x=±(W/2−r)와 y=5H/16,11H/16의 네 조합이다. 네 중심 사이 중앙점 (0,H/2)도 각 원통 내부에 놓이므로 전후를 뚫는 중앙 틈이 없다. 같은 줄의 두 원통과 위아래 줄이 모두 겹치며 내부 교차면은 제거한다. 노출 Z 끝면은 연결된 외곽의 앞·뒤 face로 합친다. `tissue-holder`는 x=±W/2, y=0..H, z=0..D/6인 벽판과 중심 x=±(W/2−W/8), y=3H/4의 두 팔을 합친다. 팔은 X/Y 단면 지름 H/8의 24각 봉으로 z=D/6..D까지 이어지고, 두 팔 사이 X축 봉은 중심선 x=−(W/2−W/8)..+(W/2−W/8), y=3H/4,z=3D/4, 반지름 H/16이다. 봉은 팔 두 원통과 양수 부피로 교차하여 한 닫힌 고체로 합치고 내부 교차면은 제거한다. `toothbrush`는 x=±W/4, z=±D/4, y=0..3H/4의 손잡이 판과 X/Z 전폭, y=3H/4..H의 짧은 머리를 한 고체로 합친다. 롤을 걸이에 끼우는 회전은 instances가 소유하며 실제 위생·급수 성능은 `unverified`다.

`tissue-pack`의 아래 두 원통 밑에는 X/Z 전폭·y=0..H/20인 얇은 받침판을 같은 `body`로 합친다. 네 원통의 XY 24각 디스크와 받침 직사각형의 합집합에서 바깥 윤곽만 취하고, 받침판 윗면과 아래 두 원통 사이에 둘러싸인 닫힌 작은 구멍은 채워 단순 연결 단면으로 만든 뒤 Z=±D/2까지 한 번 압출하고, 교차 모서리에는 교점을 꼭짓점으로 삽입해 내부 경계와 겹친 Z 끝면을 삼각화하지 않는다. 받침판은 두 원통과 양수 부피를 공유하고 밑면은 선반에 평평한 유한 면으로 닿는다. 각 상태의 정확한 점유는 아래 표가 소유한다. 용기 안팎·림·바닥, 걸이 뒷판·팔, 휴지 롤의 관통 구멍은 `body/inner`, 노출 끝은 `body/end`, 절삭 둘레는 `body/rim`으로 실제 형상에 있는 face 집합만 발행한다.

ref02의 욕실과 서비스 코어에서 세면대·변기·세탁기와 구분되는 크기를 정면·상부·45°에서 본다. ref01·03·04·05의 보이지 않는 상표와 내용물은 재현하지 않는다. 위생·세척 성능은 `unverified`다.

@cavity-profile soap-dispenser: body, ellipse, 12, 4/5, 18, 0.014
@bore tissue-roll: body, 0.013125, 0..0.1
@radial tissue-roll: body, 0.013125, 0.0525
@bore toothbrush-cup: body, 0.037, 0.01..0.115
@cavity-profile shampoo-bottle: body, ellipse, 12, 4/5, 18, 0.013
@cavity-profile detergent-bottle: body, ellipse, 12, 4/5, 18, 0.018
@vessel-closure soap-dispenser,shampoo-bottle,detergent-bottle: body, 1/10
@material-face soap-dispenser: body/cap-side
@material-face shampoo-bottle: body/cap-side
@material-face detergent-bottle: body/cap-side
@material-face soap-dispenser: body/pump-top
@bore waste-bin: body, 0.12, 0.029..0.34
@void laundry-basket: body, -0.22..0.22, 0.033..0.4, -0.155..0.155
@cavity-min laundry-basket: body, 1/16, 1/20
@formula-cylinder-grid tissue-pack: body, 5/16, 5/16, 11/16

@flat-contact tissue-pack: body, support, -Y, 0, -0.09..0.09, -0.09..0.09
@flat-contact toothbrush: body, support, -Y, 0, -0.004..0.004, -0.005..0.005

@inventory soap-dispenser: body
@inventory tissue-holder: body
@inventory tissue-roll: body
@inventory tissue-pack: body
@inventory toothbrush-cup: body
@inventory toothbrush: body
@inventory shampoo-bottle: body
@inventory detergent-bottle: body
@inventory waste-bin: body
@inventory laundry-basket: body

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | soap-dispenser | * | bounds | -0.0375..0.0375 | 0..0.17 | -0.0375..0.0375 | - |
| @part | soap-dispenser | body | hollow | -0.0375..0.0375 | 0..0.17 | -0.0375..0.0375 | support |
| @envelope | tissue-holder | * | bounds | -0.085..0.085 | 0..0.075 | 0..0.09 | - |
| @part | tissue-holder | body | box | -0.085..0.085 | 0..0.075 | 0..0.09 | wall |
| @envelope | tissue-roll | * | bounds | -0.0525..0.0525 | 0..0.1 | -0.0525..0.0525 | - |
| @part | tissue-roll | body | hollow | -0.0525..0.0525 | 0..0.1 | -0.0525..0.0525 | support |
| @envelope | tissue-pack | * | bounds | -0.105..0.105 | 0..0.2 | -0.105..0.105 | - |
| @part | tissue-pack | body | curved | -0.105..0.105 | 0..0.2 | -0.105..0.105 | support |
| @envelope | toothbrush-cup | * | bounds | -0.0425..0.0425 | 0..0.115 | -0.0425..0.0425 | - |
| @part | toothbrush-cup | body | hollow | -0.0425..0.0425 | 0..0.115 | -0.0425..0.0425 | support |
| @envelope | toothbrush | * | bounds | -0.008..0.008 | 0..0.19 | -0.011..0.011 | - |
| @part | toothbrush | body | curved | -0.008..0.008 | 0..0.19 | -0.011..0.011 | support |
| @envelope | shampoo-bottle | * | bounds | -0.041..0.041 | 0..0.23 | -0.0325..0.0325 | - |
| @part | shampoo-bottle | body | hollow | -0.041..0.041 | 0..0.23 | -0.0325..0.0325 | support |
| @envelope | detergent-bottle | * | bounds | -0.065..0.065 | 0..0.28 | -0.045..0.045 | - |
| @part | detergent-bottle | body | hollow | -0.065..0.065 | 0..0.28 | -0.045..0.045 | support |
| @envelope | waste-bin | * | bounds | -0.135..0.135 | 0..0.34 | -0.135..0.135 | - |
| @part | waste-bin | body | hollow | -0.135..0.135 | 0..0.34 | -0.135..0.135 | support |
| @envelope | laundry-basket | * | bounds | -0.24..0.24 | 0..0.4 | -0.175..0.175 | - |
| @part | laundry-basket | body | hollow | -0.24..0.24 | 0..0.4 | -0.175..0.175 | support |

<!-- @authored-address-state:start -->
@address-state soap-dispenser: body
@address-state tissue-holder: body
@address-state tissue-roll: body
@address-state tissue-pack: body
@address-state toothbrush-cup: body
@address-state toothbrush: body
@address-state shampoo-bottle: body
@address-state detergent-bottle: body
@address-state waste-bin: body
@address-state laundry-basket: body
<!-- @authored-address-state:end -->

## 생활 수납 상자 {#household-boxes}

<!--
@evidence principles/core/common.md#scope-preservation 파일·장난감·재활용의 열린 상자와 storage·parcel의 닫힌 proxy만 내고 잠금·적재 하중은 주장하지 않는다.
@evidence principles/core/common.md#substantive-completion 열린 세 상태의 공동을 @void로 절삭하고 닫힌 두 상태는 표면 이음·손잡이 face로 구분한다.
@evidence principles/core/common.md#declared-basis ref02의 여러 수납실과 ref04의 책장 옆 독립 상자 역할을 받고 다섯 W/H/D 상태는 이 절이 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation ground-program의 1층 storage와 upper-program의 linen 수납에 선반·cabinet과 구별되는 열린 세 용기·닫힌 두 상자 원형을 더한다.
@evidence principles/design/models.md#representation-contract 열린 세 상자에는 실제 안팎 벽·바닥을 두고 닫힌 둘은 가짜 빈 내부·돌출 힌지를 만들지 않는다.
@evidence principles/design/models.md#spatial-convention 바닥 접촉 중심 원점, 여는 쪽 +Z로 두며 닫힌 손잡이 표면은 전면 z=D/2다.
@evidence principles/design/models.md#reviewable-structure 상부에서 세 빈 내부, 정면·45°에서 다섯 독립 외곽과 닫힌 상자의 face 이음을 본다.
@evidence principles/design/models.md#model-observable-style-basis ref02 수납실과 ref04 책장 옆을 받아 상자와 선반을 구별하고 내용물은 임의로 채우지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 각 상태의 @void 절삭 또는 AABB 점유를 닫고 열린 상태에만 inner/rim을 낸다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work ground-program의 1층 storage, upper-program의 linen 수납, storage-1f의 공용실 직결 방을 시험했다. 열린·닫힌 상자는 선반 안팎에 놓는 선택 물품이며 받침·점유만 원형에 닫히고 내용물·반복은 배치가 정하므로 방을 바꾸지 않는다.
@evidence settings/002-household.md#ground-program 1층 수납실을 생활 상자의 가능한 목적지로 받는다.
@evidence settings/002-household.md#upper-program 상층 linen 수납을 같은 상자 원형의 가능한 목적지로 받는다.
@evidence spaces/002-spatial-graph.md#storage-1f 공용실에 직접 연결된 수납실 cell을 상자의 가능한 배치 공간으로 받는다.
@evidence settings/003-spatial-basis.md#surface-decomposition 상자의 열린 내벽·닫힌 덮개와 face를 models가 정한다.
@evidenceReview principles/core/common.md#scope-preservation  @inventory 다섯 상태는 열린 세 상자와 닫힌 두 proxy만 내고 잠금·하중은 미검증으로 둔다.
@evidenceReview principles/core/common.md#substantive-completion  file·toy·recycling의 @void가 공동을 만들고 storage·parcel은 닫힌 body 표면의 lid-seam·handle로 구별된다.
@evidenceReview principles/core/common.md#declared-basis  ref02 수납실과 ref04 책장 옆 독립 상자를 받고 다섯 W/H/D는 이 H2의 @envelope가 정한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation  1층 storage와 상층 linen 목적지에 선반과 별개인 열린 용기 셋·닫힌 상자 둘을 추가한다.
@evidenceReview principles/design/models.md#representation-contract  열린 세 body는 실제 inner·rim·sole을 갖고 닫힌 둘은 표면 이음만 있어 가짜 빈 내부·힌지를 만들지 않는다.
@evidenceReview principles/design/models.md#spatial-convention  바닥 접촉 중심 원점·여는 쪽 +Z를 밝히고 닫힌 상자 handle face를 전면 z=D/2에 둔다.
@evidenceReview principles/design/models.md#reviewable-structure  열린 body/inner·rim과 닫힌 body/lid-seam·handle이 위·정면·45°에서 구분된다.
@evidenceReview principles/design/models.md#model-observable-style-basis  ref02 수납실과 ref04 책장 옆의 독립 상자 역할을 받고 임의의 내용물은 채우지 않는다.
@evidenceReview principles/design/models.md#model-scale-layer-completion  다섯 @envelope 및 세 @void가 외곽·벽 두께를 닫고 inner/rim은 열린 상태에만 발행한다.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work  1층·상층 storage 및 storage-1f에 선반 안팎 상자를 대조했고 내용물·반복은 배치에 남아 방 변경이 없다.
@evidenceReview settings/002-household.md#ground-program  1층 수납실을 다섯 생활 상자 변종의 가능한 목적지로 받는다.
@evidenceReview settings/002-household.md#upper-program  상층 linen 수납도 같은 상자 변종의 가능한 보관 장소로 받는다.
@evidenceReview spaces/002-spatial-graph.md#storage-1f  공용실 직결 수납 cell을 상자의 가능한 배치 장소로 연결하고 실제 선반 칸은 정하지 않는다.
@evidenceReview settings/003-spatial-basis.md#surface-decomposition  열린 body/inner·rim과 닫힌 body/lid-seam·handle을 상태별 안정 face로 설계한다.
-->

`household-boxes`는 파일 상자, 장난감 상자, 보관 상자, 재활용 상자, 택배 보관함을 규격이 다른 닫힌 또는 위가 열린 용기 상태로 만든다. 원점은 바닥 접촉 중심이고 +Z가 뚜껑을 여는 쪽이다. 닫힌 상자의 덮개 이음은 독립 face이며 위가 열린 상자의 안팎 벽과 바닥은 하나의 두께 있는 `body/inner/outer/rim/sole`다. 같은 형상은 폭·높이·깊이만 바꿔 재사용하며 방마다 새 메시 결정을 하지 않는다.

`file-box`, `toy-box`, `recycling-box`의 열린 공동은 바로 아래 각 `@void`가 정하는 X/Y/Z 구간을 표의 닫힌 박스에서 절삭한다. 따로 적은 벽·바닥 비율은 없으며 절삭 뒤 남는 두께가 실제 설계값이다. `storage-box`와 `parcel-locker`는 표 AABB를 채운 닫힌 단일 고체 proxy다. 상면의 y=H−H/12..H 띠를 `body/lid-seam` face로, 전면 z=D/2에서 x=±W/10,y=5H/12..7H/12의 직사각형을 `body/handle` face로 구분한다. 뚜껑과 손잡이는 표면 구획이고 공동·돌출·힌지·잠금장치는 만들지 않는다. 상자 다섯 상태의 독립 외곽과 열린 세 상태의 빈 내부를 네 view에서 확인한다.

각 상태의 정확한 점유는 아래 표가 소유한다. 열린 상자는 `body/outer/inner/rim/sole`, 닫힌 `storage-box`·`parcel-locker`는 `body/outer/lid-seam/handle/sole`로 나누고 독립하지 않는 면을 억지로 발행하지 않는다.

ref02의 여러 수납실과 ref04의 책장 옆에서 선반과 독립 상자를 혼동하지 않도록 정면·상부·45°에서 본다. ref01·03·05는 상자 내용물을 제공하지 않는다. 잠금·적재 하중은 `unverified`다.

@void file-box: body, -0.142..0.142, 0.018..0.31, -0.182..0.182
@void toy-box: body, -0.282..0.282, 0.022..0.39, -0.192..0.192
@void recycling-box: body, -0.185..0.185, 0.029..0.51, -0.16..0.16

@inventory file-box: body
@inventory toy-box: body
@inventory storage-box: body
@inventory recycling-box: body
@inventory parcel-locker: body

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | file-box | * | bounds | -0.155..0.155 | 0..0.31 | -0.195..0.195 | - |
| @part | file-box | body | hollow | -0.155..0.155 | 0..0.31 | -0.195..0.195 | support |
| @envelope | toy-box | * | bounds | -0.3..0.3 | 0..0.39 | -0.21..0.21 | - |
| @part | toy-box | body | hollow | -0.3..0.3 | 0..0.39 | -0.21..0.21 | support |
| @envelope | storage-box | * | bounds | -0.23..0.23 | 0..0.33 | -0.18..0.18 | - |
| @part | storage-box | body | box | -0.23..0.23 | 0..0.33 | -0.18..0.18 | support |
| @envelope | recycling-box | * | bounds | -0.2..0.2 | 0..0.51 | -0.175..0.175 | - |
| @part | recycling-box | body | hollow | -0.2..0.2 | 0..0.51 | -0.175..0.175 | support |
| @envelope | parcel-locker | * | bounds | -0.31..0.31 | 0..0.84 | -0.24..0.24 | - |
| @part | parcel-locker | body | box | -0.31..0.31 | 0..0.84 | -0.24..0.24 | support |

<!-- @authored-address-state:start -->
@address-state file-box: body
@address-state toy-box: body
@address-state storage-box: body
@address-state recycling-box: body
@address-state parcel-locker: body
<!-- @authored-address-state:end -->

## 청소·수선·설비 도구 {#household-tools}

<!--
@evidence principles/core/common.md#scope-preservation 공구·청소·사다리·등기구·정원·호스릴의 고정 상태만 내며 기계·전기 작동을 주장하지 않는다.
@evidence principles/core/common.md#substantive-completion 청소기와 도구의 머리·손잡이, 사다리 다섯 가로대, 호스릴 측판·감긴 고리의 닫힌 점유를 만든다.
@evidence principles/core/common.md#declared-basis ref02 저장실·서비스실과 ref01 정원의 도구 역할을 받고 각 장비 단면·W/H/D는 이 모델 절이 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation ground-program의 1층 수납과 upper-program의 청소 수납·점검 공간에 서로 다른 청소·수선 도구의 고정 실루엣을 더한다.
@evidence principles/design/models.md#representation-contract 사다리 다리 사이와 호스릴 받침 위 공간을 비우고 양 측판·중심 통·감긴 호스의 내부 교차면을 제거한다.
@evidence principles/design/models.md#spatial-convention 바닥/선반 접촉 중심 원점, 취급 방향 +Z이며 사다리 두 레일과 호스릴 받침은 y=0에 유한 면으로 닿는다.
@evidence principles/design/models.md#reviewable-structure 정면·측면·45°에서 접힌 사다리 틈, reel의 환형 고리, 청소기 손잡이를 구별한다.
@evidence principles/design/models.md#model-observable-style-basis ref02의 서비스 수납과 ref01 정원 기능을 받되 ref03·04·05에 보이지 않는 공구 세부는 더하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 표 W/H/D 상태마다 실제 필요한 handle·contact·diffuser face만 내고 빈 공간을 덮는 외함 face는 만들지 않는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work ground-program의 1층 storage, upper-program의 청소 수납·설비 점검, site-access의 작은 대지를 시험했다. 긴 손잡이·접힌 사다리·hose-reel은 선택된 고정 장비 원형이고 수량·방별 바닥 접촉은 배치가 정하므로 새 설비 기능이나 공간이 필요하지 않다.
@evidence settings/002-household.md#ground-program 1층 수납실을 청소·수선 도구의 가능한 보관 장소로 받는다.
@evidence settings/002-household.md#upper-program 상층 청소 수납·설비 점검 영역을 도구 원형의 가능한 목적지로 받는다.
@evidence spaces/001-citizen-house.md#site-access 작은 대지를 외부 도구의 가능한 배치 공간으로 받되 지면·동선은 spaces가 소유한다.
@evidence settings/003-spatial-basis.md#surface-decomposition 도구 몸체·손잡이·hose 고리의 형상과 face를 models가 정한다.
@evidenceReview principles/core/common.md#scope-preservation  일곱 @inventory는 공구·청소·접힌 사다리·여분 등·정원 도구·감긴 호스의 고정 몸체만 낸다.
@evidenceReview principles/core/common.md#substantive-completion  도구 머리·손잡이, 사다리 두 레일·다섯 가로대와 hose-reel 받침·측판·환형 호스의 본문 식이 닫힌 점유를 만든다.
@evidenceReview principles/core/common.md#declared-basis  ref02 저장·서비스실과 ref01 정원 도구 역할을 받고 장비별 W/H/D와 단면은 이 H2의 선택이다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation  1층 storage와 상층 청소·점검 목적지에 서로 다른 청소·수선 장비 실루엣을 더한다.
@evidenceReview principles/design/models.md#representation-contract  folded-ladder 레일 사이와 hose-reel 측판 바깥 공기를 비우고 통·호스의 교차면은 한 body 안에서 제거한다.
@evidenceReview principles/design/models.md#spatial-convention  바닥 또는 선반 접촉 중심 원점, 취급 방향 +Z이며 사다리 레일과 릴 받침은 y=0에 양수 면적으로 닿는다.
@evidenceReview principles/design/models.md#reviewable-structure  body/handle·sole와 reel의 빈 주변이 정면·측면·45°에서 사다리 틈과 호스 고리를 구별하게 한다.
@evidenceReview principles/design/models.md#model-observable-style-basis  ref02 서비스 수납과 ref01 정원 용도를 쓰고 ref03·04·05에 없는 공구 상세는 더하지 않는다.
@evidenceReview principles/design/models.md#model-scale-layer-completion  일곱 @envelope·@part에 필요한 handle·contact·diffuser face만 정하고 빈 공간을 막는 외함 면은 내지 않는다.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work  1층 storage·상층 청소 수납과 작은 대지에 고정 도구를 대조했고 기계 성능·수량·배치는 새 공간 요구가 아니다.
@evidenceReview settings/002-household.md#ground-program  1층 수납실을 청소·수선 도구의 가능한 보관 장소로 받는다.
@evidenceReview settings/002-household.md#upper-program  상층 청소 수납·설비 점검 구역을 도구의 가능한 목적지로 받는다.
@evidenceReview spaces/001-citizen-house.md#site-access  작은 대지를 garden-tool·hose-reel의 가능한 배치 목적지로 받고 지면 geometry는 만들지 않는다.
@evidenceReview settings/003-spatial-basis.md#surface-decomposition  body/handle·contact, spare-light diffuser와 호스의 보이는 외곽을 안정 소품 face로 나눈다.
-->

@material-face spare-light: body/diffuser

`household-tools`는 공구 상자, 청소기, 접이식 사다리, 청소 도구, 여분 등기구, 정원 도구와 호스 릴의 상태별 고정 형상이다. 원점은 바닥 또는 선반 접촉 중심이고 +Z가 취급 방향이다. 사다리는 접힌 검사 상태, 호스는 릴에 감긴 검사 상태만 제공한다. `body/front/back/edge/sole`와 필요할 때 `body/handle/contact`를 안정 face로 둔다. 실제 회전·가동·전기 연결은 이 모델 단계에 포함하지 않는다.

`tool-box`는 표 AABB를 채운 단일 박스 proxy이며 전면 z=D/2의 중앙 x=±W/10,y=9H/20..11H/20만 손잡이 face로 구획한다. `vacuum`은 y=0..H/4의 X/Z 전폭 몸통과 중심 x=z=0, 반지름 min(W,D)/12, y=H/4..H의 24각 수직 손잡이를 합친다. `cleaning-tool`과 `garden-tool`은 y=0..H/10의 X/Z 전폭 머리와 중심 x=z=0, 반지름 min(W,D)/8, y=H/10..H의 24각 수직 손잡이를 합친다. `folded-ladder`는 X 양쪽에 중심 x=±(W/2−W/20), X 폭 W/10·Z 전깊이 D·Y 전높이 H의 닫힌 레일 둘을 두고, y=jH/6, j=1..5의 X 가로대 다섯 개를 합친다. 각 y=jH/6은 가로대의 Y 중심이다. 가로대 Y 범위는 jH/6±W/24, Z 범위는 −D/6..+D/6이며 X 끝은 두 레일의 안쪽 면 x=±(W/2−W/10)과 접한다. 양쪽 레일의 바닥은 양수 면적의 평평한 접지다. `spare-light`는 반지름 W/2, 높이 H의 막힌 24각 Y축 원통으로 상단을 `body/diffuser` face로 나눈다. `hose-reel`은 y=0..3H/49의 X 전폭·Z 전깊이 받침판, 중심 y=26H/49인 반지름 W/2의 원형 측판 두 장, 두 측판 사이의 반지름 W/4 중심 통을 하나의 고체로 합친다. 각 측판의 아래에는 X 구간 −W/12..W/12, Y 구간 3H/49..5H/49, 각 측판과 같은 Z 구간의 직사각 받침 하나씩을 합친다. 받침 윗부분은 측판의 원형 고체와 양수 부피로 겹치고 아랫면은 지면 받침판 윗면과 유한 면으로 닿는다. 측판의 Z 두께는 D/15이고 중심은 z=±(D/2−D/30)이며 중심 통은 그 사이를 잇는다. 통 둘레에는 중심 y=26H/49, z=−D/2+D/15..D/2−D/15, 안팎 반지름 W/4..5W/12의 환형 감긴 호스를 둔다. 호스 안쪽 원통면은 중심 통의 바깥면과 접하고 양끝은 측판의 안쪽 원판과 접한다. 받침판은 측판의 직사각 받침 아래와 유한 접촉면을 이루고 지면과 XZ 전면적에서 닿으며, 측판 바깥의 공기와 받침 위쪽의 빈 공간은 닫지 않는다.

각 상태의 정확한 점유는 아래 표가 소유한다. 도구의 손잡이·기능 면·접지 면은 상태별 실제 표면에 따라 나누며 사다리와 호스 릴의 빈 공간을 덮는 허구의 face는 만들지 않는다.

ref02의 저장실·서비스실과 ref01의 정원에서 빈 창고가 되지 않도록 정면·측면·45°의 크기와 개별 실루엣을 확인한다. ref03·04·05의 보이지 않는 공구 세부를 추정하지 않는다. 청소·기계·전기 성능은 `unverified`다.

@flat-contact vacuum: body, support, -Y, 0, -0.14..0.14, -0.12..0.12
@flat-contact folded-ladder: body, support, -Y, 0, -0.25..-0.22, -0.05..0.05
@flat-contact cleaning-tool: body, support, -Y, 0, -0.08..0.08, -0.06..0.06
@flat-contact garden-tool: body, support, -Y, 0, -0.08..0.08, -0.06..0.06

@inventory tool-box: body
@inventory vacuum: body
@inventory folded-ladder: body
@inventory cleaning-tool: body
@inventory spare-light: body
@inventory garden-tool: body
@inventory hose-reel: body
@formula-disc-pair hose-reel: body, 26/49

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | tool-box | * | bounds | -0.215..0.215 | 0..0.22 | -0.12..0.12 | - |
| @part | tool-box | body | box | -0.215..0.215 | 0..0.22 | -0.12..0.12 | support |
| @envelope | vacuum | * | bounds | -0.155..0.155 | 0..1.05 | -0.14..0.14 | - |
| @part | vacuum | body | curved | -0.155..0.155 | 0..1.05 | -0.14..0.14 | support |
| @envelope | folded-ladder | * | bounds | -0.255..0.255 | 0..1.55 | -0.065..0.065 | - |
| @part | folded-ladder | body | curved | -0.255..0.255 | 0..1.55 | -0.065..0.065 | support |
| @envelope | cleaning-tool | * | bounds | -0.09..0.09 | 0..1.23 | -0.075..0.075 | - |
| @part | cleaning-tool | body | curved | -0.09..0.09 | 0..1.23 | -0.075..0.075 | support |
| @envelope | spare-light | * | bounds | -0.06..0.06 | 0..0.08 | -0.06..0.06 | - |
| @part | spare-light | body | cylinder | -0.06..0.06 | 0..0.08 | -0.06..0.06 | support |
| @envelope | garden-tool | * | bounds | -0.095..0.095 | 0..1.14 | -0.075..0.075 | - |
| @part | garden-tool | body | curved | -0.095..0.095 | 0..1.14 | -0.075..0.075 | support |
| @envelope | hose-reel | * | bounds | -0.23..0.23 | 0..0.49 | -0.15..0.15 | - |
| @part | hose-reel | body | cylinder | -0.23..0.23 | 0..0.49 | -0.15..0.15 | support |

<!-- @authored-address-state:start -->
@address-state tool-box: body
@address-state vacuum: body
@address-state folded-ladder: body
@address-state cleaning-tool: body
@address-state spare-light: body
@address-state garden-tool: body
@address-state hose-reel: body
<!-- @authored-address-state:end -->

## 현관과 외부 비품 {#exterior-furnishings}

<!--
@evidence principles/core/common.md#scope-preservation 우편함·외부 가구·정원등·빗물통·자전거·거치대·쓰레기통의 고정 외형만 내고 기계 작동은 주장하지 않는다.
@evidence principles/core/common.md#substantive-completion 우편 투입 틈, 열린 통, 다리 사이 공간, 두 바퀴와 프레임 관·접지 돌기를 닫힌 형상으로 낸다.
@evidence principles/core/common.md#declared-basis ref01의 거리·진입 계단, ref02의 작은 외부 정원과 site-access의 대지 방향을 받고 비품 치수·자전거 절점은 이 절에서 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation site-access의 작은 대지·진입 방향에 우편함·벤치·자전거·정원등의 독립 지면 접촉 원형을 더한다.
@evidence principles/design/models.md#representation-contract 자전거 노출 삼각형은 wheel/front-frame/rear-frame/frame-junction 네 face로 분리하며 용접 내부 면을 발행하지 않는다.
@evidence principles/design/models.md#spatial-convention 지면 접촉 중심 원점, 진입로 쪽 +Z로 두고 바퀴 접지 돌기·거치대 판·가구 다리를 y=0에 맞춘다.
@evidence principles/design/models.md#reviewable-structure 정면·측면·45°에서 두 바퀴와 여섯 프레임 관, 가구 아래 공백과 열린 외부 통을 확인한다.
@evidence principles/design/models.md#model-observable-style-basis ref01의 거리·진입 계단과 ref02의 작은 외부 정원을 비품 목적지 근거로 쓰고 내부 가구를 외부 제품 상세로 복제하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 상태별 @void·@bore·@sole-grid와 bicycle 절점·24각 관을 표 점유로 닫아 출입 비품 규모를 기록한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work site-access의 대지 범위·현관 접근과 delivery-scope의 작은 앞마당을 시험했다. 우편함·벤치·자전거·정원등은 저작한 지면 접촉 비품이고 진입 계단·보도는 spaces가 소유하므로 모델 때문에 대지 동선을 바꾸지 않는다.
@evidence spaces/001-citizen-house.md#site-access 작은 대지의 진입 방향을 외부 우편함·벤치·자전거·정원등의 +Z 관찰 앞과 지면 접촉의 배치 입력으로 받는다.
@evidence settings/001-production.md#delivery-scope 작은 대지 앞마당을 외부 비품 원형의 납품 범위로 받는다.
@evidence settings/003-spatial-basis.md#surface-decomposition 대지 비품의 물체 형상·face 주소는 models가 소유하고 지면·식재·보도는 spaces에 남긴다.
@evidenceExclude spaces/003-surface-ownership.md#front-face 목재 현관문·계단실 유리·불투명 코어가 만나는 전면 외벽은 façade owner 소유다. 우편함과 외부 가구는 그 외벽의 opening을 자르지 않는다.
@evidenceExclude spaces/003-surface-ownership.md#rear-face 공용부·주침실·욕실 창을 품은 후면 외벽은 façade owner가 닫는다. 외부 비품은 대지 위에 서며 유리 panel을 만들지 않는다.
@evidenceExclude spaces/003-surface-ownership.md#right-face 화면 우측 -X 서비스 외벽과 배수관은 façade owner의 완결 면이다. 정원등·우편함의 지면 접촉은 그 건축 관을 복제하지 않는다.
@evidenceExclude spaces/003-surface-ownership.md#left-face 화면 좌측 +X의 작업실·작은 침실 창 세 개는 façade opening이다. 자전거·벤치의 독립 점유는 창 reveal을 소유하지 않는다.
@evidenceExclude spaces/003-surface-ownership.md#envelope-corners 네 외벽 코너의 대각 prism 접합은 façade owner들 사이의 건축 이음이다. 외부 물체의 @joint는 코너 벽 부피를 생성하지 않는다.
@evidenceReview principles/core/common.md#scope-preservation  아홉 @inventory는 우편함·야외 가구·등·통·자전거 등의 정지 외형만 내고 내후성·주행·저장 작동은 미검증이다.
@evidenceReview principles/core/common.md#substantive-completion  mailbox @void, 통 @bore, 가구 @sole-grid와 bicycle의 바퀴·여섯 관·접지 돌기 식이 빈 곳과 접촉을 만든다.
@evidenceReview principles/core/common.md#declared-basis  ref01 거리·진입 계단, ref02 작은 정원과 site-access를 목적지로 받고 개별 치수·자전거 절점은 로컬로 정한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation  작은 대지·진입 방향에 독립 접지 우편함·좌석·정원등·자전거 원형을 추가한다.
@evidenceReview principles/design/models.md#representation-contract  bicycle body/wheel·front-frame·rear-frame·frame-junction이 노출 고체 면을 나누고 관 용접 내부 면은 발행하지 않는다.
@evidenceReview principles/design/models.md#spatial-convention  지면 접촉 중심 원점·진입로 쪽 +Z와 가구 다리·자전거 접지 돌기의 y=0 면을 밝힌다.
@evidenceReview principles/design/models.md#reviewable-structure  wheel, frame, 가구 아래 빈 곳과 통 body/inner를 정면·측면·45°에서 따로 관찰하도록 한다.
@evidenceReview principles/design/models.md#model-observable-style-basis  ref01 진입·계단과 ref02 작은 외부 정원을 비품 역할로 받고 실내 가구를 외부 제품 상세로 복제하지 않는다.
@evidenceReview principles/design/models.md#model-scale-layer-completion  아홉 @envelope에 mailbox @void, 통 @bore, 가구 @sole-grid 및 bicycle 절점·관 좌표를 결합한다.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work  site-access와 작은 앞마당에 접지 비품을 대조했고 계단·보도는 spaces가 소유하므로 대지 동선 수정이 없다.
@evidenceReview spaces/001-citizen-house.md#site-access  작은 대지 진입 방향을 +Z 앞과 접지 배치의 근거로 받고 비품 본문은 독립 국소 원형을 낸다.
@evidenceReview settings/001-production.md#delivery-scope  작은 대지 앞마당을 우편함·야외 가구·자전거 등 비품 원형의 납품 목적지로 받는다.
@evidenceReview settings/003-spatial-basis.md#surface-decomposition  비품 body/sole·diffuser·wheel 등의 face를 모델로 소유하고 지면·보도 geometry는 공간에 남긴다.
@evidenceExcludeReview spaces/003-surface-ownership.md#front-face  front-face의 목재 문과 유리 cut을 mailbox·가구 @inventory로 만들지 않고 외부 비품은 지면에 선다.
@evidenceExcludeReview spaces/003-surface-ownership.md#rear-face  rear-face의 공용실·침실·욕실 창을 자전거나 정원등 부품으로 만들지 않는다.
@evidenceExcludeReview spaces/003-surface-ownership.md#right-face  right-face의 -X 서비스 벽·배수관은 외피 owner에 있으며 garden-light는 독립 지면 기둥이다.
@evidenceExcludeReview spaces/003-surface-ownership.md#left-face  left-face의 작업실·작은 침실 창 cut은 외부 좌석·자전거 원형에 없다.
@evidenceExcludeReview spaces/003-surface-ownership.md#envelope-corners  외벽의 대각 prism 접합은 입면 owner들의 일이며 이 H2의 bicycle frame-junction은 물체 내부 접합이다.
-->

@material-face garden-light: body/diffuser
@material-face bicycle: body/wheel

`exterior-furnishings`는 우편함, 외부 벤치·의자·탁자, 정원 조명, 빗물통, 자전거 거치대·자전거·실외 쓰레기통을 실내 가구와 구별되는 외부형 상태로 둔다. 원점은 지면 접촉 중심이고 +Z가 진입로를 향한다. 우편함과 빗물통의 개구, 자전거의 두 바퀴와 프레임, 외부 좌석의 상·하부 틈은 하나의 `body` 안에서 닫힌 절삭 형상으로 만든다. 정원 조명은 `body/front/back/side/top/sole/diffuser`를 쓴다. 자전거의 전체 노출 삼각형은 `body/wheel/front-frame/rear-frame/frame-junction` 네 face로 나눈다. `wheel`은 두 바퀴의 고리·허브·접지 돌기, `front-frame`은 앞 포크·핸들 기둥·가로 관, `rear-frame`은 여섯 프레임 관·안장의 노출면이다. 접합에서 내부 면을 제거하고 남은 삼각형은 그 원래 고체의 face에 두므로 네 주소가 겹치지 않는다. 나머지 외부 상태는 `body/front/back/side/top/sole`을 쓴다.

`mailbox`는 아래 두 `@void`로 본체 공동과 상부 투입 틈을 절삭한다. 틈의 실제 폭은 둘째 `@void`의 X 구간이며 앞면 분할선은 y=H/2의 face 경계다. `rain-barrel`과 `outdoor-waste-bin`의 원형 안쪽 반지름·바닥 높이는 각 `@bore`가 단독으로 정한다. `outdoor-bench`와 `outdoor-chair`는 y=sH..sH+H/12인 X/Z 전폭 좌판, X=−W/2..W/2·뒤쪽 z=−D/2..−D/2+D/12·y=sH..H인 전폭 등판, 네 모서리 다리를 합친다. 각 다리의 X/Z 폭과 중심은 아래 `@sole-grid` 한 행이 정하고, Y 점유는 y=0..sH다. `outdoor-table`은 y=H−H/12..H인 X/Z 전폭 상판과 같은 네 다리를 y=0..H−H/12까지 합친다. 좌판·상판 아래의 다리 사이 공간은 실제로 비어 있다. `garden-light`는 반지름 W/2·높이 H의 막힌 24각 Y축 기둥이며 맨 위 H/8을 `body/diffuser` face로 나눈다. `bike-rack`의 상부 반원은 12개 중심선 구간의 꼭짓점마다 관 단면 ring을 공유해 잇고 내부 면을 제거한다. 각 꼭짓점의 ring 평면은 그 자리의 반원 접선에 수직이고, 내부 꼭짓점에서는 이 방향이 앞뒤 직선 구간 접선의 이등분 방향과 같다. 각 ring의 첫 꼭짓점은 반원 중심에서 해당 중심선 꼭짓점으로 향하는 XY 바깥 반지름 방향이다. 중심선 꼭짓점과 그 단면의 바깥 꼭짓점이 최고 y=H에 닿으므로 mitre의 바깥 돌출은 만들지 않는다. 수직 다리와의 꺾임에는 공통 구 조인트를 둔다. `bike-rack`은 X/Y 평면의 반지름 W/2−W/24 중심 y=H−W/2인 상부 반원과 y=H/16..H−W/2인 아래 두 수직 다리를 반지름 W/24인 24각 관으로 연결하고, 각 다리 밑에는 다리와 같은 X 중심 ±(W/2−W/24)의 X 폭 W/12·Z 전깊이 D·Y 높이 H/16인 접지판을 일체화한다. 자전거의 차축은 `@axis-control`의 X 대칭 중심과 Y 높이를 따른다. 두 바퀴는 XY 평면의 바깥 반지름 R, 림 안반지름 7R/8, 허브 반지름 R/10인 24각 고리이고 R은 차축 높이 `@axis-control bicycle`의 Y 값이다. Z 반두께는 해당 `@axis-control`이다. 각 바퀴에는 차축 X를 중심으로 x=차축 X±a, z=±바퀴 반두께, y=0..R/6인 닫힌 평평한 타이어 접지 돌기를 같은 고체로 합친다. 돌기 윗부분은 림의 하단 고리와 양수 부피로 겹치고 y=0 밑면은 지면과 2a×바퀴 전체 두께의 유한 면으로 닿는다. a는 `@flat-contact bicycle`의 X 전폭 절반이며 오른쪽 바퀴의 접지면은 차축 X 대칭으로 같은 크기다. 여기서 s는 `@scalar-control outdoor-seat-height-ratio`의 값이다. 프레임 관의 24각 단면 반지름은 W/120이다. 절점 A~E에서 끝나는 프레임 관은 공통 용접 끝 규칙대로 평평한 원판으로 끝나고 각 절점의 꺾임은 반지름 W/120의 구 조인트로 채운다. 외부에 드러나는 원판·조인트는 `body/frame-junction` face로 발행한다. XY 절점 A는 뒤 차축, B=(0,y_B), C는 앞 차축, D=(0,y_D), E=(−W/8,y_S−H/80)이며 y_B·y_D·y_S는 각각 `@axis-control bicycle`의 frame node B, frame node D, saddle top Y 값이다. 관은 AB,BD,DA,BC,CD,BE의 여섯 선분만 따라 합친다. 앞 포크는 C에서 핸들 기둥으로 이어지고 겹치는 내부 면은 제거한다. 안장은 중심 E에서 X 길이 W/5·Z 폭 D/4·Y 두께 H/40의 닫힌 판이므로 윗면 y=y_S다. 핸들 기둥은 앞 차축에서 x=+W/4,y=H−W/120까지 올라가고 마지막 가로 관은 X 중심 +W/4, y=H−W/120, Z=±(D/2−W/120)의 중심선 끝까지 이어진다. 기둥의 위쪽 중심선 끝과 가로 관 양 끝에 공통 관 끝 규칙의 반구를 붙여 위쪽 외곽 y=H와 양쪽 외곽 z=±D/2에 닿는다. 자전거 거치대·자전거의 하부 열린 공간과 두 바퀴 사이의 공기를 네 view에서 확인한다.

각 상태의 정확한 점유는 아래 표가 소유한다. 우편함 틈, 가구 하부, 거치대 안쪽과 자전거 바퀴 안쪽의 빈 공간을 덮는 면은 발행하지 않는다.

ref01의 거리·진입 계단과 ref02의 작은 외부 정원에 비례하도록 정면·측면·45°에서 읽힘을 확인한다. ref03·04·05는 외부 기물의 상세 치수를 주지 않는다. 내후성·자전거 주행·빗물 저장량은 `unverified`다.

@void mailbox: body, -0.16..0.16, 0.05..0.45, -0.09..0.09
@void mailbox: body, -0.15..0.15, 0.45..0.48, -0.015..0.015
@bore rain-barrel: body, 0.293, 0.051..0.91
@bore outdoor-waste-bin: body, 0.18, 0.036..0.65

@scalar-control outdoor-seat-height-ratio: 0.55
@formula-seat-slab outdoor-bench,outdoor-chair: body, 12
@formula-wheel-pair bicycle: body
@axis-control bicycle: body, Y, 0.70, frame node B height
@axis-control bicycle: body, Y, 0.40, frame node D height

@flat-contact outdoor-bench: body, support, -Y, 0, -0.74..-0.70, -0.27..-0.245
@sole-grid outdoor-bench: body, 16, 12, 32, 24
@flat-contact outdoor-chair: body, support, -Y, 0, -0.28..-0.26, -0.28..-0.25
@sole-grid outdoor-chair: body, 16, 12, 32, 24
@flat-contact outdoor-table: body, support, -Y, 0, -0.35..-0.32, -0.35..-0.32
@sole-grid outdoor-table: body, 16, 12, 32, 24
@flat-contact bike-rack: body, support, -Y, 0, -0.44..-0.40, -0.18..0.18
@flat-contact bicycle: body, support, -Y, 0, -0.575..-0.515, -0.0175..0.0175

@inventory mailbox: body
@inventory outdoor-bench: body
@inventory outdoor-chair: body
@inventory outdoor-table: body
@inventory garden-light: body
@inventory rain-barrel: body
@inventory bike-rack: body
@inventory bicycle: body
@inventory outdoor-waste-bin: body
@axis-control bicycle: body, X, 0.545, front and rear wheel centers by signed reflection
@axis-control bicycle: body, Y, 0.34, wheel axle height
@axis-control bicycle: body, Y, 0.93, saddle top
@axis-control bicycle: body, Z, 0.0175, wheel half thickness by signed reflection

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | mailbox | * | bounds | -0.19..0.19 | 0..0.48 | -0.12..0.12 | - |
| @part | mailbox | body | hollow | -0.19..0.19 | 0..0.48 | -0.12..0.12 | support |
| @envelope | outdoor-bench | * | bounds | -0.76..0.76 | 0..0.8 | -0.29..0.29 | - |
| @part | outdoor-bench | body | curved | -0.76..0.76 | 0..0.8 | -0.29..0.29 | support |
| @envelope | outdoor-chair | * | bounds | -0.29..0.29 | 0..0.78 | -0.29..0.29 | - |
| @part | outdoor-chair | body | curved | -0.29..0.29 | 0..0.78 | -0.29..0.29 | support |
| @envelope | outdoor-table | * | bounds | -0.36..0.36 | 0..0.73 | -0.36..0.36 | - |
| @part | outdoor-table | body | curved | -0.36..0.36 | 0..0.73 | -0.36..0.36 | support |
| @envelope | garden-light | * | bounds | -0.06..0.06 | 0..0.7 | -0.06..0.06 | - |
| @part | garden-light | body | cylinder | -0.06..0.06 | 0..0.7 | -0.06..0.06 | support |
| @envelope | rain-barrel | * | bounds | -0.32..0.32 | 0..0.91 | -0.32..0.32 | - |
| @part | rain-barrel | body | hollow | -0.32..0.32 | 0..0.91 | -0.32..0.32 | support |
| @envelope | bike-rack | * | bounds | -0.46..0.46 | 0..0.64 | -0.21..0.21 | - |
| @part | bike-rack | body | curved | -0.46..0.46 | 0..0.64 | -0.21..0.21 | support |
| @envelope | bicycle | * | bounds | -0.885..0.885 | 0..1.12 | -0.235..0.235 | - |
| @part | bicycle | body | curved | -0.885..0.885 | 0..1.12 | -0.235..0.235 | support |
| @envelope | outdoor-waste-bin | * | bounds | -0.21..0.21 | 0..0.65 | -0.21..0.21 | - |
| @part | outdoor-waste-bin | body | hollow | -0.21..0.21 | 0..0.65 | -0.21..0.21 | support |

<!-- @authored-address-state:start -->
@address-state mailbox: body
@address-state outdoor-bench: body
@address-state outdoor-chair: body
@address-state outdoor-table: body
@address-state garden-light: body
@address-state rain-barrel: body
@address-state bike-rack: body
@address-state bicycle: body
@address-state outdoor-waste-bin: body
<!-- @authored-address-state:end -->

## 현관 거울·벽등·코트 걸이 {#wall-accessories}

<!--
@evidence principles/core/common.md#scope-preservation 거울·벽등·두 끝 코트 걸이의 고정 외형만 내고 광량·배선·의복 하중은 주장하지 않는다.
@evidence principles/core/common.md#substantive-completion 거울 frame 면, 벽등 판·팔·갓, 걸이 plate·두 arm·bend·root-end·terminal을 실제 접합으로 낸다.
@evidence principles/core/common.md#declared-basis ref01 현관 온광, ref05 복도 조명 규모, ref02 현관 수납 기능을 받고 제품 단면은 이 모델에서 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation ground-program의 현관·신발 수납과 entry의 내측 벽에 거울·벽등·두 팔 코트 걸이의 독립 부착 형상을 더한다.
@evidence principles/design/models.md#representation-contract 벽등 팔과 갓의 내부 교차면을 제거하고 걸이 뿌리의 노출 반원만 root-end로 발행한다.
@evidence principles/design/models.md#spatial-convention 벽 접촉 뒤면의 X 중심·Y 하단을 원점, 실내 +Z로 두고 세 상태 모두 z=0에 양수 접촉면을 둔다.
@evidence principles/design/models.md#reviewable-structure 정면·측면·45°에서 거울 판, 벽등 전체 diffuser, 걸이 두 자유 끝과 벽판을 분리해 본다.
@evidence principles/design/models.md#model-observable-style-basis ref01·05의 현관/복도 빛 크기와 ref02의 코트 수납을 받되 보이지 않는 회로·상표는 만들지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion mirror·sconce·hook의 표 W/H/D와 각 벽 접촉·팔 끝을 닫고 두 코트 중심이 서로 겹치지 않는 간격을 기록한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work ground-program의 현관 기능, entry의 내측 벽, household-program의 생활 물품을 시험했다. 거울·벽등·코트 걸이는 선택한 돌출형 물체이고 코트 수량은 배치가 정한다. 벽 접촉은 구멍 없이 닫히며 새 방·상태를 요구하지 않는다.
@evidence settings/002-household.md#ground-program 현관·신발 수납 기능을 벽 거울·등·코트 걸이의 가능한 사용 배경으로 받되 세 물체를 프로그램 의무로 읽지 않는다.
@evidence settings/002-household.md#household-program 생활 흔적을 가구·설비·수납으로 표현하는 범위에서 현관 벽 물체를 저작 선택한다.
@evidence spaces/002-spatial-graph.md#entry 현관 내측 벽을 돌출 물체의 가능한 부착 면으로 받고 실제 문·계단 clear는 배치에 남긴다.
@evidence settings/003-spatial-basis.md#surface-decomposition 거울·벽등·걸이의 형상과 face를 models가, 발광은 systems가 소유한다.
@evidenceReview principles/core/common.md#scope-preservation  @inventory는 거울·벽등·두 끝 코트 걸이의 정지 외형만 내고 광량·배선·의복 하중은 unverified로 둔다.
@evidenceReview principles/core/common.md#substantive-completion  거울 frame 면, 벽등 plate·arm·diffuser, 걸이 plate·두 arm·bend·terminal이 본문 좌표로 구분된다.
@evidenceReview principles/core/common.md#declared-basis  ref01 현관 온광·ref05 복도 조명과 ref02 현관 수납을 역할로 받고 제품 단면은 이 H2가 선택한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation  현관·신발 수납과 entry 내측 벽에 독립 거울·벽등·두 팔 걸림 원형을 더한다.
@evidenceReview principles/design/models.md#representation-contract  벽등 arm·shade의 교차 내부 면을 제거하고 걸이 root-end는 벽판 위에 노출된 반원만 발행한다.
@evidenceReview principles/design/models.md#spatial-convention  벽 접촉면 X 중심·Y 하단을 원점으로 실내 +Z를 정의하고 @part 세 상태의 뒤면은 z=0이다.
@evidenceReview principles/design/models.md#reviewable-structure  body/front·frame, body/diffuser와 걸이 body/terminal이 정면·측면·45°에서 세 역할을 가른다.
@evidenceReview principles/design/models.md#model-observable-style-basis  ref01·05는 현관·복도의 빛 크기, ref02는 코트 수납 용도로 쓰고 미보이는 회로·상표는 만들지 않는다.
@evidenceReview principles/design/models.md#model-scale-layer-completion  mirror·sconce·hook의 @envelope와 @flat-contact, 두 팔 X 간격이 외곽과 걸림 분리를 닫는다.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work  현관 기능·entry 벽·생활 소품 범위에 세 돌출 물체를 대조했고 벽 cut·새 방·상태를 요구하지 않는다.
@evidenceReview settings/002-household.md#ground-program  현관·신발 수납을 세 벽 물체의 가능한 기능 배경으로 받되 그 셋을 필수 프로그램으로 주장하지 않는다.
@evidenceReview settings/002-household.md#household-program  생활 흔적용 가구·설비·수납 범위에 현관 벽 소품 셋을 저작 선택한다.
@evidenceReview spaces/002-spatial-graph.md#entry  현관 내측 벽을 z=0 접촉 면의 가능한 목적지로 받고 문·계단 clear는 배치에 남긴다.
@evidenceReview settings/003-spatial-basis.md#surface-decomposition  mirror body/front·frame, sconce body/diffuser 및 hook body/arm·terminal을 안정 면으로 내고 발광은 systems에 남긴다.
-->

@material-face entry-mirror: body/front
@material-face wall-sconce: body/diffuser

`wall-accessories`는 독립 벽거울·벽등·현관 코트 걸이를 고정점 기준 상태로 둔다. 거울은 판 두께와 둘레 프레임을 하나의 닫힌 `body/front/back/edge/frame`으로 구분한다. 벽등은 벽쪽 받침, 팔, 발광 갓의 서로 다른 `body/back/arm/diffuser` face를 가진다. 코트 걸이는 `body/plate/arm/bend/root-end/terminal`로 나누고 두 벌의 독립 의복이 걸리는 두 끝을 가진다. 원점은 뒤쪽 벽 접촉면의 X 중심·Y 하단이고 +Z가 실내 방향이므로 모든 상태에서 뒤쪽 평면이 벽 datum이다.

원점의 Y는 물체 아래선이고 X는 폭 중심이다. `entry-mirror`는 표의 닫힌 판에서 X/Y 바깥 둘레 W/30을 `body/frame`으로, 나머지 z=D의 평평한 앞면 중앙을 `body/front` 반사면으로 나눈다. 음각이나 별도 단차 벽은 만들지 않는다. `wall-sconce`는 z=0..D/8, 중심 (x=0,y=H/2), X 반지름 W/2·Y 반지름 H/2인 24각 타원 벽 접촉판과 y=H/2+W/16을 중심으로 z=D/8..5D/8로 향하는 반지름 W/16의 24각 팔을 합친다. 팔의 가장 낮은 선은 갓 아래면 y=H/2에 접할 뿐이고 팔의 윗부분은 갓 안으로 양수 부피가 겹친다. 확산 갓은 중심 x=0,z=3D/4, X 반지름 W/2·Z 반지름 D/4인 Y축 24각 타원통을 y=H/2..H에 두어 팔 끝과 유한 면으로 합친다. 팔과 갓의 내부 교차면은 제거한다. 팔은 갓 아래 평면에서 면적을 차지하지 않으므로 갓의 y=H/2 아래 타원 원판 전체가 `body/diffuser` face다. 노출된 팔의 원통·마개는 `body/arm`이다. `coat-hook`의 벽판은 x=±W/2,y=0..H/2,z=0..D/8을 채운다. 두 팔은 x=±(W/2−W/10), y=H/2, z=D/8..D−W/32의 24각 봉이고 단면 반지름 W/32다. 끝은 같은 반지름의 수직 봉 중심선을 z=D−W/32, y=H/2..H−W/32로 올린다. 각 팔과 수직 봉의 꺾임 중심에 반지름 W/32의 구 조인트를 합치고 `body/bend`로 발행한다. 팔 뿌리의 z=D/8 원판 중 벽판 윗면 y=H/2보다 높은 반원은 `body/root-end`로 남기고 나머지는 판과 용접해 내부 면을 제거한다. 위쪽 자유 끝에는 공통 관 끝 규칙의 반구를 붙여 외곽 y=H에 닿게 하고 두 걸림 홈을 형성한다. 벽판의 노출 면은 `body/plate`, 팔 외면은 `body/arm`, 자유 끝 반구는 `body/terminal`이다. 두 팔의 X 중심 간격은 4W/5이며 `personal-articles/coat` 둘의 독립 실루엣은 각 중심에서 서로 겹치지 않는다. 세 상태의 z=0 벽 접촉면은 양수 면적이다. 광량·실제 의복 하중은 `unverified`다.

각 상태의 정확한 점유는 아래 표가 소유한다. 거울에는 프레임·반사판·뒷판·노출 모서리를, 벽등에는 뒷판·팔·확산 갓을, 걸이에는 뒷판·두 팔·걸림 끝을 나누고 벽 접촉면도 주소를 유지한다.

ref01의 현관 온광과 ref05의 복도 실용 조명 규모를 참고해 정면·측면·45°에서 거울, 빛 표면, 두 걸림 끝을 분리한다. ref02의 현관 수납 기능을 코트 걸이의 근거로 삼고 ref03·04에서 보이지 않는 회로와 제품 형상은 만들지 않는다. 조도·배선·실제 의복 하중은 `unverified`다.

@flat-contact wall-sconce: body, wall, -Z, 0, -0.04..0.04, 0.08..0.16
@flat-contact coat-hook: body, wall, -Z, 0, -0.30..0.30, 0.01..0.05

@inventory entry-mirror: body
@inventory wall-sconce: body
@inventory coat-hook: body

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | entry-mirror | * | bounds | -0.28..0.28 | 0..1.22 | 0..0.035 | - |
| @part | entry-mirror | body | box | -0.28..0.28 | 0..1.22 | 0..0.035 | wall |
| @envelope | wall-sconce | * | bounds | -0.095..0.095 | 0..0.24 | 0..0.16 | - |
| @part | wall-sconce | body | curved | -0.095..0.095 | 0..0.24 | 0..0.16 | wall |
| @envelope | coat-hook | * | bounds | -0.4..0.4 | 0..0.12 | 0..0.12 | - |
| @part | coat-hook | body | curved | -0.4..0.4 | 0..0.12 | 0..0.12 | wall |

<!-- @authored-address-state:start -->
@address-state entry-mirror: body
@address-state wall-sconce: body
@address-state coat-hook: body
<!-- @authored-address-state:end -->

## 작업실 소형 장치 {#desk-controls}

<!--
@evidence principles/core/common.md#scope-preservation 화면·키보드와 별도인 포인팅 기기 한 원형만 내고 입력·충전 신호는 주장하지 않는다.
@evidence principles/core/common.md#substantive-completion 평평한 타원 sole과 둥근 반타원 upper를 닫고 앞쪽 좌우 클릭 면을 별도 주소로 나눈다.
@evidence principles/core/common.md#declared-basis ref04 책상 앞 기기 밀도와 ref02 침실 책상 재사용을 받고 치수·타원 분할은 이 모델 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation ground-program의 작업실 desk와 upper-program의 침실 desk에 놓을 저작 소품으로 두 클릭 면의 낮은 장치 원형을 더한다.
@evidence principles/design/models.md#representation-contract 단일 닫힌 본체의 윗면을 두 클릭 face로 구획하고 버튼 누름을 별도 가동 part로 만들지 않는다.
@evidence principles/design/models.md#spatial-convention 상판 접촉 타원 중심 원점, 사용자 쪽 +Z이며 sole은 y=0의 평평한 면이다.
@evidence principles/design/models.md#reviewable-structure 정면·측면·상부·45°에서 둥근 윗면과 평평한 밑면, 앞쪽 클릭 면 둘을 구별한다.
@evidence principles/design/models.md#model-observable-style-basis ref04 책상 소품 규모를 따르고 ref02의 개인 책상에도 같은 물체를 쓰며 제조사 표시는 만들지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 24 둘레·12 높이 구간의 반타원과 표 W/H/D로 닫힌 몸체를 만들고 필요한 face만 분리한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work ground-program의 작업실 desk, upper-program의 침실 desk, surface-decomposition의 소품 형상 소유를 시험했다. 손바닥형 장치는 책상 위 고정 물체로 전자 기능·새 운영 상태를 약속하지 않고 위치는 배치가 정하므로 방 프로그램을 고치지 않는다.
@evidence settings/002-household.md#ground-program 작업실 desk를 낮은 조작 장치의 가능한 지지 상판으로 받는다.
@evidence settings/002-household.md#upper-program 침실 desk를 같은 원형의 가능한 재사용 대상으로 받는다.
@evidence settings/003-spatial-basis.md#surface-decomposition 장치 몸체·클릭 면의 형상 주소는 models가 정한다.
@evidenceReview principles/core/common.md#scope-preservation  @inventory pointing-device 한 원형만 내고 화면·키보드 및 입력·충전 신호를 모델 기능으로 넣지 않는다.
@evidenceReview principles/core/common.md#substantive-completion  타원 sole과 반타원 upper의 본문 식을 닫힌 body로 만들고 앞쪽 클릭 face를 좌우로 분할한다.
@evidenceReview principles/core/common.md#declared-basis  ref04 작업 책상과 ref02 침실 책상을 가능한 목적지로 받고 W/H/D 및 타원 분할은 이 H2가 정한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation  작업실·침실 desk에 낮은 두 클릭 면의 별도 포인팅 소품 원형을 저작 선택해 더한다.
@evidenceReview principles/design/models.md#representation-contract  단일 @part body의 앞 윗면을 두 face로 구분하고 버튼 누름 가동 부품은 만들지 않는다.
@evidenceReview principles/design/models.md#spatial-convention  상판 접촉 타원 중심 원점·사용자 쪽 +Z를 정하고 @flat-contact sole은 y=0이다.
@evidenceReview principles/design/models.md#reviewable-structure  body/upper·side·sole와 좌우 클릭 면이 정면·측면·상부·45°에서 둥근 위와 평평한 아래를 판별하게 한다.
@evidenceReview principles/design/models.md#model-observable-style-basis  ref04 책상 소품 규모를 쓰고 ref02 침실 책상에 같은 원형을 재사용하며 제조사 문구를 내지 않는다.
@evidenceReview principles/design/models.md#model-scale-layer-completion  24 둘레·12 높이 구간의 반타원 식과 @envelope 0.065×0.035×0.11m가 body 점유를 닫는다.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work  두 desk 목적지와 소품 형상 권한에 손바닥형 고정 장치를 대조했고 전자 기능·운영 상태·배치는 더하지 않는다.
@evidenceReview settings/002-household.md#ground-program  작업실 desk를 포인팅 기기의 가능한 지지 상판으로 받는다.
@evidenceReview settings/002-household.md#upper-program  침실 desk에도 같은 pointing-device 원형을 쓸 수 있도록 둔다.
@evidenceReview settings/003-spatial-basis.md#surface-decomposition  body/upper·side·sole와 앞쪽 클릭 face를 안정 재사용 물체 주소로 정한다.
-->

정면·측면·상부·45°의 중립 관찰에서 포인팅 기기의 둥근 윗면과 평평한 접촉 밑면이 판별되어야 한다.

`desk-controls`는 화면·키보드와 별개인 포인팅 기기를 소유한다. 상판 접촉 중심이 원점이고 +Z가 사용자를 향한다. 닫힌 손바닥형 본체의 `body/upper/side/sole`과 좌우 클릭 면을 독립 주소로 둔다. 입력 동작은 형상에 새 part를 만들지 않는다.

포인팅 기기는 (2x/W)²+(2z/D)²≤1인 타원 밑면과 그 위의 y=H√(1−(2x/W)²−(2z/D)²)인 반타원 윗면을 24개 둘레와 12개 높이 구간으로 닫는다. 밑면은 y=0의 평평한 접촉 타원이고 +Z 앞쪽 z=D/6..D/2의 윗면을 x=0에서 좌우 두 클릭 face로 나눈다. 문자·버튼 신호는 구현하지 않는다.

정확한 점유는 아래 표가 소유한다. 포인팅 기기는 윗면·클릭 면·옆면·밑면을 분할한다.

ref04의 책상 앞 포인팅 기기 밀도를 따르고 ref02의 개인 침실 책상에도 같은 prototype을 쓴다. ref01·03·05에서 보이지 않는 제조사 표시는 만들지 않는다. 전자 입력·충전 성능은 `unverified`다.

@flat-contact pointing-device: body, support, -Y, 0, -0.015..0.015, -0.03..0.03

@inventory pointing-device: body

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | pointing-device | * | bounds | -0.0325..0.0325 | 0..0.035 | -0.055..0.055 | - |
| @part | pointing-device | body | curved | -0.0325..0.0325 | 0..0.035 | -0.055..0.055 | support |

<!-- @authored-address-state:start -->
@address-state pointing-device: body
<!-- @authored-address-state:end -->

## 주방 상부장 밑면 선형등 {#under-cabinet-light}

<!--
@evidence principles/core/common.md#scope-preservation 상부장 밑 광띠의 낮은 외형만 내고 전기 연결·빛 퍼짐은 systems 확인으로 남긴다.
@evidence principles/core/common.md#substantive-completion 닫힌 낮은 body의 밑 diffuser·housing·양 끝 cap face를 나누고 상면 전체를 cabinet 밑면에 맞댄다.
@evidence principles/core/common.md#declared-basis ref03의 조리대 위 상부장 밑 간접 빛을 받고 광띠 치수와 좌우 두 호출은 이 절과 instances가 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation ground-program의 주방 cooktop과 production-visual-grammar의 실내등에 상부장 밑 선형 기구 두 개의 형상을 더한다.
@evidence principles/design/models.md#representation-contract diffuser는 아래를 향한 노출 face이고 housing·끝 마개와 면 경계를 분리하지만 별도 발광 작동 부품은 만들지 않는다.
@evidence principles/design/models.md#spatial-convention 상부장 밑 접합 중심 원점, 길이 +X, 조리대 -Y, 실내 +Z이며 underside는 y=0 접촉이다.
@evidence principles/design/models.md#reviewable-structure 밑면과 45°에서 연속 diffuser·끝 마개·상부장 접촉을 보고 후드와의 비겹침은 instances에서 확인한다.
@evidence principles/design/models.md#model-observable-style-basis ref03의 상부장 아래 광띠를 형상 근거로 받고 다른 참조의 외피 반사를 기구로 읽지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 표의 낮은 직육면체 전체 x 상면을 접합 평면에 두고 diffuser·housing·end를 빠짐없이 주소로 낸다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work ground-program의 주방 cooktop, production-visual-grammar의 켜진 실내등, surface-decomposition의 형상·emitter 분리를 시험했다. 두 광띠는 상부장 밑에 닿는 고정 물체이고 후드와의 비겹침·광량은 후속 owner가 정하므로 새 방·상태가 필요하지 않다.
@evidence settings/002-household.md#ground-program 주방의 induction cooktop을 상부장 밑 조명의 작업면으로 받는다.
@evidence settings/001-production.md#production-visual-grammar 따뜻한 실내등의 보이는 선형 기구를 주방에도 제공한다.
@evidence settings/003-spatial-basis.md#surface-decomposition 광띠 외함·diffuser face는 models가, 발광 과정은 systems가 소유한다.
@evidenceReview principles/core/common.md#scope-preservation  @inventory default의 낮은 고정 body만 내고 전기 연결·빛 퍼짐은 systems 확인 전 미검증으로 둔다.
@evidenceReview principles/core/common.md#substantive-completion  닫힌 @part body의 diffuser·housing·end face와 상부장 밑면 y=0 접촉을 따로 지정한다.
@evidenceReview principles/core/common.md#declared-basis  ref03 상부장 밑 간접 빛을 역할로 받고 광띠 0.80×0.05×0.03m 및 좌우 반복 배치는 모델·instances에 나눈다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation  주방 cooktop과 따뜻한 실내등 역할에 상부장 밑 선형 기구 원형을 추가한다.
@evidenceReview principles/design/models.md#representation-contract  body/diffuser를 아래 노출 면으로, housing·end를 다른 면으로 나누며 발광 작동 부품은 만들지 않는다.
@evidenceReview principles/design/models.md#spatial-convention  상부장 밑 접합 중심 원점, 길이 +X·조리대 -Y·실내 +Z이고 @part 상면은 y=0이다.
@evidenceReview principles/design/models.md#reviewable-structure  body/diffuser·end와 underside 접촉을 밑면·45°에서 확인하도록 하고 후드 비겹침은 instances에 남긴다.
@evidenceReview principles/design/models.md#model-observable-style-basis  ref03 상부장 아래 광띠를 형상 근거로 쓰고 외피의 빛 반사를 기구 증거로 읽지 않는다.
@evidenceReview principles/design/models.md#model-scale-layer-completion  @envelope x=-0.4..0.4,y=-0.03..0,z=-0.025..0.025와 body의 전체 상면 접촉을 닫는다.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work  주방 cooktop·실내등·형상과 emitter 분리에 고정 광띠를 대조했고 후드 정렬·광량은 후속 owner에 남긴다.
@evidenceReview settings/002-household.md#ground-program  induction cooktop을 상부장 밑 선형등의 가능한 작업면으로 받는다.
@evidenceReview settings/001-production.md#production-visual-grammar  켜진 따뜻한 실내등에 대응할 주방 선형 기구의 보이는 diffuser 면을 제공한다.
@evidenceReview settings/003-spatial-basis.md#surface-decomposition  body/diffuser·housing·end를 안정 모델 면으로 구별하고 광량은 systems에 남긴다.
-->

ref03의 조리대 위 상부장 밑에 보이는 광띠를 같은 변종의 좌우 독립 등기구로 둔다. 후드 바깥쪽 상부장 밑면에 하나씩 배치해 금속 후드와 겹치지 않는 위치는 instances가 소유한다. local 원점은 상부장 밑면의 접합 중심이고 +X는 광띠의 길이, −Y는 조리대 방향, +Z는 실내 쪽이다. 표가 소유하는 낮은 직육면체이며 밑면의 `body/diffuser`와 나머지 `body/housing`, 양 끝 `body/end`를 분리해 주소를 준다. 실제 전기 연결과 빛의 퍼짐은 systems에서 확인하며 이 설계만으로는 `unverified`다.

`underside`는 상부장 밑면 y=0의 접합 평면이다. 전체 x 상면이 그 평면에 닿아야 하고 상부장 실체와의 면적·가림은 instances에서 검증한다. ref03의 간접 빛을 기준으로 밑면과 45°에서 연속 확산면, 끝 마개 및 상부장 접합을 확인한다.

@material-face default: body/diffuser
@inventory default: body

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | default | * | bounds | -0.4..0.4 | -0.03..0 | -0.025..0.025 | - |
| @part | default | body | box | -0.4..0.4 | -0.03..0 | -0.025..0.025 | underside |

<!-- @authored-address-state:start -->
@address-state default: body
<!-- @authored-address-state:end -->
