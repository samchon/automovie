# 낮빛

## 전면 왼쪽 위의 오후 태양 {#daylight-sun}
<!--
@evidence principles/core/common.md#scope-preservation 전면 왼쪽 위 key 태양의 방향·색·강도·그림자 범위를 맡는다.
@evidence principles/core/common.md#substantive-completion 방위 -X와 +Z 사이 45°, 고도 32°, 4,500 K (1.00, 0.89, 0.76), intensity 3.0, castShadow 참, 그림자 camera는 울타리 안쪽 전체로 정한다.
@evidence principles/core/common.md#declared-basis 전면 왼쪽 위 key·뒤 오른쪽 그림자는 lighting-state, 축은 coordinate-units에서 받고 각도·색·강도는 지리 계산이 아닌 이 branch의 선택이라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation lighting-state가 방향의 인상만 정한 데 비해 방위·고도 수치, 색온도, 강도, 그림자 범위를 더한다.
@evidence principles/design/systems.md#system-authority-confinement 태양 레코드 하나만 쓰고 지붕·처마 geometry와 대지 경계는 spaces owner에서 받는다.
@evidence principles/design/systems.md#system-dependency-basis 방향은 coordinate-units의 +Z 전면·-X 왼쪽에서, 그림자 범위는 fence-enclosure-plan에서 유도한다.
@evidence principles/design/systems.md#system-verification-address 외관 프레임에서 그림자가 뒤 오른쪽에 떨어지는지, 포치 지붕·처마 아래 그늘이 생기는지가 반증 관찰이다.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work lighting-state의 key 방향과 coordinate-units의 축을 대조했고 +Z 전면·-X 왼쪽이 뒤 오른쪽 그림자를 일관되게 내어 부모 수정이 없었다.
@evidence settings/20-verification.md#lighting-state 전면 왼쪽 위 key와 뒤 오른쪽 그림자를 방위 45°·고도 32°의 directional 하나로 실현한다.
@evidence settings/00-production.md#coordinate-units +Z 전면·-X 왼쪽·+Y 위 축으로 태양 방향 벡터를 적는다.
@evidence spaces/site/fence.md#fence-enclosure-plan 울타리 선 안쪽을 그림자 camera 범위로 삼는다.
@evidence obligations/core/common.md#purpose-fit 01-daylight.md는 lighting-state의 외부 key·하늘 fill·창 자연광을 실현하는 낮빛 역할을 맡으며 이것이 없으면 외관 그림자 방향과 고정 노출이 정해지지 않는다.
-->

[빛과 기준 상태](../settings/20-verification.md#lighting-state)의 전면 왼쪽 위 key를 directional 광원 `light:daylight:sun` 하나로 실현한다. [좌표 기준](../settings/00-production.md#coordinate-units)에서 전면은 +Z, 정면에서 본 왼쪽은 -X다. 태양 쪽 방향 벡터는 방위가 -X와 +Z 사이 45°, 고도 32°로 택하며 빛은 +X·-Y·-Z로 진행해 그림자가 뒤 오른쪽에 놓인다. 색은 늦은 오후 인상의 약 4,500 K 따뜻한 흰색, 선형 RGB (1.00, 0.89, 0.76)이고 `intensity`는 3.0이다. 이 값은 지리·날짜 계산이 아니며 설정처럼 이 branch의 선택이다. `castShadow`는 참이고 설치 타입 `IAutoMovieLightShadow`의 그림자 camera는 [울타리 선](../spaces/site/fence.md#fence-enclosure-plan) 안쪽의 주택·포치·차도·테라스 전체를 덮는다. 그 범위 밖의 대지는 그림자를 받지 않으며 이 한계는 외관 프레임에서 보이는 결과로 기록한다.

source owner는 `src/systems/lighting.ts`다. 필요한 관찰은 외관 프레임에서 그림자가 집의 뒤 오른쪽에 떨어지는지, 포치 지붕과 처마 아래 그늘이 생기는지이며 unverified다.

## 하늘 fill과 고정 노출 {#daylight-sky-fill}
<!--
@evidence principles/core/common.md#scope-preservation 하늘 fill 광원과 environment의 background·exposure·toneMapping·shadows 고정값을 맡는다.
@evidence principles/core/common.md#substantive-completion fill 방향 (0.25, 1.00, -0.25), 7,000 K (0.80, 0.88, 1.00), intensity 0.9, image null, exposure 1.0, acesFilmic, pcfSoft를 정한다.
@evidence principles/core/common.md#declared-basis 하늘 fill과 고정 노출 요구는 lighting-state에서 받고 hemisphere 부재는 설치 IAutoMovieSceneEnvironment를 읽은 결과라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation lighting-state가 fill과 고정 노출 기록만 요구한 데 비해 fill의 종류·방향·색·강도와 environment 수치를 더한다.
@evidence principles/design/systems.md#system-authority-confinement fill 레코드와 environment 값만 쓰고 표면 반응은 materials에 남긴다.
@evidence principles/design/systems.md#system-dependency-basis 설치 타입에 hemisphere가 없고 외부 HDR을 채택하지 않았다는 입력에서 그림자 없는 directional을 유도한다.
@evidence principles/design/systems.md#system-verification-address 태양 반대면이 완전 검정으로 닫히지 않는지, 외관과 실내 프레임의 environment 값이 같은지가 반증 관찰이다.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work lighting-state의 fill·고정 노출 요구를 설치 environment 필드에 대조했고 부모가 요구한 결과를 설치 기능으로 실현할 수 있어 부모 수정이 없었다.
@evidence settings/20-verification.md#lighting-state 하늘 fill이 깊은 그늘을 닫지 않게 하고 고정 노출·white balance를 모든 view에 같은 environment 값으로 기록한다.
-->

하늘 fill은 그림자를 던지지 않는 directional 광원 `light:daylight:sky-fill`로 실현한다. 방향은 거의 수직 위에서 뒤 오른쪽으로 약간 기울어진 (0.25, 1.00, -0.25) 쪽이며 색은 약 7,000 K 차가운 흰색 (0.80, 0.88, 1.00), `intensity`는 0.9다. 설치된 `IAutoMovieSceneEnvironment`에는 hemisphere 광원이 없고 외부 HDR 이미지를 채택하지 않으므로 `image`는 null이다. 환경 값은 `background` 옅은 하늘색, `exposure` 1.0, `toneMapping` `acesFilmic`, `shadows.enabled` 참·`type` `pcfSoft`로 고정하고 모든 view가 같은 값을 쓴다. 이 노출과 white balance는 설정이 요구한 기록값이며 방별 보정은 없다.

source owner는 `src/systems/lighting.ts`다. 필요한 관찰은 태양 반대면이 완전 검정으로 닫히지 않는지, 외관과 실내 프레임의 environment 값이 같은지이며 unverified다.

## 창을 통한 실내 자연광 {#daylight-interior-reach}
<!--
@evidence principles/core/common.md#scope-preservation 창을 통한 실내 자연광의 실현 방식과 창 광원 금지를 맡는다.
@evidence principles/core/common.md#substantive-completion 실내 자연광을 태양과 fill이 외피 유리를 통과한 결과로만 두고 창마다 area 광원을 두지 않는다고 정한다.
@evidence principles/core/common.md#declared-basis 방별 임의 밝기 금지는 lighting-state에서 받고 창 광원 금지는 그 금지를 적용한 이 branch의 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation lighting-state가 창 자연광이 읽혀야 한다고만 한 데 비해 별도 광원 없이 같은 두 낮빛으로 실현하는 방식을 더한다.
@evidence principles/design/systems.md#system-authority-confinement 유리가 그림자를 막는지는 materials, 개구부 위치는 spaces 06-openings가 소유한다.
@evidence principles/design/systems.md#system-dependency-basis 실내 자연광은 태양·fill H2와 외부 개구부 경계라는 이름 있는 입력에서만 나온다.
@evidence principles/design/systems.md#system-verification-address 전면 거실창과 후면 공용부 창 안쪽 바닥에 창 모양 빛이 생기는지가 반증 관찰이다.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work lighting-state의 창 자연광 요구와 06-openings의 거친 개구부 경계를 대조했고 개구부가 빛을 받을 수 있어 부모 수정이 없었다.
@evidence settings/20-verification.md#lighting-state 창 자연광을 방별 임의 밝기 없이 같은 두 낮빛으로 실현한다.
@evidence spaces/06-openings.md#external-opening-interface 외피 개구부를 실내 자연광이 들어오는 통로로 소비한다.
-->

실내 자연광은 별도 창 광원을 만들지 않고 같은 태양과 하늘 fill이 [외피 개구부](../spaces/06-openings.md)의 유리를 지나 들어오는 결과로 둔다. 유리 표면이 태양 그림자를 막지 않는지는 materials가 정한다. 창마다 area 광원을 더해 실내를 밝히는 방법은 설정이 금지한 방별 임의 밝기와 같으므로 쓰지 않는다.

source owner는 `src/systems/lighting.ts`다. 필요한 관찰은 전면 왼쪽 거실창과 후면 공용부 창 안쪽 바닥에 창 모양 빛이 생기는지이며 unverified다.
