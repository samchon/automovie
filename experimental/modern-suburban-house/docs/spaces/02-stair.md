# 단일 계단의 공간 예약

## 두 층을 잇는 L형 경로 {#stair-reservation}
<!--
@evidence principles/core/common.md#scope-preservation 현관 하부 대기에서 상층 복도 도착면까지의 유일한 main-stair와 아래 flight·중간참·위 flight의 평면·높이·접속, source owner를 맡는다.
@evidence principles/core/common.md#substantive-completion 3.06 m를 18 × 0.17 m로 나눠 아래 8·위 10 챌판, 디딤 0.28 m, 중간참 Y = 1.36 m, 진행 길이 아래 1.96 m·위 2.52 m를 정하고 세 부분의 평면 예약 표를 둔다.
@evidence principles/core/common.md#declared-basis 높이 3.06 m는 storey-datums에서 받고 각 구간의 마지막 챌판이 다음 참에 도달하므로 참을 디딤으로 다시 세지 않는 산출 규칙을 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 L형 계단을 현관 하부 대기에서 -Z로 오른 뒤 중간참에서 +X로 한 번 꺾는 실제 진행 방향과 X = [-1.80, -0.65] 경로로 정한다.
@evidence principles/design/spaces.md#space-topology 두 flight와 중간참을 ground-storey 계단 공간에 두고 목적지는 upper-storey 도착면이며 두 storey 사이에 이 연결 하나만 두고 계단 아래를 통과해야 거실이나 후면 공용부에 닿는 경로를 만들지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 디딤 위치는 개수·진행 방향·시작점에서 반복 산출하고 손으로 같은 레코드를 복제하지 않으며 좌표 허용 오차는 main-building-extent에서 받는다.
@evidence principles/design/spaces.md#space-verification-address 단 수, 진행 방향, 두 도착면과 실제 단의 접속을 계단 산출물·단면·양방향 통행으로 대조하게 한다.
@evidence settings/10-house.md#stair 두 직선 flight와 90° 중간참을 한 main-stair에 담고 다른 층간 길을 두지 않는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work stair의 "두 직선 flight와 중간참"과 storey 높이 3.06 m를 대조했고 18 × 0.17 m 분할과 X = [-1.80, -0.65] 경로로 L형과 유일 연결이 성립해 부모 수정이 없었다.
-->

[단일 꺾임계단](../settings/10-house.md#stair)의 설계 입력으로 아래 L형 경로를 채택한다. `main-stair`는 [현관](rooms/entry.md#entry-plan)의 하부 대기에서 -Z 방향으로 올라간 뒤 중간참에서 +X 방향으로 한 번 꺾이고 [상층 복도](rooms/upper-hall.md#upper-hall-plan)의 도착면으로 이어진다. 두 flight와 중간참의 계단 공간은 ground-storey에 귀속시키고 연결의 목적지는 upper-storey의 상부 도착면이다. 두 storey 사이에는 이 계단 연결 하나만 둔다. 계단 아래를 통과해야 거실이나 후면 공용부에 도착하는 경로는 만들지 않는다.

[층 기준](01-storeys.md#storey-datums)의 3.06 m를 18 × 0.17 m로 나눈다. 아래 구간은 8개 챌판과 7개 디딤, 위 구간은 10개 챌판과 9개 디딤이다. 디딤 깊이는 0.28 m다. 각 구간의 마지막 챌판은 다음 참에 도달하므로 참을 디딤으로 한 번 더 세지 않는다. 중간참 높이는 1.36 m, 수평 진행 길이는 아래 1.96 m·위 2.52 m다.

| 경로 부분 | 평면 예약, m | 높이와 접속 |
| --- | --- | --- |
| 아래 flight | X = [-1.80, -0.65], Z = -1.45 → -3.41 | 첫 챌판은 Z = -1.45, 첫 디딤 높이는 0.17. 여덟째 챌판은 중간참으로 오른다. |
| 중간참 | X = [-1.80, -0.65], Z = [-4.56, -3.41] | Y = 1.36. 직각으로 돌아 +X flight에 진입한다. |
| 위 flight | X = -0.65 → 1.87, Z = [-4.56, -3.41] | 아홉째 전체 챌판에서 시작해 열여덟째 챌판으로 upper-storey에 도착한다. |

계단의 예정 source owner는 `src/spaces/stair.ts`다. 디딤별 위치는 위 개수·진행 방향·시작점에서 반복 산출하며 손으로 같은 레코드를 복제하지 않는다. 비교 대상은 단 수, 진행 방향, 두 도착면과 실제 단의 접속이며 좌표 허용 오차는 [외곽의 설계 대조 기준](00-building.md#main-building-extent)을 소비한다. 현재 값은 저작 입력이며 계단 산출물·단면·양방향 통행은 unverified다.

## 하나의 연결에 속하는 두 flight와 중간참 {#stair-connector-handoff}
<!--
@evidence principles/core/common.md#scope-preservation main-stair-connection 하나의 kind·from·to·bidirectional, route의 두 끝과 꺾임, 중간 landing, steps 생략의 한계, 연결 검사와 단별 검사의 구별을 맡는다.
@evidence principles/core/common.md#substantive-completion connector를 stair, front-entry → upper-hall, bidirectional로 저작하고 landings.at을 중간참 중심까지의 3D polyline 길이를 전체 route 길이로 나눈 값으로 정한다.
@evidence principles/core/common.md#declared-basis steps 생략은 공개 타입·validateBuiltEnvironment 구현과 저장소 spiral stair 테스트 사례를 읽고 정한 입력 형태이며 테스트 실행이나 이 계단의 검증이 아니라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 계단 하나를 두 flight를 별도 계단으로 등록하지 않는 connector 하나와 elements 묶음으로 인계하고 landing을 station 중간 index나 0.5로 고정하지 않는다.
@evidence principles/design/spaces.md#space-topology route가 하부 대기 내부 → 아래 flight → 중간참에서 한 번 꺾임 → 위 flight → 상부 도착면 내부의 순서를 따르고 landings.space가 main-stair를 가리킨다.
@evidence principles/design/spaces.md#space-boundary-authority 단 치수는 stair-reservation에서 받고 steps 균일 요약이나 평균 run으로 바꾸지 않으며 참의 physical boundary와 지지 면은 stair owner에 남긴다.
@evidence principles/design/spaces.md#space-verification-address connector 조회가 세 공간에서 같은 연결을 찾고 landing 위치가 같은 참 위에 있는지와, builtConnectorGeometry가 재지 않는 챌판·순폭·머리 공간을 실제 부재에서 따로 읽게 한다.
@evidence settings/10-house.md#stair 두 flight를 별도 계단으로 등록하지 않고 같은 connector 안의 참과 부재로 묶는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work stair의 "두 직선 flight와 중간참"과 "단면으로 검토"를 connector 형태에 대조했고 steps를 생략해도 단별 검사를 부재에서 요구할 수 있어 부모 수정이 없었다.
-->

[단일 꺾임계단](../settings/10-house.md#stair)을 실현한 [계단 공간과 단별 치수](#stair-reservation)는 유지한다. 후속 `IAutoMovieBuiltConnector`는 `main-stair-connection` 하나로, kind는 stair, from은 front-entry, to는 upper-hall, bidirectional은 true로 저작한다. route의 양 끝은 각각 기존 하부 대기와 상부 도착면 내부에 두며, 아래 flight → 중간참에서 한 번 꺾임 → 위 flight의 실제 진행 순서를 따른다. 두 flight를 별도의 층간 계단으로 등록하거나 계단실을 통과하지 않는 직선으로 두 층을 연결하지 않는다. 실제 두 flight·참·보호 부재는 같은 connector의 elements로 인계한다.

기존 main-stair 공간은 ground-storey 귀속을 유지하고 connector의 중간 landing으로도 참조한다. landing의 위치는 중간참 평면의 X/Z 중심과 그 참의 높이에서 정한다. 이 점을 route의 꺾임 station으로 포함하며 `landings.at`은 시작에서 그 점까지의 3D polyline 길이를 전체 route 길이로 나눈 값이다. 단순히 station 배열의 중간 index나 0.5로 고정하지 않는다. 중간참을 별도 방·층·두 번째 계단으로 만들지 않고 `landings.space`는 main-stair를 가리킨다. 참의 physical boundary와 실제 지지 면은 stair owner에 남는다.

공개 타입의 `steps`는 count/rise/run 한 묶음이고 `validateBuiltEnvironment`는 count × rise를 전체 경로의 높이차, count × run을 참과 접근 부분까지 포함한 전체 수평 경로 길이와 비교한다. 이 집은 같은 간격의 디딤 외에 중간참의 회전과 상하부 대기의 접속을 가지므로 전체 connector에 그 균일 반복 요약을 기입하지 않는다. 공개 구현의 선택 필드 조건과 저장소 `test/src/features/architecture/test_architecture_built_connector.ts`의 steps 없는 spiral stair 사례를 읽어 이 입력 형태를 확인했다. 테스트를 실행했거나 이 집의 계단이 검증됐다는 뜻은 아니다. connector 표현은 이 형태로 선택하되, steps 생략이 단 수·치수 검사를 지불하지 않는다는 한계는 유지한다. 평균 run을 만들거나 기존 단 수·참·route를 바꿔 집계를 맞추는 안은 채택하지 않는다.

연결 검사와 실제 단 검사를 구별한다. connector 조회는 front-entry/main-stair/upper-hall에서 같은 연결을 찾아야 하고 landing의 산출 위치는 같은 참 위에 있어야 한다. `builtConnectorGeometry`는 route의 높이차·길이·station을 읽으며 실제 디딤이나 난간을 재지 않는다. 챌판 수·각 높이·디딤 깊이·참·보호 부재 뒤 순폭과 머리 공간은 렌더가 소비하는 실제 부재에서 읽어야 한다. 그 계측 경로와 geometry가 없는 현재는 unverified로 남기고 route 산술이나 테스트 사례로 대신하지 않는다. [전체 관찰](04-observations.md#spatial-observation-derivation)은 계단 공간 자체의 threshold·안쪽 코너·중심 방향 및 양방향 통행을 그대로 포함한다.

## 계단 구멍과 전면 창의 경계 {#stair-floor-opening}
<!--
@evidence principles/core/common.md#scope-preservation 층판 구멍의 L형 평면, 계단 창이 계단실로 열리는 관계, 층판·천장 마감 owner의 같은 구멍 소비, 네 보호/분리 띠, 계단실 위 높은 천장을 맡는다.
@evidence principles/core/common.md#substantive-completion 구멍을 X = [-1.80, -0.65]·Z = [-4.56, -0.25] 세로 부분과 X = [-0.65, 1.87]·Z = [-4.56, -3.41] 가로 부분의 L형으로 정하고 네 0.15 m 띠의 좌표를 둔다.
@evidence principles/core/common.md#declared-basis 구멍은 위 경로와 하부 대기 면적에 한정해 산출하고 창 void와 높이는 stair-front-window에서 받는다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정이 요구한 실제 통행 개구부를 본채 안쪽 전면에 닿는 L형으로 특정해 상층 전면의 작은 창이 계단 공간으로 열리게 한다.
@evidence principles/design/spaces.md#space-topology 구멍은 두 flight·중간참·하부 대기 위의 계단실에만 속하고 거실·현관 분배 바닥·침실을 비우는 복층 보이드는 없으며 계단실 위는 본채 2층 천장으로 닫는다.
@evidence principles/design/spaces.md#space-boundary-authority 같은 구멍 경계를 upper.ts의 층간 구조와 방별 바닥/천장 마감 owner가 소비하고 네 띠는 인접 방 안쪽 끝과 접해 같은 벽을 두 번 만들지 않는다.
@evidence principles/design/spaces.md#space-verification-address 전면 창/계단 단면, 두 층의 같은 구멍, 방 바닥의 구멍 침범, 인접 벽 중복, 참을 막는 난간을 검사 질문으로 둔다.
@evidence settings/10-house.md#openings 작은 상층 전면 창 뒤에 실제 계단실을 두고 가짜 창을 허용하지 않는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work openings의 "계단/복도용의 더 작은 창"과 stair의 "복층 보이드는 없다"·"실제 통행 개구부"를 대조했고 L형 구멍을 계단실에 한정해 셋이 함께 성립해 부모 수정이 없었다.
-->

[위 경로](#stair-reservation)와 하부 대기 면적에 한정하여, 층판 구멍은 X = [-1.80, -0.65]·Z = [-4.56, -0.25]의 세로 부분과 X = [-0.65, 1.87]·Z = [-4.56, -3.41]의 가로 부분을 합친 L형이다. 계단 전면 끝이 본채 안쪽 전면에 닿으므로 [상층 전면의 작은 계단 창](../settings/10-house.md#openings)은 실제 계단 공간으로 열린다. void·높이는 [stair-front-window](envelope/front.md#stair-front-window)를 소비하고 실제 창호는 후속 부재에서 구현한다. 창 뒤를 침실로 바꾸거나 전면에 가짜 창을 붙이지 않는다.

구멍은 [단일 꺾임계단](../settings/10-house.md#stair)이 요구한 실제 통행 개구부이며 두 flight·중간참·하부 대기 위의 계단실에만 속한다. 거실·현관 분배 바닥·침실을 추가로 비우는 복층 보이드는 없다. 통행 구멍의 동일 경계를 [단일 층간 구조](08-floor-assembly.md#interstorey-floor-boundary)의 `src/spaces/floors/upper.ts`와 위층 바닥/아래층 천장의 방별 마감 owner가 소비한다. 계단 쪽에 보이는 수직 두께 마감과 상부 도착은 [가장자리 인계](08-floor-assembly.md#interstorey-edge-junctions)를 따른다. 계단실 위는 본채 2층 천장으로 닫힌다. 구멍을 지붕까지 연장하지 않는다.

구멍 왼쪽의 보호/분리 경계는 X = [-1.95, -1.80], 세로 구간 오른쪽은 X = [-0.65, -0.50], 가로 구간 앞쪽은 Z = [-3.41, -3.26], 뒤쪽은 Z = [-4.71, -4.56]의 0.15 m 예약이다. 이들은 각 인접 방의 안쪽 끝과 접하며 같은 벽을 두 번 만들지 않는다. 위 flight의 +X 끝은 상부참으로 통하는 열린 경계이므로 막는 난간을 놓지 않는다. 전면 창/계단 단면, 두 층의 같은 구멍, 방 바닥의 구멍 침범, 인접 벽 중복 및 참을 막는 난간이 검사 질문이다. 현재 실제 surface id와 단면 관찰은 unverified다.

계단실 위의 [높은 천장 폐합](09-ceiling-assembly.md#upper-ceiling-closure)은 같은 구멍과 그 둘레 중 천장 높이에서 노출되는 보호 띠를 마감 구역으로 소비한다. [경계 높이](#stair-boundary-heights)에 따라 뒤쪽 난간 위까지 닫되 완전 높이 벽 구역은 제외하며, upper-storey 천장 높이에서 복도 마감과 만난다. 공통 바탕은 upper 층 owner, 계단실에서 보이는 마감은 이 계단 owner다. ground-storey 소속을 이유로 낮은 천장판을 계단 위에 생성하지 않는다.

## 난간과 통행의 순폭 예약 {#stair-clearance}
<!--
@evidence principles/core/common.md#scope-preservation 두 flight와 중간참의 순폭, 손잡이·난간 점유 예약, 양 대기의 소속, 위 flight 아래 외투장의 비통행, 디딤별 머리 공간 검사를 맡는다.
@evidence principles/core/common.md#substantive-completion 1.15 m 경로 폭 안에 양쪽 손잡이·난간 점유를 각 0.075 m 이내로 예약해 계산상 1.00 m를 남기고 중간참에도 두 방향 1.00 m 통행 영역을 요구한다.
@evidence principles/core/common.md#declared-basis 1.00 m는 use-profile 0.95 m 목표와의 설계 비교이며 실제 난간 점유 계측이 아니라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 계단 유효폭 목표에 기둥·손잡이 끝·접합판이 넘으면 안 되는 예약선과 넘었을 때 그 부재를 고치는 규칙을 더한다.
@evidence principles/design/spaces.md#space-topology 하부 대기는 현관, 상부 대기는 복도의 바닥이고 위 flight 아래 닫힌 외투장은 현관 수납에만 속하며 관통 통로가 아니다.
@evidence principles/design/spaces.md#space-boundary-authority 경로 폭은 stair-reservation, 두 대기는 entry-plan·upper-hall-plan, 외투장은 entry-coat-storage에서 받는다.
@evidence principles/design/spaces.md#space-verification-address 단별 단면과 90° 회전 경로, 참 양쪽 시야에 0.60 × 0.45 × 1.90 m 사람과 0.75 m 바구니를 줄이지 않고 적용하고 각 디딤의 2.00 m 머리 공간을 실제 천장·층판·보·난간과 본다.
@evidence settings/00-production.md#use-profile 0.95 m 계단 목표와 2.00 m 머리 공간을 사람·바구니를 줄이지 않고 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 0.60 × 0.45 × 1.90 m 사람과 0.75 m 바구니를 기존 L형 경로에 적용할 점유 예약이 가능해 프로필 변경은 없었다.
-->

[경로](#stair-reservation)의 1.15 m 폭 안에서 양쪽 손잡이·난간의 수평 점유를 각각 0.075 m 이내로 예약한다. 계산상 남는 폭은 1.00 m로 [사용자 프로필](../settings/00-production.md#use-profile)의 0.95 m 목표보다 0.05 m 크다. 이것은 실제 난간 점유를 계측한 합격값이 아니다. 기둥·손잡이 끝·접합판 중 하나라도 예약선을 넘으면 같은 단의 순폭을 다시 검사하고 해당 부재를 고친다. 중간참도 두 방향 각각 1.00 m 통행 영역을 남겨야 한다.

하부 대기는 [현관](rooms/entry.md#entry-plan), 상부 대기는 [복도](rooms/upper-hall.md#upper-hall-plan)의 바닥을 소비한다. 위 flight 아래의 닫힌 외투장은 [현관 수납](rooms/entry.md#entry-coat-storage)에만 속하고 관통 통로가 아니다. 목표 머리 공간 2.00 m는 각 디딤·참에서 실제 천장·층판·보·난간과 함께 검사한다. 넓힌 구멍만으로 단면 검사가 완료되었다고 보고하지 않는다.

검사 주소는 `src/spaces/stair.ts`에서 파생할 단별 단면과 90° 회전 경로, 참 양쪽 시야다. 점유체를 줄이지 않고 0.60 × 0.45 × 1.90 m 사람과 0.75 m 폭 바구니를 같은 경로에 적용한다. 평면 입력의 정합과 실제 회전·머리 공간·시각적 계단 읽힘은 구별하며 후자는 모두 unverified다.

## 계단 곁 벽과 열린 보호 경계의 높이 {#stair-boundary-heights}
<!--
@evidence principles/core/common.md#scope-preservation 계단 둘레 여섯 경계의 높이 역할, 경사 손잡이와 복도 보호 높이, 난간살 간격 상한, 외투장 opening만 소비하는 계단 아래 막음을 맡는다.
@evidence principles/core/common.md#substantive-completion 경사 손잡이 상단을 디딤 코 위 0.90 m, 복도 추락 경계 보호를 upper-storey 바닥 위 1.05 m로 정하고 난간살 빈 간격과 맨 아래 빈 높이를 0.10 m 이하로 둔다.
@evidence principles/core/common.md#declared-basis 높이와 간격 상한은 이 집의 저작 선택이며 안전 법규 적합성 인증이 아니고 반복 개수는 후속 모듈이 구간 길이에서 산출한다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 검은 수직 철제 난간살·목재 손잡이를 경계별로 닫힌 분리벽·열린 난간·벽붙이 손잡이·열린 도착으로 배정한다.
@evidence principles/design/spaces.md#space-topology 계단 뒤쪽은 두 층 바닥 사이를 분리벽으로 닫아 아래 서비스 통로와 위 복도를 같은 실로 잇지 않고 위 flight의 +X 도착 끝은 상층 바닥 높이부터 연다.
@evidence principles/design/spaces.md#space-boundary-authority 구조 바탕은 stair.ts, 인접 방 마감은 03의 완결 면 배정이 유지하고 벽이 있는 높이에 난간 패널을 중복 생성하지 않으며 모든 기둥·벽붙이 손잡이·난간살의 통행 쪽 점유를 stair-clearance의 양쪽 0.075 m 예약 안에 둔다.
@evidence principles/design/spaces.md#space-verification-address 현관에서 보이는 아래 flight, 중간참 두 방향, 디딤별 손잡이 단면, 상부 도착과 복도 가장자리, 외투장 위 단면을 관찰로 둔다.
@evidence settings/10-house.md#stair 목재 손잡이와 검은 난간살은 열린 가장자리를 보호하며 참의 통행을 가로막지 않는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work stair의 "중간참과 상부참에 닫힌 벽이나 난간이 통로를 가로지르지 않는다"와 난간 재료를 여섯 경계에 적용했고 열린 도착과 보호가 함께 성립해 부모 수정이 없었다.
-->

[계단 구멍 둘레의 평면 띠](#stair-floor-opening)는 모두 같은 높이의 벽을 뜻하지 않는다. [단일 꺾임계단](../settings/10-house.md#stair)의 검은 수직 철제 난간살·목재 손잡이와 참의 통로를 벽이나 난간이 가로지르지 않는다는 조건을 받아 같은 main-stair의 높이별 경계 역할을 아래처럼 택한다. 방 안쪽 한계와 두 flight/참은 유지하며, 계단 출발과 도착을 닫는 새 벽은 없다. 구조 바탕은 `src/spaces/stair.ts`, 인접 방의 마감은 [완결 면 배정](03-surface-owners.md#interior-surface-handoff)을 유지한다.

| 경계 | 바닥·벽·보호의 높이 역할 |
| --- | --- |
| 계단 왼쪽, 거실/올리브 침실과의 경계 | 해당 층 바닥에서 천장까지 닫힌 실내 분리벽이다. 현관과 거실의 문 있는 구간은 계단 벽으로 연장하지 않고 거실 owner가 유지한다. |
| 아래 flight 오른쪽, 1층 현관 쪽 | flight와 중간참의 열린 가장자리에 기둥·검은 난간살·목재 손잡이를 둔다. 손잡이 아래를 완전 높이 판으로 막지 않는다. 첫 챌판 앞 하부 대기는 같은 높이의 현관 바닥이므로 그 앞을 난간으로 가로막지 않는다. |
| 세로 구멍 오른쪽 및 위 flight 앞쪽, 상층 청회색 침실 쪽 | upper-storey 바닥에서 천장까지 침실 분리벽을 둔다. 아래 flight의 난간을 그 벽 높이까지 늘리거나 침실 바닥을 구멍 안으로 넣지 않는다. |
| 위 flight 앞쪽의 1층 현관 쪽 | 계단 아래 비통행 영역은 계단 평면 내부에서 구조 아래면까지 닫는다. 막음의 현관 쪽 한계는 flight의 앞쪽 끝선이며 방 바닥 위로 두께를 덧붙이지 않는다. 디딤 위 열린 구간은 난간, 상층 침실 벽이 이미 있는 높이는 벽붙이 손잡이로 잇는다. |
| 계단 뒤쪽, 아래 서비스 통로/위 복도 쪽 | ground-storey 바닥부터 upper-storey 바닥까지 분리벽으로 닫고, 그 위 복도의 추락 가장자리는 기둥·난간살로 보호한다. 아래 서비스 통로와 위 복도의 바닥을 같은 실로 잇지 않는다. |
| 위 flight의 +X 도착 끝 | 상층 바닥 높이부터 열린 도착이다. 그 아래는 계단 아래 막음이며 [외투장 opening](rooms/entry.md#entry-coat-storage)만 소비한다. 외투장 문 상단을 상층 도착의 막힌 벽으로 연장하지 않는다. |

경사진 손잡이 상단은 각 디딤 코의 높이를 잇는 선 위 수직 0.90 m, 중간참에서는 참 위 0.90 m로 택한다. 상층 복도의 평탄한 추락 경계 보호 상단은 upper-storey 바닥 위 1.05 m다. 손잡이와 보호 상단의 다른 높이는 도착 옆에서 구별하고, 손잡이의 끝은 옆 기둥/벽으로 돌아가 통로를 가로지르지 않는다. 난간살의 사이 빈 간격은 0.10 m 이하, 맨 아래 부재와 디딤/참 사이 빈 높이는 0.10 m 이하를 설계 상한으로 둔다. 이는 이 집의 저작 선택이며 안전 법규 적합성 인증은 아니다. 반복 개수는 실제 각 구간 유효 길이와 부재 폭/이 간격 상한에서 후속 모듈이 산출한다.

모든 기둥·벽붙이 손잡이·난간살의 통행 쪽 점유는 [양쪽 0.075 m 예약](#stair-clearance) 안에 있어야 한다. 벽이 있는 높이에 같은 자리를 차지하는 난간 패널을 중복 생성하지 않는다. 계단 아래 막음과 외투장 상단은 실제 구조 아래면을 소비하며 구조 두께를 0으로 취급해 수납 여유를 얻지 않는다. 관찰은 현관에서 보이는 아래 flight, 중간참의 두 방향, 각 디딤 손잡이 단면, 상부 도착과 복도 가장자리, 외투장 위 단면이다. 실제 보호 높이·순폭·머리 공간·막음/문/마감 접합 및 03–05의 계단 읽힘은 unverified다.
