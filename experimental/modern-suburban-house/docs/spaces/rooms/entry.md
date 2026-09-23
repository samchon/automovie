# 현관의 진입과 분배

## 포치에서 거실과 계단으로 {#entry-plan}
<!--
@evidence principles/core/common.md#scope-preservation front-entry의 L형 바닥, 계단 하부 대기의 포함, front-door의 개구부·경첩·열림, 거실·계단·서비스로의 직접 연결과 source owner를 모두 맡는다.
@evidence principles/core/common.md#substantive-completion 마감 안쪽 여섯 꼭짓점 (-1.80, -0.25)부터 (-1.80, -1.45)까지의 닫힌 평면과 front-door 개구부 X = [0.40, 1.40], Y = [0, 2.20] m, 유효 폭 0.90 m 이상을 정한다.
@evidence principles/core/common.md#declared-basis 본채 안쪽 한계·층 기준·문턱 높이·계단 하부 대기는 각각 main-building-extent·storey-datums·ground-threshold-datums·stair-reservation에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "거실과 중앙 단일 꺾임계단에 각각 직접 이어지는 분배 공간"을 계단 아래 구간과 오른쪽 보호벽을 뺀 L형 바닥과 +X 경첩·실내 -Z 열림의 문으로 만든다.
@evidence principles/design/spaces.md#space-topology front-entry를 ground-storey에 두고 포치→front-door→현관, 현관→거실·계단·서비스가 다른 방을 거치지 않는 연결 그래프를 명시한다.
@evidence principles/design/spaces.md#space-boundary-authority 계단 하부 대기 X = [-1.80, -0.65]·Z = [-1.45, -0.25]는 stair owner의 값을 포함 관계로만 소비하고 거실·서비스 쪽 경계는 각 owner로 링크한다.
@evidence principles/design/spaces.md#space-verification-address 입구 문짝의 회전, 하부 대기와 거실문 열림, 현관 안의 전체 관찰 pose를 이 평면을 반증할 관찰로 든다.
@evidence settings/10-house.md#entry 왼쪽 거실을 통해서만 계단으로 가게 하거나 파우더룸을 통로로 쓰지 않도록 두 방향을 모두 현관에 노출한다.
@evidence settings/00-production.md#coverage-map 설계 branch가 정할 결정으로 남겨진 문 여닫힘 위치를 +X 문설주 경첩과 실내 -Z 열림으로 정한다.
@evidence obligations/design/spaces.md#space-access-circulation 표현된 주 출입구 front-door에 유효 폭 0.90 m 이상과 문을 연 상태에서도 비워 둔 계단 대기까지의 바닥을 배정해 세 연결이 문 뒤에서도 통과 가능하게 한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work entry의 직접 분배·파우더룸 비통로 조건과 stair의 중앙 단일 계단, use-profile의 문 0.80 m 목표를 L형 평면에 적용했고 0.90 m 문과 두 직접 연결이 성립해 부모 수정이 없었다.
-->

`front-entry`는 ground-storey의 실내 분배 공간이다. [본채 안쪽 한계](../00-building.md#main-building-extent)와 [층 기준](../01-storeys.md#storey-datums)을 소비한다. 마감 안쪽 평면 꼭짓점은 (X, Z) m로 (-1.80, -0.25), (2.02, -0.25), (2.02, -3.41), (-0.50, -3.41), (-0.50, -1.45), (-1.80, -1.45)다. 마지막 점에서 첫 점으로 닫는다. 계단의 아래 구간과 오른쪽 보호벽을 방 바닥에서 제외한 L형이며, [단일 계단](../02-stair.md#stair-reservation)의 하부 대기 X = [-1.80, -0.65]·Z = [-1.45, -0.25]가 이 방에 포함된다.

`front-door`는 포치와 이 현관 사이의 본채 전면 벽에 속한다. 거친 벽 개구부는 X = [0.40, 1.40], Y = [0, 2.20] m, 벽 두께 방향은 Z다. 유효 폭 0.90 m 이상을 남기는 문틀을 후속 부재로 맞춘다. +X 문설주에 경첩을 두고 실내 -Z 방향으로 열리는 문짝을 예약한다. 닫힘이 기준 상태이며 내부 관찰을 위한 열림에서도 계단 대기까지의 바닥을 비운다. 포치 높이는 [문턱 기준](../01-storeys.md#ground-threshold-datums)을 따른다.

거실은 [자기 출입구](living.md#living-plan)로 직접 연결되고 계단 첫 단도 같은 현관에 노출된다. 오른쪽은 [서비스 접근](service.md#service-access-plan)에 열린다. 현관에서 거실·계단·서비스로 가는 길에 다른 방을 통과하지 않는다. 소스 배정은 `src/spaces/rooms/entry.ts`다. 입구 문짝의 회전, 하부 대기와 거실문 열림, 현관 안의 전체 관찰 pose가 이 평면을 반증할 수 있다. 현재 door binding·문틀 순폭·통행·시야는 unverified다.

## 현관문 뒤의 매트와 분배 바닥 {#entry-use-routes}
<!--
@evidence principles/core/common.md#scope-preservation 현관문 뒤의 얕은 매트, 추가 가구 배제, 문을 연 사람의 세 방향 분기와 바구니 회전, 04의 관찰 질문을 맡는다.
@evidence principles/core/common.md#substantive-completion 매트를 world X = [0.45, 1.35], Z = [-1.95, -1.30] m, 두께 0.006 m 이내로 문이 90° 열렸을 때의 끝보다 뒤에 둔다.
@evidence principles/core/common.md#declared-basis 매트와 목재문은 entry 설정, 사람·바구니는 use-profile에서 받고 매트 위치는 문 끝과의 관계에서 선택했다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "문 여닫힘과 보행 경로가 매트·수납에 막히지 않도록"을 매트 좌표와 벤치·콘솔·화분 배제로 만든다.
@evidence principles/design/spaces.md#space-topology 문을 연 사람이 왼쪽 계단 하부 대기와 거실문, 뒤쪽·오른쪽 서비스 접속으로 분기하는 방 안의 경로를 정한다.
@evidence principles/design/spaces.md#space-boundary-authority 문 void와 계단 대기는 entry-plan·stair owner에서 받고 이 H2는 매트와 사용 순서만 저작한다.
@evidence principles/design/spaces.md#space-verification-address 거실문과 현관문을 함께 연 평면/단면, 문을 여는 순간과 통과하는 순간, 계단을 오르내리며 보이는 분배 방향을 관찰로 추가한다.
@evidence settings/10-house.md#entry 얕은 매트를 문 회전 범위 밖에 두고 외투는 닫힌 수납으로 보내 진입 바닥을 비운다.
@evidence settings/00-production.md#use-profile 바구니를 든 경우에도 같은 사용체로 계단 난간 끝·문틀·걸레받이를 포함한 회전을 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work entry의 얕은 매트·비운 진입 바닥과 use-profile의 0.75 m 바구니 폭을 분배 바닥에 적용했고 매트를 문 끝 뒤에 두어 성립해 부모 수정이 없었다.
-->

같은 front-entry/ground-storey의 [목재 현관문과 얕은 매트](../../settings/10-house.md#entry)를 소비한다. 매트는 world X = [0.45, 1.35], Z = [-1.95, -1.30] m, 1층 완성 바닥 위 두께 0.006 m 이내다. 문이 90° 열렸을 때의 끝보다 뒤쪽에 두고 실제 문 하단/손잡이의 작동 범위와 검사한다. 벤치·콘솔·화분은 이 분배 바닥에 추가하지 않으며 외투는 [계단 아래 수납](#entry-coat-storage)으로 보낸다.

문을 열고 들어온 사람은 왼쪽의 계단 하부 대기와 거실문, 뒤쪽·오른쪽의 서비스 접속으로 분기한다. 계단 하부 대기와 거실문 앞은 함께 열린 바닥이며 문 조작자와 계단에서 내려오는 사람이 같은 지점을 동시에 점유한다고 주장하지 않는다. 바구니를 든 경우도 [동일 사용체](../../settings/00-production.md#use-profile)를 쓰고 계단 난간 끝·문틀·걸레받이를 포함한 회전을 검사한다. 외투장을 사용하지 않는 상태에서는 현관에서 서비스 통로로 바로 돌아갈 수 있어야 한다.

[거실문](living.md#living-plan)과 현관문을 함께 연 평면/단면, 문을 여는 순간과 열린 문을 통과하는 순간, 계단을 오르내리며 보이는 분배 방향을 [전체 관찰](../04-observations.md#spatial-observation-derivation)에 추가한다. 04의 현관·거실·계단이 같은 집의 직접 연결로 읽혀야 하고 L형 현관의 기본 시점·숨은 코너도 유지한다. 현재 매트/문 간섭·회전·실제 순폭·시각 결과는 unverified다.

## 위 계단 아래의 닫힌 외투장 {#entry-coat-storage}
<!--
@evidence principles/core/common.md#scope-preservation 위 flight 아래의 외투장 몸통·개구부·미닫이 두 장·봉과 선반·앞 사용 예약·계단 구조와의 확인을 맡는다.
@evidence principles/core/common.md#substantive-completion 몸통 X = [1.10, 1.75], Z = [-4.56, -3.51], Y = [0, 2.15] m, entry-coat-opening, 바닥 위 1.65 m 봉과 2.00 m 선반, 통로 쪽 돌출 X = 2.07 m 한계를 정한다.
@evidence principles/core/common.md#declared-basis 장 위치는 stair-reservation의 위 flight, 앞 사용은 use-profile에서 받고 계단 아래면의 권위는 계단 owner에 있다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "현관 가까운 외투 수납은 닫힌 문 안"을 계단 아래 높은 끝의 깊이 0.65 m 장과 서비스 통로 쪽 겹쳐 미는 문으로 만든다.
@evidence principles/design/spaces.md#space-topology 장은 현관에서 서비스 접근을 따라 닿는 front-entry의 접면이며 관통 바닥이나 뒤쪽 문이 없는 수납이다.
@evidence principles/design/spaces.md#space-boundary-authority 계단 디딤 높이와 구조 아래면은 계단 owner에서 확인하고 장의 벽·걸이·문짝만 src/spaces/rooms/entry.ts가 소유한다.
@evidence principles/design/spaces.md#space-verification-address 실제 옷 깊이, 두 문 겹침, 계단 아래 단면, 옷을 꺼내고 현관으로 돌아오는 경로를 반증 관찰로 둔다.
@evidence settings/10-house.md#storage 현관 외투장을 쓰는 공간에서 직접 닿고 숨은 통로가 되지 않는 수납으로 만든다.
@evidence settings/00-production.md#use-profile 앞쪽 사용 예약 X = [2.10, 2.70], Z = [-4.40, -3.65] m에서 사람 깊이를 X·폭을 Z에 적용하고 사용자가 물러난 뒤 주 통로 순폭을 요구한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work storage의 닫힌 외투장, entry의 비운 진입 바닥, stair의 위 flight 높이를 대조했고 장을 높은 끝 아래에 두어 성립해 부모 수정이 없었다.
-->

[현관](#entry-plan)에서 연결된 서비스 접근을 따라 닿는 외투장을 [위 flight](../02-stair.md#stair-reservation) 아래의 높은 끝에 둔다. 수납 몸통 예약은 X = [1.10, 1.75], Z = [-4.56, -3.51], Y = [0, 2.15] m다. 그 앞 X = [1.75, 2.02]는 장과 서비스 통로 사이의 열린 reveal로 잇는다. `entry-coat-opening`은 계단 아래 +X 끝의 X = [1.87, 2.02] 경계에 Z = [-4.51, -3.56], Y = [0, 2.15] m의 개구부를 만든다. 문 앞에 막힌 패널을 남겨 수납을 가리지 않는다.

문은 서비스 통로에 맞춘 X = 2.02 m 면의 겹쳐 미는 두 장으로 택한다. 사람이 통과하는 방 문이 아니라 부분 개방으로 옷을 꺼내는 수납문이며, 깊이 0.65 m의 몸통에는 옷걸이·선반을 둔다. 옷을 뺀 빈 상자를 사람이 들어가는 방으로 사용하지 않는다. 관통 바닥이나 뒤쪽 문은 없다.

봉은 몸통 뒤쪽 X 끝에서 +X로 0.325 m, 바닥 위 1.65 m에 두고 Z 방향으로 건다. 위 선반 상면은 2.00 m이며 옷/옷걸이를 포함한 점유는 기존 몸통 안에 둔다. 문/손잡이의 통로 쪽 최대 돌출은 X = 2.07 m까지다. 앞쪽 사용 예약은 X = [2.10, 2.70], Z = [-4.40, -3.65] m에서 -X를 향하며 몸 깊이는 X·폭은 Z에 적용한다. 장에서 옷을 꺼낼 때는 [서비스 띠](service.md#service-access-plan)의 일부를 쓰므로 다른 사람과 교대로 통과한다. 사용자가 물러난 뒤에는 닫힌/열린 미닫이 하드웨어와 맞은편 문선 뒤에도 [주 통로의 순폭 목표](../../settings/00-production.md#use-profile)가 남아야 한다. 실제 옷 깊이·두 문 겹침·계단 아래 단면·옷을 꺼내고 현관으로 돌아오는 경로는 unverified다.

해당 위치의 계단 디딤 높이와 구조 아래면이 장 상단보다 높은지는 부재 단면으로 확인한다. 디딤 위치만으로 장이 들어간다고 확정하지 않는다. 장의 벽·걸이·문짝을 포함한 source 책임은 `src/spaces/rooms/entry.ts`, 계단 아래면의 권위는 계단 owner다. 현재 수납과 계단 구조 간섭 및 문 앞 사용 공간은 unverified다.
