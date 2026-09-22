# 지붕군의 높이와 공유 접합

## 본채 위의 세 박공과 낮은 차고 {#roof-mass-allocation}
<!--
@evidence principles/core/common.md#scope-preservation 본채 세 박공과 낮은 차고·별도 포치의 영역을 나눈다.
@evidence principles/core/common.md#substantive-completion X = 1.60 m 분할과 전면 박공 양 끝을 선택한다.
@evidence principles/core/common.md#declared-basis 본채/차고 외곽 평균에서 각각 용마루 Z를 얻는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 지붕 위계를 실제 분할면과 서로 직각인 용마루로 배치한다.
@evidence principles/design/spaces.md#space-topology 낮은 오른쪽 부분은 같은 본채이며 추가 동·층이 아니다.
@evidence principles/design/spaces.md#space-boundary-authority 포치 지붕은 porch owner에 남기고 차고는 공유 벽 밖에서 끝낸다.
@evidence principles/design/spaces.md#space-verification-address 같은 외곽 위 매스의 실루엣 비교를 미검증으로 명시한다.
@evidence settings/10-house.md#main-mass 왼쪽 전방 박공과 X 방향 주/낮은 용마루를 한 본채 위에 배정한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 큰 전면 박공·낮은 오른쪽 지붕을 계단 창 옆에 배치할 수 있어 부모 지붕 위계를 바꾸지 않았다.
-->

[본채와 차고 외곽](../00-building.md#main-building-extent), [두 층 천장](../01-storeys.md#storey-datums)을 유지하며 [설정의 지붕군](../../settings/10-house.md#main-mass)을 배치한다. 본채 주 지붕과 오른쪽 낮은 지붕의 용마루는 X 방향이고, 왼쪽 전면 박공의 용마루는 Z 방향이다. 오른쪽 지붕은 본채 안에서 낮아지는 부분이며 독립 동·추가 층·바닥 돌출을 만들지 않는다. 차고는 자신의 단층 외곽 위에 더 낮은 X 방향 박공 지붕을 갖는다.

주 지붕과 오른쪽 지붕을 가르는 평면은 X = 1.60 m다. 두 지붕의 공통 용마루 평면 Z는 본채 전후 외벽의 중간에서 산출한다. 주 지붕은 본채 왼쪽부터 이 분할면까지, 낮은 지붕은 분할면부터 본채 오른쪽까지 담당한다. 전면 박공의 벽 기준 양 끝은 X = [-5.75, -1.80] m, 전면 벽은 본채의 Z = 0 m다. 중심은 양 끝의 평균이다. 이 폭은 전면 거실/왼쪽 자녀실 위를 덮고 그 오른쪽 [작은 계단 창](../02-stair.md#stair-floor-opening)을 별도 정면 구간에 두기 위한 선택이다.

차고 용마루의 Z는 [차고 전후 외벽](../00-building.md#attached-garage-extent)의 평균이다. 본채와 닿는 서쪽에서는 지붕을 공유 벽 바깥 면 X = 5.75 m에 접합하고 본채 내부로 지붕판을 밀어 넣지 않는다. 전면 포치는 [자기 지붕/기둥 owner](../porch.md#porch-roof-columns)가 담당한다. 이 배치는 외부에서 읽힐 매스의 저작 입력이며 실제 실루엣 비교는 unverified다.

## 날씨를 받는 면과 아래면 {#roof-profile-datums}
<!--
@evidence principles/core/common.md#scope-preservation 날씨 면·수직 아래면·자유 돌출의 높이 입력을 함께 정한다.
@evidence principles/core/common.md#substantive-completion M/F/R/G 함수와 유한 후보 영역을 선언한다.
@evidence principles/core/common.md#declared-basis 본채 경사는 설정 범위, 차고 경사는 낮은 부속 지붕의 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 지붕 형태를 실제 경사·외벽선 높이·0.24 m 수직 예약으로 만든다.
@evidence principles/design/spaces.md#space-topology F를 뒤 지붕까지 연장하거나 차고 판을 본채에 넣지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 식의 벽 좌표는 외곽에서 재산출하며 별도 입력이 아니다.
@evidence principles/design/spaces.md#space-verification-address 천장 바탕 비교를 실내 윤곽에서 하고 산술을 headroom 결과로 쓰지 않는다.
@evidence settings/10-house.md#main-mass 본채 8/12·9/12·7/12 경사와 0.40 m 처마로 설정 범위를 구체화한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 경사/처마 범위와 두 층 천장을 대조해 높이 함수를 정할 수 있었고 부모의 순높이를 낮출 이유가 없었다.
-->

여기서 높이 함수는 지붕 최상부 날씨 면의 Y를 뜻한다. 수평으로 12만큼 갈 때 오르는 높이를 기울기로 사용한다. 본채 주 지붕은 8/12, 전면 박공은 9/12, 오른쪽 낮은 지붕은 7/12로 택한다. 각도는 각각 `atan(8/12)`, `atan(9/12)`, `atan(7/12)`이며 설정의 30–38° 범위 안인 저작 선택이다. 차고의 5/12는 [낮은 부속 지붕](../../settings/10-house.md#garage)의 선택으로, 본채 경사 범위와 섞지 않는다. 최종 각도와 높이는 소스 산출물에서 다시 읽는다.

| 지붕 | 외벽선에서 날씨 면 Y, m | 자유 외곽 돌출, m | 아래면의 수직 예약 두께, m |
| --- | --- | --- | --- |
| 주 지붕 | 6.30 | 0.40 | 0.24 |
| 전면 박공 | 주 지붕의 외벽선 높이를 소비 | 0.40의 외곽 영역에서 교차선으로 절단 | 0.24 |
| 본채 오른쪽 낮은 지붕 | 5.95 | 0.40 | 0.24 |
| 차고 | 2.95 | 0.35, 본채 접합에는 돌출 없음 | 0.24 |

본채 주 지붕의 앞 면은 `Mfront(Z) = 6.30 - (8/12) × Z`, 뒤 면은 `Mback(Z) = 6.30 + (8/12) × (Z + 10.70)`다. 낮은 지붕은 같은 전후 벽/용마루 위치에서 높이 5.95와 기울기 7/12를 대입한 `Rfront`, `Rback`을 쓴다. 차고 앞 면은 `Gfront(Z) = 2.95 - (5/12) × (Z + 0.30)`, 뒤 면은 `Gback(Z) = 2.95 + (5/12) × (Z + 6.70)`다. 각 지붕은 앞뒤 높이가 같은 공통 용마루에서 나뉜다. 식의 벽 좌표는 독립 입력이 아니라 [외곽 owner](../00-building.md#attached-garage-extent)의 값을 대입한 표기이며 외곽이 바뀌면 그 owner에서 다시 산출한다.

전면 박공은 자기 벽 기준 구간의 왼쪽 끝을 `a`, 오른쪽 끝을 `b`라 할 때 `F(X) = 6.30 + (9/12) × min(X - a, b - X)`다. 박공 중심에서 양쪽 면이 만나고 앞쪽 처마 영역에서는 같은 식을 연장한다. 경사면 아래면은 해당 날씨 면에서 Y 방향으로 0.24 m 내린 평면이다. 이 값은 수직 예약 두께이며 지붕에 수직한 재료 두께와 혼동하지 않는다. 구조·보드·지붕재의 실제 적층은 후속 외피/모듈 단계가 예약 안에서 구현한다.

주/오른쪽 지붕의 평면은 [배정 영역](#roof-mass-allocation)에 자유 외곽 돌출만 적용하고 X 분할면에는 돌출을 더하지 않는다. 두 지붕의 Z 영역은 본채 후벽에서 뒤 돌출까지, 전면 벽에서 앞 돌출까지이며 공통 용마루에서 앞/뒤로 나눈다. 전면 박공의 후보 영역은 X = [a - e, b + e], Z = [본채 용마루 Z, 본채 전면 Z + e]이고 e는 표의 전면 박공 돌출값이다. 이 유한 영역에서만 아래 교차식을 적용하므로 F를 본채 뒤 지붕까지 연장하지 않는다. 차고도 자신의 전후 벽과 자유 돌출로 영역을 정하며 서쪽은 공유 벽 바깥 면에서 끝낸다.

가장 낮은 본채 외벽선의 아래면 입력은 5.95 - 0.24 m이므로 [2층 천장](../01-storeys.md#storey-datums) 위에 0.05 m를 남긴다. 차고 외벽선의 아래면도 [차고 천장](../01-storeys.md#ground-threshold-datums)보다 위에 예약한다. 바깥으로 내민 처마 아래면은 더 낮아질 수 있지만 실내 천장 안으로 침범하지 않는다. 이는 식의 산술이며 실제 부재 headroom·구조 안전·시공 검증은 unverified다.

[천장 바탕의 위쪽 점유](../09-ceiling-assembly.md#ceiling-roof-clearance)는 외벽 바깥 선이 아닌 실제 실내 윤곽 위의 이 아래면과 대조한다. 앞 문단의 0.05 m는 완성 천장과 외벽선 사이 산술이며 천장 바탕 두께까지 수용했다고 주장하는 값이 아니다. 천장 owner가 본채/차고의 같은 지붕 함수를 소비하고 별도 경사나 처마 높이를 발명하지 않는다.

## 전면 박공의 골짜기와 단차 {#roof-shared-edges}
<!--
@evidence principles/core/common.md#scope-preservation 골짜기·용마루·단차·굴뚝 절단의 경계 역할을 구분한다.
@evidence principles/core/common.md#substantive-completion F와 Mfront의 등고선으로 노출 영역을 분할한다.
@evidence principles/core/common.md#declared-basis 같은 높이 함수의 비교로 골짜기를 도출한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 지붕군 요구를 두 판의 중복 없는 합류 윤곽으로 구체화한다.
@evidence principles/design/spaces.md#space-topology 단차를 통로나 세 번째 실로 연결하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority junctions.ts의 같은 꼭짓점을 양 면이 소비한다.
@evidence principles/design/spaces.md#space-verification-address 골짜기 틈·중첩과 굴뚝 절단·01 프레임을 검사한다.
@evidence settings/10-house.md#main-mass 골짜기에서 빈틈이나 중첩 판을 남기지 않도록 우세 영역만 소유한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 박공 합류 요구에 등고 경계를 적용할 수 있어 지붕 위계나 본채 외곽의 부모 수정은 필요하지 않았다.
-->

[전면 박공](#roof-mass-allocation)은 주 지붕 앞쪽에 합류한다. 해당 외곽 영역에서 `F(X) > Mfront(Z)`인 부분만 박공 경사면이 드러나고, 나머지는 주 지붕 앞 면이다. 같은 위치에 두 지붕판을 겹쳐 놓는 방법을 쓰지 않는다. 높이가 같은 `Z = -(9/8) × min(X - a, b - X)`가 두 골짜기의 동일 경계다. 박공 용마루는 전면 돌출 끝에서 이 등고 경계의 중심점까지이고 그 뒤는 주 지붕에 묻힌 불필요한 판을 남기지 않는다.

등호를 각 면에서 따로 반올림하지 않고 `src/spaces/roof/junctions.ts`의 같은 선분/꼭짓점을 소비한다. 주 용마루, 전면 박공 용마루, 두 골짜기, 자유 처마와 박공 사선 모서리, 본채 오른쪽 단차, 차고의 벽 접합을 서로 다른 경계 역할로 보존한다. 골짜기 배수 끝을 막는 수평 트림이나 박공 삼각 벽을 가로지르는 가짜 처마를 만들지 않는다.

X = 1.60 m에서는 주 지붕과 낮은 지붕의 높이가 다르므로 억지로 같은 경사면에 잇지 않는다. [오른쪽 입면 owner](../envelope/right.md#right-roof-closures)가 단차 벽을 소유한다. 이는 본채 외곽 안의 접합으로, 자유 처마처럼 주 지붕을 낮은 면 위에 중복 돌출시키지 않는다. 단차에서 주 지붕 아래면까지 닫히는 벽과 낮은 지붕의 벽 접합 후레싱을 구별한다. 옥상 통로나 세 번째 실은 없다.

굴뚝이 닿는 주 지붕 앞 면은 [굴뚝 접면](../envelope/left.md#chimney-roof-interface)을 따라 잘라낸다. 소스는 위 식과 경계에서 결정적으로 면 윤곽을 생성하며 불투명 정점 배열을 복사하지 않는다. 일반 Boolean 연산의 존재나 메쉬 병합의 결합 성능을 전제하지 않는다. 이 경계의 명시적 면 구성이 공개 엔진 경로에서 표현되지 않으면 그 한계를 기록하고 조정자에게 이관한다. 현재 엔진 실행·경계 census·법선/UV·빈틈/중첩·01과의 프레임 대조는 unverified다.

## 지붕에 닿는 외벽 두께 전체의 상단 {#roof-wall-head-junctions}
<!--
@evidence principles/core/common.md#scope-preservation 벽 안팎 상단·박공 교차·차고 공유 벽을 지붕에 닫는다.
@evidence principles/core/common.md#substantive-completion 외측 높이의 평평한 압출 대신 위치별 아래면을 받는다.
@evidence principles/core/common.md#declared-basis 두께와 지붕 경사로 안팎 차이를 산술하며 계측과 구별한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 삼각 벽 요구에 두께 전체 상단의 접촉 규칙을 추가한다.
@evidence principles/design/spaces.md#space-topology 낮은 부속 지붕에서 본채 벽이나 굴뚝을 자르지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 지붕 함수는 계산 owner, 몸체는 입면/공유 벽 owner가 생성한다.
@evidence principles/design/spaces.md#space-verification-address 외측·중간·내측 단면으로 틈과 지붕 관통을 찾는다.
@evidence settings/10-house.md#main-mass 실제 삼각 벽과 지붕 아래면이 벽 두께 전체에서 만나는 경계를 설계한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 삼각 벽·처마 폐합을 두께 방향으로 적용해도 본채 높이와 지붕 경사를 유지할 수 있어 부모 수정은 없다.
-->

본채와 차고의 외벽은 각각 [본채](../00-building.md#main-building-extent)와 [차고](../00-building.md#attached-garage-extent)의 기존 외곽과 안쪽 면 사이를 점유하고 자기 지붕 아래에서 닫힌다. 거주 공간의 위쪽 경계는 [수평 천장](../09-ceiling-assembly.md#upper-ceiling-closure)으로 유지한다. 이 접합은 벽 상단의 경계이며 방·층·통행·지붕 경사나 천장 datum을 추가하거나 바꾸지 않는다. 아래쪽 차고/포치 지붕이 본채 벽 옆에 붙는 선은 본채 벽의 상단이 아니다. 지붕을 뚫고 올라가는 [굴뚝](../envelope/left.md#chimney-roof-interface)은 자기 상부 높이와 지붕 절단을 유지하며 이 상단에서 잘라 버리지 않는다.

각 외벽의 안팎 윗선과 그 사이 상단은 해당 X/Z에 실제로 배정된 [지붕 아래면 함수](#roof-profile-datums)를 소비한다. 외측 벽선의 높이를 두께 방향으로 그대로 압출하거나, 반대로 내측 높이까지 외측 벽을 높여 지붕판을 관통시키지 않는다. 앞뒤 벽 두께 전체에 하나의 경사면이 배정된 구간에서 내측은 외측보다 주 지붕이면 `(8/12) × 외벽 두께`, 낮은 지붕이면 `(7/12) × 외벽 두께`, 차고 지붕이면 `(5/12) × 외벽 두께`만큼 높다. 현재 두께를 대입한 차이는 각각 약 0.1667/0.1458/0.1042 m다. 이 값은 설계식의 산술이며 실제 벽이나 틈의 측정값이 아니다.

전면 박공과 주 지붕이 만나는 벽 두께 구역은 [유한 배정 영역과 같은 교차선](#roof-shared-edges)에서 나누어 각 부분의 아래면을 받는다. 박공 정면의 F를 벽 두께 전체에 무조건 적용하지 않고, 배정 영역 밖의 경사식을 연장하여 벽 상단으로 채택하지 않는다. 본채 앞뒤 벽이 높은 지붕/낮은 지붕 분할면을 지나는 곳도 같은 분할에서 높이가 달라진다. 왼쪽·오른쪽 박공 벽의 용마루 꺾임과 차고의 별도 지붕은 각각의 실제 배정을 유지한다. 지붕 함수가 없는 구간을 임의 높이로 닫지 않는다.

`src/spaces/roof/junctions.ts`는 이 상단 경계의 계산을 전달하고 벽 몸체를 만들지 않는다. 각 입면/공유 벽 owner가 [모서리와 단차 접합 배정](../07-boundary-assembly.md#exterior-boundary-junctions)에 따라 자기 몸체를 같은 상단에서 끝낸다. 지붕 아래면·벽 상단은 한 접촉 경계이고 그 사이를 덮는 별도 장식 쐐기를 중복 생성하지 않는다. 실제 구조 받침·재료 적층·후레싱은 이 예약을 소비할 후속 부재의 책임이다.

검사는 모든 앞뒤 외벽의 외측/중간/내측 단면, 본채/차고의 모든 외벽 모서리, 전면 박공 교차선이 벽 두께를 지나는 부분, 높은 지붕 단차의 앞뒤 끝과 차고 공유 벽이다. 같은 산출물의 벽 상단과 배정된 지붕 아래면을 [공유 허용 오차](../01-storeys.md#storey-datums)로 대조하고, [전체 관찰](../04-observations.md#spatial-observation-derivation)에 처마 아래와 실내 천장 가장자리 시야를 더한다. 실제 접촉·틈/관통·지지·표면 census·GPU 프레임은 unverified다.
