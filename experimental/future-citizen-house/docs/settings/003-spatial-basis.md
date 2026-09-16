# 공간 기준

## 좌표와 전체 치수 {#coordinate-datum}

**Status:** production choice, reference pixel 비례가 아닌 구조·동선·시각 blocking을 함께 만족시키기 위해 정한 값.

세계 단위는 m이며 오른손 `Y-up` 좌표를 쓴다. 평면에서 +X는 동쪽, +Z는 후면이며 전면은 -Z다. 외곽 기준은 x=-5.5..5.5, z=-6.0..6.0인 11.0×12.0m 직사각형이다. 완성 바닥면적은 외곽 132㎡에서 벽체·계단·설비 코어를 제외한 약 250㎡ 목표 범위로 읽는다.

1층 finished floor는 y=0, 2층 finished floor는 y=3.0이며 slab은 0.20m다. 실내 clear height는 각 층 2.70m를 목표로 한다. 외피는 0.24m opaque wall 또는 0.12m curtainwall assembly로 모델링하고, 지붕 구조 상단은 y=6.20, PV canopy 상단은 약 y=6.80으로 둔다.

## 1층 공간 그래프 {#ground-graph}

1층은 `entry`가 유일한 전면 진입 node다. `flex-workroom`은 entry에 직접 붙고, `common-room`은 entry에 직접 붙으며 living·dining·kitchen이 후면을 따라 하나의 연속 공간을 이룬다. `powder-utility`와 `storage-1f`는 우측 opaque service core 안에서 entry/common에 각각 직접 붙는다. 계단은 entry에서 시작해 하나의 중간 landing을 거쳐 `upper-corridor`로 올라간다.

선택한 room bounds는 다음과 같다. bounds는 wall face 안쪽의 논리 범위이며, 실제 wall thickness와 door reveal은 source가 함께 낸다: `entry` x=-1.55..1.55, z=-5.76..-2.90; `flex-workroom` x=-5.26..-1.80, z=-5.76..-2.90; `common-room` x=-5.26..3.26, z=-2.66..5.76; `powder-utility` x=3.26..5.26, z=-5.76..-2.66; `storage-1f` x=3.26..5.26, z=-2.66..0.10.

## 2층 공간 그래프 {#upper-graph}

2층은 `upper-corridor` 하나만 공용 circulation spine으로 갖는다. corridor는 계단 landing에서 시작해 primary bedroom, child bedroom 2, child bedroom 1, upper bathroom, upper storage의 문에 직접 닿는다. `upper-service`는 우측 core의 설비·덕트 zone이며 corridor에서 직접 접근 가능한 수납·점검 영역으로 둔다. branch corridor, second stair, disconnected room은 없다.

선택한 upper bounds는 다음과 같다: `primary-bedroom` x=-5.26..0.00, z=2.66..5.76; `child-bedroom-2` x=-5.26..0.00, z=-0.02..2.60; `child-bedroom-1` x=-5.26..0.00, z=-5.76..-0.04; `upper-corridor` x=0.20..1.90, z=-4.30..2.60; `upper-bathroom` x=1.90..5.26, z=1.60..4.40; `upper-storage` x=1.90..5.26, z=0.00..1.50; `upper-service` x=1.90..5.26, z=-5.76..-0.04.

## 외피·개구부·프라이버시 {#envelope-and-privacy}

전면 stair bay, 전면 flex bay, 후면 common bay, 2층 전면 bedroom/corridor bay는 내부 floor line과 room boundary에 맞춘 1.20m nominal curtainwall module로 나눈다. 우측 x=5.50 쪽은 opaque service wall로 묶고, 좌측은 구조적으로 필요한 opaque return과 제한된 glass를 둔다. roof는 직사각형 box 위에 네 개 이상의 support post를 세운 별도 canopy frame으로 표현하며 cantilevered house mass는 만들지 않는다.

프라이버시는 세 단계다. 낮에는 후면 common의 clear electrochromic glass가 열리고 전면 private bay는 반투명 tint를 기본으로 한다. 야간 또는 외부 시선이 강한 상태에서는 glass tint가 어두워지고 translucent interlayer와 roller shade가 silhouette만 남긴다. canopy의 수평 PV/slat과 sill-level exterior fin은 직사광선과 맞은편 시선을 낮춘다. 이 제어는 material·fit-out 상태의 시각 표현이며 실제 전기변색 장치의 성능 인증이 아니다.

## 표면 소유 선언 {#surface-decomposition}

하나의 완결된 시각 표면은 하나의 owner만 가진다. `spaces/001-citizen-house.md`가 건물·층·room 경계와 floor 의미를 소유하고, `src/spaces/citizen-house.ts`가 그 그래프와 실제 환경 carrier를 소유한다. source 내부의 box model helper는 공통 primitive만 소유하며 방의 경계나 외피 관계를 새로 결정하지 않는다.

입면 owner는 `front-stair-curtainwall`, `front-flex-curtainwall`, `rear-common-curtainwall`, `left-return-envelope`, `right-service-envelope`로 나눈다. 층별 floor·ceiling owner는 `ground-storey-surfaces`와 `upper-storey-surfaces`, 지붕·PV·canopy owner는 `roof-canopy`다. room별 fit-out surface owner는 `entry-fitout`, `flex-fitout`, `common-fitout`, `ground-core-fitout`, `primary-fitout`, `child-fitout`, `upper-corridor-fitout`, `upper-core-fitout`이며 한 표면을 여러 owner가 다시 칠하지 않는다.

