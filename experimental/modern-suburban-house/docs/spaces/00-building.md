# 본채와 붙박이 차고

## 본채 외곽과 면적 {#main-building-extent}
<!--
@evidence principles/core/common.md#scope-preservation 두 층이 공유하는 본채 바깥 외곽, 외벽 0.25 m와 칸막이 0.15 m 예약, 마감 안쪽 한계, 차고·포치·대지를 뺀 면적 산술을 한 H2에서 정한다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 본문이 X = [-5.75, 5.75]·Z = [-10.70, 0] m 외곽, 외벽 0.25 m·칸막이 0.15 m 예약, 마감 안쪽 한계, 차고·포치·대지를 뺀 246.10㎡ 산술을 모두 담아 본채 외곽 몫이 다른 owner로 새지 않음을 확인했다.
@evidence principles/core/common.md#substantive-completion 외벽 바깥 기준 X = [-5.75, 5.75] m, Z = [-10.70, 0] m와 마감 안쪽 X = [-5.50, 5.50] m, Z = [-10.45, -0.25] m를 확정해 방 owner가 소비할 외곽을 남긴다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 외벽 바깥 X = [-5.75, 5.75]·Z = [-10.70, 0] m와 마감 안쪽 X = [-5.50, 5.50]·Z = [-10.45, -0.25] m가 수치로 확정되고 유효 치수를 최종 안쪽 면 사이에서 읽게 해 방 owner가 외곽을 새로 정할 일이 없음을 확인했다.
@evidence principles/core/common.md#declared-basis 폭 11.50 m는 왼쪽 거실·중앙 계단과 진입·우측 서비스를 함께 놓을 여유, 깊이 10.70 m는 전면 생활부와 후면 공용부를 둘 범위라는 저작 선택이고 246.10㎡는 그 곱의 산술이라고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 11.50 m 폭은 거실·계단·서비스 배치 여유, 10.70 m 깊이는 전면 생활부·후면 공용부 범위라는 근거와 ‘저작 입력의 산술이며 컴파일된 면적 계측 결과가 아니다’를 대조해 수치마다 근거가 붙음을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 규모 설정의 범위에서 한 외곽을 고르고 전면 박공을 방 바닥 돌출이 아닌 지붕의 교차 형상으로 만든다는 공간 결정을 더한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 house-scale이 폭·깊이 범위와 전면 박공의 얕은 돌출 허용만 둔 데 비해 이 H2는 11.50 × 10.70 m 한 외곽을 고르고 박공을 방 바닥 돌출 없이 지붕 교차 형상으로 만든다는 결정을 더함을 대조했다.
@evidence principles/design/spaces.md#space-topology 두 storey가 같은 직사각 외곽을 공유하고 차고·포치·대지를 이 외곽의 면적 값에 넣지 않으며 방 분할과 문 위치는 동선 인계가 잇는 방별 owner에 둔다는 포함 관계를 정한다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 ‘두 층에 같은 직사각 외곽’, 차고·포치·대지의 면적 제외, 방 분할과 문 위치를 동선 인계의 방별 owner에 둔다는 문장을 대조해 building–storey–방의 포함 관계가 형상보다 먼저 선언됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 방 분할과 문 위치는 동선 인계가 잇는 방별 owner, 외벽 0.25 m 예약 안의 구조·외장 조합은 후속 부재 설계에 두고 외곽 선택으로 settings의 현관·서비스 띠·상층 복도 그래프를 바꿀 권한이 생기지 않는다고 적는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 방 분할·문 위치는 동선 인계 링크, 0.25 m 예약 안 구조·외장 조합은 후속 부재 설계로 넘기고 현관·서비스 띠·상층 복도 설정 링크가 그래프를 지배한다고 적어 외곽이 남의 값을 덮어쓰지 않음을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 두 층 평면·네 입면·중앙 계단 단면에서 면적 0.01㎡, 경계 0.001 m 허용 오차로 입력 산술과 산출 외곽을 비교하게 한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 넷째 문단의 `src/spaces/building.ts` 산출 외곽, 두 층 평면·전후좌우 입면·중앙 계단 단면, 면적 0.01㎡·경계 0.001 m 허용 오차가 246.10㎡ 산술과 외곽 주장을 반증할 주소임을 확인했다.
@evidence settings/10-house.md#house-scale 차고 제외 두 층의 246.10㎡ 산술은 235–255㎡ 목표 안의 외곽 선택이다.
@evidenceReview settings/10-house.md#house-scale #f7cbe11 house-scale의 ‘차고·개방 포치·대지 제외 두 층 외벽 기준 합’ 해석과 235–255㎡ 범위를 층당 123.05㎡·두 층 246.10㎡와 차고·포치·대지 비포함 문장에 대조해 범위 안의 선택임을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work house-scale의 폭 11.2–11.8 m·깊이 10.4–11.0 m·235–255㎡를 대조했고 11.50 m·10.70 m·246.10㎡가 세 범위 안에 들며 이 외곽 선택이 entry·service-band·upper-hall의 그래프를 바꾸지 않아 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 house-scale의 폭 11.2–11.8 m·깊이 10.4–11.0 m·235–255㎡에 11.50 m·10.70 m·246.10㎡를 대조하고, 외곽 선택이 entry·service-band·upper-hall 그래프를 바꿀 권한이 없다는 셋째 문단으로 부모 수정 불필요를 확인했다.
@evidence obligations/design/spaces.md#space-reference-topology 본채 외벽 바깥 기준 X = [-5.75, 5.75] m, Z = [-10.70, 0] m를 두 층이 함께 쓰는 하나의 직사각 building 외곽으로 두고 방의 유효 치수를 벽 중심선이 아닌 최종 안쪽 면 사이에서 읽게 한다.
@evidenceReview obligations/design/spaces.md#space-reference-topology #5053f99 외벽 바깥 X = [-5.75, 5.75]·Z = [-10.70, 0] m를 두 층이 공유하는 한 직사각 building 외곽으로 두고 좌표 링크를 따르게 해, 방과 층이 좌표계를 추론하지 않고 이 외곽을 참조할 수 있음을 확인했다.
@evidence obligations/design/spaces.md#space-envelope-interface 외벽 두께 0.25 m와 마감 안쪽 한계 X = [-5.50, 5.50] m, Z = [-10.45, -0.25] m를 함께 정해 외부 매스와 실내 유효 치수가 같은 벽을 공유하게 한다.
@evidenceReview obligations/design/spaces.md#space-envelope-interface #4b397de 외벽 0.25 m 예약과 마감 안쪽 X = [-5.50, 5.50]·Z = [-10.45, -0.25] m를 한 H2가 함께 정하고 마감 추가로 안쪽 한계를 잠식하지 않는다고 적어 외부 매스와 실내 유효 치수가 같은 벽을 공유함을 확인했다.
-->

이 spaces의 외곽 선택은 [규모](../settings/10-house.md#house-scale)와 [좌표](../settings/00-production.md#coordinate-units)를 따른다. 본채 외벽 바깥 기준은 X = [-5.75, 5.75] m, Z = [-10.70, 0] m다. 두 층에 같은 직사각 외곽을 사용한다. 폭 11.50 m와 깊이 10.70 m의 곱은 층당 123.05㎡, 두 층 합은 246.10㎡다. 이것은 저작 입력의 산술이며 컴파일된 면적 계측 결과가 아니다. 차고·포치·대지는 이 값에 포함하지 않는다. 전면 박공은 지붕의 교차 형상으로 만들며 방 바닥을 돌출시키지 않는다.

외벽 두께의 공간 예약값은 0.25 m다. 본채의 마감 안쪽 한계는 X = [-5.50, 5.50] m, Z = [-10.45, -0.25] m다. 이 예약값 안에서 구조와 외장 조합을 후속 부재 설계가 정하며 마감 두께를 추가한다는 이유로 안쪽 한계를 잠식하지 않는다. 실내 칸막이는 0.15 m를 예약한다. 방의 유효 치수는 벽 중심선 간격이 아닌 최종 안쪽 면 사이에서 읽어야 한다.

11.50 m 폭을 택한 근거는 왼쪽 거실, 중앙 계단과 진입, 우측 서비스 접근 및 작은 서비스실을 함께 배치할 여유다. 10.70 m 깊이는 전면 생활부와 후면 연속 공용부를 두는 범위다. 방 분할과 문 위치는 [동선 인계](05-route-network.md#room-route-network)가 잇는 방별 owner에 작성했다. 문 작동·기구 점유와 실제 면적/경계가 이 예약 안에 들어가는지는 아직 unverified다. 공간 그래프는 [설정의 현관](../settings/10-house.md#entry), [서비스 띠](../settings/10-house.md#service-band), [상층 복도](../settings/10-house.md#upper-hall)가 지배하며 이 외곽 선택으로 그 그래프를 바꿀 권한은 생기지 않는다.

검증 주소는 향후 `src/spaces/building.ts`의 본채 외곽과 두 storey, 그 산출물을 소비할 면적·경계 보고다. 필요한 관찰은 두 층 평면, 전후·좌우 입면 및 중앙 계단 단면이다. 면적 허용 오차는 저작 입력 산술과 산출 외곽의 비교에서 0.01㎡, 경계 일치 허용 오차는 0.001 m로 선택한다. 이는 측량 정밀도나 시공 허용 오차의 주장이 아니다.

## 붙박이 빈 차고의 접면 {#attached-garage-extent}
<!--
@evidence principles/core/common.md#scope-preservation 차고 외곽, 본채와의 한 공유 벽, 나머지 외벽 예약, 예약 순내부, 정면문과 머드룸 문의 void 소유, 차량 배제를 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 외곽 X = [5.50, 11.70]·Z = [-6.70, -0.30] m, 공유 벽 하나, 나머지 외벽 0.25 m, 5.70 m × 5.90 m 예약 순내부, 정면 개구부·머드룸 문 void, 차량 비저작이 모두 본문에 있어 차고 몫에 빠진 항목이 없음을 확인했다.
@evidence principles/core/common.md#substantive-completion 외곽 X = [5.50, 11.70] m, Z = [-6.70, -0.30] m와 공유 벽 X = [5.50, 5.75] m, 마감 안쪽 X = [5.75, 11.45] m, Z = [-6.45, -0.55] m를 정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 외곽 X = [5.50, 11.70]·Z = [-6.70, -0.30], 공유 벽 X = [5.50, 5.75], 마감 안쪽 X = [5.75, 11.45]·Z = [-6.45, -0.55] m가 수치로 정해져 차고 실내 owner가 소비할 경계가 확정됨을 확인했다.
@evidence principles/core/common.md#declared-basis 폭 6.20 m·깊이 6.40 m는 차고 설정의 외곽 범위 안의 선택이고 5.70 m × 5.90 m는 가구와 문 레일을 넣기 전의 예약 순내부라고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 폭 6.20 m·깊이 6.40 m를 ‘차고 외곽 범위 안’의 선택으로, 5.70 m × 5.90 m를 ‘가구와 문 레일을 넣기 전의 예약 순내부’로 밝히고 주차 성능 측정값으로 쓰지 않는다고 적어 근거와 한계가 드러남을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 붙박이 차고를 본채보다 정면을 0.30 m 물리고 본채 후면을 넘지 않는 위치에 두고 두 외곽의 겹침을 벽 하나로 읽는 규칙을 정한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 garage 설정이 폭·깊이 범위와 오른쪽 부속 볼륨만 정한 데 비해 이 H2는 정면 0.30 m 후퇴, 본채 후면 비초과, 두 외곽의 겹침을 공유 벽 하나로 읽는 규칙을 더함을 대조했다.
@evidence principles/design/spaces.md#space-topology 차고는 본채 오른쪽의 단층 볼륨이고 정면 개구부는 정면 벽, 머드룸 문은 공유 벽의 실제 void이며 서비스 통로를 머드룸이라고 이름만 바꾸는 연결을 금한다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 본채 오른쪽 단층 볼륨, 정면 개구부는 정면 벽·머드룸 문은 공유 벽의 실제 void, 서비스 통로에 머드룸 이름만 붙이는 연결 금지를 대조해 차고의 접근·인접 관계가 형상 전에 정해짐을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 공유 벽은 src/spaces/garage.ts가 같은 경계 id로 소비하고 차고 정면 면은 front.ts의 전체 전면에 속하며 머드룸 문 좌표는 laundry-plan에서 받는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 공유 벽의 동일 경계 id를 `src/spaces/garage.ts`가 소비하고 차고 정면은 `src/spaces/envelope/front.ts`의 전면에 속하며 머드룸 문 좌표·대기는 laundry-plan에서 받는다는 문장으로 이중 소유가 없음을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 공유 벽의 이중 두께, 머드룸 밖으로 연결된 차고문, 별동 차고, 닫힌 정면문을 제거해야만 가능한 내부 관찰을 실패 조건으로 든다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 셋째 문단이 공유 벽 이중 두께, 머드룸 밖으로 연결된 차고문, 별동 차고, 닫힌 정면문 제거가 필요한 내부 관찰을 실패로 지목해 공유 벽·머드룸 접면 주장을 반증할 주소를 둠을 확인했다.
@evidence settings/10-house.md#garage 두 대용 외곽 범위에서 빈 바닥을 예약하고 차량이나 주차 성능을 주장하지 않는다.
@evidenceReview settings/10-house.md#garage #f6816c7 garage 설정의 외곽 5.8–6.4 m·6.0–6.6 m와 차량 금지를 6.20 m·6.40 m 외곽과 ‘차량은 저작하지 않는다’, 순내부를 두 대 주차 성능으로 쓰지 않는 문장에 대조했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work garage의 외곽 폭 5.8–6.4 m·깊이 6.0–6.6 m와 차량 금지, service-band의 "차고 출입문은 머드룸과 직접 맞닿는다"를 대조했고 공유 벽 하나의 붙박이 배치로 모두 성립해 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 garage의 5.8–6.4 m·6.0–6.6 m·차량 금지와 service-band의 차고 출입문–머드룸 직접 접면을 6.20 × 6.40 m 외곽과 공유 벽 void의 머드룸 문에 대조해 settings 수정 없이 성립함을 확인했다.
-->

[빈 차고](../settings/10-house.md#garage)는 본채 오른쪽에 하나의 단층 볼륨으로 붙는다. 외곽은 X = [5.50, 11.70] m, Z = [-6.70, -0.30] m로 택한다. 폭 6.20 m·깊이 6.40 m는 차고 외곽 범위 안이다. 본채보다 정면을 0.30 m 뒤로 물리고 본채 후면을 넘지 않는다. 본채와 차고가 공유하는 벽은 X = [5.50, 5.75] m 안의 하나의 0.25 m 벽체다. 두 외곽의 겹침은 두 벽을 겹쳐 그리는 지시가 아니라 하나의 공유 벽을 양쪽 면적 경계가 참조한다는 뜻이다.

나머지 차고 외벽도 0.25 m 예약을 사용한다. 마감 안쪽 X = [5.75, 11.45] m, Z = [-6.45, -0.55] m로부터 얻는 5.70 m × 5.90 m는 가구와 문 레일을 넣기 전의 예약 순내부다. 수납 설치 후 여유나 두 대 차량의 주차 성능을 측정한 값으로 쓰지 않는다. 차량은 저작하지 않는다. 차고의 정면 개구부·머드룸 문은 각각 정면 면과 공유 벽의 실제 void로 저작해야 한다. 머드룸 문의 좌표·대기는 [세탁·머드룸](rooms/laundry.md#laundry-plan)의 결정을 받는다. [서비스 띠](../settings/10-house.md#service-band)가 요구한 차고 출입문과 머드룸의 직접 접면을 임의의 서비스 통로에 머드룸이라는 이름만 붙여 지불하지 않는다.

검증할 실패는 공유 벽의 이중 두께, 머드룸 밖으로 연결된 차고문, 별동 차고, 닫힌 정면문을 제거해야만 가능한 내부 관찰이다. 차고 바닥·천장·레일·수납은 후속 단계의 완성 범위이며 현재 이 외곽 선언은 그 구현을 주장하지 않는다. `src/spaces/garage.ts`가 공유 벽의 동일 경계 id를 소비하고 `src/spaces/envelope/front.ts`가 차고 정면을 포함한 전체 전면을 소유하도록 배정한다.
