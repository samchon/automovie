# Everyday object placement

This document is a draft instance design that fully matches the latest @census of 429 in `.wiki/object-inventory.md` against 15 areas. The 422 of the first record is a figure from an earlier stage. The existing roots and direct fit-out of `docs/instances/001-household-placement.md` are part of the same population and are not generated twice. The model addresses consume the reviewed states of `docs/models/001`~`005`. Coordinates are in m, right-handed Y-up, front -Z, and every model uses its prototype size 1:1. The counts below do not claim completed render counts.

Room membership, support surfaces, unique IDs, and exact transforms are owned by instances. The current room source provides reference coordinates only for large furniture and some props. The remaining prop coordinates must be decided after confirming the actual dimensions of the support surfaces and the door, stair, and walking widths, and baseless uniform scattering is not adopted as this design. Light emitters must be bound with systems. Individual transforms not yet verified are not counted as executed placement. 429 is the unique object population combining the work and guest rest states of the workroom. The 1 `guest bedding set`, 1 `blanket`, and 2 `pillow` are activated on the outer bed only in guest, and in work they are unrepresented contents inside the closed storage bed. The active objects in work number 425 and in guest 429. This is not disguised as hiding at the render stage or as shrunken props.

## Population and transform rules {#population-and-transform}

Each row needs as many independent IDs as its count. A repeated ID combines the area, the object role, and a fixed number starting from 0, and does not depend on the original listing order or the runtime traversal order. The parent coordinate system is the building world coordinates. Floor contact follows 0m on the ground floor, 3.20m on the upper floor, and the corresponding site support surface outside. Child objects of tops, shelves, and beds reflect the support surface height and yaw of their model. If an object would pass through the envelope or opening zone of the support surface or would need to change to a larger model, it is sent back to the model or space owner.

## Reuse and observation {#reuse-and-observation}

One `@uses` address shares the same model state. This placement has no random position or size variants, hero substitution, density reduction, or LOD switching. The workroom storage bed changes only the model state of one stable ID according to the work/guest state. Verification requires a full match of the 429 names, counts, and model addresses, measurement of unique IDs and floor/host contact and interference, ordinary-view GPU observation of each prop class, and confirmation of walking and occlusion in both the work and guest states. The existence of a single frame alone does not prove aesthetics or accessibility.

## Entry (23) {#entry}

The contact faces of the shoes, umbrellas, keys, and mail are set from the current coordinates of the entry bench and charging shelf. The front entrance and the walkways to the workroom and common area are kept clear.

| Independent object | Count | Model state |
| --- | ---: | --- |
| shoe bench | 1 | `entry-bench/default` |
| charging shelf | 1 | `entry-charging-shelf/default` |
| charger | 1 | `entry-charger/default` |
| mail tray | 1 | `tabletop-props/tray` |
| key dish | 1 | `tabletop-props/bowl` |
| shoe | 4 | `personal-articles/shoe` |
| coat | 2 | `personal-articles/coat` |
| coat hook | 1 | `wall-accessories/coat-hook` |
| umbrella | 2 | `personal-articles/umbrella` |
| umbrella stand | 1 | `personal-articles/umbrella-stand` |
| entry mat | 1 | `household-textiles/entry-mat` |
| mirror | 1 | `wall-accessories/entry-mirror` |
| wall sconce | 2 | `wall-accessories/wall-sconce` |
| ceiling surface light | 3 | `ceiling-surface-light/default` |
| entry potted plant | 1 | `potted-plant/800` |

Verification denominator: all 23 of this area. The living, dining, and kitchen, which use the same space ID, are each an independent subpopulation.

## Variable workroom (38) {#flex-workroom}

Using the current coordinates of the desk, bookcase, and storage bed, work items go on the desk, books in the bookcase, and bedding on the support surface of the bed state. The work and guest states use the same storage bed ID.

| Independent object | Count | Model state |
| --- | ---: | --- |
| height-adjustable desk | 1 | `work-desk/folded` |
| desk chair | 1 | `desk-chair/default` |
| work display | 1 | `work-equipment/display` |
| keyboard | 1 | `work-equipment/keyboard` |
| pointing device | 1 | `desk-controls/pointing-device` |
| task lamp | 1 | `portable-lamps/desk-task` |
| ceiling surface light | 2 | `ceiling-surface-light/default` |
| open bookcase | 1 | `cabinet-and-shelf/open-shelf/950x1350x250/open` |
| book | 12 | `books/240x35x160` |
| file box | 3 | `household-boxes/file-box` |
| storage bed | 1 | `murphy-bed/work` |
| guest bedding set | 1 | `household-textiles/bedding-set` |
| blanket | 1 | `household-textiles/blanket` |
| pillow | 2 | `household-textiles/pillow` |
| potted plant | 1 | `potted-plant/600` |
| cup | 1 | `tabletop-props/cup` |
| storage basket | 2 | `storage-basket/default` |
| workroom armchair | 1 | `accent-chair/default` |
| workroom round rug | 1 | `rugs/round1200` |
| workroom picture frame | 1 | `wall-art/default` |
| workroom globe lamp | 1 | `portable-lamps/bedside-globe` |
| second workroom potted plant | 1 | `potted-plant/280` |

Verification denominator: all 38 of this area. The living, dining, and kitchen, which use the same space ID, are each an independent subpopulation.

## Living area (31) {#common-living}

The current sofa, low table, media cabinet, and rug are taken as the support basis. Cushions belong to the sofa seat, books and cups to the table and cabinet, and wall decoration to the wall face.

| Independent object | Count | Model state |
| --- | ---: | --- |
| L-shaped sofa | 1 | `living-sofa/chaise-right` |
| straight sofa | 1 | `living-sofa/straight` |
| low table | 1 | `coffee-table/default` |
| rug | 1 | `rugs/living` |
| media cabinet | 1 | `cabinet-and-shelf/media/2000x440x350/closed` |
| living-room display | 1 | `living-display/default` |
| reading lamp | 1 | `portable-lamps/reading` |
| ceiling surface light | 2 | `ceiling-surface-light/default` |
| decorative cushion | 4 | `household-textiles/sofa-cushion` |
| blanket | 2 | `household-textiles/blanket` |
| book | 8 | `books/240x35x160` |
| picture frame | 2 | `wall-art/default` |
| large potted plant | 1 | `potted-plant/1100` |
| potted plant | 1 | `potted-plant/600` |
| bowl | 1 | `tabletop-props/bowl` |
| tray | 1 | `tabletop-props/tray` |
| cup | 2 | `tabletop-props/cup` |

Verification denominator: all 31 of this area. The living, dining, and kitchen, which use the same space ID, are each an independent subpopulation.

## Dining area (55) {#common-dining}

The current dining table centre (0.55,0,3.85) and the coordinates of the 6 chairs are used. Placemats and tableware go in the corresponding slots of the six seats, and serving objects in the central slot.

| Independent object | Count | Model state |
| --- | ---: | --- |
| dining table | 1 | `dining-table/default` |
| dining chair | 6 | `dining-chair/default` |
| pendant | 1 | `dining-pendant/default` |
| ceiling surface light | 1 | `ceiling-surface-light/default` |
| placemat | 6 | `household-textiles/placemat` |
| plate | 6 | `dining-wares/plate` |
| rice bowl | 6 | `tabletop-props/bowl` |
| cup | 6 | `tabletop-props/cup` |
| fork | 6 | `dining-wares/fork` |
| spoon | 6 | `dining-wares/spoon` |
| knife | 6 | `dining-wares/table-knife` |
| serving bowl | 2 | `tabletop-props/bowl` |
| water bottle | 1 | `dining-wares/water-bottle` |
| vase | 1 | `dining-wares/flower-vase` |

Verification denominator: all 55 of this area. The living, dining, and kitchen, which use the same space ID, are each an independent subpopulation.

## Kitchen area (45) {#common-kitchen}

The cooking objects are attached to support surfaces based on the current positions of the island, wall worktop, wall cabinet, and recycling cabinet. The sink and cooktop occupancy is kept clear, and the under-cabinet linear lights are fixed to the cabinet underside.

| Independent object | Count | Model state |
| --- | ---: | --- |
| island | 1 | `kitchen-island/default` |
| stool | 3 | `island-stool/default` |
| wall worktop and base cabinet | 1 | `cooking-appliances/wall-worktop` |
| wall cabinet | 1 | `cabinet-and-shelf/wall/2900x980x360/closed` |
| refrigerator | 1 | `refrigerator/default` |
| pantry cabinet | 1 | `cabinet-and-shelf/tall/900x2650x600/closed` |
| cooktop | 1 | `cooking-appliances/cooktop` |
| oven | 1 | `cooking-appliances/oven` |
| extractor hood | 1 | `kitchen-extractor/default` |
| recycling cabinet | 1 | `cabinet-and-shelf/service/640x840x600/closed` |
| recycling bin | 3 | `household-boxes/recycling-box` |
| ceiling surface light | 2 | `ceiling-surface-light/default` |
| under-cabinet linear light | 2 | `under-cabinet-light/default` |
| pot | 3 | `kitchen-smallwares/pot` |
| pan | 2 | `kitchen-smallwares/pan` |
| cutting board | 2 | `kitchen-smallwares/cutting-board` |
| knife block | 1 | `kitchen-smallwares/knife-block` |
| utensil crock | 1 | `kitchen-smallwares/utensil-crock` |
| cooking utensil | 5 | `kitchen-smallwares/utensil` |
| kettle | 1 | `kitchen-smallwares/kettle` |
| toaster | 1 | `kitchen-smallwares/toaster` |
| coffee brewer | 1 | `kitchen-smallwares/coffee-brewer` |
| dish drying rack | 1 | `kitchen-smallwares/drying-rack` |
| dishcloth | 2 | `household-textiles/dishcloth` |
| glass storage jar | 4 | `kitchen-smallwares/glass-jar` |
| rear counter sink and faucet | 1 | `rear-counter-sink/default` |
| rear counter potted plant | 1 | `potted-plant/280` |

Verification denominator: all 45 of this area. The living, dining, and kitchen, which use the same space ID, are each an independent subpopulation.

## Ground-floor powder room (14) {#powder-utility}

The containers and towels are bound to the current coordinates of the basin, toilet, and cleaning cabinet. The floor waste bin and cleaning tools are placed on the side clear of the door leaf and toilet use zone.

| Independent object | Count | Model state |
| --- | ---: | --- |
| ground-floor basin | 1 | `basin/800` |
| toilet | 1 | `toilet/lid-open` |
| ground-floor cleaning cabinet | 1 | `cabinet-and-shelf/tall/520x2250x520/closed` |
| soap dispenser | 1 | `bath-accessories/soap-dispenser` |
| hand towel | 2 | `folded-towels/120` |
| toilet-paper holder | 1 | `bath-accessories/tissue-holder` |
| toilet-paper roll | 2 | `bath-accessories/tissue-roll` |
| waste bin | 1 | `bath-accessories/waste-bin` |
| cleaning tool | 2 | `household-tools/cleaning-tool` |
| ceiling surface light | 2 | `ceiling-surface-light/default` |

Verification denominator: all 14 of this area. The living, dining, and kitchen, which use the same space ID, are each an independent subpopulation.

## Ground-floor storeroom (20) {#storage-1f}

The current open shelf centre (-4.90,0,-1.22) and the contact faces of the four baskets by height are used. Tools, boxes, and spare lights are distributed into the actual unoccupied slots of the shelves.

| Independent object | Count | Model state |
| --- | ---: | --- |
| ground-floor open shelf | 2 | `cabinet-and-shelf/open-shelf/1550x2500x500/open` |
| basket | 4 | `storage-basket/default` |
| tool box | 1 | `household-tools/tool-box` |
| vacuum cleaner | 1 | `household-tools/vacuum` |
| folding ladder | 1 | `household-tools/folded-ladder` |
| recycling box | 2 | `household-boxes/recycling-box` |
| spare light | 2 | `household-tools/spare-light` |
| ceiling surface light | 1 | `ceiling-surface-light/default` |
| storage box | 6 | `household-boxes/storage-box` |

Verification denominator: all 20 of this area. The living, dining, and kitchen, which use the same space ID, are each an independent subpopulation.

## Upper corridor (9) {#upper-corridor}

The corridor clear cell and the stair and room door openings are cleared first. The low planter and cabinet are attached to the remaining wall faces, the picture frames at the wall face centres, and the lights to the ceiling.

| Independent object | Count | Model state |
| --- | ---: | --- |
| wall picture frame | 2 | `wall-art/default` |
| low potted plant | 1 | `potted-plant/280` |
| ceiling surface light | 5 | `ceiling-surface-light/default` |
| small cabinet | 1 | `cabinet-and-shelf/nightstand/500x460x460/closed` |

Verification denominator: all 9 of this area. The living, dining, and kitchen, which use the same space ID, are each an independent subpopulation.

## Primary bedroom (43) {#primary-bedroom}

The current coordinates of the bed, nightstands, desk, and wardrobe are taken as the support basis. Bedding goes on the bed, desk objects on the desk, clothing inside the wardrobe, and books on the unoccupied faces of the desk and nightstands.

| Independent object | Count | Model state |
| --- | ---: | --- |
| double bed | 1 | `fixed-bed/1800` |
| nightstand | 2 | `cabinet-and-shelf/nightstand/500x460x460/closed` |
| globe lamp | 2 | `portable-lamps/bedside-globe` |
| ceiling surface light | 2 | `ceiling-surface-light/default` |
| primary wardrobe | 1 | `cabinet-and-shelf/tall/2720x2650x600/closed` |
| primary desk | 1 | `work-desk/bed-1200` |
| desk chair | 1 | `desk-chair/default` |
| work display | 1 | `work-equipment/display` |
| keyboard | 1 | `work-equipment/keyboard` |
| bedroom rug | 1 | `rugs/bedroom1600x2200` |
| bedding set | 1 | `household-textiles/bedding-set` |
| pillow | 4 | `household-textiles/pillow` |
| blanket | 1 | `household-textiles/blanket` |
| clothes hanger | 8 | `personal-articles/hanger` |
| garment | 8 | `personal-articles/garment` |
| book | 4 | `books/240x35x160` |
| picture frame | 2 | `wall-art/default` |
| potted plant | 1 | `potted-plant/600` |
| drinking cup | 1 | `tabletop-props/cup` |

Verification denominator: all 43 of this area. The living, dining, and kitchen, which use the same space ID, are each an independent subpopulation.

## Small bedroom 1 (24) {#child-bedroom-1}

Based on the current coordinates of the single bed, desk, bookcase, and wardrobe, bedding, books, and work objects go on their respective support surfaces. The toy box goes on the floor out of the passage.

| Independent object | Count | Model state |
| --- | ---: | --- |
| single bed | 1 | `fixed-bed/1000` |
| child room 1 wardrobe | 1 | `cabinet-and-shelf/tall/1300x2650x600/closed` |
| child room 1 desk | 1 | `work-desk/bed-1240` |
| desk chair | 1 | `desk-chair/default` |
| work display | 1 | `work-equipment/display` |
| keyboard | 1 | `work-equipment/keyboard` |
| child room 1 bookcase | 1 | `cabinet-and-shelf/open-shelf/750x1200x400/open` |
| task lamp | 1 | `portable-lamps/desk-task` |
| ceiling surface light | 2 | `ceiling-surface-light/default` |
| round rug | 1 | `rugs/round1200` |
| bedding set | 1 | `household-textiles/bedding-set` |
| pillow | 2 | `household-textiles/pillow` |
| book | 6 | `books/240x35x160` |
| picture frame | 1 | `wall-art/default` |
| toy box | 1 | `household-boxes/toy-box` |
| small potted plant | 1 | `potted-plant/280` |
| cup | 1 | `tabletop-props/cup` |

Verification denominator: all 24 of this area. The living, dining, and kitchen, which use the same space ID, are each an independent subpopulation.

## Small bedroom 2 (23) {#child-bedroom-2}

Based on the current coordinates of the single bed, desk, open shelf, and wardrobe, bedding, books, and work objects go on their respective support surfaces. The baskets go in the unoccupied slots of the shelf.

| Independent object | Count | Model state |
| --- | ---: | --- |
| single bed | 1 | `fixed-bed/1000` |
| child room 2 wardrobe | 1 | `cabinet-and-shelf/tall/1400x2600x540/closed` |
| child room 2 desk | 1 | `work-desk/bed-1250` |
| desk chair | 1 | `desk-chair/default` |
| work display | 1 | `work-equipment/display` |
| keyboard | 1 | `work-equipment/keyboard` |
| child room 2 open shelf | 1 | `cabinet-and-shelf/open-shelf/750x1200x400/open` |
| task lamp | 1 | `portable-lamps/desk-task` |
| ceiling surface light | 1 | `ceiling-surface-light/default` |
| round rug | 1 | `rugs/round1200` |
| bedding set | 1 | `household-textiles/bedding-set` |
| pillow | 2 | `household-textiles/pillow` |
| book | 6 | `books/240x35x160` |
| picture frame | 1 | `wall-art/default` |
| storage basket | 2 | `storage-basket/default` |
| small potted plant | 1 | `potted-plant/280` |

Verification denominator: all 23 of this area. The living, dining, and kitchen, which use the same space ID, are each an independent subpopulation.

## Upper bathroom (31) {#upper-bathroom}

Washing objects and towels are placed based on the current coordinates of the basin, toilet, shower, and towel cabinet. The bath mats go on the floor of the wet zone but avoid the entrance door and toilet access.

| Independent object | Count | Model state |
| --- | ---: | --- |
| upper basin | 1 | `basin/1000` |
| toilet | 1 | `toilet/lid-open` |
| shower | 1 | `shower/default` |
| bathtub | 1 | `bathtub/default` |
| towel cabinet | 1 | `cabinet-and-shelf/open-shelf/600x1100x380/open` |
| folded towel | 6 | `folded-towels/120` |
| toothbrush cup | 2 | `bath-accessories/toothbrush-cup` |
| toothbrush | 4 | `bath-accessories/toothbrush` |
| soap dispenser | 2 | `bath-accessories/soap-dispenser` |
| shampoo bottle | 2 | `bath-accessories/shampoo-bottle` |
| laundry hamper | 1 | `bath-accessories/laundry-basket` |
| bath mat | 2 | `household-textiles/bath-mat` |
| toilet-paper holder | 1 | `bath-accessories/tissue-holder` |
| toilet-paper roll | 2 | `bath-accessories/tissue-roll` |
| waste bin | 1 | `bath-accessories/waste-bin` |
| ceiling surface light | 3 | `ceiling-surface-light/default` |

Verification denominator: all 31 of this area. The living, dining, and kitchen, which use the same space ID, are each an independent subpopulation.

## Upper storage (28) {#upper-storage}

Based on the current linen cabinet centre (-4.90,3.20,0.48) and the five towel stacks, the remaining sheets, boxes, and pillows go in separate shelf slots.

| Independent object | Count | Model state |
| --- | ---: | --- |
| linen cabinet | 1 | `cabinet-and-shelf/open-shelf/1100x2600x500/open` |
| upper cleaning cabinet | 1 | `cabinet-and-shelf/tall/600x2300x500/closed` |
| basket | 3 | `storage-basket/default` |
| folded towel | 8 | `folded-towels/120` |
| folded sheet | 4 | `household-textiles/folded-sheet` |
| pillow | 2 | `household-textiles/pillow` |
| storage box | 4 | `household-boxes/storage-box` |
| cleaning tool | 2 | `household-tools/cleaning-tool` |
| toilet-paper pack | 2 | `bath-accessories/tissue-pack` |
| ceiling surface light | 1 | `ceiling-surface-light/default` |

Verification denominator: all 28 of this area. The living, dining, and kitchen, which use the same space ID, are each an independent subpopulation.

## Service room (18) {#upper-service}

Detergent, towels, and tools go on support surfaces based on the current washer, dryer, and service shelf. The inspection front of the machine enclosure and the entrance door are kept clear.

| Independent object | Count | Model state |
| --- | ---: | --- |
| washer | 1 | `laundry-appliances/washer` |
| dryer | 1 | `laundry-appliances/dryer` |
| service shelf | 1 | `cabinet-and-shelf/open-shelf/850x2400x450/open` |
| machine enclosure | 1 | `cabinet-and-shelf/service/1100x2400x560/closed` |
| detergent bottle | 3 | `bath-accessories/detergent-bottle` |
| laundry basket | 2 | `bath-accessories/laundry-basket` |
| cleaning tool | 2 | `household-tools/cleaning-tool` |
| folded towel | 4 | `folded-towels/120` |
| tool box | 1 | `household-tools/tool-box` |
| ceiling surface light | 2 | `ceiling-surface-light/default` |

Verification denominator: all 18 of this area. The living, dining, and kitchen, which use the same space ID, are each an independent subpopulation.

## Approach exterior and garden (27) {#citizen-site}

The entry band x=1.30..2.90 in front of the building and the path and canopy maintenance surfaces are kept clear. The mailbox and parcel locker go on the entrance access side, the outdoor seating in the garden, and the bicycles and tools on the service side.

| Independent object | Count | Model state |
| --- | ---: | --- |
| mailbox | 1 | `exterior-furnishings/mailbox` |
| parcel locker | 1 | `household-boxes/parcel-locker` |
| outdoor bench | 1 | `exterior-furnishings/outdoor-bench` |
| outdoor chair | 2 | `exterior-furnishings/outdoor-chair` |
| small outdoor table | 1 | `exterior-furnishings/outdoor-table` |
| potted plant | 4 | `potted-plant/600` |
| garden light | 6 | `exterior-furnishings/garden-light` |
| rain barrel | 1 | `exterior-furnishings/rain-barrel` |
| garden tool | 3 | `household-tools/garden-tool` |
| hose reel | 1 | `household-tools/hose-reel` |
| outdoor waste bin | 2 | `exterior-furnishings/outdoor-waste-bin` |
| bike rack | 1 | `exterior-furnishings/bike-rack` |
| bicycle | 2 | `exterior-furnishings/bicycle` |
| doorstep mat | 1 | `household-textiles/outdoor-mat` |

Verification denominator: all 27 of this area. The living, dining, and kitchen, which use the same space ID, are each an independent subpopulation.
