# 주침실의 별도 옷방

## 사람이 들어가는 옷 수납실 {#primary-wardrobe-plan}
<!--
@evidence principles/core/common.md#scope-preservation primary-wardrobe의 경계, 주침실 쪽 단일 문, 후면 수납 예약, 돌아설 공간과 전체 방 관찰 부담을 맡는다.
@evidence principles/core/common.md#substantive-completion 마감 안쪽 X = [0.90, 5.50], Z = [-10.45, -8.95] m, 문 개구부 Z = [-10.20, -9.20] m와 유효 폭 0.90 m, 수납 X = [2.10, 5.50], Z = [-10.45, -9.90] m를 정한다.
@evidence principles/core/common.md#declared-basis 옷걸이 앞 깊이 0.95 m는 입력 산술이며 실제 옷·손잡이·문틀 뒤 순폭은 다시 읽는다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "사람이 들어가는 수납실을 공간으로 저작하면 다른 방과 같은 전체 관찰을 부담"을 upper-storey 소속의 독립 공간과 자기 문으로 확정한다.
@evidence principles/design/spaces.md#space-topology 옷방은 주침실에서만 들어가고 욕실 쪽에는 문이 없으며 같은 문으로 되돌아온다.
@evidence principles/design/spaces.md#space-boundary-authority 뒤/오른쪽은 본채 외벽, 후면 창 없음은 rear-openings에서 소비한다.
@evidence principles/design/spaces.md#space-verification-address 자기 실 안 threshold/네 모서리/중심 네 방향, 끝 선반 접근, 주침실 쪽 문 회전을 검사한다.
@evidence settings/10-house.md#storage 사람이 들어가는 옷 수납실을 얕은 붙박이장으로 분류해 관찰을 없애지 않는다.
@evidence settings/10-house.md#primary-bedroom 주침실의 별도 옷 수납을 주침실에서 직접 들어가는 방으로 만든다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work storage의 사람이 들어가는 수납실 조건을 대조했고 upper-storey 소속의 자기 문·경계를 갖고 욕실 쪽 문 없이 주침실에서 들어와 같은 문으로 되돌아오는 방으로 성립해 부모 수정이 없었다.
-->

`primary-wardrobe`는 upper-storey의 실제 공간이다. 마감 안쪽 X = [0.90, 5.50], Z = [-10.45, -8.95] m다. 뒤/오른쪽은 [본채 외벽](../00-building.md#main-building-extent), 앞쪽은 두 욕실과의 칸막이, 왼쪽은 [주침실](primary.md#primary-plan)이다. 이 방을 얕은 붙박이장으로 분류하여 관찰을 없애지 않는다. [수납 설정](../../settings/10-house.md#storage)에 따라 upper-storey 소속과 자기 문·경계·전체 방 관찰을 부담한다.

`primary-wardrobe-door`는 X = [0.75, 0.90]의 주침실 공유 벽에 Z = [-10.20, -9.20], Y = [3.06, 5.26] m의 거친 개구부를 만든다. 유효 폭 0.90 m를 목표로 하고 -Z 문설주 경첩에서 주침실 안 -X 방향으로 연다. 욕실 쪽에는 문을 만들지 않는다. 주침실에서 들어오고 같은 문으로 되돌아오는 수납실이다.

후면 옷걸이/선반은 X = [2.10, 5.50], Z = [-10.45, -9.90] m의 깊이 0.55 m 예약이다. [후면 배치](../envelope/rear.md#rear-openings)는 이 벽을 닫고 옷방에 외부 창을 두지 않는다. 문 안쪽 X = [0.90, 2.10] 구간은 선반을 비워 돌아설 공간을 두고, 옷걸이 앞에는 입력 산술상 깊이 0.95 m가 남는다. 실제 옷·손잡이·문틀 뒤의 순폭은 다시 읽는다. `src/spaces/rooms/wardrobe.ts`를 완결 내부 owner로 배정한다. 자기 실 안 threshold/네 모서리/중심 네 방향과 끝 선반 접근, 주침실 쪽 문 회전·조명은 unverified다.

## 후면 옷걸이와 접는 수납의 사용 {#wardrobe-storage-use}
<!--
@evidence principles/core/common.md#scope-preservation 옷걸이 구간과 접은 옷/신발 선반 구간, 봉과 상단 선반, 오른쪽 네 선반, 통로 사용과 귀환을 맡는다.
@evidence principles/core/common.md#substantive-completion 옷걸이 X = 4.25 m까지, 선반 X = 4.40 m부터, 봉을 후면에서 0.28 m·바닥 위 1.65 m, 상단 선반 2.05 m, 네 선반을 0.20 m부터 0.45 m 간격으로 정한다.
@evidence principles/core/common.md#declared-basis 수납 평면은 primary-wardrobe-plan에서 받고 목재 선반·봉·의류·조명은 후속 구현이라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "옷걸이/선반과 실제 내부 깊이"를 걸기/접기 구간 분할과 높이 반복 규칙으로 만든다.
@evidence principles/design/spaces.md#space-topology 문 안쪽 회전 바닥에서 앞쪽 통로를 따라 양 끝 수납에 닿고 같은 문으로 돌아온다.
@evidence principles/design/spaces.md#space-boundary-authority 옷·옷걸이·용기의 깊이를 기존 수납 예약 안에 두고 넘치면 옷을 잘라 숨기지 않고 공간 배치를 고친다.
@evidence principles/design/spaces.md#space-verification-address 끝 수납 앞 사용체, 문/통로 단면, 전체 내부 관찰을 검사한다.
@evidence settings/10-house.md#storage 옷걸이 봉을 후면에서 0.28 m·바닥 위 1.65 m에 두고 X = 4.40 m부터 접은 옷/신발 선반을 나누어 옷·옷걸이·용기의 깊이를 기존 수납 예약 안에 둔다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work storage의 옷걸이/선반·내부 깊이와 사람이 들어가는 방의 관찰 부담을 대조했고 기존 후면 수납 예약 앞 통로로 양 끝에 닿아 성립해 부모 수정이 없었다.
-->

같은 primary-wardrobe/upper-storey의 [후면 수납 예약](#primary-wardrobe-plan)을 [수납 설정](../../settings/10-house.md#storage)의 옷걸이/선반으로 사용한다. 옷걸이 구간은 수납 왼쪽 끝부터 X = 4.25 m까지, 접은 옷/신발 선반 구간은 X = 4.40 m부터 오른쪽 끝까지다. 옷걸이 봉은 후면에서 앞으로 0.28 m, 상층 완성 바닥 위 1.65 m에 두고 상단 선반은 2.05 m에 둔다. 오른쪽 네 선반의 상면은 바닥 위 0.20 m부터 0.45 m 간격으로 산출한다. 옷·옷걸이·용기를 포함한 깊이는 기존 수납 예약 안에 있어야 한다.

문 안쪽 회전 바닥에서 앞쪽 통로를 따라 양 끝 수납에 닿고 같은 문으로 돌아온다. 바닥 바구니·서랍을 통로로 꺼내 놓는 수납은 추가하지 않는다. 실제 옷걸이와 의류가 예약보다 깊어지면 옷을 잘라 숨기지 않고 공간 배치를 고친다. 목재/밝은 선반·봉·의류·조명은 후속 구현이고, 사람이 들어가는 이 방의 질문은 그대로 유지한다. 끝 수납 앞 사용체·문/통로 단면과 전체 내부 관찰은 [관찰 owner](../04-observations.md#spatial-observation-derivation)가 검사하며 현재 실제 geometry·순폭·프레임은 unverified다.
