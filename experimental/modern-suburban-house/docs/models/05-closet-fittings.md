# 외투장과 린넨장의 내부 부재

## 계단 아래 외투장의 미닫이 문짝 {#coat-closet-doors}

[현관 외투장 owner](../spaces/rooms/entry.md#entry-coat-storage)는 X = 2.02 m 면에 겹쳐 미는 두 장의 수납문을 둔다. `entry-coat-opening` Z = [-4.51, -3.56], Y = [0, 2.15] m를 채우는 두 문짝은 폭 0.50 m(0.95 m의 절반 + 겹침 0.05 m의 절반), 높이 2.11 m(머리 트랙 0.03 m와 바닥 틈 0.01 m 제외), 두께 0.03 m로 택하고 경계 X = [1.87, 2.02] 안의 앞 트랙 X = [1.98, 2.01]과 뒤 트랙 X = [1.94, 1.97]에 둔다. 두께 0.03 m와 겹침 0.05 m는 두 트랙이 0.15 m 경계 안에 들어가고 닫힌 상태에서 두 문짝 사이 틈이 정면에서 보이지 않게 하려는 모델 결정이다. 앞 문짝 손잡이는 문짝 면에서 0.02 m 오목하게 파서 owner의 통로 쪽 최대 돌출 X = 2.07 m 안인 X = 2.01 m에 머문다. motion 인터페이스는 각 문짝의 국소 Z 평행 이동이며 범위는 0부터 문짝 폭 - 0.05 m까지이고 기준 상태는 둘 다 닫힘이다. 흰 패널문 문법을 위해 [실내 문](03-interior-doors.md#interior-door-members)과 같은 오목 패널 두 개를 둔다. 소스 owner는 `src/models/closet.ts`이며 서비스 통로 쪽 정면과 계단 아래 단면으로 검사한다.

## 외투장의 봉과 선반 {#coat-closet-rod-shelf}

봉은 owner가 정한 몸통 뒤 X 끝 1.10 m에서 +X로 0.325 m인 X = 1.425 m, 바닥 위 1.65 m 위치에 Z 방향으로 걸고 지름 0.03 m 원통으로 택한다. 위 선반은 상면 2.00 m, 두께 0.02 m, 깊이는 문 트랙이 몸통 밖 경계에 있으므로 몸통 X = [1.10, 1.75] 전체인 0.65 m로 두며 계단 구조 아래면과 겹치면 그 아래면에서 잘라 [구조 두께를 0으로 보지 않는](../spaces/02-stair.md#stair-boundary-heights) 조건을 지킨다. 표면 id는 `rod`, `shelf`다. 소스 owner는 `src/models/closet.ts`다.

## 린넨장의 미닫이 문짝과 선반 {#linen-closet-fittings}

[린넨장 owner](../spaces/rooms/upper-hall.md#upper-linen-storage)의 `upper-linen-opening` X = [1.97, 2.97], 높이 2.20 m를 두 미닫이 문짝이 채운다. 문짝 폭은 0.525 m(1.00 m의 절반 + 겹침 0.05 m의 절반), 두께 0.03 m이며 트랙은 경계 Z = [-3.41, -3.26] 안에 앞뒤로 둔다. 다섯 선반은 상면이 상층 바닥 위 0.25 m부터 0.38 m 간격으로 0.25, 0.63, 1.01, 1.39, 1.77 m이고, 뒤쪽 안쪽 면 Z = -2.66 m에서 앞으로 0.55 m 깊이, 두께 0.02 m로 둔다. motion 인터페이스와 기준 상태는 [외투장 문짝](#coat-closet-doors)과 같다. 소스 owner는 `src/models/closet.ts`이며 복도 도착면 view와 장 단면으로 검사한다.

## 수납 부재의 표면과 표현 한계 {#closet-fitting-surfaces}

[이름 규칙](00-model-frame.md#model-surface-partition-naming)에 따라 문짝은 `leaf`와 `leaf-panel`, 트랙은 `rail`, 봉은 `rod`, 선반은 `shelf`, 손잡이 홈은 `handle`을 쓴다. [표현 상한](00-model-frame.md#model-representation-ceiling) 안에서 롤러·브래킷·선반 받침 나사는 만들지 않고 옷·수건·용기는 이 모델이 아니라 소품 모델이 맡는다. 검사 주소는 [모델 리뷰 뷰 목록](00-model-frame.md#model-review-set)이며 실제 렌더는 unverified다. 소스 owner는 `src/models/closet.ts`다.
