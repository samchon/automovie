# 가구·설비·직물 재료

## 회갈색 패널 수납장 {#greige-cabinet}

[주방의 회갈색 패널 수납장](../settings/10-house.md#kitchen-equipment)과 [욕실의 회갈색 세면장](../settings/10-house.md#tub-bathroom)이다. 구성은 두께 0.018 m MDF 패널 위 반무광 도장이다. 외관은 `#8A7F72`(선형 0.254, 0.212, 0.168), roughness 0.50, metallic 0.0, transmission 0.0이며 도막 한 층의 색과 광택만 근사하고 패널 분절과 문 틈은 모델 geometry가 만든다. 흰 벽 타일과 밝은 상판 사이에서 중간 명도의 띠로 읽히도록 정했다. 결합 면은 [주방 하부장 띠](../models/10-kitchen-dining.md#kitchen-base-run)와 [싱크 섬](../models/10-kitchen-dining.md#kitchen-island)의 `plinth`·`carcass`·`front`, [주방 상부장](../models/10-kitchen-dining.md#kitchen-wall-cabinet)의 `carcass`·`front`·`underside`, [세면장](../models/14-bathrooms.md#vanity-basin)의 `plinth`·`cabinet`·`leaf-panel`, [세탁실 상부 수납](../models/12-service-rooms.md#laundry-upper-storage)의 `carcass`·`front`·`underside`다. source owner는 `src/materials/furnishings/cabinetry.ts`이고, 리뷰는 [재료 리뷰 견본](00-material-frame.md#material-review-set)의 거리 견본 중 03 공용부 view와 욕실 threshold view에서 서랍·문 분절이 같은 재료의 그림자로 구별되는지를 관찰한다.

## 밝은 석재 상판 {#light-countertop}

[밝은 상판](../settings/10-house.md#kitchen-equipment)이다. 구성은 두께 0.03 m 엔지니어드 석재 판이다. 외관은 `#E4E0D8`(선형 0.776, 0.745, 0.687), roughness 0.30, metallic 0.0, transmission 0.0이며 연마면의 색과 반광만 근사하고 석재 입자는 표현하지 않는다. 결합 면은 주방 하부장 띠·싱크 섬·세면장의 `countertop`과 [세탁기 위 접는 상판](../models/12-service-rooms.md#laundry-folding-top)의 `top`이다. 받침 `cleat`는 [회갈색 패널 수납장](#greige-cabinet)을 받는다. source owner는 `src/materials/furnishings/cabinetry.ts`이고, 리뷰는 03 view에서 상판 앞 모서리가 수납장 위 밝은 선으로 읽히는지를 관찰한다.

## 스테인리스 가전과 수전 {#stainless-steel}

[스테인리스 냉장고·레인지·전자레인지](../settings/10-house.md#kitchen-equipment)와 식기세척기, 수전이다. 구성은 도장하지 않은 헤어라인 스테인리스 강판과 주물 수전이다. 외관은 `#C0C2C4`(선형 0.527, 0.539, 0.552), roughness 0.30, metallic 1.0, transmission 0.0이며 헤어라인 방향성은 상수 roughness로 평균화한다. 결합 면은 [양문 냉장고](../models/10-kitchen-dining.md#kitchen-refrigerator)의 `door-left`·`door-right`·`drawer`·`body`·`handle`, [레인지](../models/10-kitchen-dining.md#kitchen-range)의 `oven-door`·`body`·`handle`, [전자레인지](../models/10-kitchen-dining.md#kitchen-microwave)의 `body`, [식기세척기](../models/10-kitchen-dining.md#kitchen-dishwasher)의 `door`·`body`, 싱크 섬의 `sink-basin`·`faucet`, 세면장·욕조·샤워부스의 `faucet`, [차고 금속 선반](../models/12-service-rooms.md#garage-shelving)의 `post`·`shelf`, [공구판](../models/12-service-rooms.md#garage-tool-board)의 `tool-steel`이다. 가전 안쪽 `interior`·`oven-interior`는 [흰 에나멜](#white-enamel)을 받는다. source owner는 `src/materials/furnishings/appliances.ts`이고, 리뷰는 중성 조명 판과 03 view에서 가전이 흰 벽보다 어둡지만 검은 판이 아닌 금속 반사로 읽히는지를 관찰한다.

## 검은 유리 조작부 {#black-glass-panel}

오븐 창·쿡탑·조작부다. 구성은 검은 유리 세라믹 판이다. 외관은 `#1F1F20`(선형 0.014, 0.014, 0.014), roughness 0.08, metallic 0.0, transmission 0.0이며 판 뒤 내부는 보이지 않는 불투명 반사면으로 근사한다. 결합 면은 레인지의 `cooktop`·`burner`·`control-band`, 전자레인지의 `door-window`·`control-panel`, 식기세척기의 `control-band`, [드럼 세탁기와 건조기](../models/12-service-rooms.md#laundry-machine)의 `control-band`다. source owner는 `src/materials/furnishings/appliances.ts`이고, 리뷰는 근접 거리 견본에서 조작부가 스테인리스와 광택으로 구별되는지를 관찰한다.

## 흰 에나멜과 도기 {#white-enamel}

변기·세면기·욕조와 [앞문식 세탁기·건조기](../settings/10-house.md#laundry-mudroom)의 흰 몸체다. 구성은 유약 도기와 법랑 강판이며 두 구성을 한 외관으로 묶는다. 외관은 `#F5F5F2`(선형 0.913, 0.913, 0.888), roughness 0.25, metallic 0.0, transmission 0.0이다. 결합 면은 [공용 변기](../models/14-bathrooms.md#shared-toilet)의 `ceramic`·`seat`·`lid`·`seat-lid`, 세면장과 [욕조 겸 샤워](../models/14-bathrooms.md#bathtub)의 `ceramic`·`apron`, [샤워부스](../models/14-bathrooms.md#sliding-shower-booth)의 `shower-tray`, 세탁기·건조기의 `body`·`door`, 가전의 `interior`·`oven-interior`다. 세탁기 `door-ring`은 [스테인리스](#stainless-steel), `door-glass`는 [투명 유리](01-exterior.md#glass-clear), `drum`은 스테인리스를 받는다. source owner는 `src/materials/furnishings/fixtures.ts`이고, 리뷰는 05 욕실 view에서 도기가 벽 타일보다 좁은 하이라이트로 구별되는지를 관찰한다.

## 꿀빛 가구 목재 {#furniture-wood}

[낮은 목재 테이블](../settings/10-house.md#living), [목재 침대](../settings/10-house.md#primary-bedroom), 식탁·의자·책상, 팬트리 선반이다. 구성은 오일 마감 참나무 집성재다. 외관은 `#A87A4E`(선형 0.392, 0.195, 0.076), roughness 0.50, metallic 0.0, transmission 0.0이며 결은 표현하지 않고 부재 모서리의 음영으로 목재 덩어리를 읽힌다. [참나무색 마루](02-interior-shell.md#oak-floor)보다 약간 어두워 다리가 바닥에 묻히지 않도록 정했다. 결합 면은 [여섯 좌석 식탁](../models/10-kitchen-dining.md#dining-table)의 `top`·`apron`·`leg`, [식탁 의자](../models/10-kitchen-dining.md#dining-chair)·[섬 스툴](../models/10-kitchen-dining.md#kitchen-island-stool)·[책상 의자](../models/13-bedrooms.md#desk-chair)의 `seat`·`leg`·`back`·`footrest`, [낮은 목재 테이블](../models/11-living.md#low-table)과 [작은 책상](../models/13-bedrooms.md#child-desk)의 `top`·`leg`·`shelf`, [머리판 있는 침대](../models/13-bedrooms.md#headboard-bed)의 `headboard`·`frame`, [협탁](../models/13-bedrooms.md#nightstand-lamp)·[낮은 서랍장](../models/13-bedrooms.md#low-dresser)의 `case`·`drawer-front`·`leg`, 소파·[안락의자](../models/11-living.md#reading-armchair)의 `leg`, [팬트리 L형 선반](../models/12-service-rooms.md#pantry-l-shelf)과 [머드룸 신발 벤치](../models/12-service-rooms.md#mudroom-bench)의 `seat`·`side`·`shelf`, 팬트리 선반의 `shelf`·`cleat`, [공구 작업대](../models/12-service-rooms.md#garage-workbench)의 `top`·`leg`·`drawer`, [테라스 식탁](../models/15-outdoor.md#terrace-table)·[테라스 의자](../models/15-outdoor.md#terrace-chair)다. source owner는 `src/materials/furnishings/wood.ts`이고, 리뷰는 03과 05 view에서 가구와 마루가 같은 계열이되 구별되는지를 관찰한다.

## 짙은 책장 목재 {#dark-bookcase-wood}

[거실의 짙은 책장](../settings/10-house.md#living)이다. 구성은 어두운 착색 호두나무 판재다. 외관은 `#4A3A2E`(선형 0.068, 0.042, 0.027), roughness 0.55, metallic 0.0, transmission 0.0이다. 결합 면은 [짙은 책장과 책](../models/11-living.md#dark-bookcase)의 `case`·`shelf`·`back-panel`이다. `book`은 이 H2가 아니라 [회베이지 천갈이](#grey-beige-upholstery)와 [올리브](#olive-bedding)·[청회색](#blue-grey-bedding) 직물 값을 책마다 순환해 받는다. source owner는 `src/materials/furnishings/wood.ts`이고, 리뷰는 04 view에서 책장이 흰 벽 앞 짙은 덩어리로 읽히되 선반 그림자와 책 색 변화가 보이는지를 관찰한다.

## 회베이지 천갈이 {#grey-beige-upholstery}

[회색/미색 패브릭 소파](../settings/10-house.md#living)와 안락의자다. 구성은 폼 위 직조 폴리 직물이다. 외관은 `#B7AFA3`(선형 0.474, 0.429, 0.366), roughness 0.92, metallic 0.0, transmission 0.0이며 직조 결은 표현하지 않는다. 결합 면은 [패브릭 소파](../models/11-living.md#fabric-sofa)와 [독서 안락의자](../models/11-living.md#reading-armchair)의 `base`·`seat-cushion`·`back`·`arm`이다. source owner는 `src/materials/furnishings/textiles.ts`이고, 리뷰는 04와 03 view에서 소파가 벽보다 어둡고 광택 없이 읽히는지를 관찰한다.

## 회베이지 주침실 침구 {#primary-bedding}

[주침실의 회베이지 침구](../settings/10-house.md#primary-bedroom)다. 구성은 면 직물 이불·베개이고 매트리스는 흰 면 커버다. 외관은 `#CFC8BC`(선형 0.624, 0.578, 0.503), roughness 0.93, metallic 0.0, transmission 0.0이다. 결합 면은 주침실 [머리판 있는 침대](../models/13-bedrooms.md#headboard-bed)의 `bedding`, 세 침대의 `pillow`와 `mattress`다. source owner는 `src/materials/furnishings/textiles.ts`이고, 리뷰는 주침실 view에서 침구가 목재 침대와 카펫 사이에서 구별되는지를 관찰한다.

## 올리브 침구 {#olive-bedding}

[올리브색 침구의 작은 침실](../settings/10-house.md#bedroom-two)의 식별색이다. 구성은 면 직물 이불이다. 외관은 `#6B7040`(선형 0.147, 0.162, 0.051), roughness 0.92, metallic 0.0, transmission 0.0이다. 결합 면은 bedroom-two에 놓인 [머리판 있는 침대](../models/13-bedrooms.md#headboard-bed) instance의 `bedding`이며 같은 원형의 방별 변형은 instances가 선언한다. source owner는 `src/materials/furnishings/textiles.ts`이고, 리뷰는 기준 상태 판과 bedroom-two 전체 view에서 이불이 올리브로 식별되는지를 관찰한다.

## 청회색 침구 {#blue-grey-bedding}

[청회색 침구의 작은 침실](../settings/10-house.md#bedroom-three)의 식별색이다. 구성은 면 직물 이불이다. 외관은 `#6E7F8C`(선형 0.156, 0.212, 0.262), roughness 0.92, metallic 0.0, transmission 0.0이며 올리브와 명도가 비슷하되 색상이 반대편이어서 두 방이 침구로 구별된다. 결합 면은 bedroom-three에 놓인 머리판 있는 침대 instance의 `bedding`이다. source owner는 `src/materials/furnishings/textiles.ts`이고, 리뷰는 두 작은 침실 view를 나란히 놓아 따뜻한 실내등 아래에서도 침구색이 구별되는지를 관찰한다.

## 절제된 러그 {#muted-rug}

[절제된 무늬 러그](../settings/10-house.md#living)다. 구성은 얇은 양모 직물이다. 외관은 몸체 `#8E8579`(선형 0.270, 0.235, 0.191), roughness 0.95, metallic 0.0, transmission 0.0이고 테두리는 [회베이지 천갈이](#grey-beige-upholstery) 값이다. 비트맵이 없으므로 무늬는 [얇은 바닥 깔개](../models/11-living.md#floor-covering)의 `field`와 `border` 두 파티션의 색 대비로만 표현되며 그 이상의 무늬는 표현하지 않는 한계다. source owner는 `src/materials/furnishings/textiles.ts`이고, 리뷰는 04 view에서 러그가 마루 위 별도 면과 테두리로 읽히는지를 관찰한다.

## 흰 수건과 얇은 커튼 {#towel-curtain-textile}

[수건](../settings/10-house.md#shower-bathroom)·[접힌 린넨](../settings/10-house.md#storage)과 [주침실의 얇은 커튼](../settings/10-house.md#primary-bedroom), 욕조 샤워 커튼이다. 구성은 파일 면 직물(수건)과 얇은 폴리 직물(커튼)이다. 수건 외관은 `#EAE6DC`(선형 0.823, 0.791, 0.716), roughness 0.95, metallic 0.0, transmission 0.0이다. 커튼 외관은 `#EDE9E0`(선형 0.847, 0.815, 0.745), roughness 0.90, metallic 0.0, transmission 0.30이며 양면이어서 창빛이 비친다. 두 값은 교체 경로가 달라 source에서 두 재료 객체로 둔다. 결합 면은 [수건걸이와 수건](../models/14-bathrooms.md#towel-bar)의 `towel`, [욕조 커튼](../models/14-bathrooms.md#tub-curtain-rail)의 `curtain`·`curtain-open`, 린넨장·[옷방 선반](../models/13-bedrooms.md#wardrobe-shelves)의 `folded`다. 주침실 창 커튼은 models에 원형이 없어 아직 결합 면이 없다. 레일 `rail`은 [검은 도장 금속](02-interior-shell.md#black-coated-metal)이다. source owner는 `src/materials/furnishings/textiles.ts`이고, 리뷰는 욕조 커튼이 빛을 통과시키는지와 수건이 흰 타일과 구별되는지를 관찰한다.

## 거울 {#mirror}

[세면대 거울](../settings/10-house.md#powder)이다. 구성은 뒷면 은막을 입힌 유리 판이다. 외관은 은막 반사를 표면 반사로 근사한 `#EDEDED`(선형 0.847, 0.847, 0.847), roughness 0.02, metallic 1.0, transmission 0.0이다. 결합 면은 [벽 거울](../models/14-bathrooms.md#wall-mirror)의 `mirror-glass`이며 `frame`은 [검은 도장 금속](02-interior-shell.md#black-coated-metal)을 받는다. source owner는 `src/materials/furnishings/fixtures.ts`이고, 리뷰는 욕실 view에서 거울이 방을 반사하되 관찰 대상을 가리지 않는지를 관찰한다.

## 벽난로 화구 {#firebox-black}

[벽난로의 검은 화구](../settings/10-house.md#living)다. 구성은 그을린 내화 벽돌이며 줄눈은 표현하지 않는다. 외관은 `#1F1F20`(선형 0.014, 0.014, 0.014), roughness 0.90, metallic 0.0, transmission 0.0이고 불은 꺼진 정적 상태라 발광이 없다. 결합 면은 거실 벽난로 화구의 안쪽 면이며 이 면을 소유하는 spaces/models owner의 파티션 이름은 아직 없어 결합이 미확정이다. 본체는 [붉은갈색 벽돌](01-exterior.md#brick-red-brown)이다. source owner는 `src/materials/furnishings/fixtures.ts`이고, 리뷰는 04 view에서 화구가 벽돌 본체와 목재 선반 사이에서 구별되는지를 관찰한다.

## 나머지 소품 파티션 {#minor-prop-partitions}

위 H2가 받지 않는 소품 파티션의 결합이다. [협탁과 등](../models/13-bedrooms.md#nightstand-lamp)의 `lamp-base`는 [흰 에나멜](#white-enamel), `lamp-shade`는 [얇은 커튼](#towel-curtain-textile) 값이다. [옷장](../models/13-bedrooms.md#sliding-closet)과 [옷방](../models/13-bedrooms.md#wardrobe-hanging)의 `case`·`door`·`door-front`·`door-back`·`side-panel`·`shelf`는 [흰 실내 trim](02-interior-shell.md#interior-trim-white), `rod`는 [스테인리스](#stainless-steel), `clothes`는 [회베이지 천갈이](#grey-beige-upholstery)·[청회색](#blue-grey-bedding)·[올리브](#olive-bedding)를 벌마다 순환한다. [외투 걸이](../models/12-service-rooms.md#mudroom-coat-hooks)의 `rail`은 가구 목재, `hook`은 검은 도장 금속, `coat`는 청회색이다. [식품 용기](../models/12-service-rooms.md#pantry-containers)의 `jar-body`는 [투명 유리](01-exterior.md#glass-clear), `jar-lid`·`box`·`basket`은 가구 목재, [차고 선반](../models/12-service-rooms.md#garage-shelving)의 `bin`과 [공구판](../models/12-service-rooms.md#garage-tool-board)의 `board`·`tool-grip`, 작업대 `handle`, `shoe`·`shoe-box`, 책상 `prop`은 [검은 도장 금속](02-interior-shell.md#black-coated-metal)이다. 이 소품들은 새 색을 만들지 않고 기존 H2 값을 재사용해 palette를 늘리지 않는다. source owner는 `src/materials/bindings.ts`이고, 리뷰는 [면 결합 규칙](00-material-frame.md#material-binding-rule)의 재료 없는 파티션 0 검사로 누락을 찾는다.
