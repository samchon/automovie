# Model handoff account for existing room objects

See the [common model rules](../../models/000-representation.md#model-address-and-scale).

## Item root correspondence {#legacy-root-correspondence}

<!--
@evidence contracts/model-fitout-handoff.md#legacy-fitout-child-destination The table keeps the 54 roots expanded from the 46 Item authoring sites of the room sources, and even when one root uses several prototypes, each child corresponds under the conversion rules below to one stable part/face address or one named retirement.
-->

This preserves the authoring sites of the temporary meshes that the current `src/house/rooms/*.ts` and `interior.ts` generate. One row is one static authoring site, and the actual IDs of a repetition expand the finite range written. A temporary mesh is not called an approved modelSource. There are 46 `new Item(` authoring sites, and 54 root IDs after expanding states and repetitions. The null-model parent of each root corresponds to a new instance identity, and the child solids correspond to the stable addresses of the part conversion rules below. Different legacy IDs are not merged into the same successor `instance/part/face` address. Placement coordinates and room membership are owned by instances, emission by systems, and finish binding by materials. `flex-guest-bed` and `flex-murphy-frame` consume the same murphy prototype but are distinguished by the different successor part addresses of `bed-frame` and `case-*`. A `+` in the table means that the prototypes correspond to one legacy root, and the actual composition is set by each model H2's `@compose` or `@support`. Only for `entry-bench` does the `@compose` wrapper include bench-base once, so the enclosure is not placed again as a separate instance. The `@support` of the island, basin, wall worktop, cooktop, and oven mechanically compares the top face of a named part of a separate cabinet instance with a finite contact range, and the supporting parts are not generated a second time inside the decorative object.

| Source | Legacy Item root ID (expanded count) | Successor prototype/part owner |
| --- | --- | --- |
| bathroom.ts | `bath-vanity` (1) | `basin/1000`, with the vanity enclosure as `cabinet/vanity/1000x800x480/closed` |
| bathroom.ts | `bath-toilet` (1) | `toilet` |
| bathroom.ts | `bath-shower` (1) | `shower` |
| bathroom.ts | `bath-towels` (1) | `cabinet/open-shelf/600x1100x380/open` |
| child-one.ts | `child-one-bed` (1) | `fixed-bed/1000` |
| child-one.ts | `child-one-desk` (1) | `work-desk/bed-1240` + `work-display` + `work-keyboard` |
| child-one.ts | `child-one-chair` (1) | `desk-chair` |
| child-one.ts | `child-one-wardrobe` (1) | `cabinet/tall/1300x2650x600/closed` |
| child-one.ts | `child-one-books` (1) | `cabinet/open-shelf/750x1200x400/open` |
| child-two.ts | `child-two-bed` (1) | `fixed-bed/1000` |
| child-two.ts | `child-two-desk` (1) | `work-desk/bed-1250` + `work-display` + `work-keyboard` |
| child-two.ts | `child-two-chair` (1) | `desk-chair` |
| child-two.ts | `child-two-wardrobe` (1) | `cabinet/tall/1400x2600x540/closed` |
| common.ts | `common-sofa` (1) | `living-sofa/chaise-right` |
| common.ts | `common-coffee` (1) | `coffee-table` |
| common.ts | `common-media` (1) | `cabinet/media/2000x440x350/closed` |
| common.ts | `common-dining` (1) | `dining-table` |
| common.ts | `dining-chair-<z>-<i>` (6: z=-1,+1; i=0..2) | six `dining-chair` instances |
| common.ts | `kitchen-island` (1) | `kitchen-island` + `cabinet/island-base/880x870x2650/closed` |
| common.ts | `island-stool-<i>` (3: i=0..2) | three `island-stool` instances |
| common.ts | `kitchen-wall-bank` (1) | `wall-worktop` + `cooktop` + `oven` + `cabinet/kitchen-base/2900x870x620/closed` |
| common.ts | `kitchen-overhead` (1) | the five leaves of `cabinet/wall/2900x980x360/closed` |
| common.ts | `kitchen-fridge-pantry` (1) | `refrigerator`; among the existing cabinet children, the internal shelves absent from the appliance exterior are recorded in the retirement list |
| common.ts | `kitchen-sorting` (1) | `cabinet/service/640x840x600/closed` |
| common.ts | `common-plant` (1) | `potted-plant/1100` |
| entry.ts | `entry-shoe-bench` (1) | `entry-bench` + `cabinet/bench-base/1150x440x480/closed` |
| entry.ts | `entry-plant` (1) | `potted-plant/800` |
| flex.ts | `flex-desk` (1) | the required `folded` state of `work-desk/flex-1400` + `work-display` + `work-keyboard` |
| flex.ts | `flex-chair` (1) | `desk-chair` |
| flex.ts | `flex-books` (1) | `cabinet/open-shelf/950x1350x250/open` |
| flex.ts | `flex-murphy-frame` (1, shared by both states) | `case-*` of `murphy-bed` and the per-state panels |
| flex.ts | `flex-guest-bed` (1, in guest only) | guest `bed-frame/mattress/duvet/pillow/support-*` of `murphy-bed`; other parts of the same instance |
| powder.ts | `powder-toilet` (1) | `toilet` |
| powder.ts | `powder-basin` (1) | `basin/800`, which takes the actual 0.8m argument, + `cabinet/vanity/800x800x480/closed` |
| powder.ts | `powder-cleaning` (1) | `cabinet/tall/520x2250x520/closed` |
| primary.ts | `primary-bed` (1) | `fixed-bed/1800` |
| primary.ts | `primary-nightstand-<x>` (2: x=1.60,4.16) | two `cabinet/nightstand/500x460x460/closed` instances |
| primary.ts | `primary-wardrobe` (1) | `cabinet/tall/2720x2650x600/closed` |
| primary.ts | `primary-desk` (1) | `work-desk/bed-1200` + `work-display` + `work-keyboard` |
| primary.ts | `primary-chair` (1) | `desk-chair` |
| primary.ts | `primary-plant` (1) | `potted-plant/600` |
| service-upper.ts | `upper-laundry` (1) | two distinct child parts/instances, `laundry-washer` and `laundry-dryer` |
| service-upper.ts | `upper-mechanical` (1) | `cabinet/service/1100x2400x560/closed` |
| service-upper.ts | `upper-utility-shelf` (1) | `cabinet/open-shelf/850x2400x450/open` |
| storage-ground.ts | `ground-store-shelves` (1) | `cabinet/open-shelf/1550x2500x500/open` |
| storage-upper.ts | `upper-linen-cabinet` (1) | `cabinet/open-shelf/1100x2600x500/open` |

## Direct primitives and room lining {#legacy-direct-correspondence}

The 10 direct primitive authoring sites outside `Item` become 18 elements after expanding states and repetitions. The 8 `a.box(` sites and 2 `a.ellipsoid(` sites of the source are each listed below. A new decoration only adds shape in its model H2 and does not approve deleting the legacy elements of this table.

| Source authoring site | Legacy element ID (expanded count) | Successor address |
| --- | --- | --- |
| common.ts box | `common-rug` (1) | `living-rug/pile` |
| common.ts box | `common-display` (1) | `living-display/screen` |
| common.ts box | `dining-pendant-cord` (1) | `dining-pendant/cord` |
| common.ts ellipsoid | `dining-pendant` (1) | `dining-pendant/diffuser` + system emitter |
| entry.ts box | `entry-bench-cushion` (1) | `entry-bench/cushion` |
| entry.ts box | `entry-charging-shelf` (1) | `entry-charging-shelf/board` |
| entry.ts box | `entry-charger` (1) | `entry-charger/body` |
| primary.ts ellipsoid | `primary-lamp-<x>` (2: x=1.60,4.16) | `portable-lamp/bedside-globe/globe` + each system emitter |
| storage-ground.ts box | `ground-store-basket-<i>` (4: i=0..3) | four `storage-basket/wall` instances |
| storage-upper.ts box | `upper-linen-stack-<i>` (5: i=0..4) | five final `folded-towels/120/layer-0..2` instances; see the height transition below |

The existing `upper-linen-stack-0..4` boxes are each temporary cuboids 0.16m high. This row is a handoff record that preserves that past shape, not a design owner that forces the final prototype state. In the current room-by-room object population of 429, `@uses folded towel` selects `folded-towels/120`. The five stable IDs and the shelf bottom coordinates are therefore kept in [instance placement](../../instances/001-household-placement.md#direct-fitout), but the final height is 0.12m. The remaining three towels of the upper storage are also added in the same 120 state, making eight in the end. Mistaking the old 0.16m for a final model name `/160`, or generating five more on top of the eight, is a failure.

## Child faces and emission of common helpers {#legacy-helper-correspondence}

The child ids emitted by `Item.box/round` are appended after the root above as `-<name>`. The union of child IDs of the work and guest states is counted with the [current source expansion producer](../../../src/review/model-child-audit.cjs), and each ID must reach exactly one place: one of the distinct successor part/face addresses below or one named retirement. The conversions below are chosen by call path and part role, not by material string (`oak`, `white`, `green`, `tile`, `metal`). The range of each row includes the end of the integer repetition.

| Helper or handmade child | Existing name range | Successor part/face or explicit retirement |
| --- | --- | --- |
| `table()` | `top`, `leg-<x>-<z>` (x,z=±1) | dining/coffee `top`, `leg-0..3`; inside `desk()`, the work-desk `top` and the two front `support-*`; the four old flex legs and the six old rear legs of the bedroom variants are named retirements |
| `chair()` | `seat`, `back`, `leg-<x>-<z>` | for dining-chair, seat-frame/seat-pad/back/leg; the old seat and back of the four desk chairs correspond one to one to `shell-seat` and `shell-back`, and upholstery and leg receive new addresses; the new faces of one existing member divide its whole surface |
| `cabinet()` | `back`, `side-±1`, `shelf-0..ceil(H/.38)`, when closed `door-±1`, `handle-±1` | back, side, bottom, top, shelf, door or drawer, and handle of the same enclosure. `shelf-0` is the bottom and the last is the top, and the middle ones are, by shape type, either a confirmed internal shelf or a named retirement in the table below. A shelf added by the new formula is a new member. The old door −1/+1 of `nightstand`, `vanity`, and `media` corresponds one to one to the new `drawer-0/1`, and the old door −1/+1 of `kitchen-base` to `drawer-0/5`. The old handle of the same number also corresponds, and the remaining drawers and handles are new members. No `base-drawer` shape type is made. The named retirements of internal shelves are written in the table below |
| `bed()` | `base`, `leg-<x>-<z>`, `mattress`, `duvet`, `head`, `pillow-<i>` | the old single base of fixed-bed is a named retirement, and four frame rails and a `support-deck` under the mattress are made as new parts. The rest are leg/mattress/duvet/headboard/pillow; only the two front legs of the guest root correspond to murphy's `support-left/right`. The two rear legs and the old freestanding bed `head` move their function to the enclosure hinge and back-panel support and are retired by name |
| `plant()` | `pot`, `stem`, `leaf-0..8` | potted-plant pot/stem/leaf-0..8; the new branch-0..4 and leaf-9..14 are added members |
| `desk()` | top/leg of `table()`, `screen`, `screen-stand`, `keyboard` | work-desk top and front supports; the four old flex legs and the rear legs of the bedroom variants are named retirements below; independent work-display screen/stand and work-keyboard body/keys |
| `basin()` | the panels of `cabinet()`, `rim`, `bowl`, `tap`, `spout`, `mirror` | the panels of the vanity cabinet, and the stable faces of basin rim/bowl/tap-body/tap-spout/mirror |
| `toilet()` | `pedestal`, `bowl`, `seat`, `cistern`, `flush` | the toilet parts of the same role and each of their inner, outer, rim, and edge addresses; the lid is an added member |
| bathroom.ts shower | `tray`, `drain`, `fixed-screen`, `screen-rail`, `riser`, `head` | the shower parts of the same role and their separated faces; no door part is added for the open entry |
| common.ts sofa | `plinth`, `back`, `cushion-0..2`, `pillow-0..2`, `arm-±1` | frame/back-frame/seat/pillow/arm of living-sofa; the L-shaped extension is a new part |
| common.ts island | cabinet parts + `counter`, `sink`, `sink-basin`, `tap-upright`, `tap-spout` | island-base panels, `service-door-0/4`, and `service-handle-0/4`, and kitchen-island counter/sink/tap. It states that the flat stacked panel of the existing `sink-basin` is removed and replaced by a recessed bowl |
| common.ts wall bank | cabinet parts + `worktop`, `hob`, `hob-ring-<x>-<z>`(4), `oven`, `oven-handle` | the drawer and oven bays of kitchen-base, wall-worktop, cooktop zone-0..3, and oven body/front/handle |
| common.ts stool | `seat`, `leg-<x>-<z>` (3×4) | island-stool seat/leg; the ring footrest is a new member |
| flex.ts murphy | `back`, `side-<x>`, `top`, work's `closed-panel`, `pull` | murphy-bed case-back/case-side/case-top/closed-panel/pull; the guest frame is kept distinct from the guest root |
| service-upper.ts laundry | `machine-0..1`, `drum-0..1`, `window-0..1`, `controls-0..1` | body/drum/window/controls of 0=washer and 1=dryer. The root is the current group address that binds the two successor instances |

The `shelf-0` and the last `shelf-ceil(H/0.38)` of an existing cabinet correspond to the bottom and the top of the new enclosure respectively. In the open bookcase, tall, service, wall, bench-base, and island-base, a middle old shelf j moves one to one to the new `shelf-j`, and a shelf added by the new pitch is a new part. The middle two of kitchen-overhead (`shelf-1/2`), the one of entry-shoe-bench (`shelf-1`), and the two of kitchen-island (`shelf-1/2`) correspond to the confirmed internal shelves of wall, bench-base, and island-base respectively. The old door/handle −1 of a closed cabinet corresponds to the new first leaf and +1 to the new last leaf, and the leaves between are new. In the kitchen wall cabinet, `door--1/1` and `handle--1/1` reach `door-0/4` and `handle-0/4` of the five leaves respectively. The old door/handle of the lengthened island service side also reach `service-door-0/4` and `service-handle-0/4`, and the middle three are new. This correspondence does not merge two legacy doors into one new door.

| Named retired child ID or finite expansion | Count | Successor structure and reason for retirement |
| --- | ---: | --- |
| `bath-vanity-shelf-1/2`, `powder-basin-shelf-1/2` | 4 | The vanity drawers and the recessed bowl replace the internal shelf volume. |
| `primary-nightstand-1.6-shelf-1`, `primary-nightstand-4.16-shelf-1` | 2 | They become the empty interior for two full-width drawers each. |
| `common-media-shelf-1` | 1 | The existing through panel between the central open bay and the left and right drawers is removed. |
| `kitchen-wall-bank-shelf-1/2` | 2 | The open oven bay and the drawer bank replace them. The new `oven-sill` actually carries the oven but does not reuse the earlier shelf IDs. |
| `flex-desk-leg-<x>-<z>` (x,z=−1,+1) | 4 | The support system changes to the left drawer case and the right grounded telescopic column, retiring the four separate legs. |
| `primary-desk-leg-<x>--1`, `child-one-desk-leg-<x>--1`, `child-two-desk-leg-<x>--1` (x=−1,+1) | 6 | The two rear legs of each bedroom desk are replaced by a wall-side back rail. Only the two front `z=+1` legs of each correspond to `support-left/right`. |
| `flex-guest-bed-leg-<x>--1` (x=−1,+1) | 2 | The murphy enclosure and pivot take over the rear grounding of the opened bed. Only the two front `z=+1` correspond to `support-left/right`. |
| `primary-bed-base`, `child-one-bed-base`, `child-two-bed-base` | 3 | The existing closed single base volume is retired. For each bed, the four open rails `frame-side-left/right` and `frame-head/foot` of the [fixed bed](../../models/002-storage-and-sleep.md#fixed-bed) and the `support-deck` between them are authored as new addresses. |
| `kitchen-fridge-pantry-shelf-0..7` | 8 | The refrigerator interior is not delivered, so the open pantry shelves are retired. |
| `flex-guest-bed-head` | 1 | The guest head support moves to the murphy enclosure back panel. |
| `kitchen-island-sink-basin` | 1 | The flat basin is retired and replaced by the recessed bowl of kitchen-island. |

A fixed closet interior and an actual refrigerator interior are not the same function. `kitchen-fridge-pantry-shelf-0..7` is **intentionally removed by name** under the [refrigerator design](../../models/003-service-fixtures.md#refrigerator), which does not deliver the refrigerator interior, while `kitchen-fridge-pantry-door-±1` corresponds to the two refrigerator doors and `handle-±1` to the upper and lower handles. `flex-guest-bed-head` is **removed by name** because in the guest state of the [murphy design](../../models/002-storage-and-sleep.md#murphy-bed) the enclosure back panel takes over the head support. `flex-guest-bed-pillow-0` and `flex-guest-bed-duvet` correspond to the guest `pillow` and `duvet` of the same design respectively. `kitchen-island-sink-basin` is **replaced** by the recessed bowl above, without keeping the shallow panel volume as a duplicate. When the later instanceSource is implemented, these deletions and replacements must be compared one by one with the source's actual expanded IDs, reporting any omission as a failure.

The 12 `lining(a,room)` sites are architectural faces of the room's inner walls, so they remain with the **spaces owner** in this order: bathroom, child-one, child-two, common, corridor, entry, flex, powder, primary, service-upper, storage-ground, storage-upper. `lights(a,room,points)` also receives, at the same 12 sites, 2,2,1,5,3,3,2,1,2,2,1,1 points respectively, 25 points in total. Each point's `room-light-trim-i` corresponds to `ceiling-surface-light/trim`, and `room-light-i` to `ceiling-surface-light/diffuser` **and** a system emitter. Adding the 1 pendant of common and the 2 bedside lamps of primary gives 28 existing emissive elements. Every existing emissive ID needs a successor instance/part **and** an emitter. `lining` owns no model prototype or material binding.

The population of this account is 80 sites: static authoring sites `Item` 46 + direct primitives 10 + `lining` 12 + `lights` 12. The [static measurement producer](../../../src/review/model-owner-audit.cjs) computes the per-source row counts and blank owners of the current room sources and of this table, and also confirms that a comparison with a row removed fails. The actual expanded element IDs, duplicates, retirement intent, and placement of added prototypes are recounted with a compiled producer in the single commit of the [upstream handover condition](../../settings/003-spatial-basis.md#surface-decomposition). The claim that this draft table is implemented in the current source is `unverified`.

## Reverse correspondence of item demands from parent and sibling layers {#upstream-demand-correspondence}

This table lists demand rows read in reverse from the [ground-floor program](../../settings/002-household.md#ground-program), the [workroom states](../../settings/002-household.md#flex-states), the [upper-floor program](../../settings/002-household.md#upper-program), and the [material object binding input](../../materials/004-wood.md#oak-joinery), including new props for which the legacy authoring sites of this file give no source. A prototype in the table is the shape owner, and the per-room members, repetitions, and transforms are later handled by instances, and emission by systems. "none" in the `current` column is the fact that the current source has no such member, not an exclusion from delivery. The exterior trees and the curtain-wall roller are architectural members of the site and the envelope respectively and are not duplicated in this model population.

| Demand and destination | Current temporary element or state | models shape and part address |
| --- | --- | --- |
| Entry shoe storage and bench | `entry-shoe-bench`, `entry-bench-cushion` | [Bench and cabinet](../../models/002-storage-and-sleep.md#entry-bench) |
| Entry flat-wall mail and charging shelf and charger | `entry-charging-shelf`, `entry-charger` | [Wall shelf](../../models/002-storage-and-sleep.md#entry-charging-shelf), [charging object](../../models/004-decor-and-fixtures.md#entry-charger) |
| Workroom adjustable desk and folding auxiliary panel | the simple table of `flex-desk` | [flex desk](../../models/001-seating-and-work.md#work-desk) |
| Workroom upholstered chair | the solid back of `flex-chair` | [desk-chair](../../models/001-seating-and-work.md#desk-chair) |
| Workroom wall shelves and individual books | `flex-books`; no books | [open cabinet](../../models/002-storage-and-sleep.md#cabinet-and-shelf), [book](../../models/004-decor-and-fixtures.md#books) |
| Workroom hidden sleeping storage and guest bedding | `flex-murphy-frame`, guest state `flex-guest-bed` | [two-state murphy](../../models/002-storage-and-sleep.md#murphy-bed) |
| Workroom privacy screen | existing curtain-wall glass and roller | **spaces envelope member**; no separate furniture prototype |
| Rear sofa, cushions, and low table | `common-sofa`, `common-coffee`; no L-shaped extension | [sofa](../../models/001-seating-and-work.md#living-sofa), [low table](../../models/001-seating-and-work.md#coffee-table) |
| Rear media storage and display | `common-media`, `common-display` | [media cabinet](../../models/002-storage-and-sleep.md#cabinet-and-shelf), [living-display](../../models/004-decor-and-fixtures.md#living-display) |
| Rear reading lamp, rug, bowl, and tray | `common-rug`; no lamp, bowl, or tray | [reading lamp](../../models/004-decor-and-fixtures.md#portable-lamps), [rug](../../models/004-decor-and-fixtures.md#rugs), [tabletop props](../../models/004-decor-and-fixtures.md#tabletop-props) |
| Six-seat dining table and fabric-seat chairs | `common-dining`, six `dining-chair-*` | [table](../../models/001-seating-and-work.md#dining-table), [dining-chair](../../models/001-seating-and-work.md#dining-chair) |
| Slender cylindrical pendant over the dining table | disc-shaped `dining-pendant`, cord | [pendant](../../models/004-decor-and-fixtures.md#dining-pendant) and system emitter |
| Island, sink, and ring stools | `kitchen-island`, three `island-stool-*` | [island](../../models/003-service-fixtures.md#kitchen-island), [island-stool](../../models/001-seating-and-work.md#island-stool) |
| Kitchen wall worktop, cooktop, oven, and drawers | stacked panels and two doors of `kitchen-wall-bank` | [cooking appliances](../../models/003-service-fixtures.md#cooking-appliances), [drawer cabinet](../../models/002-storage-and-sleep.md#cabinet-and-shelf) |
| Refrigerator and separate tall pantry | one enclosure, `kitchen-fridge-pantry` | [refrigerator](../../models/003-service-fixtures.md#refrigerator), new `cabinet/tall/900x2650x600/closed` |
| Recycling and upper kitchen storage | `kitchen-sorting`, `kitchen-overhead` | [service/wall cabinet](../../models/002-storage-and-sleep.md#cabinet-and-shelf) |
| Powder basin, mirror, toilet, and cleaning cabinet | `powder-basin` (actual width 0.80), `powder-toilet`, `powder-cleaning` | [basin/800](../../models/003-service-fixtures.md#basin), [toilet](../../models/003-service-fixtures.md#toilet), [tall cabinet](../../models/002-storage-and-sleep.md#cabinet-and-shelf) |
| Ground-floor storeroom shelves and baskets | `ground-store-shelves`, four baskets | [open cabinet](../../models/002-storage-and-sleep.md#cabinet-and-shelf), [basket](../../models/004-decor-and-fixtures.md#storage-basket) |
| Primary double bed, bedding, and rug | `primary-bed`; no rug | [fixed-bed/1800](../../models/002-storage-and-sleep.md#fixed-bed), [bedroom-rug](../../models/004-decor-and-fixtures.md#rugs) |
| Primary nightstands and two globe lamps | two each of `primary-nightstand-*` and `primary-lamp-*` | [nightstand cabinet](../../models/002-storage-and-sleep.md#cabinet-and-shelf), [globe lamp](../../models/004-decor-and-fixtures.md#portable-lamps) and each system emitter |
| Primary wardrobe, desk, and desk chair | `primary-wardrobe`, `primary-desk`, `primary-chair` | [tall cabinet](../../models/002-storage-and-sleep.md#cabinet-and-shelf), [work-desk](../../models/001-seating-and-work.md#work-desk), [desk-chair](../../models/001-seating-and-work.md#desk-chair) |
| Single beds and wardrobes of the two small bedrooms | `child-*-bed`, `child-*-wardrobe` | [fixed-bed/1000](../../models/002-storage-and-sleep.md#fixed-bed), [tall cabinet](../../models/002-storage-and-sleep.md#cabinet-and-shelf) |
| Round rugs of the two small bedrooms | currently none | [round-rug/1200](../../models/004-decor-and-fixtures.md#rugs); instances decide the per-room placement |
| Desk or shelf, fabric chair, and task lamp of the two small bedrooms | `child-*-desk`, `child-*-chair`, child-one's bookcase; no task lamp | [work-desk](../../models/001-seating-and-work.md#work-desk), [desk-chair](../../models/001-seating-and-work.md#desk-chair), [desk-task lamp](../../models/004-decor-and-fixtures.md#portable-lamps) |
| Bedroom wall art, books, and small planters | only some large floor planters; no frames or individual books | [wall-art](../../models/004-decor-and-fixtures.md#wall-art), [book](../../models/004-decor-and-fixtures.md#books), [potted-plant](../../models/004-decor-and-fixtures.md#potted-plant) |
| Upper bathroom basin, toilet, shower, and bathtub | `bath-vanity`, `bath-toilet`, `bath-shower`; no bathtub | [basin/1000](../../models/003-service-fixtures.md#basin), [toilet](../../models/003-service-fixtures.md#toilet), [shower](../../models/003-service-fixtures.md#shower), [bathtub](../../models/003-service-fixtures.md#bathtub) |
| Upper bathroom towel cabinet and folded towels | `bath-towels` shelf; no individual towels | [open cabinet](../../models/002-storage-and-sleep.md#cabinet-and-shelf), [folded-towel](../../models/004-decor-and-fixtures.md#folded-towels) |
| Upper storage linen, cleaning cabinet, and baskets | `upper-linen-cabinet`, linen stack; no cleaning cabinet | [open cabinet and new tall/600x2300x500](../../models/002-storage-and-sleep.md#cabinet-and-shelf), [folded-towel](../../models/004-decor-and-fixtures.md#folded-towels), [basket](../../models/004-decor-and-fixtures.md#storage-basket) |
| Upper service room washing, drying, and service storage | `upper-laundry`, `upper-mechanical`, `upper-utility-shelf` | [washer/dryer](../../models/003-service-fixtures.md#laundry-appliances), [service/open cabinet](../../models/002-storage-and-sleep.md#cabinet-and-shelf) |
| Low and large interior planters | `entry/common/primary-plant`; no small ones | [potted-plant 0.18..1.10](../../models/004-decor-and-fixtures.md#potted-plant) |
| All ceiling surface lights and the three direct emitters | 25 points of `lights()`, one pendant, two bedside lamps | [ceiling-surface-light](../../models/004-decor-and-fixtures.md#ceiling-surface-light), [pendant](../../models/004-decor-and-fixtures.md#dining-pendant), [globe lamp](../../models/004-decor-and-fixtures.md#portable-lamps); each emissive ID also needs a system emitter |

This reverse correspondence does not mean that the current placement of the 80 legacy sites already consumes the new prototypes. The actual member IDs and observations of the new pantry, cleaning cabinets, bathtub, and props must be received from the same compiled producer after instanceSources review and are `unverified` now. A material H2 to be bound to object faces receives the prototype part/face and is judged again; this table does not decide the finish.
