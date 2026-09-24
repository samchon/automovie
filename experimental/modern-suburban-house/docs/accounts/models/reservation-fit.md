# 모델 층의 예약 맞춤 산술

## 개구부와 수납 예약을 채우는 원형의 산술 {#model-reservation-fit}
<!--
@evidence contracts/reservation-fit.md#reservation-fit models 01–05에서 spaces 예약을 채우는 H2를 한 줄씩 대조했다. 각 원형이 외곽·칸 수·경첩·열림을 예약 owner에서 받고 부재 두께를 뺀 순폭·돌출·간격이 owner 목표를 지키는 산술을 본문에 적었으며 목표를 깬 원형은 0개다.
-->

[원문 계약](../../contracts/reservation-fit.md#reservation-fit)은 spaces 예약을 채우는 모든 모델이 외곽을 예약 owner에서 받고 부재 점유가 목표를 지키는 산술을 적기를 요구한다. 대조는 H2 본문의 수치를 다시 계산해 확인했다.

[창 외곽](../../models/01-windows.md#window-local-frame): 12개 창 모두 외곽=거친 개구부, 깊이 Z = -0.04 ~ -0.18 m로 06의 0.04·0.14 m 예약과 같다. [창 부재](../../models/01-windows.md#window-member-sizes): 최소 계단 창 0.78 m에서 유리 폭 0.78 - 0.12 - 0.10 = 0.56 m로 0.30 m 실패선 위다. [창대·trim](../../models/01-windows.md#window-sill-trim): trim 0.10 m = 한도 0.10 m, 창대 0.06 m = 한도 0.06 m. [현관문](../../models/02-exterior-doors.md#front-entry-door): 1.00 - 0.06 - 0.04 = 0.90 m ≥ 목표 0.90 m. [차고문](../../models/02-exterior-doors.md#garage-sectional-door): 5.00 - 0.20 = 4.80 m = 목표 4.80 m, rail-path는 레일 띠 Z = [-0.72, -0.55] m와 상부 예약 Y = [2.15, 2.50] m 안. [정원문](../../models/02-exterior-doors.md#garden-door-pair): 1.20 - 0.03 - 0.04 = 1.13 m, 손잡이 0.06 m를 빼도 1.07 m ≥ 0.95 m, 회전 반경 1.17 m ≤ 바깥 대기 1.80 m. [대문](../../models/02-exterior-doors.md#side-yard-gate): 1.20 - 0.04 - 0.05 = 1.11 m ≥ 1.05 m, 점유 0.05 m ≤ 0.10 m. [실내 문](../../models/03-interior-doors.md#interior-door-members): 11개 모두 거친 폭 - 0.10 m = 목표(0.85·0.90·0.95 m). [난간살](../../models/04-stair-members.md#stair-balusters): 0.02 m ≤ 0.075 m 예약, 간격 ≤ 0.10 m. [아래 부재](../../models/04-stair-members.md#stair-bottom-member): 빈 높이 0.05 m ≤ 0.10 m. [외투장 문짝](../../models/05-closet-fittings.md#coat-closet-doors): 최대 돌출 X = 2.01 m ≤ 2.07 m, 두 트랙이 경계 [1.87, 2.02] 안. [외투장 봉·선반](../../models/05-closet-fittings.md#coat-closet-rod-shelf): 봉 X = 1.425 m와 선반 깊이 0.65 m가 몸통 X = [1.10, 1.75] 안. [린넨장](../../models/05-closet-fittings.md#linen-closet-fittings): 선반 깊이 0.55 m로 문 레일 경계와 분리.

결과는 14개 H2, 목표 위반 0건이다. 10–15 가구 H2의 상한 박스 대조는 가구 에이전트의 몫이며 여기서 판정하지 않았다. 실제 source 점유 계측은 unverified다.
