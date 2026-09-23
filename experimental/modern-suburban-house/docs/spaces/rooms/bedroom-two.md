# 전면 왼쪽 자녀 침실

## 올리브 침실의 자기 경계 {#bedroom-two-plan}
<!--
@evidence principles/core/common.md#scope-preservation bedroom-two의 경계, 복도 쪽 자기 문, 전면 창 소비, 굴뚝 쪽 창 배제, 가구 사용 배정과 source owner를 맡는다.
@evidence principles/core/common.md#substantive-completion 마감 안쪽 X = [-5.50, -1.95], Z = [-4.56, -0.25] m, hall-bedroom-two-door X = [-3.10, -2.10] m와 유효 폭 0.90 m를 정한다.
@evidence principles/core/common.md#declared-basis 순내부 3.55 × 4.31 m를 한 자녀의 침대·책상·옷장과 별도 보행길을 넣기 위한 선택으로 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "복도에서 직접 들어가며 자기 외벽 창"을 +X 문설주 경첩·방 안 +Z 열림의 문과 전면 창 소비로 만든다.
@evidence principles/design/spaces.md#space-topology 앞·왼쪽 외벽, 오른쪽 계단실, 뒤쪽 복도/주침실과 인접하고 다른 침실이나 욕실을 지나지 않고 들어온다.
@evidence principles/design/spaces.md#space-boundary-authority 계단실 왼쪽 경계와 전면 창 void를 원래 owner에서 소비하고 복도의 계단 보호 경계에 문짝을 세우지 않는다.
@evidence principles/design/spaces.md#space-verification-address 문/창 binding, 자기 공간 안 네 방향과 네 모서리의 시야, 가구 접근을 검사한다.
@evidence settings/10-house.md#bedroom-two 한 자녀의 침대·책상·옷장과 별도 보행길을 넣는 방으로 복도에서 hall-bedroom-two-door로 바로 들어오고 다른 침실이나 욕실을 지나지 않게 한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work bedroom-two의 직접 출입·자기 창·별도 id를 대조했고 복도에서 자기 문으로 바로 들어오는 3.55 × 4.31 m 방으로 성립해 부모 수정이 없었다.
-->

`bedroom-two`는 upper-storey의 전면 왼쪽 방이다. 마감 안쪽 X = [-5.50, -1.95], Z = [-4.56, -0.25] m다. 앞·왼쪽은 [본채 외벽](../00-building.md#main-building-extent), 오른쪽은 [계단실 왼쪽 경계](../02-stair.md#stair-floor-opening), 뒤쪽은 Z = [-4.71, -4.56]의 복도/주침실 경계다. 순내부 예약 3.55 × 4.31 m는 한 자녀의 침대·책상·옷장과 별도 보행길을 넣기 위한 선택이다.

`hall-bedroom-two-door`는 뒤쪽 공유 벽에서 X = [-3.10, -2.10], Y = [3.06, 5.26] m의 거친 개구부다. 최종 유효 폭 0.90 m를 목표로 한다. +X 문설주 경첩에서 방 안 +Z 방향으로 열고 복도의 계단 보호 경계에 문짝을 세우지 않는다. [복도](upper-hall.md#upper-hall-plan)에서 자기 문으로 바로 들어오며 다른 침실이나 욕실을 지나지 않는다.

[올리브 침구의 방](../../settings/10-house.md#bedroom-two)으로 실현하며 [bedroom-two-front-window](../envelope/front.md#bedroom-two-front-window)의 void를 소비한다. 굴뚝 가까운 왼쪽 벽에는 창을 추가하지 않는다. [침대·책상·장의 사용](#bedroom-two-furniture-use)은 창 앞, 문 안쪽과 침대 옆 길을 함께 예약한다. `src/spaces/rooms/bedroom-two.ts`가 완결 내부 owner다. 문/창의 실제 binding·자기 공간 안 네 방향과 네 모서리의 시야·가구 접근은 unverified다.

## 올리브 침실의 잠자리·공부·옷 수납 {#bedroom-two-furniture-use}
<!--
@evidence principles/core/common.md#scope-preservation 자녀 침대, 협탁과 등, 책상과 의자 사용, 옷장, 창 접근 경로, 커튼 돌출을 배정한다.
@evidence principles/core/common.md#substantive-completion 네 가구의 평면·높이·방향 표와 의자 사용 X = [-4.90, -4.15], Z = [-1.45, -0.70] m, 옷장 앞 사용 X = [-3.15, -2.55] m를 정한다.
@evidence principles/core/common.md#declared-basis 높이는 상층 완성 바닥 기준이며 수치는 몸체·닫힌 문/손잡이의 상한 예약이라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "침대를 지나 창과 수납에 접근할 수 있어야"를 협탁 오른쪽과 침대 오른쪽 바닥을 돌아 창에 닿는 경로로 만든다.
@evidence principles/design/spaces.md#space-topology 복도의 자기 문에서 세 기능과 전면 창으로 분기하며 다른 방으로 통과하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 옷장 몸체를 방 오른쪽 안쪽 면까지로 두고 커튼은 전면 창 안쪽 돌출 0.12 m 이내로 제한해 창대를 포함한 순폭을 다시 읽는다.
@evidence principles/design/spaces.md#space-verification-address 문 회전·의자 사용·옷장 조작·침대 측면·창 접근의 평면과 02 및 자기 공간 안 시야를 검사한다.
@evidence settings/10-house.md#bedroom-two 침대·협탁과 조명·책상과 의자·옷 수납을 두고 벽과 가구 틈을 유일한 출입 경로로 삼지 않는다.
@evidence settings/00-production.md#use-profile 책상 의자를 물려 앉는 사용 범위에 사람 폭을 줄이지 않고 적용한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work bedroom-two의 가구 목록·창과 수납 접근 조건과 use-profile을 방에 적용했고 가구를 넘지 않는 창 경로가 성립해 부모 수정이 없었다.
-->

같은 bedroom-two/upper-storey에서 침대는 뒤쪽 왼편, 책상은 왼쪽 벽의 전면 창 가까이, 옷장은 오른쪽 벽에 둔다. 복도의 자기 문에서 세 기능과 전면 창으로 분기하며 다른 방으로 통과하지 않는다. 아래 world X/Z m는 몸체·닫힌 문/손잡이의 상한 예약이고 높이는 상층 완성 바닥 기준이다.

| 가구 | 평면 예약 | 높이와 방향 |
| --- | --- | --- |
| 자녀 침대 | X = [-5.25, -4.10], Z = [-4.50, -2.35] | 매트리스 상면 0.55 m, 머리판 0.95 m, 머리는 -Z. |
| 협탁과 등 | X = [-3.95, -3.50], Z = [-4.50, -4.05] | 상면 0.50 m, 등 포함 1.05 m. |
| 책상 | X는 방 왼쪽 안쪽 면부터 -4.90 m까지, Z = [-1.60, -0.40] | 상면 0.75 m, 좌석은 +X 쪽에서 -X를 향함. |
| 옷장 | X = -2.55 m부터 방 오른쪽 안쪽 면까지, Z = [-2.95, -1.45] | 높이 2.20 m, -X 쪽 미닫이 문. |

책상 의자를 물려 앉는 사용 범위는 X = [-4.90, -4.15], Z = [-1.45, -0.70] m이며 [사람 폭](../../settings/00-production.md#use-profile)을 줄이지 않는다. 옷장 앞 사용은 X = [-3.15, -2.55] m, Z는 옷장과 같은 폭이다. 복도 문에서 협탁 오른쪽을 지나 침대 오른쪽의 바닥으로 돌아 창에 닿는다. 의자 사용 범위의 오른쪽과 옷장 앞 사용 범위의 왼쪽을 통행으로 남기고 가구를 넘어 창에 가는 경로로 대체하지 않는다. 전면 창은 책상과 옷장 사이의 열린 바닥에서 접근한다.

옷장 미닫이와 내부 옷·선반은 몸체 예약 안에 있고 실제 분할·원형은 후속 저작이다. 올리브 침구, 얇은 커튼과 책상 소품은 설정을 소비하되 커튼은 전면 창 안쪽 돌출 0.12 m 이내로 제한하고 창대를 포함한 순폭을 다시 읽는다. 방 전체 면은 기존 owner를 유지한다. 문 회전·의자 사용·옷장 조작·침대 측면·창 접근의 평면과 02 및 자기 공간 안 전체 시야는 [관찰 owner](../04-observations.md#spatial-observation-derivation)가 검사하며 실제 충돌/순폭/프레임은 unverified다.
