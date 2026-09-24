# 조명 체계의 틀

## 광원 소유와 쓰기 경계 {#lighting-authority}

[제작 설정의 build 배분](../settings/00-production.md#build-allocation)이 조명을 systems에 맡기고, [빛과 기준 상태](../settings/20-verification.md#lighting-state)가 전면 왼쪽 위 key·뒤 오른쪽 그림자·하늘 fill·켜진 따뜻한 실내등·고정 노출과 white balance를 정한다. 이 branch는 그 조건을 실현하는 광원 레코드만 쓴다. 쓰는 채널은 설치된 공개 타입 `IAutoMovieLight`(directional·point·spot·area)의 `id`·`transform`·`color`·`intensity`·`castShadow`·`shadow`·`range`·`coneAngle`·`width`·`height`와 `IAutoMovieSceneEnvironment`의 `background`·`intensity`·`exposure`·`toneMapping`·`shadows`다. 방 경계·천장 datum은 [storey datum](../spaces/01-storeys.md#storey-datums)과 각 방 owner, 기구의 갓·몸체 geometry는 models, 갓과 전구의 발광 표면은 materials, 기구 개체 배치는 instances가 소유하며 이 branch는 그 값을 다시 정하지 않는다.

기구 광원 id는 `light:<space-id>:<fixture-role>` 형식이며 space-id는 spaces의 방 id(`front-entry`, `living-room`, `kitchen-dining-family`, `service-access`, `powder-room`, `laundry-mudroom`, `pantry`, `garage`, `upper-hall`, `primary-bedroom`, `primary-wardrobe`, `bedroom-two`, `bedroom-three`, `shower-bathroom`, `tub-bathroom`), 계단 `main-stair`, 외부 구역 `front-porch`를 그대로 쓴다. 기구 광원 하나는 그 한 공간에만 속한다. 대지 전체를 비추는 두 낮빛은 공간에 속하지 않으므로 `light:daylight:<role>`로 구분한다. 같은 광원 값을 두 파일에서 저작하지 않는다.

source owner는 `src/systems/lighting.ts`다. 필요한 관찰은 컴파일된 광원 목록이 `IAutoMovieLight` 합집합만 쓰는지, 방 id가 실제 spaces 방과 일치하는지, 다른 branch의 값을 쓰는 광원이 없는지의 산출물 대조이며 아직 source가 없어 unverified다.

## 정지 기준 상태와 시계 {#lighting-static-state}

이 라이브러리는 시간이 흐르는 장면을 전달하지 않으므로 조명은 하나의 정지 상태다. 모든 광원은 rest 값만 가지며 `IAutoMovieShot.lightMotions`와 `IAutoMovieProductionLighting`을 쓰지 않는다. 시계·seed가 없고 임의 시점 요청은 언제나 같은 상태를 돌려준다. 평가 입력은 spaces 컴파일 산출물의 방 외곽·storey 천장 datum과 이 branch의 상수뿐이며, 조명은 spaces 산출물이 확정된 뒤 한 번 평가된다. 이 production에 다른 활성 system이 없으므로 system 사이의 update 순서나 공동 쓰기 채널은 없다. 리뷰 프레임의 on/off 상태는 [실내 기구](02-interior-fixtures.md)와 [외부 기구](03-exterior-fixtures.md)의 각 H2가 정한 값 하나이며 스위치 회로·조광·자동 점멸은 모델링하지 않는다. 꺼진 기구는 광원 레코드를 만들지 않고 기구 형상만 instances에 남는다.

source owner는 `src/systems/lighting.ts`다. 필요한 관찰은 서로 다른 두 요청 시점과 두 번의 컴파일이 같은 광원 목록·값을 내는지의 대조이며 unverified다.

## 광원 수와 그림자 예산 {#lighting-budget}

현재 광원은 낮빛 directional 2개와 실내 point 28개로 30개이며 입장 상한을 32개로 둔다. 그림자를 던지는 광원은 태양 하나로 제한한다. 실내·외부 기구는 모두 `castShadow`를 쓰지 않는다. 이는 [렌더 경계](../settings/20-verification.md#renderer-boundary)의 실제 WebGL canvas에서 그림자 map 수를 하나로 묶기 위한 이 branch의 선택이며, 실내등의 그림자가 없다는 한계는 리뷰에서 보이는 결과로 기록한다. 광원 수가 설치 엔진의 한도를 넘으면 방을 빼지 않고 `range`를 줄이거나 같은 방의 여러 기구를 area 하나로 합치는 순서로 처리하며, 그래도 넘으면 실제 한도를 조정자에게 보고한다.

source owner는 `src/systems/lighting.ts`다. 필요한 관찰은 컴파일된 광원 수와 그림자 광원 수, 실제 canvas의 RENDERER와 프레임 오류 유무이며 unverified다.

## 조명 리뷰 집합 {#lighting-review-set}

조명의 유한 리뷰 사례는 여섯이다. 첫째, 01 외관 프레임에서 그림자가 뒤 오른쪽에 떨어지고 그늘이 완전 검정이 아닌지를 본다. 둘째, 03 공용부 프레임에서 섬 pendant와 식탁등의 두 빛 웅덩이를 본다. 셋째, 04·05 프레임에서 현관·계단참·복도·침실이 창 빛과 따뜻한 천장등으로 함께 읽히는지 본다. 넷째, 모든 켜진 광원의 좌표가 [실내 기구](02-interior-fixtures.md)가 인용한 방 외곽 안에 있고 매달린 기구의 갓 외곽이 인용한 가구·동선 예약과 겹치지 않는지를 산출물로 대조한다. 다섯째, 두 번의 컴파일과 두 요청 시점이 같은 광원 목록을 내는지 대조한다. 여섯째, 컴파일된 광원 수와 그림자 광원 수 1, 실제 canvas의 RENDERER를 보고한다. 광원 하나를 빼거나 강도를 0으로 바꾸면 해당 사례가 실패해야 하며, 그렇지 않은 사례는 반증력이 없는 것으로 보고 고친다.

source owner는 `src/systems/lighting.ts`이며 관찰 결과는 아직 없어 모두 unverified다.
