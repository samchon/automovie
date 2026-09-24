# 생활 소품 원형

## 포치의 발판과 작은 화분 {#porch-mat-planter}
<!--
@evidence principles/core/common.md#scope-preservation 현관문 바깥의 발판과 독립 화분 한 원형씩 맡고 포치 바닥·문짝·기둥을 만들지 않는다.
@evidence principles/core/common.md#substantive-completion 발판 0.60 × 0.40 × 0.008 m, 지름 0.28 m 화분과 길이 0.19 m 줄기 다섯·높이 0.25 m 잎 군집 다섯을 정하고 최고점 약 0.7103 m가 전체 0.72 m 안임을 산출한다.
@evidence principles/core/common.md#declared-basis settings/10-house.md#porch-entry의 발판·작은 화분과 spaces/porch.md#porch-platform-access의 진입 폭 밖 조건을 직접 소비한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 레퍼런스 01의 진입 작은 소품을 낮은 발판과 둥근 화분으로 채택하며 포치 계단과 문 자체의 소유는 유지한다.
@evidence principles/design/models.md#representation-contract 발판 `field`·`border`, 화분 `container`·`foliage`·`stem`의 닫힌 부품을 낸다. 실제 흙·개별 꽃잎은 표현하지 않는다.
@evidence principles/design/models.md#spatial-convention 발판은 바닥 중심, 화분은 바닥 중심을 원점으로 두며 +Y가 위다. world 배치는 포치 예약을 읽는 instances가 정한다.
@evidence principles/design/models.md#reviewable-structure 포치 정면에서 문·계단을 막지 않는 소품 크기와 측면에서 발판 높이·화분 접지를 검사한다.
@evidence principles/design/models.md#model-observable-style-basis 얇은 섬유 발판과 벌어진 입술이 있는 둥근 화분의 별도 부피가 레퍼런스 01 진입에 생활감만 더한다.
@evidence principles/design/models.md#model-scale-layer-completion 각 외곽·부품·id·UV·원점·관찰 주소가 정해져 위치만 후속 배치에 남는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 포치의 문축과 진입 폭 밖 조건을 소비하고 구조나 동선을 넓히지 않는다.
@evidence settings/10-house.md#porch-entry 현관 옆 발판·화분 두 소품을 원형으로 제공한다.
@evidence spaces/porch.md#porch-platform-access 발판·화분은 포치 바닥 위의 후속 부재이며 진입 폭 밖에 배치하도록 인계한다.
@evidence obligations/design/models.md#addressable-model-decisions 발판과 화분의 형상·면을 이 H2에서 정하고 포치 구조 owner와 분리한다.
@evidence obligations/design/models.md#model-review-set 00의 정면·측면·45°와 레퍼런스 01 외관 포치 뷰에서 대조한다.
-->

레퍼런스 01의 현관 계단 위 발판과 문 옆 작은 화분을 채택한다. 보행 순폭은 포치 예약으로 검사한다.

[현관 포치 설정](../settings/10-house.md#porch-entry)은 발판과 작은 화분을 요구한다. 실내 현관 매트와 별개로 문 바깥에 놓는 발판은 길이 0.60 m·폭 0.40 m·두께 0.008 m다. 바닥 중심을 원점으로 하고 둘레 0.025 m는 `border`, 안쪽은 `field`로 모든 상·하·옆면을 덮는다. 화분은 바닥 중심 원점, 아래 지름 0.20 m·입술 지름 0.28 m·용기 높이 0.28 m의 12각 테이퍼 몸과 높이 0.025 m 입술 테다. 안쪽에는 지름 0.025 m·길이 0.19 m의 줄기 다섯과, 각 줄기 끝의 지름 0.12 m·높이 0.25 m 닫힌 잎 군집 다섯을 72°씩 벌려 전체 높이 0.72 m 이내로 둔다. 줄기 i의 시작은 용기 중심 위 (0, 0.28, 0) m이고 끝은 수평 반지름 0.06 m, 방위각 72i°와 높이 `0.28 + √(0.19² − 0.06²)` m이다. 잎 군집은 그 끝에서 위로 0.25 m 뻗으므로 최고점은 약 0.7103 m다. 용기·줄기·잎 군집의 모든 면은 각각 `container`, `stem`, `foliage`이고 몸통 둘레 U·높이 V를 미터로 제공한다. 흙·개별 잎·꽃잎은 표현하지 않는다. 위치와 회전은 [포치 진입 폭](../spaces/porch.md#porch-platform-access)을 읽는 instances가 정하고 계단·문짝을 침범하면 실패다. 소스 owner는 `src/models/furnishings/props.ts`; 실제 GPU 프레임은 unverified다.

## 주방과 식탁의 식료품·조리도구 {#kitchen-food-utensils}
<!--
@evidence principles/core/common.md#scope-preservation 작업면 위의 소량 식료품과 조리도구, 식탁 과일 그릇의 원형을 맡고 캐비닛·싱크·가전 원형은 10에 남긴다.
@evidence principles/core/common.md#substantive-completion 도마·도구통·다섯 도구·밀폐 용기·과일 그릇과 과일 다섯의 부피를 정하고, 과일 넷은 반지름 0.08 m 원 위·다섯째는 중앙에 둬 중심 간격 0.08 m가 최대 반지름 합 0.0775 m보다 크다고 산출한다.
@evidence principles/core/common.md#declared-basis settings/10-house.md#kitchen-equipment의 작업면을 가리지 않는 식료품 일부·조리도구와 레퍼런스 03의 식탁 그릇을 근거로 택한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 실제 조리대는 비워 쓸 수 있도록 0.35 m 도마와 작은 도구통만 두고 식탁 중심에는 낮은 과일 그릇 하나를 둔다.
@evidence principles/design/models.md#representation-contract 닫힌 도마·도구통·막대 도구·그릇·과일 부피의 모든 면을 `cutting-board`·`container`·`utensil`·`bowl`·`fruit`로 나눈다.
@evidence principles/design/models.md#spatial-convention 각 원점은 놓이는 상판 접점 중심이며 +Y가 위, +Z는 사용자가 보는 앞이다. world 배치는 host 상판에서 instances가 계산한다.
@evidence principles/design/models.md#reviewable-structure 위에서 싱크·조리면·식탁 좌석을 가리지 않는 점유, 측면에서 조리도구와 과일의 낮은 실루엣을 확인한다.
@evidence principles/design/models.md#model-observable-style-basis 다섯 도구의 서로 다른 끝 모양과 그릇 안의 다섯 둥근 과일이 빈 상판과 구별되며 색은 materials가 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 모든 부품 치수·개수·접점·면 id·UV·검사 뷰를 정한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 10의 상판 크기와 공용부 통로를 소비하고 새 수전이나 캐비닛을 요구하지 않는다.
@evidence settings/10-house.md#kitchen-equipment 조리도구와 식료품 일부를 작업면에 올리되 식기세척기·싱크를 가리지 않는다.
@evidence settings/10-house.md#common-room 레퍼런스 03의 식탁 위 과일 그릇을 가구가 아닌 낮은 상판 소품으로 채택한다.
@evidence obligations/design/models.md#addressable-model-decisions 식품 소품과 상판 부재를 별개 H2로 분리해 개수·점유를 추적한다.
@evidence obligations/design/models.md#model-review-set 00의 위·정면·측면과 레퍼런스 03 공용부 뷰에서 검사한다.
-->

[주방 설비 설정](../settings/10-house.md#kitchen-equipment)은 식료품 일부와 조리도구를 요구한다. 모델은 각 상판의 접점 중심에 원점을 둔다. 도마는 0.35 × 0.25 × 0.02 m의 둥근 모서리 판, 도구통은 아래 지름 0.10 m·위 지름 0.12 m·높이 0.18 m의 열린 12각 용기다. 도구 다섯은 지름 0.012 m·길이 0.25 m 막대에 끝 폭 0.03 m 납작 주걱 둘, 지름 0.035 m 숟가락 둘, 지름 0.04 m 거품기 하나를 붙이고 각 끝은 원형의 전체 높이 0.38 m 이내다. 작은 식료품 병은 0.12 × 0.12 × 0.20 m 한 개이며 [팬트리 용기](12-service-rooms.md#pantry-containers)와 같은 부피 원형을 재사용한다. 도마·통·도구·병의 배치는 싱크·조리면·벽 주방 준비면을 가리지 않는 host 상판 좌표에서 instances가 맡는다.

식탁에는 외경 0.28 m·높이 0.075 m·벽 두께 0.008 m의 열린 16각 그릇 하나를 두고 과일 다섯을 순번 i = 0…4에 대해 지름 `0.06 + 0.005i` m인 닫힌 12각 타원체로 둔다. 과일 i = 0…3의 중심은 그릇 중심에서 반지름 0.08 m의 원 위에 90i°로 두고, i = 4만 정확히 중앙에 둔다. 가장 큰 둘레 과일 반지름 0.0375 m와 중앙 과일 반지름 0.04 m의 합 0.0775 m보다 중심 간격 0.08 m가 커서 겹치지 않는다. 표면은 도마 `cutting-board`, 통·병 `container`, 도구 `utensil`, 그릇 `bowl`, 과일 `fruit`다. 모든 닫힌 면은 정확히 한 id를 가지며 평면은 X·Z, 측면은 둘레 U·높이 V 미터 UV를 둔다. 레퍼런스 03의 식탁 과일 그릇을 채택하고 두 번째 수도꼭지와 과도한 식품 진열은 [설정의 채택 범위](../settings/10-house.md#kitchen-equipment)에 따라 두지 않는다. 소스 owner는 `src/models/furnishings/props.ts`; 실제 상판 점유와 프레임은 unverified다.

## 린넨장의 접힌 수건 {#linen-folded-towels}
<!--
@evidence principles/core/common.md#scope-preservation 린넨장 선반 위 접힌 수건만 맡고 선반·문짝은 05 원형에 남긴다.
@evidence principles/core/common.md#substantive-completion 선반 다섯에 가로 세 더미씩, 각 더미 두 장으로 총 30장의 치수·간격을 정한다.
@evidence principles/core/common.md#declared-basis settings/10-house.md#storage의 접힌 수건 선반과 models/05-closet-fittings.md#linen-closet-fittings의 다섯 선반·깊이를 소비한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 빈 린넨 선반을 가로 세 더미의 접힌 직물로 채우되 미닫이 문과 선반 몸체는 복제하지 않는다.
@evidence principles/design/models.md#representation-contract 모서리가 약간 둥근 닫힌 직물 부피 30개를 `folded` 한 id로 덮고 실밥·개별 섬유는 표현하지 않는다.
@evidence principles/design/models.md#spatial-convention 각 더미 원점은 선반 상면의 뒤쪽 가운데, +Y 위, +Z는 문 쪽이다. 선반 상면을 배치가 제공한다.
@evidence principles/design/models.md#reviewable-structure 문을 연 정면에서 다섯 층의 수건이 보이는지, 측면에서 문 트랙과 옷감이 겹치지 않는지 확인한다.
@evidence principles/design/models.md#model-observable-style-basis 레퍼런스 05의 욕실·복도 수납에서 보이는 접힌 직물을 린넨장 수건 더미로 채택한다. 흰 수건의 반복 더미가 식품 용기 팬트리와 다른 수납 역할을 드러내고 실제 직조 결은 materials가 맡는다.
@evidence principles/design/models.md#model-scale-layer-completion 개수·치수·배치 산식·표면 id·UV·국소 프레임과 검사 주소가 정해졌다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 상층 린넨장 선반의 0.55 m 깊이와 다섯 상면을 그대로 소비해 부모를 수정하지 않는다.
@evidence settings/10-house.md#storage 계단참 가까운 린넨장의 접힌 수건을 원형으로 제공한다.
@evidence spaces/rooms/upper-hall.md#upper-linen-storage 복도 수납에 다섯 선반과 문으로 직접 닿는 바인딩을 소비한다.
@evidence obligations/design/models.md#addressable-model-decisions 수건 원형을 05의 선반 부재와 별개 H2로 두어 재료·개수를 따로 추적한다.
@evidence obligations/design/models.md#model-review-set 00의 정면·측면·45°와 상층 복도 threshold 뷰에서 검사한다.
-->

레퍼런스 05의 욕실·복도 수납에서 보이는 접힌 직물을 린넨장 수건 더미로 채택한다. 접힘 층수는 사진을 세지 않고 선반 길이로 산출한다.

[수납 설정](../settings/10-house.md#storage)의 접힌 수건은 [린넨장 다섯 선반](05-closet-fittings.md#linen-closet-fittings) 위의 후속 소품이다. 한 장의 외곽은 가로 0.28 m·깊이 0.32 m·높이 0.06 m다. 한 더미는 두 장을 쌓아 높이 0.12 m이며 각 선반에는 더미 세 개를 좌우 0.02 m 간격으로 놓는다. 가로 합 3 × 0.28 + 2 × 0.02 = 0.88 m로 선반 길이 1.00 m에 양끝 0.06 m씩 남는다. 뒤면에서 0.05 m 띄워 깊이 0.32 m를 차지하므로 0.55 m 선반 앞쪽에 0.18 m가 남고 문 트랙으로 돌출하지 않는다. 다섯 선반 × 세 더미 × 두 장 = 30장이다. 수건의 모든 면은 `folded`이고 가로 U·깊이 V를 미터로 둔다. 접힌 모서리는 반지름 0.008 m로 둥글리되 별도의 봉제선·섬유 메시를 만들지 않는다. 위치는 선반 원형의 상면과 문 열린 상태를 읽는 instances가 계산한다. 소스 owner는 `src/models/furnishings/props.ts`; 실제 수납 프레임은 unverified다.
