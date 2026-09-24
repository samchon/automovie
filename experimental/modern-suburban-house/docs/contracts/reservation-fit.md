<!--
@evidence discovery/design/models.md#work-specific-model-requirements 개구부 충전 부재 27개 원형과 계단·수납·가구 모델이 spaces의 거친 개구부·순폭 목표·돌출 한도·간격 상한·상한 박스를 받는다는 점을 공용 spatial-convention·reference-scale과 대조했다. 공용 계약은 척도 유도만 요구하고 부재 점유가 upstream 예약을 지키는 산술을 요구하지 않아, use-profile의 치수 충돌 규칙과 06의 순폭 산출 요구를 이 계약의 독립 의무로 채택했다. 현재 실현은 models/00-model-frame.md#model-local-frame·#model-reference-scale이며 house-model-reservation-fit claim이 models 전체에 연결된다. 실제 source 점유와 렌더 계측은 unverified다.
-->

# 예약을 채우는 모델의 맞춤

이 주택의 모델이 spaces가 먼저 정한 개구부·사용 공간·점유 예약을 채울 때 적용하는 생산물별 의무다.

## 예약 치수의 상속과 맞춤 산술 {#reservation-fit}

권위는 [사용과 통행 가정](../settings/00-production.md#use-profile)의 "치수 충돌 시 점유체를 줄여 통과시키지 않고 경계와 배치를 고친다"와 [외부 개구부 인계](../spaces/06-openings.md#external-opening-interface)의 "통행 순폭은 거친 폭에서 프레임·열린 문짝·손잡이의 실제 점유를 뺀 산출값"이다. spaces 예약 하나를 채우거나 그 안에 놓이는 모든 모델 원형은 외곽 치수·칸 수·경첩 쪽·열림 방향·개수 상한을 그 예약 owner H2에서만 받고 모델 파일에 world 좌표나 다른 값을 복제하지 않는다. 모델이 고르는 부재 폭·두께·돌출·간격은 예약 owner가 정한 순폭 목표, 돌출 한도, 간격 상한, 상한 박스를 지키는 산술과 함께 적는다. 산술이 목표를 깨면 모델은 예약을 넓히지 않고 부재를 고치거나 spaces owner로 돌아간다. 현재 실현은 [models 공통 좌표](../models/00-model-frame.md#model-local-frame)와 [기준 척도](../models/00-model-frame.md#model-reference-scale)이며 각 모델 H2가 자기 예약과 산술을 적는다.

Review question: 어느 모델 원형이 공용 모델 원칙을 모두 만족하면서도 자기가 채우는 spaces 예약의 순폭·돌출·간격·상한을 산술 없이 넘을 수 있는가?

Sources: 사용자 「저작 브리프 — 현대 미국 교외 2층 단독주택」; [사용과 통행 가정](../settings/00-production.md#use-profile); [외부 개구부 인계](../spaces/06-openings.md#external-opening-interface).
