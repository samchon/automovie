# 외투장과 린넨장의 내부 부재

## 계단 아래 외투장의 미닫이 문짝 {#coat-closet-doors}
<!--
@evidence principles/core/common.md#scope-preservation 외투장 미닫이 문짝 두 장의 폭 0.50 m, 높이 2.11 m, 두께 0.03 m, 트랙 위치와 손잡이 홈을 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 개구부 뒤 경계에서 통로 쪽으로 잰 국소 d ∈ [0,0.15] m 안에 뒤 트랙 d=[0.07,0.10], 앞 트랙 d=[0.11,0.14] m를 두고, 오목 손잡이를 포함한 최대 깊이 0.14 m가 통로 쪽 한도 d=0.20 m 안이라고 산출한다.
@evidence principles/core/common.md#declared-basis 개구부와 돌출 한도는 spaces/rooms/entry.md#entry-coat-storage에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation entry-coat-storage의 '겹쳐 미는 두 장'을 문짝 치수와 트랙 좌표로 바꾼다.
@evidence principles/design/models.md#representation-contract 두 문짝과 트랙, 오목 패널 계층을 정한다.
@evidence principles/design/models.md#spatial-convention 문짝 이동 축을 국소 Z로 적는다.
@evidence principles/design/models.md#reviewable-structure 서비스 통로 쪽 정면과 계단 아래 단면에서 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 실내 문과 같은 오목 패널 두 개로 흰 패널문 문법을 잇는다.
@evidence principles/design/models.md#model-scale-layer-completion 미닫이 인터페이스와 트랙 층을 정한다.
@evidence obligations/design/models.md#articulation-ownership 각 문짝의 국소 Z 평행 이동 0~0.45 m를 motion 인터페이스로, 기준 상태를 닫힘으로 정한다.
@evidence spaces/rooms/entry.md#entry-coat-storage 개구부 폭 0.95 m와 통로 쪽 돌출 한도를 문짝 0.50 m 둘·겹침 0.05 m 및 국소 깊이 최대 0.14 m로 소비한다.
@evidence contracts/reservation-fit.md#reservation-fit 두 트랙의 국소 깊이 끝 0.14 m가 0.15 m 경계 안이고 오목 손잡이의 최대 깊이도 0.20 m 한도 안임을 산술로 보인다.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work entry-coat-storage는 원래 문짝·봉까지 entry.ts가 소유한다고 적었으나 실제 source에는 벽과 개구부만 있었다. 부모 H2를 벽·개구부는 spaces, 문짝·봉·선반은 models로 고친 뒤 문짝 원형을 정했다.
-->

레퍼런스 04의 계단 옆 흰 수납문을 채택한다. 미닫이 겹침과 트랙 깊이는 현관 예약에서 정하고 사진 속 여닫이 각도를 강요하지 않는다.

[현관 외투장 owner](../spaces/rooms/entry.md#entry-coat-storage)는 X = 2.02 m 면에 겹쳐 미는 두 장의 수납문을 둔다. `entry-coat-opening` Z = [-4.51, -3.56], Y = [0, 2.15] m를 채우는 두 문짝은 폭 0.50 m(0.95 m의 절반 + 겹침 0.05 m의 절반), 높이 2.11 m(머리 트랙 0.03 m와 바닥 틈 0.01 m 제외), 두께 0.03 m로 택하고 뒤쪽 경계에서 통로 쪽으로 재는 국소 깊이 d ∈ [0, 0.15] m 안에 앞 트랙 d = [0.11, 0.14] m, 뒤 트랙 d = [0.07, 0.10] m를 둔다. 두께 0.03 m와 겹침 0.05 m는 두 트랙이 0.15 m 경계 안에 들어가고 닫힌 상태에서 두 문짝 사이 틈이 정면에서 보이지 않게 하려는 모델 결정이다. 앞 문짝 손잡이는 문짝 면에서 0.02 m 오목하게 파서 owner의 통로 쪽 돌출 한도 d = 0.20 m 안인 d = 0.14 m에 머문다. motion 인터페이스는 각 문짝의 국소 Z 평행 이동이며 범위는 0부터 문짝 폭 - 0.05 m까지이고 기준 상태는 둘 다 닫힘이다. 흰 패널문 문법을 위해 [실내 문](03-interior-doors.md#interior-door-members)과 같은 오목 패널 두 개를 둔다. 소스 owner는 `src/models/closet.ts`이며 서비스 통로 쪽 정면과 계단 아래 단면으로 검사한다.

## 외투장의 봉과 선반 {#coat-closet-rod-shelf}
<!--
@evidence principles/core/common.md#scope-preservation 외투장 뒤쪽 면에서 0.325 m·바닥 위 1.65 m 봉과 위 선반 상면 2.00 m·깊이 0.65 m를 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 봉 지름 0.03 m, 선반 두께 0.02 m, 계단 구조 아래면과 겹치면 잘라낸다고 적는다.
@evidence principles/core/common.md#declared-basis 봉·선반 위치는 spaces/rooms/entry.md#entry-coat-storage, 구조 두께 조건은 spaces/02-stair.md#stair-boundary-heights에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation owner의 뒤쪽 면 기준 봉 위치와 바닥 기준 높이를 국소 깊이 0.325 m·높이 1.65 m로 바꾼다.
@evidence principles/design/models.md#representation-contract rod와 shelf 부재를 정한다.
@evidence principles/design/models.md#spatial-convention 봉을 Z 방향으로 건다고 적는다.
@evidence principles/design/models.md#reviewable-structure 계단 아래 단면에서 선반과 구조 아래면 관계를 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 스타일 라벨 없이 수납 부재 위치만 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 몸통 국소 깊이 0.65 m 안의 부재 층을 정한다.
@evidence spaces/rooms/entry.md#entry-coat-storage 봉 위치와 선반 상면 2.00 m, 몸통 깊이 0.65 m를 소비한다.
@evidence contracts/reservation-fit.md#reservation-fit 봉과 선반이 몸통 국소 깊이 [0, 0.65] m 안에 있음을 적는다.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work entry-coat-storage의 원래 source 책임은 봉까지 entry.ts에 두어 이 원형과 중복됐다. 부모 H2를 벽·개구부만 spaces, 봉·선반은 models로 고쳤고 계단 구조 높이의 unverified 상태는 유지했다.
-->

레퍼런스 02의 현관 가까운 외투 수납을 봉과 윗선반으로 채택한다. 레퍼런스 04에는 내부가 보이지 않으므로 봉 높이는 예약으로 정한다.

봉은 owner가 정한 몸통 뒤쪽 면에서 통로 쪽으로 0.325 m, 바닥 위 1.65 m 위치에 장의 길이 방향으로 걸고 지름 0.03 m 원통으로 택한다. 위 선반은 상면 2.00 m, 두께 0.02 m, 깊이는 문 트랙이 몸통 밖 경계에 있으므로 몸통 국소 깊이 d = [0, 0.65] m 전체로 두며 계단 구조 아래면과 겹치면 그 아래면에서 잘라 [구조 두께를 0으로 보지 않는](../spaces/02-stair.md#stair-boundary-heights) 조건을 지킨다. 표면 id는 `rod`, `shelf`다. 소스 owner는 `src/models/closet.ts`다.

## 린넨장의 미닫이 문짝과 선반 {#linen-closet-fittings}
<!--
@evidence principles/core/common.md#scope-preservation 린넨장 미닫이 문짝 0.525 m 두 장과 선반 다섯 개를 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 선반 상면 0.25·0.63·1.01·1.39·1.77 m, 깊이 0.55 m, 두께 0.02 m를 산출한다.
@evidence principles/core/common.md#declared-basis 개구부·선반 규칙은 spaces/rooms/upper-hall.md#upper-linen-storage에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation upper-linen-storage의 '0.25 m부터 0.38 m 간격'을 다섯 상면 값으로 바꾼다.
@evidence principles/design/models.md#representation-contract 문짝·트랙·선반 계층을 정한다.
@evidence principles/design/models.md#spatial-convention 선반 깊이를 뒤쪽 안쪽 면의 국소 깊이 0 기준으로 적는다.
@evidence principles/design/models.md#reviewable-structure 복도 도착면 view와 장 단면에서 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 스타일 라벨 없이 수납 부재만 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 미닫이 인터페이스와 선반 층을 정한다.
@evidence obligations/design/models.md#articulation-ownership 린넨장 문짝의 국소 Z 평행 이동을 외투장과 같은 형식의 motion 인터페이스로 정한다.
@evidence spaces/rooms/upper-hall.md#upper-linen-storage upper-linen-opening X = [1.97, 2.97] m와 다섯 선반 규칙을 문짝 0.525 m와 선반 상면 값으로 소비한다.
@evidence contracts/reservation-fit.md#reservation-fit 선반 깊이 0.55 m 뒤에 0.05 m 여유가 있고 문 트랙은 별도의 국소 깊이 [0, 0.15] m 경계 안에 있음을 적는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work upper-hall을 적힌 그대로 소비했고 부모 수정이 없었다.
-->

레퍼런스 05의 상층 복도 수납문과 02의 복도 수납 위치를 채택한다. 내부 다섯 선반과 수건은 사진 비례가 아닌 수납 요구로 정한다.

[린넨장 owner](../spaces/rooms/upper-hall.md#upper-linen-storage)의 `upper-linen-opening`의 거친 폭 1.00 m와 높이 2.20 m를 두 미닫이 문짝이 채운다. 문짝 폭은 0.525 m(1.00 m의 절반 + 겹침 0.05 m의 절반), 두께 0.03 m, 높이 2.16 m(머리 트랙 0.03 m와 바닥 틈 0.01 m 제외)이며 트랙은 장 안쪽 면에서 복도 쪽 국소 깊이 d = [0, 0.15] m 안의 뒤 d = [0.07, 0.10] m와 앞 d = [0.11, 0.14] m에 둔다. 문짝 아래는 완성 바닥 위 0.01 m이고 위는 2.17 m다. 다섯 선반은 상면이 상층 바닥 위 0.25 m부터 0.38 m 간격으로 0.25, 0.63, 1.01, 1.39, 1.77 m이고, 뒤쪽 안쪽 면을 국소 깊이 0으로 두고 문 쪽으로 0.55 m 깊이, 두께 0.02 m로 둔다. 두 문짝의 국소 가로 평행 이동은 각 0–0.475 m(폭 0.525 m에서 겹침 0.05 m를 뺌)이고 기준 상태는 둘 다 닫힘이다. 선반 앞면과 문 경계 안쪽 면 사이에는 0.05 m 간격이 있으며 문짝은 그보다 복도 쪽의 0.15 m 경계 안에서만 움직인다. 표면 id는 선반 `shelf`, 문 앞뒤와 두께 면 `leaf`, 오목 패널 `leaf-panel`, 트랙 `rail`, 파인 손잡이 `handle`이다. 소스 owner는 `src/models/closet.ts`이며 복도 도착면 view와 장 단면으로 검사한다.

## 수납 부재의 표면 파티션 {#closet-fitting-surfaces}
<!--
@evidence principles/core/common.md#scope-preservation 수납 부재의 표면 id(leaf·leaf-panel·rail·rod·shelf·handle)와 문짝 UV를 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 문짝 UV를 실내 문과 같이 국소 X·Y에 정렬한다고 적는다.
@evidence principles/core/common.md#declared-basis leaf·rail·rod·shelf·handle id 규칙은 00-model-frame.md#model-surface-partition-naming에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 공통 id 규칙을 수납 부재 목록으로 바꾼다.
@evidence principles/design/models.md#representation-contract 수납 부재의 안정 표면을 정한다.
@evidence principles/design/models.md#spatial-convention UV 축을 적는다.
@evidence principles/design/models.md#reviewable-structure 바인딩 뷰에서 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 색은 materials에 둔다.
@evidence principles/design/models.md#model-scale-layer-completion 외투장·린넨장 문짝과 봉·선반의 표면 인터페이스를 정한다.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work entry-coat-storage가 원래 문짝·봉을 spaces source에 맡긴 중복 소유를 부모에서 고쳐 수납 부재의 `leaf`·`rod`·`shelf` 면을 models 한 owner가 내도록 했다. upper-linen-storage의 선반 예약과 00의 id 규칙은 수정 없이 충분했다.
-->

레퍼런스 04·05의 흰 수납문 전면과 내부 봉·선반을 서로 다른 표면으로 채택한다. spaces에는 개구부만 남긴다.

[이름 규칙](00-model-frame.md#model-surface-partition-naming)에 따라 문짝은 `leaf`와 `leaf-panel`, 트랙은 `rail`, 봉은 `rod`, 선반은 `shelf`, 손잡이 홈은 `handle`을 쓴다. 문짝 면은 [실내 문](03-interior-doors.md#interior-door-members)과 같이 문짝 국소 X·Y에 정렬한 미터 단위 UV를 가진다. 소스 owner는 `src/models/closet.ts`다.

## 수납 부재의 표현 한계 {#closet-fitting-fidelity}
<!--
@evidence principles/core/common.md#scope-preservation 롤러·브래킷·나사를 만들지 않고 옷·수건·용기를 소품 모델에 넘기는 범위를 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 수납 내용물이 이 모델에 없다고 명시한다.
@evidence principles/core/common.md#declared-basis 롤러·브래킷·나사 생략과 내용물 제외의 상한은 00-model-frame.md#model-representation-ceiling에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 공통 상한을 수납 부재 생략 목록으로 바꾼다.
@evidence principles/design/models.md#representation-contract 미닫이 문짝 이동이 롤러 마찰이나 하중을 증명하지 않는다는 proxy 한계를 정한다.
@evidence principles/design/models.md#spatial-convention 앞 H2가 트랙을 개구부 뒤 경계 기준 국소 깊이 d=[0.07,0.14] m에 두고 선반 높이를 정한다. 이 표현 한계 H2는 새 좌표를 정하지 않는다.
@evidence principles/design/models.md#reviewable-structure 모델 리뷰 뷰의 장 단면에서 옷·수건이 이 원형에 포함되면 반증된다.
@evidence principles/design/models.md#model-observable-style-basis 롤러와 브래킷이 보이지 않는다는 관찰 가능한 수납 한계를 적는다.
@evidence principles/design/models.md#model-scale-layer-completion 미닫이 롤러·선반 브래킷·나사와 옷·수건·용기를 만들지 않는 층으로 명시한다.
@evidence obligations/design/models.md#representation-ceiling 수납 부재의 하드웨어 생략과 내용물 제외를 적는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work settings fidelity와 entry·upper-hall의 수납 내용물 서술을 수납 부재 생략과 대조했고 부모 수정이 필요하지 않았다.
-->

레퍼런스 04·05에서 보이는 문과 열린 수납의 실루엣을 채택한다. 숨은 롤러·선반 받침 나사는 관찰 대상에서 제외한다.

[표현 상한](00-model-frame.md#model-representation-ceiling) 안에서 롤러·브래킷·선반 받침 나사는 만들지 않고 옷·수건·용기는 이 모델이 아니라 소품 모델이 맡는다. 검사 주소는 [모델 리뷰 뷰 목록](00-model-frame.md#model-review-set)이며 실제 렌더는 unverified다. 소스 owner는 `src/models/closet.ts`다.
