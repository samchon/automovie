# 지붕군의 높이와 공유 접합

## 본채 위의 세 박공과 낮은 차고 {#roof-mass-allocation}
<!--
@evidence principles/core/common.md#scope-preservation 본채 주 지붕·오른쪽 낮은 지붕·왼쪽 전면 박공의 영역과 용마루 방향, 차고 지붕의 영역, 포치 지붕의 별도 owner를 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 본문 세 문단에서 주·오른쪽 지붕의 X 방향 용마루와 분할 범위, 전면 박공의 Z 방향 용마루, 차고의 X 방향 박공 영역, 포치 지붕의 porch-roof-columns 인계를 찾아 지붕군 대상마다 owner가 있음을 확인했다.
@evidence principles/core/common.md#substantive-completion 주/낮은 지붕 분할면 X = 1.60 m, 전면 박공 벽 기준 양 끝 X = [-5.75, -1.80] m, 본채·차고 용마루 Z를 각 전후 외벽의 중간으로 정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 X = 1.60 m 분할면, 박공 벽 기준 X = [-5.75, -1.80] m와 중심=양 끝 평균, 본채 용마루=전후 외벽 중간, 차고 용마루=차고 전후 외벽 평균이 값·산출 규칙으로 적혀 하위 면이 배치를 새로 정할 필요가 없음을 확인했다.
@evidence principles/core/common.md#declared-basis 박공 폭은 전면 거실/왼쪽 자녀실 위를 덮고 그 오른쪽 작은 계단 창을 별도 정면 구간에 두기 위한 선택이며 벽 좌표는 외곽 owner에서 받는다고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 박공 폭 X = [-5.75, -1.80] m가 전면 거실/왼쪽 자녀실을 덮고 작은 계단 창을 오른쪽 별도 정면 구간에 두려는 이 층의 선택으로 적혀 있고, 외벽 좌표는 00-building 두 외곽 링크로 추적됨을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 "정면 왼쪽의 전방을 향한 큰 박공"과 "본채의 좌우 방향 주 용마루"를 Z 방향 박공 용마루와 X 방향 주/낮은 용마루, 분할면 좌표로 배치한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 설정 main-mass는 전방 박공과 좌우 주 용마루의 존재만 정하므로, 본문이 더한 Z 방향 박공 용마루·X 방향 주/낮은 용마루와 X = 1.60 m 분할면이 부모에 없는 공간 층 결정임을 대조해 확인했다.
@evidence principles/design/spaces.md#space-topology 오른쪽 지붕은 본채 안에서 낮아지는 부분으로 독립 동·추가 층·바닥 돌출이 없고 차고는 자기 단층 외곽 위에서 공유 벽 바깥 면 X = 5.75 m에 접합한다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 첫 문단의 오른쪽 지붕 '독립 동·추가 층·바닥 돌출' 배제와 셋째 문단 X = 5.75 m 접합을 00-building 공유 벽 X = [5.50, 5.75] m에 대조해 오른쪽·차고 지붕의 포함·인접 관계가 성립함을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 벽 좌표는 00의 외곽에서 받고 포치 지붕은 porch-roof-columns에 남기며 차고 지붕판을 본채 내부로 밀어 넣지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 셋째 문단의 porch.md#porch-roof-columns 인계와 본채 내부 지붕판 금지, 첫 문단의 00-building 외곽 링크를 대조해 roof-mass-allocation이 벽 좌표·포치 지붕을 재저작하지 않음을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 이 배치를 외부에서 읽힐 매스의 저작 입력으로 두고 실제 실루엣 비교를 unverified로 남긴다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 셋째 문단 끝이 이 배치를 외부 매스의 저작 입력으로 한정하고 반증 관찰을 실제 실루엣 비교로 지정해 unverified로 남기므로, 배치 주장이 관찰 결과로 제시되지 않음을 확인했다.
@evidence settings/10-house.md#main-mass 왼쪽 전방 박공과 X 방향 주/낮은 용마루를 한 본채 위에 배정한다.
@evidenceReview settings/10-house.md#main-mass #edcb5ab 설정이 요구한 하나의 지붕군을 본문의 본채 왼쪽~X = 1.60 m 주 지붕, 분할면~오른쪽 끝 낮은 지붕, 그 앞 왼쪽 전면 박공 배정에 대조해 세 지붕이 한 본채 외곽 위에 놓임을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work main-mass의 "오른쪽 박공은 별도 독립 동이나 세 번째 층이 아니다"와 openings의 "계단/복도용의 더 작은 창"을 박공 폭에 대조했고 X = [-5.75, -1.80] m 박공이 계단 창을 비켜 둘 다 성립해 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 설정 main-mass의 오른쪽 박공 비독립 조건은 본문의 본채 내 낮은 지붕 배정에, openings의 작은 계단/복도 창은 X = [-5.75, -1.80] m 박공 오른쪽 별도 정면 구간에 대조해 둘 다 부모 수정 없이 성립함을 확인했다.
-->

[본채](../00-building.md#main-building-extent)와 [차고](../00-building.md#attached-garage-extent) 외곽, [두 층 천장](../01-storeys.md#storey-datums)을 유지하며 [설정의 지붕군](../../settings/10-house.md#main-mass)을 배치한다. 본채 주 지붕과 오른쪽 낮은 지붕의 용마루는 X 방향이고, 왼쪽 전면 박공의 용마루는 Z 방향이다. 오른쪽 지붕은 본채 안에서 낮아지는 부분이며 독립 동·추가 층·바닥 돌출을 만들지 않는다. 차고는 자신의 단층 외곽 위에 더 낮은 X 방향 박공 지붕을 갖는다.

주 지붕과 오른쪽 지붕을 가르는 평면은 X = 1.60 m다. 두 지붕의 공통 용마루 평면 Z는 본채 전후 외벽의 중간에서 산출한다. 주 지붕은 본채 왼쪽부터 이 분할면까지, 낮은 지붕은 분할면부터 본채 오른쪽까지 담당한다. 전면 박공의 벽 기준 양 끝은 X = [-5.75, -1.80] m, 전면 벽은 본채의 Z = 0 m다. 중심은 양 끝의 평균이다. 이 폭은 전면 거실/왼쪽 자녀실 위를 덮고 그 오른쪽 [계단/복도용의 더 작은 창](../../settings/10-house.md#openings)인 [작은 계단 창](../02-stair.md#stair-floor-opening)을 별도 정면 구간에 두기 위한 선택이다.

차고 용마루의 Z는 [차고 전후 외벽](../00-building.md#attached-garage-extent)의 평균이다. 본채와 닿는 서쪽에서는 지붕을 공유 벽 바깥 면 X = 5.75 m에 접합하고 본채 내부로 지붕판을 밀어 넣지 않는다. 전면 포치는 [자기 지붕/기둥 owner](../porch.md#porch-roof-columns)가 담당한다. 이 배치는 외부에서 읽힐 매스의 저작 입력이며 실제 실루엣 비교는 unverified다.

## 날씨를 받는 면과 아래면 {#roof-profile-datums}
<!--
@evidence principles/core/common.md#scope-preservation 각 지붕의 날씨 면 높이 함수, 외벽선 높이·자유 돌출·수직 아래면 두께 표, 유한 후보 영역, 천장 대조로의 인계를 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 본문이 Mfront·Mback·Rfront·Rback·Gfront·Gback·F 식, 외벽선 높이·돌출·0.24 m 예약 표, 주/오른쪽·박공·차고 후보 영역, ceiling-roof-clearance 인계를 모두 담아 날씨 면 datum의 누락이 없음을 확인했다.
@evidence principles/core/common.md#substantive-completion 기울기 8/12·9/12·7/12·5/12, 외벽선 높이 6.30·5.95·2.95 m, 아래면 수직 0.24 m와 Mfront·Mback·F·Gfront·Gback 식을 정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 표의 6.30·5.95·2.95 m와 0.24 m, Mback의 Z + 10.70·Gfront의 Z + 0.30·Gback의 Z + 6.70 벽 대입까지 확정되어 각 지붕 면이 경사·높이를 새로 정하지 않고 식을 소비만 하면 됨을 확인했다.
@evidence principles/core/common.md#declared-basis 본채 세 경사는 설정의 30–38° 범위 안, 차고 5/12는 낮은 부속 지붕의 선택이며 식의 벽 좌표는 외곽 owner 값을 대입한 표기라고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb atan(8/12)·atan(9/12)·atan(7/12)는 설정 30–38° 안의 저작 선택, 5/12는 garage 낮은 부속 지붕의 선택, 식의 벽 좌표는 외곽 owner 대입 표기로 각각 근거 종류가 구별되어 적혀 있음을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 경사·처마 범위를 8/12·9/12·7/12 기울기와 0.40 m 자유 돌출로 고정하고 외벽선 높이·0.24 m 수직 예약을 더하며 F를 X = [a - e, b + e], Z = [본채 용마루 Z, 본채 전면 Z + e] 유한 영역에서만 쓰게 한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 설정이 경사 30–38°·처마 0.35–0.50 m 범위만 준 데 대해 본문이 세 기울기와 0.40 m 돌출을 고정하고 외벽선 높이, 0.24 m 수직 예약, F의 X = [a - e, b + e] 유한 영역을 더한 점을 대조했다.
@evidence principles/design/spaces.md#space-topology F를 본채 뒤 지붕까지 연장하지 않고 X 분할면에는 돌출을 더하지 않으며 차고 영역은 서쪽 공유 벽 바깥 면에서 끝낸다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 영역 문단의 박공 후보 Z = [본채 용마루 Z, 본채 전면 Z + e] 한정, X 분할면 무돌출, 차고 서쪽 공유 벽 바깥 면 종료를 대조해 각 지붕 영역의 인접 경계가 식 적용 범위로 닫힘을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 천장 owner는 이 아래면 함수를 소비해 대조하고 별도 경사나 처마 높이를 발명하지 않으며 외곽이 바뀌면 외곽 owner에서 식을 다시 산출한다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 천장 문단의 '별도 경사나 처마 높이를 발명하지 않는다'와 식 문단의 '외곽이 바뀌면 그 owner에서 다시 산출' 조항을 대조해 지붕 아래면은 이 H2, 벽 좌표는 외곽 owner에만 저작됨을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 가장 낮은 본채 외벽선 아래면이 2층 천장 위 0.05 m라는 산술을 headroom 결과로 쓰지 않고 실제 실내 윤곽에서 대조하게 한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 5.95 - 0.24 m 아래면이 2층 천장 위 0.05 m를 남긴다는 값이 산술로만 표기되고, 반증 관찰을 ceiling-roof-clearance의 실제 실내 윤곽 대조로 넘기며 headroom·구조를 unverified로 둠을 확인했다.
@evidence settings/10-house.md#main-mass 본채 8/12·9/12·7/12 경사와 0.40 m 처마로 설정 범위를 구체화한다.
@evidenceReview settings/10-house.md#main-mass #edcb5ab 설정 main-mass의 30–38°·0.35–0.50 m를 표에 대조해 가장 완만한 atan(7/12)도 30° 이상이고 0.40 m 자유 돌출도 처마 범위 안이어서 본채 세 지붕이 설정을 구체값으로 이행함을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work main-mass의 경사 30–38°·처마 0.35–0.50 m·2층 순높이 2.50–2.65 m를 높이 함수에 대조했고 atan(9/12)까지 범위 안이며 외벽선 아래면이 2층 천장 위에 남아 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 설정 main-mass의 상한 38°와 2층 순높이 범위를 가장 급한 atan(9/12)와 2층 천장 위에 남는 5.95 - 0.24 m 아래면에 대조해 높이 함수가 부모 범위를 넘지 않아 설정 수정이 필요 없음을 확인했다.
-->

여기서 높이 함수는 지붕 최상부 날씨 면의 Y를 뜻한다. 수평으로 12만큼 갈 때 오르는 높이를 기울기로 사용한다. 본채 주 지붕은 8/12, 전면 박공은 9/12, 오른쪽 낮은 지붕은 7/12로 택한다. 각도는 각각 `atan(8/12)`, `atan(9/12)`, `atan(7/12)`이며 설정의 30–38° 범위 안인 저작 선택이다. 차고의 5/12는 [낮은 부속 지붕](../../settings/10-house.md#garage)의 선택으로, 본채 경사 범위와 섞지 않는다. 최종 각도와 높이는 소스 산출물에서 다시 읽는다.

| 지붕 | 외벽선에서 날씨 면 Y, m | 자유 외곽 돌출, m | 아래면의 수직 예약 두께, m |
| --- | --- | --- | --- |
| 주 지붕 | 6.30 | 0.40 | 0.24 |
| 전면 박공 | 주 지붕의 외벽선 높이를 소비 | 0.40의 외곽 영역에서 교차선으로 절단 | 0.24 |
| 본채 오른쪽 낮은 지붕 | 5.95 | 0.40 | 0.24 |
| 차고 | 2.95 | 0.35, 본채 접합에는 돌출 없음 | 0.24 |

본채 주 지붕의 앞 면은 `Mfront(Z) = 6.30 - (8/12) × Z`, 뒤 면은 `Mback(Z) = 6.30 + (8/12) × (Z + 10.70)`다. 낮은 지붕은 같은 전후 벽/용마루 위치에서 높이 5.95와 기울기 7/12를 대입한 `Rfront`, `Rback`을 쓴다. 차고 앞 면은 `Gfront(Z) = 2.95 - (5/12) × (Z + 0.30)`, 뒤 면은 `Gback(Z) = 2.95 + (5/12) × (Z + 6.70)`다. 각 지붕은 앞뒤 높이가 같은 공통 용마루에서 나뉜다. 식의 벽 좌표는 독립 입력이 아니라 [본채](../00-building.md#main-building-extent)/[차고](../00-building.md#attached-garage-extent) 외곽 owner의 값을 대입한 표기이며 외곽이 바뀌면 그 owner에서 다시 산출한다.

전면 박공은 자기 벽 기준 구간의 왼쪽 끝을 `a`, 오른쪽 끝을 `b`라 할 때 `F(X) = 6.30 + (9/12) × min(X - a, b - X)`다. 박공 중심에서 양쪽 면이 만나고 앞쪽 처마 영역에서는 같은 식을 연장한다. 경사면 아래면은 해당 날씨 면에서 Y 방향으로 0.24 m 내린 평면이다. 이 값은 수직 예약 두께이며 지붕에 수직한 재료 두께와 혼동하지 않는다. 구조·보드·지붕재의 실제 적층은 후속 외피/모듈 단계가 예약 안에서 구현한다.

주/오른쪽 지붕의 평면은 [배정 영역](#roof-mass-allocation)에 자유 외곽 돌출만 적용하고 X 분할면에는 돌출을 더하지 않는다. 두 지붕의 Z 영역은 본채 후벽에서 뒤 돌출까지, 전면 벽에서 앞 돌출까지이며 공통 용마루에서 앞/뒤로 나눈다. 전면 박공의 후보 영역은 X = [a - e, b + e], Z = [본채 용마루 Z, 본채 전면 Z + e]이고 e는 표의 전면 박공 돌출값이다. 이 유한 영역에서만 아래 교차식을 적용하므로 F를 본채 뒤 지붕까지 연장하지 않는다. 차고도 자신의 전후 벽과 자유 돌출로 영역을 정하며 서쪽은 공유 벽 바깥 면에서 끝낸다.

가장 낮은 본채 외벽선의 아래면 입력은 5.95 - 0.24 m이므로 [2층 천장](../01-storeys.md#storey-datums) 위에 0.05 m를 남긴다. 차고 외벽선의 아래면도 [차고 천장](../01-storeys.md#ground-threshold-datums)보다 위에 예약한다. 바깥으로 내민 처마 아래면은 더 낮아질 수 있지만 실내 천장 안으로 침범하지 않는다. 이는 식의 산술이며 실제 부재 headroom·구조 안전·시공 검증은 unverified다.

[천장 바탕의 위쪽 점유](../09-ceiling-assembly.md#ceiling-roof-clearance)는 외벽 바깥 선이 아닌 실제 실내 윤곽 위의 이 아래면과 대조한다. 앞 문단의 0.05 m는 완성 천장과 외벽선 사이 산술이며 천장 바탕 두께까지 수용했다고 주장하는 값이 아니다. 천장 owner가 본채/차고의 같은 지붕 함수를 소비하고 별도 경사나 처마 높이를 발명하지 않는다.

## 전면 박공의 골짜기와 단차 {#roof-shared-edges}
<!--
@evidence principles/core/common.md#scope-preservation 전면 박공과 주 지붕 앞 면의 두 골짜기와 우세 영역, 박공 용마루 끝, X = 1.60 m 단차, 굴뚝 절단, 공유 선분의 계산 owner를 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 첫 문단의 등고 경계·박공 용마루 끝, 둘째의 junctions.ts 공유 선분, 셋째의 X = 1.60 m 단차, 넷째의 굴뚝 절단을 문단별로 대조해 roof-shared-edges가 약속한 합류 계산마다 owner가 있음을 확인했다.
@evidence principles/core/common.md#substantive-completion `F(X) > Mfront(Z)`인 부분만 박공 경사면으로 드러나게 하고 `Z = -(9/8) × min(X - a, b - X)`를 두 골짜기의 동일 경계로 정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 F(X) = Mfront(Z)를 풀면 Z = -(9/8) × min(X - a, b - X)가 됨을 산술로 대조했고, 본문이 이 등고선과 F(X) > Mfront(Z) 노출 조건을 확정해 하위 면이 골짜기 윤곽을 새로 정할 필요가 없음을 확인했다.
@evidence principles/core/common.md#declared-basis 골짜기는 같은 두 높이 함수의 등고 비교에서 도출하고 각 면이 따로 반올림하지 않도록 junctions.ts의 같은 선분/꼭짓점을 소비한다고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 골짜기 근거가 F와 Mfront 두 식의 등고 비교라는 파생으로 적히고, 면별 윤곽의 근거가 각 면 반올림이 아닌 junctions.ts의 같은 선분/꼭짓점으로 지정되어 출처가 추적됨을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 "골짜기와 합류부에 빈틈이나 중첩 지붕판을 남기지 않는다"를 등고 경계로 나눈 우세 영역과 박공 용마루가 등고 경계 중심점에서 끝나는 규칙으로 만든다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 설정 main-mass의 무틈·무중첩 요구가 합류 방법을 정하지 않는 데 대해 본문이 등고 경계 우세 영역 분할과 박공 용마루를 전면 돌출 끝~등고 경계 중심점으로 끊는 규칙을 더함을 대조했다.
@evidence principles/design/spaces.md#space-topology X = 1.60 m 단차는 오른쪽 입면 owner의 단차 벽으로 닫고 옥상 통로나 세 번째 실로 쓰지 않으며 주 지붕을 낮은 면 위로 중복 돌출시키지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 X = 1.60 m 문단이 두 높이를 한 경사면에 잇지 않고 right-roof-closures 단차 벽으로 닫으며 옥상 통로·세 번째 실과 주 지붕의 중복 돌출을 배제해 단차의 인접 관계가 명시됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 주/박공 용마루·두 골짜기·처마·사선·단차·차고 벽 접합을 서로 다른 경계 역할로 보존하고 단차 벽은 right, 굴뚝 절단은 left의 굴뚝 접면에서 받는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 단차 벽은 right.md#right-roof-closures, 굴뚝 절단은 left.md#chimney-roof-interface 링크로만 받고 본문이 그 높이·윤곽을 적지 않으며 용마루·골짜기·처마·사선·단차·차고 접합 역할을 구별함을 대조했다.
@evidence principles/design/spaces.md#space-verification-address 엔진 실행·경계 census·법선/UV·빈틈/중첩과 01 프레임 대조를 unverified로 두고 불투명 정점 배열 복사 없이 식에서 면 윤곽을 생성하게 한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 마지막 문단이 식에서 결정적으로 면 윤곽을 만들고 불투명 정점 배열을 배제한 뒤 경계 census·법선/UV·빈틈/중첩·01 프레임 대조를 반증 관찰로 지정하고 unverified로 둠을 확인했다.
@evidence settings/10-house.md#main-mass 골짜기에서 빈틈이나 중첩 판을 남기지 않도록 우세 영역만 소유한다.
@evidenceReview settings/10-house.md#main-mass #edcb5ab 설정의 '골짜기와 합류부에 빈틈이나 중첩 지붕판을 남기지 않는다'를 본문의 '같은 위치에 두 지붕판을 겹쳐 놓는 방법을 쓰지 않는다'와 박공 용마루 뒤 묻힌 판 제거에 대조해 이행을 확인했다.
@evidence settings/00-production.md#build-allocation 일반 Boolean이나 메쉬 병합 성능을 전제하지 않고 명시적 면 구성이 공개 엔진 경로에서 표현되지 않으면 한계를 기록해 조정자에게 이관하도록 정한다.
@evidenceReview settings/00-production.md#build-allocation #eda898f 설정 build-allocation의 '필요한 기능이 없으면 실제 제한을 기록해 조정자에게 올린다'를 본문의 Boolean·메쉬 병합 비전제와 명시적 면 구성 한계 이관 문장에 대조해 일치함을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work main-mass의 "골짜기와 합류부에 빈틈이나 중첩 지붕판을 남기지 않는다"와 박공 9/12·주 지붕 8/12 기울기를 합류 경계에 대조했고 등고 경계 하나로 성립해 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 설정 main-mass의 합류부 무틈 조건을 박공 9/12와 주 지붕 8/12가 만나는 등고 경계 하나에 대조했고 두 기울기 모두 부모 경사 범위 안에서 한 경계로 닫혀 설정 수정이 필요 없음을 확인했다.
-->

[전면 박공](#roof-mass-allocation)은 주 지붕 앞쪽에 합류한다. 해당 외곽 영역에서 `F(X) > Mfront(Z)`인 부분만 박공 경사면이 드러나고, 나머지는 주 지붕 앞 면이다. 같은 위치에 두 지붕판을 겹쳐 놓는 방법을 쓰지 않는다. 높이가 같은 `Z = -(9/8) × min(X - a, b - X)`가 두 골짜기의 동일 경계다. 박공 용마루는 전면 돌출 끝에서 이 등고 경계의 중심점까지이고 그 뒤는 주 지붕에 묻힌 불필요한 판을 남기지 않는다.

등호를 각 면에서 따로 반올림하지 않고 `src/spaces/roof/junctions.ts`의 같은 선분/꼭짓점을 소비한다. 주 용마루, 전면 박공 용마루, 두 골짜기, 자유 처마와 박공 사선 모서리, 본채 오른쪽 단차, 차고의 벽 접합을 서로 다른 경계 역할로 보존한다. 골짜기 배수 끝을 막는 수평 트림이나 박공 삼각 벽을 가로지르는 가짜 처마를 만들지 않는다.

X = 1.60 m에서는 주 지붕과 낮은 지붕의 높이가 다르므로 억지로 같은 경사면에 잇지 않는다. [오른쪽 입면 owner](../envelope/right.md#right-roof-closures)가 단차 벽을 소유한다. 이는 본채 외곽 안의 접합으로, 자유 처마처럼 주 지붕을 낮은 면 위에 중복 돌출시키지 않는다. 단차에서 주 지붕 아래면까지 닫히는 벽과 낮은 지붕의 벽 접합 후레싱을 구별한다. 옥상 통로나 세 번째 실은 없다.

굴뚝이 닿는 주 지붕 앞 면은 [굴뚝 접면](../envelope/left.md#chimney-roof-interface)을 따라 잘라낸다. 소스는 위 식과 경계에서 결정적으로 면 윤곽을 생성하며 불투명 정점 배열을 복사하지 않는다. 일반 Boolean 연산의 존재나 메쉬 병합의 결합 성능을 전제하지 않는다. 이 경계의 명시적 면 구성이 공개 엔진 경로에서 표현되지 않으면 그 한계를 기록하고 조정자에게 이관한다. 현재 엔진 실행·경계 census·법선/UV·빈틈/중첩·01과의 프레임 대조는 unverified다.

## 지붕에 닿는 외벽 두께 전체의 상단 {#roof-wall-head-junctions}
<!--
@evidence principles/core/common.md#scope-preservation 본채·차고 외벽 두께 전체의 상단, 전면 박공 교차선과 높은/낮은 지붕 분할이 벽 두께를 지나는 구역, 굴뚝과 낮은 부속 지붕의 예외를 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 첫 문단이 굴뚝과 아래쪽 차고/포치 지붕 예외를, 둘째가 두께 전체 상단을, 셋째가 교차선·높은/낮은 분할 구역을 다루는지 문단별로 대조해 roof-wall-head-junctions 약속에 빈 항목이 없음을 확인했다.
@evidence principles/core/common.md#substantive-completion 각 외벽의 안팎 윗선과 그 사이 상단이 해당 X/Z에 배정된 지붕 아래면 함수를 따르게 하고 외측 높이의 평평한 압출이나 내측 높이로의 관통을 금한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 둘째 문단이 안팎 윗선과 사이 상단을 해당 X/Z의 아래면 함수로 정하고 외측 높이 평면 압출과 내측 높이 관통을 모두 금해 벽 상단 형상이 하위 발명 없이 결정됨을 확인했다.
@evidence principles/core/common.md#declared-basis 내측과 외측의 높이 차 약 0.1667/0.1458/0.1042 m는 기울기와 외벽 두께의 곱이라는 설계식 산술이며 벽이나 틈의 측정값이 아니라고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb (8/12)·(7/12)·(5/12) × 외벽 두께에 00-building의 0.25 m를 대입하면 0.1667/0.1458/0.1042 m가 됨을 대조했고, 본문이 이를 측정이 아닌 설계식 산술로 밝힘을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 본채·차고 외곽의 벽 두께와 roof-profile-datums의 아래면 함수에 벽 두께 전체의 상단 접촉과 roof-shared-edges 교차선·높은/낮은 지붕 분할면에서 두께 구역을 나누는 규칙을 더한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 외곽 owner는 벽 두께만, roof-profile-datums는 아래면만 정함을 확인하고, 본문의 두께 전체 상단 접촉과 교차선·분할면 두께 구역 규칙이 두 부모 어디에도 없는 이 H2의 결정임을 대조했다.
@evidence principles/design/spaces.md#space-topology 아래쪽 차고/포치 지붕이 본채 벽 옆에 붙는 선을 본채 벽 상단으로 쓰지 않고 지붕을 뚫는 굴뚝을 이 상단에서 자르지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 첫 문단의 '아래쪽 차고/포치 지붕이 본채 벽 옆에 붙는 선은 본채 벽의 상단이 아니다'와 굴뚝 비절단 문장을 대조해 벽 상단과 인접 낮은 지붕·굴뚝의 관계가 구별됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority junctions.ts는 상단 경계를 계산해 넘기고 몸체는 07의 모서리/단차 배정에 따라 각 입면/공유 벽 owner가 같은 상단에서 끝낸다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 junctions.ts가 벽 몸체 없이 상단 계산만 넘기고 몸체는 07-boundary-assembly 배정대로 각 입면/공유 벽 owner가 끝내며 장식 쐐기를 중복 생성하지 않는다는 문단을 대조해 이중 저작이 없음을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 모든 앞뒤 외벽의 외측/중간/내측 단면, 외벽 모서리, 박공 교차선이 벽 두께를 지나는 부분, 단차의 앞뒤 끝, 차고 공유 벽에서 벽 상단과 아래면을 비교하게 한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 검사 문단의 외측/중간/내측 단면, 모든 외벽 모서리, 교차선 통과부, 단차 앞뒤 끝, 차고 공유 벽을 storey-datums 공유 허용 오차로 대조하게 해 벽 상단 주장마다 반증 주소가 있음을 확인했다.
@evidence settings/10-house.md#main-mass 실제 삼각 벽과 지붕 아래면이 벽 두께 전체에서 만나는 경계를 설계한다.
@evidenceReview settings/10-house.md#main-mass #edcb5ab 설정의 '실제 삼각 벽과 양쪽 경사 지붕'으로 박공을 닫는 요구를 본문의 박공 벽 용마루 꺾임 유지와 아래면·벽 상단 단일 접촉 경계(장식 쐐기 금지)에 대조해 이행을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work main-mass의 "각 박공은 실제 삼각 벽과 양쪽 경사 지붕, 처마 밑면으로 닫혀야 한다"를 벽 두께 방향에 대조했고 본채 높이와 경사를 유지한 채 위치별 아래면으로 닫혀 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 설정 main-mass의 박공 폐합 요구를 벽 두께 방향에 적용해도 본문이 '지붕 경사나 천장 datum을 추가하거나 바꾸지 않는다'며 위치별 아래면만 소비하므로 부모 높이·경사 수정이 필요 없음을 확인했다.
-->

본채와 차고의 외벽은 각각 [본채](../00-building.md#main-building-extent)와 [차고](../00-building.md#attached-garage-extent)의 기존 외곽과 안쪽 면 사이를 점유하고 자기 지붕 아래에서 닫힌다. 거주 공간의 위쪽 경계는 [수평 천장](../09-ceiling-assembly.md#upper-ceiling-closure)으로 유지한다. 이 접합은 벽 상단의 경계이며 방·층·통행·지붕 경사나 천장 datum을 추가하거나 바꾸지 않는다. 아래쪽 차고/포치 지붕이 본채 벽 옆에 붙는 선은 본채 벽의 상단이 아니다. 지붕을 뚫고 올라가는 [굴뚝](../envelope/left.md#chimney-roof-interface)은 자기 상부 높이와 지붕 절단을 유지하며 이 상단에서 잘라 버리지 않는다.

각 외벽의 안팎 윗선과 그 사이 상단은 해당 X/Z에 실제로 배정된 [지붕 아래면 함수](#roof-profile-datums)를 소비한다. 외측 벽선의 높이를 두께 방향으로 그대로 압출하거나, 반대로 내측 높이까지 외측 벽을 높여 지붕판을 관통시키지 않는다. 앞뒤 벽 두께 전체에 하나의 경사면이 배정된 구간에서 내측은 외측보다 주 지붕이면 `(8/12) × 외벽 두께`, 낮은 지붕이면 `(7/12) × 외벽 두께`, 차고 지붕이면 `(5/12) × 외벽 두께`만큼 높다. 현재 두께를 대입한 차이는 각각 약 0.1667/0.1458/0.1042 m다. 이 값은 설계식의 산술이며 실제 벽이나 틈의 측정값이 아니다.

전면 박공과 주 지붕이 만나는 벽 두께 구역은 [유한 배정 영역과 같은 교차선](#roof-shared-edges)에서 나누어 각 부분의 아래면을 받는다. 박공 정면의 F를 벽 두께 전체에 무조건 적용하지 않고, 배정 영역 밖의 경사식을 연장하여 벽 상단으로 채택하지 않는다. 본채 앞뒤 벽이 높은 지붕/낮은 지붕 분할면을 지나는 곳도 같은 분할에서 높이가 달라진다. 왼쪽·오른쪽 박공 벽의 용마루 꺾임과 차고의 별도 지붕은 각각의 실제 배정을 유지한다. 지붕 함수가 없는 구간을 임의 높이로 닫지 않는다.

`src/spaces/roof/junctions.ts`는 이 상단 경계의 계산을 전달하고 벽 몸체를 만들지 않는다. 각 입면/공유 벽 owner가 [모서리와 단차 접합 배정](../07-boundary-assembly.md#exterior-boundary-junctions)에 따라 자기 몸체를 같은 상단에서 끝낸다. 지붕 아래면·벽 상단은 한 접촉 경계이고 그 사이를 덮는 별도 장식 쐐기를 중복 생성하지 않는다. 실제 구조 받침·재료 적층·후레싱은 이 예약을 소비할 후속 부재의 책임이다.

검사는 모든 앞뒤 외벽의 외측/중간/내측 단면, 본채/차고의 모든 외벽 모서리, 전면 박공 교차선이 벽 두께를 지나는 부분, 높은 지붕 단차의 앞뒤 끝과 차고 공유 벽이다. 같은 산출물의 벽 상단과 배정된 지붕 아래면을 [공유 허용 오차](../01-storeys.md#storey-datums)로 대조하고, [전체 관찰](../04-observations.md#spatial-observation-derivation)에 처마 아래와 실내 천장 가장자리 시야를 더한다. 실제 접촉·틈/관통·지지·표면 census·GPU 프레임은 unverified다.
