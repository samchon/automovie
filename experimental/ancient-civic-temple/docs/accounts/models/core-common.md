# 모델 설계 population의 공통 의무

## 파일 역할과 모델 납품 {#file-roles}

<!--
@evidence obligations/core/common.md#purpose-fit 아홉 모델 파일을 건물 부재·상설 가구·손에 드는 비품·대지 개체로 대조했다. portable이 없으면 벤치·수레·직물·작성 도구의 원형이, fixtures·wares가 없으면 제단·선반과 그 위 도기의 원형이 사라진다. 공통 축척·관절·검토 기준은 별도 생산 계약이 맡는다.
@evidenceReview obligations/core/common.md#purpose-fit #7b32c66 아홉 원형 파일 각각의 역할을 본문 링크로 확인하고 공통 기준 세 항목은 원형 파일 수가 아닌 계약 claim으로 세는지 대조했다.
-->

이 population은 한 단층 시민 신전과 그 대지가 소비할 독립 부재의 blocking prototype을 설계한다. [모델 원칙](../../contracts/principles-models.md)은 공통 축척·UV0를 49개 원형 H2 각각에 요구한다. [모델 의무](../../contracts/obligations-models.md)는 관절 역할과 중립 검토 판을 맡는다. 원형 파일들은 각자 형상과 접합을 소유한다.

[columns](../../models/columns.md)는 주랑과 포치의 원형 석주를, [entablature](../../models/entablature.md)는 그 위의 보·포치 박공 트림·서까래·제실 트러스·낮은 천장 보를 소유한다. 둘이 나뉘어 있어 기둥 높이와 보 윗면, 서까래 깊이, 지붕 하부가 한 산술 연쇄로 읽히고, 하나만 남으면 지붕이 기둥에서 뜨거나 주랑 천장이 slab 아랫면만 보인다. [openings](../../models/openings.md)는 판정된 여덟 문과 여덟 채광구의 void를 채우는 문틀·문짝·창틀을 소유하며 관절을 가진 유일한 모델이 여기 있다.

[cladding](../../models/cladding.md)은 합성 지붕 조각 위의 기와와 용마루 반복 단위를, [fixtures](../../models/fixtures.md)는 분수·제단·감실·등잔대·탁자·선반·책상·스툴·궤처럼 방의 용도를 읽히게 하는 설비와 가구를, [wares](../../models/wares.md)는 그 위와 안에 놓이는 항아리·그릇·바구니·두루마리를 소유한다. fixtures와 wares를 합치면 가구와 그 위 용기의 치수 관계가 한 파일 안의 비교로 숨고, 나누어 두면 칸 선반과 두루마리처럼 서로를 받는 두 결정이 각자 주소를 갖는다. [landscape](../../models/landscape.md)는 대지 배치 구역에 놓일 수목·풀·이웃 외피를 소유해 spaces 대지가 남긴 구역을 실제 개체 prototype으로 채울 수 있게 한다.

[portable](../../models/portable.md)은 벤치·소형 등잔·두 자리 항아리 받침·멜대·손수레·물동이·화분·봉헌판·쟁반·직물·첨필·필기판·끈 뭉치의 재사용 prototype을 소유한다. [ritual](../../models/ritual.md)은 낮은 향로·바닥 좌구·한 자리 항아리 받침의 별도 실루엣을 소유한다. 각 방의 복제 수는 instances가 정한다. 기록실과 보관실의 궤는 [같은 기본 원형](../../models/fixtures.md#chest)을 쓴다.

## 모델과 다른 제작 분기의 경계 {#layer-routing}

<!--
@evidence obligations/core/common.md#layer-boundary 모델 49개 H2 각각이 형상·점유와 local 축척·UV 원칙에 답하고, 관절 역할·중립 검토 판의 population 결론은 별도 의무 계정이 맡는다. 재료 반응은 materials, 방 안 복제·접촉은 instances, 물의 흐름과 빛은 systems, 외피·지면은 spaces가 맡는다.
@evidenceReview obligations/core/common.md#layer-boundary #5271f94 원형마다 배정된 점유·UV 답과 두 의무 항목의 전체 역할 결산을 구분하고 재료·배치·시스템·공간 실체가 모델 설계에 중복되지 않는지 확인했다.
-->

원형을 정의하는 49개 H2는 각각 자기 prototype의 형상, part와 표면 ID, 가려진 접촉면과 빈 공간, 점유 범위와 배치 기준점을 결정한다. [축척·UV0 원칙](../../contracts/principles-models.md#temple-reference-scale)은 원형별 checklist라 각 H2가 자신의 점유와 투영을 따로 답한다. [관절·검토 판 의무](../../contracts/obligations-models.md)는 전체 모집단의 역할 배정과 관찰 계획을 결산한다. prototype 안에서 반복되는 부재의 개수·간격·첫 위치나 위상은 해당 모델 H2가 정하고, 실제 건물 안의 prototype 복제 수와 공간 경계에 따른 잘림은 instances가 판정된 공간과 합성 지붕에서 유도한다. 방 안 prototype의 배치와 다른 물체와의 실제 접촉도 instances가 정한다. 재료 결속·텍스처 반복 길이·fallback 색은 [재료 결속](../../materials/10-model-bindings.md#binding-map)이 소유하고, 비트맵 선택·색과 거칠기의 최종 반응도 materials가 소유한다.

분수의 흐름·빛 반사와 등잔의 상태 변화는 systems·motions의 후속 결정이며 모델은 정지 형상만 낸다. 외벽 기단과 코핑, 문턱 바닥, 대지 지면과 먼 능선은 spaces가 이미 소유한 실체라 모델 population에 다시 들이지 않는다. 문틀이 문턱 바닥을, 이웃 외피가 포장 구획을, 창틀이 벽 void 위치를 새로 만들지 않는 것이 각 H2에서 이 경계를 지키는 방식이다.

아래 표는 아홉 원형 문서의 각 H2를 part별로 펼친 source 입력 색인이다. 각 행은 원본 H2 링크·본문 문자 수·SHA-256을 보존하고, 값이 바뀌면 `self-check --sync-accounts`에서 기계적으로 바뀐다. self-check는 원본 H2와 형상 part 주소 전체의 정확한 일치를 검사한다. 이 색인은 빠진 설계 결정을 `0`으로 인증하지 않는다. 리뷰어와 저작자는 링크된 원본 H2의 위치·크기·단면·분할·접합을 판정하고 구현 중 빠진 선택을 찾으면 해당 H2를 먼저 고친다.

| 모델 H2 | part | 본문 문자 수 | 본문 SHA-256 |
| --- | --- | ---: | --- |
| [cladding/roof-tile](../../models/cladding.md#roof-tile) | `tegula` | 2564 | `3a345034f6bcb38637419d3385a57aa6bbd3b6d17725b9d39df582dc26ef32b9` |
| [cladding/roof-tile](../../models/cladding.md#roof-tile) | `imbrex` | 2564 | `3a345034f6bcb38637419d3385a57aa6bbd3b6d17725b9d39df582dc26ef32b9` |
| [cladding/ridge-tile](../../models/cladding.md#ridge-tile) | `ridge` | 2289 | `69d781a565bc3cfe169ff39069051c2fd3aa4f485c2fe634ef20f17d67dc0ca0` |
| [columns/colonnade-column](../../models/columns.md#colonnade-column) | `plinth` | 1682 | `243793fb2bb4553afdf2345b1236759c9b9cc8989f448ac4e389d15bc30cb0b9` |
| [columns/colonnade-column](../../models/columns.md#colonnade-column) | `base` | 1682 | `243793fb2bb4553afdf2345b1236759c9b9cc8989f448ac4e389d15bc30cb0b9` |
| [columns/colonnade-column](../../models/columns.md#colonnade-column) | `shaft` | 1682 | `243793fb2bb4553afdf2345b1236759c9b9cc8989f448ac4e389d15bc30cb0b9` |
| [columns/colonnade-column](../../models/columns.md#colonnade-column) | `capital` | 1682 | `243793fb2bb4553afdf2345b1236759c9b9cc8989f448ac4e389d15bc30cb0b9` |
| [columns/porch-column](../../models/columns.md#porch-column) | `plinth` | 1065 | `64a46a0bb32628c74280194f6743f9690c50766b197a61357b63c64baa26afb6` |
| [columns/porch-column](../../models/columns.md#porch-column) | `base` | 1065 | `64a46a0bb32628c74280194f6743f9690c50766b197a61357b63c64baa26afb6` |
| [columns/porch-column](../../models/columns.md#porch-column) | `shaft` | 1065 | `64a46a0bb32628c74280194f6743f9690c50766b197a61357b63c64baa26afb6` |
| [columns/porch-column](../../models/columns.md#porch-column) | `capital` | 1065 | `64a46a0bb32628c74280194f6743f9690c50766b197a61357b63c64baa26afb6` |
| [entablature/colonnade-beam](../../models/entablature.md#colonnade-beam) | `timber` | 1833 | `232fe44d3388ccd58b075aaeb0a22b2e4c0fe2b48d169dd7d0ed5362ef7ee963` |
| [entablature/rafter](../../models/entablature.md#rafter) | `timber` | 1939 | `256d2d31dde22f6b59be2e5bc1421121cddc8ec80bab85d8c130da899f07d497` |
| [entablature/porch-entablature](../../models/entablature.md#porch-entablature) | `beam` | 1363 | `e8200d3105fc9346b6518db8249e6cde047d291dcc1a6541e8948866776dd0f3` |
| [entablature/porch-entablature](../../models/entablature.md#porch-entablature) | `cornice` | 1363 | `e8200d3105fc9346b6518db8249e6cde047d291dcc1a6541e8948866776dd0f3` |
| [entablature/porch-entablature](../../models/entablature.md#porch-entablature) | `raking-trim` | 1363 | `e8200d3105fc9346b6518db8249e6cde047d291dcc1a6541e8948866776dd0f3` |
| [entablature/sanctuary-truss](../../models/entablature.md#sanctuary-truss) | `tie-beam` | 1649 | `ecc188373ea66e5b0622c30d50904562fffcbd93f5ca5efe5d94514c15e47876` |
| [entablature/sanctuary-truss](../../models/entablature.md#sanctuary-truss) | `principal` | 1649 | `ecc188373ea66e5b0622c30d50904562fffcbd93f5ca5efe5d94514c15e47876` |
| [entablature/sanctuary-truss](../../models/entablature.md#sanctuary-truss) | `king-post` | 1649 | `ecc188373ea66e5b0622c30d50904562fffcbd93f5ca5efe5d94514c15e47876` |
| [entablature/sanctuary-truss](../../models/entablature.md#sanctuary-truss) | `strut` | 1649 | `ecc188373ea66e5b0622c30d50904562fffcbd93f5ca5efe5d94514c15e47876` |
| [entablature/ceiling-joist](../../models/entablature.md#ceiling-joist) | `timber` | 756 | `9d13e5b3961c53b244828008b4daeede20aa727fc3351f8d8956e413f71bd1df` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `step` | 1919 | `e764ee2ca4a1d0aa9f315d455039ea3450f9f7058ceb2ee22828ab5fedb1271c` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `rim` | 1919 | `e764ee2ca4a1d0aa9f315d455039ea3450f9f7058ceb2ee22828ab5fedb1271c` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `basin-inner` | 1919 | `e764ee2ca4a1d0aa9f315d455039ea3450f9f7058ceb2ee22828ab5fedb1271c` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `water` | 1919 | `e764ee2ca4a1d0aa9f315d455039ea3450f9f7058ceb2ee22828ab5fedb1271c` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `ripple` | 1919 | `e764ee2ca4a1d0aa9f315d455039ea3450f9f7058ceb2ee22828ab5fedb1271c` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `nozzle` | 1919 | `e764ee2ca4a1d0aa9f315d455039ea3450f9f7058ceb2ee22828ab5fedb1271c` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `jet` | 1919 | `e764ee2ca4a1d0aa9f315d455039ea3450f9f7058ceb2ee22828ab5fedb1271c` |
| [fixtures/altar](../../models/fixtures.md#altar) | `step` | 1130 | `784cbaabdac1abf0a9b9b135e1cd6701fb5c8cf4e2be2d5d3513ec14cd8459ee` |
| [fixtures/altar](../../models/fixtures.md#altar) | `top` | 1130 | `784cbaabdac1abf0a9b9b135e1cd6701fb5c8cf4e2be2d5d3513ec14cd8459ee` |
| [fixtures/altar](../../models/fixtures.md#altar) | `support` | 1130 | `784cbaabdac1abf0a9b9b135e1cd6701fb5c8cf4e2be2d5d3513ec14cd8459ee` |
| [fixtures/niche](../../models/fixtures.md#niche) | `plinth` | 1406 | `256315b9e17e56129151cc84642a58878d03f40221d0c225d7ba1623d04460ff` |
| [fixtures/niche](../../models/fixtures.md#niche) | `body` | 1406 | `256315b9e17e56129151cc84642a58878d03f40221d0c225d7ba1623d04460ff` |
| [fixtures/niche](../../models/fixtures.md#niche) | `recess-frame` | 1406 | `256315b9e17e56129151cc84642a58878d03f40221d0c225d7ba1623d04460ff` |
| [fixtures/niche](../../models/fixtures.md#niche) | `recess` | 1406 | `256315b9e17e56129151cc84642a58878d03f40221d0c225d7ba1623d04460ff` |
| [fixtures/niche](../../models/fixtures.md#niche) | `cap` | 1406 | `256315b9e17e56129151cc84642a58878d03f40221d0c225d7ba1623d04460ff` |
| [fixtures/lampstand](../../models/fixtures.md#lampstand) | `foot` | 1170 | `e5d9135457da26ac312d35d61428e52436bd1af5c75d63b53d4f6ee6e740d607` |
| [fixtures/lampstand](../../models/fixtures.md#lampstand) | `stem` | 1170 | `e5d9135457da26ac312d35d61428e52436bd1af5c75d63b53d4f6ee6e740d607` |
| [fixtures/lampstand](../../models/fixtures.md#lampstand) | `knop` | 1170 | `e5d9135457da26ac312d35d61428e52436bd1af5c75d63b53d4f6ee6e740d607` |
| [fixtures/lampstand](../../models/fixtures.md#lampstand) | `dish` | 1170 | `e5d9135457da26ac312d35d61428e52436bd1af5c75d63b53d4f6ee6e740d607` |
| [fixtures/offering-table](../../models/fixtures.md#offering-table) | `top` | 819 | `bd3c07c5d9e775f9dc8629d6564dee904dbff6ef4f1b3c79f3ca6dc6bb604b2c` |
| [fixtures/offering-table](../../models/fixtures.md#offering-table) | `trestle` | 819 | `bd3c07c5d9e775f9dc8629d6564dee904dbff6ef4f1b3c79f3ca6dc6bb604b2c` |
| [fixtures/display-shelf](../../models/fixtures.md#display-shelf) | `side` | 1183 | `ce327185a9b19fc2da93c8ef06b12fa3908aeef3e2f27a319e7a7580a12360cf` |
| [fixtures/display-shelf](../../models/fixtures.md#display-shelf) | `board` | 1183 | `ce327185a9b19fc2da93c8ef06b12fa3908aeef3e2f27a319e7a7580a12360cf` |
| [fixtures/desk](../../models/fixtures.md#desk) | `top` | 904 | `1e2c3994c9195ab2f8e52948eff9b4e889807f8b3563d3347a9161801ca2a3a5` |
| [fixtures/desk](../../models/fixtures.md#desk) | `leg` | 904 | `1e2c3994c9195ab2f8e52948eff9b4e889807f8b3563d3347a9161801ca2a3a5` |
| [fixtures/desk](../../models/fixtures.md#desk) | `stretcher` | 904 | `1e2c3994c9195ab2f8e52948eff9b4e889807f8b3563d3347a9161801ca2a3a5` |
| [fixtures/stool](../../models/fixtures.md#stool) | `seat` | 622 | `b91df3d8d665143d35ab7421e3ecafb2f963b031d120cf86cc8cb6137439dab7` |
| [fixtures/stool](../../models/fixtures.md#stool) | `leg` | 622 | `b91df3d8d665143d35ab7421e3ecafb2f963b031d120cf86cc8cb6137439dab7` |
| [fixtures/stool](../../models/fixtures.md#stool) | `stretcher` | 622 | `b91df3d8d665143d35ab7421e3ecafb2f963b031d120cf86cc8cb6137439dab7` |
| [fixtures/scroll-shelf](../../models/fixtures.md#scroll-shelf) | `frame` | 1151 | `6df588a9d61e89c8e5133660ce3b8b5d5844685c91dfaa187c5528826400d510` |
| [fixtures/scroll-shelf](../../models/fixtures.md#scroll-shelf) | `board` | 1151 | `6df588a9d61e89c8e5133660ce3b8b5d5844685c91dfaa187c5528826400d510` |
| [fixtures/scroll-shelf](../../models/fixtures.md#scroll-shelf) | `divider` | 1151 | `6df588a9d61e89c8e5133660ce3b8b5d5844685c91dfaa187c5528826400d510` |
| [fixtures/chest](../../models/fixtures.md#chest) | `body` | 1765 | `6de4156548a4862c484078dc63ffc28ea305dd5b4acb888b5a53aabe87641239` |
| [fixtures/chest](../../models/fixtures.md#chest) | `lid` | 1765 | `6de4156548a4862c484078dc63ffc28ea305dd5b4acb888b5a53aabe87641239` |
| [fixtures/chest](../../models/fixtures.md#chest) | `hasp` | 1765 | `6de4156548a4862c484078dc63ffc28ea305dd5b4acb888b5a53aabe87641239` |
| [fixtures/chest](../../models/fixtures.md#chest) | `strap` | 1765 | `6de4156548a4862c484078dc63ffc28ea305dd5b4acb888b5a53aabe87641239` |
| [landscape/cypress](../../models/landscape.md#cypress) | `trunk` | 1137 | `b100e286967364275fcc4e1c83e3aa5a076e9c50c51a2e2a930d2fd2e237a768` |
| [landscape/cypress](../../models/landscape.md#cypress) | `crown` | 1137 | `b100e286967364275fcc4e1c83e3aa5a076e9c50c51a2e2a930d2fd2e237a768` |
| [landscape/broad-tree](../../models/landscape.md#broad-tree) | `trunk` | 1333 | `8049b9b2c88e74f4fa7b522e91ebbf19eb7c72c1370af2fc14dca793c71d2fd6` |
| [landscape/broad-tree](../../models/landscape.md#broad-tree) | `branch` | 1333 | `8049b9b2c88e74f4fa7b522e91ebbf19eb7c72c1370af2fc14dca793c71d2fd6` |
| [landscape/broad-tree](../../models/landscape.md#broad-tree) | `crown` | 1333 | `8049b9b2c88e74f4fa7b522e91ebbf19eb7c72c1370af2fc14dca793c71d2fd6` |
| [landscape/grass-tuft](../../models/landscape.md#grass-tuft) | `blade` | 879 | `58bc461cba4a7cdda8bb1e4eb6075329bc2f557da4bd2efb1338ad6ab045a3ee` |
| [landscape/neighbor-house](../../models/landscape.md#neighbor-house) | `wall` | 1881 | `766f81bc1879934dffdc15ddfebaa343ec2179a3dcdb3ffbf11756ff7a82b266` |
| [landscape/neighbor-house](../../models/landscape.md#neighbor-house) | `plinth` | 1881 | `766f81bc1879934dffdc15ddfebaa343ec2179a3dcdb3ffbf11756ff7a82b266` |
| [landscape/neighbor-house](../../models/landscape.md#neighbor-house) | `roof` | 1881 | `766f81bc1879934dffdc15ddfebaa343ec2179a3dcdb3ffbf11756ff7a82b266` |
| [landscape/neighbor-house](../../models/landscape.md#neighbor-house) | `recess` | 1881 | `766f81bc1879934dffdc15ddfebaa343ec2179a3dcdb3ffbf11756ff7a82b266` |
| [openings/door-frame](../../models/openings.md#door-frame) | `lining` | 1316 | `9c896531e31e272480389d40ef13324bd025a2c81be220605877ed9e768dce85` |
| [openings/door-frame](../../models/openings.md#door-frame) | `surround` | 1316 | `9c896531e31e272480389d40ef13324bd025a2c81be220605877ed9e768dce85` |
| [openings/double-door-leaf](../../models/openings.md#double-door-leaf) | `frame` | 2187 | `709e9621ea9b5c5018a467a2d544209684004abb7a5e46bcf3ca0984d09efa71` |
| [openings/double-door-leaf](../../models/openings.md#double-door-leaf) | `panel` | 2187 | `709e9621ea9b5c5018a467a2d544209684004abb7a5e46bcf3ca0984d09efa71` |
| [openings/double-door-leaf](../../models/openings.md#double-door-leaf) | `plate` | 2187 | `709e9621ea9b5c5018a467a2d544209684004abb7a5e46bcf3ca0984d09efa71` |
| [openings/double-door-leaf](../../models/openings.md#double-door-leaf) | `pin` | 2187 | `709e9621ea9b5c5018a467a2d544209684004abb7a5e46bcf3ca0984d09efa71` |
| [openings/double-door-leaf](../../models/openings.md#double-door-leaf) | `ring` | 2187 | `709e9621ea9b5c5018a467a2d544209684004abb7a5e46bcf3ca0984d09efa71` |
| [openings/double-door-leaf](../../models/openings.md#double-door-leaf) | `hinge` | 2187 | `709e9621ea9b5c5018a467a2d544209684004abb7a5e46bcf3ca0984d09efa71` |
| [openings/single-door-leaf](../../models/openings.md#single-door-leaf) | `board` | 1808 | `dc1dfa2069b62aaeeb34e4105fb7653472b2bbd9b9defa585255b8d2350f966c` |
| [openings/single-door-leaf](../../models/openings.md#single-door-leaf) | `batten` | 1808 | `dc1dfa2069b62aaeeb34e4105fb7653472b2bbd9b9defa585255b8d2350f966c` |
| [openings/single-door-leaf](../../models/openings.md#single-door-leaf) | `strap` | 1808 | `dc1dfa2069b62aaeeb34e4105fb7653472b2bbd9b9defa585255b8d2350f966c` |
| [openings/single-door-leaf](../../models/openings.md#single-door-leaf) | `pin` | 1808 | `dc1dfa2069b62aaeeb34e4105fb7653472b2bbd9b9defa585255b8d2350f966c` |
| [openings/single-door-leaf](../../models/openings.md#single-door-leaf) | `ring` | 1808 | `dc1dfa2069b62aaeeb34e4105fb7653472b2bbd9b9defa585255b8d2350f966c` |
| [openings/window-frame](../../models/openings.md#window-frame) | `lining` | 841 | `ca3faaa6589a7a846284c820f0a81cb6ec794d96d6d88ffcbc2e0c673046ad91` |
| [openings/window-frame](../../models/openings.md#window-frame) | `surround` | 841 | `ca3faaa6589a7a846284c820f0a81cb6ec794d96d6d88ffcbc2e0c673046ad91` |
| [portable/bench](../../models/portable.md#bench) | `seat` | 857 | `df4c494a73f6db6a5cdc41f11eaecff191a81a1cbb815fff469425d2bfeef3dd` |
| [portable/bench](../../models/portable.md#bench) | `pier` | 857 | `df4c494a73f6db6a5cdc41f11eaecff191a81a1cbb815fff469425d2bfeef3dd` |
| [portable/portable-lamp](../../models/portable.md#portable-lamp) | `foot` | 1060 | `d0729636e7da99df4db9febee2fc3fd39c450eeebe4ecc3df2d6a07299ab59db` |
| [portable/portable-lamp](../../models/portable.md#portable-lamp) | `stem` | 1060 | `d0729636e7da99df4db9febee2fc3fd39c450eeebe4ecc3df2d6a07299ab59db` |
| [portable/portable-lamp](../../models/portable.md#portable-lamp) | `dish` | 1060 | `d0729636e7da99df4db9febee2fc3fd39c450eeebe4ecc3df2d6a07299ab59db` |
| [portable/jar-rack](../../models/portable.md#jar-rack) | `top` | 1285 | `7a19235c42bd0b32363e4de206c386480a37926905c206609cb0d3b56615fddb` |
| [portable/jar-rack](../../models/portable.md#jar-rack) | `leg` | 1285 | `7a19235c42bd0b32363e4de206c386480a37926905c206609cb0d3b56615fddb` |
| [portable/jar-rack](../../models/portable.md#jar-rack) | `well` | 1285 | `7a19235c42bd0b32363e4de206c386480a37926905c206609cb0d3b56615fddb` |
| [portable/carrying-yoke](../../models/portable.md#carrying-yoke) | `beam` | 817 | `4d47c53c24b2ece86d783651a36f242016fb123d6cf99a84e90df2d4583b1f3c` |
| [portable/carrying-yoke](../../models/portable.md#carrying-yoke) | `hook` | 817 | `4d47c53c24b2ece86d783651a36f242016fb123d6cf99a84e90df2d4583b1f3c` |
| [portable/handcart](../../models/portable.md#handcart) | `deck` | 1481 | `c40c1652d39b0b226c2d5a3ea1e093d8ecac7bdb01b1b8f0f38fbff8ce481f81` |
| [portable/handcart](../../models/portable.md#handcart) | `axle` | 1481 | `c40c1652d39b0b226c2d5a3ea1e093d8ecac7bdb01b1b8f0f38fbff8ce481f81` |
| [portable/handcart](../../models/portable.md#handcart) | `wheel` | 1481 | `c40c1652d39b0b226c2d5a3ea1e093d8ecac7bdb01b1b8f0f38fbff8ce481f81` |
| [portable/handcart](../../models/portable.md#handcart) | `handle` | 1481 | `c40c1652d39b0b226c2d5a3ea1e093d8ecac7bdb01b1b8f0f38fbff8ce481f81` |
| [portable/handcart](../../models/portable.md#handcart) | `support` | 1481 | `c40c1652d39b0b226c2d5a3ea1e093d8ecac7bdb01b1b8f0f38fbff8ce481f81` |
| [portable/bucket](../../models/portable.md#bucket) | `body` | 1411 | `5a276e9df7d3287965343a0b7636a9e9e1c0bd380e06fd1c7f7de612a6270c56` |
| [portable/bucket](../../models/portable.md#bucket) | `handle` | 1411 | `5a276e9df7d3287965343a0b7636a9e9e1c0bd380e06fd1c7f7de612a6270c56` |
| [portable/planter](../../models/portable.md#planter) | `pot` | 1081 | `915cdfa44fa70b5b029b839ed14980e3c5fd00ad21609f559ef068db946b951b` |
| [portable/planter](../../models/portable.md#planter) | `soil` | 1081 | `915cdfa44fa70b5b029b839ed14980e3c5fd00ad21609f559ef068db946b951b` |
| [portable/votive-plaque](../../models/portable.md#votive-plaque) | `base` | 726 | `96ced5a3aa86b08bd19eefa3ba3ecba758a843af4a90319987cca53da9e96f05` |
| [portable/votive-plaque](../../models/portable.md#votive-plaque) | `slab` | 726 | `96ced5a3aa86b08bd19eefa3ba3ecba758a843af4a90319987cca53da9e96f05` |
| [portable/offering-tray](../../models/portable.md#offering-tray) | `floor` | 1025 | `f7b61d63b0ccc364b3482132402c75ca27004d2876864e80f5fde0334005874a` |
| [portable/offering-tray](../../models/portable.md#offering-tray) | `rim` | 1025 | `f7b61d63b0ccc364b3482132402c75ca27004d2876864e80f5fde0334005874a` |
| [portable/textile](../../models/portable.md#textile) | `cloth` | 1125 | `b1c1b3a7ec4142531b3752e29dce71515d93b3b68494a53144abc1e67b8c2d54` |
| [portable/stylus](../../models/portable.md#stylus) | `shaft` | 805 | `06b08890be02bf7cfb40eaf5e7a3ac81194cd3343cdf90ff702ec4aa451f3d78` |
| [portable/stylus](../../models/portable.md#stylus) | `tip` | 805 | `06b08890be02bf7cfb40eaf5e7a3ac81194cd3343cdf90ff702ec4aa451f3d78` |
| [portable/writing-tablet](../../models/portable.md#writing-tablet) | `frame` | 1007 | `0c4c6f5504ac9c355e95c4fa765fb7d1693a7c2eca5e669fc60d5d1819fc9f8c` |
| [portable/writing-tablet](../../models/portable.md#writing-tablet) | `writing-face` | 1007 | `0c4c6f5504ac9c355e95c4fa765fb7d1693a7c2eca5e669fc60d5d1819fc9f8c` |
| [portable/rope-coil](../../models/portable.md#rope-coil) | `rope` | 946 | `872134105689dc909140e4358799940900d353cbcc5c0df5f1d2ea9e2e394b97` |
| [portable/rope-coil](../../models/portable.md#rope-coil) | `tie` | 946 | `872134105689dc909140e4358799940900d353cbcc5c0df5f1d2ea9e2e394b97` |
| [ritual/censer](../../models/ritual.md#censer) | `foot` | 1069 | `f0ac893a912ff6631bce2a8fcb44c592ef9a0230b628d79e8a45e50427574077` |
| [ritual/censer](../../models/ritual.md#censer) | `stem` | 1069 | `f0ac893a912ff6631bce2a8fcb44c592ef9a0230b628d79e8a45e50427574077` |
| [ritual/censer](../../models/ritual.md#censer) | `cup` | 1069 | `f0ac893a912ff6631bce2a8fcb44c592ef9a0230b628d79e8a45e50427574077` |
| [ritual/censer](../../models/ritual.md#censer) | `ash` | 1069 | `f0ac893a912ff6631bce2a8fcb44c592ef9a0230b628d79e8a45e50427574077` |
| [ritual/censer](../../models/ritual.md#censer) | `incense` | 1069 | `f0ac893a912ff6631bce2a8fcb44c592ef9a0230b628d79e8a45e50427574077` |
| [ritual/floor-cushion](../../models/ritual.md#floor-cushion) | `base` | 929 | `312eea5a463323485ae8eb6615e40d73906922261c69a1be0df552273d6149c5` |
| [ritual/floor-cushion](../../models/ritual.md#floor-cushion) | `pad` | 929 | `312eea5a463323485ae8eb6615e40d73906922261c69a1be0df552273d6149c5` |
| [ritual/floor-cushion](../../models/ritual.md#floor-cushion) | `fold` | 929 | `312eea5a463323485ae8eb6615e40d73906922261c69a1be0df552273d6149c5` |
| [ritual/jar-stand](../../models/ritual.md#jar-stand) | `foot` | 892 | `31d2d74a9883705344ddc4c6c5eec68718bd05538ed1087544bdb716c12a5142` |
| [ritual/jar-stand](../../models/ritual.md#jar-stand) | `post` | 892 | `31d2d74a9883705344ddc4c6c5eec68718bd05538ed1087544bdb716c12a5142` |
| [ritual/jar-stand](../../models/ritual.md#jar-stand) | `ring` | 892 | `31d2d74a9883705344ddc4c6c5eec68718bd05538ed1087544bdb716c12a5142` |
| [wares/storage-jar](../../models/wares.md#storage-jar) | `body` | 980 | `87a2e2f51cbd07854f5f056fc0fe5fc1d94c1733f8563599119ab9418ac817a3` |
| [wares/storage-jar](../../models/wares.md#storage-jar) | `handle` | 980 | `87a2e2f51cbd07854f5f056fc0fe5fc1d94c1733f8563599119ab9418ac817a3` |
| [wares/carry-jar](../../models/wares.md#carry-jar) | `body` | 1156 | `8c2d94c542bdbae448db47935cdd08bd096ff8f4d63c3a4943080b303decf5e9` |
| [wares/carry-jar](../../models/wares.md#carry-jar) | `handle` | 1156 | `8c2d94c542bdbae448db47935cdd08bd096ff8f4d63c3a4943080b303decf5e9` |
| [wares/small-vessel](../../models/wares.md#small-vessel) | `body` | 1000 | `b6c59020906b332aba0a9ebf20bc817e7bb97d58658e20e4c00fda31e951fbdf` |
| [wares/small-vessel](../../models/wares.md#small-vessel) | `handle` | 1000 | `b6c59020906b332aba0a9ebf20bc817e7bb97d58658e20e4c00fda31e951fbdf` |
| [wares/offering-bowl](../../models/wares.md#offering-bowl) | `bowl` | 879 | `125a9fea902026bff394c8841b059ebd584754a2293b0202d8446e046bb14caa` |
| [wares/basket](../../models/wares.md#basket) | `wall` | 1362 | `b326a00ad69da93c9cc945cd30c881427ca16bf52c7791953fd135ae387759a8` |
| [wares/basket](../../models/wares.md#basket) | `rim` | 1362 | `b326a00ad69da93c9cc945cd30c881427ca16bf52c7791953fd135ae387759a8` |
| [wares/basket](../../models/wares.md#basket) | `floor` | 1362 | `b326a00ad69da93c9cc945cd30c881427ca16bf52c7791953fd135ae387759a8` |
| [wares/scroll](../../models/wares.md#scroll) | `sheet` | 1834 | `9983f9ca96c881465a63dbfebc994e3fc5361c8a782c9cd32795e25274a1341c` |
| [wares/scroll](../../models/wares.md#scroll) | `sheet-1` | 1834 | `9983f9ca96c881465a63dbfebc994e3fc5361c8a782c9cd32795e25274a1341c` |
| [wares/scroll](../../models/wares.md#scroll) | `sheet-2` | 1834 | `9983f9ca96c881465a63dbfebc994e3fc5361c8a782c9cd32795e25274a1341c` |
| [wares/scroll](../../models/wares.md#scroll) | `sheet-3` | 1834 | `9983f9ca96c881465a63dbfebc994e3fc5361c8a782c9cd32795e25274a1341c` |
| [wares/scroll](../../models/wares.md#scroll) | `tie` | 1834 | `9983f9ca96c881465a63dbfebc994e3fc5361c8a782c9cd32795e25274a1341c` |

## 작업 언어와 식별 표기 {#working-language}

<!--
@evidence obligations/core/common.md#production-language 모델 결정과 실패 조건은 한국어 기술 서술체로 읽히고, plinth·tegula·hinge.<판 ID> 같은 part·표면·인터페이스 식별자와 anchor, API 성격의 용어만 원문을 유지한다. plumb cut처럼 처음 쓰는 기술 용어에는 한국어 풀이가 붙어 있다.
@evidenceReview obligations/core/common.md#production-language #3ef4142 치수와 실패 조건의 한국어 문장, part·관절·상태의 원문 식별자, plumb cut의 첫 한국어 풀이를 실제 표기와 대조했다.
-->

settings의 [작업 언어](../../settings/00-delivery.md#working-language)에 따라 모델 문서는 현대 표준 한국어로 쓴다. 치수·높이·실패 조건은 한국어 문장 안에서 m 단위 숫자로 적는다. part와 표면 이름(`plinth`, `shaft`, `tegula`, `imbrex`, `lining`, `surround`), 관절 인터페이스(`hinge.<판 ID>`), 상태 이름(`closed`, `open`), 문 ID(`door-entry` 등)와 anchor는 source와 같은 식별자라 원문을 유지한다.

분기 이름(materials, instances, systems)과 prototype, negative space, blocking geometry처럼 계약에서 온 용어는 문맥상 뜻이 드러나게 쓰고, 서까래 끝의 "연직으로 잘린 면(plumb cut)"처럼 처음 쓰는 전문 용어는 한국어 풀이를 앞세운다. 고대어 명칭이나 비문은 쓰지 않는다.

## 규모와 전개 분량의 비교 {#proportion}

<!--
@evidence obligations/core/common.md#proportionate-development 아래 아홉 원형 파일·49 H2의 생성 표와 H2별 분포를 사물 역할의 prototype 재사용에 대조했다. 기와·양개 문짝·수반은 기존 상세 단면을 유지하고 첨필·봉헌판은 얇은 부재만 정했으며 portable의 13 H2는 다방 재사용을 맡는다. 공통 규칙 세 H2는 별도 계약에 있으며 원형 분량에 섞지 않는다. 재생성 전 기준은 Git `111dba96^:experimental/ancient-civic-temple/docs/models/temple-fit-out.md`의 실제 blob을 같은 계수식으로 다시 재어 17 H2·14,799자로 검증했다.
@evidenceReview obligations/core/common.md#proportionate-development #78feb28 아홉 원형 파일 49 H2의 본문 분량 표와 과거 17 H2의 비교 근거를 읽고 별도 소비자를 가진 원형 분할과 공통 계약의 경계를 확인했다.
-->

현재 모델 population의 파일·H2·본문 분량은 아래 self-check 생성 표로 고정한다. 본문 문자는 HTML 주석과 공백을 빼고 제목은 포함한 유니코드 코드 포인트 수다. 표에 없는 파일, 중복 파일, 낡은 행은 self-check 실패로 처리한다.

| 모델 파일 | H2 | 주석·공백 제외 본문 문자 수 |
| --- | ---: | ---: |
| cladding.md | 2 | 3943 |
| columns.md | 2 | 2270 |
| entablature.md | 5 | 6179 |
| fixtures.md | 10 | 10058 |
| landscape.md | 4 | 4331 |
| openings.md | 4 | 5026 |
| portable.md | 13 | 11795 |
| ritual.md | 3 | 2582 |
| wares.md | 6 | 5976 |
| 합계 | 49 | 52160 |

재생성 전 원본은 작업 트리에 없지만 Git `111dba96^:experimental/ancient-civic-temple/docs/models/temple-fit-out.md`에 남아 있다. 현재 계정의 `modelDocumentBodyLength`와 같은 방식으로 해당 blob의 HTML 주석·공백을 빼고 제목을 포함해 다시 세면 한 파일·17 H2·14,799자다. 그 H2 목록에는 `Column prototype`, `Door prototype`, `Roof tile prototype`이 각각 한 번씩 있어 당시 기둥·문짝·기와를 한 절로 묶은 기록도 확인된다. 현재 판은 문틀·양개·외개·창틀, 주랑·포치 원주, 평기와·용마루를 따로 두어 서로 다른 소비자와 변경 경로를 가진 결정이 각자 주소를 가진다.

H2별 분량 순위는 self-check의 `model H2 ranks` 출력에서 매번 다시 읽는다. 수목·이웃집의 위치와 잎 규칙을 확정한 이번 설계에서도 한 번 적은 순위를 고정값처럼 재사용하지 않는다. [build-scope](../../settings/00-delivery.md#build-scope)가 models에 배정한 기둥·문짝·문틀·기와·수반·제단·가구·용기·식생·이웃 외피 prototype은 모두 한 H2 이상을 가진다. 설계와 source 사이의 분량은 비교하지 않으며 `modelSources` evidence 단계에서는 공개 class의 원형 파일·H2 대응을 별도로 검사한다.
