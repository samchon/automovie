# 시민 주택의 생활 사물 모델

[공통 단위·주소·관찰](000-representation.md#model-address-and-scale)을 따른다. 방별 독립 물체를 세는 작업 목록은 `.wiki/사물-목록.md`에 있으며 이 문서는 종류별 재사용 형상만 정한다. 아래 변종은 `state`로 판별하고 같은 state는 동일한 부품과 치수를 낸다. 각 표의 수치는 m 단위의 국소 점유다. 이 설계는 재료의 실제 결합·방별 배치·작동 구현을 주장하지 않는다.

## 직물과 출입 매트 {#household-textiles}

`household-textiles`는 벤치 쿠션, 소파 쿠션, 베개, 담요, 여분 침구 세트, 접힌 시트, 식탁 매트, 행주, 욕실 매트와 실내외 출입 매트를 직물과 고무의 치수·표면 상태 변종으로 만든다. 각 상태는 하나의 닫힌 몸체이며 침대 매트리스나 소파 본체에 합치지 않는다. 표의 원점은 놓이는 면의 중심이고 +Z는 물체를 보는 앞이다. 테두리 봉제선은 `body/edge`, 노출 윗면은 `body/upper`, 받침면은 `body/sole`로 나누며 얇은 매트는 뒷면도 별도 `body/underside`다. 접힌 직물은 위아래 층의 실루엣을 한 부품 안에서 접힌 자국으로 표현하되 풀림 동작은 만들지 않는다.

직물 상태는 표의 W×H×D 경계를 갖는 닫힌 모서리 둥근 직육면체다. XY·YZ 단면의 모서리 반경은 min(H/2,W/12,D/12), 상·하면 중심은 평평하고 모서리만 부풀린다. `folded-sheet`, `bedding-set`, `blanket`은 Z 방향으로 접힌 선을 정중앙에 두고 그 선의 Y 좌표를 상면보다 H/8 낮추되 하부는 닫는다. `bedding-set`은 수납칸 안에 들어가는 접힌 여분 침구 묶음, `pillow`와 두 cushion은 중앙이 가장 높은 독립 덩어리다. 판형 매트는 상·하 평면을 유지하고 가장자리만 닫아 바닥과 겹치지 않는다. `outdoor-mat`은 같은 판형 재단을 쓰되 고무 격자 배수 홈을 윗면 face 안에 내고 별도 실외 마감을 받는다. 네 중립 관찰에서 접힌 선·봉제 edge·빈 주변 면이 판독되지 않으면 이 proxy는 실패다.

각 상태의 정확한 점유는 아래 표가 소유한다. `body`의 윗면·둘레·밑면은 모두 face 주소를 가지며 접촉하는 밑면도 geometry에서 빠지지 않는다.

ref02의 침실 직물과 ref03의 소파·식탁 밀도, ref04의 손님 침구 가능성을 기준으로 정면·상부·45°에서 개별 직물의 두께와 독립된 경계가 읽혀야 한다. ref01·05는 이 직물의 세부를 주지 않는다. 섬유 물성·세탁 성능은 `unverified`다.

@inventory bench-cushion: body
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
| @envelope | bench-cushion | * | bounds | -0.54..0.54 | 0..0.055 | -0.23..0.23 | - |
| @part | bench-cushion | body | curved | -0.54..0.54 | 0..0.055 | -0.23..0.23 | support |
| @envelope | sofa-cushion | * | bounds | -0.24..0.24 | 0..0.16 | -0.21..0.21 | - |
| @part | sofa-cushion | body | curved | -0.24..0.24 | 0..0.16 | -0.21..0.21 | support |
| @envelope | pillow | * | bounds | -0.34..0.34 | 0..0.14 | -0.215..0.215 | - |
| @part | pillow | body | curved | -0.34..0.34 | 0..0.14 | -0.215..0.215 | support |
| @envelope | blanket | * | bounds | -0.7..0.7 | 0..0.045 | -0.9..0.9 | - |
| @part | blanket | body | curved | -0.7..0.7 | 0..0.045 | -0.9..0.9 | support |
| @envelope | bedding-set | * | bounds | -0.275..0.275 | 0..0.16 | -0.21..0.21 | - |
| @part | bedding-set | body | curved | -0.275..0.275 | 0..0.16 | -0.21..0.21 | support |
| @envelope | folded-sheet | * | bounds | -0.21..0.21 | 0..0.09 | -0.165..0.165 | - |
| @part | folded-sheet | body | box | -0.21..0.21 | 0..0.09 | -0.165..0.165 | support |
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
@address-state bench-cushion: body
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

ref03의 조리면 위 상부장 하단에 얇은 금속 배기 후드를 둔다. 상부장 밑면 접합 중심이 원점이고 +X는 조리대 폭, −Y는 아래쪽 필터 면, +Z는 사용자가 서는 쪽이다. 벽 조리대·쿡탑과 후드의 world 정렬은 instances가 결정한다. 환기량·배관·소음 성능은 `unverified`다.

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

@material-face shoe: body/sole

`personal-articles`는 신발 한 짝, 걸린 코트와 일상 옷 한 벌, 옷걸이, 닫힌 우산과 우산꽂이를 독립 물체로 둔다. 신발 두 짝은 두 instance이고 옷 여덟 벌도 여덟 instance다. 신발·우산·꽂이는 바닥 접촉 중심이 원점이고, 코트·옷·옷걸이는 상부 걸림점이 y=0인 원점에서 −Y로 아래로 뻗는다. 후속 instances가 이 걸림점을 실제 옷장 봉에 맞춘다. 모두 +Z가 전면이다. 신발의 굽·발등·앞코는 닫힌 단일 `body/sole/upper/toe`의 서로 다른 face, 옷과 우산은 접힌 외형의 `body/front/back/edge` face다. 옷걸이의 고리와 어깨는 같은 연속 부품의 `body/hook/shoulder`로 구별하고 우산꽂이는 열린 `body/outer/inner/rim/sole`의 두께 있는 통이다.

신발은 W 폭의 닫힌 밑창을 전 Z 길이로 잇고 뒤쪽 1/3에서 최대 H, 앞코에서 H/2로 내려가는 두 단면을 이어 빈 발목 구멍을 뒤 상부에 낸다. 의복 두 상태는 두께 D의 닫힌 전·후판으로, 어깨 폭 W에서 허리 폭 0.7W로 좁아지는 몸판과 양쪽 소매를 연속 접합한다. 옷걸이는 양 끝 x=±W/2에서 중심 갈고리로 올라가는 가는 삼각 어깨, 우산은 H 방향 접힌 원뿔과 위쪽 손잡이의 연속 실루엣이다. 우산꽂이는 바깥 반폭 W/2에서 벽 두께 W/18을 빼고 상부를 열되 바닥 두께 H/18을 남긴다. 모든 열린 둘레에는 안팎 벽과 rim의 닫힌 두께를 내며, 접합 전에 표의 AABB를 넘는 장식은 추가하지 않는다.

각 상태의 정확한 점유는 아래 표가 소유한다. 신발 밑창, 옷의 앞뒤, 옷걸이 고리, 우산 고리와 우산꽂이 안쪽은 각 상태에서 실제로 존재하는 face만 발행한다.

ref02 침실과 현관 수납 기능 및 ref04 작업실의 절제된 생활 밀도를 바탕으로 정면·측면·45°에서 신발·의복·우산 실루엣을 판별한다. ref01·03·05의 보이지 않는 브랜드는 만들지 않는다. 실제 착용·젖은 우산 배수는 `unverified`다.

@bore umbrella-stand: body, 0.115, 0.031..0.55

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
| @part | coat | body | curved | -0.31..0.31 | -1.12..0 | -0.075..0.075 | suspension |
| @envelope | garment | * | bounds | -0.24..0.24 | -0.72..0 | -0.055..0.055 | - |
| @part | garment | body | curved | -0.24..0.24 | -0.72..0 | -0.055..0.055 | suspension |
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

`dining-wares`는 기존 그릇·컵과 별도로 접시, 포크, 숟가락, 식사용 칼, 물병, 꽃병을 같은 식사 소품 계열의 명시 변종으로 소유한다. 원점은 식탁에 닿는 면의 중심이고 +Z는 손잡이 또는 사용자가 향하는 쪽이다. 접시는 열린 얕은 접시의 `body/upper/underside/rim`, 병은 닫힌 바닥과 열린 목의 `body/outer/inner/rim/sole`, 금속 식기는 일체형 두께를 가진 `body/grip/head/edge/underside`로 나눈다. 서빙 볼은 기존 `tabletop-props/bowl`을 재사용한다.

접시는 상부 바깥 반지름 W/2와 `@bore`가 정한 안쪽 개구·바닥 반지름 사이를 얕은 환형 벽으로 잇고 높이 H에서 rim을 닫는다. 물병은 `@cavity-profile`이 정한 바닥·몸통·어깨·목의 안팎 단면을 잇는 열린 회전체다. 꽃병은 폭 W의 열린 원통이며 `@bore`의 반지름과 바닥 높이를 따른다. 포크는 Z 길이 D의 손잡이와 앞쪽 D/4에 네 이빨의 빈 틈 셋, 숟가락은 앞쪽 D/3의 오목한 타원 머리, 칼은 앞쪽 D/2의 한쪽 날 실루엣을 가진 닫힌 얇은 판이다. 폭·두께는 표의 W·H를 끝까지 사용하고 끝단의 날은 0두께가 아닌 H/4로 닫는다. 식기 간 독립 경계가 식탁 거리에서 사라질 수 있는 것은 proxy 한계이며 그 경우 상부 중립 view에서만 개수를 검증한다.

각 상태의 정확한 점유는 아래 표가 소유한다. 접시의 윗면과 바닥, 병의 안팎, 금속 식기의 잡는 부분과 머리는 각 형상의 가시·비가시 삼각형을 함께 분할한다.

ref02와 ref03의 여섯 자리 식탁에 여섯 세트가 서로 독립해 놓이는 규모를 채택한다. 정면·상부·45°에서 접시의 낮은 개구, 식기 끝, 병 목이 구별되어야 한다. ref01·04·05는 식기 세부를 제공하지 않는다. 식품 안전·급수는 `unverified`다.

@bore plate: body, 0.11, 0.008..0.032
@cavity-profile water-bottle: body, round, 12, 2/3, 18, 0.011
@bore flower-vase: body, 0.061, 0.025..0.3

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

`kitchen-smallwares`는 냄비, 팬, 도마, 칼 블록, 조리 도구통, 조리 도구, 주전자, 토스터, 커피 기구, 식기 건조대와 유리 보관병을 같은 주방 소형 물체 모집단으로 둔다. 원점은 조리대 접촉 중심이고 +Z가 손잡이 또는 조작 면이다. 팬과 냄비는 독립 `body/inner/outer/base/rim`, 보관병·주전자·커피 기구는 `body/outer/inner/neck/sole`, 도마와 토스터는 `body/top/side/underside`를 쓴다. 손잡이나 투입구는 본체 실루엣의 일부로 형성하되 part 주소를 중복하지 않는다.

`pot`, `pan`, `utensil-crock`, `glass-jar`의 용기 몸통은 X 폭 W의 24각 회전체이고 열린 입구와 닫힌 바닥의 정확한 내벽 반지름·바닥 높이는 각 `@bore`가 소유한다. 팬의 +Z 손잡이는 몸통 뒤 경계부터 표의 전방 D/2까지 폭 W/9로 뻗고, 냄비는 양측 폭 W/8의 짧은 귀를 외곽 W 안에 넣는다. `kettle`과 `coffee-brewer`는 `@cavity-profile`이 정한 몸통 속 빈 공간과 좁아지는 어깨·목을 24각 단면으로 잇는다. 주둥이는 몸통 중심 Z에서 전체 점유의 +Z 경계까지 +Z축 원통으로 붙인다. 중심 높이는 `@vessel-attachments`의 spoutY×H, 통로 반지름은 channel×목 안반지름, 바깥 반지름은 통로 반지름에 profile의 벽 두께를 더한 값이다. 원통을 몸통과 합친 뒤 같은 축의 안쪽 통로를 몸통 공동까지 절삭해 양쪽이 실제로 통하게 하며 출구 둘레를 두께 있는 rim으로 닫는다. 손잡이 고리는 profile의 어깨에서 상단으로 줄어드는 바깥 반지름을 R(y), 몸통 반지름을 R이라고 할 때 +X 쪽 x=R(y)−벽 두께/2..R, y=gripY×H, z=몸통 중심 Z±gripZ×W의 판을 몸통과 합친 뒤 x=holeX×R, y=holeY×H, 같은 Z 두께 전체를 관통 절삭한다. gripY·gripZ·holeX·holeY는 `@vessel-attachments`가 소유한다. 판의 안쪽 끝이 몸통 외벽과 유한 부피로 겹치고 손잡이 구멍은 몸통 공동·주둥이 통로를 덮지 않는다. 도마·칼 블록·토스터는 표의 박스 점유를 쓰되 도마 손잡이 구멍, 블록 상면 슬롯, 토스터 상면 슬롯을 두께를 남기는 절삭으로 낸다. `utensil`은 긴 막대와 넓은 끝, 건조대는 바닥 받침과 동일 간격의 다섯 세로 슬롯이 연결된 한 부품이다. 각각의 슬롯·구멍과 손잡이 아래 빈 공간이 상부·측면 view에서 보여야 하며 실제 도구 분리는 하지 않는다.

각 상태의 정확한 점유는 아래 표가 소유한다. 열린 용기는 안쪽·바깥쪽·림·바닥을 닫힌 두께로 구분하고, 가전 외함은 슬롯의 안쪽 벽까지 face 주소에 포함한다.

ref03의 주방 조리대·섬 위에서 작은 도구가 가전과 겹쳐 보이지 않는지 상부·정면·45°에서 확인한다. ref02는 주방 기능의 범위를 보여 주며 ref01·04·05는 도구 제품 형상을 특정하지 않는다. 조리·전기·열 성능은 `unverified`다.

@bore pot: body, 0.124, 0.014..0.17
@bore pan: body, 0.13, 0.012..0.095
@bore utensil-crock: body, 0.057, 0.016..0.19
@cavity-profile kettle: body, round, 12, 2/3, 18, 0.024
@cavity-profile coffee-brewer: body, round, 12, 2/3, 18, 0.027
@vessel-attachments kettle,coffee-brewer: body, 3/4, 1/2, 3/4..19/20, 4/5..9/10, 4/5..9/10, 1/20
@bore glass-jar: body, 0.048, 0.016..0.19

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
| @envelope | pot | * | bounds | -0.14..0.14 | 0..0.17 | -0.155..0.155 | - |
| @part | pot | body | hollow | -0.14..0.14 | 0..0.17 | -0.155..0.155 | support |
| @envelope | pan | * | bounds | -0.15..0.15 | 0..0.095 | -0.24..0.24 | - |
| @part | pan | body | hollow | -0.15..0.15 | 0..0.095 | -0.24..0.24 | support |
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

`bath-accessories`는 비누 용기, 휴지 걸이, 휴지 한 롤과 묶음, 칫솔 컵, 칫솔, 샴푸 병, 세제 병, 욕실 휴지통, 빨래 바구니를 공통 욕실·세탁 소품의 치수 상태로 둔다. 바닥·선반 물체의 원점은 놓이는 면 중심이고 휴지 걸이의 원점은 벽 접촉면의 아래 중심이다. +Z는 사용자가 바라보는 전면이다. 걸이는 벽 접촉 `body/back/arm`, 컵·바구니는 `body/outer/inner/rim/sole`, 막힌 병은 `body/outer/inner/rim/sole/cap-top/cap-side`와 비누 용기만의 `body/pump-top`, 소모품은 `body/outer/end/sole`을 사용한다. 실제 충전물·배관·배출은 별도 system과 instance가 결정한다.

컵·휴지통·바구니는 폭 W와 깊이 D의 둥근 사각 또는 원형 외벽에서 벽 두께 min(W,D)/18을 빼고 상부를 열며 바닥 두께 H/12를 남긴다. 병 세 상태는 `@cavity-profile`이 정한 넓은 몸통 내부에서 어깨를 거쳐 좁은 목으로 이어지고, `@vessel-closure`의 캡이 그 목을 선언 높이 안에서 막는다. 비누 용기의 펌프는 캡 상면의 별도 face로, 두 병의 뚜껑은 캡 둘레 face로 구분하되 액체·펌프 작동은 만들지 않는다. 휴지 롤은 바깥 반지름 W/2, 안쪽 반지름 W/8의 Y축 관통 고리이고 묶음은 두 롤씩 쌓인 외곽을 한 덩어리의 네 원형 끝 face로 구별한다. 걸이는 벽쪽 판과 두 팔의 아래 빈 공간, 칫솔은 가는 손잡이와 윗부분 짧은 머리의 연속 판이다. 롤을 벽걸이에 끼우는 회전은 instances가 소유한다. 열린 컵·휴지통·바구니의 안쪽은 실제로 열리고 닫힌 바닥에서 끝나며, 막힌 병은 캡 아래 공동을 불투명 덩어리로 채우지 않는다.

각 상태의 정확한 점유는 아래 표가 소유한다. 용기 안팎·림·바닥, 걸이 뒷판·팔, 휴지 롤의 관통 구멍은 각각 실제 형상에 있는 face 집합으로만 발행한다.

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
@void laundry-basket: body, -0.22..0.22, 0.023..0.4, -0.155..0.155

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

`household-boxes`는 파일 상자, 장난감 상자, 보관 상자, 재활용 상자, 택배 보관함을 규격이 다른 닫힌 또는 위가 열린 용기 상태로 만든다. 원점은 바닥 접촉 중심이고 +Z가 뚜껑을 여는 쪽이다. 닫힌 상자의 덮개 이음은 독립 face이며 위가 열린 상자의 안팎 벽과 바닥은 하나의 두께 있는 `body/inner/outer/rim/sole`다. 같은 형상은 폭·높이·깊이만 바꿔 재사용하며 방마다 새 메시 결정을 하지 않는다.

`file-box`, `toy-box`, `recycling-box`는 표의 바깥 W×H×D에서 벽 두께 min(W,D)/24와 바닥 두께 H/18을 빼고 상부를 열어 실내가 보이는 중공 상자다. `storage-box`와 `parcel-locker`는 같은 벽 두께의 닫힌 외함이며 상면 1/12H를 뚜껑 face로, 전면 중앙 1/5W를 손잡이 face로 분리한다. 잠금장치·힌지·움직이는 덮개는 형상으로 약속하지 않으며, 네 view에서 열린 상자와 닫힌 상자 및 빈 보관 공간을 구별한다.

각 상태의 정확한 점유는 아래 표가 소유한다. 열린 상자는 안팎·림·바닥, 닫힌 상자는 외벽·이음·손잡이·밑면으로 나누고 독립하지 않는 면을 억지로 발행하지 않는다.

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

@material-face spare-light: body/diffuser

`household-tools`는 공구 상자, 청소기, 접이식 사다리, 청소 도구, 여분 등기구, 기계 외함, 정원 도구와 호스 릴의 상태별 고정 형상이다. 원점은 바닥 또는 선반 접촉 중심이고 +Z가 취급 방향이다. 사다리는 접힌 검사 상태, 호스는 릴에 감긴 검사 상태만 제공한다. `body/front/back/edge/sole`와 필요할 때 `body/handle/contact`를 안정 face로 둔다. 실제 회전·가동·전기 연결은 이 모델 단계에 포함하지 않는다.

공구 상자와 기계 외함은 표의 닫힌 박스이며 앞면 중앙 손잡이·점검 패널을 별도 face로 분리한다. 청소기와 두 길쭉한 도구는 바닥 몸통과 전체 H까지 올라가는 손잡이가 끊기지 않는 곡면이다. 접힌 사다리는 폭 W 양쪽 레일과 H/5 간격의 가로대 다섯 개가 이루는 닫힌 연결망으로, 레일 사이가 비어 있어야 한다. 여분 등기구는 24각 원통의 막힌 바닥과 드러난 앞 `body/diffuser` face다. 호스 릴은 외경 W의 두 원형 측판을 깊이 D 양쪽에 두고 중심 원통과 감긴 외측 고리를 이어 가운데 구멍을 보인다. 실루엣이 막힌 판으로 보이면 해당 state는 실패다.

각 상태의 정확한 점유는 아래 표가 소유한다. 도구의 손잡이·기능 면·접지 면은 상태별 실제 표면에 따라 나누며 사다리와 호스 릴의 빈 공간을 덮는 허구의 face는 만들지 않는다.

ref02의 저장실·서비스실과 ref01의 정원에서 빈 창고가 되지 않도록 정면·측면·45°의 크기와 개별 실루엣을 확인한다. ref03·04·05의 보이지 않는 공구 세부를 추정하지 않는다. 청소·기계·전기 성능은 `unverified`다.

@inventory tool-box: body
@inventory vacuum: body
@inventory folded-ladder: body
@inventory cleaning-tool: body
@inventory spare-light: body
@inventory machine-case: body
@inventory garden-tool: body
@inventory hose-reel: body

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
| @envelope | machine-case | * | bounds | -0.34..0.34 | 0..1.42 | -0.235..0.235 | - |
| @part | machine-case | body | box | -0.34..0.34 | 0..1.42 | -0.235..0.235 | support |
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
@address-state machine-case: body
@address-state garden-tool: body
@address-state hose-reel: body
<!-- @authored-address-state:end -->

## 현관과 외부 비품 {#exterior-furnishings}

@material-face garden-light: body/diffuser
@material-face bicycle: body/wheel

`exterior-furnishings`는 우편함, 외부 벤치·의자·탁자, 정원 조명, 빗물통, 자전거 거치대·자전거·실외 쓰레기통을 실내 가구와 구별되는 외부형 상태로 둔다. 원점은 지면 접촉 중심이고 +Z가 진입로를 향한다. 우편함과 빗물통의 개구, 자전거의 두 바퀴와 프레임, 외부 좌석의 상·하부 틈은 하나의 `body` 안에서 닫힌 절삭 형상으로 만든다. 주소는 `body/front/back/side/top/sole`이며 자전거는 `body/wheel/front-frame/rear-frame`을 추가한다.

우편함은 폭 W의 상부 투입 틈과 앞면 분할선을 가진 중공 상자, 빗물통은 두께 W/24의 열린 원통이며 아래 H/18은 닫힌 바닥이다. 벤치와 의자는 상면 y=0.55H의 좌판, 뒷면 높이 H의 등판, 네 모서리 다리가 일체 연결된 형상이고 다리 사이·좌판 아래는 빈 공간이다. 외부 탁자는 높이 H의 얇은 상판과 네 다리가 연결된다. 정원 조명은 24각 기둥과 상단 H/8 길이의 `body/diffuser` face다. 자전거 거치대는 표 폭 W의 뒤집힌 U형 원형봉으로 중앙이 열려 있다. 실외 쓰레기통은 상부가 열린 두께 있는 중공 몸통과 닫힌 밑면을 갖고, 두 실내 휴지통보다 큰 상태 치수를 쓴다. 자전거는 X 방향으로 바퀴 둘을 놓되 중심·안장 좌표는 아래 `@axis-control`을 단일 기준으로 삼는다. 바퀴 외반경은 차축의 지면 높이와 같아 접지하고 Z 방향 두께는 아래 바퀴 반두께 기준의 두 배다. 앞·뒤 바퀴 원의 위쪽을 프레임 삼각망으로 잇고 핸들 상단은 표의 최고 Y, 양쪽 Z 폭의 극단은 핸들에서만 나온다. 두 바퀴·프레임 사이의 공기가 정면과 45°에서 보이지 않으면 자전거 proxy는 실패다.

각 상태의 정확한 점유는 아래 표가 소유한다. 우편함 틈, 가구 하부, 거치대 안쪽과 자전거 바퀴 안쪽의 빈 공간을 덮는 면은 발행하지 않는다.

ref01의 거리·진입 계단과 ref02의 작은 외부 정원에 비례하도록 정면·측면·45°에서 읽힘을 확인한다. ref03·04·05는 외부 기물의 상세 치수를 주지 않는다. 내후성·자전거 주행·빗물 저장량은 `unverified`다.

@void mailbox: body, -0.16..0.16, 0.05..0.45, -0.09..0.09
@void mailbox: body, -0.15..0.15, 0.45..0.48, -0.015..0.015
@bore rain-barrel: body, 0.293, 0.051..0.91
@bore outdoor-waste-bin: body, 0.18, 0.036..0.65

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

@material-face entry-mirror: body/front
@material-face wall-sconce: body/diffuser

`wall-accessories`는 독립 벽거울·벽등·현관 코트 걸이를 고정점 기준 상태로 둔다. 거울은 판 두께와 둘레 프레임을 하나의 닫힌 `body/front/back/edge/frame`으로 구분한다. 벽등은 벽쪽 받침, 팔, 발광 갓의 서로 다른 `body/back/arm/diffuser` face를 가진다. 코트 걸이는 `body/back/arm/tip`으로 나누고 두 벌의 독립 의복이 걸리는 두 끝을 가진다. 원점은 뒤쪽 벽 접촉면의 X 중심·Y 하단이고 +Z가 실내 방향이므로 모든 상태에서 뒤쪽 평면이 벽 datum이다.

원점의 Y는 물체 아래선이고 X는 폭 중심이다. 거울은 전체 W×H 판의 바깥 둘레 W/30을 프레임 face로 남기고 앞 평면은 Z 최대보다 D/8 물러난 반사 face다. 벽등은 뒤쪽 원형 접촉판, 전방 D/2까지 나온 팔과 마지막 D/2의 원통형 확산 갓을 일체 연결하며 갓의 아래면을 별도 diffuser face로 둔다. 코트 걸이는 벽 접촉판에서 X 방향 두 갈래 팔을 전방으로 내고 각 끝을 위로 접어 의복이 빠지지 않는 두 걸림 홈을 만든다. 세 상태의 벽 접촉 뒤판은 Z 최소와 같은 평면이며 광량과 의복 배치 높이는 여기서 정하지 않는다.

각 상태의 정확한 점유는 아래 표가 소유한다. 거울에는 프레임·반사판·뒷판·노출 모서리를, 벽등에는 뒷판·팔·확산 갓을, 걸이에는 뒷판·두 팔·걸림 끝을 나누고 벽 접촉면도 주소를 유지한다.

ref01의 현관 온광과 ref05의 복도 실용 조명 규모를 참고해 정면·측면·45°에서 거울, 빛 표면, 두 걸림 끝을 분리한다. ref02의 현관 수납 기능을 코트 걸이의 근거로 삼고 ref03·04에서 보이지 않는 회로와 제품 형상은 만들지 않는다. 조도·배선·실제 의복 하중은 `unverified`다.

@inventory entry-mirror: body
@inventory wall-sconce: body
@inventory coat-hook: body

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | entry-mirror | * | bounds | -0.28..0.28 | 0..1.22 | 0..0.035 | - |
| @part | entry-mirror | body | box | -0.28..0.28 | 0..1.22 | 0..0.035 | wall |
| @envelope | wall-sconce | * | bounds | -0.095..0.095 | 0..0.24 | 0..0.16 | - |
| @part | wall-sconce | body | curved | -0.095..0.095 | 0..0.24 | 0..0.16 | wall |
| @envelope | coat-hook | * | bounds | -0.18..0.18 | 0..0.12 | 0..0.12 | - |
| @part | coat-hook | body | curved | -0.18..0.18 | 0..0.12 | 0..0.12 | wall |

<!-- @authored-address-state:start -->
@address-state entry-mirror: body
@address-state wall-sconce: body
@address-state coat-hook: body
<!-- @authored-address-state:end -->

## 작업실 소형 장치 {#desk-controls}

@material-face personal-device: body/screen

정면·측면·상부·45°의 중립 관찰에서 포인팅 기기의 둥근 윗면과 개인용 기기의 얇은 화면판이 판별되어야 한다.

`desk-controls`는 화면·키보드와 별개인 포인팅 기기와 개인용 소형 기기를 한 작업대에서 재사용하는 두 고정 변종이다. 상판 접촉 중심이 원점이고 +Z가 사용자를 향한다. 포인팅 기기는 닫힌 손바닥형 `body/upper/side/sole`, 개인용 기기는 얇은 닫힌 판의 `body/screen/edge/back`을 독립 주소로 둔다. 충전 상태·입력 동작은 형상에 새 part를 만들지 않는다.

포인팅 기기는 W×D의 밑면에서 중앙 최고점 H로 올라가는 반타원 윗면과 닫힌 바닥이며 전방 1/3의 두 클릭 face를 폭 방향으로 분리한다. 개인용 기기는 두께 H의 판에서 바깥 폭 W/20의 bezel을 남기고 윗면 중앙을 screen face로 구분한다. 두 기기 모두 화면 내용·문자·버튼 신호는 구현하지 않는다.

두 상태의 정확한 점유는 아래 표가 소유한다. 포인팅 기기는 윗면·클릭 면·옆면·밑면을, 개인용 기기는 화면·베젤·뒷면·노출 모서리를 분할한다.

ref04의 책상 앞 소형 기기 밀도를 따르고 ref02의 개인 침실 책상에도 같은 prototype을 쓴다. ref01·03·05에서 보이지 않는 제조사 표시는 만들지 않는다. 전자 입력·충전 성능은 `unverified`다.

@inventory pointing-device: body
@inventory personal-device: body

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | pointing-device | * | bounds | -0.0325..0.0325 | 0..0.035 | -0.055..0.055 | - |
| @part | pointing-device | body | curved | -0.0325..0.0325 | 0..0.035 | -0.055..0.055 | support |
| @envelope | personal-device | * | bounds | -0.08..0.08 | 0..0.012 | -0.0375..0.0375 | - |
| @part | personal-device | body | box | -0.08..0.08 | 0..0.012 | -0.0375..0.0375 | support |

<!-- @authored-address-state:start -->
@address-state pointing-device: body
@address-state personal-device: body
<!-- @authored-address-state:end -->

## 주방 상부장 밑면 선형등 {#under-cabinet-light}

ref03의 조리대 위 상부장 밑에 보이는 연속 광띠를 한 개의 독립 등기구로 둔다. local 원점은 상부장 밑면의 접합 중심이고 +X는 광띠의 길이, −Y는 조리대 방향, +Z는 실내 쪽이다. 표가 소유하는 낮은 직육면체이며 밑면의 `body/diffuser`와 나머지 `body/housing`, 양 끝 `body/end`를 분리해 주소를 준다. 실제 전기 연결과 빛의 퍼짐은 systems에서 확인하며 이 설계만으로는 `unverified`다.

`underside`는 상부장 밑면 y=0의 접합 평면이다. 전체 x 상면이 그 평면에 닿아야 하고 상부장 실체와의 면적·가림은 instances에서 검증한다. ref03의 간접 빛을 기준으로 밑면과 45°에서 연속 확산면, 끝 마개 및 상부장 접합을 확인한다.

@material-face default: body/diffuser
@inventory default: body

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | default | * | bounds | -0.8..0.8 | -0.03..0 | -0.025..0.025 | - |
| @part | default | body | box | -0.8..0.8 | -0.03..0 | -0.025..0.025 | underside |

<!-- @authored-address-state:start -->
@address-state default: body
<!-- @authored-address-state:end -->
