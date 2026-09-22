# 불투명 외피 마감

## 밝은 석재 패널 {#limestone-panels}

마감 `limestone-honed`는 외피의 밝은 무광 석재다. 기존 0.016m 패널 및 배후 wall body의 geometry는 유지한다. 입면별 `*-stone-panels`와 해당 wall body·corner stone, 창 아래 `*-drip` 석재, 지붕 가장자리의 stone 부재는 각 외피 owner가 배정한다. 대지 포장·실내 타일에는 배정하지 않는다. [바인딩](001-binding-and-scale.md#surface-bindings)의 입면 local 수평 U/수직 V를 사용한다.

색 #c9c3b5, roughness=.82다. `limestone-grain`은 512², 0.64×0.64m 반복이다. 기준색에 곱할 선형 무채색 texture 평균 .98, 범위 .94..1.00로 만들며 2..8mm 입자와 40..100mm 완만한 구름무늬를 혼합한다. 날카로운 검은 점·벽돌줄·가짜 균열은 없다. 별도 member의 기준색 변화는 각 RGB 채널에 같은 sRGB 계수 .98..1.02만 허용한다. 빛과 그림자는 geometry와 조명이 만든다.

실제 패널 간격과 개구부 recess를 texture로 덮지 않는다. front/rear corner는 각 실제 면의 투영이 만나는 모서리이고 이음 없는 거대한 한 장의 돌로 위장하지 않는다. [외관과 접합 검사](007-observation.md#reference-material-samples)에서 ref01의 밝은 패널성·낮은 광택, 모서리와 1층/2층 이음, front와 right의 동일 재료 읽힘을 확인한다. 근접 입자와 원거리 평균색은 [거리 검사](007-observation.md#scale-and-junction-samples)로 따로 본다.

## 불투명 층간 띠 {#opaque-floor-band}

현재 front/rear 외벽의 층간 불투명 띠는 별도 유리 spandrel 부재가 아니라 기존 stone wall/panel의 일부다. 해당 입면 owner가 `floor-band-finish`라는 면 역할을 부여한다. 세계 y=2.84..3.28m이며, 수평 범위는 같은 입면에서 아래층/위층 glazing opening 구간의 교집합 합집합이다. 문/불투명 jamb 위로 띠를 연장하지 않는다. 범위는 각 입면의 실제 Glazing 입력 a/b 및 native opening.profile로 도출하며 raycast나 그림에서 찾지 않는다.

기존 석재 위 명목 0.08mm의 짙은 무광 도장으로 선택한다. 색 #454d4a, roughness=.82, metallic=0이며 기존 limestone-grain을 같은 비율로 소비한다. 기존 mesh의 외향 삼각형을 동일 owner 안에서 별도 material part로 묶고 그 면의 metric 좌표를 기준으로 해당 띠만 baseColorTexture에 적용한다. 실제 틈과 opening cut은 그대로다. 양쪽 경계는 같은 패널의 도장 경계다. 추가 slab, 금속 보, 그림자 선, 불투명 유리층을 그리지 않는다. 별도 금속 spandrel 깊이와 접합은 후속 창호 설계의 판정 대상이다.

이 유한 면 texture는 `floor-band/<owner>/<element-or-member>`이며, 전체 외향 면의 U/V extent를 한 장에 담는다. baseColor와 member palette는 limestone 기준을 유지한다. texture는 띠 밖에서 무채색 grain, 띠 안에서 grain × linear(#454d4a)/linear(#c9c3b5)의 채널별 비율을 저장한다. 따라서 같은 member의 반환면까지 흰 palette로 탈색시키지 않고 석재의 ±2% member 변화가 도장에도 같은 비율로 적용된다. 면의 primary UV는 surface-metres, transform.scale=(1/면폭,1/면높이), wrap=clamp다. 해상도는 각 축 256 texel/m를 올림한 수 이상인 최소 2의 거듭제곱이며 최대4096이다. 경계 위치의 texture 오차는 최대1 texel로 기록한다. 위상 반복은 내부의 grain에만 적용하고 도장 띠는 반복하지 않는다. 안쪽/반환면은 별도 limestone material part로 남기며 원래 element ID·삼각형의 위치·면적·법선을 유지한다.

이 결정은 지금의 층간 연결을 어두운 무광 띠로 읽히게 하는 재료 결정이다. 방 안쪽 lining과 노출 절단면까지 도장하지 않는다. 교집합이 없는 입면은 이 마감의 적용 수 0을 보고한다. [층간 접합 검사](007-observation.md#scale-and-junction-samples)에서 경계 y, opening 회피, 앞뒤 면 배정과 도장이 새 부재처럼 떠 보이는지를 검사한다. 띠의 반사·색은 ref01에 대조하며 실제 내화 spandrel 성능은 unverified다.

## 도장 금속 {#coated-metal}

`frame-coated`는 curtainwall jamb/mullion/head/sill과 shade-box/금속 hem, 문 hardware, 실내 계단 난간, 가구의 metal 다리·frame·손잡이와 등기구 metal trim에 배정한다. 창 아래 drip은 석재를 유지한다. 창호 owner와 방/계단 owner가 각각 자기 부재를 유지한다. 명목 0.08mm 도막이며 색 #293332, roughness=.38, metallic=0이다. 도장 위 반사를 나타내므로 bare metal의 metallic=.65를 유지하지 않는다. texture는 없고 기존 기하의 모서리와 면 방향이 광택 폭을 만든다. 새 bevel을 이 항목에서 추가하지 않는다.

캐노피 구조의 `canopy-metal`과 PV frame에는 이 재료를 덮지 않는다. 검은 화면·hob·기기 외장도 금속 이름만 보고 이 재료로 바꾸지 않으며 [보존 재료](006-wet-and-joinery.md#retained-surfaces)를 따른다. [외관/공용부/상층](007-observation.md#reference-material-samples)에서 프레임이 검은 구멍이 아니라 빛을 받는 기존 깊이의 부재로 읽히는지 본다. geometry가 얕은 한계는 별도 창호 단계에 남긴다.

## 노출 금속과 반사판 {#exposed-steel}

`steel-satin`은 수도꼭지, 싱크, 가전 손잡이·hob ring과 계단 steel stringer/기존 steel hardware에 배정한다. 기존 rod/box/mesh와 양각·곡률을 유지하며 기하를 재료로 보충하지 않는다. 색 #b4bcb8, metallic=.85, roughness=.24, texture 없음이다. 식재/집수구 등 보존 대상으로 명시한 site 부재에는 확장하지 않는다. 실물 합금 조성·부식·위생 성능은 이 값이 표현하지 않는다.

욕실 mirror 역할은 `mirror-proxy`로 분리하여 색 #d6ddda, metallic=1, roughness=.06이다. 현재 환경맵의 반사만 가능하고 방 안 물체의 정확한 거울상은 지원하지 않는다. 이 한계를 다른 화면/사진으로 가리지 않는다. [공용부와 욕실 검사](007-observation.md#reference-material-samples)는 싱크·수전·손잡이와 거울을 각각 주소로 열고 반사판의 한계도 보존한다. 부재가 비금속 회색 플라스틱처럼 읽히면 이 항목이 실패한 것이다.
