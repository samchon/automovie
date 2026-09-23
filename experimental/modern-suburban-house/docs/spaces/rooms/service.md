# 서비스 접근의 열린 동선

## 오른쪽 통로와 계단 뒤 연결 {#service-access-plan}
<!--
@evidence principles/core/common.md#scope-preservation service-access의 L형 경계, 현관과의 열린 연결, 세 서비스실 문의 소유 위치, 공용부 연결, 외투장 사용과의 교대를 맡는다.
@evidence principles/core/common.md#substantive-completion 오른쪽 띠 X = [2.02, 3.07]·Z = [-6.05, -0.25] m와 계단 뒤 띠 X = [-1.80, 2.02]·Z = [-6.05, -4.71] m, 폭 1.05 m와 깊이 1.34 m를 정한다.
@evidence principles/core/common.md#declared-basis 계단 보호 경계는 stair-floor-opening, 현관 연결은 entry-plan, 각 실 문은 자기 room owner에서 받는다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 서비스 띠 설정을 계단 바깥을 돌아가는 열린 L형 동선과 X = [3.07, 3.22] m 공유 칸막이로 만든다.
@evidence principles/design/spaces.md#space-topology 현관과 문 없이 X = 2.02 m 구간에서 연결되고 세 서비스실로 분기하며 차고에 가는 유일한 내부 경로는 머드룸을 통하게 한다.
@evidence principles/design/spaces.md#space-boundary-authority 세 실의 개구부는 각 room owner가 칸막이에서 소유하고 외투장 미닫이는 entry owner에서 받는다.
@evidence principles/design/spaces.md#space-verification-address 꺾이는 두 지점과 모든 문턱에서 사람/바구니의 양방향 회전, L형 가려진 모서리의 추가 관찰을 반증 주소로 둔다.
@evidence settings/10-house.md#service-band 서비스 접근 통로에서 각 실로 분기하고 본채 중앙 공용 동선과 이어져 현관으로 돌아갈 수 있게 한다.
@evidence settings/00-production.md#use-profile 좁은 1.05 m 띠를 trim·걸레받이까지 넣은 순폭 목표로 검사하고 외투장 사용자와 통과자를 동시 통행으로 더하지 않는다.
@evidence obligations/design/spaces.md#space-access-circulation 폭 1.05 m 띠를 trim·걸레받이 이후의 순폭으로 검사하고 외투장 사용자와 통과자를 동시 통행으로 더하지 않아 현관·공용부·세 서비스실·차고 연결이 이름만의 edge가 되지 않게 한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work service-band의 분기·비통과·차고 직접 연결과 use-profile의 0.90 m 통로를 L형 띠에 적용했고 1.05 m 띠와 1.34 m 뒤쪽 띠가 성립해 부모 수정이 없었다.
-->

`service-access`는 ground-storey의 열린 L형 동선이다. 마감 안쪽은 X = [2.02, 3.07]·Z = [-6.05, -0.25] m의 오른쪽 띠와 X = [-1.80, 2.02]·Z = [-6.05, -4.71] m의 계단 뒤 띠를 합친다. 오른쪽 띠의 폭은 1.05 m, 뒤쪽 띠의 깊이는 1.34 m다. [계단 보호 경계](../02-stair.md#stair-floor-opening)의 바깥을 돌아가며 계단 밑으로 들어가지 않는다.

[현관](entry.md#entry-plan)과 만나는 X = 2.02, Z = [-3.41, -0.25] m 구간은 문·완전 높이 칸막이가 없는 연결이다. 서비스실 서쪽 공유 칸막이는 X = [3.07, 3.22] m다. [파우더룸](powder.md#powder-plan), [세탁·머드룸](laundry.md#laundry-plan), [팬트리](pantry.md#pantry-plan)의 문은 각각 자기 room owner가 이 칸막이에서 개구부를 소유한다. 이 통로에서 각 실로 분기하고 되돌아온다. 차고에 가는 유일한 내부 경로는 머드룸을 통한다.

후면은 [공용부의 열린 연결](common.md#common-room-plan)을 소비한다. 외투장 문은 [현관 수납](entry.md#entry-coat-storage)의 미닫이이므로 이 띠로 돌출하는 회전문을 추가하지 않는다. `src/spaces/rooms/service.ts`가 완결 내부 owner다. 좁은 1.05 m 띠는 trim·걸레받이까지 넣은 목표 [순폭](../../settings/00-production.md#use-profile)으로 검사하며 이름만 연결된 edge를 실 통행으로 읽지 않는다. 꺾이는 두 지점과 모든 문턱에서 사람/바구니의 양방향 회전, L형 가려진 모서리 추가 관찰은 unverified다.

[외투장 사용 예약](entry.md#entry-coat-storage)은 뒤쪽 계단 아래 접면에서 이 통로 일부를 차지한다. 옷을 꺼내는 사람과 옆을 지나가는 사람의 면적을 동시 통행으로 더하지 않는다. 사용자가 비킨 상태에서 남은 미닫이/손잡이 돌출과 맞은편 문선 뒤의 순폭을 검사한다. 현관에서 서비스실·공용부로 가는 기존 연결은 그대로 유지한다.
