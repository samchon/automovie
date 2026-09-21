# 서비스 접근의 열린 동선

## 오른쪽 통로와 계단 뒤 연결 {#service-access-plan}

`service-access`는 ground-storey의 열린 L형 동선이다. 마감 안쪽은 X = [2.02, 3.07]·Z = [-6.05, -0.25] m의 오른쪽 띠와 X = [-1.80, 2.02]·Z = [-6.05, -4.71] m의 계단 뒤 띠를 합친다. 오른쪽 띠의 폭은 1.05 m, 뒤쪽 띠의 깊이는 1.34 m다. [계단 보호 경계](../02-stair.md#stair-floor-opening)의 바깥을 돌아가며 계단 밑으로 들어가지 않는다.

[현관](entry.md#entry-plan)과 만나는 X = 2.02, Z = [-3.41, -0.25] m 구간은 문·완전 높이 칸막이가 없는 연결이다. 서비스실 서쪽 공유 칸막이는 X = [3.07, 3.22] m다. [파우더룸](powder.md#powder-plan), [세탁·머드룸](laundry.md#laundry-plan), [팬트리](pantry.md#pantry-plan)의 문은 각각 자기 room owner가 이 칸막이에서 개구부를 소유한다. 이 통로에서 각 실로 분기하고 되돌아온다. 차고에 가는 유일한 내부 경로는 머드룸을 통한다.

후면은 [공용부의 열린 연결](common.md#common-room-plan)을 소비한다. 외투장 문은 [현관 수납](entry.md#entry-coat-storage)의 미닫이이므로 이 띠로 돌출하는 회전문을 추가하지 않는다. `src/spaces/rooms/service.ts`가 완결 내부 owner다. 좁은 1.05 m 띠는 trim·걸레받이까지 넣은 목표 [순폭](../../settings/00-production.md#use-profile)으로 검사하며 이름만 연결된 edge를 실 통행으로 읽지 않는다. 꺾이는 두 지점과 모든 문턱에서 사람/바구니의 양방향 회전, L형 가려진 모서리 추가 관찰은 unverified다.

[외투장 사용 예약](entry.md#entry-coat-storage)은 뒤쪽 계단 아래 접면에서 이 통로 일부를 차지한다. 옷을 꺼내는 사람과 옆을 지나가는 사람의 면적을 동시 통행으로 더하지 않는다. 사용자가 비킨 상태에서 남은 미닫이/손잡이 돌출과 맞은편 문선 뒤의 순폭을 검사한다. 현관에서 서비스실·공용부로 가는 기존 연결은 그대로 유지한다.
