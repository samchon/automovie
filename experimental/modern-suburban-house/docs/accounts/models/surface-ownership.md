# 모델 층의 완결 표면 소유

## 모델 H2 전수 표면 소유와 재료 인터페이스 {#model-surface-ownership}
<!--
@evidence contracts/surface-ownership.md#whole-surface-owner 모델 H2마다 아래 계정에 한 번씩 적고 부재별 surface id와 source owner를 대조한다. 부모·형제의 원형 인계를 마지막 대응표에서 설계 owner와 잇고, materials의 명명 면은 material-face-ledger 생산자로 역대조한다. 이 계정과 생산자는 설계 인터페이스를 확인하며 아직 없는 modelSources 메시의 실제 face binding은 unverified다.
-->

[원문 계약](../../contracts/surface-ownership.md#whole-surface-owner)의 완결 표면은 한 source만 만든다. 아래 행에서 `—`는 규칙·표현 한계·검증 절차여서 별도 부피를 만들지 않음을 뜻한다. 같은 원형의 구조·관절·표면 설명 H2에 id가 반복되어도 메시를 복제한다는 뜻이 아니다. 모든 닫힌 부재의 앞·뒤·위·아래·절단·오목한 챌면은 [모델 표면 규칙](../../models/00-model-frame.md#model-surface-partition-naming)에 따라 정확히 한 id를 받는다. 관절 이름과 배치 id는 face id가 아니다.

| 모델 H2 | model source owner | 선언된 face id |
|---|---|---|
| [model-local-frame](../../models/00-model-frame.md#model-local-frame) | — (규칙) | — (새 메시 없음) |
| [model-furniture-local-frame](../../models/00-model-frame.md#model-furniture-local-frame) | — (규칙) | — (새 메시 없음) |
| [model-reference-scale](../../models/00-model-frame.md#model-reference-scale) | — (규칙) | — (새 메시 없음) |
| [model-representation-ceiling](../../models/00-model-frame.md#model-representation-ceiling) | — (규칙) | — (새 메시 없음) |
| [model-surface-partition-naming](../../models/00-model-frame.md#model-surface-partition-naming) | — (규칙) | — (새 메시 없음) |
| [model-representation-completion](../../models/00-model-frame.md#model-representation-completion) | — (규칙) | — (새 메시 없음) |
| [model-review-set](../../models/00-model-frame.md#model-review-set) | — (규칙) | — (새 메시 없음) |
| [window-local-frame](../../models/01-windows.md#window-local-frame) | `src/models/windows.ts` | `frame` |
| [window-member-sizes](../../models/01-windows.md#window-member-sizes) | `src/models/windows.ts` | `frame`·`sash`·`mullion`·`muntin`·`glass` |
| [window-muntin-grid](../../models/01-windows.md#window-muntin-grid) | `src/models/windows.ts` | `muntin`·`glass` |
| [double-hung-window](../../models/01-windows.md#double-hung-window) | `src/models/windows.ts` | `frame`·`sash`·`mullion`·`muntin`·`glass` |
| [fixed-window](../../models/01-windows.md#fixed-window) | `src/models/windows.ts` | `frame`·`sash`·`mullion`·`muntin`·`glass` |
| [awning-window](../../models/01-windows.md#awning-window) | `src/models/windows.ts` | `frame`·`sash`·`obscured-glass` |
| [window-sill-trim](../../models/01-windows.md#window-sill-trim) | `src/models/windows.ts` | `exterior-trim`·`interior-sill`·`interior-casing` |
| [window-surface-partitions](../../models/01-windows.md#window-surface-partitions) | — (규칙) | `frame`·`sash`·`mullion`·`muntin`·`glass`·`obscured-glass`·`exterior-trim`·`interior-sill`·`interior-casing` |
| [window-fidelity](../../models/01-windows.md#window-fidelity) | — (규칙) | — (새 메시 없음) |
| [front-entry-door](../../models/02-exterior-doors.md#front-entry-door) | `src/models/exterior-door.ts` | `jamb`·`exterior-trim`·`casing`·`leaf-exterior`·`leaf-interior`·`leaf-edge`·`leaf-panel`·`muntin`·`glass`·`handle`·`hinge` |
| [garage-sectional-door](../../models/02-exterior-doors.md#garage-sectional-door) | `src/models/garage-door.ts` | `jamb`·`rail`·`leaf-exterior`·`leaf-interior`·`leaf-panel`·`panel-edge`·`glass`·`sash` |
| [garden-door-pair](../../models/02-exterior-doors.md#garden-door-pair) | `src/models/exterior-door.ts` | `jamb`·`exterior-trim`·`casing`·`leaf-exterior`·`leaf-interior`·`leaf-edge`·`sash`·`glass`·`handle`·`hinge` |
| [side-yard-gate](../../models/02-exterior-doors.md#side-yard-gate) | `src/models/gate.ts` | `leaf-panel`·`gate-batten`·`hinge`·`handle` |
| [exterior-door-surfaces](../../models/02-exterior-doors.md#exterior-door-surfaces) | — (규칙) | `jamb`·`exterior-trim`·`casing`·`leaf-exterior`·`leaf-interior`·`leaf-edge`·`leaf-panel`·`panel-edge`·`muntin`·`glass`·`sash`·`handle`·`hinge`·`rail`·`gate-batten` |
| [exterior-door-fidelity](../../models/02-exterior-doors.md#exterior-door-fidelity) | — (규칙) | — (새 메시 없음) |
| [interior-door-members](../../models/03-interior-doors.md#interior-door-members) | `src/models/interior-door.ts` | `jamb-a`·`jamb-b`·`jamb-core`·`casing-a`·`casing-b`·`leaf`·`leaf-panel`·`handle`·`hinge` |
| [interior-door-hinges](../../models/03-interior-doors.md#interior-door-hinges) | — (관절 규칙; 경첩 몸체는 interior-door-members) | `hinge` |
| [interior-door-surfaces](../../models/03-interior-doors.md#interior-door-surfaces) | — (규칙) | `jamb-a`·`jamb-b`·`jamb-core`·`casing-a`·`casing-b`·`leaf`·`leaf-panel`·`handle`·`hinge` |
| [interior-door-fidelity](../../models/03-interior-doors.md#interior-door-fidelity) | — (규칙) | — (새 메시 없음) |
| [stair-balusters](../../models/04-stair-members.md#stair-balusters) | `src/models/stair-baluster.ts` | `baluster` |
| [stair-bottom-member](../../models/04-stair-members.md#stair-bottom-member) | `src/models/stair-baluster.ts` | `bottom-rail` |
| [stair-side-skirt](../../models/04-stair-members.md#stair-side-skirt) | `src/models/stair-skirt.ts` | `stair-skirt` |
| [stair-member-surfaces](../../models/04-stair-members.md#stair-member-surfaces) | — (규칙) | `baluster`·`bottom-rail` |
| [stair-member-fidelity](../../models/04-stair-members.md#stair-member-fidelity) | — (규칙) | — (새 메시 없음) |
| [coat-closet-doors](../../models/05-closet-fittings.md#coat-closet-doors) | `src/models/closet.ts` | `leaf`·`leaf-panel`·`rail`·`handle` |
| [coat-closet-rod-shelf](../../models/05-closet-fittings.md#coat-closet-rod-shelf) | `src/models/closet.ts` | `rod`·`shelf` |
| [wall-baseboard](../../models/06-interior-trim.md#wall-baseboard) | `src/models/interior/baseboard.ts` | `wall-baseboard` |
| [linen-closet-fittings](../../models/05-closet-fittings.md#linen-closet-fittings) | `src/models/closet.ts` | `leaf`·`leaf-panel`·`rail`·`handle`·`shelf` |
| [closet-fitting-surfaces](../../models/05-closet-fittings.md#closet-fitting-surfaces) | — (규칙) | `leaf`·`leaf-panel`·`rail`·`rod`·`shelf`·`handle` |
| [closet-fitting-fidelity](../../models/05-closet-fittings.md#closet-fitting-fidelity) | — (규칙) | — (새 메시 없음) |
| [kitchen-base-run](../../models/10-kitchen-dining.md#kitchen-base-run) | `src/models/furnishings/kitchen-dining.ts` | `plinth`·`carcass`·`leaf`·`drawer-front`·`handle`·`countertop` |
| [kitchen-wall-cabinet](../../models/10-kitchen-dining.md#kitchen-wall-cabinet) | `src/models/furnishings/kitchen-dining.ts` | `carcass`·`leaf`·`handle` |
| [kitchen-refrigerator](../../models/10-kitchen-dining.md#kitchen-refrigerator) | `src/models/furnishings/kitchen-dining.ts` | `appliance-body`·`leaf`·`drawer-front`·`handle`·`appliance-interior` |
| [kitchen-range](../../models/10-kitchen-dining.md#kitchen-range) | `src/models/furnishings/kitchen-dining.ts` | `appliance-body`·`cooktop`·`burner`·`control-panel`·`leaf`·`appliance-glass`·`handle`·`appliance-interior` |
| [kitchen-microwave](../../models/10-kitchen-dining.md#kitchen-microwave) | `src/models/furnishings/kitchen-dining.ts` | `appliance-body`·`leaf`·`appliance-glass`·`control-panel` |
| [kitchen-island](../../models/10-kitchen-dining.md#kitchen-island) | `src/models/furnishings/kitchen-dining.ts` | `plinth`·`carcass`·`leaf`·`drawer-front`·`handle`·`countertop`·`basin`·`faucet` |
| [kitchen-dishwasher](../../models/10-kitchen-dining.md#kitchen-dishwasher) | `src/models/furnishings/kitchen-dining.ts` | `appliance-body`·`leaf`·`control-panel`·`handle`·`appliance-interior` |
| [kitchen-island-stool](../../models/10-kitchen-dining.md#kitchen-island-stool) | `src/models/furnishings/kitchen-dining.ts` | `seat`·`leg`·`footrest` |
| [dining-table](../../models/10-kitchen-dining.md#dining-table) | `src/models/furnishings/kitchen-dining.ts` | `top`·`apron`·`leg` |
| [dining-chair](../../models/10-kitchen-dining.md#dining-chair) | `src/models/furnishings/kitchen-dining.ts` | `seat`·`leg`·`back` |
| [fabric-sofa](../../models/11-living.md#fabric-sofa) | `src/models/furnishings/living.ts` | `leg`·`base`·`seat-cushion`·`back`·`arm` |
| [low-table](../../models/11-living.md#low-table) | `src/models/furnishings/living.ts` | `top`·`leg` |
| [reading-armchair](../../models/11-living.md#reading-armchair) | `src/models/furnishings/living.ts` | `leg`·`base`·`seat-cushion`·`back`·`arm` |
| [dark-bookcase](../../models/11-living.md#dark-bookcase) | `src/models/furnishings/living.ts` | `carcass`·`plinth`·`shelf`·`book` |
| [floor-covering](../../models/11-living.md#floor-covering) | `src/models/furnishings/living.ts` | `field`·`border` |
| [fireplace-insert-mantel](../../models/11-living.md#fireplace-insert-mantel) | `src/models/furnishings/living.ts` | `firebox`·`firebox-trim`·`mantel` |
| [laundry-machine](../../models/12-service-rooms.md#laundry-machine) | `src/models/furnishings/service-rooms.ts` | `appliance-body`·`leaf`·`door-ring`·`glass`·`handle`·`control-panel`·`appliance-interior`·`drum` |
| [laundry-folding-top](../../models/12-service-rooms.md#laundry-folding-top) | `src/models/furnishings/service-rooms.ts` | `top`·`cleat` |
| [laundry-upper-storage](../../models/12-service-rooms.md#laundry-upper-storage) | `src/models/furnishings/service-rooms.ts` | `carcass`·`leaf` |
| [mudroom-bench](../../models/12-service-rooms.md#mudroom-bench) | `src/models/furnishings/service-rooms.ts` | `seat`·`carcass`·`shelf`·`shoe` |
| [mudroom-coat-hooks](../../models/12-service-rooms.md#mudroom-coat-hooks) | `src/models/furnishings/service-rooms.ts` | `board`·`hook`·`clothes` |
| [pantry-l-shelf](../../models/12-service-rooms.md#pantry-l-shelf) | `src/models/furnishings/service-rooms.ts` | `shelf`·`cleat` |
| [pantry-containers](../../models/12-service-rooms.md#pantry-containers) | `src/models/furnishings/service-rooms.ts` | `container`·`lid`·`basket` |
| [garage-shelving](../../models/12-service-rooms.md#garage-shelving) | `src/models/furnishings/service-rooms.ts` | `post`·`shelf`·`bin` |
| [garage-workbench](../../models/12-service-rooms.md#garage-workbench) | `src/models/furnishings/service-rooms.ts` | `top`·`leg`·`drawer-front`·`handle` |
| [garage-tool-board](../../models/12-service-rooms.md#garage-tool-board) | `src/models/furnishings/service-rooms.ts` | `board`·`tool-steel`·`tool-grip`·`bin` |
| [headboard-bed](../../models/13-bedrooms.md#headboard-bed) | `src/models/furnishings/bedrooms.ts` | `headboard`·`bed-frame`·`mattress`·`bedding`·`pillow` |
| [nightstand-lamp](../../models/13-bedrooms.md#nightstand-lamp) | `src/models/furnishings/bedrooms.ts` | `carcass`·`drawer-front`·`lamp-base`·`lamp-shade` |
| [low-dresser](../../models/13-bedrooms.md#low-dresser) | `src/models/furnishings/bedrooms.ts` | `carcass`·`drawer-front`·`handle`·`leg` |
| [child-desk](../../models/13-bedrooms.md#child-desk) | `src/models/furnishings/bedrooms.ts` | `top`·`leg`·`shelf`·`book`·`container`·`pencil` |
| [desk-chair](../../models/13-bedrooms.md#desk-chair) | `src/models/furnishings/bedrooms.ts` | `seat`·`leg`·`back` |
| [sliding-closet](../../models/13-bedrooms.md#sliding-closet) | `src/models/furnishings/bedrooms.ts` | `carcass`·`leaf`·`handle`·`rail`·`rod`·`shelf`·`clothes` |
| [primary-window-curtains](../../models/13-bedrooms.md#primary-window-curtains) | `src/models/furnishings/bedrooms.ts` | `rod`·`bracket`·`curtain` |
| [wardrobe-hanging](../../models/13-bedrooms.md#wardrobe-hanging) | `src/models/furnishings/bedrooms.ts` | `rod`·`shelf`·`carcass`·`clothes` |
| [wardrobe-shelves](../../models/13-bedrooms.md#wardrobe-shelves) | `src/models/furnishings/bedrooms.ts` | `shelf`·`carcass`·`folded`·`shoe-box`·`basket` |
| [shared-toilet](../../models/14-bathrooms.md#shared-toilet) | `src/models/furnishings/bathrooms.ts` | `ceramic`·`toilet-seat`·`lid`·`handle` |
| [vanity-basin](../../models/14-bathrooms.md#vanity-basin) | `src/models/furnishings/bathrooms.ts` | `plinth`·`carcass`·`leaf`·`countertop`·`ceramic`·`faucet`·`handle`·`accessory` |
| [wall-mirror](../../models/14-bathrooms.md#wall-mirror) | `src/models/furnishings/bathrooms.ts` | `mirror-frame`·`mirror` |
| [towel-bar](../../models/14-bathrooms.md#towel-bar) | `src/models/furnishings/bathrooms.ts` | `rod`·`bracket`·`towel` |
| [sliding-shower-booth](../../models/14-bathrooms.md#sliding-shower-booth) | `src/models/furnishings/bathrooms.ts` | `shower-tray`·`glass`·`rail`·`handle`·`faucet` |
| [bathtub](../../models/14-bathrooms.md#bathtub) | `src/models/furnishings/bathrooms.ts` | `ceramic`·`faucet` |
| [tub-curtain-rail](../../models/14-bathrooms.md#tub-curtain-rail) | `src/models/furnishings/bathrooms.ts` | `rail`·`rod`·`curtain` |
| [bath-floor-mats](../../models/14-bathrooms.md#bath-floor-mats) | `src/models/furnishings/bathrooms.ts` | `field`·`border` |
| [shower-niche-bottles](../../models/14-bathrooms.md#shower-niche-bottles) | `src/models/furnishings/bathrooms.ts` | `container`·`lid` |
| [terrace-table](../../models/15-outdoor.md#terrace-table) | `src/models/furnishings/outdoor.ts` | `top`·`leg` |
| [terrace-chair](../../models/15-outdoor.md#terrace-chair) | `src/models/furnishings/outdoor.ts` | `seat`·`leg`·`back` |
| [lap-siding-board](../../models/15-outdoor.md#lap-siding-board) | `src/models/exterior/siding.ts` | `siding-face`·`siding-butt`·`siding-back`·`siding-top`·`siding-cut` |
| [exterior-corner-trim](../../models/15-outdoor.md#exterior-corner-trim) | `src/models/exterior/trim.ts` | `exterior-trim` (앞·옆·뒤·위·아래·절단 끝) |
| [asphalt-shingle-strip](../../models/15-outdoor.md#asphalt-shingle-strip) | `src/models/exterior/shingle.ts` | `shingle-face`·`shingle-butt`·`shingle-back`·`shingle-cut`·`roof-flashing` |
| [eave-gutter-downspout](../../models/15-outdoor.md#eave-gutter-downspout) | `src/models/exterior/drainage.ts` | `gutter`·`downspout` |
| [site-tree-prototypes](../../models/16-planting.md#site-tree-prototypes) | `src/models/planting.ts` | `bark`·`foliage` |
| [site-shrub-prototype](../../models/16-planting.md#site-shrub-prototype) | `src/models/planting.ts` | `bark`·`foliage` |
| [flush-ceiling-fixture](../../models/17-light-fixtures.md#flush-ceiling-fixture) | `src/models/lighting-fixtures.ts` | `fixture-housing`·`fixture-diffuser` |
| [pendant-fixtures](../../models/17-light-fixtures.md#pendant-fixtures) | `src/models/lighting-fixtures.ts` | `fixture-canopy`·`fixture-stem`·`fixture-shade`·`fixture-diffuser` |
| [vanity-wall-fixture](../../models/17-light-fixtures.md#vanity-wall-fixture) | `src/models/lighting-fixtures.ts` | `fixture-housing`·`fixture-diffuser` |
| [porch-wall-sconce](../../models/17-light-fixtures.md#porch-wall-sconce) | `src/models/lighting-fixtures.ts` | `fixture-housing`·`fixture-stem`·`fixture-glass` |
| [porch-mat-planter](../../models/18-house-props.md#porch-mat-planter) | `src/models/furnishings/props.ts` | `field`·`border`·`container`·`stem`·`foliage` |
| [kitchen-food-utensils](../../models/18-house-props.md#kitchen-food-utensils) | `src/models/furnishings/props.ts` | `cutting-board`·`container`·`utensil`·`bowl`·`fruit` |
| [linen-folded-towels](../../models/18-house-props.md#linen-folded-towels) | `src/models/furnishings/props.ts` | `folded` |
| [living-tabletop-props](../../models/19-room-accents.md#living-tabletop-props) | `src/models/furnishings/props.ts` | `book`·`tray`·`container`·`stem`·`foliage` |
| [wall-art-indoor-plant](../../models/19-room-accents.md#wall-art-indoor-plant) | `src/models/furnishings/props.ts` | `art-frame`·`art-print`·`container`·`stem`·`foliage` |
| [sofa-throws](../../models/19-room-accents.md#sofa-throws) | `src/models/furnishings/props.ts` | `pillow`·`folded` |

다음 표는 위 모델 행에 등장한 **모든 face id**의 설계 결속 경로다. 하나의 id가 여러 재료 행에 있으면 모델 H2와 배치 변형을 함께 키로 사용한다(예: `leaf`의 실내 문/주방 가전, `glass`의 건물 창/세탁기 문). 그 선택을 버리고 id 문자열 하나로 재료를 고르면 오결속이다. 이 표는 id 문자열의 설계 경로만 열거한다. 세면장에는 없는 `leaf-panel` 대신 실제 `leaf`를 회갈색 수납장에 결속하고 전자레인지 `leaf`를 스테인리스에 결속하도록 재료 문서를 정정했다. [재료 면 생산자](material-face-ledger.md#material-face-ledger)는 materials 본문에 명명된 면 토큰과 모델 원형 본문의 id·치수를 역대조하지만, 모든 (모델 H2, id) 쌍의 실제 메시 face binding은 modelSources·materialSources가 없어 unverified다.

| 재료 H2 | 해당 모델 face id |
|---|---|
| [siding-warm-white](../../materials/01-exterior.md#siding-warm-white) | `siding-face`·`siding-butt`·`siding-back`·`siding-top`·`siding-cut` |
| [roof-shingle](../../materials/01-exterior.md#roof-shingle) | `shingle-face`·`shingle-butt`·`shingle-back`·`shingle-cut` |
| [trim-white](../../materials/01-exterior.md#trim-white) | `exterior-trim`·`jamb` |
| [window-frame-charcoal](../../materials/01-exterior.md#window-frame-charcoal) | `frame`·`sash`·`mullion`·`muntin`·`gutter`·`downspout`·`roof-flashing` |
| [glass-clear](../../materials/01-exterior.md#glass-clear) | `glass` |
| [glass-obscure](../../materials/01-exterior.md#glass-obscure) | `obscured-glass` |
| [front-door-wood](../../materials/01-exterior.md#front-door-wood) | `leaf-exterior`·`leaf-interior`·`leaf-edge`·`leaf-panel` |
| [garage-door-charcoal](../../materials/01-exterior.md#garage-door-charcoal) | `leaf-exterior`·`leaf-interior`·`leaf-panel`·`panel-edge` |
| [fence-wood](../../materials/01-exterior.md#fence-wood) | `leaf-panel`·`gate-batten` |
| [interior-trim-white](../../materials/02-interior-shell.md#interior-trim-white) | `interior-sill`·`interior-casing`·`casing`·`casing-a`·`casing-b`·`jamb-a`·`jamb-b`·`jamb-core`·`leaf`·`leaf-panel`·`shelf`·`carcass`·`wall-baseboard`·`stair-skirt` |
| [black-coated-metal](../../materials/02-interior-shell.md#black-coated-metal) | `hinge`·`handle`·`baluster`·`bottom-rail`·`hook`·`rail`·`bracket`·`mirror-frame`·`fixture-housing`·`fixture-canopy`·`fixture-stem` |
| [greige-cabinet](../../materials/03-furnishings.md#greige-cabinet) | `plinth`·`carcass`·`leaf`·`drawer-front` |
| [light-countertop](../../materials/03-furnishings.md#light-countertop) | `countertop` |
| [stainless-steel](../../materials/03-furnishings.md#stainless-steel) | `appliance-body`·`faucet`·`basin`·`rail`·`rod`·`post`·`shelf`·`tool-steel`·`utensil`·`door-ring`·`drum` |
| [black-glass-panel](../../materials/03-furnishings.md#black-glass-panel) | `control-panel`·`appliance-glass`·`cooktop`·`burner` |
| [white-enamel](../../materials/03-furnishings.md#white-enamel) | `ceramic`·`toilet-seat`·`shower-tray`·`appliance-interior`·`lid`·`container`·`accessory`·`bowl`·`lamp-base` |
| [furniture-wood](../../materials/03-furnishings.md#furniture-wood) | `top`·`apron`·`leg`·`footrest`·`seat`·`base`·`back`·`carcass`·`shelf`·`plinth`·`cleat`·`board`·`tool-grip`·`tray`·`cutting-board`·`mantel`·`basket`·`pencil`·`headboard`·`bed-frame` |
| [dark-bookcase-wood](../../materials/03-furnishings.md#dark-bookcase-wood) | `carcass`·`plinth`·`shelf`·`art-frame` |
| [grey-beige-upholstery](../../materials/03-furnishings.md#grey-beige-upholstery) | `arm`·`back`·`seat-cushion`·`clothes`·`pillow` |
| [primary-bedding](../../materials/03-furnishings.md#primary-bedding) | `bedding`·`pillow`·`mattress` |
| [olive-bedding](../../materials/03-furnishings.md#olive-bedding) | `bedding`·`book`·`clothes` |
| [blue-grey-bedding](../../materials/03-furnishings.md#blue-grey-bedding) | `bedding`·`book`·`clothes` |
| [muted-rug](../../materials/03-furnishings.md#muted-rug) | `field`·`border` |
| [towel-curtain-textile](../../materials/03-furnishings.md#towel-curtain-textile) | `towel`·`curtain`·`folded`·`fixture-shade`·`lamp-shade` |
| [mirror](../../materials/03-furnishings.md#mirror) | `mirror` |
| [firebox-black](../../materials/03-furnishings.md#firebox-black) | `firebox`·`firebox-trim` |
| [planting-bark-foliage](../../materials/03-furnishings.md#planting-bark-foliage) | `bark`·`foliage`·`stem` |
| [light-fixture-surfaces](../../materials/03-furnishings.md#light-fixture-surfaces) | `fixture-diffuser`·`fixture-glass` |
| [food-art-finishes](../../materials/03-furnishings.md#food-art-finishes) | `fruit`·`art-print` |
| [minor-prop-partitions](../../materials/03-furnishings.md#minor-prop-partitions) | `bin`·`shoe`·`shoe-box`·`container`·`lid`·`basket`·`book`·`pencil`·`handle` |

spaces의 전후면 문턱 상면 +0.02 m는 `src/spaces/envelope/front.ts`·`rear.ts`만, 울타리 기둥과 가로 보는 `src/spaces/site/fence.ts`만, 외투장 벽과 개구부는 `src/spaces/rooms/entry.ts`만 만든다. models는 문짝·대문 문짝·외투장 문짝과 봉만 만든다. 벽난로 벽돌과 void는 `src/spaces/envelope/left.ts`, 금속 화구와 목재 선반은 `src/models/furnishings/living.ts`가 만든다. 처마 구조와 fascia는 spaces 지붕 source, 홈통과 선홈통은 models `exterior/*`가 만든다. source가 실제로 닫힌 면을 중복 생성하지 않는지는 source 구현 후 재검사한다.

역방향 인계 검색의 재사용 어휘는 [커밋된 한국어·영어 목록](../../../src/measurements/model-handoff-lexicon.cjs)에 있다. [계수 생산자](../../../src/measurements/model-contract-audit.cjs)의 `handoffs` 명령은 `docs/settings`, `docs/spaces`, `docs/systems`, `docs/materials`의 모든 H2 본문을 검색하고 `@evidence` 주석은 인계 원문에서 뺀다. 영어 단어는 ASCII 경계를 써서 `cabinet과`를 잡고 `bedroom`을 `bed`로 세지 않는다. 어휘 적중은 인계 후보이지 자동으로 원형 책임이라는 뜻이 아니다. 아래의 요소군은 settings·spaces·systems의 실제 원형 인계를 묶은 것이며, materials의 면 결속은 위의 face id 표가 받는다. 모델 원형의 설계 owner는 아래에, 실제 메시 생산은 독립 판정 후 열리는 `modelSources`에 있다.

| 부모·형제 H2 | 넘긴 요소군 또는 비인계 응답 | 설계 owner |
|---|---|---|
| [제작 배분](../../settings/00-production.md#build-allocation), [대지](../../settings/10-house.md#site-identity) | 부재·가구를 models에 배정하는 일반 규칙과 실제 수목 원형; 자동차 제외 | 개별 부재·가구는 아래 해당 행의 원형, [수목](../../models/16-planting.md#site-tree-prototypes)·[관목](../../models/16-planting.md#site-shrub-prototype), [표현 범위](../../models/00-model-frame.md#model-representation-ceiling) |
| [매스](../../settings/10-house.md#main-mass), [지붕 접합](../../spaces/roof/00-junctions.md#roof-shared-edges) | 사이딩·지붕널·금속 접합 | [사이딩](../../models/15-outdoor.md#lap-siding-board), [지붕널](../../models/15-outdoor.md#asphalt-shingle-strip) |
| [오른쪽 지붕/벽 접합](../../spaces/envelope/right.md#right-roof-closures) | 공유 벽을 따라 0.15 m 오르는 후레싱; 벽 몸체는 spaces | [접합 금속](../../models/15-outdoor.md#asphalt-shingle-strip) |
| [포치](../../settings/10-house.md#porch-entry), [구조](../../spaces/porch.md#porch-roof-columns) | 현관문·벽등·발판·화분 | [문](../../models/02-exterior-doors.md#front-entry-door), [벽등](../../models/17-light-fixtures.md#porch-wall-sconce), [소품](../../models/18-house-props.md#porch-mat-planter) |
| [현관](../../settings/10-house.md#entry), [외투장](../../spaces/rooms/entry.md#entry-coat-storage) | 문짝·봉·선반 | [외투장 문](../../models/05-closet-fittings.md#coat-closet-doors), [봉](../../models/05-closet-fittings.md#coat-closet-rod-shelf) |
| [거실](../../settings/10-house.md#living), [예약](../../spaces/rooms/living.md#living-furniture-use) | 좌석·커피탁자·책장·러그·벽난로 화구/선반·탁상 소품·액자/식물·쿠션/담요 | [소파](../../models/11-living.md#fabric-sofa), [안락의자](../../models/11-living.md#reading-armchair), [커피탁자](../../models/11-living.md#low-table), [책장](../../models/11-living.md#dark-bookcase), [러그](../../models/11-living.md#floor-covering), [화구](../../models/11-living.md#fireplace-insert-mantel), [탁상](../../models/19-room-accents.md#living-tabletop-props), [액자·식물](../../models/19-room-accents.md#wall-art-indoor-plant), [쿠션·담요](../../models/19-room-accents.md#sofa-throws) |
| [계단](../../settings/10-house.md#stair), [경계](../../spaces/02-stair.md#stair-boundary-heights) | 난간살·아래 부재 | [난간살](../../models/04-stair-members.md#stair-balusters), [아래 부재](../../models/04-stair-members.md#stair-bottom-member) |
| [공용부](../../settings/10-house.md#common-room), [주방 벽](../../spaces/rooms/common.md#common-kitchen-wall-reservation) | 하부장·상부장·냉장고·레인지·전자레인지·조리 소품 | [하부장](../../models/10-kitchen-dining.md#kitchen-base-run), [상부장](../../models/10-kitchen-dining.md#kitchen-wall-cabinet), [냉장고](../../models/10-kitchen-dining.md#kitchen-refrigerator), [레인지](../../models/10-kitchen-dining.md#kitchen-range), [전자레인지](../../models/10-kitchen-dining.md#kitchen-microwave), [소품](../../models/18-house-props.md#kitchen-food-utensils) |
| [섬](../../spaces/rooms/common.md#common-island-reservation), [식탁](../../spaces/rooms/common.md#common-dining-reservation) | 섬·싱크·식기세척기·스툴·식탁·의자 | [싱크 포함 섬](../../models/10-kitchen-dining.md#kitchen-island), [식기세척기](../../models/10-kitchen-dining.md#kitchen-dishwasher), [스툴](../../models/10-kitchen-dining.md#kitchen-island-stool), [식탁](../../models/10-kitchen-dining.md#dining-table), [의자](../../models/10-kitchen-dining.md#dining-chair) |
| [가족실](../../spaces/rooms/common.md#common-family-reservation) | 소파·탁자·러그 | [소파](../../models/11-living.md#fabric-sofa), [탁자](../../models/11-living.md#low-table), [러그](../../models/11-living.md#floor-covering) |
| [팬트리](../../settings/10-house.md#pantry), [예약](../../spaces/rooms/pantry.md#pantry-storage-use) | 선반·용기·상자·바구니 | [선반](../../models/12-service-rooms.md#pantry-l-shelf), [용기](../../models/12-service-rooms.md#pantry-containers) |
| [파우더룸](../../settings/10-house.md#powder), [예약](../../spaces/rooms/powder.md#powder-fixture-use) | 변기·세면장·거울·수건걸이·등 | [변기](../../models/14-bathrooms.md#shared-toilet), [세면장](../../models/14-bathrooms.md#vanity-basin), [거울](../../models/14-bathrooms.md#wall-mirror), [수건걸이](../../models/14-bathrooms.md#towel-bar), [세면등](../../models/17-light-fixtures.md#vanity-wall-fixture) |
| [세탁실](../../settings/10-house.md#laundry-mudroom), [예약](../../spaces/rooms/laundry.md#laundry-equipment-use) | 세탁기·건조기·상판·상부장·벤치·옷걸이 | [기기](../../models/12-service-rooms.md#laundry-machine), [상판](../../models/12-service-rooms.md#laundry-folding-top), [상부장](../../models/12-service-rooms.md#laundry-upper-storage), [벤치](../../models/12-service-rooms.md#mudroom-bench), [옷걸이](../../models/12-service-rooms.md#mudroom-coat-hooks) |
| [빈 차고](../../settings/10-house.md#garage), [수납](../../spaces/rooms/garage-interior.md#garage-storage-use) | 차고문·선반·작업대·공구판; 자동차 제외 | [차고문](../../models/02-exterior-doors.md#garage-sectional-door), [선반](../../models/12-service-rooms.md#garage-shelving), [작업대](../../models/12-service-rooms.md#garage-workbench), [공구판](../../models/12-service-rooms.md#garage-tool-board) |
| [주침실](../../settings/10-house.md#primary-bedroom), [예약](../../spaces/rooms/primary.md#primary-furniture-use) | 침대·협탁등·서랍장·커튼 | [침대](../../models/13-bedrooms.md#headboard-bed), [협탁등](../../models/13-bedrooms.md#nightstand-lamp), [서랍장](../../models/13-bedrooms.md#low-dresser), [커튼](../../models/13-bedrooms.md#primary-window-curtains) |
| [거실·가족실·두 작은 침실 커튼 띠](../../spaces/06-openings.md#selected-window-curtain-strips) | 여섯 창의 정적 커튼 부재; 위치 반복은 instances | [여덟 창 공통 커튼 원형](../../models/13-bedrooms.md#primary-window-curtains) |
| [둘째 침실](../../settings/10-house.md#bedroom-two), [셋째 침실](../../settings/10-house.md#bedroom-three), [둘째 예약](../../spaces/rooms/bedroom-two.md#bedroom-two-furniture-use), [셋째 예약](../../spaces/rooms/bedroom-three.md#bedroom-three-furniture-use) | 두 방 각각의 침대·책상·의자·미닫이 옷장 | [침대](../../models/13-bedrooms.md#headboard-bed), [책상](../../models/13-bedrooms.md#child-desk), [의자](../../models/13-bedrooms.md#desk-chair), [옷장](../../models/13-bedrooms.md#sliding-closet) |
| [샤워 욕실](../../settings/10-house.md#shower-bathroom), [예약](../../spaces/rooms/shower-bath.md#shower-fixture-use) | 부스·변기·세면장·벽감 병·매트 | [부스](../../models/14-bathrooms.md#sliding-shower-booth), [변기](../../models/14-bathrooms.md#shared-toilet), [세면장](../../models/14-bathrooms.md#vanity-basin), [병](../../models/14-bathrooms.md#shower-niche-bottles), [매트](../../models/14-bathrooms.md#bath-floor-mats) |
| [욕조 욕실](../../settings/10-house.md#tub-bathroom), [예약](../../spaces/rooms/tub-bath.md#tub-fixture-use) | 욕조·수전·커튼·세면장·거울·수건걸이 | [수전 포함 욕조](../../models/14-bathrooms.md#bathtub), [커튼](../../models/14-bathrooms.md#tub-curtain-rail), [세면장](../../models/14-bathrooms.md#vanity-basin), [거울](../../models/14-bathrooms.md#wall-mirror), [수건걸이](../../models/14-bathrooms.md#towel-bar) |
| [수납](../../settings/10-house.md#storage), [린넨장](../../spaces/rooms/upper-hall.md#upper-linen-storage), [옷방](../../spaces/rooms/wardrobe.md#wardrobe-storage-use) | 문·선반·옷·바구니·접힌 수건 | [린넨장 문·선반](../../models/05-closet-fittings.md#linen-closet-fittings), [옷](../../models/13-bedrooms.md#wardrobe-hanging), [옷방 선반·바구니](../../models/13-bedrooms.md#wardrobe-shelves), [수건](../../models/18-house-props.md#linen-folded-towels) |
| [개구부](../../settings/10-house.md#openings), [외부 충전](../../spaces/06-openings.md#external-opening-interface), [정원문 소유](../../spaces/envelope/rear.md#garden-door) | 창·문·경첩·손잡이; rear 벽·void·문턱은 spaces | [창](../../models/01-windows.md#window-member-sizes), [현관문](../../models/02-exterior-doors.md#front-entry-door), [정원문](../../models/02-exterior-doors.md#garden-door-pair), [외부 문 표면](../../models/02-exterior-doors.md#exterior-door-surfaces), [실내 문](../../models/03-interior-doors.md#interior-door-members) |
| [입면의 벽 절단면](../../spaces/03-surface-owners.md#exterior-surface-handoff) | 벽 몸체·void·벽 절단면은 spaces, 별도 닫힌 창·문 trim/충전 부재는 models | [창 trim](../../models/01-windows.md#window-sill-trim), [문 trim](../../models/02-exterior-doors.md#exterior-door-surfaces) |
| [실내 문 접합](../../spaces/07-boundary-assembly.md#interior-boundary-junctions), [방 면 인계](../../spaces/03-surface-owners.md#interior-surface-handoff) | 벽 절단·reveal·바닥 전환은 spaces, 11개 실내 문의 닫힌 문설주·문선·문짝·철물은 models | [실내 문 부재](../../models/03-interior-doors.md#interior-door-members) |
| [방 면 인계](../../spaces/03-surface-owners.md#interior-surface-handoff), [흰 실내 trim](../../materials/02-interior-shell.md#interior-trim-white), [벽 도장](../../materials/02-interior-shell.md#interior-wall-paint), [재료 경계](../../materials/00-material-frame.md#material-binding-rule) | 방의 벽·바닥 마감은 spaces, 별도 닫힌 벽 하단 판은 models; 도장과 흰 trim 결속은 materials | [벽 걸레받이 원형](../../models/06-interior-trim.md#wall-baseboard) |
| [외벽 모서리 접합](../../spaces/07-boundary-assembly.md#exterior-boundary-junctions), [흰 trim](../../materials/01-exterior.md#trim-white) | 모서리 구조 벽·연속 입면은 spaces, 두 날개의 별도 닫힌 L자 판은 models | [모서리 trim 판](../../models/15-outdoor.md#exterior-corner-trim) |
| [바닥 타일](../../materials/02-interior-shell.md#bath-floor-tile), [벽 타일](../../materials/02-interior-shell.md#bath-wall-tile), [줄눈](../../materials/02-interior-shell.md#tile-grout) | 별도 오목 geometry 인계 없음; 기존 타일 면 UV의 0.005 m 줄눈·normal 응답 | [줄눈 재료 함수](../../materials/02-interior-shell.md#tile-grout) |
| [벽돌 외관](../../materials/01-exterior.md#brick-red-brown), [공통 텍스처 응답](../../materials/00-material-frame.md#material-texture-response) | 별도 모르타르 메시 인계 없음; 기존 벽돌 면 UV에서 0.01 m 줄눈·normal 마스크 | [벽돌 재료 함수](../../materials/01-exterior.md#brick-red-brown) |
| [대문 접속](../../spaces/site/side-walk.md#side-gate-interface), [울타리](../../spaces/site/fence.md#fence-enclosure-plan), [표면 owner](../../spaces/03-surface-owners.md#exterior-surface-handoff) | 대문 문짝·철물은 models; 고정 울타리·문기둥은 spaces | [대문](../../models/02-exterior-doors.md#side-yard-gate) |
| [테라스](../../spaces/site/terrace.md#garden-terrace-plan), [대지](../../settings/10-house.md#site-identity) | 테라스 식탁·의자·나무·관목, 정원문 문짝은 별도 models 충전; 바깥 대기 바닥은 terrace, 후벽·void·문턱판은 rear | [식탁](../../models/15-outdoor.md#terrace-table), [의자](../../models/15-outdoor.md#terrace-chair), [나무](../../models/16-planting.md#site-tree-prototypes), [관목](../../models/16-planting.md#site-shrub-prototype), [정원문](../../models/02-exterior-doors.md#garden-door-pair) |
| [광원 소유](../../systems/00-lighting-frame.md#lighting-authority), [공용부 등](../../systems/02-interior-fixtures.md#interior-common-pendants) | 기구 몸체·갓; 광원 레코드는 systems | [펜던트](../../models/17-light-fixtures.md#pendant-fixtures) |
| [1층 등](../../systems/02-interior-fixtures.md#interior-ground-ceiling), [계단·복도 등](../../systems/02-interior-fixtures.md#interior-stair-hall), [상층 등](../../systems/02-interior-fixtures.md#interior-bedrooms), [차고 등](../../systems/02-interior-fixtures.md#interior-garage) | 천장등·협탁등 몸체 | [천장등](../../models/17-light-fixtures.md#flush-ceiling-fixture), [협탁등](../../models/13-bedrooms.md#nightstand-lamp) |
| [욕실 등](../../systems/02-interior-fixtures.md#interior-baths), [포치 벽등](../../systems/03-exterior-fixtures.md#exterior-porch-sconce) | 세면등·포치 벽등 몸체 | [세면등](../../models/17-light-fixtures.md#vanity-wall-fixture), [포치 등](../../models/17-light-fixtures.md#porch-wall-sconce) |
| [차고 앞 개구부](../../spaces/envelope/front.md#garage-front-opening) | 네 패널·창·레일·가이드 | [차고문](../../models/02-exterior-doors.md#garage-sectional-door) |
| [벽난로 굴뚝 접면](../../spaces/envelope/left.md#chimney-roof-interface) | 비운 화구 안쪽·목재 선반과 금속 후레싱; 벽돌은 spaces | [화구](../../models/11-living.md#fireplace-insert-mantel), [지붕 접합 금속](../../models/15-outdoor.md#asphalt-shingle-strip) |
| [둘째 침실 가구](../../spaces/rooms/bedroom-two.md#bedroom-two-furniture-use) | 미닫이 옷장·옷·책상 소품 | [옷장](../../models/13-bedrooms.md#sliding-closet), [책상](../../models/13-bedrooms.md#child-desk) |
| [현관 문 개구부](../../spaces/rooms/entry.md#entry-plan), [계단 앞창](../../spaces/02-stair.md#stair-floor-opening) | 현관문과 계단 고정창 | [현관문](../../models/02-exterior-doors.md#front-entry-door), [고정창](../../models/01-windows.md#fixed-window) |
| [울타리 관리문](../../spaces/site/fence.md#fence-gate-junction), [지표 접점](../../spaces/site/fence.md#fence-ground-profile) | 대문 문짝·철물과 후속 식재 원형; 울타리 패널과 접지는 spaces | [대문](../../models/02-exterior-doors.md#side-yard-gate), [관목](../../models/16-planting.md#site-shrub-prototype) |

어휘 적중 중 모델 원형 인계가 아닌 것은 다음과 같이 분리한다. [작업 언어](../../settings/00-production.md#working-language)와 [관찰 비교](../../spaces/04-observations.md#reference-spatial-comparisons)는 표현·검사 규칙이다. [재료 문법](../../settings/20-verification.md#visual-grammar)·[표면 분해](../../settings/20-verification.md#surface-allocation)·[텍스처 응답](../../materials/00-material-frame.md#material-texture-response)·[목재 손잡이 마감](../../materials/02-interior-shell.md#handrail-wood)은 모델 원형을 넘기는 문장이 아니라 면 경계와 마감의 책임을 정한다. materials/01–03의 H2 중 기존 모델 face id에 재료를 붙이는 경우는 위 재료 대조표의 소비자다. [욕실 바닥 타일](../../materials/02-interior-shell.md#bath-floor-tile)·[욕실 벽 타일](../../materials/02-interior-shell.md#bath-wall-tile)·[타일 줄눈](../../materials/02-interior-shell.md#tile-grout)·[벽돌 마감](../../materials/01-exterior.md#brick-red-brown)은 예전의 존재하지 않는 오목 줄눈 geometry 전제를 버렸다. 이제 줄눈은 기존 타일·벽돌 면의 UV에 결합하는 materialSources의 텍스처 응답이며 별도 models/spaces 부재를 넘기지 않는다. 설계 owner는 위 대응표의 타일·벽돌 재료 H2다. [조명 기준 상태](../../systems/00-lighting-frame.md#lighting-static-state)·[광량 예산](../../systems/00-lighting-frame.md#lighting-budget)·[리뷰](../../systems/00-lighting-frame.md#lighting-review-set)·[하늘 채광](../../systems/01-daylight.md#daylight-sky-fill)·[실내 채광](../../systems/01-daylight.md#daylight-interior-reach)은 광원과 관찰의 절차이므로 별도 기구 몸체를 넘기지 않는다. [본채 외곽](../../spaces/00-building.md#main-building-extent), [차고 외곽](../../spaces/00-building.md#attached-garage-extent), [내부 벽 소유](../../spaces/07-boundary-assembly.md#interior-boundary-ownership), [천장 바탕](../../spaces/09-ceiling-assembly.md#upper-ceiling-closure), [지붕/벽 상단](../../spaces/roof/00-junctions.md#roof-wall-head-junctions)은 spaces의 부재·경계다. [차도](../../spaces/site/driveway.md#driveway-plan), [앞길](../../spaces/site/front-walk.md#front-walk-plan), [옆길](../../spaces/site/side-walk.md#side-walk-plan)은 maps/spaces 포장과 통행이며 모델 원형을 넘기지 않는다.
