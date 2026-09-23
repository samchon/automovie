# 본채와 붙박이 차고

## 본채 외곽과 면적 {#main-building-extent}
<!--
@evidence principles/core/common.md#scope-preservation 두 층이 공유하는 본채 바깥 외곽, 외벽 0.25 m와 칸막이 0.15 m 예약, 마감 안쪽 한계, 차고·포치·대지를 뺀 면적 산술을 한 H2에서 정한다.
@evidence principles/core/common.md#substantive-completion 외벽 바깥 기준 X = [-5.75, 5.75] m, Z = [-10.70, 0] m와 마감 안쪽 X = [-5.50, 5.50] m, Z = [-10.45, -0.25] m를 확정해 방 owner가 소비할 외곽을 남긴다.
@evidence principles/core/common.md#declared-basis 폭 11.50 m는 왼쪽 거실·중앙 계단과 진입·우측 서비스를 함께 놓을 여유, 깊이 10.70 m는 전면 생활부와 후면 공용부를 둘 범위라는 저작 선택이고 246.10㎡는 그 곱의 산술이라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 규모 설정의 범위에서 한 외곽을 고르고 전면 박공을 방 바닥 돌출이 아닌 지붕의 교차 형상으로 만든다는 공간 결정을 더한다.
@evidence principles/design/spaces.md#space-topology 두 storey가 같은 직사각 외곽을 공유하고 차고·포치·대지는 이 외곽 밖이며 방 분할과 문은 05가 잇는 방 owner에 있다는 포함 관계를 정한다.
@evidence principles/design/spaces.md#space-boundary-authority 이 H2는 외곽·벽 두께·안쪽 한계만 소유하고, 외곽 선택으로 settings의 현관·서비스 띠·상층 복도 그래프를 바꿀 권한이 생기지 않는다고 적는다.
@evidence principles/design/spaces.md#space-verification-address 두 층 평면·네 입면·중앙 계단 단면에서 면적 0.01㎡, 경계 0.001 m 허용 오차로 입력 산술과 산출 외곽을 비교하게 한다.
@evidence settings/10-house.md#house-scale 차고 제외 두 층의 246.10㎡ 산술은 235–255㎡ 목표 안의 외곽 선택이다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work house-scale의 폭 11.2–11.8 m·깊이 10.4–11.0 m·235–255㎡와 entry·service-band·upper-hall의 연결 요구를 대조했고 11.50 m × 10.70 m 외곽이 모든 범위 안에서 세 그래프를 담아 부모 수정이 없었다.
@evidence obligations/design/spaces.md#space-reference-topology 본채 외벽 바깥 기준 X = [-5.75, 5.75] m, Z = [-10.70, 0] m를 두 층의 공통 building 프레임으로 두고 방·입면·지붕이 이 외곽과 안쪽 한계를 참조하게 한다.
@evidence obligations/design/spaces.md#space-envelope-interface 외벽 두께 0.25 m와 마감 안쪽 한계 X = [-5.50, 5.50] m, Z = [-10.45, -0.25] m를 함께 정해 외부 매스와 실내 유효 치수가 같은 벽을 공유하게 한다.
-->

이 spaces의 외곽 선택은 [규모](../settings/10-house.md#house-scale)와 [좌표](../settings/00-production.md#coordinate-units)를 따른다. 본채 외벽 바깥 기준은 X = [-5.75, 5.75] m, Z = [-10.70, 0] m다. 두 층에 같은 직사각 외곽을 사용한다. 폭 11.50 m와 깊이 10.70 m의 곱은 층당 123.05㎡, 두 층 합은 246.10㎡다. 이것은 저작 입력의 산술이며 컴파일된 면적 계측 결과가 아니다. 차고·포치·대지는 이 값에 포함하지 않는다. 전면 박공은 지붕의 교차 형상으로 만들며 방 바닥을 돌출시키지 않는다.

외벽 두께의 공간 예약값은 0.25 m다. 본채의 마감 안쪽 한계는 X = [-5.50, 5.50] m, Z = [-10.45, -0.25] m다. 이 예약값 안에서 구조와 외장 조합을 후속 부재 설계가 정하며 마감 두께를 추가한다는 이유로 안쪽 한계를 잠식하지 않는다. 실내 칸막이는 0.15 m를 예약한다. 방의 유효 치수는 벽 중심선 간격이 아닌 최종 안쪽 면 사이에서 읽어야 한다.

11.50 m 폭을 택한 근거는 왼쪽 거실, 중앙 계단과 진입, 우측 서비스 접근 및 작은 서비스실을 함께 배치할 여유다. 10.70 m 깊이는 전면 생활부와 후면 연속 공용부를 두는 범위다. 방 분할과 문 위치는 [동선 인계](05-route-network.md#room-route-network)가 잇는 방별 owner에 작성했다. 문 작동·기구 점유와 실제 면적/경계가 이 예약 안에 들어가는지는 아직 unverified다. 공간 그래프는 [설정의 현관](../settings/10-house.md#entry), [서비스 띠](../settings/10-house.md#service-band), [상층 복도](../settings/10-house.md#upper-hall)가 지배하며 이 외곽 선택으로 그 그래프를 바꿀 권한은 생기지 않는다.

검증 주소는 향후 `src/spaces/building.ts`의 본채 외곽과 두 storey, 그 산출물을 소비할 면적·경계 보고다. 필요한 관찰은 두 층 평면, 전후·좌우 입면 및 중앙 계단 단면이다. 면적 허용 오차는 저작 입력 산술과 산출 외곽의 비교에서 0.01㎡, 경계 일치 허용 오차는 0.001 m로 선택한다. 이는 측량 정밀도나 시공 허용 오차의 주장이 아니다.

## 붙박이 빈 차고의 접면 {#attached-garage-extent}
<!--
@evidence principles/core/common.md#scope-preservation 차고 외곽, 본채와의 한 공유 벽, 나머지 외벽 예약, 예약 순내부, 정면문과 머드룸 문의 void 소유, 차량 배제를 맡는다.
@evidence principles/core/common.md#substantive-completion 외곽 X = [5.50, 11.70] m, Z = [-6.70, -0.30] m와 공유 벽 X = [5.50, 5.75] m, 마감 안쪽 X = [5.75, 11.45] m, Z = [-6.45, -0.55] m를 정한다.
@evidence principles/core/common.md#declared-basis 폭 6.20 m·깊이 6.40 m는 차고 설정의 외곽 범위 안의 선택이고 5.70 m × 5.90 m는 가구와 문 레일을 넣기 전의 예약 순내부라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 붙박이 차고를 본채보다 정면을 0.30 m 물리고 본채 후면을 넘지 않는 위치에 두고 두 외곽의 겹침을 벽 하나로 읽는 규칙을 정한다.
@evidence principles/design/spaces.md#space-topology 차고는 본채 오른쪽의 단층 볼륨이고 정면 개구부는 정면 벽, 머드룸 문은 공유 벽의 실제 void이며 서비스 통로를 머드룸이라고 이름만 바꾸는 연결을 금한다.
@evidence principles/design/spaces.md#space-boundary-authority 공유 벽은 src/spaces/garage.ts가 같은 경계 id로 소비하고 차고 정면 면은 front.ts의 전체 전면에 속하며 머드룸 문 좌표는 laundry-plan에서 받는다.
@evidence principles/design/spaces.md#space-verification-address 공유 벽의 이중 두께, 머드룸 밖으로 연결된 차고문, 별동 차고, 닫힌 정면문을 제거해야만 가능한 내부 관찰을 실패 조건으로 든다.
@evidence settings/10-house.md#garage 두 대용 외곽 범위에서 빈 바닥을 예약하고 차량이나 주차 성능을 주장하지 않는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work garage의 외곽 폭 5.8–6.4 m·깊이 6.0–6.6 m와 차량 금지, service-band의 "차고 출입문은 머드룸과 직접 맞닿는다"를 대조했고 공유 벽 하나의 붙박이 배치로 모두 성립해 부모 수정이 없었다.
-->

[빈 차고](../settings/10-house.md#garage)는 본채 오른쪽에 하나의 단층 볼륨으로 붙는다. 외곽은 X = [5.50, 11.70] m, Z = [-6.70, -0.30] m로 택한다. 폭 6.20 m·깊이 6.40 m는 차고 외곽 범위 안이다. 본채보다 정면을 0.30 m 뒤로 물리고 본채 후면을 넘지 않는다. 본채와 차고가 공유하는 벽은 X = [5.50, 5.75] m 안의 하나의 0.25 m 벽체다. 두 외곽의 겹침은 두 벽을 겹쳐 그리는 지시가 아니라 하나의 공유 벽을 양쪽 면적 경계가 참조한다는 뜻이다.

나머지 차고 외벽도 0.25 m 예약을 사용한다. 마감 안쪽 X = [5.75, 11.45] m, Z = [-6.45, -0.55] m로부터 얻는 5.70 m × 5.90 m는 가구와 문 레일을 넣기 전의 예약 순내부다. 수납 설치 후 여유나 두 대 차량의 주차 성능을 측정한 값으로 쓰지 않는다. 차량은 저작하지 않는다. 차고의 정면 개구부·머드룸 문은 각각 정면 면과 공유 벽의 실제 void로 저작해야 한다. 머드룸 문의 좌표·대기는 [세탁·머드룸](rooms/laundry.md#laundry-plan)의 결정을 받는다. 임의의 서비스 통로를 머드룸이라고 이름만 바꾸어 직접 접면을 지불하지 않는다.

검증할 실패는 공유 벽의 이중 두께, 머드룸 밖으로 연결된 차고문, 별동 차고, 닫힌 정면문을 제거해야만 가능한 내부 관찰이다. 차고 바닥·천장·레일·수납은 후속 단계의 완성 범위이며 현재 이 외곽 선언은 그 구현을 주장하지 않는다. `src/spaces/garage.ts`가 공유 벽의 동일 경계 id를 소비하고 `src/spaces/envelope/front.ts`가 차고 정면을 포함한 전체 전면을 소유하도록 배정한다.
