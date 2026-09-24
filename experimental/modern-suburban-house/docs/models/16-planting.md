# 대지 식재 원형

## 성목과 뒤뜰 나무 {#site-tree-prototypes}
<!--
@evidence principles/core/common.md#scope-preservation 줄기·가지·잎 덩어리의 부피 원형 두 크기만 맡고 위치·개체 수·접지는 maps와 instances에 남긴다.
@evidence principles/core/common.md#substantive-completion 전면 성목 H 8.00 m·수관 반지름 3.00 m, 뒤뜰 나무 H 6.00 m·반지름 2.00 m, 줄기·가지·수관의 결정적 생성식을 정한다.
@evidence principles/core/common.md#declared-basis settings/10-house.md#site-identity의 전면 성목과 뒤쪽 나무, 비직육면체 실루엣·접지 그림자를 원형의 출발점으로 직접 받는다. 치수는 수목 사진 픽셀 환산이 아니라 본채 처마와의 상대 척도 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 수종을 사진에서 확정하지 않고 같은 낙엽수 문법의 8 m·6 m 별도 원형을 둬 settings의 두 역할을 구별한다.
@evidence principles/design/models.md#representation-contract 줄기와 여섯 굵은 가지는 유한 두께의 닫힌 다면체, 수관은 서로 다른 크기의 둥근 군집 부피로 만들며 표면 `bark`·`foliage`를 낸다. 잎 한 장과 실제 생장은 표현하지 않는다.
@evidence principles/design/models.md#spatial-convention 국소 원점은 줄기 접지 중심, +Y는 위, +X·+Z는 수관의 두 수평축이다. world 배치는 instances가 maps 기준점에서 계산한다.
@evidence principles/design/models.md#reviewable-structure 정면·측면·45° 뷰에서 두 크기의 외곽, 비직육면체 수관, 가지와 수관 사이 빈틈, 접지 그림자를 확인한다. 실제 렌더는 unverified다.
@evidence principles/design/models.md#model-observable-style-basis 수관 군집의 높이·수평 분포를 수치로 정해 성목과 뒤뜰 나무를 서로 다른 실루엣으로 읽히게 한다. 색과 투과는 materials가 정한다.
@evidence principles/design/models.md#model-scale-layer-completion H·반지름·줄기 테이퍼·가지와 군집 개수·점유 외곽·표면 id·국소 원점·검사 뷰를 모두 정하고 배치 좌표만 후속 층에 남긴다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work site-identity의 나무 역할과 비블록 식재 요구를 원형의 두 크기로 소비하며 settings나 spaces의 위치를 수정하지 않는다.
@evidence settings/00-production.md#build-allocation 식재 크기·형상은 models, 개체 수와 배치는 instances라는 제작 배분을 따른다.
@evidence settings/10-house.md#site-identity 왼쪽 전면 성목과 뒤쪽 나무를 가지·수관·잎 덩어리의 불규칙한 실루엣을 지닌 두 원형으로 정한다.
@evidence obligations/design/models.md#addressable-model-decisions 수목 원형을 관목이나 외장 반복과 분리해 크기·기하 규칙·표면 id를 이 H2에서 독립 수정한다.
@evidence obligations/design/models.md#model-review-set 00의 정면·측면·45° 고정 뷰에서 두 나무의 외곽과 접지 그림자를 비교한다.
-->

[대지와 식재](../settings/10-house.md#site-identity)는 왼쪽 전면 성목과 뒤쪽 나무의 불규칙한 가지·수관·잎 덩어리 및 접지 그림자를 요구한다. 이 H2는 배치가 아닌 두 크기의 원형을 소유한다. 국소 원점은 줄기 접지 중심, +Y는 위, +X·+Z는 수관의 수평축이다. 전면 원형의 높이 H는 8.00 m, 수관 최대 반지름 R은 3.00 m이고 뒤뜰 원형은 H = 6.00 m, R = 2.00 m다. 본채 2층 처마보다 조금 높은 뒤 나무와 지붕보다 훨씬 높은 전면 성목을 만들기 위한 저작 치수이며 사진에서 역산한 값이 아니다. 각 원형의 world 위치·yaw·지표 접지는 maps 기준점을 소비하는 후속 instances가 맡는다.

줄기는 아래 반지름 0.045H, 첫 가지 높이 0.32H의 반지름 0.025H, 꼭대기 0.010H로 가늘어지는 12각 링 세 개와 닫힌 밑면으로 만든다. 가지 여섯은 첫 가지 높이에서 60° 간격으로 나가며, i번째 가지의 방위는 `i × π/3 + (i mod 2) × π/12`, 길이는 `R × (0.72 + 0.04 × (i mod 3))`, 끝 높이는 `H × (0.69 + 0.025 × (i mod 3))`다. 가지 반지름은 밑 0.018H에서 끝 0.006H로 줄이고 각각 끝을 닫는다. 수관은 서로 다른 높이의 닫힌 둥근 군집 13개다. 중앙 군집 하나의 중심은 Y = 0.76H, 반지름 0.35R; 바깥 군집 12개의 각도는 `j × 5π/6`, 수평 중심 거리는 `R × (0.48 + 0.07 × (j mod 3))`, 높이는 `H × (0.68 + 0.04 × (j mod 4))`, 반지름은 `R × (0.30 + 0.025 × (j mod 3))`이다. 각 군집은 8개 위도 링과 12개 경도 꼭짓점의 닫힌 타원체이고 수직 반경은 수평 반경의 0.72배다. 이 규칙은 시드나 임의 배열 없이 다시 생성된다. `bark`는 줄기·가지의 모든 면, `foliage`는 군집의 모든 면을 덮으며 각각의 둘레 U와 높이 V를 미터로 제공한다. 부품별 경계는 서로 다른 닫힌 메시로 유지하고 접촉 내부의 보이지 않는 면은 표면 id를 잃지 않는다.

잎 한 장, 수종 식별, 생장·바람·뿌리 구조는 표현하지 않는다. 소스 owner는 `src/models/planting.ts`다. [모델 고정 뷰](00-model-frame.md#model-review-set)의 정면·측면·45°에서 두 외곽, 가지와 수관 사이 빈틈, 직육면체가 아닌 실루엣과 접지 그림자를 확인한다. 실제 렌더와 지표 접합은 unverified다.

## 낮은 관목 {#site-shrub-prototype}
<!--
@evidence principles/core/common.md#scope-preservation 우측 울타리와 화단에 놓일 관목 한 개체의 형상만 맡고 반복 수·간격·지표 높이는 maps와 instances에 남긴다.
@evidence principles/core/common.md#substantive-completion H 0.80 m·최대 폭 0.90 m, 가지 여덟과 잎 군집 아홉의 결정적 위치 및 표면 id를 정한다.
@evidence principles/core/common.md#declared-basis settings/10-house.md#site-identity의 낮은 화단·우측 울타리 관목을 근거로 보행 폭을 삼키지 않는 0.90 m 원형을 택한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 나무를 균등 축소하지 않고 밑동부터 갈라진 짧은 가지와 낮은 수관으로 구별한다.
@evidence principles/design/models.md#representation-contract 여덟 닫힌 테이퍼 가지와 아홉 닫힌 타원체 군집의 부피 및 `bark`·`foliage` 표면을 만든다. 개별 잎과 뿌리는 표현하지 않는다.
@evidence principles/design/models.md#spatial-convention 원점은 관목 접지 중앙, +Y는 위, +X·+Z는 수평축이며 yaw와 위치는 배치에서 결정한다.
@evidence principles/design/models.md#reviewable-structure 측면에서 보행면 침범 여부, 정면에서 울타리 밑 관목의 높이와 그림자, 45°에서 군집 부피를 확인한다.
@evidence principles/design/models.md#model-observable-style-basis 높이 0.80 m와 밑동의 짧은 여덟 가지가 나무 원형과 다른 식재 역할을 드러내고 색은 materials가 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 높이·폭·가지와 군집 위치 규칙·면 id·UV·원점·관찰 뷰를 정하며 실제 배치 수는 남긴다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work site-identity와 울타리 개구부를 그대로 소비하며 식재 원형 때문에 보행로나 울타리 공간을 바꾸지 않는다.
@evidence settings/00-production.md#build-allocation 관목 원형은 models, 개체 반복은 instances로 나눈다.
@evidence settings/10-house.md#site-identity 우측 울타리 관목과 낮은 화단을 0.80 m 원형으로 구체화한다.
@evidence obligations/design/models.md#addressable-model-decisions 관목 원형은 나무의 축소 변형이 아닌 독립 H2여서 울타리와의 접촉 및 폭을 따로 검토할 수 있다.
@evidence obligations/design/models.md#model-review-set 정면·측면·45° 고정 뷰에서 낮은 군집 실루엣을 검토한다.
-->

관목은 [대지와 식재](../settings/10-house.md#site-identity)의 우측 울타리와 낮은 화단에 반복하는 한 원형이다. 국소 원점은 지표 접지 중심, 외곽은 높이 0.80 m·지름 0.90 m다. 밑동 반지름 0.035 m에서 각도 `i × π/4`의 가지 여덟을 뻗으며 각 끝은 원점에서 수평 0.27 m, 높이 `0.42 + 0.04 × (i mod 3)` m에 둔다. 군집은 중앙 하나(중심 Y 0.59 m, 반지름 0.23 m)와 각 끝의 여덟 닫힌 타원체(수평 반지름 0.18 m, 수직 반지름 0.14 m)다. 가지는 아래 반지름 0.025 m에서 끝 0.006 m로 가늘어지는 닫힌 8각 부피다. 표면 `bark`와 `foliage`는 각각 가지와 군집의 모든 면을 덮고 둘레 U·높이 V를 미터로 제공한다. 최대 수평 끝은 0.27 + 0.18 = 0.45 m이므로 실제 지름은 0.90 m다.  위치·yaw·반복 수는 후속 instances가 maps 기준점에서 결정한다. 개별 잎·뿌리·바람은 표현하지 않는다. 소스 owner는 `src/models/planting.ts`다. [모델 고정 뷰](00-model-frame.md#model-review-set)에서 실루엣·그림자·보행면 침범을 확인하며 현재 unverified다.
