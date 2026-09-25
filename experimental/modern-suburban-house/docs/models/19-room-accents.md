# 방의 작은 생활 소품

## 낮은 탁자 위의 책·쟁반·꽃병 {#living-tabletop-props}
<!--
@evidence principles/core/common.md#scope-preservation 11의 낮은 탁자 위 소품만 맡고 상판과 다리를 다시 만들지 않는다.
@evidence principles/core/common.md#substantive-completion 책 두 권·쟁반 하나·꽃병 하나의 개수와 각 외곽·꽃 세 줄기를 정한다 세 꽃줄기의 120° 간격·0.015 m 시작 반지름과 꽃 덩어리 접점을 정한다.
@evidence principles/core/common.md#declared-basis 레퍼런스 04의 커피테이블 위 책·쟁반·꽃을 채택하고 11의 상판 안에 담는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 낮은 목재 탁자의 빈 상판에 소량 물건을 올려 가구 자체와 별도 부품으로 만든다.
@evidence principles/design/models.md#representation-contract 닫힌 책·쟁반·꽃병·줄기·꽃 덩어리를 `book`·`tray`·`container`·`stem`·`foliage`로 나눈다.
@evidence principles/design/models.md#spatial-convention 원점은 각 host 상판 접점 중앙, +Y는 위이고 배치 yaw와 위치는 instances가 정한다.
@evidence principles/design/models.md#reviewable-structure 위에서 낮은 탁자의 0.50/0.55 m 폭을 넘지 않는지, 측면에서 착석 시야를 가리지 않는지 확인한다.
@evidence principles/design/models.md#model-observable-style-basis 얇은 책·얕은 쟁반·작은 꽃병의 다른 높이가 04의 실제 사용 중인 탁자 실루엣을 만든다.
@evidence principles/design/models.md#model-scale-layer-completion 소품 개수·치수·접점·표면 id·UV·검사 뷰를 결정한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 모든 물건은 11의 이미 예약된 상판 안에 놓아 방 경계·통행을 바꾸지 않는다.
@evidence settings/10-house.md#living 04의 낮은 테이블을 생활 소품이 있는 상태로 읽게 한다.
@evidence obligations/design/models.md#addressable-model-decisions 탁자 구조와 소품을 다른 H2에서 소유한다.
@evidence obligations/design/models.md#model-review-set 00의 정면·측면·45°와 04 거실 뷰를 대조한다.
-->

레퍼런스 04의 낮은 탁자에는 책과 쟁반, 꽃이 있다. [낮은 탁자](11-living.md#low-table)의 상판을 host로 삼고 책 두 권은 각각 0.22 × 0.16 × 0.025 m, 쟁반은 0.24 × 0.18 × 0.025 m, 꽃병은 아래 지름 0.08 m·윗지름 0.06 m·높이 0.12 m다. 꽃병에는 지름 0.004 m·길이 0.12 m의 줄기 세 개와 각 끝의 지름 0.04 m 닫힌 꽃 덩어리 세 개를 둔다. 전체 높이는 상판 위 0.28 m 이하이며 착석 시야를 가리지 않는다. 책의 모든 면은 `book`, 쟁반은 `tray`, 꽃병은 `container`, 줄기는 `stem`, 꽃 덩어리는 `foliage`다. UV는 판 가로·세로 또는 둘레·높이를 미터로 둔다. 소품 원점은 상판 접점 중앙이고 실제 놓는 좌표는 instances가 1.30 × 0.50 m와 1.10 × 0.55 m 상판 중 선택한 host에 맞춰 결정한다. 글자·개별 꽃잎은 표현하지 않는다. 레퍼런스 04의 안락의자 옆 별도 탁자는 [거실 예약](../spaces/rooms/living.md#living-furniture-use)의 주 통행 띠·의자 사용·책장 접근 구간과 겹칠 별도 0.40 m 박스가 없어 채택하지 않는다. 이 거부는 04의 중심 커피테이블 원형을 없애지 않는다. 소스 owner는 `src/models/furnishings/props.ts`; 실제 간섭과 프레임은 unverified다.
탁자 꽃의 세 줄기 시작은 꽃병 입구 중심에서 수평 반지름 0.015 m, 방위각 0·120·240°이고 각 끝의 높이는 꽃병 입구 위 0.12 m다. 지름 0.04 m 꽃 덩어리의 중심은 줄기 끝보다 0.02 m 높여 줄기 끝면과 면으로만 맞댄다. 액자의 `art-print` 판은 폭·높이에서 테 0.025 m씩 뺀 작은 변형 0.45×0.30 m 또는 큰 변형 0.55×0.35 m, 두께 0.002 m이고 뒤판에서 앞쪽 0.018 m에 아랫면을 둔다.

## 벽 액자와 상판 위 작은 식물 {#wall-art-indoor-plant}
<!--
@evidence principles/core/common.md#scope-preservation 기존 벽에 거는 액자와 이미 예약된 가구 상판 위 식물만 맡고 벽·가구 면을 만들지 않는다.
@evidence principles/core/common.md#substantive-completion 액자 0.50 × 0.35/0.60 × 0.40 m, 화분 외경 0.18 m·전체 높이 0.55 m와 부품·면을 정한다 액자 인쇄 판의 두 폭·높이와 두께 0.002 m·뒤판 앞 깊이 0.018 m도 정한다.
@evidence principles/core/common.md#declared-basis 레퍼런스 02–05의 액자와 04·05의 화분을 채택하고 방의 창·문·통행과 겹치지 않는 host 결속을 요구한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 벽 장식과 실내 식물의 새 면만 더하며 실내 공간 그래프와 예약 가구의 표면 소유는 유지한다.
@evidence principles/design/models.md#representation-contract 액자는 `art-frame`·`art-print`, 화분은 `container`·`stem`·`foliage`로 모든 닫힌 면을 덮는다.
@evidence principles/design/models.md#spatial-convention 액자 원점은 벽 접점 중앙, 화분은 가구 상판 접점 중앙, +Y 위·액자 +Z 방 쪽이다.
@evidence principles/design/models.md#reviewable-structure 액자 측면 두께와 문선·창틀 비접촉, 식물의 상판 접지·창 하부 접근을 확인한다.
@evidence principles/design/models.md#model-observable-style-basis 얇은 테·별도 인쇄면과 갈라진 식물 수관이 방을 빈 상자와 구별하고 실제 그림과 잎 무늬는 materials로 넘긴다.
@evidence principles/design/models.md#model-scale-layer-completion 두 액자와 식물의 치수·면 id·미터 UV·원점·검사 주소를 정한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 액자는 이미 닫힌 벽, 식물은 이미 예약된 상판 위에만 두어 공간 경계를 바꾸지 않는다.
@evidence settings/10-house.md#living 거실 벽과 책장에 어울리는 액자·화분 원형을 제공한다.
@evidence settings/10-house.md#primary-bedroom 상층 개인실의 작은 벽 장식과 상판 식물을 제공한다.
@evidence obligations/design/models.md#addressable-model-decisions 인쇄면·테와 식물 부피의 면을 이 H2에서 독립 결정한다.
@evidence obligations/design/models.md#model-review-set 00의 측면·정면 및 02–05 실내 뷰를 대조한다.
-->

레퍼런스 02–05의 벽 액자와 04–05의 실내 식물을 채택한다. 액자는 작은 변형 0.50 × 0.35 m, 큰 변형 0.60 × 0.40 m, 깊이 0.025 m다. 뒤판의 벽 접점 중앙이 원점, +Z는 방 쪽이다. 테는 사방 폭 0.025 m·깊이 0.025 m의 닫힌 `art-frame`, 인쇄면은 뒤판에서 0.018 m 앞에 있는 `art-print`이며 뒤판 면도 `art-frame`이다. 인쇄면 UV는 왼쪽 아래 (0,0), 가로 U·세로 V 미터 좌표다. 다른 그림 내용은 materials가 결정적으로 만든다.

상판 식물은 아래 지름 0.14 m·입술 지름 0.18 m·용기 높이 0.17 m, 줄기 세 개(지름 0.012 m·길이 0.22 m), 닫힌 잎 군집 세 개(각 지름 0.16 m·높이 0.16 m)로 구성한다. 줄기와 군집은 0.03 m 겹쳐 연결되어 전체 높이는 0.17 + 0.22 + 0.16 − 0.03 = 0.52 m다. 최대 높이 0.55 m 이내다. 각 닫힌 면은 `container`·`stem`·`foliage` 중 하나이고 둘레 U·높이 V를 미터로 둔다. instances는 닫힌 벽이나 이미 예약된 책장·서랍장·선반 상판에서 위치를 산출하며 새 바닥 점유를 만들지 않는다. 소스 owner는 `src/models/furnishings/props.ts`; 실제 벽 바인딩·렌더는 unverified다.

## 소파의 보조 쿠션과 담요 {#sofa-throws}
<!--
@evidence principles/core/common.md#scope-preservation 세 좌석 쿠션과 팔걸이 몸체를 11에 남기고 보조 쿠션 둘·접은 담요 하나만 맡는다.
@evidence principles/core/common.md#substantive-completion 쿠션 둘 각 0.42 × 0.42 × 0.10 m와 담요 0.65 × 0.45 × 0.025 m를 정한다.
@evidence principles/core/common.md#declared-basis 레퍼런스 02–04의 소파 위 보조 쿠션·담요를 채택하고 11의 소파 좌면에 결속한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 기본 소파의 세 좌석 칸 위에 새로운 직물 층을 얹되 좌석 수는 바꾸지 않는다.
@evidence principles/design/models.md#representation-contract 닫힌 쿠션 두 부피와 접힌 담요 판을 만들고 `pillow`·`folded`가 모든 면을 덮는다.
@evidence principles/design/models.md#spatial-convention 원점은 소파 좌면 접점, +Z는 소파 앞, +Y는 위이며 world 배치는 host 소파를 상속한다.
@evidence principles/design/models.md#reviewable-structure 세 좌석과 두 보조 쿠션을 정면에서 구분하고 담요가 팔걸이 밖으로 나오지 않는지 측면에서 본다.
@evidence principles/design/models.md#model-observable-style-basis 회색 소파 위 다른 직물 두 층이 생활감을 더하고 색·짜임은 materials에서 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 개수·외곽·접점·id·UV·검사 주소를 정한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 소파 외곽 안에만 소품을 놓아 방 예약·통로를 바꾸지 않는다.
@evidence settings/10-house.md#living 04의 패브릭 소파 위 보조 직물을 제공한다.
@evidence settings/10-house.md#common-room 가족실 소파에도 같은 원형을 쓴다.
@evidence obligations/design/models.md#addressable-model-decisions 구조 쿠션과 보조 직물을 다른 H2에서 소유한다.
@evidence obligations/design/models.md#model-review-set 00의 정면·측면·45°와 03·04 실내 뷰를 대조한다.
-->

레퍼런스 02–04의 소파는 [구조 원형의 세 좌석 쿠션](11-living.md#fabric-sofa) 외에 보조 쿠션과 담요가 보인다. 보조 쿠션은 각각 0.42 × 0.42 × 0.10 m의 닫힌 둥근 모서리 부피 두 개로 등받이 앞 좌우에 놓는다. 담요는 펼친 길이 0.65 m·깊이 폭 0.45 m·두께 0.025 m의 직물을 소파 오른쪽 팔걸이 상면에서 길이 0.13 m씩 다섯 번 접는다. 소파 중심 국소 좌표에서 접힌 다섯 판은 모두 X=[0.92,1.05]·Z=[0.25,0.70] m이고 아래부터 i=0…4에 대해 Y=[0.62+0.025i,0.645+0.025i] m다. 이웃 판은 수평 접면에서만 만나며 팔걸이 `arm`의 상면 Y=0.62 m에 얹힌다. 가장 높은 면 Y=0.745 m는 소파 등받이 상단 0.90 m보다 낮고 모든 판은 소파 외곽 X=1.05 m 안에 있다. 쿠션의 모든 면은 `pillow`, 담요의 양면과 절단 끝은 `folded`다. 원점은 소파 좌면 접점, +Z는 앞쪽이고 UV는 펼친 담요의 길이 방향 U·깊이 방향 V를 접힘선에서 연속해 1 UV/m로 둔다. 장식 술·주름은 만들지 않는다. 소스 owner는 `src/models/furnishings/props.ts`; 실제 소파 결속과 렌더는 unverified다.
