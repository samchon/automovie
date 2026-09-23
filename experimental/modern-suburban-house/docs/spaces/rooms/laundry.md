# 세탁·머드룸의 양쪽 문

## 서비스 통로와 차고 사이 {#laundry-plan}
<!--
@evidence principles/core/common.md#scope-preservation laundry-mudroom의 경계, 마주 보는 두 실문, 차고 쪽 한 단, 양쪽 대기, 작업/횡단 구분과 바닥 인계를 맡는다.
@evidence principles/core/common.md#substantive-completion 마감 안쪽 X = [3.22, 5.50], Z = [-4.55, -2.05] m, 두 문 개구부 Z = [-4.40, -3.35] m와 유효 폭 0.95 m, 차고 하부 대기 X = [5.75, 6.80]·머드룸 상부 대기 X = [4.45, 5.50]을 정한다.
@evidence principles/core/common.md#declared-basis 차고 쪽 0.15 m 단차는 ground-threshold-datums, 높은 문턱의 지지는 ground-threshold-junctions에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "우측 띠와 차고 사이의 완충실"을 서쪽 칸막이와 동쪽 공유 벽의 두 문이 마주 보고 -Z 문설주에서 머드룸 안으로 열리는 배치로 만든다.
@evidence principles/design/spaces.md#space-topology 서비스 접근과 차고를 잇는 두 실문을 같은 connector로 합치지 않고 이 방을 차고에 가는 유일한 내부 경로로 둔다.
@evidence principles/design/spaces.md#space-boundary-authority 두 opening id를 src/spaces/rooms/laundry.ts와 공유 벽 owner가 소비하고 높은 문턱의 상면/노출 챌면은 ground-threshold-junctions가 이 방 owner에게 배정한 것으로 받는다.
@evidence principles/design/spaces.md#space-verification-address 차고 하부 대기 X = [5.75, 6.80]과 머드룸 상부 대기 X = [4.45, 5.50]을 깎는 문틀·90° 문짝의 순폭, 문턱 단면, 양방향 바구니 이동을 반증 관찰로 둔다.
@evidence settings/10-house.md#laundry-mudroom 서비스 띠와 차고 사이 완충실에 세탁 설비와 신발/외투 기능을 함께 둔다.
@evidence settings/10-house.md#service-band 차고 출입문이 머드룸과 직접 맞닿게 공유 벽에 laundry-garage-door를 둔다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work laundry-mudroom의 완충실·차고 직접 연결과 garage의 머드룸 관찰 경로를 대조했고 마주 보는 두 문으로 성립해 부모 수정이 없었다.
-->

`laundry-mudroom`은 ground-storey의 실제 방이다. 마감 안쪽 X = [3.22, 5.50], Z = [-4.55, -2.05] m다. 서쪽은 [서비스 칸막이](service.md#service-access-plan), 동쪽은 [본채/차고 공유 벽](../00-building.md#attached-garage-extent), 앞은 파우더룸 칸막이, 뒤는 Z = [-4.70, -4.55]의 팬트리 칸막이다. [세탁 설비와 완충 기능](../../settings/10-house.md#laundry-mudroom)을 같은 방에서 수행한다.

`service-laundry-door`와 `laundry-garage-door`는 각각 서쪽 칸막이와 동쪽 공유 벽에서 거친 개구부 Z = [-4.40, -3.35], Y = [0, 2.20] m를 소유한다. 두 문 모두 최종 유효 폭 0.95 m를 목표로 하고 -Z 문설주에서 머드룸 안으로 열린다. 개구부가 마주 보며 열린 문짝은 뒤쪽 가장자리로 향한다. 두 문을 같은 connector로 합치지 않는다. 차고 쪽 0.15 m 단차는 [기존 문턱 datum](../01-storeys.md#ground-threshold-datums)을 받는다.

기기·상판/상부장과 벤치/걸이는 [세탁 작업 예약](#laundry-equipment-use)을 소비한다. 앞쪽 작업과 뒤쪽 두 실문 사이의 [횡단 경로](#laundry-through-route)를 구별하며 기기를 열어 놓았다는 이유로 [차고 내부 관찰도 거치는](../../settings/10-house.md#garage) 집과 차고 사이의 유일한 내부 경로가 끊기지 않게 한다.

차고 쪽 하부 대기 X = [5.75, 6.80]·Z = [-4.43, -3.38]와 머드룸 상부 대기 X = [4.45, 5.50]·Z = [-4.43, -3.38] m를 예약한다. 문틀과 90° 열린 문짝이 이 영역을 깎는 양도 실제 순폭에 포함한다. `src/spaces/rooms/laundry.ts`와 공유 벽 owner가 같은 두 opening id를 소비한다. 문턱 단면·양방향 바구니 이동·세탁 작업과 횡단의 간섭은 unverified다.

[한 단의 바닥 인계](../10-ground-floor.md#ground-threshold-junctions)는 높은 문턱을 공유 벽의 차고 쪽 면까지 본채 바탕으로 받치고, 그 상면/노출 챌면을 이 방 owner에게 배정한다. 기존 차고 하부 대기를 높은 디딤판으로 덮지 않으며 차고 바닥과 같은 끝선에서 만난다.

## 나란한 두 기기와 신발 벤치의 사용 {#laundry-equipment-use}
<!--
@evidence principles/core/common.md#scope-preservation 두 세탁 기기의 점유와 원형 문 작동, 바구니 작업, 접는 상판, 상부 수납, 신발 벤치와 걸이, 폐기한 벤치 방향의 기록을 맡는다.
@evidence principles/core/common.md#substantive-completion 기기 최대 폭 0.65 m·깊이 0.75 m·높이 0.88 m, Z 중심을 뒤쪽 끝에서 반 폭 물린 곳부터 0.65 m 간격으로 두 개 산출, 원형 문 -X 최대 0.50 m, 상판 0.94 m, 벤치 좌면 0.45 m를 정한다.
@evidence principles/core/common.md#declared-basis 기기 값은 특정 제품 규격이 아니며 앞벽 방향 벤치를 열린 기기 작업과 겹칠 수 있어 폐기했다는 근거를 남긴다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "나란한 앞문식 세탁기·건조기, 상부장/선반, 접는 상판, 신발 벤치와 외투 걸이"를 오른쪽 기기 벽과 왼쪽 벽 벤치의 배치로 만든다.
@evidence principles/design/spaces.md#space-topology 모든 설비를 laundry-mudroom 안에 두고 별도 방이나 문을 추가하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 벤치를 왼쪽 벽 방향으로 바꾸면서 실 외곽·문·층 datum은 유지했고 실제 경첩·문 지름·손잡이가 이 공간 예약을 넘으면 기기 원형과 배치로 돌아와 수정한다.
@evidence principles/design/spaces.md#space-verification-address 두 기기 수·몸체/작동 범위·접는 상판·벤치/외투 점유와 작업/횡단 분리를 관찰 집합에서 검사한다.
@evidence settings/10-house.md#laundry-mudroom 두 기기의 실제 깊이와 원형 도어, 세탁기 앞 바구니 작업 공간을 공간 예약으로 둔다.
@evidence settings/00-production.md#use-profile 열린 문 앞 바구니 작업에 사람 깊이를 X, 바구니 포함 폭을 Z로 적용한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work laundry-mudroom의 설비 목록·바구니 작업 공간과 use-profile의 0.75 m 폭을 오른쪽 기기 벽과 왼쪽 벤치로 나눈 방에 적용했고 벤치 방향 수정은 이 H2 안에서 해결돼 부모 수정이 없었다.
-->

같은 laundry-mudroom/ground-storey 안에서 오른쪽 기기 벽과 왼쪽 신발 벤치를 배정한다. 별도 방이나 문을 추가하지 않는다. 기기의 닫힌 점유 띠는 X = 4.75 m부터 [방의 오른쪽 안쪽 면](#laundry-plan)까지, Z = -3.35 m부터 앞쪽 안쪽 면까지다. 각 기기는 최대 폭 0.65 m·깊이 0.75 m·높이 0.88 m이며 뒤쪽 세탁기, 앞쪽 건조기 순서다. Z 중심은 뒤쪽 끝에서 반 폭만큼 물린 지점부터 0.65 m 간격으로 두 개를 산출한다. 이 값은 특정 제품 규격이 아니며 몸체·닫힌 원형 문·손잡이·뒤쪽 호스 연결 여유까지 이 점유 안에 담는다.

두 기기의 전면은 -X다. 각 원형 문의 작동 예약은 전면에서 -X로 최대 0.50 m, Z는 자기 기기 폭 내부에 한정한다. 열린 문 앞 바구니를 든 사람의 작업은 X = [3.80, 4.25] m, 세탁기 앞 Z = [-3.35, -2.60] m와 건조기 앞 Z = [-2.80, -2.05] m로 예약한다. [사용체](../../settings/00-production.md#use-profile)의 깊이를 X, 바구니 포함 폭을 Z에 적용한다. 두 기기의 작업 바닥은 한 사람이 순서대로 쓰며 일부 겹치는 면적을 동시 독립 작업으로 합산하지 않는다. 실제 경첩·문 지름·손잡이가 이 공간을 넘으면 기기 원형과 배치로 돌아와 수정한다. 뒤쪽 횡단 띠에 바구니를 내려놓지 않는다. 기기 앞 작업과 뒤쪽에서 다른 사람이 바구니를 운반하는 상태를 함께 관찰한다.

접는 상판은 두 기기 띠와 같은 평면의 상면 높이 0.94 m로 예약한다. 높이는 방의 완성 바닥 기준이고 지지 부재가 기기 원형 문을 가리지 않아야 한다. 상부 수납은 X = 5.20 m부터 오른쪽 안쪽 면까지, Z는 같은 두 기기 띠, 하단 높이 1.50 m·상단 2.30 m다. 아래 문짝/기기 사용을 방해하는 돌출은 허용하지 않는다. 세탁·전기·배기 성능이나 제품 설치 인증을 주장하지 않는다.

신발 벤치는 왼쪽 안쪽 면부터 X = 3.62 m까지, Z = -2.85 m부터 앞쪽 안쪽 면까지, 좌면 높이 0.45 m로 예약하고 +X를 향한다. 벤치 위 걸이와 걸린 외투의 최대 돌출은 같은 X 깊이 안이며 높이 1.10–1.85 m에 둔다. 신발을 신거나 벗는 점유는 벤치 전면부터 X = 4.25 m까지, Z는 벤치 폭 안이다. 이 바닥은 기기 앞 작업 점유와 일부 공유하므로 신발 착용과 바로 앞 기기 작업은 교대로 사용한다. 두 작업을 동시에 가능한 독립 면적으로 합산하지 않는다. 외투/신발의 수와 형상은 후속 원형·배치가 결정하되 걸린 옷을 뒤쪽 통로로 넘기지 않는다.

이전 앞벽 방향의 벤치 예약은 열린 기기 앞 작업과 몸체가 겹칠 수 있어 폐기하고 왼쪽 벽 방향으로 바꿨다. 실 외곽·문·층 datum은 유지했다. 공간 입력은 models/instances가 소비하고 방의 완결 면은 `src/spaces/rooms/laundry.ts`가 맡는다. 두 기기 수·몸체/작동 범위·접는 상판·벤치/외투의 실제 점유, 작업과 횡단 분리, 작은 방의 내부 읽힘은 [관찰 집합](../04-observations.md#spatial-observation-derivation)에서 검사하며 현재 unverified다.

## 기기를 열어도 남기는 차고 횡단 {#laundry-through-route}
<!--
@evidence principles/core/common.md#scope-preservation 두 출입문 사이의 횡단 띠, 문 회전과 통과의 구분, 한 단 내려가기, 차고 경로로의 연결을 맡는다.
@evidence principles/core/common.md#substantive-completion 방의 왼쪽 안쪽 면부터 오른쪽 안쪽 면까지 Z = [-4.32, -3.42] m를 사용 점유가 침범하지 않는 횡단 예약으로 정한다.
@evidence principles/core/common.md#declared-basis 문 유효폭 목표는 laundry-plan, 작업 구역은 laundry-equipment-use, 한 단의 높이는 문턱 datum에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "세탁기 앞 바구니 작업 공간과 차고에서 집으로 들어오는 경로가 겹쳐 막히지 않게"를 앞쪽 작업 구역과 뒤쪽 횡단 띠의 분리로 만든다.
@evidence principles/design/spaces.md#space-topology 머드룸 상부 대기에서 차고 하부 대기로 내려가 garage-use-routes로 이어지는 연결을 정한다.
@evidence principles/design/spaces.md#space-boundary-authority 두 문을 90° 연 기준에서 문틀·문짝 두께·손잡이 뒤에도 laundry-plan의 문 유효폭 목표와 0.90 m 띠가 남게 하고 두 사용을 다른 색 표시로 대신하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 두 문을 열고 바구니를 든 사람의 양방향 통과 평면/문턱 단면, 기기별 문 개방과 작업자를 더한 상태를 검사한다.
@evidence settings/00-production.md#use-profile 횡단 띠에 0.90 m 폭을 요구하고 문 회전 중과 통과 중을 동시 통행으로 주장하지 않는다.
@evidence settings/10-house.md#laundry-mudroom 세탁 작업을 앞쪽 작업 구역에 두고 차고에서 집으로 들어오는 경로를 Z = [-4.32, -3.42] m 뒤쪽 횡단 띠로 분리한다.
@evidence obligations/design/spaces.md#space-access-circulation 머드룸 상부 대기에서 차고 하부 대기로 이어지는 두 출입문 사이에 열린 기기와 기기 앞 작업자가 침범하지 않는 Z = [-4.32, -3.42] m 횡단 띠를 배정한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work laundry-mudroom의 작업/경로 비충돌과 use-profile의 0.90 m 통로를 두 문 사이에 적용했고 0.90 m 폭의 뒤쪽 띠가 성립해 부모 수정이 없었다.
-->

이 경로는 [두 출입문과 양쪽 대기](#laundry-plan)를 잇는 같은 방 안의 바닥 띠다. X는 방의 왼쪽 안쪽 면부터 오른쪽 안쪽 면까지, Z = [-4.32, -3.42] m를 사용 점유가 침범하지 않는 횡단 예약으로 둔다. 실 출입문 두 개를 각각 90° 연 기준에서 문틀·문짝 두께·손잡이 뒤에도 이 띠의 [연속 통로 폭 목표](../../settings/00-production.md#use-profile)인 0.90 m 폭과 [문 유효폭 목표](#laundry-plan)가 남아야 한다. [세탁기 앞 바구니 작업과 차고에서 집으로 들어오는 경로가 겹쳐 막히지 않게](../../settings/10-house.md#laundry-mudroom) 열린 세탁기/건조기·기기 앞 작업자는 [앞쪽 작업 구역](#laundry-equipment-use)에 있고 바구니 운반자는 이 뒤쪽 띠를 지난다. 두 사용을 단순히 다른 색으로 표시하고 실제 충돌을 무시하지 않는다.

실문이 회전하는 동안의 부채꼴은 통과 예약과 다르다. 문을 조작한 다음 통과하고, 반대편 사람이 문을 여닫는 순간까지 동시 통행이라고 주장하지 않는다. 머드룸의 상부 대기에서 차고의 하부 대기로 내려갈 때는 [기존 한 단의 높이](../01-storeys.md#ground-threshold-datums)와 문턱 경계를 소비한다. 하부 대기는 [차고 내부 경로](garage-interior.md#garage-use-routes)에 이어지며 물건 보관 면적에 넣지 않는다. 두 문을 열고 바구니를 든 사람이 양방향으로 통과하는 평면/문턱 단면, 기기별 문 개방과 작업자를 더한 상태, 문 조작 시 대기 위치를 검사한다. 현재는 설계 입력이며 실제 충돌·회전·도달성은 unverified다.
