# 불투명 외피 마감

## 밝은 석재 패널 {#limestone-panels}

<!--
@evidence principles/core/common.md#scope-preservation 네 입면의 stone panel population·wall body·corner prism·창 아래 drip과 roof owner의 roof-slab·roof-bearing 외곽 면을 이 마감에 두고, 층간 띠가 면 단위로 가져가는 외향 면 부분, 전면 body의 계단 void 실내 띠 두 개, 보존되는 roof-weather와 대지 포장·실내 타일은 배정 밖이라고 적어, 외벽의 밝은 불투명 면에 무소유 부분이나 겹친 배정이 남지 않는다.
@evidence principles/core/common.md#substantive-completion #c9c3b5·roughness .82, limestone-grain 512²·0.64m 반복, 평균 .98·범위 .94..1.00, 입자 2..8mm와 구름무늬 40..100mm, member 계수 .98..1.02를 정해 구현이 석재 외관을 고르지 않는다.
@evidence principles/core/common.md#declared-basis 밝은 무채색 외벽은 production-visual-grammar와 envelope-and-privacy에서, 0.016m 패널과 wall body는 입면 owner의 기존 geometry에서 받고 색·grain 수치는 이 층의 저작 선택이라고 구분한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모는 "밝은 석재 계열 불투명 면"까지만 말한다. 이 H2는 honed 석재의 무광 응답, 0.64m 반복의 입자 규모, member 변화 폭과 실제 패널 간격을 texture로 덮지 않는 규칙을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 기존 패널·wall body를 물리 부재로 두고 grain은 선형 명도 변화로만, 빛과 그림자는 geometry와 조명으로만 만든다고 나눠 날카로운 점·가짜 균열로 구조를 흉내 내지 않는다.
@evidence principles/design/materials.md#material-binding-interface 입면 local 수평 U/수직 V를 쓰고 corner는 두 실제 면의 투영이 만나는 모서리로 두며, 패널 간격과 개구부 recess를 texture로 덮지 않는 호환 조건을 둔다.
@evidence principles/design/materials.md#material-verification-address ref01의 패널성·저광택, 모서리와 1층/2층 이음, front와 right의 동일 재료 읽힘은 reference-material-samples에서, 근접 입자와 원거리 평균색은 scale-and-junction-samples에서 반증한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 네 입면의 stone panel 분할과 0.004m 간격, wall body 두께, corner miter prism, 창 아래 drip, roof-slab 가장자리와 시각 문법의 외벽 색을 대조했다. 입면의 위·아래 끝을 결합하며 wall body·corner가 6.10에서 끝나고 roof-slab이 6.108에서 시작해 0.008m 틈이, 기초 상면 -0.016과 입면 시작 0 사이에 0.016m 틈이 둘레 전체에 열린 source 상태를 찾았다. whole-surface-owners가 입면을 ground floor부터 upper ceiling까지로 정하고 그 위·아래 구조를 roof와 층 owner에 남긴 부모 결정은 충분했고, 두 owner source가 외벽 구간에 bearing ring을 두지 않은 실현 결함이라 47c52c85에서 고쳤다. 재료는 틈을 칠로 메우지 않는다.
@evidence settings/001-production.md#production-visual-grammar 밝은 무채색 외벽과 흰 면을 칠로 데우지 않는 규칙을 #c9c3b5 무광 석재와 ±2% member 변화로 구체화한다.
@evidence settings/003-spatial-basis.md#envelope-and-privacy 밝은 석재 계열 불투명 면이라는 외피 공통 재료 언어를 네 입면의 불투명 부재 마감으로 받는다.
@evidence spaces/003-surface-ownership.md#front-face 전면 -Z 외벽에서 현관문·계단실·작업실·상층 침실 유리의 cut 밖에 남는 닫힌 벽·panel과 -X 코어 불투명 벽을 전면 owner가 이 석재로 배정한다.
@evidence spaces/003-surface-ownership.md#rear-face 후면 +Z 외벽에서 공용부·주침실 유리 밖 panel과 욕실 창을 둘러싼 닫힌 벽을 후면 owner가 이 석재로 배정한다.
@evidence spaces/003-surface-ownership.md#left-face +X 좌측의 불투명 return과 세 창 사이 panel을 좌측 owner가 같은 석재로 받아 옆면이 다른 재료로 읽히지 않게 한다.
@evidence spaces/003-surface-ownership.md#right-face -X 서비스 코어의 큰 불투명 벽체와 벽 이음을 우측 owner가 같은 석재로 받아 ref01의 밝은 코어 벽 읽힘을 맡는다.
@evidence spaces/003-surface-ownership.md#envelope-corners 대각 분할된 corner prism의 두 삼각형이 각자 입면 좌표로 같은 석재를 받아 모서리를 이음 없는 한 장의 돌로 위장하지 않는다.
@evidence spaces/003-surface-ownership.md#roof-face roof owner가 소유한 roof-slab과 그 아래 roof-bearing ring의 외곽 면을 외피와 같은 석재로 받아, 6.10 맞댐 위 입면 끝이 틈 없이 같은 재료로 이어지게 하고 방수 최종 면 roof-weather는 보존에 남긴다.
-->

마감 `limestone-honed`는 외피의 밝은 무광 석재다. 기존 0.016m 패널 및 배후 wall body의 geometry는 유지한다. 입면별 `*-stone-panels`와 해당 wall body·corner prism, 창 아래 `*-drip` 석재는 각 외피 owner가, 지붕 가장자리의 `roof-slab` 외곽 면(y=6.108..6.40)과 그 아래 외벽 구간을 닫는 `roof-bearing-*` ring의 외곽 면(6.10..6.108)은 roof owner가 배정한다. 방수 최종 면 `roof-weather`는 가장자리 면까지 [보존 역할](006-wet-and-joinery.md#retained-surfaces)이다. [층간 띠](#opaque-floor-band)가 면 단위로 가져가는 panel·wall body의 외향 면 부분은 이 마감에서 뺀다. 또 전면 wall body가 계단 void에 드러내는 실내 면 두 띠(x=-1.24..1.58의 창 cut 아래 3.184..3.28과 head 위 6.04..6.10)는 전면 owner가 [실내 도장](005-soft-finishes.md#plaster-paint)으로 배정한다. 대지 포장·실내 타일에는 배정하지 않는다. [metric 좌표](001-binding-and-scale.md#metric-texture-coordinates)의 면 접선축 중 입면 local 수평을 U, 수직을 V로 쓴다.

밝은 무채색 외벽과 흰 벽을 칠로 데우지 않는 규칙은 [시각 문법](../settings/001-production.md#production-visual-grammar), 밝은 석재 계열 불투명 면은 [외피와 개구부](../settings/003-spatial-basis.md#envelope-and-privacy)에서 받는다. 아래 색·roughness·grain 수치는 이 층의 저작 선택이다. 색 #c9c3b5, roughness=.82다. `limestone-grain`은 512², 0.64×0.64m 반복이다. 기준색에 곱할 선형 무채색 texture 평균 .98, 범위 .94..1.00로 만들며 2..8mm 입자와 40..100mm 완만한 구름무늬를 혼합한다. 날카로운 검은 점·벽돌줄·가짜 균열은 없다. 별도 member의 기준색 변화는 각 RGB 채널에 같은 sRGB 계수 .98..1.02만 허용한다. 빛과 그림자는 geometry와 조명이 만든다.

실제 패널 간격과 개구부 recess를 texture로 덮지 않는다. front/rear corner는 각 실제 면의 투영이 만나는 모서리이고 이음 없는 거대한 한 장의 돌로 위장하지 않는다. [외관과 접합 검사](007-observation.md#reference-material-samples)에서 ref01의 밝은 패널성·낮은 광택, 모서리와 1층/2층 이음, front와 right의 동일 재료 읽힘을 확인한다. 근접 입자와 원거리 평균색은 [거리 검사](007-observation.md#scale-and-junction-samples)로 따로 본다.

## 불투명 층간 띠 {#opaque-floor-band}

<!--
@evidence principles/core/common.md#scope-preservation 아래 head 2.80·위 sill 3.32 창 쌍의 frame 바깥선까지 네 입면 구간을 모두 띠로 정해 jamb 선 위 석재 틈을 남기지 않고 위 끝 3.25..3.28은 기존 석재 drip이 덮는다고 적으며, 쌍이 없는 rear bath·left child-two, 그 밖의 불투명 벽과 문, 방 안쪽 lining과 절단면은 적용 밖으로 적어 층간 면의 배정 누락이나 과잉이 없다.
@evidence principles/core/common.md#substantive-completion y=2.84..3.28, #454d4a·roughness .82, grain 비율의 채널별 저장, floor-band/<owner>/<element-or-member> ID, 256 texel/m 해상도와 4096 상한, 경계 오차 1 texel까지 정해 구현이 띠 표현을 발명하지 않는다.
@evidence principles/core/common.md#declared-basis y 범위와 쌍 규칙은 mass-and-storeys·glazing-interface에서, 수평 범위는 각 opening의 Glazing a/b에 frame 면 폭 0.04를 더해 도출하고, 도장 색·두께는 이 층의 선택이며 금속 spandrel 깊이는 후속 창호 판정으로 남는다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation glazing-interface는 0.020m 금속 덮개라는 아직 구현되지 않은 부재를 정했을 뿐 현재 층간 면은 석재다. 이 H2는 그 사이 현재 부재를 짙은 무광 도장 면으로 읽히게 하는 유한 clamp texture 배정을 새로 결정한다.
@evidence principles/design/materials.md#material-construction-appearance 명목 0.08mm 도막을 석재 위 표면층으로 두고 새 slab·금속 보·그림자 선·불투명 유리층을 그리지 않으며 실제 틈과 cut을 유지해, 도장 외관을 금속 spandrel 구조로 가장하지 않는다.
@evidence principles/design/materials.md#material-binding-interface 기존 mesh의 외향 삼각형만 같은 owner 안의 별도 material part로 묶고 위치·면적·법선을 유지하며, surface-metres·clamp와 면별 U/V extent로 띠 경계를 둔다.
@evidence principles/design/materials.md#material-verification-address 경계 y, frame 바깥선에서 끝나는 띠 끝, 띠 위 끝을 덮는 석재 drip과의 경계, 그 끝을 가로지르는 front-face-stone-panels:1-4-0·rear-face-stone-panels:2-3-0의 panel 안 도장 경계, 외향/반환면 배정, slab 외곽이 외장 평면에 나오지 않는지와 도장이 새 부재처럼 떠 보이는지를 scale-and-junction-samples의 층간 표본에서, 띠의 색·반사를 ref01 대조에서 반증한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work mass-and-storeys의 2층 바닥 3.20·외벽 두께, glazing-interface의 층간 덮개 쌍 규칙·frame 포함 band 표와 위층 drip 3.25..3.28, 전면 계단 하층·상층을 따로 센 열 개 Glazing 입력의 a/b를 대조했다. 이 H2가 한때 유효 span 교집합을 써 부모 표와 0.04m씩 어긋난 것은 이 H2의 범위 오류였고 부모 표에 맞춰 여기서 고쳤다. 부모는 띠 범위를 모두 도출할 수 있게 정했다. 띠를 결합하며 upper slab 외곽이 panel 외면과 같은 평면이던 source 상태를 찾았고 4c2c8042에서 층 owner source를 외벽 중심면까지 물려 고쳤다. 이는 settings 규칙을 어긴 실현 결함이지 부모 설계의 누락이 아니다.
@evidence settings/003-spatial-basis.md#envelope-and-privacy floor/transom과 room/jamb 경계를 맞춘다는 외피 canon을 층선 사이의 짙은 무광 띠로 읽히게 한다.
@evidence settings/003-spatial-basis.md#surface-decomposition "동일한 면을 두 번 생성하지 않는다"를 근거로 띠가 결합하는 외향 면을 입면 panel과 wall body로 한정하고 slab 가장자리가 외벽 몸체 안에 머무는 것을 결합의 유지 조건으로 둔다.
@evidence spaces/002-spatial-graph.md#mass-and-storeys 1층 천장 2.90과 2층 바닥 3.20 사이 층간 구조대를 띠 y=2.84..3.28이 걸치는 수직 위치의 근거로 쓴다.
@evidence spaces/003-surface-ownership.md#glazing-interface 아래 head 2.80·위 sill 3.32 쌍에만 층간 덮개를 두는 규칙과 그 Y 범위를 띠의 적용 조건으로 그대로 받는다.
@evidence spaces/003-surface-ownership.md#front-stair-glazing 계단실 아래·위 두 opening의 frame 포함 범위 X=-1.24..1.58 교집합이 전면 첫 띠 구간이 된다.
@evidence spaces/003-surface-ownership.md#front-flex-glazing 작업실 전면창의 frame 포함 X=3.02..5.26이 위층 침실 창과 겹쳐 전면 둘째 띠를 준다.
@evidence spaces/003-surface-ownership.md#front-bedroom-glazing 침실 전면창의 frame 포함 범위 중 아래 작업실 창과 겹치는 3.02..5.26만 띠가 되고 계단 쪽 나머지는 아래 창이 없어 석재로 남는다.
@evidence spaces/003-surface-ownership.md#rear-common-glazing 공용부 전폭 창의 frame 포함 범위 가운데 위 주침실 창과 겹치는 -2.84..5.26이 후면 띠 구간이 된다.
@evidence spaces/003-surface-ownership.md#rear-bedroom-glazing 주침실 후면창의 frame 포함 X=-2.84..5.26 전체가 아래 공용부 창 위에 놓여 후면 띠의 폭을 정한다.
@evidence spaces/003-surface-ownership.md#left-flex-glazing 작업실 측면창의 frame 포함 Z=-5.44..-2.26이 위 작은 침실 1 창과 같은 범위라 좌측 띠의 아래 쌍이 된다.
@evidence spaces/003-surface-ownership.md#left-bedroom-glazing 작은 침실 1 측면창이 하층과 같은 frame 포함 Z span을 받아 좌측 띠의 위 쌍을 이룬다.
@evidence spaces/003-surface-ownership.md#right-common-glazing 공용부 측면창의 frame 포함 Z=3.56..5.44가 우측 띠의 아래 쌍이다.
@evidence spaces/003-surface-ownership.md#right-bath-glazing 욕실 측면창이 sill 3.32로 하층 공용부 창과 쌍을 이뤄 우측 띠 Z=3.56..5.44를 만든다.
-->

현재 네 입면의 층간 불투명 띠는 별도 금속 spandrel cassette가 아니라 기존 stone wall/panel의 일부다. 해당 입면 owner가 `floor-band-finish`라는 면 역할을 부여한다. 세계 y=2.84..3.28m이며, 수평 범위는 같은 입면에서 아래층 head 2.80과 위층 sill 3.32로 마주보는 glazing opening 쌍마다 유효 span에 frame 면 폭 0.04m를 더한 a-0.04..b+0.04의 교집합이다. 이는 [창호 인터페이스](../spaces/003-surface-ownership.md#glazing-interface)의 층간 덮개 band 표와 같은 범위로 front 계단 X=-1.24..1.58, front 작업실 위 X=3.02..5.26, rear X=-2.84..5.26, left Z=-5.44..-2.26, right Z=3.56..5.44다. 아래 jamb는 head+0.04에서 끝나고 위 jamb는 sill-0.04에서 시작하므로, 이 범위는 두 jamb 선 사이 석재를 남기지 않고 띠를 두 창의 frame 바깥선에서 끝낸다. 위층 창의 기존 석재 drip(y=3.25..3.28, 띠 끝보다 양쪽 0.02m 넓음)이 띠 위 끝 앞에 놓이므로 밖에서 보이는 도장 띠는 2.84..3.25이고 그 위를 석재 drip이 덮는다. drip 뒤 3.25..3.28의 가려진 외향 면도 같은 띠 경계를 따른다. 높은 sill의 rear bath와 left child-two는 쌍이 아니므로 띠를 만들지 않는다. 그 밖의 불투명 벽과 문 위로는 띠를 연장하지 않는다. 범위는 각 입면의 실제 Glazing 입력 a/b와 frame 면 폭으로 도출하며 raycast나 그림에서 찾지 않는다. 현재 facade의 stone panel population에서 띠와 겹치는 member는 36개다. 34개는 띠 범위 안에 통째로 들어가지만, 아래·위 창 폭이 다른 두 쌍에서는 panel 한 행을 한쪽 창 cut만 자르므로 `front-face-stone-panels:1-4-0`(X=2.924..4.089, y=3.052..3.278)과 `rear-face-stone-panels:2-3-0`(X=-2.920..-1.755, y=2.842..3.048)이 띠 끝 X=3.02와 -2.84를 가로지른다. 이 두 member와 wall body의 외향 면은 아래 member별 clamp texture 안에 띠 경계를 담고 띠 밖 부분은 석재로 남긴다. 겹치는 member 수와 교차 member는 compiled population에서 다시 도출한다.

기존 석재 위 명목 0.08mm의 짙은 무광 도장으로 선택한다. 색 #454d4a, roughness=.82, metallic=0이며 기존 limestone-grain을 같은 비율로 소비한다. 기존 mesh의 외향 삼각형을 동일 owner 안에서 별도 material part로 묶고 그 면의 metric 좌표를 기준으로 해당 띠만 baseColorTexture에 적용한다. 실제 틈과 opening cut은 그대로다. 띠 끝이 panel 안에 걸리면 그 경계는 같은 panel 안의 도장 경계이고, panel 이음이나 opening cut과 일치하면 실제 틈이 경계가 된다. 추가 slab, 금속 보, 그림자 선, 불투명 유리층을 그리지 않는다. 별도 금속 spandrel 깊이와 접합은 후속 창호 설계의 판정 대상이다.

이 유한 면 texture는 `floor-band/<owner>/<element-or-member>`이며, 전체 외향 면의 U/V extent를 한 장에 담는다. baseColor와 member palette는 limestone 기준을 유지한다. texture는 띠 밖에서 무채색 grain, 띠 안에서 grain × linear(#454d4a)/linear(#c9c3b5)의 채널별 비율을 저장한다. 따라서 같은 member의 반환면까지 흰 palette로 탈색시키지 않고 석재의 ±2% member 변화가 도장에도 같은 비율로 적용된다. 면의 primary UV는 surface-metres, transform.scale=(1/면폭,1/면높이), wrap=clamp다. 해상도는 각 축 256 texel/m를 올림한 수 이상인 최소 2의 거듭제곱이며 최대4096이다. 경계 위치의 texture 오차는 최대1 texel로 기록한다. 위상 반복은 내부의 grain에만 적용하고 도장 띠는 반복하지 않는다. 안쪽/반환면은 별도 limestone material part로 남기며 원래 element ID·삼각형의 위치·면적·법선을 유지한다.

이 결정은 지금의 층간 연결을 어두운 무광 띠로 읽히게 하는 재료 결정이다. 방 안쪽 lining과 노출 절단면까지 도장하지 않는다. 교집합이 없는 입면은 이 마감의 적용 수 0을 보고한다. upper slab 네 piece는 외벽 중심면 x=±5.38, z=±5.88까지만 뻗어 가장자리가 외벽 몸체 안에 묻힌다. 4c2c8042 전에는 외곽 x=±5.50, z=±6.00까지 뻗어 y=2.908..3.184에서 panel 외면과 같은 평면을 이뤘고 층 owner의 source 수리로 고쳤다. 띠가 결합하는 외향 면은 입면 owner의 panel과 wall body뿐이다. slab가 다시 외장 평면까지 넓어지면 settings 표면 분해의 "동일한 면을 두 번 생성하지 않는다"를 어기고 띠 면과 겹치므로 이 띠의 결합 조건이 깨진다. 재료는 slab 면을 칠해 가리지 않는다. [층간 접합 검사](007-observation.md#scale-and-junction-samples)에서 경계 y, opening 회피, 앞뒤 면 배정, 띠 위 끝의 석재 drip과의 경계, 띠 끝을 가로지르는 두 panel member의 도장 경계, slab 외곽이 외장 평면에 나오지 않는지와 도장이 새 부재처럼 떠 보이는지를 검사한다. 띠의 반사·색은 ref01에 대조하며 실제 내화 spandrel 성능은 unverified다.

## 도장 금속 {#coated-metal}

<!--
@evidence principles/core/common.md#scope-preservation 창호 jamb/mullion/head/sill·shade-box·금속 hem, 문 hardware, 실내 계단 난간, 가구의 metal 다리·손잡이, 샤워 screen rail, 등기구 metal trim·pendant cord를 이 마감에 두고 drip 석재·canopy-metal·PV frame·화면·hob·기기 외장은 제외해 metal 이름 부재의 배정이 겹치지 않는다.
@evidence principles/core/common.md#substantive-completion #293332·roughness .38·metallic 0, 명목 0.08mm 도막, texture 없음과 bare metal의 .65를 쓰지 않는 이유까지 정해 구현이 금속 응답을 고를 일이 없다.
@evidence principles/core/common.md#declared-basis 차콜 frame은 시각 문법, 창호·문·계단 부재는 glazing-interface·door-interface·single-stair의 기존 부재, 가구 다리·손잡이·샤워 rail·등기구 trim·cord는 각 방 owner의 기존 부재에서 받고, 도장 위 반사라는 해석과 수치는 이 층의 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모는 어두운 금속 frame과 부재 위치만 정한다. 이 H2는 그것이 도장된 비금속 반사 응답이라는 결정과 새 bevel 없이 기존 모서리·면 방향이 광택 폭을 만든다는 규칙을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 금속 기재 위 명목 0.08mm 도막을 구조 사실로, metallic=0·roughness .38을 그 도막의 렌더 응답으로 두어 도장 frame을 bare metal처럼 보이게 하지 않는다.
@evidence principles/design/materials.md#material-binding-interface 창호 owner와 방·계단 owner가 각자 부재를 유지한 채 역할 주소로만 결합하고, texture가 없어 좌표 요구가 없으며 canopy·PV frame에는 결합하지 않는다는 호환 경계를 둔다.
@evidence principles/design/materials.md#material-verification-address 프레임이 검은 구멍이 아니라 기존 깊이로 빛을 받는 부재로 읽히는지를 외관·공용부·상층 reference 표본에서 반증하고, 얕은 frame 깊이의 한계는 창호 단계로 남긴다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work glazing-interface의 0.04m 면 폭·0.14m 깊이 부재와 roller box·hem, door-interface의 handle과 leaf의 native 회전(별도 hinge element는 없다), single-stair의 baluster·handrail 위치, 방 owner의 가구 다리·손잡이·샤워 rail·등기구 trim을 대조했다. 결합할 부재 주소가 모두 있어 부모 수리가 필요 없었다.
@evidence settings/001-production.md#production-visual-grammar 차콜 frame이라는 재료 관계를 도장 금속의 짙은 색과 중간 광택으로 옮긴다.
@evidence spaces/003-surface-ownership.md#glazing-interface jamb·mullion·head·sill과 shade-box·hem의 기존 부재를 각 입면 owner가 이 도장 금속으로 배정한다.
@evidence spaces/002-spatial-graph.md#door-interface 문짝에서 파생되는 handle hardware를 해당 방 owner가 이 도장 금속으로 받는다.
@evidence spaces/002-spatial-graph.md#single-stair tread pitch를 따르는 baluster·handrail과 참 난간을 계단 owner가 이 마감으로 받아 목재 디딤판과 광택을 구분한다.
-->

`frame-coated`는 curtainwall jamb/mullion/head/sill과 shade-box/금속 hem, 문 hardware, 실내 계단 난간, 가구의 metal 다리·손잡이(murphy pull과 설비장 손잡이 포함), 욕실 샤워 screen의 metal rail과 등기구 metal trim·pendant cord에 배정한다. 창 아래 drip은 석재를 유지한다. 창호 owner와 방/계단 owner가 각각 자기 부재를 유지한다. 명목 0.08mm 도막이며 색 #293332, roughness=.38, metallic=0이다. 도장 위 반사를 나타내므로 bare metal의 metallic=.65를 유지하지 않는다. texture는 없고 기존 기하의 모서리와 면 방향이 광택 폭을 만든다. 새 bevel을 이 항목에서 추가하지 않는다.

캐노피 구조의 `canopy-metal`과 PV frame에는 이 재료를 덮지 않는다. 검은 화면·hob·기기 외장도 금속 이름만 보고 이 재료로 바꾸지 않으며 [보존 재료](006-wet-and-joinery.md#retained-surfaces)를 따른다. [외관/공용부/상층](007-observation.md#reference-material-samples)에서 프레임이 검은 구멍이 아니라 빛을 받는 기존 깊이의 부재로 읽히는지 본다. geometry가 얕은 한계는 별도 창호 단계에 남긴다.

## 노출 금속과 반사판 {#exposed-steel}

<!--
@evidence principles/core/common.md#scope-preservation 수전·싱크·가전 손잡이·hob ring·계단 steel stringer·flush·shower 부속을 steel-satin으로, 욕실과 powder의 거울 역할을 mirror-proxy로 나누고 캐노피 anchor·거름망·점검 덮개·steel 설비장·site 부재는 보존 역할로 넘겨 노출 금속면에 owner가 둘인 면이 없다.
@evidence principles/core/common.md#substantive-completion steel-satin #b4bcb8·metallic .85·roughness .24와 mirror-proxy #d6ddda·metallic 1·roughness .06을 정해 두 반사 응답을 구현이 고르지 않는다.
@evidence principles/core/common.md#declared-basis 부재는 방·계단 owner의 기존 box·rod·타원체 형상에서 받고, 금속 응답과 환경맵 거울 근사는 이 층의 선택이며 합금·부식·위생 성능은 이 값이 표현하지 않는다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 프로그램은 sink·induction cooktop이 있다는 사실만 주고 거울은 방 owner의 세면대 형상에서 온다. 이 H2는 노출 금속과 거울을 서로 다른 두 응답으로 나누고 현재 환경 반사의 한계를 결정한다.
@evidence principles/design/materials.md#material-construction-appearance 기존 형상·양각·곡률을 유지한 채 금속성은 metallic·roughness 근사로만 표현하고, 방 안 물체의 정확한 거울상은 지원하지 않는다고 구분해 다른 화면이나 사진으로 가리지 않는다.
@evidence principles/design/materials.md#material-binding-interface texture가 없어 좌표 요구가 없고 수전·싱크·stringer·mirror라는 역할 주소로만 결합하며 site 부재로 확장하지 않는 경계를 둔다.
@evidence principles/design/materials.md#material-verification-address 싱크·수전·손잡이와 거울을 공용부·욕실 표본에서 각각 주소로 열고, 부재가 비금속 회색 플라스틱처럼 읽히면 이 H2의 실패로 둔다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work common-room 주방의 island sink·tap·hob·oven handle, powder와 욕실의 basin tap·spout·거울·shower 부속, single-stair의 steel stringer를 대조했다. 모두 이미 분리된 element라 부모 형상이나 소유를 고칠 결함이 없었다.
@evidence settings/002-household.md#ground-program 주방의 sink와 induction cooktop이 식별되도록 수전·싱크·hob ring에 노출 금속 응답을 준다.
@evidence spaces/002-spatial-graph.md#common-room 연속 공용부 주방의 싱크·수도꼭지·가전 손잡이·hob ring을 공용부 owner가 이 금속으로 배정한다.
@evidence spaces/002-spatial-graph.md#powder-utility powder 세면대의 tap·spout은 steel-satin, 그 위 거울은 mirror-proxy로 나눈다.
@evidence spaces/002-spatial-graph.md#upper-bathroom 욕실 vanity 수전·거울과 shower riser·head·drain을 같은 두 역할로 받는다.
@evidence spaces/002-spatial-graph.md#single-stair 두 flight의 steel stringer를 노출 금속으로 두어 도장 난간과 반사가 구분되게 한다.
-->

`steel-satin`은 수도꼭지, 싱크, 가전 손잡이·hob ring, 계단 steel stringer, 욕실·powder의 flush 버튼과 shower riser·head·drain에 배정한다. 기존 box·rod·타원체(hob ring) 형상을 유지하며 기하를 재료로 보충하지 않는다. 색 #b4bcb8, metallic=.85, roughness=.24, texture 없음이다. 캐노피 anchor·거름망·우측 배수 점검 덮개, 설비실 steel 설비장, 식재·집수구 같은 site 부재는 [보존 역할](006-wet-and-joinery.md#retained-surfaces)이며 이 마감으로 확장하지 않는다. 실물 합금 조성·부식·위생 성능은 이 값이 표현하지 않는다.

욕실·powder의 mirror 역할은 `mirror-proxy`로 분리하여 색 #d6ddda, metallic=1, roughness=.06이다. 현재 환경맵의 반사만 가능하고 방 안 물체의 정확한 거울상은 지원하지 않는다. 이 한계를 다른 화면/사진으로 가리지 않는다. [공용부와 욕실 검사](007-observation.md#reference-material-samples)는 싱크·수전·손잡이와 거울을 각각 주소로 열고 반사판의 한계도 보존한다. 부재가 비금속 회색 플라스틱처럼 읽히면 이 항목이 실패한 것이다.
