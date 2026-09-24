# 낮빛

## 전면 왼쪽 위의 오후 태양 {#daylight-sun}

[빛과 기준 상태](../settings/20-verification.md#lighting-state)의 전면 왼쪽 위 key를 directional 광원 `light:daylight:sun` 하나로 실현한다. [좌표 기준](../settings/00-production.md#coordinate-units)에서 전면은 +Z, 정면에서 본 왼쪽은 -X다. 태양 쪽 방향 벡터는 방위가 -X와 +Z 사이 45°, 고도 32°로 택하며 빛은 +X·-Y·-Z로 진행해 그림자가 뒤 오른쪽에 놓인다. 색은 늦은 오후 인상의 약 4,500 K 따뜻한 흰색, 선형 RGB (1.00, 0.89, 0.76)이고 `intensity`는 3.0이다. 이 값은 지리·날짜 계산이 아니며 설정처럼 이 branch의 선택이다. `castShadow`는 참이고 설치 타입 `IAutoMovieLightShadow`의 그림자 camera는 [울타리 선](../spaces/site/fence.md#fence-enclosure-plan) 안쪽의 주택·포치·차도·테라스 전체를 덮는다. 그 범위 밖의 대지는 그림자를 받지 않으며 이 한계는 외관 프레임에서 보이는 결과로 기록한다.

source owner는 `src/systems/lighting.ts`다. 필요한 관찰은 외관 프레임에서 그림자가 집의 뒤 오른쪽에 떨어지는지, 포치 지붕과 처마 아래 그늘이 생기는지이며 unverified다.

## 하늘 fill과 고정 노출 {#daylight-sky-fill}

하늘 fill은 그림자를 던지지 않는 directional 광원 `light:daylight:sky-fill`로 실현한다. 방향은 거의 수직 위에서 뒤 오른쪽으로 약간 기울어진 (0.25, 1.00, -0.25) 쪽이며 색은 약 7,000 K 차가운 흰색 (0.80, 0.88, 1.00), `intensity`는 0.9다. 설치된 `IAutoMovieSceneEnvironment`에는 hemisphere 광원이 없고 외부 HDR 이미지를 채택하지 않으므로 `image`는 null이다. 환경 값은 `background` 옅은 하늘색, `exposure` 1.0, `toneMapping` `acesFilmic`, `shadows.enabled` 참·`type` `pcfSoft`로 고정하고 모든 view가 같은 값을 쓴다. 이 노출과 white balance는 설정이 요구한 기록값이며 방별 보정은 없다.

source owner는 `src/systems/lighting.ts`다. 필요한 관찰은 태양 반대면이 완전 검정으로 닫히지 않는지, 외관과 실내 프레임의 environment 값이 같은지이며 unverified다.

## 창을 통한 실내 자연광 {#daylight-interior-reach}

실내 자연광은 별도 창 광원을 만들지 않고 같은 태양과 하늘 fill이 [외피 개구부](../spaces/06-openings.md)의 유리를 지나 들어오는 결과로 둔다. 유리 표면이 태양 그림자를 막지 않는지는 materials가 정한다. 창마다 area 광원을 더해 실내를 밝히는 방법은 설정이 금지한 방별 임의 밝기와 같으므로 쓰지 않는다.

source owner는 `src/systems/lighting.ts`다. 필요한 관찰은 전면 왼쪽 거실창과 후면 공용부 창 안쪽 바닥에 창 모양 빛이 생기는지이며 unverified다.
