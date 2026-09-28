# Household model placement

This instance design takes the existing room fit-out positions from `src/house/rooms` and the corresponding reviewed prototypes from `docs/models/001-seating-and-work.md` through `005-everyday-objects.md`. The room, prototype, state, world position, and yaw together identify an instance. Distances are metres. Yaw is degrees about the vertical axis. The work and guest configurations share IDs and transforms except for the foldable bed state. The desk and shelving remain fixed in both configurations as `docs/settings/002-household.md#flex-states` requires. The source of each coordinate is the existing room producer; a geometric part belongs to its model source, a finish to materials, and a luminaire emitter to systems.

## Stable membership and configuration {#membership}

The configured household contains the listed room instances exactly once for each ID. This H2 owns one coherent legacy fit-out retirement cohort: switching any room alone would leave duplicate or absent supports and lighting relations in the same compiled house, so all rows enter the viewer together, while each row remains independently addressable for inspection. An indexed row expands to an instance per listed index. The modelSource prototype and state in the third column are the only allowed geometry source for that member. The current room root is a migration identity, not a second object to draw. `entry-bench` includes its `bench-base` composition as declared by the model state, while kitchen worktop, cooker, oven, and supporting cabinet remain distinct colocated instances. The grouped laundry root becomes the separate washer and dryer instances. Reuse of a prototype at multiple locations retains separate instance IDs. No model part is copied into the room source.

| Room and instance ID | World position (x,y,z), yaw | Prototype / state |
| --- | --- | --- |
| `entry-shoe-bench` | (-2.46,0,-1.10), 90 | `entry-bench/default` |
| `entry-plant` | (2.53,0,-2.70), 0 | `potted-plant/800` |
| `flex-desk` | (4.14,0,-5.35), 0 | `work-desk/folded` in both configurations |
| `flex-chair` | (4.14,0,-4.60), 180 | `desk-chair/default` |
| `flex-books` | (3.22,1.05,-4.90), 90 | `cabinet-and-shelf/open-shelf/950x1350x250/open` |
| `flex-murphy-frame` | (4.28,0,-0.55), 180 | `murphy-bed/work` or `murphy-bed/guest` |
| `common-sofa` | (2.88,0,2.75), 90 | `living-sofa/chaise-right` |
| `common-coffee` | (4.05,0.016,2.85), 0 | `coffee-table/default` |
| `common-media` | (5.02,0,2.85), -90 | `cabinet-and-shelf/media/2000x440x350/closed` |
| `common-dining` | (0.55,0,3.85), 0 | `dining-table/default` |
| `dining-chair-front-0..2` | (-0.08,0,3.07), (0.55,0,3.07), (1.18,0,3.07), 0 | `dining-chair/default` |
| `dining-chair-rear-0..2` | (-0.08,0,4.63), (0.55,0,4.63), (1.18,0,4.63), 180 | `dining-chair/default` |
| `kitchen-island` | (-2.60,0,2.90), 0 | `kitchen-island/default` plus `cabinet-and-shelf/island-base/880x870x2650/closed` |
| `island-stool-0..2` | (-1.64,0,2.00), (-1.64,0,2.78), (-1.64,0,3.56), 0 | `island-stool/default` |
| `kitchen-wall-bank` | (-4.91,0,2.10), 90 | `cooking-appliances/wall-worktop`, `cooking-appliances/cooktop`, `cooking-appliances/oven`, `cabinet-and-shelf/kitchen-base/2900x870x620/closed` |
| `kitchen-overhead` | (-5.04,1.54,2.10), 90 | `cabinet-and-shelf/wall/2900x980x360/closed` |
| `kitchen-fridge-pantry` | (-4.83,0,0.37), 90 | `refrigerator/default`; the separate pantry cabinet in the 422-item inventory needs its own reviewed transform |
| `kitchen-sorting` | (-4.90,0,4.14), 90 | `cabinet-and-shelf/service/640x840x600/closed` |
| `common-plant` | (4.80,0,5.30), 0 | `potted-plant/1100` |
| `powder-toilet` | (-4.13,0,-5.32), 0 | `toilet/lid-open` |
| `powder-basin` | (-4.95,0,-3.28), 90 | `basin/800` plus `cabinet-and-shelf/vanity/800x800x480/closed` |
| `powder-cleaning` | (-3.38,0,-5.42), 0 | `cabinet-and-shelf/tall/520x2250x520/closed` |
| `ground-store-shelves` | (-4.90,0,-1.22), 90 | `cabinet-and-shelf/open-shelf/1550x2500x500/open` |
| `primary-bed` | (2.88,3.20,4.32), 0 | `fixed-bed/1800` |
| `primary-nightstand-left/right` | (1.60,3.20,3.47), (4.16,3.20,3.47), 0 | `cabinet-and-shelf/nightstand/500x460x460/closed` |
| `primary-wardrobe` | (-2.49,3.20,4.26), 90 | `cabinet-and-shelf/tall/2720x2650x600/closed` |
| `primary-desk` | (0.30,3.20,5.35), 180 | `work-desk/bed-1200` |
| `primary-chair` | (0.30,3.20,4.63), 0 | `desk-chair/default` |
| `primary-plant` | (4.88,3.20,5.35), 0 | `potted-plant/600` |
| `child-one-bed` | (2.49,3.20,-4.07), 0 | `fixed-bed/1000` |
| `child-one-desk` | (4.44,3.20,-5.32), 0 | `work-desk/bed-1240` |
| `child-one-chair` | (4.44,3.20,-4.62), 180 | `desk-chair/default` |
| `child-one-wardrobe` | (4.55,3.20,-0.66), 180 | `cabinet-and-shelf/tall/1300x2650x600/closed` |
| `child-one-books` | (4.98,3.20,-2.53), -90 | `cabinet-and-shelf/open-shelf/750x1200x400/open` |
| `child-two-bed` | (2.73,3.20,1.12), 90 | `fixed-bed/1000` |
| `child-two-desk` | (4.88,3.20,1.25), -90 | `work-desk/bed-1250` |
| `child-two-chair` | (4.14,3.20,1.25), 90 | `desk-chair/default` |
| `child-two-wardrobe` | (1.31,3.20,0.17), 0 | `cabinet-and-shelf/tall/1400x2600x540/closed` |
| `bath-vanity` | (-4.99,3.20,2.16), 90 | `basin/1000` plus `cabinet-and-shelf/vanity/1000x800x480/closed` |
| `bath-toilet` | (-4.935,3.20,3.33), 90 | `toilet/lid-open` |
| `bath-shower` | (-4.14,3.20,4.94), 0 | `shower/default` |
| `bath-towels` | (-3.33,3.20,3.30), -90 | `cabinet-and-shelf/open-shelf/600x1100x380/open` |
| `upper-linen-cabinet` | (-4.90,3.20,0.48), 90 | `cabinet-and-shelf/open-shelf/1100x2600x500/open` |
| `upper-laundry` | (-4.78,3.20,-4.54), 90 | `laundry-appliances/washer` and `laundry-appliances/dryer` |
| `upper-mechanical` | (-2.10,3.20,-5.42), 0 | `cabinet-and-shelf/service/1100x2400x560/closed` |
| `upper-utility-shelf` | (-4.91,3.20,-2.71), 90 | `cabinet-and-shelf/open-shelf/850x2400x450/open` |

## Direct fit-out and support {#direct-fitout}

Direct room elements under `src/house/rooms` are separately accounted for in `docs/accounts/models/legacy-fitout.md#legacy-direct-correspondence`: living rug and display; entry cushion, charging shelf, and charger; four storage baskets; five linen stacks; dining pendant with its cord; and two primary bedside lamps. The rug, display, charger, baskets, towels and lamp envelopes become model instances at their existing source positions. The cushion is already a part of `entry-bench`, so it is retired without a second cushion instance. Any support composition declared in a model state is built once under the same instance transform. No displacement is introduced solely to disguise overlap. Pendant, bedside lamps, and the 25 ceiling fixtures retain their illumination emitters under the systems owner until systems retirement can be checked with the viewer.

| Independent non-emissive direct member | Model-state and origin (x,y,z), yaw | Host relation |
| --- | --- | --- |
| `entry-charging-shelf` | `entry-charging-shelf/default`, (-2.76,1.05,-0.65), 90 | entrance wall mount; model local X spans the old Z shelf width |
| `entry-charger` | `entry-charger/default`, (-2.70,1.0725,-0.65), 0 | top of the charging shelf |
| `common-rug` | `rugs/living`, (3.61,0,2.78), 0 | common floor, top at 0.016 |
| `common-display` | `living-display/default`, (5.20,1.30,2.85), 90 | media wall, rotated local X into world Z |
| `ground-store-basket-i`, i=0..3 | `storage-basket/default`, (-4.89,0.20+0.55i,-1.20), 0 | current shelf vertical sequence; bottom equals old box bottom |
| `upper-linen-stack-i`, i=0..4 | `folded-towels/120`, (-4.88,3.22+2.58(i+1)/7,0.48), 0 | cabinet shelf i+1; bottom equals old stack bottom; height follows the 429-object census |

## Reuse and tier policy {#variation-and-tiers}

All listed instances use the authored full mesh at scale (1,1,1). The only geometry-state selection in this first fit-out is `murphy-bed/work` versus `murphy-bed/guest`, driven by the house's explicit flex state; it changes one stable instance, and the guest bed is not a second free-standing member. Indexed chairs, stools, nightstands, baskets and towel stacks share their prototype, while their IDs and exact transforms remain distinct. The source groups equal prototype/state members into one explicit compact set per room and assigns each transform its own stable ID and named prototype selection. Part finish choice comes from `docs/materials`; a declared finish variant selects a registered model recipe in that set while preserving the reviewed part geometry and its metric UV. There is no random scatter, scale variation, density parameter, culling tier, hero mesh override, or LOD transition for these occupied rooms; seed 2080 is fixed and unused by the explicit member transforms. A later reduced representation would require its own bounded design and near/far viewer observation; it cannot silently replace a member here.

## Placement contact and circulation {#contact-and-clearance}

Floor members start at Y=0 or Y=3.20, matching the two floor datums. The rug is 0.016m thick and the coffee table begins on its top. The mounted flex bookshelf begins at Y=1.05; the upper overhead kitchen cabinet begins at Y=1.54. The washer begins at the upper floor and dryer at Y=4.04, so the two 0.84m high appliance envelopes stack without a gap. The dining and island repeats are centered on their existing furniture, not a uniform room grid. Validation measures each model's transformed envelope against its support, nearby walls, openings, stairs and circulation, with special inspection at the front entry, dining seats, island stools, bathroom fixtures, and the guest Murphy-bed footprint. The transform audit confirms source parity, while support and walking clearance require the compiled-bounds audit and current GPU views after integration.

## Ceiling fixture population {#ceiling-fixtures}

The room source currently owns 25 ceiling points, each with one trim and one luminous diffuser. The 429-object census calls for 29 independent ceiling fixtures. The discrepancy is localized to powder (one existing, two required), upper corridor (three existing, five required), and upper bathroom (two existing, three required). Keep all existing coordinates and `room-light-i`/`room-light-trim-i` IDs. Append `powder-utility-light-1` and trim at X=-4.14, Z=-5.10, ceiling Y=2.90: the original X=-4.14, Z=-3.70 point serves the basin side and the second serves the toilet side without leaving the room's X=-5.26..-3.02, Z=-5.76..-2.24 clear cell. Append `upper-corridor-light-3` and `-4` with trims at X=-1.40, Z=-0.175 and 1.25, ceiling Y=6.10: these exactly bisect the former consecutive Z intervals -0.95..0.60 and 0.60..1.90. Append `upper-bathroom-light-2` and trim at X=-4.14, Z=3.60, ceiling Y=6.10: it bisects the original vanity/shower Z=2.40 and 4.80 points. These four supplement the existing spacing without moving a door, stair landing, fixture, or ceiling. The physical model is `ceiling-surface-light/default` and each luminous diffuser has one system emitter; migration must not create both a legacy light and a model light at the same point. The pendant and bedside emitter members remain separate from these 29 ceiling fixtures.

## Derivation and inspection {#derivation-and-inspection}

The source resolves each row through the already reviewed `ModelRepresentation` catalog, uses the materials part binding, and contributes an explicit compact population to the same environment returned by `buildHouse()`. The viewer resolves each member with `instanceSlot`, so the stable address is `instance:<set.id>:<explicit.id>` and a second free-standing element at the same location is invalid. A separate viewer catalog or mesh duplicate would make membership impossible to audit. For each work and guest build, verification compares the declared IDs and state, unique set and member IDs, selected prototype recipes, source model/part counts, retirement of the corresponding legacy root, absence of unbound part materials, room bounds, and the viewer GPU frames from ground and upper interior camera angles. An instance is accepted only when its occupied region is legible, walkable clearances are retained, no unexpected intersections or omissions are visible, and the deterministic audit reports no missing or duplicate model/placement address.

The migration transform audit in `.wiki/99-worklog/instance-transform-audit.cjs` compiled both current room states and checked 106 room-root placements against this table (53 in work and the same 53 in guest); mismatch count was zero on 2026-09-28. The guest-only `flex-guest-bed` root is intentionally absent because its geometry is a part of `murphy-bed/guest` at the single cabinet instance transform. Direct primitive positions and eventual model-origin alignment need the separate rendered inspection at source integration.
