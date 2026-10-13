# Complete-surface ownership in the model layer

## Complete model-H2 surface ownership and material interfaces {#model-surface-ownership}
<!--
@evidence contracts/surface-ownership.md#whole-surface-owner Lists each model H2 once below and compares per-member surface ids/source owners. The linked upstream-member-handoff and material-face-ownership accounts connect parent/sibling prototypes and material bindings with their design owners. Model sources exist, including the implemented building fittings; complete correspondence between every declared face/material binding and the actual mesh population remains unverified.
-->

One source produces each complete surface under the [original contract](../../contracts/surface-ownership.md#whole-surface-owner). In the rows below, a dash means a rule, representation limit or verification procedure creates no separate volume. Repeated ids in structure, articulation and surface-description H2s of one prototype do not mean duplicated meshes. Every closed member's front, back, top, bottom, cut and recessed reveal face receives exactly one id under the [model-surface rule](../../models/00-model-frame.md#model-surface-partition-naming). Joint names and placement ids are not face ids.

| Model H2 | model source owner | Declared face ids |
|---|---|---|
| [model-local-frame](../../models/00-model-frame.md#model-local-frame) | — (rule) | — (no new mesh) |
| [model-furniture-local-frame](../../models/00-model-frame.md#model-furniture-local-frame) | — (rule) | — (no new mesh) |
| [model-reference-scale](../../models/00-model-frame.md#model-reference-scale) | — (rule) | — (no new mesh) |
| [model-representation-ceiling](../../models/00-model-frame.md#model-representation-ceiling) | — (rule) | — (no new mesh) |
| [model-surface-partition-naming](../../models/00-model-frame.md#model-surface-partition-naming) | — (rule) | — (no new mesh) |
| [model-representation-completion](../../models/00-model-frame.md#model-representation-completion) | — (rule) | — (no new mesh) |
| [model-review-set](../../models/00-model-frame.md#model-review-set) | — (rule) | — (no new mesh) |
| [window-local-frame](../../models/01-windows.md#window-local-frame) | `src/models/windows.ts` | `frame` |
| [window-member-sizes](../../models/01-windows.md#window-member-sizes) | `src/models/windows.ts` | `frame`·`sash`·`mullion`·`muntin`·`glass` |
| [window-muntin-grid](../../models/01-windows.md#window-muntin-grid) | `src/models/windows.ts` | `muntin`·`glass` |
| [double-hung-window](../../models/01-windows.md#double-hung-window) | `src/models/windows.ts` | `frame`·`sash`·`mullion`·`muntin`·`glass` |
| [fixed-window](../../models/01-windows.md#fixed-window) | `src/models/windows.ts` | `frame`·`sash`·`mullion`·`muntin`·`glass` |
| [awning-window](../../models/01-windows.md#awning-window) | `src/models/windows.ts` | `frame`·`sash`·`obscured-glass` |
| [window-sill-trim](../../models/01-windows.md#window-sill-trim) | `src/models/windows.ts` | `exterior-trim`·`interior-sill`·`interior-casing` |
| [window-surface-partitions](../../models/01-windows.md#window-surface-partitions) | — (rule) | `frame`·`sash`·`mullion`·`muntin`·`glass`·`obscured-glass`·`exterior-trim`·`interior-sill`·`interior-casing` |
| [window-fidelity](../../models/01-windows.md#window-fidelity) | — (rule) | — (no new mesh) |
| [front-entry-door](../../models/02-exterior-doors.md#front-entry-door) | `src/models/exterior-door.ts` | `jamb`·`exterior-trim`·`casing`·`leaf-exterior`·`leaf-interior`·`leaf-edge`·`leaf-panel`·`muntin`·`glass`·`handle`·`hinge` |
| [garage-sectional-door](../../models/02-exterior-doors.md#garage-sectional-door) | `src/models/garage-door.ts` | `jamb`·`exterior-trim`·`rail`·`leaf-exterior`·`leaf-interior`·`leaf-panel`·`panel-edge`·`glass`·`sash` |
| [garden-door-pair](../../models/02-exterior-doors.md#garden-door-pair) | `src/models/exterior-door.ts` | `jamb`·`exterior-trim`·`casing`·`leaf-exterior`·`leaf-interior`·`leaf-edge`·`sash`·`glass`·`handle`·`hinge` |
| [side-yard-gate](../../models/02-exterior-doors.md#side-yard-gate) | `src/models/gate.ts` | `leaf-panel`·`gate-batten`·`hinge`·`handle` |
| [exterior-door-surfaces](../../models/02-exterior-doors.md#exterior-door-surfaces) | — (rule) | `jamb`·`exterior-trim`·`casing`·`leaf-exterior`·`leaf-interior`·`leaf-edge`·`leaf-panel`·`panel-edge`·`muntin`·`glass`·`sash`·`handle`·`hinge`·`rail`·`gate-batten` |
| [exterior-door-fidelity](../../models/02-exterior-doors.md#exterior-door-fidelity) | — (rule) | — (no new mesh) |
| [interior-door-members](../../models/03-interior-doors.md#interior-door-members) | `src/models/interior-door.ts` | `jamb-a`·`jamb-b`·`jamb-core`·`casing-a`·`casing-b`·`leaf`·`leaf-panel`·`handle`·`hinge` |
| [interior-door-hinges](../../models/03-interior-doors.md#interior-door-hinges) | — (articulation rule; hinge bodies belong to interior-door-members) | `hinge` |
| [interior-door-surfaces](../../models/03-interior-doors.md#interior-door-surfaces) | — (rule) | `jamb-a`·`jamb-b`·`jamb-core`·`casing-a`·`casing-b`·`leaf`·`leaf-panel`·`handle`·`hinge` |
| [interior-door-fidelity](../../models/03-interior-doors.md#interior-door-fidelity) | — (rule) | — (no new mesh) |
| [stair-balusters](../../models/04-stair-members.md#stair-balusters) | `src/models/stair-baluster.ts` | `baluster` |
| [stair-bottom-member](../../models/04-stair-members.md#stair-bottom-member) | `src/models/stair-baluster.ts` | `bottom-rail` |
| [stair-side-skirt](../../models/04-stair-members.md#stair-side-skirt) | `src/models/stair-skirt.ts` | `stair-skirt` |
| [stair-member-surfaces](../../models/04-stair-members.md#stair-member-surfaces) | — (rule) | `baluster`·`bottom-rail` |
| [stair-member-fidelity](../../models/04-stair-members.md#stair-member-fidelity) | — (rule) | — (no new mesh) |
| [coat-closet-doors](../../models/05-closet-fittings.md#coat-closet-doors) | `src/models/closet.ts` | `leaf`·`leaf-panel`·`rail`·`handle`·`casing` |
| [coat-closet-rod-shelf](../../models/05-closet-fittings.md#coat-closet-rod-shelf) | `src/models/closet.ts` | `rod`·`shelf` |
| [wall-baseboard](../../models/06-interior-trim.md#wall-baseboard) | `src/models/interior/baseboard.ts` | `wall-baseboard` |
| [linen-closet-fittings](../../models/05-closet-fittings.md#linen-closet-fittings) | `src/models/closet.ts` | `leaf`·`leaf-panel`·`rail`·`handle`·`shelf`·`casing` |
| [closet-fitting-surfaces](../../models/05-closet-fittings.md#closet-fitting-surfaces) | — (rule) | `leaf`·`leaf-panel`·`rail`·`rod`·`shelf`·`handle`·`casing` |
| [closet-fitting-fidelity](../../models/05-closet-fittings.md#closet-fitting-fidelity) | — (rule) | — (no new mesh) |
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
| [pantry-containers](../../models/12-service-rooms.md#pantry-containers) | `src/models/furnishings/service-rooms.ts` | `container`·`lid`·`box`·`basket` |
| [garage-shelving](../../models/12-service-rooms.md#garage-shelving) | `src/models/furnishings/service-rooms.ts` | `post`·`shelf`·`bin` |
| [garage-workbench](../../models/12-service-rooms.md#garage-workbench) | `src/models/furnishings/service-rooms.ts` | `top`·`leg`·`drawer-front`·`handle` |
| [garage-tool-board](../../models/12-service-rooms.md#garage-tool-board) | `src/models/furnishings/service-rooms.ts` | `board`·`tool-steel`·`tool-grip`·`bin` |
| [headboard-bed](../../models/13-bedrooms.md#headboard-bed) | `src/models/furnishings/bedrooms.ts` | `headboard`·`bed-frame`·`mattress`·`bedding`·`pillow` |
| [nightstand-lamp](../../models/13-bedrooms.md#nightstand-lamp) | `src/models/furnishings/bedrooms.ts` | `carcass`·`drawer-front`·`lamp-base`·`lamp-shade` |
| [low-dresser](../../models/13-bedrooms.md#low-dresser) | `src/models/furnishings/bedrooms.ts` | `carcass`·`drawer-front`·`handle`·`leg` |
| [child-desk](../../models/13-bedrooms.md#child-desk) | `src/models/furnishings/bedrooms.ts` | `top`·`leg`·`shelf`·`book`·`container`·`pencil` |
| [desk-chair](../../models/13-bedrooms.md#desk-chair) | `src/models/furnishings/bedrooms.ts` | `seat`·`leg`·`back` |
| [sliding-closet](../../models/13-bedrooms.md#sliding-closet) | `src/models/furnishings/bedrooms.ts` | `carcass`·`leaf`·`handle`·`rail`·`rod`·`shelf`·`clothes`·`casing` |
| [primary-window-curtains](../../models/13-bedrooms.md#primary-window-curtains) | `src/models/furnishings/bedrooms.ts` | `rod`·`bracket`·`curtain` |
| [wardrobe-hanging](../../models/13-bedrooms.md#wardrobe-hanging) | `src/models/furnishings/bedrooms.ts` | `rod`·`shelf`·`carcass`·`clothes` |
| [wardrobe-shelves](../../models/13-bedrooms.md#wardrobe-shelves) | `src/models/furnishings/bedrooms.ts` | `shelf`·`carcass`·`folded`·`shoe-box`·`basket` |
| [shared-toilet](../../models/14-bathrooms.md#shared-toilet) | `src/models/furnishings/sanitary-fittings.ts` | `ceramic`·`toilet-seat`·`lid`·`handle` |
| [vanity-basin](../../models/14-bathrooms.md#vanity-basin) | `src/models/furnishings/bathrooms.ts` | `plinth`·`carcass`·`leaf`·`countertop`·`ceramic`·`faucet`·`handle`·`accessory` |
| [wall-mirror](../../models/14-bathrooms.md#wall-mirror) | `src/models/furnishings/sanitary-fittings.ts` | `mirror-frame`·`mirror` |
| [towel-bar](../../models/14-bathrooms.md#towel-bar) | `src/models/furnishings/sanitary-fittings.ts` | `rod`·`bracket`·`towel` |
| [sliding-shower-booth](../../models/14-bathrooms.md#sliding-shower-booth) | `src/models/furnishings/bathrooms.ts` | `shower-tray`·`glass`·`rail`·`handle`·`faucet` |
| [bathtub](../../models/14-bathrooms.md#bathtub) | `src/models/furnishings/bathrooms.ts` | `ceramic`·`faucet` |
| [tub-curtain-rail](../../models/14-bathrooms.md#tub-curtain-rail) | `src/models/furnishings/sanitary-fittings.ts` | `rail`·`rod`·`curtain` |
| [bath-floor-mats](../../models/14-bathrooms.md#bath-floor-mats) | `src/models/furnishings/bathrooms.ts` | `field`·`border` |
| [shower-niche-bottles](../../models/14-bathrooms.md#shower-niche-bottles) | `src/models/furnishings/bathrooms.ts` | `container`·`lid` |
| [terrace-table](../../models/15-outdoor.md#terrace-table) | `src/models/furnishings/outdoor.ts` | `top`·`leg` |
| [terrace-chair](../../models/15-outdoor.md#terrace-chair) | `src/models/furnishings/outdoor.ts` | `seat`·`leg`·`back` |
| [lap-siding-board](../../models/15-outdoor.md#lap-siding-board) | `src/models/exterior/siding.ts` | `siding-face`·`siding-butt`·`siding-back`·`siding-top`·`siding-cut` |
| [exterior-corner-trim](../../models/15-outdoor.md#exterior-corner-trim) | `src/models/exterior/trim.ts` | `exterior-trim` (front/side/back/top/bottom/cut ends) |
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

Only spaces' `src/spaces/envelope/front.ts`/`rear.ts` produce front/rear threshold tops +0.02 m; only `src/spaces/site/fence.ts` produces fence posts/crossbeams; only `src/spaces/rooms/entry.ts` produces coat-closet walls/openings. Models produces only door/gate/coat-closet leaves and rods. `src/spaces/envelope/left.ts` produces fireplace brick/void, while `src/models/furnishings/living.ts` produces the metal firebox/wooden mantel. Spaces roof source produces eave structure/fascia; models `exterior/*` produces gutters/downspouts. Reinspect actual closed-surface duplication after source implementation.

Material bindings are recorded in [Material-face ownership](material-face-ownership.md#material-face-ownership), and upstream member handoffs are recorded in [Upstream-member handoff](upstream-member-handoff.md#upstream-member-handoff).
