# 실내 외피 마감

## 따뜻한 밝은 벽 도장 {#interior-wall-paint}

[실내 현관](../settings/10-house.md#entry)·[상층 복도](../settings/10-house.md#upper-hall)·침실의 밝은 벽과 [파우더룸](../settings/10-house.md#powder)의 따뜻한 흰 벽이다. 구성은 석고보드 위 무광 수성 도장이며 도막 두께는 형상에 반영하지 않는다. 값은 `#F1EEE6`(선형 0.880, 0.855, 0.791), roughness 0.60, metallic 0.0, transmission 0.0이다. 바깥 siding `#EDE8DC`보다 밝고 [흰 실내 trim](#interior-trim-white)보다 한 단계 따뜻해 문선이 벽에서 분리된다. 결합 면은 [방 내부의 완결 면 소유](../spaces/03-surface-owners.md#interior-surface-handoff)의 모든 방 owner가 가진 안쪽 벽 마감 구역이며, [욕실 벽 타일](#bath-wall-tile)이 덮는 구역은 제외하고 차고 내부 벽은 포함한다. source owner는 `src/materials/interior/walls.ts`이고, 리뷰는 실내 threshold view에서 켜진 따뜻한 천장등 아래 벽이 회색으로 가라앉지 않고 문선과 구별되는지를 관찰한다.

## 평평한 흰 천장 {#interior-ceiling}

모든 실내 천장의 무광 흰 도장이다. 값은 `#FAF9F6`(선형 0.956, 0.947, 0.922), roughness 0.65, metallic 0.0이다. 벽보다 밝고 차가워 벽과 천장의 모서리가 같은 조명에서 명도 차로 읽힌다. 결합 면은 각 방 owner의 보이는 천장 마감과 [계단실 위 높은 천장](../spaces/09-ceiling-assembly.md#upper-ceiling-closure)이며, 차고 천장은 같은 재료를 받는다. source owner는 `src/materials/interior/ceilings.ts`이고, 리뷰는 실내 모서리 view에서 벽·천장 경계가 보이고 천장이 발광판처럼 균일하게 타지 않는지를 관찰한다.

## 흰 실내 trim과 패널 문짝 {#interior-trim-white}

[03–05의 흰 실내 문선 및 패널문](../settings/10-house.md#openings)과 계단의 [흰 챌판과 기둥](../settings/10-house.md#stair)이다. 반광 도장 목재로 `#F4F2EC`(선형 0.905, 0.888, 0.839), roughness 0.35, metallic 0.0이다. 패널 분절은 문짝 모델 geometry가 만든다. 결합 면은 실내 문짝 양면과 모서리, 문선, 걸레받이, 창 안쪽 `interior-sill`([창의 표면 파티션](../models/01-windows.md#window-surface-partitions)), 계단 챌판과 난간 기둥, 수납장 문짝이다. source owner는 `src/materials/interior/trim.ts`이고, 리뷰는 05의 복도 view에서 흰 문짝과 문선이 벽과 분리되고 반광 하이라이트가 벽보다 좁은지를 관찰한다.

## 참나무색 마루 {#oak-floor}

[실내 현관의 참나무색 마루](../settings/10-house.md#entry)이고 1층 거실·공용부·서비스 통로·팬트리에 이어진다. 구성은 폭 0.13 m 판의 오일 마감 원목 마루이며 판 이음 선은 비트맵이 아니라 방 owner의 바닥 geometry 분할로만 표현한다. 값은 `#B08050`(선형 0.434, 0.216, 0.080), roughness 0.50, metallic 0.0이다. 결합 면은 entry·living·common·service·pantry owner의 보이는 바닥 마감이다. 문턱에서 다른 재료로 바뀌는 선은 [실내 경계의 문턱](../spaces/07-boundary-assembly.md#interior-boundary-junctions)을 따른다. source owner는 `src/materials/interior/floors.ts`이고, 리뷰는 04와 03의 비교 view에서 마루가 꿀빛으로 읽히고 파우더룸·세탁실 문턱에서 끊기는지를 관찰한다.

## 밝은 목재 계단 디딤판 {#stair-tread-wood}

[밝은 목재 디딤판](../settings/10-house.md#stair)은 [참나무색 마루](#oak-floor)와 같은 재료 값을 쓴다. 계단은 현관 마루에서 올라가므로 같은 수종으로 이어지는 것이 04의 관계이며 별도 색을 만들 근거가 없다. 결합 면은 [단일 L형 계단](../spaces/02-stair.md#stair-reservation) owner의 디딤판 윗면·앞 모서리와 중간참 바닥이다. 챌판은 [흰 실내 trim](#interior-trim-white)이다. source owner는 `src/materials/interior/stair.ts`이고, 리뷰는 계단 단면과 04 view에서 흰 챌판과 목재 디딤판이 층마다 번갈아 읽히는지를 관찰한다.

## 목재 난간 손잡이 {#handrail-wood}

[목재 손잡이](../settings/10-house.md#stair)와 [상층 복도의 목재 손잡이](../settings/10-house.md#upper-hall)다. 오일 마감 경목으로 `#8A5A34`(선형 0.254, 0.102, 0.034), roughness 0.45, metallic 0.0이다. 디딤판보다 어두워 흰 기둥과 검은 난간살 위에서 선으로 읽힌다. 결합 면은 계단과 [계단 개구부 보호 경계](../spaces/02-stair.md#stair-boundary-heights)의 손잡이 전체 면이다. source owner는 `src/materials/interior/stair.ts`이고, 리뷰는 04와 05에서 손잡이가 끊김 없이 한 재료로 이어지는지를 관찰한다.

## 검은 도장 금속 {#black-coated-metal}

[검은 수직 철제 난간살](../settings/10-house.md#stair)과 [검은 금속 손잡이](../settings/10-house.md#shower-bathroom), 현관의 [어두운 손잡이](../settings/10-house.md#porch-entry)다. 분체 도장 강재이므로 [거칠기·금속성 관례](00-material-frame.md#material-response-conventions)에 따라 metallic 0.0이며 `#1F1F20`(선형 0.014, 0.014, 0.014), roughness 0.40이다. 결합 면은 난간살, 실내외 문 손잡이, 샤워부스 손잡이, 수건걸이·커튼 레일이다. source owner는 `src/materials/interior/metal.ts`이고, 리뷰는 흰 벽 앞에서 난간살 하나하나가 분리되어 보이는지를 관찰한다.

## 베이지 카펫 {#beige-carpet}

[상층 복도의 베이지 카펫](../settings/10-house.md#upper-hall)과 [주침실](../settings/10-house.md#primary-bedroom)·[두 작은 침실](../settings/10-house.md#bedroom-two)의 중성 카펫을 한 재료로 정한다. 한 재료로 두는 이유는 두 작은 침실이 주침실의 재료 체계를 잇는다는 settings 조건이다. 값은 `#CDBFA6`(선형 0.610, 0.521, 0.381), roughness 0.95, metallic 0.0이다. 결합 면은 upper-hall·primary·wardrobe·bedroom-two·bedroom-three owner의 보이는 바닥 마감이며 [욕실 문턱에서 끝난다](../settings/10-house.md#shower-bathroom). source owner는 `src/materials/interior/floors.ts`이고, 리뷰는 05 view에서 카펫이 마루보다 밝고 하이라이트 없이 읽히며 욕실 문턱에서 타일과 경계가 맞는지를 관찰한다.

## 욕실 바닥 타일 {#bath-floor-tile}

[밝은 타일 바닥](../settings/10-house.md#powder)과 욕실의 방수 바닥이다. 유약 자기질 타일 0.30 m 모듈이며 줄눈은 geometry가 오목하게 만든 면에 [타일 줄눈](#tile-grout)을 결합한다. 값은 `#D8D4CC`(선형 0.687, 0.658, 0.604), roughness 0.40, metallic 0.0이다. 벽 타일보다 어두워 바닥과 벽의 경계가 읽힌다. 결합 면은 powder·shower-bath·tub-bath owner의 보이는 바닥 마감이다. source owner는 `src/materials/interior/tile.ts`이고, 리뷰는 욕실 threshold view에서 바닥·벽 타일이 구별되는지를 관찰한다.

## 욕실 벽 타일 {#bath-wall-tile}

[흰 타일](../settings/10-house.md#shower-bathroom)과 주방의 [타일 backsplash](../settings/10-house.md#kitchen-equipment)다. 유약 도기 타일로 `#EEEDEA`(선형 0.855, 0.847, 0.823), roughness 0.30, metallic 0.0이다. 결합 면은 샤워부스 안 벽, 욕조 주위 벽, 주방 하부장과 상부장 사이 벽 구역이며, 그 구역의 경계는 host owner의 기구·수납 끝선을 따른다. source owner는 `src/materials/interior/tile.ts`이고, 리뷰는 05와 03 view에서 흰 타일이 벽 도장과 광택 차이로 구별되는지를 관찰한다.

## 타일 줄눈 {#tile-grout}

두 타일 재료의 줄눈 면이다. 시멘트 줄눈으로 `#A9A39A`(선형 0.397, 0.366, 0.323), roughness 0.90, metallic 0.0이다. 결합 면은 타일 geometry의 오목한 줄눈 면뿐이며 타일 윗면에 선을 칠하지 않는다. source owner는 `src/materials/interior/tile.ts`이고, 리뷰는 근접 view에서 줄눈 격자가 모듈과 일치하고 색 패치가 아닌 음영으로 읽히는지를 관찰한다.

## 세탁실 밝은 회색 바닥 {#laundry-floor}

[밝은 회색의 내구성 바닥](../settings/10-house.md#laundry-mudroom)이다. 비닐 판 바닥으로 `#C9C4BA`(선형 0.584, 0.552, 0.491), roughness 0.50, metallic 0.0이다. [차고 콘크리트](#garage-concrete)보다 밝고 매끈해 두 바닥이 같은 문턱에서 구별된다. 결합 면은 laundry owner의 보이는 바닥 마감과 머드룸 쪽 높은 문턱 챌면이다. source owner는 `src/materials/interior/floors.ts`이고, 리뷰는 머드룸 문 view에서 두 바닥의 명도·광택 차를 관찰한다.

## 차고 콘크리트 {#garage-concrete}

[차고의 콘크리트 바닥과 내부](../settings/10-house.md#garage)다. 흙손 마감 콘크리트 바닥으로 `#9C9890`(선형 0.332, 0.314, 0.279), roughness 0.85, metallic 0.0이다. 차고 내부 벽은 도장 석고보드이므로 [실내 벽 도장](#interior-wall-paint)을 받고 회색 변형을 따로 두지 않는다. 결합 면은 [garage-interior](../spaces/rooms/garage-interior.md#garage-interior-plan) owner의 노출 콘크리트 상면이다. source owner는 `src/materials/interior/floors.ts`이고, 리뷰는 차고 코너 view에서 바닥이 포장 콘크리트보다 어둡고 거칠게 읽히는지를 관찰한다.
