# 모델 층의 완결 표면 소유

## 모델 H2 전수 표면 소유와 재료 인터페이스 {#model-surface-ownership}
<!--
@evidence contracts/surface-ownership.md#whole-surface-owner 모델 H2 96개를 아래 계정에 한 번씩 적고 부재별 surface id와 source owner를 대조한다. 이는 설계 인터페이스 계정이며 아직 없는 modelSources 메시의 실제 face binding은 unverified다.
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
| [window-sill-trim](../../models/01-windows.md#window-sill-trim) | `src/models/windows.ts` | `exterior-trim`·`interior-sill` |
| [window-surface-partitions](../../models/01-windows.md#window-surface-partitions) | — (규칙) | `frame`·`sash`·`mullion`·`muntin`·`glass`·`obscured-glass`·`exterior-trim`·`interior-sill` |
| [window-fidelity](../../models/01-windows.md#window-fidelity) | — (규칙) | — (새 메시 없음) |
| [front-entry-door](../../models/02-exterior-doors.md#front-entry-door) | `src/models/exterior-door.ts` | `jamb`·`exterior-trim`·`casing`·`leaf-exterior`·`leaf-interior`·`leaf-edge`·`leaf-panel`·`muntin`·`glass`·`handle`·`hinge` |
| [garage-sectional-door](../../models/02-exterior-doors.md#garage-sectional-door) | `src/models/garage-door.ts` | `jamb`·`rail`·`leaf-exterior`·`leaf-interior`·`leaf-panel`·`panel-edge`·`glass`·`sash` |
| [garden-door-pair](../../models/02-exterior-doors.md#garden-door-pair) | `src/models/exterior-door.ts` | `jamb`·`exterior-trim`·`casing`·`leaf-exterior`·`leaf-interior`·`leaf-edge`·`sash`·`glass`·`handle`·`hinge` |
| [side-yard-gate](../../models/02-exterior-doors.md#side-yard-gate) | `src/models/gate.ts` | `leaf-panel`·`gate-batten`·`hinge`·`handle` |
| [exterior-door-surfaces](../../models/02-exterior-doors.md#exterior-door-surfaces) | — (규칙) | `jamb`·`exterior-trim`·`casing`·`leaf-exterior`·`leaf-interior`·`leaf-edge`·`leaf-panel`·`panel-edge`·`muntin`·`glass`·`sash`·`handle`·`hinge`·`rail`·`gate-batten` |
| [exterior-door-fidelity](../../models/02-exterior-doors.md#exterior-door-fidelity) | — (규칙) | — (새 메시 없음) |
| [interior-door-members](../../models/03-interior-doors.md#interior-door-members) | `src/models/interior-door.ts` | `jamb-a`·`jamb-b`·`jamb-core`·`casing-a`·`casing-b`·`leaf`·`leaf-panel`·`handle`·`hinge` |
| [interior-door-hinges](../../models/03-interior-doors.md#interior-door-hinges) | `src/models/interior-door.ts` | `hinge` |
| [interior-door-surfaces](../../models/03-interior-doors.md#interior-door-surfaces) | — (규칙) | `jamb-a`·`jamb-b`·`jamb-core`·`casing-a`·`casing-b`·`leaf`·`leaf-panel`·`handle`·`hinge` |
| [interior-door-fidelity](../../models/03-interior-doors.md#interior-door-fidelity) | — (규칙) | — (새 메시 없음) |
| [stair-balusters](../../models/04-stair-members.md#stair-balusters) | `src/models/stair-baluster.ts` | `baluster` |
| [stair-bottom-member](../../models/04-stair-members.md#stair-bottom-member) | `src/models/stair-baluster.ts` | `bottom-rail` |
| [stair-member-surfaces](../../models/04-stair-members.md#stair-member-surfaces) | — (규칙) | `baluster`·`bottom-rail` |
| [stair-member-fidelity](../../models/04-stair-members.md#stair-member-fidelity) | — (규칙) | — (새 메시 없음) |
| [coat-closet-doors](../../models/05-closet-fittings.md#coat-closet-doors) | `src/models/closet.ts` | `leaf`·`leaf-panel`·`rail`·`handle` |
| [coat-closet-rod-shelf](../../models/05-closet-fittings.md#coat-closet-rod-shelf) | `src/models/closet.ts` | `rod`·`shelf` |
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
| [mudroom-coat-hooks](../../models/12-service-rooms.md#mudroom-coat-hooks) | `src/models/furnishings/service-rooms.ts` | `rail`·`hook`·`clothes` |
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

다음 표는 위 96행에 등장한 **모든 face id**의 설계 결속 경로다. 하나의 id가 여러 재료 행에 있으면 모델 H2와 배치 변형을 함께 키로 사용한다(예: `leaf`의 실내 문/주방 가전, `glass`의 건물 창/세탁기 문). 그 선택을 버리고 id 문자열 하나로 재료를 고르면 오결속이다. 결합이 없는 id는 없도록 위 스크립트의 집합 대조로 확인했지만, 실제 메시의 id 누락·중복은 modelSources와 materialSources가 생기기 전에는 unverified다.

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
| [interior-trim-white](../../materials/02-interior-shell.md#interior-trim-white) | `interior-sill`·`casing`·`casing-a`·`casing-b`·`jamb-a`·`jamb-b`·`jamb-core`·`leaf`·`leaf-panel`·`shelf`·`carcass` |
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
