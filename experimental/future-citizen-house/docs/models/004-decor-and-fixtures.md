# 소품과 조명기구 모델

소품은 [방을 구별하는 생활 물품](../settings/002-household.md#household-program)을 채우되 모델은 생김새만 소유한다. 어느 방에 몇 개를 두는지는 instances, 밝기·시간·회로는 systems, 표면색·질감은 materials가 소유한다. 작은 물체도 미리 정한 0.45m 좌석 높이와 실제 방 clear cell에 맞는 m 단위로 만든다.

중립 배경·0.50m 눈금·카메라 축·key light는 [모델 관찰 조건](001-seating-and-work.md)을 따른다. 작은 소품은 근접 view와 방 안 리뷰 거리 view를 모두 남겨 확대 이미지에서만 읽히는 결손을 드러낸다.

prototype id는 `potted-plant/<높이-mm>`, `book/<높이-mm>/<두께-mm>`, `folded-towel/<높이-mm>`, `storage-basket`, `entry-charger`, `living-rug`, `living-display`, `recessed-light`, `dining-pendant`, `portable-lamp/reading`, `portable-lamp/bedside`다. 수치 토큰은 m 입력을 mm 정수로 검사한다. 각각의 part 주소는 이 prototype id 안에서 유일해야 하며 같은 id가 다른 형상을 뜻하면 생성 시 거부한다.

## 실내 화분과 식물 {#potted-plant}

실내 화분은 높이 0.60·0.80·1.10m 변종이고 수관의 최외곽 지름은 각 높이의 0.60배 이하다. 원점은 화분 바닥 중심, +Y가 위다. 화분은 속이 빈 열린 윗면·테두리·흙 표면을 가지며 줄기는 주간선과 굵기가 줄어드는 가지, 잎은 가지의 끝에서 크기와 방향이 달라지는 여러 닫힌 얇은 형상으로 만든다. 현재 일직선 stem box와 한 수식으로 찍은 아홉 ellipsoid의 나열은 식재가 아니라 기호처럼 읽히므로, 가지의 접속과 빈 수관을 실제 3D 형태로 만든다. 외부 수목과 생울타리의 대지 배치와 형상 소유는 spaces의 site owner가 유지한다.

`pot-outer/inner/rim`, `soil`, `stem`, `branch-0..n`, `leaf-0..n-front/back`은 안정 주소다. 잎의 앞뒤 normal·UV는 명시하고 양면 표현이 필요해도 한쪽 면의 뒤집힌 winding에 의존하지 않는다. 45°와 상부 중립 view에서 화분 개구, 가지의 이어짐, 잎 사이 빈 공간을 확인한다. 실제 종 분류나 생장 과정은 표현하지 않는다.

## 책과 서가 소품 {#books}

책은 높이 0.18~0.30m, 두께 0.02~0.05m, 앞뒤 깊이 0.12~0.20m의 변종이다. 원점은 책의 선반 접촉 중심, +Z는 책등이 향하는 앞이다. 표지·책등·종이 단면을 따로 만들고 책장에 꽂거나 탁자 위에 놓는 변종은 같은 형상의 transform으로 둔다. `cover-front/back/spine`, `pages-edge`가 안정 주소다. 정면·상부·45° 중립 view에서 개별 책의 두께와 책등이 읽히며 서가의 수량·방향은 instances가 맡는다. 실제 제목이나 인쇄 내용은 표현하지 않는다.

## 접힌 수건 {#folded-towels}

수건은 폭 0.38m, 접힌 깊이 0.60m, 한 묶음 높이 0.08~0.16m다. 원점은 수납 선반 접촉 중심, +Z가 접힌 앞쪽이다. 접힌 세 겹과 아래로 둥글게 도는 모서리가 있어 단일 box와 구별된다. `fabric-top/fold/underside`가 안정 주소이며 표면의 UV는 접힌 앞면에서 끊기지 않게 이어진다. 정면·측면·45°에서 겹수와 선반 위 접촉을 확인한다. 실제 섬유 유연성은 `unverified`다.

## 수납 바구니 {#storage-basket}

수납 바구니는 폭 0.40m, 깊이 0.65m, 높이 0.28m다. 원점은 선반 접촉 중심, +Z가 꺼내는 앞면이다. 속이 빈 열린 윗면, 둘레 벽, 두 손잡이를 가진다. `wall-outer/inner`, `rim`, `bottom`, `handle-left/right`가 안정 주소이고 안쪽과 바깥쪽 normal은 반대다. 정면·상부·45°에서 빈 내부와 손잡이가 보이는지 확인한다. 내용물과 선반 위 개수는 instances가 결정한다.

## 현관 충전 장치 {#entry-charger}

현관 충전 장치는 폭 0.07m, 깊이 0.12m, 두께 0.015m의 작은 고정 물체다. 원점은 충전 선반에 닿는 아래면 중심, +Z가 조작면이다. 측면이 있는 본체, 구별되는 상단 interface, 작은 단자 개구가 형상을 이룬다. `body-front/back/edge`, `interface`, `port`를 안정 주소로 두고 작은 기하가 리뷰 거리에서 지나치게 두꺼운 판으로 보이지 않는지 근접·방 관찰을 모두 한다. 실제 충전 과정은 systems에서도 선언하지 않으면 `unverified`다.

## 거실 러그 {#living-rug}

거실 러그는 2.80×3.65m의 0.016m 낮은 부피를 가지며 바닥 접촉 중심이 원점, 장축이 Z다. 얇은 직조 가장자리와 몸판을 구별하되 바닥과 일체인 판으로 녹이지 않는다. `pile-upper`, `bound-edge`, `underside`가 안정 주소이고 상면 UV는 바닥의 미터 축을 따른다. 상부·낮은 측면·소파를 포함한 45° 중립 view에서 둘레 경계와 소파 발 접촉이 읽히는지 확인한다. 실제 직물 pile의 개별 섬유는 표현하지 않는다.

## 거실 화면 {#living-display}

거실 화면은 폭 1.43m, 높이 0.80m, 깊이 0.045m의 장치다. 원점은 화면 중심, +Z가 시청자 쪽이다. `screen`, `bezel`, `back`, `mount`를 분리하고 벽에 부착하는 mount의 깊이를 남긴다. 화면은 검은 판 한 장이나 관찰 overlay가 아니라 방 안의 실제 물체다. 정면·측면·45°에서 bezel와 벽 이격을 확인하며 출력 영상이나 전력 상태는 모델의 주장이 아니다.

## 천장 매입등 {#recessed-light}

천장 매입등은 외경 0.12m, 전체 깊이 0.04m의 얕은 trim, 안쪽으로 들어간 0.095m 확산면, 천장 접합 rim을 가진다. 국소 원점은 천장 접합면 중심, +Y가 천장 안쪽을 향한다. `housing-outer/inner`, `trim`, `diffuser-front/back`이 안정 주소다. 확산면은 발광 재료를 받을 수 있으나 housing까지 밝히지 않는다. 천장 아래와 45° 중립 view에서 trim의 깊이와 확산면을 확인한다. 수량·위치는 instances, 실제 광량은 systems가 소유한다.

## 식탁 펜던트 {#dining-pendant}

펜던트는 지름 0.38m shade와 매다는 cord, 안쪽 확산면을 가진다. 국소 원점은 천장 cord 고정점, +Y가 천장 위를 향하고 길이 1.00m다. `cord`, `canopy`, `shade-outer/inner`, `diffuser-front/back`이 안정 주소다. 케이블 끝과 shade는 같은 줄기에 연결되고 아래쪽은 열린 관찰면이다. 정면·측면·45°에서 cord, 얕은 shade, 안쪽 확산면의 구분을 확인한다. 식탁 중심 배치와 빛의 과정은 후속 분기가 맡는다.

## 독서등과 협탁등 {#portable-lamps}

독서등과 협탁등은 바닥 또는 상판에 닿는 받침, 0.30~1.25m 높이의 stem, 지름 0.20~0.34m shade와 안쪽 확산면의 치수 변종이다. 원점은 받침 아래면 중심, +Z가 빛을 향하는 방향이다. `base-upper/underside`, `stem`, `shade-outer/inner`, `diffuser-front/back`이 안정 주소다. 두 변종은 전체 높이와 받침 점유를 바꾸되 광원 부품 주소를 유지한다. 정면·측면·45°에서 램프가 떠 있지 않고 `glow` 타원 하나로 대체되지 않았는지 확인한다. 실제 전기 안전·조도는 `unverified`다.
