# 하나로 이어지는 후면 공용부

## 공용부의 외곽과 열린 앞면 {#common-room-plan}

`kitchen-dining-family`는 ground-storey의 방 하나다. 마감 안쪽 X = [-5.50, 5.50], Z = [-10.45, -6.20] m로 택한다. 뒤·좌·우는 [본채 외곽 경계](../00-building.md#main-building-extent), 앞쪽은 거실·서비스 접근·팬트리와 만나는 Z = [-6.20, -6.05] 경계다. 오른쪽 앞부분은 [차고의 뒤쪽 접합](../00-building.md#attached-garage-extent)에 닿으므로 본채 오른쪽 전체를 노출 외벽으로 처리하지 않는다. 주방·식당·가족실은 이 방 안의 기능 구역이며 [설정](../../settings/10-house.md#common-room)처럼 완전 높이 칸막이로 나누지 않는다.

`living-common-opening`은 앞쪽 경계의 X = [-5.00, -2.15], Y = [0, 2.40] m, `service-common-opening`은 X = [-1.35, 3.07], Y = [0, 2.40] m의 열린 개구부다. 문짝은 없다. 각각 [거실](living.md#living-plan), [서비스 접근의 뒤쪽 띠](service.md#service-access-plan)를 직접 잇는다. 팬트리 뒤쪽 X = [3.22, 5.50] 구간은 닫힌 벽으로 남긴다. 넓은 개구부의 상인방/지지 부재는 외피 단계의 구조 예약 안에서 해결해야 한다.

주방은 왼쪽, 식사는 뒤쪽 정원 출입 가까이, 가족실은 오른쪽에 둔다. 정확한 섬·가전·식탁/6개 의자·3개 스툴·가족실 가구 좌표와 정원문은 아직 미완료다. 앞쪽 두 개구부 사이의 통행을 식탁 의자 사이로만 배정하지 않는다. `src/spaces/rooms/common.ts`가 전체 내부를 소유한다. 두 진입에서 세 기능으로 가는 길, 정원문과 실제 외벽, 03의 공용부 시야 및 각 구석 관찰은 unverified다.
