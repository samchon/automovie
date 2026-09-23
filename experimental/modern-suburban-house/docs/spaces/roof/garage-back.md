# 차고의 낮은 후방 지붕

## 차고 후벽과 본채 접합 {#garage-back-roof}
<!--
@evidence principles/core/common.md#scope-preservation 차고 지붕 뒤 절반의 날씨 면·아래면, 차고 후벽 위 자유 처마, 본채 벽 접합과 뒤 돌출이 본채 창에 미치는 관계를 맡는다.
@evidence principles/core/common.md#substantive-completion Gback을 뒤 절반에 적용해 차고 용마루에서 후벽 처마까지 닫고 이 면을 후면의 별도 작은 동으로 늘리지 않는다.
@evidence principles/core/common.md#declared-basis 영역은 roof-mass-allocation, 높이는 roof-profile-datums, 본채 벽과의 접촉선은 right-roof-closures에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 차고 지붕 뒤 면의 끝을 차고 후벽 위 자유 처마로 정해 부속 지붕이 후면 별동으로 늘어나지 않게 한다.
@evidence principles/design/spaces.md#space-topology 앞은 차고 용마루, 뒤는 차고 후벽 위 자유 처마, 오른쪽은 박공 사선 모서리, 왼쪽은 본채 벽 접합이다.
@evidence principles/design/spaces.md#space-boundary-authority 높이는 Gback에서만 받고 창 위치는 오른쪽 입면과 각 창 H2에서 받아 이 면이 창 좌표를 정하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 뒤 처마 아래에서 본채 접점까지, 차고 내부 천장과 위 구조, 후방 경사면 전체와 공용부·욕조 욕실 창과의 겹침을 검사하게 한다.
@evidence settings/10-house.md#garage 단층 차고의 후벽 위를 낮은 지붕으로 닫고 후면의 별동으로 늘리지 않는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work garage의 "하나의 1층 부속 볼륨"과 깊이 6.0–6.6 m를 뒤 면에 대조했고 Gback이 차고 후벽 위에서 끝나 별동 없이 성립해 부모 수정이 없었다.
-->

`roof.garage.back`과 아래면은 `src/spaces/roof/garage-back.ts`가 소유한다. [차고 영역](00-junctions.md#roof-mass-allocation)의 뒤 절반에 [Gback](00-junctions.md#roof-profile-datums)을 적용한다. 앞은 차고 용마루, 뒤는 차고 후벽의 자유 처마, 오른쪽은 박공 사선 모서리, 왼쪽은 본채 벽 접합이다.

후면 돌출이 본채의 공용부 창이나 상층 욕조 욕실 창과 겹치는지는 [오른쪽 입면](../envelope/right.md#right-roof-closures)의 지붕 접촉선을 함께 읽어 검사한다. 이 면을 후면의 별도 작은 동으로 늘리지 않는다. 뒤 처마 아래에서 본채 접점까지, 차고 내부 천장과 위 구조, 후방 경사면 전체가 검사 주소다. 실제 창 위치·source·면 census·시각 읽힘은 unverified다.
