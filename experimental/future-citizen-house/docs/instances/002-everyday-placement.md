# 일상 물체 배치

이 문서는 `.wiki/사물-목록.md`의 최신 @census 429개를 15개 구역으로 전수 대조한 instance 설계 초안이다. 첫 이력의 422는 과거 단계 수치다. `docs/instances/001-household-placement.md`의 기존 root·직접 fit-out은 같은 모집단의 일부이며 중복 생성하지 않는다. 모델 주소는 `docs/models/001`~`005`의 리뷰된 상태를 소비한다. 좌표는 m, 오른손 Y-up, 전면 -Z이고 모든 모델은 원형 크기 1:1을 쓴다. 아래 수량은 완료된 렌더 수량을 주장하지 않는다.

방 소속·지원면·유일 ID·정확한 변환은 instances 소유다. 현재 room source는 대형 가구와 일부 소품의 기준 좌표만 제공한다. 나머지 소품 좌표는 지지면의 실제 치수와 문·계단·보행 폭을 확인해 결정해야 하며, 근거 없는 균등 산포를 이 설계로 채택하지 않는다. 조명 emitter는 systems와 결합되어야 한다. 현재 검증 전인 개별 변환은 실행 배치로 세지 않는다. 429는 작업실의 work·guest 두 정지 상태를 합친 고유 물체 모집단이다. `손님 침구 세트` 1개, `담요` 1개, `베개` 2개는 guest에서만 외부 침대 위에 활성화되며 work에서는 닫힌 수납 침대 안의 미표현 내용물이다. work 활성 물체는 425개이고 guest 활성 물체는 429개다. 이를 렌더 단의 숨김이나 축소된 소품으로 가장하지 않는다.

## 모집단과 변환 규칙 {#population-and-transform}

각 행의 수량만큼 독립 ID가 필요하다. 반복 ID는 구역·물체 역할·0부터 시작하는 고정 번호를 결합하며, 원본 나열 순서나 런타임 순회 순서에 의존하지 않는다. 부모 좌표계는 건물 세계 좌표다. 바닥 접촉은 1층 0m, 상층 3.20m, 외부는 해당 site 지지면을 따른다. 상판·선반·침대의 자식 물체는 해당 모델의 지지면 높이와 yaw를 반영한다. 지원면의 envelope와 개구 영역을 통과하거나 더 큰 모델로 변경해야 하면 모델·공간 owner로 돌려 보낸다.

## 재사용과 관찰 {#reuse-and-observation}

한 `@uses` 주소는 같은 모델 상태를 공유한다. 이 배치에는 무작위 위치·크기 변종, hero 대체, 밀도 감소, LOD 절환이 없다. 작업실 수납 침대는 work/guest 상태에 따라 하나의 안정 ID가 모델 상태만 변경한다. 검증은 429개 이름·수량·모델 주소의 전수 대조, 고유 ID와 floor/host 접촉·간섭 계측, 각 prop class의 일반 시야 GPU 관찰, 작업/손님 두 상태의 보행·가림 확인을 필요로 한다. 한 프레임의 존재만으로 미관과 접근성이 입증되지 않는다.

## 현관 (23) {#entry}

현관 벤치와 충전 선반의 현행 좌표를 기준으로 신발·우산·열쇠·우편물의 접촉면을 정한다. 전면 출입문과 작업실·공용부 통행대는 비운다.

| 독립 물체 | 수량 | 모델 상태 |
| --- | ---: | --- |
| 신발 벤치 | 1 | `entry-bench/default` |
| 충전 선반 | 1 | `entry-charging-shelf/default` |
| 충전기 | 1 | `entry-charger/default` |
| 우편 트레이 | 1 | `tabletop-props/tray` |
| 열쇠 접시 | 1 | `tabletop-props/bowl` |
| 신발 | 4 | `personal-articles/shoe` |
| 코트 | 2 | `personal-articles/coat` |
| 코트 걸이 | 1 | `wall-accessories/coat-hook` |
| 우산 | 2 | `personal-articles/umbrella` |
| 우산꽂이 | 1 | `personal-articles/umbrella-stand` |
| 현관 매트 | 1 | `household-textiles/entry-mat` |
| 거울 | 1 | `wall-accessories/entry-mirror` |
| 벽등 | 2 | `wall-accessories/wall-sconce` |
| 천장 부착등 | 3 | `ceiling-surface-light/default` |
| 현관 화분 | 1 | `potted-plant/800` |

검증 분모: 이 구역 23개 전체. 같은 공간 ID를 쓰는 거실·식당·주방은 각각 독립 하위 모집단이다.

## 가변 작업실 (38) {#flex-workroom}

현행 책상·책장·수납 침대의 좌표를 기준으로 작업 물품을 책상 위, 책을 책장 안, 침구를 침대 상태의 지지면에 놓는다. 작업/손님 상태는 같은 수납 침대 ID를 사용한다.

| 독립 물체 | 수량 | 모델 상태 |
| --- | ---: | --- |
| 높이 조절 책상 | 1 | `work-desk/folded` |
| 책상 의자 | 1 | `desk-chair/default` |
| 작업 화면 | 1 | `work-equipment/display` |
| 키보드 | 1 | `work-equipment/keyboard` |
| 포인팅 기기 | 1 | `desk-controls/pointing-device` |
| 작업등 | 1 | `portable-lamps/desk-task` |
| 천장 부착등 | 2 | `ceiling-surface-light/default` |
| 열린 책장 | 1 | `cabinet-and-shelf/open-shelf/950x1350x250/open` |
| 책 | 12 | `books/240x35x160` |
| 파일 상자 | 3 | `household-boxes/file-box` |
| 수납 침대 | 1 | `murphy-bed/work` |
| 손님 침구 세트 | 1 | `household-textiles/bedding-set` |
| 담요 | 1 | `household-textiles/blanket` |
| 베개 | 2 | `household-textiles/pillow` |
| 화분 | 1 | `potted-plant/600` |
| 컵 | 1 | `tabletop-props/cup` |
| 수납 바구니 | 2 | `storage-basket/default` |
| 작업실 안락의자 | 1 | `accent-chair/default` |
| 작업실 원형 러그 | 1 | `rugs/round1200` |
| 작업실 액자 | 1 | `wall-art/default` |
| 작업실 구형등 | 1 | `portable-lamps/bedside-globe` |
| 작업실 둘째 화분 | 1 | `potted-plant/280` |

검증 분모: 이 구역 38개 전체. 같은 공간 ID를 쓰는 거실·식당·주방은 각각 독립 하위 모집단이다.

## 거실 구역 (31) {#common-living}

현행 소파·낮은 탁자·미디어 수납장·러그를 지지 기준으로 삼는다. 쿠션은 소파 좌면, 책과 컵은 탁자·수납장, 벽 장식은 벽면에 귀속한다.

| 독립 물체 | 수량 | 모델 상태 |
| --- | ---: | --- |
| L자 소파 | 1 | `living-sofa/chaise-right` |
| 직선 소파 | 1 | `living-sofa/straight` |
| 낮은 탁자 | 1 | `coffee-table/default` |
| 러그 | 1 | `rugs/living` |
| 미디어 수납장 | 1 | `cabinet-and-shelf/media/2000x440x350/closed` |
| 거실 화면 | 1 | `living-display/default` |
| 독서등 | 1 | `portable-lamps/reading` |
| 천장 부착등 | 2 | `ceiling-surface-light/default` |
| 장식 쿠션 | 4 | `household-textiles/sofa-cushion` |
| 담요 | 2 | `household-textiles/blanket` |
| 책 | 8 | `books/240x35x160` |
| 액자 | 2 | `wall-art/default` |
| 큰 화분 | 1 | `potted-plant/1100` |
| 화분 | 1 | `potted-plant/600` |
| 그릇 | 1 | `tabletop-props/bowl` |
| 쟁반 | 1 | `tabletop-props/tray` |
| 컵 | 2 | `tabletop-props/cup` |

검증 분모: 이 구역 31개 전체. 같은 공간 ID를 쓰는 거실·식당·주방은 각각 독립 하위 모집단이다.

## 식당 구역 (55) {#common-dining}

현행 식탁 중심 (0.55,0,3.85)과 6개 의자 좌표를 사용한다. 식탁 매트와 식기는 여섯 자리의 대응 슬롯에 놓고 서빙 물체는 중앙 슬롯에 둔다.

| 독립 물체 | 수량 | 모델 상태 |
| --- | ---: | --- |
| 식탁 | 1 | `dining-table/default` |
| 식탁 의자 | 6 | `dining-chair/default` |
| 펜던트 | 1 | `dining-pendant/default` |
| 천장 부착등 | 1 | `ceiling-surface-light/default` |
| 식탁 매트 | 6 | `household-textiles/placemat` |
| 접시 | 6 | `dining-wares/plate` |
| 공기 | 6 | `tabletop-props/bowl` |
| 컵 | 6 | `tabletop-props/cup` |
| 포크 | 6 | `dining-wares/fork` |
| 숟가락 | 6 | `dining-wares/spoon` |
| 칼 | 6 | `dining-wares/table-knife` |
| 서빙 볼 | 2 | `tabletop-props/bowl` |
| 물병 | 1 | `dining-wares/water-bottle` |
| 꽃병 | 1 | `dining-wares/flower-vase` |

검증 분모: 이 구역 55개 전체. 같은 공간 ID를 쓰는 거실·식당·주방은 각각 독립 하위 모집단이다.

## 주방 구역 (45) {#common-kitchen}

현행 섬과 벽 조리대, 상부장, 분리수거장의 위치를 기준으로 조리 물체를 지지면에 귀속한다. 싱크와 쿡탑 점유면은 비우고 하부장 선형등은 장 하부에 고정한다.

| 독립 물체 | 수량 | 모델 상태 |
| --- | ---: | --- |
| 섬 | 1 | `kitchen-island/default` |
| 스툴 | 3 | `island-stool/default` |
| 벽 조리대·하부장 | 1 | `cooking-appliances/wall-worktop` |
| 상부장 | 1 | `cabinet-and-shelf/wall/2900x980x360/closed` |
| 냉장고 | 1 | `refrigerator/default` |
| 팬트리장 | 1 | `cabinet-and-shelf/tall/900x2650x600/closed` |
| 쿡탑 | 1 | `cooking-appliances/cooktop` |
| 오븐 | 1 | `cooking-appliances/oven` |
| 배기 후드 | 1 | `kitchen-extractor/default` |
| 분리수거장 | 1 | `cabinet-and-shelf/service/640x840x600/closed` |
| 분리수거함 | 3 | `household-boxes/recycling-box` |
| 천장 부착등 | 2 | `ceiling-surface-light/default` |
| 하부장 선형등 | 2 | `under-cabinet-light/default` |
| 냄비 | 3 | `kitchen-smallwares/pot` |
| 팬 | 2 | `kitchen-smallwares/pan` |
| 도마 | 2 | `kitchen-smallwares/cutting-board` |
| 칼 블록 | 1 | `kitchen-smallwares/knife-block` |
| 조리 도구통 | 1 | `kitchen-smallwares/utensil-crock` |
| 조리 도구 | 5 | `kitchen-smallwares/utensil` |
| 주전자 | 1 | `kitchen-smallwares/kettle` |
| 토스터 | 1 | `kitchen-smallwares/toaster` |
| 커피 기구 | 1 | `kitchen-smallwares/coffee-brewer` |
| 식기 건조대 | 1 | `kitchen-smallwares/drying-rack` |
| 행주 | 2 | `household-textiles/dishcloth` |
| 유리 보관병 | 4 | `kitchen-smallwares/glass-jar` |
| 뒤 조리대 싱크·수전 | 1 | `rear-counter-sink/default` |
| 뒤 조리대 화분 | 1 | `potted-plant/280` |

검증 분모: 이 구역 45개 전체. 같은 공간 ID를 쓰는 거실·식당·주방은 각각 독립 하위 모집단이다.

## 1층 화장실 (14) {#powder-utility}

현행 세면대·변기·청소장 좌표에 용기와 수건을 결합한다. 바닥 휴지통과 청소 도구는 문짝·변기 사용 영역에서 벗어난 쪽에 둔다.

| 독립 물체 | 수량 | 모델 상태 |
| --- | ---: | --- |
| 1층 세면대 | 1 | `basin/800` |
| 변기 | 1 | `toilet/lid-open` |
| 1층 청소장 | 1 | `cabinet-and-shelf/tall/520x2250x520/closed` |
| 비누 용기 | 1 | `bath-accessories/soap-dispenser` |
| 손 수건 | 2 | `folded-towels/120` |
| 휴지 걸이 | 1 | `bath-accessories/tissue-holder` |
| 휴지 | 2 | `bath-accessories/tissue-roll` |
| 휴지통 | 1 | `bath-accessories/waste-bin` |
| 청소 도구 | 2 | `household-tools/cleaning-tool` |
| 천장 부착등 | 2 | `ceiling-surface-light/default` |

검증 분모: 이 구역 14개 전체. 같은 공간 ID를 쓰는 거실·식당·주방은 각각 독립 하위 모집단이다.

## 1층 창고 (20) {#storage-1f}

현행 열린 선반 중심 (-4.90,0,-1.22)과 네 바구니의 높이별 접촉면을 사용한다. 공구·상자·여분 조명을 선반의 실제 비점유 슬롯에 분배한다.

| 독립 물체 | 수량 | 모델 상태 |
| --- | ---: | --- |
| 1층 열린 선반 | 2 | `cabinet-and-shelf/open-shelf/1550x2500x500/open` |
| 바구니 | 4 | `storage-basket/default` |
| 공구 상자 | 1 | `household-tools/tool-box` |
| 청소기 | 1 | `household-tools/vacuum` |
| 접이식 사다리 | 1 | `household-tools/folded-ladder` |
| 재활용 상자 | 2 | `household-boxes/recycling-box` |
| 여분 조명 | 2 | `household-tools/spare-light` |
| 천장 부착등 | 1 | `ceiling-surface-light/default` |
| 보관 상자 | 6 | `household-boxes/storage-box` |

검증 분모: 이 구역 20개 전체. 같은 공간 ID를 쓰는 거실·식당·주방은 각각 독립 하위 모집단이다.

## 상층 복도 (9) {#upper-corridor}

복도 clear cell과 계단·방문 개구를 먼저 비운다. 낮은 화분과 수납장은 남는 벽면에 붙이고 액자는 벽면 중심, 등은 천장에 귀속한다.

| 독립 물체 | 수량 | 모델 상태 |
| --- | ---: | --- |
| 벽 액자 | 2 | `wall-art/default` |
| 낮은 화분 | 1 | `potted-plant/280` |
| 천장 부착등 | 5 | `ceiling-surface-light/default` |
| 작은 수납장 | 1 | `cabinet-and-shelf/nightstand/500x460x460/closed` |

검증 분모: 이 구역 9개 전체. 같은 공간 ID를 쓰는 거실·식당·주방은 각각 독립 하위 모집단이다.

## 주침실 (43) {#primary-bedroom}

현행 침대·협탁·책상·옷장 좌표를 지지 기준으로 삼는다. 침구는 침대, 책상 물체는 책상, 의류는 옷장 안, 책은 책상·협탁의 비점유 면에 놓는다.

| 독립 물체 | 수량 | 모델 상태 |
| --- | ---: | --- |
| 더블 침대 | 1 | `fixed-bed/1800` |
| 협탁 | 2 | `cabinet-and-shelf/nightstand/500x460x460/closed` |
| 구형 등 | 2 | `portable-lamps/bedside-globe` |
| 천장 부착등 | 2 | `ceiling-surface-light/default` |
| 주침실 옷장 | 1 | `cabinet-and-shelf/tall/2720x2650x600/closed` |
| 주침실 책상 | 1 | `work-desk/bed-1200` |
| 책상 의자 | 1 | `desk-chair/default` |
| 작업 화면 | 1 | `work-equipment/display` |
| 키보드 | 1 | `work-equipment/keyboard` |
| 침실 러그 | 1 | `rugs/bedroom1600x2200` |
| 침구 세트 | 1 | `household-textiles/bedding-set` |
| 베개 | 4 | `household-textiles/pillow` |
| 담요 | 1 | `household-textiles/blanket` |
| 옷걸이 | 8 | `personal-articles/hanger` |
| 옷 | 8 | `personal-articles/garment` |
| 책 | 4 | `books/240x35x160` |
| 액자 | 2 | `wall-art/default` |
| 화분 | 1 | `potted-plant/600` |
| 물컵 | 1 | `tabletop-props/cup` |

검증 분모: 이 구역 43개 전체. 같은 공간 ID를 쓰는 거실·식당·주방은 각각 독립 하위 모집단이다.

## 작은 침실 1 (24) {#child-bedroom-1}

현행 싱글 침대·책상·책장·옷장 좌표를 기준으로 침구·책·작업 물체를 각각의 지지면에 놓는다. 장난감 상자는 통행에서 벗어난 바닥에 둔다.

| 독립 물체 | 수량 | 모델 상태 |
| --- | ---: | --- |
| 싱글 침대 | 1 | `fixed-bed/1000` |
| 아이방 1 옷장 | 1 | `cabinet-and-shelf/tall/1300x2650x600/closed` |
| 아이방 1 책상 | 1 | `work-desk/bed-1240` |
| 책상 의자 | 1 | `desk-chair/default` |
| 작업 화면 | 1 | `work-equipment/display` |
| 키보드 | 1 | `work-equipment/keyboard` |
| 아이방 1 책장 | 1 | `cabinet-and-shelf/open-shelf/750x1200x400/open` |
| 작업등 | 1 | `portable-lamps/desk-task` |
| 천장 부착등 | 2 | `ceiling-surface-light/default` |
| 원형 러그 | 1 | `rugs/round1200` |
| 침구 세트 | 1 | `household-textiles/bedding-set` |
| 베개 | 2 | `household-textiles/pillow` |
| 책 | 6 | `books/240x35x160` |
| 액자 | 1 | `wall-art/default` |
| 장난감 상자 | 1 | `household-boxes/toy-box` |
| 소형 화분 | 1 | `potted-plant/280` |
| 컵 | 1 | `tabletop-props/cup` |

검증 분모: 이 구역 24개 전체. 같은 공간 ID를 쓰는 거실·식당·주방은 각각 독립 하위 모집단이다.

## 작은 침실 2 (23) {#child-bedroom-2}

현행 싱글 침대·책상·열린 선반·옷장 좌표를 기준으로 침구·책·작업 물체를 각각의 지지면에 놓는다. 바구니는 선반의 비점유 슬롯에 둔다.

| 독립 물체 | 수량 | 모델 상태 |
| --- | ---: | --- |
| 싱글 침대 | 1 | `fixed-bed/1000` |
| 아이방 2 옷장 | 1 | `cabinet-and-shelf/tall/1400x2600x540/closed` |
| 아이방 2 책상 | 1 | `work-desk/bed-1250` |
| 책상 의자 | 1 | `desk-chair/default` |
| 작업 화면 | 1 | `work-equipment/display` |
| 키보드 | 1 | `work-equipment/keyboard` |
| 아이방 2 열린 선반 | 1 | `cabinet-and-shelf/open-shelf/750x1200x400/open` |
| 작업등 | 1 | `portable-lamps/desk-task` |
| 천장 부착등 | 1 | `ceiling-surface-light/default` |
| 원형 러그 | 1 | `rugs/round1200` |
| 침구 세트 | 1 | `household-textiles/bedding-set` |
| 베개 | 2 | `household-textiles/pillow` |
| 책 | 6 | `books/240x35x160` |
| 액자 | 1 | `wall-art/default` |
| 수납 바구니 | 2 | `storage-basket/default` |
| 소형 화분 | 1 | `potted-plant/280` |

검증 분모: 이 구역 23개 전체. 같은 공간 ID를 쓰는 거실·식당·주방은 각각 독립 하위 모집단이다.

## 상층 욕실 (31) {#upper-bathroom}

현행 세면대·변기·샤워·수건장 좌표를 기준으로 세면 물체와 수건을 놓는다. 욕실 매트는 물기 구역의 바닥에 놓되 출입문과 변기 접근을 피한다.

| 독립 물체 | 수량 | 모델 상태 |
| --- | ---: | --- |
| 상층 세면대 | 1 | `basin/1000` |
| 변기 | 1 | `toilet/lid-open` |
| 샤워 설비 | 1 | `shower/default` |
| 욕조 | 1 | `bathtub/default` |
| 수건장 | 1 | `cabinet-and-shelf/open-shelf/600x1100x380/open` |
| 접힌 수건 | 6 | `folded-towels/120` |
| 칫솔 컵 | 2 | `bath-accessories/toothbrush-cup` |
| 칫솔 | 4 | `bath-accessories/toothbrush` |
| 비누 용기 | 2 | `bath-accessories/soap-dispenser` |
| 샴푸 병 | 2 | `bath-accessories/shampoo-bottle` |
| 세탁 바구니 | 1 | `bath-accessories/laundry-basket` |
| 욕실 매트 | 2 | `household-textiles/bath-mat` |
| 휴지 걸이 | 1 | `bath-accessories/tissue-holder` |
| 휴지 | 2 | `bath-accessories/tissue-roll` |
| 휴지통 | 1 | `bath-accessories/waste-bin` |
| 천장 부착등 | 3 | `ceiling-surface-light/default` |

검증 분모: 이 구역 31개 전체. 같은 공간 ID를 쓰는 거실·식당·주방은 각각 독립 하위 모집단이다.

## 상층 수납 (28) {#upper-storage}

현행 린넨장 중심 (-4.90,3.20,0.48)과 다섯 수건 더미를 기준으로 남은 시트·상자·베개를 분리된 선반 슬롯에 놓는다.

| 독립 물체 | 수량 | 모델 상태 |
| --- | ---: | --- |
| 린넨장 | 1 | `cabinet-and-shelf/open-shelf/1100x2600x500/open` |
| 상층 청소장 | 1 | `cabinet-and-shelf/tall/600x2300x500/closed` |
| 바구니 | 3 | `storage-basket/default` |
| 접힌 수건 | 8 | `folded-towels/120` |
| 접힌 시트 | 4 | `household-textiles/folded-sheet` |
| 베개 | 2 | `household-textiles/pillow` |
| 보관 상자 | 4 | `household-boxes/storage-box` |
| 청소 도구 | 2 | `household-tools/cleaning-tool` |
| 휴지 묶음 | 2 | `bath-accessories/tissue-pack` |
| 천장 부착등 | 1 | `ceiling-surface-light/default` |

검증 분모: 이 구역 28개 전체. 같은 공간 ID를 쓰는 거실·식당·주방은 각각 독립 하위 모집단이다.

## 설비실 (18) {#upper-service}

현행 세탁기·건조기와 점검 선반을 기준으로 세제·수건·공구를 지지면에 놓는다. 기계 외함의 점검 전면과 출입문을 비운다.

| 독립 물체 | 수량 | 모델 상태 |
| --- | ---: | --- |
| 세탁기 | 1 | `laundry-appliances/washer` |
| 건조기 | 1 | `laundry-appliances/dryer` |
| 점검 선반 | 1 | `cabinet-and-shelf/open-shelf/850x2400x450/open` |
| 기계 외함 | 1 | `cabinet-and-shelf/service/1100x2400x560/closed` |
| 세제 병 | 3 | `bath-accessories/detergent-bottle` |
| 빨래 바구니 | 2 | `bath-accessories/laundry-basket` |
| 청소 도구 | 2 | `household-tools/cleaning-tool` |
| 접힌 수건 | 4 | `folded-towels/120` |
| 공구 상자 | 1 | `household-tools/tool-box` |
| 천장 부착등 | 2 | `ceiling-surface-light/default` |

검증 분모: 이 구역 18개 전체. 같은 공간 ID를 쓰는 거실·식당·주방은 각각 독립 하위 모집단이다.

## 진입 외부·정원 (27) {#citizen-site}

건물 앞 진입 band x=1.30..2.90 및 보도·차양 정비 면을 비운다. 우편함·택배함은 출입 접근 측, 야외 좌석은 정원, 자전거와 도구는 서비스 측에 둔다.

| 독립 물체 | 수량 | 모델 상태 |
| --- | ---: | --- |
| 우편함 | 1 | `exterior-furnishings/mailbox` |
| 택배 보관함 | 1 | `household-boxes/parcel-locker` |
| 외부 벤치 | 1 | `exterior-furnishings/outdoor-bench` |
| 야외 의자 | 2 | `exterior-furnishings/outdoor-chair` |
| 작은 야외 탁자 | 1 | `exterior-furnishings/outdoor-table` |
| 화분 | 4 | `potted-plant/600` |
| 외부 조명 | 6 | `exterior-furnishings/garden-light` |
| 빗물통 | 1 | `exterior-furnishings/rain-barrel` |
| 정원 도구 | 3 | `household-tools/garden-tool` |
| 호스 릴 | 1 | `household-tools/hose-reel` |
| 쓰레기통 | 2 | `exterior-furnishings/outdoor-waste-bin` |
| 자전거 거치대 | 1 | `exterior-furnishings/bike-rack` |
| 자전거 | 2 | `exterior-furnishings/bicycle` |
| 현관 발판 매트 | 1 | `household-textiles/outdoor-mat` |

검증 분모: 이 구역 27개 전체. 같은 공간 ID를 쓰는 거실·식당·주방은 각각 독립 하위 모집단이다.
