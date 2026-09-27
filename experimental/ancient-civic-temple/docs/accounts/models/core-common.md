# 모델 설계 population의 공통 의무

## 파일 역할과 모델 납품 {#file-roles}

<!--
@evidence obligations/core/common.md#purpose-fit 열 파일을 건물 부재·상설 가구·손에 드는 비품·대지 개체로 대조했다. portable이 없으면 방별 사물 역할 중 벤치·수레·직물·작성 도구 등의 형상 주소가 사라지고, fixtures·wares가 없으면 그 비품이 놓일 제단·선반·도기 원형이 비며, scale이 없으면 그 모두의 공통 UV0 투영·이음과 검토 기준이 갈라진다. 구조와 경관 파일의 별도 결손은 아래 본문에 적었다.
@evidenceReview obligations/core/common.md#purpose-fit #7b32c66 열 모델 파일의 분담을 본문 링크와 대조해 portable·fixtures·wares·scale 중 어느 하나가 빠져도 비품 원형이나 공통 기준의 납품이 달라짐을 확인했다.
-->

이 population은 한 단층 시민 신전과 그 대지가 소비할 독립 부재의 blocking prototype을 설계한다. [scale](../../models/scale.md)은 공유 축척 기준과 표현 상한, 관절 인터페이스, 중립 검토 판이라는 모든 모델의 공통 기준을 소유한다. 이 파일이 없으면 각 모델이 보행 포락 대신 제각각의 크기 기준과 fidelity 주장을 쓰고 문짝의 hinge 이름과 검토 시점이 모델마다 달라진다.

[columns](../../models/columns.md)는 주랑과 포치의 원형 석주를, [entablature](../../models/entablature.md)는 그 위의 보·포치 박공 트림·서까래·제실 트러스·낮은 천장 보를 소유한다. 둘이 나뉘어 있어 기둥 높이와 보 윗면, 서까래 깊이, 지붕 하부가 한 산술 연쇄로 읽히고, 하나만 남으면 지붕이 기둥에서 뜨거나 주랑 천장이 slab 아랫면만 보인다. [openings](../../models/openings.md)는 판정된 여덟 문과 여덟 채광구의 void를 채우는 문틀·문짝·창틀을 소유하며 관절을 가진 유일한 모델이 여기 있다.

[cladding](../../models/cladding.md)은 합성 지붕 조각 위의 기와와 용마루 반복 단위를, [fixtures](../../models/fixtures.md)는 분수·제단·감실·등잔대·탁자·선반·책상·스툴·궤처럼 방의 용도를 읽히게 하는 설비와 가구를, [wares](../../models/wares.md)는 그 위와 안에 놓이는 항아리·그릇·바구니·두루마리를 소유한다. fixtures와 wares를 합치면 가구와 그 위 용기의 치수 관계가 한 파일 안의 비교로 숨고, 나누어 두면 칸 선반과 두루마리처럼 서로를 받는 두 결정이 각자 주소를 갖는다. [landscape](../../models/landscape.md)는 대지 배치 구역에 놓일 수목·풀·이웃 외피를 소유해 spaces 대지가 남긴 구역을 실제 개체 prototype으로 채울 수 있게 한다.

[portable](../../models/portable.md)은 벤치·소형 등잔·두 자리 항아리 받침·멜대·손수레·물동이·화분·봉헌판·쟁반·직물·첨필·필기판·끈 뭉치의 재사용 prototype을 소유한다. [ritual](../../models/ritual.md)은 낮은 향로·바닥 좌구·한 자리 항아리 받침의 별도 실루엣을 소유한다. 각 방의 복제 수는 instances가 정한다. 기록실과 보관실의 궤는 [같은 기본 원형](../../models/fixtures.md#chest)을 쓴다.

## 모델과 다른 제작 분기의 경계 {#layer-routing}

<!--
@evidence obligations/core/common.md#layer-boundary 52개 H2 중 공통 기준 셋은 축척·UV0 투영과 이음·prototype 내부 반복 기준·관절·검토 규칙을, 원형 49개는 형상·part 표면 ID·점유와 배치 기준점을 정한다. 재료 결속·텍스처 반복 길이·fallback·비트맵과 광학 반응은 materials, 방 안 prototype 배치·복제·실제 접촉은 instances, 물의 흐름과 빛은 systems, 외피·지면은 spaces가 맡는다고 아래 본문이 구분한다.
@evidenceReview obligations/core/common.md#layer-boundary #5271f94 52개 H2에서 공통 규칙 셋과 원형 49개를 나누고 재료 반응·실제 복제와 접촉·흐름·외피를 각 후속 분기의 책임으로 남긴 경계를 확인했다.
-->

원형을 정의하는 49개 H2는 각각 자기 prototype의 형상, part와 표면 ID, [공통 UV0 투영·이음](../../models/scale.md#reference-scale), 가려진 접촉면과 빈 공간, 점유 범위와 배치 기준점을 결정한다. 나머지 scale의 세 H2는 공통 축척·UV0 투영과 이음·prototype 내부 반복 기준·관절·검토 판 규칙을 정한다. prototype 안에서 반복되는 부재의 개수·간격·첫 위치나 위상은 해당 모델 H2가 정하고, 실제 건물 안의 prototype 복제 수와 공간 경계에 따른 잘림은 instances가 판정된 공간과 합성 지붕에서 유도한다. 방 안 prototype의 배치와 다른 물체와의 실제 접촉도 instances가 정한다. 재료 결속·텍스처 반복 길이·fallback 색은 [재료 결속](../../materials/10-model-bindings.md#binding-map)이 소유하고, 비트맵 선택·색과 거칠기의 최종 반응도 materials가 소유한다.

분수의 흐름·빛 반사와 등잔의 상태 변화는 systems·motions의 후속 결정이며 모델은 정지 형상만 낸다. 외벽 기단과 코핑, 문턱 바닥, 대지 지면과 먼 능선은 spaces가 이미 소유한 실체라 모델 population에 다시 들이지 않는다. 문틀이 문턱 바닥을, 이웃 외피가 포장 구획을, 창틀이 벽 void 위치를 새로 만들지 않는 것이 각 H2에서 이 경계를 지키는 방식이다.

아래 표는 열 문서의 원형 H2에서는 part마다, 공통 규칙인 scale의 세 H2에서는 `공통 규칙` 요약 행으로 만드는 source 입력 색인이다. `공통 규칙`은 방출 part 이름이 아니다. 각 행은 원본 H2 링크·본문 문자 수·SHA-256을 보존하고, 값이 바뀌면 `self-check --sync-accounts`에서 기계적으로 바뀐다. self-check는 원본 H2와 형상 part 주소 전체의 정확한 일치를 검사한다. 이 색인은 빠진 설계 결정을 `0`으로 인증하지 않는다. 리뷰어와 저작자는 링크된 원본 H2의 위치·크기·단면·분할·접합을 판정하고 구현 중 빠진 선택을 찾으면 해당 H2를 먼저 고친다.

| 모델 H2 | part | 본문 문자 수 | 본문 SHA-256 |
| --- | --- | ---: | --- |
| [cladding/roof-tile](../../models/cladding.md#roof-tile) | `tegula` | 2430 | `385dfe707dbed61e2ab39c2cb93a5dfd0f73860253aae536f4fc2ff8576f2777` |
| [cladding/roof-tile](../../models/cladding.md#roof-tile) | `imbrex` | 2430 | `385dfe707dbed61e2ab39c2cb93a5dfd0f73860253aae536f4fc2ff8576f2777` |
| [cladding/ridge-tile](../../models/cladding.md#ridge-tile) | `ridge` | 2067 | `a5b1bafda5298e01977aad1f2dc16e59fea6ffb0a9cbf5d3c3d30e90f2951f83` |
| [columns/colonnade-column](../../models/columns.md#colonnade-column) | `plinth` | 1560 | `6e7087278e83af34bed29a226adc3c7e549c78bf42179d5cbdefc5dd4563aa59` |
| [columns/colonnade-column](../../models/columns.md#colonnade-column) | `base` | 1560 | `6e7087278e83af34bed29a226adc3c7e549c78bf42179d5cbdefc5dd4563aa59` |
| [columns/colonnade-column](../../models/columns.md#colonnade-column) | `shaft` | 1560 | `6e7087278e83af34bed29a226adc3c7e549c78bf42179d5cbdefc5dd4563aa59` |
| [columns/colonnade-column](../../models/columns.md#colonnade-column) | `capital` | 1560 | `6e7087278e83af34bed29a226adc3c7e549c78bf42179d5cbdefc5dd4563aa59` |
| [columns/porch-column](../../models/columns.md#porch-column) | `plinth` | 948 | `d401064a98a59a4497223fda4aaab7bd9f19255de2626d274ef9f00d0db16bb8` |
| [columns/porch-column](../../models/columns.md#porch-column) | `base` | 948 | `d401064a98a59a4497223fda4aaab7bd9f19255de2626d274ef9f00d0db16bb8` |
| [columns/porch-column](../../models/columns.md#porch-column) | `shaft` | 948 | `d401064a98a59a4497223fda4aaab7bd9f19255de2626d274ef9f00d0db16bb8` |
| [columns/porch-column](../../models/columns.md#porch-column) | `capital` | 948 | `d401064a98a59a4497223fda4aaab7bd9f19255de2626d274ef9f00d0db16bb8` |
| [entablature/colonnade-beam](../../models/entablature.md#colonnade-beam) | `timber` | 1725 | `e1e3823b80d22283533c3fb97e5c27d7d992eea1fe003768c8a061a1dc65f85f` |
| [entablature/rafter](../../models/entablature.md#rafter) | `timber` | 1775 | `96ffb2936baa0e3af39407db5e584d731d01d0cfa20b720fc0332ef778723661` |
| [entablature/porch-entablature](../../models/entablature.md#porch-entablature) | `beam` | 1258 | `d4509f719ab14692d015f10232e48393bfade5ba6a41ff2173b1826204ea75c6` |
| [entablature/porch-entablature](../../models/entablature.md#porch-entablature) | `cornice` | 1258 | `d4509f719ab14692d015f10232e48393bfade5ba6a41ff2173b1826204ea75c6` |
| [entablature/porch-entablature](../../models/entablature.md#porch-entablature) | `raking-trim` | 1258 | `d4509f719ab14692d015f10232e48393bfade5ba6a41ff2173b1826204ea75c6` |
| [entablature/sanctuary-truss](../../models/entablature.md#sanctuary-truss) | `tie-beam` | 1492 | `9f544396adf91c20e49e1e6b033a23cd66e76632f79301478c80ed9b5fdef4f2` |
| [entablature/sanctuary-truss](../../models/entablature.md#sanctuary-truss) | `principal` | 1492 | `9f544396adf91c20e49e1e6b033a23cd66e76632f79301478c80ed9b5fdef4f2` |
| [entablature/sanctuary-truss](../../models/entablature.md#sanctuary-truss) | `king-post` | 1492 | `9f544396adf91c20e49e1e6b033a23cd66e76632f79301478c80ed9b5fdef4f2` |
| [entablature/sanctuary-truss](../../models/entablature.md#sanctuary-truss) | `strut` | 1492 | `9f544396adf91c20e49e1e6b033a23cd66e76632f79301478c80ed9b5fdef4f2` |
| [entablature/ceiling-joist](../../models/entablature.md#ceiling-joist) | `timber` | 656 | `7749437b60ea5c4b708351b8780f3090d7581110d271b9893783493d7d53c79c` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `step` | 1770 | `7bfc08a90535ded07715e0aae23c2b097fbbb2ac0760394c07e7e9f319ba881a` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `rim` | 1770 | `7bfc08a90535ded07715e0aae23c2b097fbbb2ac0760394c07e7e9f319ba881a` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `basin-inner` | 1770 | `7bfc08a90535ded07715e0aae23c2b097fbbb2ac0760394c07e7e9f319ba881a` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `water` | 1770 | `7bfc08a90535ded07715e0aae23c2b097fbbb2ac0760394c07e7e9f319ba881a` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `ripple` | 1770 | `7bfc08a90535ded07715e0aae23c2b097fbbb2ac0760394c07e7e9f319ba881a` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `nozzle` | 1770 | `7bfc08a90535ded07715e0aae23c2b097fbbb2ac0760394c07e7e9f319ba881a` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `jet` | 1770 | `7bfc08a90535ded07715e0aae23c2b097fbbb2ac0760394c07e7e9f319ba881a` |
| [fixtures/altar](../../models/fixtures.md#altar) | `step` | 1036 | `847ffcbc227b67317d8d8e4168948bbbcc9c08c175e6bc347f64fe01df41077b` |
| [fixtures/altar](../../models/fixtures.md#altar) | `top` | 1036 | `847ffcbc227b67317d8d8e4168948bbbcc9c08c175e6bc347f64fe01df41077b` |
| [fixtures/altar](../../models/fixtures.md#altar) | `support` | 1036 | `847ffcbc227b67317d8d8e4168948bbbcc9c08c175e6bc347f64fe01df41077b` |
| [fixtures/niche](../../models/fixtures.md#niche) | `plinth` | 1276 | `9e8f9cab3fb1b60c843a85990782504205f57d56ff635bb149409d41e2bb9a1e` |
| [fixtures/niche](../../models/fixtures.md#niche) | `body` | 1276 | `9e8f9cab3fb1b60c843a85990782504205f57d56ff635bb149409d41e2bb9a1e` |
| [fixtures/niche](../../models/fixtures.md#niche) | `recess-frame` | 1276 | `9e8f9cab3fb1b60c843a85990782504205f57d56ff635bb149409d41e2bb9a1e` |
| [fixtures/niche](../../models/fixtures.md#niche) | `recess` | 1276 | `9e8f9cab3fb1b60c843a85990782504205f57d56ff635bb149409d41e2bb9a1e` |
| [fixtures/niche](../../models/fixtures.md#niche) | `cap` | 1276 | `9e8f9cab3fb1b60c843a85990782504205f57d56ff635bb149409d41e2bb9a1e` |
| [fixtures/lampstand](../../models/fixtures.md#lampstand) | `foot` | 1044 | `6cc6ccc5eca3d8ba4907d4c218a4b441cf00598073036cb648e3941ae96b564b` |
| [fixtures/lampstand](../../models/fixtures.md#lampstand) | `stem` | 1044 | `6cc6ccc5eca3d8ba4907d4c218a4b441cf00598073036cb648e3941ae96b564b` |
| [fixtures/lampstand](../../models/fixtures.md#lampstand) | `knop` | 1044 | `6cc6ccc5eca3d8ba4907d4c218a4b441cf00598073036cb648e3941ae96b564b` |
| [fixtures/lampstand](../../models/fixtures.md#lampstand) | `dish` | 1044 | `6cc6ccc5eca3d8ba4907d4c218a4b441cf00598073036cb648e3941ae96b564b` |
| [fixtures/offering-table](../../models/fixtures.md#offering-table) | `top` | 715 | `5abc65eab6e88d4299f0f1a2ab5f7a271554b439edd9df266b96a36b23530b61` |
| [fixtures/offering-table](../../models/fixtures.md#offering-table) | `trestle` | 715 | `5abc65eab6e88d4299f0f1a2ab5f7a271554b439edd9df266b96a36b23530b61` |
| [fixtures/display-shelf](../../models/fixtures.md#display-shelf) | `side` | 1076 | `d1e8bcaff6f5facd3a29de02726126bacdc18f192c42a8f3d4f6c7efd08c9ca3` |
| [fixtures/display-shelf](../../models/fixtures.md#display-shelf) | `board` | 1076 | `d1e8bcaff6f5facd3a29de02726126bacdc18f192c42a8f3d4f6c7efd08c9ca3` |
| [fixtures/desk](../../models/fixtures.md#desk) | `top` | 800 | `bcfd54f3366104e6e1cb48c824a90d86ea73c8ec8d7bbd724be6c86a084a230d` |
| [fixtures/desk](../../models/fixtures.md#desk) | `leg` | 800 | `bcfd54f3366104e6e1cb48c824a90d86ea73c8ec8d7bbd724be6c86a084a230d` |
| [fixtures/desk](../../models/fixtures.md#desk) | `stretcher` | 800 | `bcfd54f3366104e6e1cb48c824a90d86ea73c8ec8d7bbd724be6c86a084a230d` |
| [fixtures/stool](../../models/fixtures.md#stool) | `seat` | 513 | `2a8c3da7b10c7b117a4a31c7297f0cbd52d63071847e1a63ca74dc805504406d` |
| [fixtures/stool](../../models/fixtures.md#stool) | `leg` | 513 | `2a8c3da7b10c7b117a4a31c7297f0cbd52d63071847e1a63ca74dc805504406d` |
| [fixtures/stool](../../models/fixtures.md#stool) | `stretcher` | 513 | `2a8c3da7b10c7b117a4a31c7297f0cbd52d63071847e1a63ca74dc805504406d` |
| [fixtures/scroll-shelf](../../models/fixtures.md#scroll-shelf) | `frame` | 1040 | `c0957579cd4ce3e680a50dc5c7911ac14b934e3c86d4bff0bd15c54504ea1239` |
| [fixtures/scroll-shelf](../../models/fixtures.md#scroll-shelf) | `board` | 1040 | `c0957579cd4ce3e680a50dc5c7911ac14b934e3c86d4bff0bd15c54504ea1239` |
| [fixtures/scroll-shelf](../../models/fixtures.md#scroll-shelf) | `divider` | 1040 | `c0957579cd4ce3e680a50dc5c7911ac14b934e3c86d4bff0bd15c54504ea1239` |
| [fixtures/chest](../../models/fixtures.md#chest) | `body` | 1494 | `b7d8d2908d5f84506f8aabc760233a16793eb74da255ea2a5c52fb099205eb12` |
| [fixtures/chest](../../models/fixtures.md#chest) | `lid` | 1494 | `b7d8d2908d5f84506f8aabc760233a16793eb74da255ea2a5c52fb099205eb12` |
| [fixtures/chest](../../models/fixtures.md#chest) | `hasp` | 1494 | `b7d8d2908d5f84506f8aabc760233a16793eb74da255ea2a5c52fb099205eb12` |
| [fixtures/chest](../../models/fixtures.md#chest) | `strap` | 1494 | `b7d8d2908d5f84506f8aabc760233a16793eb74da255ea2a5c52fb099205eb12` |
| [landscape/cypress](../../models/landscape.md#cypress) | `trunk` | 922 | `fd21e7a9439a26b1dc7b1388f63264b92b1f023591bfbf2f18675d2462aa9784` |
| [landscape/cypress](../../models/landscape.md#cypress) | `crown` | 922 | `fd21e7a9439a26b1dc7b1388f63264b92b1f023591bfbf2f18675d2462aa9784` |
| [landscape/broad-tree](../../models/landscape.md#broad-tree) | `trunk` | 1215 | `f63eb26a674c2cd10c979f9b02246f9d7f9b8a6513319f6207685798b421ecba` |
| [landscape/broad-tree](../../models/landscape.md#broad-tree) | `branch` | 1215 | `f63eb26a674c2cd10c979f9b02246f9d7f9b8a6513319f6207685798b421ecba` |
| [landscape/broad-tree](../../models/landscape.md#broad-tree) | `crown` | 1215 | `f63eb26a674c2cd10c979f9b02246f9d7f9b8a6513319f6207685798b421ecba` |
| [landscape/grass-tuft](../../models/landscape.md#grass-tuft) | `blade` | 777 | `f451b1fef76cc5ecab4b9b8715eb3e6ddea7b5f1c65f63dd69f4daae8c8dd805` |
| [landscape/neighbor-house](../../models/landscape.md#neighbor-house) | `wall` | 1716 | `deacf763a3f77a7e4d5bb9409edd1ff971441e20f3af585fdfb208e882b3ae8b` |
| [landscape/neighbor-house](../../models/landscape.md#neighbor-house) | `plinth` | 1716 | `deacf763a3f77a7e4d5bb9409edd1ff971441e20f3af585fdfb208e882b3ae8b` |
| [landscape/neighbor-house](../../models/landscape.md#neighbor-house) | `roof` | 1716 | `deacf763a3f77a7e4d5bb9409edd1ff971441e20f3af585fdfb208e882b3ae8b` |
| [landscape/neighbor-house](../../models/landscape.md#neighbor-house) | `recess` | 1716 | `deacf763a3f77a7e4d5bb9409edd1ff971441e20f3af585fdfb208e882b3ae8b` |
| [openings/door-frame](../../models/openings.md#door-frame) | `lining` | 1054 | `8f7a2ab3074a13f1b21d71e1da06f089b0c6994cce1740b6ea7982d2bd9619d5` |
| [openings/door-frame](../../models/openings.md#door-frame) | `surround` | 1054 | `8f7a2ab3074a13f1b21d71e1da06f089b0c6994cce1740b6ea7982d2bd9619d5` |
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
| [portable/handcart](../../models/portable.md#handcart) | `deck` | 1350 | `60bef2214a837d7829012db3f3291a5092c1820cc2961acdea5d3308d21e19d1` |
| [portable/handcart](../../models/portable.md#handcart) | `axle` | 1350 | `60bef2214a837d7829012db3f3291a5092c1820cc2961acdea5d3308d21e19d1` |
| [portable/handcart](../../models/portable.md#handcart) | `wheel` | 1350 | `60bef2214a837d7829012db3f3291a5092c1820cc2961acdea5d3308d21e19d1` |
| [portable/handcart](../../models/portable.md#handcart) | `handle` | 1350 | `60bef2214a837d7829012db3f3291a5092c1820cc2961acdea5d3308d21e19d1` |
| [portable/handcart](../../models/portable.md#handcart) | `support` | 1350 | `60bef2214a837d7829012db3f3291a5092c1820cc2961acdea5d3308d21e19d1` |
| [portable/bucket](../../models/portable.md#bucket) | `body` | 1295 | `680610b1deb8ae7c4d6b755be3e5d3da24802498a535fcfb69caec7e7f8c3981` |
| [portable/bucket](../../models/portable.md#bucket) | `handle` | 1295 | `680610b1deb8ae7c4d6b755be3e5d3da24802498a535fcfb69caec7e7f8c3981` |
| [portable/planter](../../models/portable.md#planter) | `pot` | 978 | `b3761b8795425a9ce44594acc20cb9db0e2689f92064586e32859eefebf9bdf1` |
| [portable/planter](../../models/portable.md#planter) | `soil` | 978 | `b3761b8795425a9ce44594acc20cb9db0e2689f92064586e32859eefebf9bdf1` |
| [portable/votive-plaque](../../models/portable.md#votive-plaque) | `base` | 629 | `624279fc63415c1726c9ae121f51478637086f4d8a2d1cc1797f74fe1c0c6fcb` |
| [portable/votive-plaque](../../models/portable.md#votive-plaque) | `slab` | 629 | `624279fc63415c1726c9ae121f51478637086f4d8a2d1cc1797f74fe1c0c6fcb` |
| [portable/offering-tray](../../models/portable.md#offering-tray) | `floor` | 919 | `87f26892f878338459b2f584007f0d41b422a4b3ea36591004e93251b4c83172` |
| [portable/offering-tray](../../models/portable.md#offering-tray) | `rim` | 919 | `87f26892f878338459b2f584007f0d41b422a4b3ea36591004e93251b4c83172` |
| [portable/textile](../../models/portable.md#textile) | `cloth` | 1005 | `37931eb28839bd0a254c05d1022adbae09711d050b10b93b408bc89db15f89cb` |
| [portable/stylus](../../models/portable.md#stylus) | `shaft` | 698 | `3a64c1efd89b3f3a6530c06d4c984ae57c29e9ce4b30dcb5ee4e4842197da348` |
| [portable/stylus](../../models/portable.md#stylus) | `tip` | 698 | `3a64c1efd89b3f3a6530c06d4c984ae57c29e9ce4b30dcb5ee4e4842197da348` |
| [portable/writing-tablet](../../models/portable.md#writing-tablet) | `frame` | 902 | `9b57590de3fc7d62c2cfccafc6fc546082886abed84e2d8a90a2a81b5043c319` |
| [portable/writing-tablet](../../models/portable.md#writing-tablet) | `writing-face` | 902 | `9b57590de3fc7d62c2cfccafc6fc546082886abed84e2d8a90a2a81b5043c319` |
| [portable/rope-coil](../../models/portable.md#rope-coil) | `rope` | 830 | `453597b9978c4f48e7b23c2f539e7f21acbf86f96cecb9f28956fb30335c06a1` |
| [portable/rope-coil](../../models/portable.md#rope-coil) | `tie` | 830 | `453597b9978c4f48e7b23c2f539e7f21acbf86f96cecb9f28956fb30335c06a1` |
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
| [scale/reference-scale](../../models/scale.md#reference-scale) | `공통 규칙` | 7153 | `2bad5fdd293a402a59b70d10b7953b35206f39fcd684d528e17850c65a485faf` |
| [scale/articulation-map](../../models/scale.md#articulation-map) | `공통 규칙` | 788 | `78d5002b349fb4ffe638a2dce1794368f05a3bc786229b9af4ff8dc88ef5797e` |
| [scale/model-review-board](../../models/scale.md#model-review-board) | `공통 규칙` | 1389 | `1dff5260947e667ec577182cf8ab6cbd61a36e86419d5194d82b6cfca3cd978f` |
| [wares/storage-jar](../../models/wares.md#storage-jar) | `body` | 854 | `fc0a7eb94134aa72e2f979e57f35dbcacdb2767a80bb57d2c601fd245c143af5` |
| [wares/storage-jar](../../models/wares.md#storage-jar) | `handle` | 854 | `fc0a7eb94134aa72e2f979e57f35dbcacdb2767a80bb57d2c601fd245c143af5` |
| [wares/carry-jar](../../models/wares.md#carry-jar) | `body` | 1033 | `751763ca9adea728bfcc970dd55cea16f646e0c4e548345cf8dca63f7c7a45fa` |
| [wares/carry-jar](../../models/wares.md#carry-jar) | `handle` | 1033 | `751763ca9adea728bfcc970dd55cea16f646e0c4e548345cf8dca63f7c7a45fa` |
| [wares/small-vessel](../../models/wares.md#small-vessel) | `body` | 900 | `ee3bc51f8ae686d17eb7b721080d7882ad6eafa60a9a5290d152330463af70dc` |
| [wares/small-vessel](../../models/wares.md#small-vessel) | `handle` | 900 | `ee3bc51f8ae686d17eb7b721080d7882ad6eafa60a9a5290d152330463af70dc` |
| [wares/offering-bowl](../../models/wares.md#offering-bowl) | `bowl` | 779 | `9abca54132b74592db227068e3889f06edbc73b95239806c4e78de0fdf3acf67` |
| [wares/basket](../../models/wares.md#basket) | `wall` | 1226 | `c6029d6582d375182a151e3718c58936a05ee6f5b87f90f09873d1793b25b22b` |
| [wares/basket](../../models/wares.md#basket) | `rim` | 1226 | `c6029d6582d375182a151e3718c58936a05ee6f5b87f90f09873d1793b25b22b` |
| [wares/basket](../../models/wares.md#basket) | `floor` | 1226 | `c6029d6582d375182a151e3718c58936a05ee6f5b87f90f09873d1793b25b22b` |
| [wares/scroll](../../models/wares.md#scroll) | `sheet` | 1613 | `dc9bd916c646104e2a6433ec419321f93de39a1ff1c0196b4f0629579ad24272` |
| [wares/scroll](../../models/wares.md#scroll) | `sheet-1` | 1613 | `dc9bd916c646104e2a6433ec419321f93de39a1ff1c0196b4f0629579ad24272` |
| [wares/scroll](../../models/wares.md#scroll) | `sheet-2` | 1613 | `dc9bd916c646104e2a6433ec419321f93de39a1ff1c0196b4f0629579ad24272` |
| [wares/scroll](../../models/wares.md#scroll) | `sheet-3` | 1613 | `dc9bd916c646104e2a6433ec419321f93de39a1ff1c0196b4f0629579ad24272` |
| [wares/scroll](../../models/wares.md#scroll) | `tie` | 1613 | `dc9bd916c646104e2a6433ec419321f93de39a1ff1c0196b4f0629579ad24272` |

## 작업 언어와 식별 표기 {#working-language}

<!--
@evidence obligations/core/common.md#production-language 모델 결정과 실패 조건은 한국어 기술 서술체로 읽히고, plinth·tegula·hinge.<판 ID> 같은 part·표면·인터페이스 식별자와 anchor, API 성격의 용어만 원문을 유지한다. plumb cut처럼 처음 쓰는 기술 용어에는 한국어 풀이가 붙어 있다.
@evidenceReview obligations/core/common.md#production-language #3ef4142 치수와 실패 조건의 한국어 문장, part·관절·상태의 원문 식별자, plumb cut의 첫 한국어 풀이를 실제 표기와 대조했다.
-->

settings의 [작업 언어](../../settings/00-delivery.md#working-language)에 따라 모델 문서는 현대 표준 한국어로 쓴다. 치수·높이·실패 조건은 한국어 문장 안에서 m 단위 숫자로 적는다. part와 표면 이름(`plinth`, `shaft`, `tegula`, `imbrex`, `lining`, `surround`), 관절 인터페이스(`hinge.<판 ID>`), 상태 이름(`closed`, `open`), 문 ID(`door-entry` 등)와 anchor는 source와 같은 식별자라 원문을 유지한다.

분기 이름(materials, instances, systems)과 prototype, negative space, blocking geometry처럼 계약에서 온 용어는 문맥상 뜻이 드러나게 쓰고, 서까래 끝의 "연직으로 잘린 면(plumb cut)"처럼 처음 쓰는 전문 용어는 한국어 풀이를 앞세운다. 고대어 명칭이나 비문은 쓰지 않는다.

## 규모와 전개 분량의 비교 {#proportion}

<!--
@evidence obligations/core/common.md#proportionate-development 아래 열 파일·52 H2의 생성 표와 H2별 분포를 사물 역할의 prototype 재사용에 대조했다. 기와·양개 문짝·수반은 기존 상세 단면을 유지하고 첨필·봉헌판은 얇은 부재만 정했으며 portable의 13 H2는 한 방 전용 복제 대신 다방 재사용을 맡는다. 재생성 전 기준은 Git `111dba96^:experimental/ancient-civic-temple/docs/models/temple-fit-out.md`의 실제 blob을 같은 계수식으로 다시 재어 17 H2·14,799자로 검증했다.
@evidenceReview obligations/core/common.md#proportionate-development #78feb28 열 파일 52 H2의 본문 분량 표와 과거 17 H2의 비교 근거를 읽고 prototype 재사용과 별도 소비자를 가진 H2 분할을 규모 판단에 적용했는지 확인했다.
-->

현재 모델 population의 파일·H2·본문 분량은 아래 self-check 생성 표로 고정한다. 본문 문자는 HTML 주석과 공백을 빼고 제목은 포함한 유니코드 코드 포인트 수다. 표에 없는 파일, 중복 파일, 낡은 행은 self-check 실패로 처리한다.

| 모델 파일 | H2 | 주석·공백 제외 본문 문자 수 |
| --- | ---: | ---: |
| cladding.md | 2 | 3665 |
| columns.md | 2 | 2082 |
| entablature.md | 5 | 5684 |
| fixtures.md | 10 | 9010 |
| landscape.md | 4 | 3867 |
| openings.md | 4 | 4445 |
| portable.md | 13 | 10661 |
| ritual.md | 3 | 2227 |
| scale.md | 3 | 7518 |
| wares.md | 6 | 5357 |
| 합계 | 52 | 54516 |

재생성 전 원본은 작업 트리에 없지만 Git `111dba96^:experimental/ancient-civic-temple/docs/models/temple-fit-out.md`에 남아 있다. 현재 계정의 `modelDocumentBodyLength`와 같은 방식으로 해당 blob의 HTML 주석·공백을 빼고 제목을 포함해 다시 세면 한 파일·17 H2·14,799자다. 그 H2 목록에는 `Column prototype`, `Door prototype`, `Roof tile prototype`이 각각 한 번씩 있어 당시 기둥·문짝·기와를 한 절로 묶은 기록도 확인된다. 현재 판은 문틀·양개·외개·창틀, 주랑·포치 원주, 평기와·용마루를 따로 두어 서로 다른 소비자와 변경 경로를 가진 결정이 각자 주소를 가진다.

H2별 분량 순위는 self-check의 `model H2 ranks` 출력에서 매번 다시 읽는다. 수목·이웃집의 위치와 잎 규칙을 확정한 이번 설계에서도 한 번 적은 순위를 고정값처럼 재사용하지 않는다. [build-scope](../../settings/00-delivery.md#build-scope)가 models에 배정한 기둥·문짝·문틀·기와·수반·제단·가구·용기·식생·이웃 외피 prototype은 모두 한 H2 이상을 가진다. 설계와 source 사이의 분량은 비교하지 않으며 모든 H2가 modelSources에서 실현되는지는 그 분기가 열린 뒤 따로 센다.
