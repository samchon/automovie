# 모델 설계 population의 공통 의무

## 파일 역할과 모델 납품 {#file-roles}

<!--
@evidence obligations/core/common.md#purpose-fit 여덟 파일을 build-scope가 models에 배정한 prototype 목록(기둥·문짝·문틀·기와·수반·제단·가구·용기·식생·이웃 외피)에 대조했다. scale이 없으면 각 모델이 축척·상한·관절·검토 판을 따로 고르고, columns·entablature가 없으면 주랑과 포치의 하중 연쇄와 지붕 하부가 비며, openings가 없으면 벽 void가 틀과 문짝 없이 뚫린 구멍으로 남고, cladding이 없으면 지붕이 줄무늬 판으로 읽히며, fixtures·wares가 없으면 방 용도가 공간명으로만 남고, landscape가 없으면 대지 배치 구역이 채울 개체 없이 비는 서로 다른 결손을 아래 본문에 적었다.
-->

이 population은 한 단층 시민 신전과 그 대지가 소비할 독립 부재의 blocking prototype을 설계한다. [scale](../../models/scale.md)은 공유 축척 기준과 표현 상한, 관절 인터페이스, 중립 검토 판이라는 모든 모델의 공통 기준을 소유한다. 이 파일이 없으면 각 모델이 보행 포락 대신 제각각의 크기 기준과 fidelity 주장을 쓰고 문짝의 hinge 이름과 검토 시점이 모델마다 달라진다.

[columns](../../models/columns.md)는 주랑과 포치의 원형 석주를, [entablature](../../models/entablature.md)는 그 위의 보·포치 박공 트림·서까래·제실 트러스·낮은 천장 보를 소유한다. 둘이 나뉘어 있어 기둥 높이와 보 윗면, 서까래 깊이, 지붕 하부가 한 산술 연쇄로 읽히고, 하나만 남으면 지붕이 기둥에서 뜨거나 주랑 천장이 slab 아랫면만 보인다. [openings](../../models/openings.md)는 판정된 여덟 문과 여덟 채광구의 void를 채우는 문틀·문짝·창틀을 소유하며 관절을 가진 유일한 모델이 여기 있다.

[cladding](../../models/cladding.md)은 합성 지붕 조각 위의 기와와 용마루 반복 단위를, [fixtures](../../models/fixtures.md)는 분수·제단·감실·등잔대·탁자·선반·책상·스툴·궤처럼 방의 용도를 읽히게 하는 설비와 가구를, [wares](../../models/wares.md)는 그 위와 안에 놓이는 항아리·그릇·바구니·두루마리를 소유한다. fixtures와 wares를 합치면 가구와 그 위 용기의 치수 관계가 한 파일 안의 비교로 숨고, 나누어 두면 칸 선반과 두루마리처럼 서로를 받는 두 결정이 각자 주소를 갖는다. [landscape](../../models/landscape.md)는 대지 배치 구역에 놓일 수목·풀·이웃 외피를 소유해 spaces 대지가 남긴 구역을 실제 개체 prototype으로 채울 수 있게 한다.

## 모델과 다른 제작 분기의 경계 {#layer-routing}

<!--
@evidence obligations/core/common.md#layer-boundary 36개 H2 중 공통 기준 셋은 축척·UV0·관절·검토 규칙을, 원형 H2 서른셋은 형상·part와 표면 ID·점유 상자·배치 기준점을 정한다. 배치 수와 간격은 instances, 색·거칠기·결은 materials, 물의 흐름과 빛은 systems, 벽·코핑·기단·지면은 spaces에 남긴다고 각 H2와 아래 본문이 구분한다.
-->

원형을 정의하는 33개 H2는 각각 자기 prototype의 형상, part와 표면 ID, [공통 UV0 규칙](../../models/scale.md#reference-scale), 가려진 접촉면과 빈 공간, 점유 상자와 배치 기준점을 결정한다. 나머지 scale의 세 H2는 공통 축척·UV0·관절·검토 판 규칙을 정한다. 반복 부재의 배치 수·간격·잘림은 instances가 판정된 공간과 합성 지붕에서 유도하며, 모델 H2는 "주랑 0.50m 중심 간격"처럼 기본 제안을 적을 때도 그 결정권이 instances에 있다고 밝힌다. 재료의 색·거칠기·결과 무늬는 materials의 결정이고 모델은 materials가 서로 다른 마감을 줄 수 있는 표면을 나누고 UV0 물리 좌표를 내는 데서 멈춘다.

분수의 흐름·빛 반사와 등잔의 상태 변화는 systems·motions의 후속 결정이며 모델은 정지 형상만 낸다. 외벽 기단과 코핑, 문턱 바닥, 대지 지면과 먼 능선은 spaces가 이미 소유한 실체라 모델 population에 다시 들이지 않는다. 문틀이 문턱 바닥을, 이웃 외피가 포장 구획을, 창틀이 벽 void 위치를 새로 만들지 않는 것이 각 H2에서 이 경계를 지키는 방식이다.

아래 표는 여덟 문서의 원형 H2에서는 part마다, 공통 규칙만 정하는 scale의 세 H2에서는 `공통 규칙` 요약 행으로 만드는 source 입력 색인이다. `공통 규칙`은 방출 part 이름이 아니다. 각 행은 원본 H2 링크·본문 문자 수·SHA-256을 보존하고, 값이 바뀌면 `self-check --sync-accounts`에서 기계적으로 바뀐다. self-check는 36개 H2와 그 part 또는 공통 규칙 행의 정확한 일치를 검사한다. 이 색인은 빠진 설계 결정을 `0`으로 인증하지 않는다. 리뷰어와 저작자는 링크된 원본 H2의 위치·크기·단면·분할·접합을 판정하고 구현 중 빠진 선택을 찾으면 해당 H2를 먼저 고친다.

| 모델 H2 | part | 본문 문자 수 | 본문 SHA-256 |
| --- | --- | ---: | --- |
| [cladding/roof-tile](../../models/cladding.md#roof-tile) | `tegula` | 2099 | `9753e03f7fba211dac8f032bd1e7e6eecc65988352cfcd0536cc5a15be62c562` |
| [cladding/roof-tile](../../models/cladding.md#roof-tile) | `imbrex` | 2099 | `9753e03f7fba211dac8f032bd1e7e6eecc65988352cfcd0536cc5a15be62c562` |
| [cladding/ridge-tile](../../models/cladding.md#ridge-tile) | `ridge` | 1611 | `a3dd3df9274495e392b9a41c2940d5b469c196bd6e7d149ab76e283fa4b3bf0e` |
| [columns/colonnade-column](../../models/columns.md#colonnade-column) | `plinth` | 1189 | `927195dbb788fc1a92b8d04846a46dc2999f87007e048dc56da3e24dbd2400e8` |
| [columns/colonnade-column](../../models/columns.md#colonnade-column) | `base` | 1189 | `927195dbb788fc1a92b8d04846a46dc2999f87007e048dc56da3e24dbd2400e8` |
| [columns/colonnade-column](../../models/columns.md#colonnade-column) | `shaft` | 1189 | `927195dbb788fc1a92b8d04846a46dc2999f87007e048dc56da3e24dbd2400e8` |
| [columns/colonnade-column](../../models/columns.md#colonnade-column) | `capital` | 1189 | `927195dbb788fc1a92b8d04846a46dc2999f87007e048dc56da3e24dbd2400e8` |
| [columns/porch-column](../../models/columns.md#porch-column) | `plinth` | 891 | `00a3a65fd8557032b1a0f97691bdb5eaa02200456abbbbf9488fc404de6756bd` |
| [columns/porch-column](../../models/columns.md#porch-column) | `base` | 891 | `00a3a65fd8557032b1a0f97691bdb5eaa02200456abbbbf9488fc404de6756bd` |
| [columns/porch-column](../../models/columns.md#porch-column) | `shaft` | 891 | `00a3a65fd8557032b1a0f97691bdb5eaa02200456abbbbf9488fc404de6756bd` |
| [columns/porch-column](../../models/columns.md#porch-column) | `capital` | 891 | `00a3a65fd8557032b1a0f97691bdb5eaa02200456abbbbf9488fc404de6756bd` |
| [entablature/colonnade-beam](../../models/entablature.md#colonnade-beam) | `timber` | 916 | `b7b7b804c2dcc7ec12dd3a0012698e6234405f757e050d5fa18b0062820d586e` |
| [entablature/rafter](../../models/entablature.md#rafter) | `timber` | 1079 | `1206a3021a48baf7f3518a729def987977e73126d2387e20c92bf2bad348aac9` |
| [entablature/porch-entablature](../../models/entablature.md#porch-entablature) | `beam` | 1016 | `cb24637ebcea728b8e965708b52823df24c3728c70a6d2cc38a95a1e7b6a2746` |
| [entablature/porch-entablature](../../models/entablature.md#porch-entablature) | `cornice` | 1016 | `cb24637ebcea728b8e965708b52823df24c3728c70a6d2cc38a95a1e7b6a2746` |
| [entablature/porch-entablature](../../models/entablature.md#porch-entablature) | `raking-trim` | 1016 | `cb24637ebcea728b8e965708b52823df24c3728c70a6d2cc38a95a1e7b6a2746` |
| [entablature/sanctuary-truss](../../models/entablature.md#sanctuary-truss) | `tie-beam` | 1024 | `86965faa44415d6500d9ba8137e7e3e21f383339aabaa89fb1cbd85b8b77262a` |
| [entablature/sanctuary-truss](../../models/entablature.md#sanctuary-truss) | `principal` | 1024 | `86965faa44415d6500d9ba8137e7e3e21f383339aabaa89fb1cbd85b8b77262a` |
| [entablature/sanctuary-truss](../../models/entablature.md#sanctuary-truss) | `king-post` | 1024 | `86965faa44415d6500d9ba8137e7e3e21f383339aabaa89fb1cbd85b8b77262a` |
| [entablature/sanctuary-truss](../../models/entablature.md#sanctuary-truss) | `strut` | 1024 | `86965faa44415d6500d9ba8137e7e3e21f383339aabaa89fb1cbd85b8b77262a` |
| [entablature/ceiling-joist](../../models/entablature.md#ceiling-joist) | `timber` | 634 | `5f4a87ee8807cc3591feadb1f6e1362cbb07a63175983476b4435cff2a7cc61d` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `step` | 1363 | `2e4924cf69f98e643f80d27d4228403f03de573b5c6d65d70f6608d6be465834` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `rim` | 1363 | `2e4924cf69f98e643f80d27d4228403f03de573b5c6d65d70f6608d6be465834` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `basin-inner` | 1363 | `2e4924cf69f98e643f80d27d4228403f03de573b5c6d65d70f6608d6be465834` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `water` | 1363 | `2e4924cf69f98e643f80d27d4228403f03de573b5c6d65d70f6608d6be465834` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `ripple` | 1363 | `2e4924cf69f98e643f80d27d4228403f03de573b5c6d65d70f6608d6be465834` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `nozzle` | 1363 | `2e4924cf69f98e643f80d27d4228403f03de573b5c6d65d70f6608d6be465834` |
| [fixtures/fountain](../../models/fixtures.md#fountain) | `jet` | 1363 | `2e4924cf69f98e643f80d27d4228403f03de573b5c6d65d70f6608d6be465834` |
| [fixtures/altar](../../models/fixtures.md#altar) | `step` | 994 | `065e32ac243e6cf17e15010bd248a595978ce00bc699479e1c29f906f1122873` |
| [fixtures/altar](../../models/fixtures.md#altar) | `top` | 994 | `065e32ac243e6cf17e15010bd248a595978ce00bc699479e1c29f906f1122873` |
| [fixtures/altar](../../models/fixtures.md#altar) | `support` | 994 | `065e32ac243e6cf17e15010bd248a595978ce00bc699479e1c29f906f1122873` |
| [fixtures/niche](../../models/fixtures.md#niche) | `plinth` | 612 | `d6fbe700e39e96b9a08fa337fd040815c9b65f0d604911a381021378f482e884` |
| [fixtures/niche](../../models/fixtures.md#niche) | `body` | 612 | `d6fbe700e39e96b9a08fa337fd040815c9b65f0d604911a381021378f482e884` |
| [fixtures/niche](../../models/fixtures.md#niche) | `recess` | 612 | `d6fbe700e39e96b9a08fa337fd040815c9b65f0d604911a381021378f482e884` |
| [fixtures/niche](../../models/fixtures.md#niche) | `cap` | 612 | `d6fbe700e39e96b9a08fa337fd040815c9b65f0d604911a381021378f482e884` |
| [fixtures/lampstand](../../models/fixtures.md#lampstand) | `foot` | 775 | `ef938b35ad502627bc5aea526173e9382d0bd3457510a8643ecf145944f412ed` |
| [fixtures/lampstand](../../models/fixtures.md#lampstand) | `stem` | 775 | `ef938b35ad502627bc5aea526173e9382d0bd3457510a8643ecf145944f412ed` |
| [fixtures/lampstand](../../models/fixtures.md#lampstand) | `knop` | 775 | `ef938b35ad502627bc5aea526173e9382d0bd3457510a8643ecf145944f412ed` |
| [fixtures/lampstand](../../models/fixtures.md#lampstand) | `dish` | 775 | `ef938b35ad502627bc5aea526173e9382d0bd3457510a8643ecf145944f412ed` |
| [fixtures/offering-table](../../models/fixtures.md#offering-table) | `top` | 655 | `a993c5de82c1ad3e253a8ee1d618577d3c0ed50e8b7cb54d3f0f4d5a39094912` |
| [fixtures/offering-table](../../models/fixtures.md#offering-table) | `trestle` | 655 | `a993c5de82c1ad3e253a8ee1d618577d3c0ed50e8b7cb54d3f0f4d5a39094912` |
| [fixtures/display-shelf](../../models/fixtures.md#display-shelf) | `side` | 762 | `5bf7d46bf4453fd940d9c9e06fd21b32a26294ef8487671fa884f472b92425ba` |
| [fixtures/display-shelf](../../models/fixtures.md#display-shelf) | `board` | 762 | `5bf7d46bf4453fd940d9c9e06fd21b32a26294ef8487671fa884f472b92425ba` |
| [fixtures/desk](../../models/fixtures.md#desk) | `top` | 689 | `02897b821d1f557fd6069f4fc35c5937e7469fb34e7397aac1e290c90c3c943d` |
| [fixtures/desk](../../models/fixtures.md#desk) | `leg` | 689 | `02897b821d1f557fd6069f4fc35c5937e7469fb34e7397aac1e290c90c3c943d` |
| [fixtures/desk](../../models/fixtures.md#desk) | `stretcher` | 689 | `02897b821d1f557fd6069f4fc35c5937e7469fb34e7397aac1e290c90c3c943d` |
| [fixtures/stool](../../models/fixtures.md#stool) | `seat` | 456 | `7e79b27de0002941ca867d0d0a8b1345f0c55183bc4230522adc138e49c532cf` |
| [fixtures/stool](../../models/fixtures.md#stool) | `leg` | 456 | `7e79b27de0002941ca867d0d0a8b1345f0c55183bc4230522adc138e49c532cf` |
| [fixtures/stool](../../models/fixtures.md#stool) | `stretcher` | 456 | `7e79b27de0002941ca867d0d0a8b1345f0c55183bc4230522adc138e49c532cf` |
| [fixtures/scroll-shelf](../../models/fixtures.md#scroll-shelf) | `frame` | 536 | `1c0e411dde19e198cdc1399be2bb51a48797144f97f71d65e9f478dfccaae339` |
| [fixtures/scroll-shelf](../../models/fixtures.md#scroll-shelf) | `divider` | 536 | `1c0e411dde19e198cdc1399be2bb51a48797144f97f71d65e9f478dfccaae339` |
| [fixtures/chest](../../models/fixtures.md#chest) | `body` | 1193 | `6ca3b55fe2300ea4ab060373d5cd9383ccf769e8f8e38394c06c466ebf9ca81b` |
| [fixtures/chest](../../models/fixtures.md#chest) | `lid` | 1193 | `6ca3b55fe2300ea4ab060373d5cd9383ccf769e8f8e38394c06c466ebf9ca81b` |
| [fixtures/chest](../../models/fixtures.md#chest) | `hasp` | 1193 | `6ca3b55fe2300ea4ab060373d5cd9383ccf769e8f8e38394c06c466ebf9ca81b` |
| [fixtures/chest](../../models/fixtures.md#chest) | `strap` | 1193 | `6ca3b55fe2300ea4ab060373d5cd9383ccf769e8f8e38394c06c466ebf9ca81b` |
| [landscape/cypress](../../models/landscape.md#cypress) | `trunk` | 792 | `254b0764f26382bc6cbeb3a4d3cc8db68fd634ff15fd9570abd4b1d23dc74489` |
| [landscape/cypress](../../models/landscape.md#cypress) | `crown` | 792 | `254b0764f26382bc6cbeb3a4d3cc8db68fd634ff15fd9570abd4b1d23dc74489` |
| [landscape/broad-tree](../../models/landscape.md#broad-tree) | `trunk` | 1025 | `eb8574f38ce79c1cd8465bbb65e70a19d4d08825871d474542579adb29145d2d` |
| [landscape/broad-tree](../../models/landscape.md#broad-tree) | `branch` | 1025 | `eb8574f38ce79c1cd8465bbb65e70a19d4d08825871d474542579adb29145d2d` |
| [landscape/broad-tree](../../models/landscape.md#broad-tree) | `crown` | 1025 | `eb8574f38ce79c1cd8465bbb65e70a19d4d08825871d474542579adb29145d2d` |
| [landscape/grass-tuft](../../models/landscape.md#grass-tuft) | `blade` | 622 | `ddd05e3d49a9992d69fed728525931f34b9dc16eac0b8b8dcdf2bc97152f14a1` |
| [landscape/neighbor-house](../../models/landscape.md#neighbor-house) | `wall` | 1557 | `4e00d56db342d2caa93b338d6c31724ae35fe56d67e42776ff8ce09e7566a0c4` |
| [landscape/neighbor-house](../../models/landscape.md#neighbor-house) | `plinth` | 1557 | `4e00d56db342d2caa93b338d6c31724ae35fe56d67e42776ff8ce09e7566a0c4` |
| [landscape/neighbor-house](../../models/landscape.md#neighbor-house) | `roof` | 1557 | `4e00d56db342d2caa93b338d6c31724ae35fe56d67e42776ff8ce09e7566a0c4` |
| [landscape/neighbor-house](../../models/landscape.md#neighbor-house) | `recess` | 1557 | `4e00d56db342d2caa93b338d6c31724ae35fe56d67e42776ff8ce09e7566a0c4` |
| [openings/door-frame](../../models/openings.md#door-frame) | `lining` | 996 | `75cd794b3b05135fa5b46fc1e86a678a707407323ffba06880a45d3587b8032d` |
| [openings/door-frame](../../models/openings.md#door-frame) | `surround` | 996 | `75cd794b3b05135fa5b46fc1e86a678a707407323ffba06880a45d3587b8032d` |
| [openings/double-door-leaf](../../models/openings.md#double-door-leaf) | `frame` | 1694 | `0fb50ef0334bf11718cad7f9e5485553feb01fb0934cfd1ce7bd1979f110e061` |
| [openings/double-door-leaf](../../models/openings.md#double-door-leaf) | `panel` | 1694 | `0fb50ef0334bf11718cad7f9e5485553feb01fb0934cfd1ce7bd1979f110e061` |
| [openings/double-door-leaf](../../models/openings.md#double-door-leaf) | `plate` | 1694 | `0fb50ef0334bf11718cad7f9e5485553feb01fb0934cfd1ce7bd1979f110e061` |
| [openings/double-door-leaf](../../models/openings.md#double-door-leaf) | `pin` | 1694 | `0fb50ef0334bf11718cad7f9e5485553feb01fb0934cfd1ce7bd1979f110e061` |
| [openings/double-door-leaf](../../models/openings.md#double-door-leaf) | `ring` | 1694 | `0fb50ef0334bf11718cad7f9e5485553feb01fb0934cfd1ce7bd1979f110e061` |
| [openings/double-door-leaf](../../models/openings.md#double-door-leaf) | `hinge` | 1694 | `0fb50ef0334bf11718cad7f9e5485553feb01fb0934cfd1ce7bd1979f110e061` |
| [openings/single-door-leaf](../../models/openings.md#single-door-leaf) | `board` | 1292 | `1a3854c3d6e472aba7ad8effcb5c0b5c39e338e005c5fd68fa2eead03e5e5016` |
| [openings/single-door-leaf](../../models/openings.md#single-door-leaf) | `batten` | 1292 | `1a3854c3d6e472aba7ad8effcb5c0b5c39e338e005c5fd68fa2eead03e5e5016` |
| [openings/single-door-leaf](../../models/openings.md#single-door-leaf) | `strap` | 1292 | `1a3854c3d6e472aba7ad8effcb5c0b5c39e338e005c5fd68fa2eead03e5e5016` |
| [openings/single-door-leaf](../../models/openings.md#single-door-leaf) | `pin` | 1292 | `1a3854c3d6e472aba7ad8effcb5c0b5c39e338e005c5fd68fa2eead03e5e5016` |
| [openings/single-door-leaf](../../models/openings.md#single-door-leaf) | `ring` | 1292 | `1a3854c3d6e472aba7ad8effcb5c0b5c39e338e005c5fd68fa2eead03e5e5016` |
| [openings/window-frame](../../models/openings.md#window-frame) | `lining` | 690 | `44771599faf596f278157d9d88e13aa9e711a4641b11dfffcf4884999a52b948` |
| [openings/window-frame](../../models/openings.md#window-frame) | `surround` | 690 | `44771599faf596f278157d9d88e13aa9e711a4641b11dfffcf4884999a52b948` |
| [scale/reference-scale](../../models/scale.md#reference-scale) | `공통 규칙` | 5144 | `195eeab84d298314de926278100f16e60e637b86629be2b858d9231efa6783cb` |
| [scale/articulation-map](../../models/scale.md#articulation-map) | `공통 규칙` | 499 | `8cdb753c323d066082a6f92008afce40111a709dac557b36bb153c0f49f281f5` |
| [scale/model-review-board](../../models/scale.md#model-review-board) | `공통 규칙` | 529 | `8a4bcbd14c45e5247319a65707925b942fd32188c8a89adcf54724b8c2441889` |
| [wares/storage-jar](../../models/wares.md#storage-jar) | `body` | 755 | `6677b4efe096596073b394101da9ab7cd1ae797db9412e181feb0c94c54bbb95` |
| [wares/storage-jar](../../models/wares.md#storage-jar) | `handle` | 755 | `6677b4efe096596073b394101da9ab7cd1ae797db9412e181feb0c94c54bbb95` |
| [wares/carry-jar](../../models/wares.md#carry-jar) | `body` | 659 | `6a74465072a35c93df709e5bc4e721d0abde848546e5b58b6ac49f295fca28cc` |
| [wares/carry-jar](../../models/wares.md#carry-jar) | `handle` | 659 | `6a74465072a35c93df709e5bc4e721d0abde848546e5b58b6ac49f295fca28cc` |
| [wares/small-vessel](../../models/wares.md#small-vessel) | `body` | 627 | `6802302ba6b577cc3cbbcaa3432370d3b313ca0b154caec92f28d70bc4717169` |
| [wares/small-vessel](../../models/wares.md#small-vessel) | `handle` | 627 | `6802302ba6b577cc3cbbcaa3432370d3b313ca0b154caec92f28d70bc4717169` |
| [wares/offering-bowl](../../models/wares.md#offering-bowl) | `bowl` | 670 | `6a2e8259b62bb2aa43d8624ac1219f14f4ad3365db100c14cac58ae71a513ad5` |
| [wares/basket](../../models/wares.md#basket) | `wall` | 718 | `0af8abe6a767ba8ba5240951a9b8b5e9b0bbcab0d22abe3feedc1f0f41bef40b` |
| [wares/basket](../../models/wares.md#basket) | `rim` | 718 | `0af8abe6a767ba8ba5240951a9b8b5e9b0bbcab0d22abe3feedc1f0f41bef40b` |
| [wares/basket](../../models/wares.md#basket) | `floor` | 718 | `0af8abe6a767ba8ba5240951a9b8b5e9b0bbcab0d22abe3feedc1f0f41bef40b` |
| [wares/scroll](../../models/wares.md#scroll) | `sheet` | 1088 | `c2005bcac80315181e1ec25860243a1e42f464c1de18528a4ac9e856b8dc121d` |
| [wares/scroll](../../models/wares.md#scroll) | `tie` | 1088 | `c2005bcac80315181e1ec25860243a1e42f464c1de18528a4ac9e856b8dc121d` |

## 작업 언어와 식별 표기 {#working-language}

<!--
@evidence obligations/core/common.md#production-language 모델 결정과 실패 조건은 한국어 기술 서술체로 읽히고, plinth·tegula·hinge.<판 ID> 같은 part·표면·인터페이스 식별자와 anchor, API 성격의 용어만 원문을 유지한다. plumb cut처럼 처음 쓰는 기술 용어에는 한국어 풀이가 붙어 있다.
-->

settings의 [작업 언어](../../settings/00-delivery.md#working-language)에 따라 모델 문서는 현대 표준 한국어로 쓴다. 치수·높이·실패 조건은 한국어 문장 안에서 m 단위 숫자로 적는다. part와 표면 이름(`plinth`, `shaft`, `tegula`, `imbrex`, `lining`, `surround`), 관절 인터페이스(`hinge.<판 ID>`), 상태 이름(`closed`, `open`), 문 ID(`door-entry` 등)와 anchor는 source와 같은 식별자라 원문을 유지한다.

분기 이름(materials, instances, systems)과 prototype, negative space, blocking geometry처럼 계약에서 온 용어는 문맥상 뜻이 드러나게 쓰고, 서까래 끝의 "연직으로 잘린 면(plumb cut)"처럼 처음 쓰는 전문 용어는 한국어 풀이를 앞세운다. 고대어 명칭이나 비문은 쓰지 않는다.

## 규모와 전개 분량의 비교 {#proportion}

<!--
@evidence obligations/core/common.md#proportionate-development 아래 여덟 파일·36 H2의 생성 표와 H2별 분포를 build-scope의 prototype 목록에 대조했다. 원주·기와·양개 문짝·분수·이웃집·넓은 수관에는 많은 결정을, 스툴과 작은 용기에는 짧은 형상 결정을 배정했다. 재생성 전 기준은 Git `111dba96^:experimental/ancient-civic-temple/docs/models/temple-fit-out.md`의 실제 blob을 같은 계수식으로 다시 재어 17 H2·14,799자로 검증했다.
-->

현재 모델 population의 파일·H2·본문 분량은 아래 self-check 생성 표로 고정한다. 본문 문자는 HTML 주석과 공백을 빼고 제목은 포함한 유니코드 코드 포인트 수다. 표에 없는 파일, 중복 파일, 낡은 행은 self-check 실패로 처리한다.

| 모델 파일 | H2 | 주석·공백 제외 본문 문자 수 |
| --- | ---: | ---: |
| fixtures.md | 10 | 6705 |
| entablature.md | 5 | 3838 |
| openings.md | 4 | 3830 |
| wares.md | 6 | 3837 |
| landscape.md | 4 | 3353 |
| scale.md | 3 | 5008 |
| columns.md | 2 | 1732 |
| cladding.md | 2 | 2971 |
| 합계 | 36 | 31274 |

재생성 전 원본은 작업 트리에 없지만 Git `111dba96^:experimental/ancient-civic-temple/docs/models/temple-fit-out.md`에 남아 있다. 현재 계정의 `modelDocumentBodyLength`와 같은 방식으로 해당 blob의 HTML 주석·공백을 빼고 제목을 포함해 다시 세면 한 파일·17 H2·14,799자다. 그 H2 목록에는 `Column prototype`, `Door prototype`, `Roof tile prototype`이 각각 한 번씩 있어 당시 기둥·문짝·기와를 한 절로 묶은 기록도 확인된다. 현재 판은 문틀·양개·외개·창틀, 주랑·포치 원주, 평기와·용마루를 따로 두어 서로 다른 소비자와 변경 경로를 가진 결정이 각자 주소를 가진다.

H2별 분량 순위는 self-check의 `model H2 ranks` 출력에서 매번 다시 읽는다. 수목·이웃집의 위치와 잎 규칙을 확정한 이번 설계에서도 한 번 적은 순위를 고정값처럼 재사용하지 않는다. [build-scope](../../settings/00-delivery.md#build-scope)가 models에 배정한 기둥·문짝·문틀·기와·수반·제단·가구·용기·식생·이웃 외피 prototype은 모두 한 H2 이상을 가진다. 설계와 source 사이의 분량은 비교하지 않으며 모든 H2가 modelSources에서 실현되는지는 그 분기가 열린 뒤 따로 센다.
