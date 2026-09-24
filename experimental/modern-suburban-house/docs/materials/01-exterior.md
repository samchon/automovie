# 외부 재료

## 따뜻한 백색 lap siding {#siding-warm-white}

[공통 재료와 외피 인상](../settings/20-verification.md#visual-grammar)의 따뜻한 백색 수평 lap siding이다. 구성은 공장 도장한 섬유시멘트 판이며 course의 노출 높이와 겹침 그림자는 [lap siding 판 단면](../models/15-outdoor.md#lap-siding-board)의 판 geometry와 그 반복 instance가 만든다. 외관은 도막 한 층의 색과 광택만 근사하는 `#EDE8DC`(선형 0.847, 0.807, 0.716), roughness 0.55, metallic 0.0, transmission 0.0이다. trim `#F6F4EE`보다 한 단계 따뜻하고 어두워 [흰 trim](#trim-white)과 벽이 같은 흰색으로 합쳐지지 않게 한다. 결합 면은 lap siding 판의 `siding-face`·`siding-butt`·`siding-back`이며, 판이 덮는 host는 [전면](../spaces/envelope/front.md#front-openings)·[후면](../spaces/envelope/rear.md#rear-openings)·[왼쪽](../spaces/envelope/left.md#left-openings)·[오른쪽](../spaces/envelope/right.md#right-openings) 입면 owner의 기단 윗선 위 바깥 벽면, 박공 삼각 벽, 차고 바깥 벽면이다. 창·문 void와 trim 부재 면은 받지 않는다. source owner는 `src/materials/exterior/siding.ts`이고, 리뷰는 [재료 리뷰 견본](00-material-frame.md#material-review-set)의 01 외관 기본 view와 벽 앞 2 m 근접 view에서 siding과 trim의 명도 차가 읽히고 한 입면 안에 색 패치가 없는지를 관찰한다.

## 흰 외부 trim {#trim-white}

창·문 둘레 casing, 모서리 판, 처마 fascia와 soffit, 포치 기둥·보다. 구성은 반광 도장한 PVC·목재 trim 판이다. 외관은 `#F6F4EE`(선형 0.922, 0.905, 0.855), roughness 0.35, metallic 0.0, transmission 0.0이며 반광으로 siding(0.55)보다 좁은 하이라이트를 가져 [trim이 돌출과 음영으로 접합을 설명](../settings/20-verification.md#visual-grammar)하는 읽힘을 돕는다. 결합 면은 각 입면 owner의 바깥 trim 부재, [창의 표면 파티션](../models/01-windows.md#window-surface-partitions)의 `exterior-trim`, [현관문](../models/02-exterior-doors.md#front-entry-door)의 `exterior-trim`·`jamb`·`threshold`, 각 지붕 경사면 owner의 처마 하부와 fascia, [포치의 기둥·보·받침](../spaces/porch.md#porch-roof-columns)이다. source owner는 `src/materials/exterior/trim.ts`이고, 리뷰는 오후 key 아래 처마 soffit이 완전 검정으로 닫히지 않고 기둥 네 면이 같은 재료로 읽히는지를 관찰한다.

## 어두운 asphalt shingle {#roof-shingle}

[작고 규칙적인 어두운 asphalt shingle](../settings/20-verification.md#visual-grammar)이다. 구성은 광물 입자를 입힌 asphalt shingle이며 중첩 결은 지붕 경사면 owner와 instance의 shingle 줄 geometry가 만든다. 외관은 입자 표면을 평균한 `#3A3C3E`(선형 0.042, 0.045, 0.048), roughness 0.90, metallic 0.0, transmission 0.0이다. 결합 면은 여덟 지붕 경사면 owner와 포치 지붕의 상면이며 처마 하부·fascia는 [흰 trim](#trim-white)이 받는다. source owner는 `src/materials/exterior/shingle.ts`이고, 리뷰는 높은 roof view에서 경사면마다 같은 색이고 골짜기에서 재료가 끊기지 않는지를 관찰한다.

## 붉은갈색 벽돌 {#brick-red-brown}

기단·굴뚝·벽난로의 붉은갈색 벽돌이다. 구성은 소성 점토 벽돌과 시멘트 모르타르 줄눈이며 줄눈의 오목한 면은 instance가 만든다. 벽돌 외관은 `#8A4A3A`(선형 0.254, 0.068, 0.042), roughness 0.85, metallic 0.0, transmission 0.0이고 줄눈 외관은 `#BDB5A8`(선형 0.509, 0.462, 0.392), roughness 0.92다. 결합 면은 각 입면 owner의 기단 노출 수직 면, [굴뚝 접면](../spaces/envelope/left.md#chimney-roof-interface)의 굴뚝 몸체, 거실 벽난로 본체이며 줄눈 값은 오목한 줄눈 면에만 붙는다. 굴뚝 cap은 [charcoal 금속](#window-frame-charcoal)이다. source owner는 `src/materials/exterior/brick.ts`이고, 리뷰는 01 외관에서 기단과 굴뚝이 같은 벽돌로 읽히고 줄눈이 창·문을 침범하지 않는지를 관찰한다.

## charcoal 창틀과 굴뚝 cap {#window-frame-charcoal}

[창틀의 짙은 charcoal](../settings/20-verification.md#visual-grammar)이다. 구성은 분체 도장 알루미늄이므로 [관례](00-material-frame.md#material-response-conventions)대로 도막을 metallic 0.0으로 표현한다. 외관은 `#2E3033`(선형 0.027, 0.030, 0.033), roughness 0.40, transmission 0.0이다. 결합 면은 [창의 표면 파티션](../models/01-windows.md#window-surface-partitions)의 `frame`·`sash`·`mullion`·`muntin`, [현관문](../models/02-exterior-doors.md#front-entry-door)의 `muntin`, [정원 쪽 유리문](../models/02-exterior-doors.md#garden-door-pair)의 문짝 둘레 `leaf`, 굴뚝 cap이다. source owner는 `src/materials/exterior/frames.ts`이고, 리뷰는 흰 trim 안에서 창틀이 검은 구멍이 아니라 두께 있는 틀로 읽히는지를 관찰한다.

## 투명 창유리 {#glass-clear}

[유리는 구멍도 불투명 검은 판도 아니다](../settings/10-house.md#openings). 구성은 두께 0.006 m 판유리 한 장으로 근사하며 복층 공기층은 표현하지 않는다. 외관은 `#E8EEF0`(선형 0.807, 0.855, 0.871), roughness 0.03, metallic 0.0, transmission 0.92, ior 1.50, 두께 0.006 m이며 양면이다. 결합 면은 창 모델의 `glass`, [현관문](../models/02-exterior-doors.md#front-entry-door)·[차고문](../models/02-exterior-doors.md#garage-sectional-door)·[정원 쪽 유리문](../models/02-exterior-doors.md#garden-door-pair)의 `glass`, [샤워부스](../models/14-bathrooms.md#sliding-shower-booth)의 `glass`·`panel-1`–`panel-3`, 세탁기 `door-glass`다. source owner는 `src/materials/exterior/glass.ts`이고, 리뷰는 켜진 실내등 아래 외관에서 창 안쪽이 비치고 하늘 반사가 함께 읽히는지를 관찰한다.

## 불투명 욕실 유리 {#glass-obscure}

욕실 외부 창의 프라이버시 유리다. 구성은 한 면을 산성 부식한 판유리다. 외관은 투명 유리와 같은 색·ior·두께에 roughness 0.55, metallic 0.0, transmission 0.80이어서 빛은 통과하되 실내 형상이 흐려진다. 결합 면은 [욕조 욕실 창](../spaces/envelope/right.md#tub-right-window)을 채우는 [상부 경첩창](../models/01-windows.md#awning-window)의 `obscured-glass`다. source owner는 `src/materials/exterior/glass.ts`이고, 리뷰는 욕실 창이 밝게 빛나되 기구 형상이 보이지 않는지를 관찰한다.

## 꿀빛 목재 현관문 {#front-door-wood}

[현관의 목재문](../settings/10-house.md#porch-entry)이다. 구성은 오일 마감 참나무 판 문짝이다. 외관은 결을 표현하지 않는 `#9A6A3E`(선형 0.323, 0.144, 0.048), roughness 0.50, metallic 0.0, transmission 0.0이다. 결합 면은 [목재 현관문](../models/02-exterior-doors.md#front-entry-door)의 `leaf` 바깥·안쪽 면과 모서리이며 `casing`은 [흰 실내 trim](02-interior-shell.md#interior-trim-white), `handle`은 [검은 도장 금속](02-interior-shell.md#black-coated-metal)이다. source owner는 `src/materials/exterior/doors.ts`이고, 리뷰는 포치 그늘 안에서 문이 흰 벽과 구별되는 중간갈색으로 읽히는지를 관찰한다.

## charcoal 차고문 패널 {#garage-door-charcoal}

[두 대용 폭의 어두운 분절 패널문](../settings/10-house.md#garage)이다. 구성은 도장 강판 분절 패널이므로 metallic 0.0이다. 외관은 `#34373A`(선형 0.034, 0.038, 0.042), roughness 0.45, transmission 0.0이며 창틀보다 한 단계 밝게 해 넓은 면이 검은 판으로 뭉개지지 않게 한다. 결합 면은 [분절 차고문](../models/02-exterior-doors.md#garage-sectional-door)의 `panel-1`–`panel-4`와 `leaf-panel` 양면이며 `rail`은 [스테인리스](03-furnishings.md#stainless-steel)다. source owner는 `src/materials/exterior/doors.ts`이고, 리뷰는 01 외관에서 패널 분절 그림자와 상부 유리가 읽히는지를 관찰한다.

## 포치 바닥 {#porch-floor}

[현관 포치](../spaces/porch.md#porch-platform-access)의 높은 바닥과 단이다. 구성은 도장 콘크리트 상부판이다. 외관은 `#A8A49C`(선형 0.392, 0.371, 0.332), roughness 0.80, metallic 0.0, transmission 0.0으로 [포장 콘크리트](#paving-concrete)보다 조금 어둡게 해 높이 차이가 읽히게 한다. 결합 면은 포치 상면·챌면·노출 옆면이다. source owner는 `src/materials/exterior/paving.ts`이고, 리뷰는 포치 단과 앞 보행길의 경계가 색과 그림자로 구별되는지를 관찰한다.

## 포장 콘크리트 {#paving-concrete}

[차고 진입 콘크리트 차도와 현관 보행길](../settings/10-house.md#site-identity)이다. 구성은 빗자루 마감 현장 타설 콘크리트이며 두께는 [포장 바탕](../spaces/site/01-paving-support.md#paving-depth-reservation)이 예약한다. 외관은 빗자루 결을 평균한 `#B4B0A8`(선형 0.456, 0.434, 0.392), roughness 0.88, metallic 0.0, transmission 0.0이다. 결합 면은 front-walk·driveway·side-walk·terrace owner의 상면과 노출 옆면이며 줄눈은 이 H2가 만들지 않는다. source owner는 `src/materials/exterior/paving.ts`이고, 리뷰는 오후 key 아래 포장이 흰 벽보다 어둡고 잔디와 구별되는지를 관찰한다.

## 중간갈색 울타리 목재 {#fence-wood}

[우측 목재 울타리](../settings/10-house.md#site-identity)다. 구성은 착색한 방부 목재 판이다. 외관은 `#8C6A48`(선형 0.262, 0.144, 0.065), roughness 0.75, metallic 0.0, transmission 0.0이다. 결합 면은 [울타리 전체와 측면 문·기둥](../spaces/site/fence.md#fence-enclosure-plan)의 모든 노출 면과 [옆마당 목재 대문](../models/02-exterior-doors.md#side-yard-gate)의 `leaf-panel`이다. source owner는 `src/materials/exterior/fence.ts`이고, 리뷰는 01 외관에서 울타리가 현관문보다 회색빛이 도는 중간갈색으로 읽히는지를 관찰한다.
