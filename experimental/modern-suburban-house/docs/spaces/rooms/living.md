# 전면 왼쪽 거실

## 거실 경계와 직접 출입 {#living-plan}
<!--
@evidence principles/core/common.md#scope-preservation living-room의 경계, entry-living-door, 문 앞 가구 금지 구역, 공용부 연결·벽난로·창의 소비 관계와 관찰 질문을 맡는다.
@evidence principles/core/common.md#substantive-completion 마감 안쪽 X = [-5.50, -1.95], Z = [-6.05, -0.25] m와 공유 벽의 문 개구부 Z = [-1.35, -0.35], Y = [0, 2.20] m, 유효 폭 목표 0.90 m를 정한다.
@evidence principles/core/common.md#declared-basis 폭 3.55 m·깊이 5.80 m를 소파·벽난로·독서 가구의 길이 방향 배치와 앞뒤 출입 분리를 위한 선택으로 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "현관에서 직접 보이며"를 -Z 문설주 경첩으로 거실 쪽 -X로 여는 entry-living-door와 가구를 놓지 않는 문 앞 바닥 X = [-2.85, -1.95]·Z = [-1.40, -0.35]로 만들어 앞쪽 현관에서 보이는 열린 문으로 답한다.
@evidence principles/design/spaces.md#space-topology 거실의 바깥 두 면은 외벽, 오른쪽은 계단 분리 경계와 현관, 뒤쪽은 공용부라는 인접을 정하고 현관·공용부와 직접 연결한다.
@evidence principles/design/spaces.md#space-boundary-authority 공용부 쪽 개구부는 common owner, 벽난로 접면은 굴뚝 owner, 두 창 void는 입면 owner에서 소비하고 방 안에서 별도 창 좌표를 만들지 않는다.
@evidence principles/design/spaces.md#space-verification-address 문과 창이 같은 방 경계를 품는지, 소파/벽난로가 앞뒤 통행을 막는지, 현관에서 거실을 볼 수 있는지를 관찰 질문으로 둔다.
@evidence settings/10-house.md#living ground-storey의 living-room을 entry-living-door로 현관과 직접 연결하고 living-front-window·living-left-window의 void와 벽난로의 왼쪽 외벽 접면을 같은 방 경계에서 소비한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work living의 위치·직접 출입·벽난로 조건을 대조했고 폭 3.55 m·깊이 5.80 m 안에 소파·벽난로·독서 가구의 길이 방향 배치와 앞뒤 출입 분리를 택해 부모 수정이 없었다.
-->

`living-room`은 ground-storey에 속하며 마감 안쪽 X = [-5.50, -1.95], Z = [-6.05, -0.25] m다. 바깥쪽 두 면은 [본채 외벽](../00-building.md#main-building-extent), 오른쪽은 [계단 분리 경계](../02-stair.md#stair-floor-opening)와 현관, 뒤쪽은 후면 공용부다. 폭 3.55 m·깊이 5.80 m의 선택은 [거실의 소파·벽난로·독서 가구](../../settings/10-house.md#living)를 길이 방향으로 배치하고 출입을 앞뒤로 분리하기 위한 것이다.

`entry-living-door`는 X = [-1.95, -1.80]의 현관/거실 공유 벽에 거친 개구부 Z = [-1.35, -0.35], Y = [0, 2.20] m를 만든다. 문틀 뒤 유효 폭 목표는 0.90 m다. -Z 문설주를 경첩으로 삼아 거실 쪽 -X 방향으로 열고, X = [-2.85, -1.95]·Z = [-1.40, -0.35]의 문 앞 바닥에는 가구를 놓지 않는다. 앞쪽 현관에서 보이는 열린 문이 직접 접속을 답한다.

후면 공용부로 통하는 상인방 아래의 문짝 없는 개구부는 [공용부 owner](common.md#common-room-plan)가 소유한다. 벽난로의 왼쪽 외벽 접면과 공간 예약은 [굴뚝 owner](../envelope/left.md#chimney-roof-interface)를 소비한다. 창은 [living-front-window](../envelope/front.md#living-front-window)와 [living-left-window](../envelope/left.md#living-left-window)의 동일 void를 소비하며 방 안쪽에서 별도 창 좌표를 만들지 않는다. 벽난로와 창호의 실제 부재는 미완료다. `src/spaces/rooms/living.ts`가 방의 완결 내부를 소유한다. 거실 문과 창이 같은 방 경계를 품는지, 소파/벽난로가 앞뒤 통행을 막는지, 현관에서 거실을 볼 수 있는지가 관찰 질문이다. 실제 순폭·가구 간섭·창/굴뚝 binding·프레임은 unverified다.

## 벽난로를 향한 좌석과 독서 가구 {#living-furniture-use}
<!--
@evidence principles/core/common.md#scope-preservation 설정이 요구한 소파·낮은 테이블·안락의자·책장·러그의 점유와 앉고 일어서는 사용, 벽난로 돌출 한계를 모두 배정한다.
@evidence principles/core/common.md#substantive-completion 네 가구의 평면 예약·높이·방향 표와 소파 앞 사용 X = [-3.45, -2.90], Z = [-3.60, -1.80] m, 다섯 선반을 0.20 m부터 0.35 m 간격으로 산출하는 규칙을 정한다.
@evidence principles/core/common.md#declared-basis 높이는 1층 완성 바닥 기준이며 수치는 제품 치수나 제작 완료가 아닌 최대 점유 입력이라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 소파는 계단 분리벽에 등을 대고 벽난로를 향하며 안락의자와 책장은 뒤쪽에 두는 배치 결정을 설정의 가구 목록에 더한다.
@evidence principles/design/spaces.md#space-topology 모든 가구와 사용 영역을 living-room 안에 두고 의자 사용 발 점유를 책장 횡단 통로에 합산하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 벽난로 전체 돌출은 굴뚝/실내 접면의 기존 상한에서 받고 hearth나 목재 선반을 통로에 덧붙이지 않는다.
@evidence principles/design/spaces.md#space-verification-address 평면/단면에서 좌석·테이블·책장과 사용 점유를 겹쳐 읽고 후면까지의 동선을 함께 검사한다.
@evidence settings/10-house.md#living 패브릭 소파·낮은 목재 테이블·작은 안락의자·짙은 책장·러그를 불이 꺼진 정적 상태의 공간 점유로 두고 소파가 왼쪽 벽난로를 향하게 한다.
@evidence settings/00-production.md#use-profile 소파 앞 사용 영역에 사람 점유체의 깊이를 X, 폭을 Z로 적용한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work living의 가구 목록과 "좌석이 문·계단 접근을 가로막지 않는다", use-profile의 점유체를 대조했고 네 가구와 사용 범위가 방 안에 들어가 부모 수정이 없었다.
-->

같은 living-room/ground-storey 안에서 [거실 설정](../../settings/10-house.md#living)의 소파는 오른쪽 계단 분리벽에 등을 대고 왼쪽 벽난로를 향한다. 작은 안락의자와 책장은 뒤쪽에 둔다. 아래 world X/Z m는 몸체·손잡이의 최대 점유 입력이며 높이는 [1층 완성 바닥](../01-storeys.md#storey-datums) 기준이다. 특정 가구 제품의 치수나 제작 완료를 뜻하지 않는다.

| 가구 | 평면 예약 | 높이와 방향 |
| --- | --- | --- |
| 패브릭 소파 | X = -2.90 m부터 방 오른쪽 안쪽 면까지, Z = [-3.75, -1.65] | 좌면 0.43 m, 등받이 0.90 m, -X를 향함. |
| 낮은 목재 테이블 | X = [-3.95, -3.45], Z = [-3.30, -2.00] | 상면 0.42 m. 길쭉한 상판은 소파 길이 방향을 따름. |
| 독서 안락의자 | X = [-3.90, -3.05], Z = [-5.65, -4.80] | 좌면 0.43 m, 등받이 0.90 m, +Z를 향함. |
| 짙은 책장 | X = -2.30 m부터 방 오른쪽 안쪽 면까지, Z = [-5.90, -4.90] | 높이 1.90 m, 책을 꺼내는 면은 -X. |

소파 앞 앉고 일어서는 사용은 테이블과 소파 사이 X = [-3.45, -2.90], Z = [-3.60, -1.80] m다. [사람 점유체](../../settings/00-production.md#use-profile)의 깊이를 X에, 폭을 Z에 적용한다. 독서 의자의 발/일어서는 범위는 X = [-3.90, -3.05], Z = [-4.80, -4.20] m, 책장 앞 사용은 X = [-2.90, -2.30], Z = [-5.80, -5.00] m다. 의자를 사용하는 순간의 발 점유를 책장으로 가는 횡단 통로에 합산하지 않는다. 책장은 문 없는 선반이며 다섯 선반 상면을 0.20 m부터 0.35 m 간격으로 산출하고 책/물건은 몸체 깊이 안에 둔다.

러그의 평면은 X = [-4.00, -2.00], Z = [-3.90, -1.55] m, 두께 0.008 m 이내로 예약한다. 좌석·테이블 밑에 두고 문 회전이나 벽난로 앞 주 통행 바닥으로 늘리지 않는다. 무늬·패브릭·목재·책/조명과 벽난로 화구·벽돌·선반의 실제 원형/재료는 후속 저작이다. 벽난로 전체 돌출은 [굴뚝/실내 접면](../envelope/left.md#chimney-roof-interface)의 기존 상한 안에서 해결하고 바닥 hearth나 목재 선반을 통로에 덧붙이지 않는다. 불이 꺼진 정적 상태의 공간 배치이며 연소/열 성능 검증은 아니다.

완결 면은 기존 living owner가 유지한다. 평면/단면에서 좌석·테이블·책장과 사용 점유를 겹쳐 읽고 [후면까지의 동선](#living-through-route)을 함께 검사한다. 실제 가구 원형·충돌·착석 시야·벽난로/창의 깊이와 02/04의 거실 읽힘은 [관찰 owner](../04-observations.md#spatial-observation-derivation)의 전체 질문에 들어가며 현재 unverified다.

## 두 출입과 창·좌석으로 이어지는 바닥 {#living-through-route}
<!--
@evidence principles/core/common.md#scope-preservation 현관 쪽 문에서 공용부 개구부까지의 주 통행 띠, 문 회전 중의 대기, 두 창·소파·책장·의자로 가는 분기를 맡는다.
@evidence principles/core/common.md#substantive-completion 주 통행 띠 X = [-4.90, -4.00]와 테이블 앞쪽 Z = [-1.45, -0.45] m 바닥, 커튼의 창 안쪽 돌출 0.12 m 이내를 정한다.
@evidence principles/core/common.md#declared-basis 0.90 m 통로 목표는 use-profile에서 받은 설계 입력 조건이며 실제 순폭 판정이 아니라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 거실이 현관과 공용부를 모두 잇는다는 설정을 벽난로 앞면과 테이블 사이의 띠, 문 없는 경계에서 옆으로 이동하는 경로로 만든다.
@evidence principles/design/spaces.md#space-topology 같은 living-room 내부에서 현관 문과 공용부 개구부를 잇고 책장 뒤를 숨은 통로로 만들지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 공용부 쪽 주방 진입은 common-clear-routes, 창대/손잡이 돌출은 external-opening-interface에서 받는다.
@evidence principles/design/spaces.md#space-verification-address 두 방의 따로 잰 폭을 더하지 않고 하나의 점유체가 모서리를 도는 경로와 열린 문짝/창대·커튼 사이 통과 폭을 검사한다.
@evidence settings/00-production.md#use-profile 0.90 m 통로 목표를 X = [-4.90, -4.00] 주 통행 띠의 설계 입력 조건으로 적용하고 문 없는 경계에서는 하나의 점유체가 모서리를 도는 경로로 검사한다.
@evidence settings/10-house.md#living 좌석이 문 접근을 막지 않도록 소파 착석 영역을 통과 경로로 세지 않는다.
@evidence obligations/design/spaces.md#space-access-circulation 현관↔공용부의 연결을 거실 안의 구체 통행 띠로 배정하고 의자 사용·책장 횡단 중에도 그 띠를 유지한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work use-profile의 0.90 m 통로 목표와 living의 좌석-접근 조건을 벽난로·테이블 사이에 적용했고 X = [-4.90, -4.00] 띠가 성립해 부모 수정이 없었다.
-->

같은 living-room 내부에서 [현관 쪽 문](#living-plan)과 [공용부 쪽 개구부](common.md#common-room-plan)를 잇는다. 주 통행 띠는 X = [-4.90, -4.00], Z는 방 뒤쪽 안쪽 면부터 -1.45 m까지다. 벽난로 앞면과 테이블 사이에 두고, [좌석이 문·계단 접근을 가로막지 않는다는 거실 조건](../../settings/10-house.md#living)에 따라 소파 착석 영역을 통과 경로로 세지 않는다. 거실 출입문을 90° 연 상태에서 문짝의 전면 쪽 바닥을 따라 왼쪽으로 먼저 들어온 뒤, 테이블 앞쪽의 Z = [-1.45, -0.45] m 바닥에서 주 통행 띠로 꺾는다. 앞쪽 바닥은 문 안쪽 대기와 연속된 같은 room 표면이며 별도 복도가 아니다. 문 회전 중에는 기다리고, 열린 문짝의 두께/손잡이와 전면 창대·커튼 사이 실제 통과 폭을 함께 검사한다.

뒤쪽에서는 기기를 닫은 [주방 진입](common.md#common-clear-routes)의 냉장고와 섬 사이로 이어진다. 문 없는 경계에서 통로가 옆으로 이동하므로 두 방의 따로 잰 폭만 더하지 않고 하나의 점유체가 모서리를 도는 경로를 검사한다. 옆 창에는 주 통행 띠에서 왼쪽으로, 앞 창에는 테이블 앞 바닥에서 접근한다. 커튼은 각 창 안쪽 돌출 0.12 m 이내로 제한하고 [창대/손잡이](../06-openings.md#external-opening-interface)를 포함한 실제 접근 여유를 읽는다.

소파는 앞쪽 열린 끝에서 좌석 앞으로 들어가고, 책장은 소파 뒤쪽 Z = [-4.65, -3.75] m 바닥을 가로질러 오른쪽으로 접근한다. 독서 의자는 이 횡단 바닥에서 자기 좌석에 닿는다. 의자 발을 둔 상태와 책을 꺼내러 횡단하는 상태는 순차 사용이며, 어느 상태에서도 왼쪽의 현관↔공용부 주 통행 띠는 유지한다. 책장 뒤를 숨은 통로로 만들지 않는다.

실제 문틀/열린 문짝·손잡이, 벽난로·소파·테이블·러그와 좌석 사용체를 포함해 앞뒤 양방향 이동과 문 조작을 [전체 관찰](../04-observations.md#spatial-observation-derivation)에서 확인한다. [0.90 m 통로 목표](../../settings/00-production.md#use-profile)는 설계 입력에 적용한 조건이며 실제 산출물 순폭 판정이 아니다. 모든 기본 실내 시점과 02/04 질문은 유지하고 실제 통행·충돌·시야는 unverified다.
