# 모델 층의 예약 맞춤 산술

## 개구부와 수납 예약을 채우는 원형의 산술 {#model-reservation-fit}
<!--
@evidence contracts/reservation-fit.md#reservation-fit 01–05의 기존 산술을 재검토하면서 전후면 문턱 +0.02 m, 창대의 실내 마감 면 기준, 대문 문짝의 source owner를 정정했다. 10–15까지 포함한 models 80개 H2 전수 예약 대조가 남아 있어 목표 위반 0건은 현재 주장하지 않는다.
-->

[원문 계약](../../contracts/reservation-fit.md#reservation-fit)은 spaces 예약을 채우는 모든 모델이 외곽을 예약 owner에서 받고 부재 점유가 목표를 지키는 산술을 적기를 요구한다. 대조는 H2 본문의 수치를 다시 계산해 확인했다.

[창 외곽](../../models/01-windows.md#window-local-frame): 12개 창 모두 외곽=거친 개구부, 깊이 Z = -0.04 ~ -0.18 m로 06의 0.04·0.14 m 예약과 같다. [창 부재](../../models/01-windows.md#window-member-sizes): 최소 계단 창 0.78 m에서 유리 폭 0.78 - 0.12 - 0.10 = 0.56 m로 0.30 m 실패선 위다. [창대·trim](../../models/01-windows.md#window-sill-trim): trim 폭 0.10 m = 한도 0.10 m이고, 창대는 frame 안쪽 면 -0.18 m에서 실내 마감 면 -0.25 m를 지나 -0.31 m까지 0.13 m 이어져 실내 면 기준 돌출이 0.06 m다. [현관문](../../models/02-exterior-doors.md#front-entry-door): 1.00 - 0.06 - 0.04 = 0.90 m ≥ 목표 0.90 m; 문턱 상면 0.02 m 위 0.01 m 틈을 둔 문짝 하단 Y = 0.03 m, 위 Y = 2.17 m이므로 높이 2.14 m다. [차고문](../../models/02-exterior-doors.md#garage-sectional-door): 5.00 - 0.20 = 4.80 m = 목표 4.80 m, rail-path는 레일 띠 Z = [-0.72, -0.55] m와 상부 예약 Y = [2.15, 2.50] m 안. [정원문](../../models/02-exterior-doors.md#garden-door-pair): 1.20 - 0.03 - 0.04 = 1.13 m, 손잡이 0.06 m를 빼도 1.07 m ≥ 0.95 m, 회전 반경 1.17 m ≤ 바깥 대기 1.80 m; 문턱 상면 Y = 0.02 m, 문짝 하단 0.03 m·위 2.22 m로 높이 2.19 m다. [대문](../../models/02-exterior-doors.md#side-yard-gate): 1.20 - 0.04 - 0.05 = 1.11 m ≥ 1.05 m, 점유 0.05 m ≤ 0.10 m. [실내 문](../../models/03-interior-doors.md#interior-door-members): 11개 모두 거친 폭 - 0.10 m = 목표(0.85·0.90·0.95 m). [난간살](../../models/04-stair-members.md#stair-balusters): 0.02 m ≤ 0.075 m 예약, 간격 ≤ 0.10 m. [아래 부재](../../models/04-stair-members.md#stair-bottom-member): 빈 높이 0.05 m ≤ 0.10 m. [외투장 문짝](../../models/05-closet-fittings.md#coat-closet-doors): 최대 돌출 X = 2.01 m ≤ 2.07 m, 두 트랙이 경계 [1.87, 2.02] 안. [외투장 봉·선반](../../models/05-closet-fittings.md#coat-closet-rod-shelf): 봉 X = 1.425 m와 선반 깊이 0.65 m가 몸통 X = [1.10, 1.75] 안. [린넨장](../../models/05-closet-fittings.md#linen-closet-fittings): 선반 깊이 0.55 m로 문 레일 경계와 분리.

위 문장은 이전 계정의 14개 H2 재계산 결과만 적는다. 10–15를 포함한 나머지 H2의 상한 박스와 원형별 접촉·작동 여유를 아직 대조하지 않았으므로 complete-production 결과와 위반 수는 unverified다. 다른 agent에게 판정을 넘기지 않으며 이 계정을 80개 H2 전체의 한 줄씩 재현 가능한 산술로 보완해야 한다.
