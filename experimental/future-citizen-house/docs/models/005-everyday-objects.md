# 시민 주택의 생활 사물 모델

[공통 단위·주소·관찰](000-representation.md#model-address-and-scale)을 따른다. 방별 독립 물체를 세는 작업 목록은 `.wiki/사물-목록.md`에 있으며 이 문서는 종류별 재사용 형상만 정한다. 아래 변종은 `state`로 판별하고 같은 state는 동일한 부품과 치수를 낸다. 각 표의 수치는 m 단위의 국소 점유다. 이 설계는 재료의 실제 결합·방별 배치·작동 구현을 주장하지 않는다.

## 직물과 출입 매트 {#household-textiles}

`household-textiles`는 벤치 쿠션, 소파 쿠션, 베개, 담요, 여분 침구 세트, 접힌 시트, 식탁 매트, 행주, 욕실 매트와 실내외 출입 매트를 직물과 고무의 치수·표면 상태 변종으로 만든다. 각 상태는 하나의 닫힌 몸체이며 침대 매트리스나 소파 본체에 합치지 않는다. 표의 원점은 놓이는 면의 중심이고 +Z는 물체를 보는 앞이다. 테두리 봉제선은 `body/edge`, 노출 윗면은 `body/upper`, 받침면은 `body/sole`로 나누며 얇은 매트는 뒷면도 별도 `body/underside`다. 접힌 직물은 위아래 층의 실루엣을 한 부품 안에서 접힌 자국으로 표현하되 풀림 동작은 만들지 않는다.

직물 상태의 W×H×D는 표의 `body` 구간 길이다. `curved` 상태는 반경 min(H/2,W/12,D/12)로 XZ 평면의 네 모서리를 각각 여섯 호 구간으로 둥글리고, Y 단면은 바닥 y=0과 평평한 중앙 상면 y=H를 유지한다. `bench-cushion`, `sofa-cushion`, `pillow`, `dishcloth`에는 별도 crown을 만들지 않는다. `blanket`, `bedding-set`, `folded-sheet`은 상면에서 X 방향으로 뻗는 중앙 z=0의 V형 접힘 홈 하나를 낸다. 홈의 양쪽 경계는 z=±D/24, 바닥은 y=H−H/8, 단면은 두 직선이며 홈 바닥 아래 몸체는 연속 고체다. `bedding-set`의 지정 수납칸은 상층 수납실의 `cabinet-and-shelf/open-shelf/1100x2600x500/open` 선반 한 칸이며 여분 침구의 0.55×0.16×0.42m 점유를 그 안에서 instances가 대조한다. `box` 상태는 표 AABB를 채운 평평한 판이다. `outdoor-mat`만 상면에 X·Z 양 방향 격자 홈을 낸다. X축에서 W/8, Z축에서 D/8 간격의 홈 중심을 반복하고 폭은 D/100, 깊이는 H/7이며 가장자리에서 한 홈 폭 안쪽은 절삭하지 않는다. 홈 바닥과 몸체 밑면 사이의 양수 두께를 유지한다. 네 중립 관찰에서 접힘 홈·봉제 edge·빈 주변 면을 판독한다.

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

ref03의 조리면 위 상부장 하단에 얇은 금속 배기 후드를 둔다. 벽의 안쪽 평면과 상부장 밑면이 만나는 선의 폭 중심이 원점이고 +X는 조리대 폭, −Y는 아래쪽 필터 면, +Z는 사용자가 서는 쪽이다. `body`의 뒤쪽 z=−0.24는 벽에 닿고 상면 y=0의 z=−3D/8..D/4 구간만 상부장 밑면에 닿는다. 나머지 앞쪽 D/4..D/2는 상부장 접합 범위 바깥의 후드다. 벽 조리대·쿡탑과 후드의 world 정렬은 instances가 결정한다. 환기량·배관·소음 성능은 `unverified`다.

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

`shoe`의 밑창은 XZ 전폭·전깊이와 y=0..H/8을 채운다. 윗몸체는 뒤 z=−D/2에서 y=H/8..H, 앞 z=D/2에서 y=H/8..H/2를 잇는 X 전폭의 닫힌 경사 쐐기다. 발목 개구는 중심 (x=0,z=−D/4), X 반경 W/4·Z 반경 D/8의 타원이며 y=H/2부터 윗면까지 절삭해 H/8 이상의 밑창을 남긴다. `coat`와 `garment`는 XY 윤곽을 Z=±D/2 사이에 압출한다. 윤곽은 양쪽 대칭이며 어깨 (±W/2,−H/8), 소매 끝 (±W/2,−H/2), 겨드랑이 (±3W/8,−H/2), 허리 (±7W/20,−3H/4), 밑단 (±7W/20,−H), 목 중심 (0,−H/16)을 이 순서로 연결한다. 허리 폭은 어깨 폭의 0.7배다. 몸판과 소매는 한 연속 고체이고 걸림점은 목 위의 x=±W/24, y=−H/16..0, z=±D/4인 닫힌 걸림 탭이며 상면에 유한 접촉판을 가진다. `hanger`는 X 폭 W의 어깨 두 선분을 (−W/2,−H/2),(0,−H/4),(W/2,−H/2)로 잇고 각 선분은 XY 평면에서 W/40 폭, Z 전깊이 D를 가진다. 중앙 갈고리는 중심 (0,−H/8), 반지름 H/8의 XY 반원이며 관 단면 지름 W/40이고 상단의 y=0 접촉 평면은 X 폭 W/20·Z 깊이 D다. 옷장에 걸 때 옷·옷걸이 둘 다 Y축으로 90° 돌려 폭 W를 옷장 깊이 방향으로, 두께 D를 봉 길이 방향으로 둔다. `umbrella`는 y=0..H/16의 XZ 직사각형 접지판과 y=H/16..7H/8의 24각 원뿔대, y=7H/8..H의 24각 손잡이를 합친다. 접지판은 X/Z 각각 W/2 폭이며 원뿔대 반지름은 아래 W/8, 위 W/2, 손잡이 반지름 W/6이다. 이 판의 밑면 전체가 지면과 유한 면으로 접한다. `umbrella-stand`의 원형 외벽·개구와 바닥은 아래 `@bore`의 반지름·Y 구간이 단일 소유자다. 모든 열린 둘레에는 안팎 벽과 rim의 닫힌 두께를 내며 표의 AABB를 넘는 장식은 추가하지 않는다.

각 상태의 정확한 점유는 아래 표가 소유한다. 신발 밑창, 옷의 앞뒤, 옷걸이 고리, 우산 고리와 우산꽂이 안쪽은 각 상태에서 실제로 존재하는 face만 발행한다.

ref02 침실과 현관 수납 기능 및 ref04 작업실의 절제된 생활 밀도를 바탕으로 정면·측면·45°에서 신발·의복·우산 실루엣을 판별한다. ref01·03·05의 보이지 않는 브랜드는 만들지 않는다. 실제 착용·젖은 우산 배수는 `unverified`다.

@bore umbrella-stand: body, 0.115, 0.031..0.55

@scalar-control garment-waist-width-ratio: 0.7

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

접시는 상부 바깥 반지름 W/2와 `@bore`가 정한 안쪽 개구·바닥 반지름 사이를 얕은 환형 벽으로 잇고 높이 H에서 rim을 닫는다. 물병은 `@cavity-profile`의 바닥·몸통·어깨·목 단면을 잇는 열린 회전체이고 꽃병은 `@bore`에 적힌 개구와 바닥을 가진 24각 원통이다. 포크는 z=−D/2..D/4의 X 폭 W/2·Y 두께 H/2 손잡이와 z=D/4..D/2의 X 전폭·Y 두께 H/2 머리를 한 고체로 합친다. 머리의 X 폭을 7등분하여 두 번째·네 번째·여섯 번째 칸을 z=3D/8..D/2에서 관통 절삭하면 같은 폭의 네 이빨과 세 틈이 남는다. 숟가락은 z=−D/2..D/6의 X 폭 W/3·Y 두께 H/2 손잡이와 중심 z=D/3, X 반경 W/2·Z 반경 D/6의 24각 타원 머리를 합친다. 머리 윗면은 같은 중심의 X 반경 W/3·Z 반경 D/9, 깊이 H/3의 타원형으로 절삭하며 바닥에 H/6을 남긴다. 칼은 z=−D/2..0의 X 폭 W/2 손잡이와 z=0..D/2의 X 폭 W 날을 합친다. 날은 +X 모서리에서 두께 H/4, 나머지는 H/2인 선형 단면으로 닫는다. 세 식기의 밑면은 y=0의 양수 면적 접지면이다. 식기 간 독립 경계가 식탁 거리에서 사라지는 경우 상부 중립 view에서 개수를 확인한다.

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

`pot`, `pan`, `utensil-crock`, `glass-jar`의 몸통은 X 폭 W의 24각 Y축 회전체이고 열린 입구·바닥은 각 `@bore`의 반지름과 Y 구간을 따른다. `pot` 몸통 중심은 z=0, 바깥 반지름 W/2이고 양쪽 귀는 x=±(W/2−W/8)..±W/2, y=H/2..H/2+H/12, z=±W/8의 닫힌 직육면체를 몸통에 합친다. `pan` 몸통 중심 Z는 0이고 바깥 반지름 W/2다. +Z 손잡이는 z=7W/16..표의 +Z 경계, x=±W/18, y=H/2..3H/4의 닫힌 직육면체로서 몸통과 양수 부피로 겹친다. `kettle`과 `coffee-brewer`는 `@cavity-profile`의 몸통·어깨·목을 24각 단면으로 잇는다. 주둥이는 몸통 중심 Z에서 +Z 경계까지 +Z축 원통으로 붙이며 중심 높이·통로·외벽 두께는 `@vessel-attachments`와 profile에서 계산한다. 원통을 몸통과 합친 뒤 통로를 공동까지 절삭하고 출구 둘레를 rim으로 닫는다. 손잡이 고리는 profile의 높이별 바깥 반지름 R(y)의 +X쪽에서 x=R(y)−벽 두께/2..R, y=gripY×H, z=몸통 중심 Z±gripZ×W인 판을 합친 뒤 지정 holeX·holeY 사각형을 Z 관통 절삭한다. `cutting-board`는 표의 XZ 판 전폭, y=0..H를 채우고 +Z 끝 중심의 X 폭 W/4·Z 길이 D/8 구멍을 전 두께 절삭한다. `knife-block`은 표의 닫힌 상자 윗면에 X 중심을 −W/3,0,+W/3으로 둔 세 슬롯을 낸다. 각 슬롯의 X 폭은 W/10, Z 길이는 D/2, 깊이는 H/8이며 상자 바닥은 그대로 닫힌다. `toaster`는 같은 방법으로 X 중심 ±W/4의 슬롯 둘을 폭 W/8, Z 길이 D/2, 깊이 H/6으로 낸다. `utensil`은 z=−D/2..D/4의 X 폭 W/3·Y 두께 H/2 막대와 z=D/4..D/2의 X 전폭·Y 전높이 머리를 합친 닫힌 단일 고체다. `drying-rack`은 XZ 전폭의 y=0..H/8 받침과 X 중심 x=(j−5/2)W/7, j=0..5의 여섯 세로 rib를 합친다. 각 rib는 X 폭 W/40, y=H/8..H, Z 전깊이여서 사이에 같은 간격의 다섯 빈 슬롯이 생긴다. 절삭 안쪽 벽과 아래면도 face로 발행한다.

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

`bath-accessories`는 비누 용기, 휴지 걸이, 휴지 한 롤과 묶음, 칫솔 컵, 칫솔, 샴푸 병, 세제 병, 욕실 휴지통, 빨래 바구니를 공통 욕실·세탁 소품의 치수 상태로 둔다. 바닥·선반 물체의 원점은 놓이는 면 중심이고 휴지 걸이의 원점은 벽 접촉면의 아래 중심이다. +Z는 사용자가 바라보는 전면이다. 걸이는 벽 접촉 `body/back/arm`, 컵·바구니는 `body/outer/inner/rim/sole`, 막힌 병은 `body/outer/inner/rim/sole/cap-top/cap-side`와 비누 용기만의 `body/pump-top`, 소모품은 `body/outer/end/sole`을 사용한다. 실제 충전물·배관·배출은 별도 system과 instance가 결정한다.

`toothbrush-cup`과 `waste-bin`은 24각 원형 외벽, `laundry-basket`은 네모 외벽이다. 각각의 내벽·바닥 높이는 바로 아래 `@bore` 또는 `@void`가 단독으로 정한다. 병 세 상태는 `@cavity-profile`의 몸통·어깨·목과 `@vessel-closure`의 캡으로 닫는다. 비누 용기의 펌프는 캡 상면의 중심 XZ 폭을 각각 몸통 W/4·D/4로 나눈 `body/pump-top` face이며 추가 돌출 체적은 없다. 휴지 롤은 `@radial`의 바깥·안쪽 반지름과 `@bore`의 Y 범위를 쓰는 24각 Y축 고리다. `tissue-pack`은 Z축 원통 넷을 한 닫힌 외곽으로 합친다. 각 원통의 반지름은 min(W,H)/4, Z 길이는 D, 중심은 x=±(W/2−min(W,H)/4)와 y=H/4,3H/4의 네 조합이며 끝면은 네 개의 구별된 face다. `tissue-holder`는 x=±W/2, y=0..H, z=0..D/6인 벽판과 중심 x=±(W/2−W/8), y=3H/4의 두 팔을 합친다. 팔은 Y/Z 단면 지름 H/8의 24각 봉으로 z=D/6..D까지 이어지고, 두 팔 사이 X축 축은 y=3H/4,z=3D/4, 반지름 H/16으로 면 접합한다. `toothbrush`는 x=±W/4, z=±D/4, y=0..3H/4의 손잡이 판과 X/Z 전폭, y=3H/4..H의 짧은 머리를 한 고체로 합친다. 롤을 걸이에 끼우는 회전은 instances가 소유하며 실제 위생·급수 성능은 `unverified`다.

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
@void laundry-basket: body, -0.22..0.22, 0.033..0.4, -0.155..0.155

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

`file-box`, `toy-box`, `recycling-box`의 열린 공동은 바로 아래 각 `@void`가 정하는 X/Y/Z 구간을 표의 닫힌 박스에서 절삭한다. 따로 적은 벽·바닥 비율은 없으며 절삭 뒤 남는 두께가 실제 설계값이다. `storage-box`와 `parcel-locker`는 표 AABB를 채운 닫힌 단일 고체 proxy다. 상면의 y=H−H/12..H 띠를 `body/lid-seam` face로, 전면 z=D/2에서 x=±W/10,y=5H/12..7H/12의 직사각형을 `body/handle` face로 구분한다. 뚜껑과 손잡이는 표면 구획이고 공동·돌출·힌지·잠금장치는 만들지 않는다. 상자 다섯 상태의 독립 외곽과 열린 세 상태의 빈 내부를 네 view에서 확인한다.

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

`tool-box`와 `machine-case`는 표 AABB를 채운 단일 박스 proxy이며 전면 z=D/2의 중앙 x=±W/10,y=9H/20..11H/20만 손잡이·점검 face로 구획한다. `vacuum`은 y=0..H/4의 X/Z 전폭 몸통과 중심 x=z=0, 반지름 min(W,D)/12, y=H/4..H의 24각 수직 손잡이를 합친다. `cleaning-tool`과 `garden-tool`은 y=0..H/10의 X/Z 전폭 머리와 중심 x=z=0, 반지름 min(W,D)/8, y=H/10..H의 24각 수직 손잡이를 합친다. `folded-ladder`는 X 양쪽에 중심 x=±(W/2−W/20), X 폭 W/10·Z 전깊이 D·Y 전높이 H의 닫힌 레일 둘을 두고, y=jH/6, j=1..5의 X 가로대 다섯 개를 합친다. 가로대 Y 두께 W/12, Z 깊이 D/3이고 X 끝은 두 레일의 안쪽 면과 접한다. 양쪽 레일의 바닥은 양수 면적의 평평한 접지다. `spare-light`는 반지름 W/2, 높이 H의 막힌 24각 Y축 원통으로 상단을 `body/diffuser` face로 나눈다. `hose-reel`은 y=0..3H/49의 X 전폭·Z 전깊이 받침판, 중심 y=26H/49인 반지름 W/2의 원형 측판 두 장, 두 측판 사이의 반지름 W/4 중심 통을 하나의 고체로 합친다. 각 측판의 아래에는 x=±W/12, y=3H/49..5H/49, 측판과 같은 Z 구간의 직사각 받침을 합쳐 지면 받침판 윗면과 유한 면으로 닿게 한다. 측판의 Z 두께는 D/15이고 중심은 z=±(D/2−D/30)이며 중심 통은 그 사이를 잇는다. 통 둘레에는 반지름 W/3..5W/12의 환형 감긴 호스를 둔다. 받침판은 측판의 직사각 받침 아래와 유한 접촉면을 이루고 지면과 XZ 전면적에서 닿으며, 통 중심과 호스 고리의 차집합이 가운데 빈 공간이다.

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

`mailbox`는 아래 두 `@void`로 본체 공동과 상부 투입 틈을 절삭한다. 틈의 실제 폭은 둘째 `@void`의 X 구간이며 앞면 분할선은 y=H/2의 face 경계다. `rain-barrel`과 `outdoor-waste-bin`의 원형 안쪽 반지름·바닥 높이는 각 `@bore`가 단독으로 정한다. `outdoor-bench`와 `outdoor-chair`는 y=0.55H..0.55H+H/12인 X/Z 전폭 좌판, 뒤쪽 z=−D/2..−D/2+D/12이고 y=0.55H..H인 등판, 네 모서리 다리를 합친다. 각 다리는 X 폭 W/16·Z 깊이 D/12, x=±(W/2−W/32), z=±(D/2−D/24), y=0..0.55H다. `outdoor-table`은 y=H−H/12..H인 X/Z 전폭 상판과 같은 네 다리를 y=0..H−H/12까지 합친다. 좌판·상판 아래의 다리 사이 공간은 실제로 비어 있다. `garden-light`는 반지름 W/2·높이 H의 막힌 24각 Y축 기둥이며 맨 위 H/8을 `body/diffuser` face로 나눈다. `bike-rack`은 X/Y 평면의 반지름 W/2−W/24 상부 반원과 그 아래 두 수직 다리를 반지름 W/24인 24각 관으로 연결하고, 각 다리 밑에는 X 폭 W/12·Z 전깊이 D·Y 높이 H/16의 접지판을 일체화한다. 자전거의 차축은 `@axis-control`의 X 대칭 중심과 Y 높이를 따른다. 두 바퀴는 XY 평면의 바깥 반지름 0.34, 림 안반지름 7/8×0.34, 허브 반지름 0.34/10인 24각 고리이고 Z 반두께는 해당 `@axis-control`이다. 지면에서 각 바퀴의 x=차축 X±0.03·z=±바퀴 반두께 구간은 y=0의 평평한 접지면으로 절삭해 유한 접촉을 만든다. 프레임 관의 24각 단면 반지름은 W/120이며 XY 절점은 뒤 차축, (0,0.70), 앞 차축, (0,0.40), (−W/8,0.93)이다. 관은 이 순서의 삼각망 연결과 안장 기둥·전방 포크에 연결되며 겹치는 내부 면은 제거한다. 안장은 중심 x=−W/8,y=0.93, X 길이 W/5·Z 폭 D/4·Y 두께 H/40의 닫힌 판이다. 핸들 기둥은 앞 차축에서 x=+W/4,y=H까지 올라가고 마지막 가로 관은 X 중심 +W/4, y=H, Z=±(D/2−W/120)의 중심선 끝까지 이어지고 관의 상단은 y=H에서 평평하게 막는다. 자전거 거치대·자전거의 하부 열린 공간과 두 바퀴 사이의 공기를 네 view에서 확인한다.

각 상태의 정확한 점유는 아래 표가 소유한다. 우편함 틈, 가구 하부, 거치대 안쪽과 자전거 바퀴 안쪽의 빈 공간을 덮는 면은 발행하지 않는다.

ref01의 거리·진입 계단과 ref02의 작은 외부 정원에 비례하도록 정면·측면·45°에서 읽힘을 확인한다. ref03·04·05는 외부 기물의 상세 치수를 주지 않는다. 내후성·자전거 주행·빗물 저장량은 `unverified`다.

@void mailbox: body, -0.16..0.16, 0.05..0.45, -0.09..0.09
@void mailbox: body, -0.15..0.15, 0.45..0.48, -0.015..0.015
@bore rain-barrel: body, 0.293, 0.051..0.91
@bore outdoor-waste-bin: body, 0.18, 0.036..0.65

@scalar-control outdoor-seat-height-ratio: 0.55

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

원점의 Y는 물체 아래선이고 X는 폭 중심이다. `entry-mirror`는 표의 닫힌 판에서 X/Y 바깥 둘레 W/30을 프레임 face로, z=D−D/8인 앞면 중앙을 반사 face로 나눈다. `wall-sconce`는 z=0..D/8, 중심 (x=0,y=H/2), X 반지름 W/2·Y 반지름 H/2인 24각 타원 벽 접촉판과 같은 Y 중심에서 z=D/8..5D/8로 향하는 반지름 W/16의 24각 팔을 합친다. 확산 갓은 중심 x=0,z=3D/4, X 반지름 W/2·Z 반지름 D/4인 Y축 24각 타원통을 y=H/2..H에 두어 팔 끝과 유한 면으로 합친다. 갓의 y=H/2 아래 원판에서 팔 접합 원을 뺀 노출 환형 부분이 `body/diffuser` face다. `coat-hook`의 벽판은 x=±W/2,y=0..H/2,z=0..D/8을 채운다. 두 팔은 x=±(W/2−W/10), y=H/2, z=D/8..D−W/32의 24각 봉이고 단면 반지름 W/32다. 끝은 같은 반지름의 수직 봉을 z=D−W/32, y=H/2..H로 올려 두 걸림 홈을 형성한다. 두 팔의 X 중심 간격은 4W/5이며 `personal-articles/coat` 둘의 독립 실루엣은 각 중심에서 서로 겹치지 않는다. 세 상태의 z=0 벽 접촉면은 양수 면적이다. 광량·실제 의복 하중은 `unverified`다.

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
| @envelope | coat-hook | * | bounds | -0.4..0.4 | 0..0.12 | 0..0.12 | - |
| @part | coat-hook | body | curved | -0.4..0.4 | 0..0.12 | 0..0.12 | wall |

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
