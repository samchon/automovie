# 개구부 충전 모델의 공통 기준

## 국소 좌표와 배치 규칙 {#model-local-frame}

모든 개구부 충전 모델은 [제작 좌표](../settings/00-production.md#coordinate-units)의 오른손 Y-up, 길이 m, 각도 rad를 그대로 쓴다. 한 모델은 spaces가 좌표를 소유한 거친 개구부 하나를 채우며, 국소 원점은 그 개구부 아래 변의 가로 중앙에 두고 벽 두께 방향으로는 개구부를 소유한 벽의 한쪽 면 위에 둔다. 외벽의 창과 외부 문은 날씨 면, 내부 문은 문짝이 열리는 쪽 벽면을 원점 면으로 삼는다. 국소 +Y는 world +Y, 국소 +Z는 원점 면의 바깥 법선, 국소 +X는 +Z 쪽에서 보아 오른쪽이다. world 배치 회전은 벽 방향에 따라 Y축 0, π, ±π/2 중 하나이며 개구부를 소유한 spaces H2의 void 좌표에서 계산하고 모델 파일에 world 좌표를 복제하지 않는다.

모델 외곽의 폭과 높이는 거친 개구부의 폭과 높이에서만 산출하고, 칸 수·경첩 쪽·열림 방향도 개구부 owner가 선언한 값을 받는다. 모델이 정하는 것은 부재 폭·깊이·두께의 배분뿐이다. 소스 owner는 `src/models/frame.ts`이며 검사 주소는 [전체 관찰](../spaces/04-observations.md#spatial-observation-derivation)의 각 개구부 정면과 벽 단면이다.

## 가구·설비 원형의 국소 좌표 {#model-furniture-local-frame}

개구부를 채우지 않는 가구·설비·수납 원형은 [제작 좌표](../settings/00-production.md#coordinate-units)의 단위와 축을 쓰고 국소 원점을 바닥에 닿는 뒤쪽 모서리 선의 가로 중앙에 둔다. 국소 +Z는 사용자가 서서 쓰는 앞쪽, 국소 +Y는 world +Y, 국소 +X는 앞에서 보아 오른쪽이다. 뒤쪽 모서리 선은 벽에 붙는 원형이면 벽 마감 면에, 섬·식탁처럼 벽에서 떨어진 원형이면 사용 방향 반대쪽 외곽에 둔다. 외곽 치수는 [예약 맞춤 계약](../contracts/reservation-fit.md#reservation-fit)에 따라 room owner의 상한 박스와 사용 공간 예약에서 받고, world 배치 회전은 Y축 회전 하나로 instances가 room owner의 좌표에서 계산한다. 소스 owner는 `src/models/frame.ts`이며 각 가구 H2가 이 규칙을 링크로 소비한다.

## 기준 척도와 대조 치수 {#model-reference-scale}

공통 척도 기준은 [사용과 통행 가정](../settings/00-production.md#use-profile)의 사람 점유체 폭 0.60 m, 깊이 0.45 m, 높이 1.90 m와 문 유효폭 0.80 m 이상이다. 모든 문 모델은 90° 열림에서 문설주 면 사이의 순폭을 산출해 그 개구부 owner가 정한 유효 폭 목표와 대조하고, 모든 창 모델은 부재를 뺀 유리 폭을 산출해 부재가 유리를 가리지 않는지 대조한다. 독립적으로 만든 모델 사이의 척도 어긋남은 같은 뷰에 사람 점유체를 세워 문 높이 2.20 m와 창대 높이를 비교해 드러낸다. 소스 owner는 `src/models/frame.ts`이며 순폭과 유리 폭 산출은 모델 생성 시 수치로 보고한다.

## 표현 상한과 보이는 한계 {#model-representation-ceiling}

[표현 수준](../settings/20-verification.md#fidelity)은 창호와 문짝이 실제 캡처에서 읽혀야 하며 단순 blocking이나 topology 통과로 낮추지 않는다고 정한다. 따라서 창틀·sash·살대·유리·문짝·문설주·손잡이·경첩·문턱은 각각 두께 있는 별도 부재로 만들고 사각 구멍이나 평면 한 장으로 대신하지 않는다. 반면 웨더스트립, 잠금 기구 내부, 스프링, 나사, 유리 이중층의 공기층은 만들지 않는다. 검사자는 이 모델에서 단열·방수·기밀·개폐 하중·구조 안전·법규 적합을 추론하지 않는다. 소스 owner는 `src/models/frame.ts`이며 각 모델 H2가 이 상한 안에서 자기 한계를 적는다.

## 표면 파티션 이름 규칙 {#model-surface-partition-naming}

[표면 분해 인계](../settings/20-verification.md#surface-allocation)에 따라 모델은 materials가 바인딩할 안정 표면 id만 제공하고 색·광학값·텍스처 scale은 정하지 않는다. id는 부재 역할을 나타내는 kebab-case 이름이며 한 모델 안에서 유일하고, 같은 역할은 모든 모델에서 같은 id를 쓴다. 공통 id는 `frame`, `sash`, `mullion`, `muntin`, `glass`, `obscured-glass`, `exterior-trim`, `interior-sill`, `leaf`, `leaf-panel`, `jamb`, `casing`, `threshold`, `handle`, `hinge`, `rail`, `baluster`, `bottom-rail`, `rod`, `shelf`이다. 안팎 면이 다른 마감을 받아야 하는 부재는 `-exterior`와 `-interior` 접미사로 나눈다. 소스 owner는 `src/models/frame.ts`이며 materials 문서가 이 id 목록을 소비한다.

## 모델 리뷰 뷰 목록 {#model-review-set}

모델 리뷰는 [리뷰 프레임 조건](../settings/20-verification.md#frame-condition)의 canvas 1536×1024, device pixel ratio 1, 중성 배경을 쓴다. 각 모델마다 정면 직교, 측면 직교 단면, 45° 사선 투시(수직 FOV 45°, 눈높이 1.6 m), 관절이 있으면 기준 상태와 최대 열림 상태의 같은 사선 투시를 찍는다. 척도 대조로 같은 뷰에 [사람 점유체](../settings/00-production.md#use-profile)를 세운다. 이 뷰는 샷 구도와 무관하게 모델 개정 사이의 회귀를 비교하는 고정 목록이며 실제 집 안 배치 검사는 [전체 관찰](../spaces/04-observations.md#spatial-observation-derivation)이 맡는다. 소스 owner는 `src/models/frame.ts`이고 실제 캡처는 unverified다.
