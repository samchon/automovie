# 모델 설계 population의 공통 의무

## 파일 역할과 모델 납품 {#file-roles}

<!--
@evidence obligations/core/common.md#purpose-fit 열 파일을 건물 부재·상설 가구·손에 드는 비품·대지 개체로 대조했다. portable이 없으면 방별 사물 역할 중 벤치·수레·직물·작성 도구 등의 형상 주소가 사라지고, fixtures·wares가 없으면 그 비품이 놓일 제단·선반·도기 원형이 비며, scale이 없으면 그 모두의 공통 UV0 투영·이음과 검토 기준이 갈라진다. 구조와 경관 파일의 별도 결손은 아래 본문에 적었다.
-->

이 population은 한 단층 시민 신전과 그 대지가 소비할 독립 부재의 blocking prototype을 설계한다. [scale](../../models/scale.md)은 공유 축척 기준과 표현 상한, 관절 인터페이스, 중립 검토 판이라는 모든 모델의 공통 기준을 소유한다. 이 파일이 없으면 각 모델이 보행 포락 대신 제각각의 크기 기준과 fidelity 주장을 쓰고 문짝의 hinge 이름과 검토 시점이 모델마다 달라진다.

[columns](../../models/columns.md)는 주랑과 포치의 원형 석주를, [entablature](../../models/entablature.md)는 그 위의 보·포치 박공 트림·서까래·제실 트러스·낮은 천장 보를 소유한다. 둘이 나뉘어 있어 기둥 높이와 보 윗면, 서까래 깊이, 지붕 하부가 한 산술 연쇄로 읽히고, 하나만 남으면 지붕이 기둥에서 뜨거나 주랑 천장이 slab 아랫면만 보인다. [openings](../../models/openings.md)는 판정된 여덟 문과 여덟 채광구의 void를 채우는 문틀·문짝·창틀을 소유하며 관절을 가진 유일한 모델이 여기 있다.

[cladding](../../models/cladding.md)은 합성 지붕 조각 위의 기와와 용마루 반복 단위를, [fixtures](../../models/fixtures.md)는 분수·제단·감실·등잔대·탁자·선반·책상·스툴·궤처럼 방의 용도를 읽히게 하는 설비와 가구를, [wares](../../models/wares.md)는 그 위와 안에 놓이는 항아리·그릇·바구니·두루마리를 소유한다. fixtures와 wares를 합치면 가구와 그 위 용기의 치수 관계가 한 파일 안의 비교로 숨고, 나누어 두면 칸 선반과 두루마리처럼 서로를 받는 두 결정이 각자 주소를 갖는다. [landscape](../../models/landscape.md)는 대지 배치 구역에 놓일 수목·풀·이웃 외피를 소유해 spaces 대지가 남긴 구역을 실제 개체 prototype으로 채울 수 있게 한다.

[portable](../../models/portable.md)은 벤치·소형 등잔·두 자리 항아리 받침·멜대·손수레·물동이·화분·봉헌판·쟁반·직물·첨필·필기판·끈 뭉치의 재사용 prototype을 소유한다. [ritual](../../models/ritual.md)은 낮은 향로·바닥 좌구·한 자리 항아리 받침의 별도 실루엣을 소유한다. 각 방의 복제 수는 instances가 정한다. 작은 문서 상자는 [궤](../../models/fixtures.md#chest)의 s=0.55 변형이다.

## 모델과 다른 제작 분기의 경계 {#layer-routing}

<!--
@evidence obligations/core/common.md#layer-boundary 52개 H2 중 공통 기준 셋은 축척·UV0 투영과 이음·prototype 내부 반복 기준·관절·검토 규칙을, 원형 49개는 형상·part 표면 ID·점유와 배치 기준점을 정한다. 재료 결속·텍스처 반복 길이·fallback·비트맵과 광학 반응은 materials, 방 안 prototype 배치·복제·실제 접촉은 instances, 물의 흐름과 빛은 systems, 외피·지면은 spaces가 맡는다고 아래 본문이 구분한다.
-->

원형을 정의하는 49개 H2는 각각 자기 prototype의 형상, part와 표면 ID, [공통 UV0 투영·이음](../../models/scale.md#reference-scale), 가려진 접촉면과 빈 공간, 점유 범위와 배치 기준점을 결정한다. 나머지 scale의 세 H2는 공통 축척·UV0 투영과 이음·prototype 내부 반복 기준·관절·검토 판 규칙을 정한다. prototype 안에서 반복되는 부재의 개수·간격·첫 위치나 위상은 해당 모델 H2가 정하고, 실제 건물 안의 prototype 복제 수와 공간 경계에 따른 잘림은 instances가 판정된 공간과 합성 지붕에서 유도한다. 방 안 prototype의 배치와 다른 물체와의 실제 접촉도 instances가 정한다. 재료 결속·텍스처 반복 길이·fallback 색은 [재료 결속](../../materials/10-model-bindings.md#binding-map)이 소유하고, 비트맵 선택·색과 거칠기의 최종 반응도 materials가 소유한다.

분수의 흐름·빛 반사와 등잔의 상태 변화는 systems·motions의 후속 결정이며 모델은 정지 형상만 낸다. 외벽 기단과 코핑, 문턱 바닥, 대지 지면과 먼 능선은 spaces가 이미 소유한 실체라 모델 population에 다시 들이지 않는다. 문틀이 문턱 바닥을, 이웃 외피가 포장 구획을, 창틀이 벽 void 위치를 새로 만들지 않는 것이 각 H2에서 이 경계를 지키는 방식이다.

아래 표는 열 문서의 원형 H2에서는 part마다, 공통 규칙인 scale의 세 H2에서는 `공통 규칙` 요약 행으로 만드는 source 입력 색인이다. `공통 규칙`은 방출 part 이름이 아니다. 각 행은 원본 H2 링크·본문 문자 수·SHA-256을 보존하고, 값이 바뀌면 `self-check --sync-accounts`에서 기계적으로 바뀐다. self-check는 원본 H2와 형상 part 주소 전체의 정확한 일치를 검사한다. 이 색인은 빠진 설계 결정을 `0`으로 인증하지 않는다. 리뷰어와 저작자는 링크된 원본 H2의 위치·크기·단면·분할·접합을 판정하고 구현 중 빠진 선택을 찾으면 해당 H2를 먼저 고친다.

| 모델 H2 | part | 본문 문자 수 | 본문 SHA-256 |
| --- | --- | ---: | --- |
| [cladding/roof-tile](../../models/cladding.md#roof-tile) | `tegula` | 2135 | `79e560bfb2b4409edeb7878bf6f1a3872304e6b2c875f870dd73ebd43c8c7791` |
| [cladding/roof-tile](../../models/cladding.md#roof-tile) | `imbrex` | 2135 | `79e560bfb2b4409edeb7878bf6f1a3872304e6b2c875f870dd73ebd43c8c7791` |
| [cladding/ridge-tile](../../models/cladding.md#ridge-tile) | `ridge` | 1974 | `e03c1befd8271329af84d3cc46260ed5c8541fb2690561e87e6a1bc17d3a9eb2` |
| [columns/colonnade-column](../../models/columns.md#colonnade-column) | `plinth` | 1560 | `6e7087278e83af34bed29a226adc3c7e549c78bf42179d5cbdefc5dd4563aa59` |
| [columns/colonnade-column](../../models/columns.md#colonnade-column) | `base` | 1560 | `6e7087278e83af34bed29a226adc3c7e549c78bf42179d5cbdefc5dd4563aa59` |
| [columns/colonnade-column](../../models/columns.md#colonnade-column) | `shaft` | 1560 | `6e7087278e83af34bed29a226adc3c7e549c78bf42179d5cbdefc5dd4563aa59` |
| [columns/colonnade-column](../../models/columns.md#colonnade-column) | `capital` | 1560 | `6e7087278e83af34bed29a226adc3c7e549c78bf42179d5cbdefc5dd4563aa59` |
| [columns/porch-column](../../models/columns.md#porch-column) | `plinth` | 948 | `d401064a98a59a4497223fda4aaab7bd9f19255de2626d274ef9f00d0db16bb8` |
| [columns/porch-column](../../models/columns.md#porch-column) | `base` | 948 | `d401064a98a59a4497223fda4aaab7bd9f19255de2626d274ef9f00d0db16bb8` |
| [columns/porch-column](../../models/columns.md#porch-column) | `shaft` | 948 | `d401064a98a59a4497223fda4aaab7bd9f19255de2626d274ef9f00d0db16bb8` |
| [columns/porch-column](../../models/columns.md#porch-column) | `capital` | 948 | `d401064a98a59a4497223fda4aaab7bd9f19255de2626d274ef9f00d0db16bb8` |
| [entablature/colonnade-beam](../../models/entablature.md#colonnade-beam) | `timber` | 1639 | `8ed17f8a1ff3cd4781bed23db98d3dfb2dbe42109bca1f269e35d280dccfdb2b` |
| [entablature/rafter](../../models/entablature.md#rafter) | `timber` | 1775 | `96ffb2936baa0e3af39407db5e584d731d01d0cfa20b720fc0332ef778723661` |
| [entablature/porch-entablature](../../models/entablature.md#porch-entablature) | `beam` | 1258 | `d4509f719ab14692d015f10232e48393bfade5ba6a41ff2173b1826204ea75c6` |
| [entablature/porch-entablature](../../models/entablature.md#porch-entablature) | `cornice` | 1258 | `d4509f719ab14692d015f10232e48393bfade5ba6a41ff2173b1826204ea75c6` |
| [entablature/porch-entablature](../../models/entablature.md#porch-entablature) | `raking-trim` | 1258 | `d4509f719ab14692d015f10232e48393bfade5ba6a41ff2173b1826204ea75c6` |
| [entablature/sanctuary-truss](../../models/entablature.md#sanctuary-truss) | `tie-beam` | 1492 | `9f544396adf91c20e49e1e6b033a23cd66e76632f79301478c80ed9b5fdef4f2` |
| [entablature/sanctuary-truss](../../models/entablature.md#sanctuary-truss) | `principal` | 1492 | `9f544396adf91c20e49e1e6b033a23cd66e76632f79301478c80ed9b5fdef4f2` |
| [entablature/sanctuary-truss](../../models/entablature.md#sanctuary-truss) | `king-post` | 1492 | `9f544396adf91c20e49e1e6b033a23cd66e76632f79301478c80ed9b5fdef4f2` |
| [entablature/sanctuary-truss](../../models/entablature.md#sanctuary-truss) | `strut` | 1492 | `9f544396adf91c20e49e1e6b033a23cd66e76632f79301478c80ed9b5fdef4f2` |
| [entablature/ceiling-joist](../../models/entablature.md#ceiling-joist) | `timber` | 656 | `7749437b60ea5c4b708351b8780f3090d7581110d271b9893783493d7d53c79c` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `step` | 1647 | `8e8f3ac4c12f3f84a9a05bee0c5d846c601b24636a8558d8856a50268d342683` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `rim` | 1647 | `8e8f3ac4c12f3f84a9a05bee0c5d846c601b24636a8558d8856a50268d342683` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `basin-inner` | 1647 | `8e8f3ac4c12f3f84a9a05bee0c5d846c601b24636a8558d8856a50268d342683` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `water` | 1647 | `8e8f3ac4c12f3f84a9a05bee0c5d846c601b24636a8558d8856a50268d342683` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `ripple` | 1647 | `8e8f3ac4c12f3f84a9a05bee0c5d846c601b24636a8558d8856a50268d342683` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `nozzle` | 1647 | `8e8f3ac4c12f3f84a9a05bee0c5d846c601b24636a8558d8856a50268d342683` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `jet` | 1647 | `8e8f3ac4c12f3f84a9a05bee0c5d846c601b24636a8558d8856a50268d342683` |
| [fixtures/altar](../../models/fixtures.md#altar) | `step` | 1036 | `847ffcbc227b67317d8d8e4168948bbbcc9c08c175e6bc347f64fe01df41077b` |
| [fixtures/altar](../../models/fixtures.md#altar) | `top` | 1036 | `847ffcbc227b67317d8d8e4168948bbbcc9c08c175e6bc347f64fe01df41077b` |
| [fixtures/altar](../../models/fixtures.md#altar) | `support` | 1036 | `847ffcbc227b67317d8d8e4168948bbbcc9c08c175e6bc347f64fe01df41077b` |
| [fixtures/niche](../../models/fixtures.md#niche) | `plinth` | 1276 | `9e8f9cab3fb1b60c843a85990782504205f57d56ff635bb149409d41e2bb9a1e` |
| [fixtures/niche](../../models/fixtures.md#niche) | `body` | 1276 | `9e8f9cab3fb1b60c843a85990782504205f57d56ff635bb149409d41e2bb9a1e` |
| [fixtures/niche](../../models/fixtures.md#niche) | `recess-frame` | 1276 | `9e8f9cab3fb1b60c843a85990782504205f57d56ff635bb149409d41e2bb9a1e` |
| [fixtures/niche](../../models/fixtures.md#niche) | `recess` | 1276 | `9e8f9cab3fb1b60c843a85990782504205f57d56ff635bb149409d41e2bb9a1e` |
| [fixtures/niche](../../models/fixtures.md#niche) | `cap` | 1276 | `9e8f9cab3fb1b60c843a85990782504205f57d56ff635bb149409d41e2bb9a1e` |
| [fixtures/lampstand](../../models/fixtures.md#lampstand) | `foot` | 851 | `bb0d762e778862c11e1c86f0b6fe862a07b77fe7590726e890b73632dea9cac7` |
| [fixtures/lampstand](../../models/fixtures.md#lampstand) | `stem` | 851 | `bb0d762e778862c11e1c86f0b6fe862a07b77fe7590726e890b73632dea9cac7` |
| [fixtures/lampstand](../../models/fixtures.md#lampstand) | `knop` | 851 | `bb0d762e778862c11e1c86f0b6fe862a07b77fe7590726e890b73632dea9cac7` |
| [fixtures/lampstand](../../models/fixtures.md#lampstand) | `dish` | 851 | `bb0d762e778862c11e1c86f0b6fe862a07b77fe7590726e890b73632dea9cac7` |
| [fixtures/offering-table](../../models/fixtures.md#offering-table) | `top` | 715 | `5abc65eab6e88d4299f0f1a2ab5f7a271554b439edd9df266b96a36b23530b61` |
| [fixtures/offering-table](../../models/fixtures.md#offering-table) | `trestle` | 715 | `5abc65eab6e88d4299f0f1a2ab5f7a271554b439edd9df266b96a36b23530b61` |
| [fixtures/display-shelf](../../models/fixtures.md#display-shelf) | `side` | 922 | `db251002050b14c9c712a8a0d5f0ab053258369412ce4ec087b83d937038581d` |
| [fixtures/display-shelf](../../models/fixtures.md#display-shelf) | `board` | 922 | `db251002050b14c9c712a8a0d5f0ab053258369412ce4ec087b83d937038581d` |
| [fixtures/desk](../../models/fixtures.md#desk) | `top` | 736 | `8ccb7d552a7dfc22c00f3d0c38d5687202b7311f667dc7aef633ea01ed96fedf` |
| [fixtures/desk](../../models/fixtures.md#desk) | `leg` | 736 | `8ccb7d552a7dfc22c00f3d0c38d5687202b7311f667dc7aef633ea01ed96fedf` |
| [fixtures/desk](../../models/fixtures.md#desk) | `stretcher` | 736 | `8ccb7d552a7dfc22c00f3d0c38d5687202b7311f667dc7aef633ea01ed96fedf` |
| [fixtures/stool](../../models/fixtures.md#stool) | `seat` | 513 | `2a8c3da7b10c7b117a4a31c7297f0cbd52d63071847e1a63ca74dc805504406d` |
| [fixtures/stool](../../models/fixtures.md#stool) | `leg` | 513 | `2a8c3da7b10c7b117a4a31c7297f0cbd52d63071847e1a63ca74dc805504406d` |
| [fixtures/stool](../../models/fixtures.md#stool) | `stretcher` | 513 | `2a8c3da7b10c7b117a4a31c7297f0cbd52d63071847e1a63ca74dc805504406d` |
| [fixtures/scroll-shelf](../../models/fixtures.md#scroll-shelf) | `frame` | 1040 | `c0957579cd4ce3e680a50dc5c7911ac14b934e3c86d4bff0bd15c54504ea1239` |
| [fixtures/scroll-shelf](../../models/fixtures.md#scroll-shelf) | `board` | 1040 | `c0957579cd4ce3e680a50dc5c7911ac14b934e3c86d4bff0bd15c54504ea1239` |
| [fixtures/scroll-shelf](../../models/fixtures.md#scroll-shelf) | `divider` | 1040 | `c0957579cd4ce3e680a50dc5c7911ac14b934e3c86d4bff0bd15c54504ea1239` |
| [fixtures/chest](../../models/fixtures.md#chest) | `body` | 1557 | `a1e10096cb67ce633bd32cad1da17468d39a0d790237b531a8b90a2d37c1e9dd` |
| [fixtures/chest](../../models/fixtures.md#chest) | `lid` | 1557 | `a1e10096cb67ce633bd32cad1da17468d39a0d790237b531a8b90a2d37c1e9dd` |
| [fixtures/chest](../../models/fixtures.md#chest) | `hasp` | 1557 | `a1e10096cb67ce633bd32cad1da17468d39a0d790237b531a8b90a2d37c1e9dd` |
| [fixtures/chest](../../models/fixtures.md#chest) | `strap` | 1557 | `a1e10096cb67ce633bd32cad1da17468d39a0d790237b531a8b90a2d37c1e9dd` |
| [landscape/cypress](../../models/landscape.md#cypress) | `trunk` | 823 | `864e187c28b632918f79b47dc7a3a454e76e9b73b9159869dc3116b2c7b3bbcd` |
| [landscape/cypress](../../models/landscape.md#cypress) | `crown` | 823 | `864e187c28b632918f79b47dc7a3a454e76e9b73b9159869dc3116b2c7b3bbcd` |
| [landscape/broad-tree](../../models/landscape.md#broad-tree) | `trunk` | 1069 | `a08f44189ba95c36a038b942e50644e36223b07a798c6a8fc6e8897e12c5e1eb` |
| [landscape/broad-tree](../../models/landscape.md#broad-tree) | `branch` | 1069 | `a08f44189ba95c36a038b942e50644e36223b07a798c6a8fc6e8897e12c5e1eb` |
| [landscape/broad-tree](../../models/landscape.md#broad-tree) | `crown` | 1069 | `a08f44189ba95c36a038b942e50644e36223b07a798c6a8fc6e8897e12c5e1eb` |
| [landscape/grass-tuft](../../models/landscape.md#grass-tuft) | `blade` | 640 | `aeacf89280a9aefb42131aab7e1b4e227478fb91bf75d9bb5174e56e29df95a6` |
| [landscape/neighbor-house](../../models/landscape.md#neighbor-house) | `wall` | 1716 | `deacf763a3f77a7e4d5bb9409edd1ff971441e20f3af585fdfb208e882b3ae8b` |
| [landscape/neighbor-house](../../models/landscape.md#neighbor-house) | `plinth` | 1716 | `deacf763a3f77a7e4d5bb9409edd1ff971441e20f3af585fdfb208e882b3ae8b` |
| [landscape/neighbor-house](../../models/landscape.md#neighbor-house) | `roof` | 1716 | `deacf763a3f77a7e4d5bb9409edd1ff971441e20f3af585fdfb208e882b3ae8b` |
| [landscape/neighbor-house](../../models/landscape.md#neighbor-house) | `recess` | 1716 | `deacf763a3f77a7e4d5bb9409edd1ff971441e20f3af585fdfb208e882b3ae8b` |
| [openings/door-frame](../../models/openings.md#door-frame) | `lining` | 1030 | `35f09f0d50677310b346cfdd4b43781fc0cddc3425c5837516b091a743988fbd` |
| [openings/door-frame](../../models/openings.md#door-frame) | `surround` | 1030 | `35f09f0d50677310b346cfdd4b43781fc0cddc3425c5837516b091a743988fbd` |
| [openings/double-door-leaf](../../models/openings.md#double-door-leaf) | `frame` | 2002 | `7af5c7dc0ec857137934f1d4e369523e9565687b136a9b9123a4cf37d19083b4` |
| [openings/double-door-leaf](../../models/openings.md#double-door-leaf) | `panel` | 2002 | `7af5c7dc0ec857137934f1d4e369523e9565687b136a9b9123a4cf37d19083b4` |
| [openings/double-door-leaf](../../models/openings.md#double-door-leaf) | `plate` | 2002 | `7af5c7dc0ec857137934f1d4e369523e9565687b136a9b9123a4cf37d19083b4` |
| [openings/double-door-leaf](../../models/openings.md#double-door-leaf) | `pin` | 2002 | `7af5c7dc0ec857137934f1d4e369523e9565687b136a9b9123a4cf37d19083b4` |
| [openings/double-door-leaf](../../models/openings.md#double-door-leaf) | `ring` | 2002 | `7af5c7dc0ec857137934f1d4e369523e9565687b136a9b9123a4cf37d19083b4` |
| [openings/double-door-leaf](../../models/openings.md#double-door-leaf) | `hinge` | 2002 | `7af5c7dc0ec857137934f1d4e369523e9565687b136a9b9123a4cf37d19083b4` |
| [openings/single-door-leaf](../../models/openings.md#single-door-leaf) | `board` | 1649 | `0c1af3dff899676937eab336365f765ca9b1d5671b8c068940601580a8abf152` |
| [openings/single-door-leaf](../../models/openings.md#single-door-leaf) | `batten` | 1649 | `0c1af3dff899676937eab336365f765ca9b1d5671b8c068940601580a8abf152` |
| [openings/single-door-leaf](../../models/openings.md#single-door-leaf) | `strap` | 1649 | `0c1af3dff899676937eab336365f765ca9b1d5671b8c068940601580a8abf152` |
| [openings/single-door-leaf](../../models/openings.md#single-door-leaf) | `pin` | 1649 | `0c1af3dff899676937eab336365f765ca9b1d5671b8c068940601580a8abf152` |
| [openings/single-door-leaf](../../models/openings.md#single-door-leaf) | `ring` | 1649 | `0c1af3dff899676937eab336365f765ca9b1d5671b8c068940601580a8abf152` |
| [openings/window-frame](../../models/openings.md#window-frame) | `lining` | 724 | `b2c292e3a11ffd3ceb0fc6e65e0383e561b0727351a5115e5978c12654675ae7` |
| [openings/window-frame](../../models/openings.md#window-frame) | `surround` | 724 | `b2c292e3a11ffd3ceb0fc6e65e0383e561b0727351a5115e5978c12654675ae7` |
| [portable/bench](../../models/portable.md#bench) | `seat` | 759 | `5ea6b45bdf45ca2a89271f1c90d96dbc456f27054bba0d74f0624834e4714103` |
| [portable/bench](../../models/portable.md#bench) | `pier` | 759 | `5ea6b45bdf45ca2a89271f1c90d96dbc456f27054bba0d74f0624834e4714103` |
| [portable/portable-lamp](../../models/portable.md#portable-lamp) | `foot` | 959 | `f66f700616c0f9cc29ea5e25bf405d7cd46ab567d093f254623c7dec4a50b218` |
| [portable/portable-lamp](../../models/portable.md#portable-lamp) | `stem` | 959 | `f66f700616c0f9cc29ea5e25bf405d7cd46ab567d093f254623c7dec4a50b218` |
| [portable/portable-lamp](../../models/portable.md#portable-lamp) | `dish` | 959 | `f66f700616c0f9cc29ea5e25bf405d7cd46ab567d093f254623c7dec4a50b218` |
| [portable/jar-rack](../../models/portable.md#jar-rack) | `top` | 1144 | `ac0842b7057e108b5176b2a45bb6e4a4fbebd49cab759145457dc1b4ad9ae7c8` |
| [portable/jar-rack](../../models/portable.md#jar-rack) | `leg` | 1144 | `ac0842b7057e108b5176b2a45bb6e4a4fbebd49cab759145457dc1b4ad9ae7c8` |
| [portable/jar-rack](../../models/portable.md#jar-rack) | `well` | 1144 | `ac0842b7057e108b5176b2a45bb6e4a4fbebd49cab759145457dc1b4ad9ae7c8` |
| [portable/carrying-yoke](../../models/portable.md#carrying-yoke) | `beam` | 710 | `937ef7ca17bbb1ad8cf78d4c613b6cf0bc0e13127a81eb465545dec587703360` |
| [portable/carrying-yoke](../../models/portable.md#carrying-yoke) | `hook` | 710 | `937ef7ca17bbb1ad8cf78d4c613b6cf0bc0e13127a81eb465545dec587703360` |
| [portable/handcart](../../models/portable.md#handcart) | `deck` | 1297 | `a5bfe369af4b0e0db5c964b591fab3353559595c4749b19efe600878c9b66340` |
| [portable/handcart](../../models/portable.md#handcart) | `axle` | 1297 | `a5bfe369af4b0e0db5c964b591fab3353559595c4749b19efe600878c9b66340` |
| [portable/handcart](../../models/portable.md#handcart) | `wheel` | 1297 | `a5bfe369af4b0e0db5c964b591fab3353559595c4749b19efe600878c9b66340` |
| [portable/handcart](../../models/portable.md#handcart) | `handle` | 1297 | `a5bfe369af4b0e0db5c964b591fab3353559595c4749b19efe600878c9b66340` |
| [portable/handcart](../../models/portable.md#handcart) | `support` | 1297 | `a5bfe369af4b0e0db5c964b591fab3353559595c4749b19efe600878c9b66340` |
| [portable/bucket](../../models/portable.md#bucket) | `body` | 1030 | `1ff6e20d8fb24c508e94ead81d64a122536ead575498d70b916eaf8c7fc8749e` |
| [portable/bucket](../../models/portable.md#bucket) | `handle` | 1030 | `1ff6e20d8fb24c508e94ead81d64a122536ead575498d70b916eaf8c7fc8749e` |
| [portable/planter](../../models/portable.md#planter) | `pot` | 978 | `b3761b8795425a9ce44594acc20cb9db0e2689f92064586e32859eefebf9bdf1` |
| [portable/planter](../../models/portable.md#planter) | `soil` | 978 | `b3761b8795425a9ce44594acc20cb9db0e2689f92064586e32859eefebf9bdf1` |
| [portable/votive-plaque](../../models/portable.md#votive-plaque) | `base` | 629 | `624279fc63415c1726c9ae121f51478637086f4d8a2d1cc1797f74fe1c0c6fcb` |
| [portable/votive-plaque](../../models/portable.md#votive-plaque) | `slab` | 629 | `624279fc63415c1726c9ae121f51478637086f4d8a2d1cc1797f74fe1c0c6fcb` |
| [portable/offering-tray](../../models/portable.md#offering-tray) | `floor` | 919 | `87f26892f878338459b2f584007f0d41b422a4b3ea36591004e93251b4c83172` |
| [portable/offering-tray](../../models/portable.md#offering-tray) | `rim` | 919 | `87f26892f878338459b2f584007f0d41b422a4b3ea36591004e93251b4c83172` |
| [portable/textile](../../models/portable.md#textile) | `cloth` | 1005 | `37931eb28839bd0a254c05d1022adbae09711d050b10b93b408bc89db15f89cb` |
| [portable/stylus](../../models/portable.md#stylus) | `shaft` | 638 | `48a087507006bda9cd46b0fef79a9212b251254c463d9124eb692acd0772e520` |
| [portable/stylus](../../models/portable.md#stylus) | `tip` | 638 | `48a087507006bda9cd46b0fef79a9212b251254c463d9124eb692acd0772e520` |
| [portable/writing-tablet](../../models/portable.md#writing-tablet) | `frame` | 796 | `b3e12f495c82344fe919dcb27d5c85cbdf62c62b6aa1f0f400741afc4d2fe45d` |
| [portable/writing-tablet](../../models/portable.md#writing-tablet) | `writing-face` | 796 | `b3e12f495c82344fe919dcb27d5c85cbdf62c62b6aa1f0f400741afc4d2fe45d` |
| [portable/rope-coil](../../models/portable.md#rope-coil) | `rope` | 792 | `21b13bb276144f3c8263ae62d5c40f4a593b7b0e1c6bfeef665f356b761b8006` |
| [portable/rope-coil](../../models/portable.md#rope-coil) | `tie` | 792 | `21b13bb276144f3c8263ae62d5c40f4a593b7b0e1c6bfeef665f356b761b8006` |
| [ritual/censer](../../models/ritual.md#censer) | `foot` | 910 | `72d360ae38a668f73a9c46b9f6fae9bf79893699bdd9a2f3ea9a89a1b8eee76f` |
| [ritual/censer](../../models/ritual.md#censer) | `stem` | 910 | `72d360ae38a668f73a9c46b9f6fae9bf79893699bdd9a2f3ea9a89a1b8eee76f` |
| [ritual/censer](../../models/ritual.md#censer) | `cup` | 910 | `72d360ae38a668f73a9c46b9f6fae9bf79893699bdd9a2f3ea9a89a1b8eee76f` |
| [ritual/censer](../../models/ritual.md#censer) | `ash` | 910 | `72d360ae38a668f73a9c46b9f6fae9bf79893699bdd9a2f3ea9a89a1b8eee76f` |
| [ritual/censer](../../models/ritual.md#censer) | `incense` | 910 | `72d360ae38a668f73a9c46b9f6fae9bf79893699bdd9a2f3ea9a89a1b8eee76f` |
| [ritual/floor-cushion](../../models/ritual.md#floor-cushion) | `base` | 777 | `72e7d0d84151dc632ea6244a2a1c78b8c0d8d98135942562eb48604646858a06` |
| [ritual/floor-cushion](../../models/ritual.md#floor-cushion) | `pad` | 777 | `72e7d0d84151dc632ea6244a2a1c78b8c0d8d98135942562eb48604646858a06` |
| [ritual/floor-cushion](../../models/ritual.md#floor-cushion) | `fold` | 777 | `72e7d0d84151dc632ea6244a2a1c78b8c0d8d98135942562eb48604646858a06` |
| [ritual/jar-stand](../../models/ritual.md#jar-stand) | `foot` | 752 | `c71b1f4f3cb0bcb9e1410e067e648a252cb29ac18a40b37af204cd9da895a33d` |
| [ritual/jar-stand](../../models/ritual.md#jar-stand) | `post` | 752 | `c71b1f4f3cb0bcb9e1410e067e648a252cb29ac18a40b37af204cd9da895a33d` |
| [ritual/jar-stand](../../models/ritual.md#jar-stand) | `ring` | 752 | `c71b1f4f3cb0bcb9e1410e067e648a252cb29ac18a40b37af204cd9da895a33d` |
| [scale/reference-scale](../../models/scale.md#reference-scale) | `공통 규칙` | 7005 | `c4e51a31290be01808c0a37f5e7b0f2b9b7445b2066c67088d02692991188948` |
| [scale/articulation-map](../../models/scale.md#articulation-map) | `공통 규칙` | 686 | `805969903c14fe60a81940d2ae99d4b8dc9eca3fac9efbf7a223c7a04c595f02` |
| [scale/model-review-board](../../models/scale.md#model-review-board) | `공통 규칙` | 650 | `9f2b80d52e6a83f214267f593b814d7fc7021548f107b0717a8fc627946a379f` |
| [wares/storage-jar](../../models/wares.md#storage-jar) | `body` | 790 | `9b0d464ee686b38f618c048c6871081bd315eb654d984e21e259a92b1197fd07` |
| [wares/storage-jar](../../models/wares.md#storage-jar) | `handle` | 790 | `9b0d464ee686b38f618c048c6871081bd315eb654d984e21e259a92b1197fd07` |
| [wares/carry-jar](../../models/wares.md#carry-jar) | `body` | 694 | `7cb6a5a63b7e0e1eb51aa6f915103664aa2aa5eab1bbe89dfa0f9ed983bab1a5` |
| [wares/carry-jar](../../models/wares.md#carry-jar) | `handle` | 694 | `7cb6a5a63b7e0e1eb51aa6f915103664aa2aa5eab1bbe89dfa0f9ed983bab1a5` |
| [wares/small-vessel](../../models/wares.md#small-vessel) | `body` | 807 | `9671b69c35d0c565d0d85354ed54da783f3edc9787a371a51d7c253461a7cfba` |
| [wares/small-vessel](../../models/wares.md#small-vessel) | `handle` | 807 | `9671b69c35d0c565d0d85354ed54da783f3edc9787a371a51d7c253461a7cfba` |
| [wares/offering-bowl](../../models/wares.md#offering-bowl) | `bowl` | 778 | `01439b43e8c4d046065eb91f1cc45446fe01f8a9f1bf38a30feaae62e51652f4` |
| [wares/basket](../../models/wares.md#basket) | `wall` | 1226 | `c6029d6582d375182a151e3718c58936a05ee6f5b87f90f09873d1793b25b22b` |
| [wares/basket](../../models/wares.md#basket) | `rim` | 1226 | `c6029d6582d375182a151e3718c58936a05ee6f5b87f90f09873d1793b25b22b` |
| [wares/basket](../../models/wares.md#basket) | `floor` | 1226 | `c6029d6582d375182a151e3718c58936a05ee6f5b87f90f09873d1793b25b22b` |
| [wares/scroll](../../models/wares.md#scroll) | `sheet` | 1388 | `a3aa627e04ab1ed098e71de9b01d12955849debb74883df4dd85e1a5adc327c0` |
| [wares/scroll](../../models/wares.md#scroll) | `sheet-1` | 1388 | `a3aa627e04ab1ed098e71de9b01d12955849debb74883df4dd85e1a5adc327c0` |
| [wares/scroll](../../models/wares.md#scroll) | `sheet-2` | 1388 | `a3aa627e04ab1ed098e71de9b01d12955849debb74883df4dd85e1a5adc327c0` |
| [wares/scroll](../../models/wares.md#scroll) | `sheet-3` | 1388 | `a3aa627e04ab1ed098e71de9b01d12955849debb74883df4dd85e1a5adc327c0` |
| [wares/scroll](../../models/wares.md#scroll) | `tie` | 1388 | `a3aa627e04ab1ed098e71de9b01d12955849debb74883df4dd85e1a5adc327c0` |

## 작업 언어와 식별 표기 {#working-language}

<!--
@evidence obligations/core/common.md#production-language 모델 결정과 실패 조건은 한국어 기술 서술체로 읽히고, plinth·tegula·hinge.<판 ID> 같은 part·표면·인터페이스 식별자와 anchor, API 성격의 용어만 원문을 유지한다. plumb cut처럼 처음 쓰는 기술 용어에는 한국어 풀이가 붙어 있다.
-->

settings의 [작업 언어](../../settings/00-delivery.md#working-language)에 따라 모델 문서는 현대 표준 한국어로 쓴다. 치수·높이·실패 조건은 한국어 문장 안에서 m 단위 숫자로 적는다. part와 표면 이름(`plinth`, `shaft`, `tegula`, `imbrex`, `lining`, `surround`), 관절 인터페이스(`hinge.<판 ID>`), 상태 이름(`closed`, `open`), 문 ID(`door-entry` 등)와 anchor는 source와 같은 식별자라 원문을 유지한다.

분기 이름(materials, instances, systems)과 prototype, negative space, blocking geometry처럼 계약에서 온 용어는 문맥상 뜻이 드러나게 쓰고, 서까래 끝의 "연직으로 잘린 면(plumb cut)"처럼 처음 쓰는 전문 용어는 한국어 풀이를 앞세운다. 고대어 명칭이나 비문은 쓰지 않는다.

## 규모와 전개 분량의 비교 {#proportion}

<!--
@evidence obligations/core/common.md#proportionate-development 아래 아홉 파일·49 H2의 생성 표와 H2별 분포를 사물 역할의 prototype 재사용에 대조했다. 기와·양개 문짝·수반은 기존 상세 단면을 유지하고 첨필·봉헌판은 얇은 부재만 정했으며 portable의 13 H2는 한 방 전용 복제 대신 다방 재사용을 맡는다. 재생성 전 기준은 Git `111dba96^:experimental/ancient-civic-temple/docs/models/temple-fit-out.md`의 실제 blob을 같은 계수식으로 다시 재어 17 H2·14,799자로 검증했다.
-->

현재 모델 population의 파일·H2·본문 분량은 아래 self-check 생성 표로 고정한다. 본문 문자는 HTML 주석과 공백을 빼고 제목은 포함한 유니코드 코드 포인트 수다. 표에 없는 파일, 중복 파일, 낡은 행은 self-check 실패로 처리한다.

| 모델 파일 | H2 | 주석·공백 제외 본문 문자 수 |
| --- | ---: | ---: |
| cladding.md | 2 | 3310 |
| columns.md | 2 | 2082 |
| entablature.md | 5 | 5608 |
| fixtures.md | 10 | 8599 |
| landscape.md | 4 | 3562 |
| openings.md | 4 | 4426 |
| portable.md | 13 | 10219 |
| ritual.md | 3 | 2227 |
| scale.md | 3 | 6790 |
| wares.md | 6 | 4785 |
| 합계 | 52 | 51608 |

재생성 전 원본은 작업 트리에 없지만 Git `111dba96^:experimental/ancient-civic-temple/docs/models/temple-fit-out.md`에 남아 있다. 현재 계정의 `modelDocumentBodyLength`와 같은 방식으로 해당 blob의 HTML 주석·공백을 빼고 제목을 포함해 다시 세면 한 파일·17 H2·14,799자다. 그 H2 목록에는 `Column prototype`, `Door prototype`, `Roof tile prototype`이 각각 한 번씩 있어 당시 기둥·문짝·기와를 한 절로 묶은 기록도 확인된다. 현재 판은 문틀·양개·외개·창틀, 주랑·포치 원주, 평기와·용마루를 따로 두어 서로 다른 소비자와 변경 경로를 가진 결정이 각자 주소를 가진다.

H2별 분량 순위는 self-check의 `model H2 ranks` 출력에서 매번 다시 읽는다. 수목·이웃집의 위치와 잎 규칙을 확정한 이번 설계에서도 한 번 적은 순위를 고정값처럼 재사용하지 않는다. [build-scope](../../settings/00-delivery.md#build-scope)가 models에 배정한 기둥·문짝·문틀·기와·수반·제단·가구·용기·식생·이웃 외피 prototype은 모두 한 H2 이상을 가진다. 설계와 source 사이의 분량은 비교하지 않으며 모든 H2가 modelSources에서 실현되는지는 그 분기가 열린 뒤 따로 센다.
