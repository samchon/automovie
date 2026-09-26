# 층과 수직 기준

## 두 storey와 완성 바닥 {#storey-datums}
<!--
@evidence principles/core/common.md#scope-preservation 두 storey의 완성 바닥·천장, 모든 실의 storey 직접 참조, 공유 층판과 아래층 천장의 같은 계단 구멍, 최상부 천장과 지붕 대조로의 인계를 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 두 storey 완성 바닥 Y = 0·3.06 m와 천장 Y = 2.75·5.66 m, 모든 실의 storey 직접 참조, 층판과 1층 천장의 같은 계단 구멍, 최상부 천장·지붕 대조 인계가 본문에 있어 층 datum 몫이 빠지지 않음을 확인했다.
@evidence principles/core/common.md#substantive-completion ground-storey Y = 0 m, upper-storey Y = 3.06 m, 완성 천장 Y = 2.75 m·5.66 m와 그 사이 0.31 m 예약을 정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 `ground-storey` Y = 0 m, `upper-storey` Y = 3.06 m, 완성 천장 Y = 2.75 m·5.66 m, 사이 0.31 m 예약이 수치로 정해지고 2.75 + 0.31 = 3.06이 맞아 방·계단이 층 높이를 새로 정할 필요가 없음을 확인했다.
@evidence principles/core/common.md#declared-basis 순높이 2.75 m·2.60 m는 main-mass 높이 범위 안의 선택이고 0.31 m는 세부 적층이나 구조 안전을 검증한 값이 아닌 예약이라고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 순높이 2.75 m·2.60 m를 본채 높이 범위 링크 안의 선택으로, 0.31 m를 ‘세부 적층이나 구조 안전을 검증한 결과가 아니다’라는 예약으로 밝혀 각 수치의 근거와 지위가 드러남을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 층별 순높이 범위를 두 datum과 층간 0.31 m로 고정하고 차고·포치를 ground-storey 부속으로, 지붕 속을 층이 아닌 공간으로 정한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 main-mass가 1층 2.65–2.80 m·2층 2.50–2.65 m 순높이 범위만 둔 데 비해 이 H2는 두 datum과 층간 0.31 m를 고정하고 차고·포치를 ground-storey 부속, 지붕 속을 비층 공간으로 정함을 대조했다.
@evidence principles/design/spaces.md#space-topology 본채에는 두 storey만 두고 차고·포치는 ground-storey 부속이며 지붕 속 공간을 세 번째 층으로 쓰지 않고 각 실은 건물 전체의 자식이어도 storey 소속을 생략하지 않고 해당 storey를 직접 참조한다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 ‘본채에는 이 두 storey만’, 차고·현관 포치의 ground-storey 부속, 지붕 속 세 번째 층 금지, ‘건물 전체의 자식이라는 이유로 storey 소속을 생략하지 않는다’를 포함 관계 요구와 대조했다.
@evidence principles/design/spaces.md#space-boundary-authority datum은 src/spaces/storeys.ts가 한 번 소유하고 계단 구멍 평면은 stair-floor-opening에서 받으며 이 높이 예약 안의 층간 점유는 interstorey-floor-boundary가 정하고 upper-storey 천장 datum은 upper-ceiling-closure가 소비한다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 datum은 `src/spaces/storeys.ts`가 한 번 소유하고 구멍 평면은 계단 구멍 owner, 예약 안 점유는 층간 구조의 단일 조립, 상층 천장 datum은 최상부 천장이 소비한다고 링크로 나눠 값이 두 번 저작되지 않음을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 모든 공간의 storey 참조, 두 완성면 높이, 천장/층판의 대응 구멍, 계단 상부 도착 높이를 0.001 m로 대조하고 구멍 아래 머리 공간 목표 2.00 m를 단면에서 본다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 넷째 문단의 storey 참조·두 완성면 높이·대응 구멍·상부 도착 높이 대조와 0.001 m 허용 오차, 셋째 문단의 구멍 아래 머리 공간 2.00 m 단면 검사가 datum 주장을 반증할 주소임을 확인했다.
@evidence settings/00-production.md#coordinate-units 전면 중앙 바닥 원점과 +Y를 두 storey 완성 높이의 공통 기준으로 쓴다.
@evidenceReview settings/00-production.md#coordinate-units #2e3dcf8 coordinate-units의 원점(본채 1층 완성 바닥의 전면 중앙)과 +Y 위를, 첫 문단이 좌표 기준을 받아 Y = 0 m·Y = 3.06 m로 정한 datum에 대조해 두 storey가 같은 기준에서 나옴을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work coordinate-units의 원점·+Y와 main-mass의 1층 2.65–2.80 m·2층 2.50–2.65 m 순높이를 대조했고 순높이 2.75 m·2.60 m가 두 범위 안에 들어 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 coordinate-units의 원점·+Y와 main-mass의 1층 2.65–2.80 m·2층 2.50–2.65 m에 순높이 2.75 m·2.60 m를 대조해 두 범위 안에 들고 settings 수정 없이 datum이 성립함을 확인했다.
@evidence obligations/design/spaces.md#space-reference-topology `ground-storey` Y = 0 m와 `upper-storey` Y = 3.06 m 두 storey만 두고 각 실의 공간 레코드가 storey를 직접 참조하게 한다.
@evidenceReview obligations/design/spaces.md#space-reference-topology #5053f99 `ground-storey` Y = 0 m·`upper-storey` Y = 3.06 m 두 이름 있는 level과 각 실 레코드의 storey 직접 참조를 대조해 방이 층 좌표를 추론하지 않고 이름으로 층에 속함을 확인했다.
@evidence obligations/design/spaces.md#space-envelope-interface 완성 천장 Y = 2.75 m·5.66 m와 1층 천장과 2층 완성 바닥 사이 0.31 m 예약을 정하고 각 방·개구부·계단·층판이 storeys.ts의 같은 datum을 소비하게 한다.
@evidenceReview obligations/design/spaces.md#space-envelope-interface #4b397de 완성 천장 Y = 2.75 m·5.66 m와 0.31 m 예약, ‘각 방·개구부·계단·층판이 그 값을 소비’를 대조해 외피 개구부와 실내 층 높이가 `storeys.ts`의 같은 datum을 공유함을 확인했다.
-->

[좌표 기준](../settings/00-production.md#coordinate-units)을 받아 `ground-storey`의 완성 바닥은 Y = 0 m, `upper-storey`는 Y = 3.06 m로 정한다. 본채에는 이 두 storey만 있다. 차고와 현관 포치는 ground-storey의 부속 공간이며 지붕 속 공간을 사람이 사용하는 세 번째 층으로 만들지 않는다. 각 실의 공간 레코드는 해당 storey를 직접 참조해야 하며 건물 전체의 자식이라는 이유로 storey 소속을 생략하지 않는다.

1층 완성 천장은 Y = 2.75 m, 2층 완성 천장은 Y = 5.66 m다. 실내 순높이는 각각 2.75 m와 2.60 m로 [본채 높이 범위](../settings/10-house.md#main-mass) 안이다. 1층 천장과 2층 완성 바닥 사이 0.31 m는 천장·바닥 구조·마감 전체의 예약이다. 이 선언은 세부 적층이나 구조 안전을 검증한 결과가 아니다. `src/spaces/storeys.ts`가 datum을 한 번 소유하고 각 방·개구부·계단·층판이 그 값을 소비한다.

공유 2층 바닥과 1층 천장에는 같은 계단 통행 구멍이 필요하다. 구멍의 평면은 [계단 구멍 owner](02-stair.md#stair-floor-opening)를 소비하며 양쪽 마감이 독립적으로 다른 구멍을 만들지 않는다. [층간 구조의 단일 조립](08-floor-assembly.md#interstorey-floor-boundary)이 이 높이 예약 안의 구조/마감 점유와 한 몸체의 소유를 정하고, [가장자리 접합](08-floor-assembly.md#interstorey-edge-junctions)이 외벽·실내벽·상부 도착을 잇는다. 구멍 아래의 계단 유효 머리 공간은 2.00 m 목표에 대해 실제 단면에서 검사한다. 빈 공간을 지붕까지 뚫어 복층 보이드로 바꾸는 방법은 허용하지 않는다.

필요한 검사는 모든 공간의 storey 참조, 두 층 완성면 높이, 천장/층판의 대응 구멍, 계단 상부 도착 높이의 산출물 대조다. 높이·접합 비교 허용 오차는 0.001 m다. 실제 storey 레코드와 경계 산출물이 아직 없어 이 검사들은 unverified다.

[최상부 천장](09-ceiling-assembly.md#upper-ceiling-closure)은 이 문서의 upper-storey 천장 datum을 소비하여 방과 계단실 위를 닫는다. 바탕/마감 점유는 그 owner가 배정하며 층간 구조의 구멍과 적층을 복제하지 않는다. [지붕과의 대조](09-ceiling-assembly.md#ceiling-roof-clearance)는 실내 윤곽 위의 지붕 아래면을 사용한다.

## 포치와 차고의 지면 연결 {#ground-threshold-datums}
<!--
@evidence principles/core/common.md#scope-preservation 포치 바닥과 앞 보행길, 세 챌판·디딤·평탄 대기, 차고 바닥과 천장, 머드룸 문 앞의 한 단과 차고 쪽 대기를 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 포치 Y = 0 m와 앞 보행길 Y = -0.45 m, 세 단·디딤·평탄 대기, 차고 바닥 Y = -0.15 m·천장 Y = 2.55 m, 머드룸 문 앞 0.15 m 한 단과 차고 쪽 대기가 모두 본문에 있어 지면 연결 몫이 빠지지 않음을 확인했다.
@evidence principles/core/common.md#substantive-completion 포치 Y = 0 m, 앞 보행길 Y = -0.45 m와 0.15 m 세 단·0.30 m 디딤, 포치 유효 깊이 1.80 m, 차고 바닥 Y = -0.15 m·천장 Y = 2.55 m를 정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 포치 Y = 0 m, 앞 보행길 Y = -0.45 m, 0.15 m 세 단·0.30 m 디딤, 유효 깊이 1.80 m, 차고 Y = -0.15 m·천장 Y = 2.55 m가 수치로 정해져 포치와 차고 owner가 높이를 새로 고를 필요가 없음을 확인했다.
@evidence principles/core/common.md#declared-basis 앞 보행길 Y = -0.45 m와 0.15 m 세 단·0.30 m 디딤은 이 H2가 택한 예약이고 경사나 단수를 참조 픽셀에서 역산하지 않으며 외부 보도와의 접촉은 이후 대지 입력과 함께 검토한다고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 앞 보행길 높이와 세 단·디딤을 이 H2의 예약으로 적고 ‘경사나 단수를 참조 픽셀에서 역산하지 않으며’ 외부 보도 접촉은 이후 대지 입력과 함께 검토한다고 밝혀 근거와 미해결 입력이 구분됨을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 포치 설정의 높은 바닥과 실제 단을 0.45 m 세 단으로 정하고 차고를 머드룸보다 한 단 낮은 바닥으로 둔다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 porch-entry가 0.35–0.55 m 상승과 ‘실제 단’만 요구한 데 비해 이 H2는 0.45 m를 0.15 m 세 단으로 나누고 차고를 머드룸 Y = 0 m보다 한 단 낮은 Y = -0.15 m로 두는 결정을 더함을 대조했다.
@evidence principles/design/spaces.md#space-topology 차고와 머드룸의 평면 연결을 같은 높이의 통로로 기록하지 않고 차고 쪽 평탄 대기와 높이 0.15 m의 한 단을 거치는 연결로 정한다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 ‘평면 연결만으로 동일 높이의 통로라고 기록하지 않는다’와 차고 쪽 평탄 대기·0.15 m 단 하나를 거치는 머드룸 문 연결을 대조해 차고–머드룸 접근 관계가 높이 차를 포함해 선언됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 높이의 canonical 값은 storeys.ts가 제공하고 포치는 porch.ts, 차고는 garage.ts가 소비하며 차고 천장 폐합은 09, 바닥 바탕은 10이 받는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 높이 canonical 값은 `src/spaces/storeys.ts`, 포치는 `porch.ts`, 차고는 `garage.ts`가 소비하고 차고 천장은 09, 바탕과 출입 단면은 10 링크로 넘겨 높이값의 owner가 하나임을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 정면 진입 단면, 차고/머드룸 문턱 단면과 양방향 진입 시야를 두고 문짝 작동과 바구니 운반이 단 가장자리에서 부딪히는지를 unverified로 둔다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 셋째 문단의 정면 진입 단면·차고/머드룸 문턱 단면·양방향 진입 시야와, 문짝 작동·바구니 횡단이 단 가장자리에서 충돌하는지의 unverified 표기가 이 H2의 반증 주소임을 확인했다.
@evidence settings/10-house.md#porch-entry 주변보다 높은 포치를 실제 세 단과 평탄 대기로 이어 현관에 접근시킨다.
@evidenceReview settings/10-house.md#porch-entry #a9f9880 porch-entry의 주변보다 0.35–0.55 m 높은 바닥과 실제 단, 앞 보도에서 현관으로의 직접 접근을 포치 Y = 0 m, 보행길 Y = -0.45 m, 세 단과 앞뒤 평탄 대기에 대조했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work porch-entry의 0.35–0.55 m 상승·유효 깊이 1.6–2.0 m를 대조했고 0.45 m 세 단과 1.80 m 유효 깊이가 범위 안에서 성립해 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 porch-entry의 0.35–0.55 m 상승·1.6–2.0 m 유효 깊이에 0.45 m 세 단과 1.80 m 유효 깊이를 대조해 두 범위 안에 들고 settings 수정 없이 성립함을 확인했다.
-->

포치 바닥은 현관의 1층 완성 바닥과 같은 Y = 0 m다. 포치 앞 보행길은 Y = -0.45 m로 예약하고 높이 0.15 m의 세 단을 통해 올라온다. 각 디딤의 수평 깊이는 0.30 m로 택하며 세 단 앞뒤에 평탄한 대기면을 둔다. 포치의 유효 깊이는 전면 벽에서 바깥 방향으로 1.80 m다. 0.45 m 상승과 1.80 m 유효 깊이는 [현관 포치](../settings/10-house.md#porch-entry)의 0.35–0.55 m 상승·1.6–2.0 m 유효 깊이 범위 안의 선택이다. 계단 앞 접근길은 [현관 보행길](site/front-walk.md#front-walk-plan)이 첫 챌판 위치와 이 앞 보행길 높이를 소비해 잇고, 외부 보도와의 접촉은 이후 대지 입력과 함께 검토하며 경사나 단수를 참조 픽셀에서 역산하지 않는다.

차고 완성 바닥은 Y = -0.15 m, 차고 천장은 Y = 2.55 m로 택한다. 머드룸은 ground-storey의 Y = 0 m를 사용한다. 차고에서 머드룸으로 들어오는 문 앞에는 차고 쪽 평탄 대기와 높이 0.15 m의 단 하나를 예약한다. 문짝 작동과 양쪽 대기는 [세탁·머드룸](rooms/laundry.md#laundry-plan), 바구니를 든 횡단은 [머드룸 횡단](rooms/laundry.md#laundry-through-route)이 이 단을 소비해 정하며, 그 동작이 단의 가장자리에서 충돌하지 않는지는 실제 단면이 없어 unverified다. 평면 연결만으로 동일 높이의 통로라고 기록하지 않는다.

이 항목의 source 책임은 포치의 `src/spaces/porch.ts`와 차고의 `src/spaces/garage.ts`이며 datum의 canonical 값은 `src/spaces/storeys.ts`가 제공한다. 외부 보행길과 차도는 대지 입력과 접촉해야 한다. 필요한 관찰은 정면 진입 단면과 차고/머드룸 문턱 단면 및 양방향 진입 시야이며 실제 통행·기구 간섭 결과는 unverified다.

차고의 상부 경계는 [차고 천장 폐합](09-ceiling-assembly.md#garage-ceiling-closure)이 이 천장 datum과 자기 지붕/벽 사이에서 정한다. 본채 층간 바닥이나 외부 포치 지붕을 차고 천장으로 대체하지 않는다.

[본채 1층 바탕](10-ground-floor.md#main-ground-floor-base)과 [차고 바탕](10-ground-floor.md#garage-ground-floor-base)은 각각의 완성 높이에서 아래로 예약한다. [건물 출입 단면](10-ground-floor.md#ground-threshold-junctions)이 벽 두께 안의 지지와 기존 머드룸 한 단을 배정하며, [지지 하단](10-ground-floor.md#ground-support-handoff)은 실제 지표 입력을 받은 뒤 정할 미완료다.
