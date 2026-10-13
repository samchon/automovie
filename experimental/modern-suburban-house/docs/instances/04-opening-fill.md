# Building opening-fill placement

## Deriving one fill prototype per opening {#opening-fill-membership}
<!--
@evidence principles/core/common.md#scope-preservation Twelve windows and fourteen exterior/interior doors receive one model fill each; two open passages, two storage openings and the separate site gate retain their own membership rules rather than entering that window/door denominator.
@evidence principles/core/common.md#substantive-completion The opening kind selects membership, its lower-center/host plane determines translation, the weather or opening-room normal determines yaw, and source names the corresponding placement fill:<opening-id>; prototype dimensions are parameters, never placement scale.
@evidence principles/core/common.md#declared-basis Compiled space openings provide identity, rectangular profile and boundary face, while model-local-frame supplies the lower-center origin and outward +Z; instance producers consume those records rather than a copied world-coordinate list.
@evidence principles/core/inherited-units.md#derived-parent-differentiation A wall void and local asset do not connect themselves; the child selects each opening's model family, creates one namespaced placement, and puts that placement id in the opening fill reference without recreating a wall cut.
@evidence principles/design/instances.md#instance-prototype-boundary Windows and doors retain the named model hierarchies and permitted dimensions/articulation; world translation/yaw and unit scale add no jamb, pane, leaf or alternative geometry.
@evidence principles/design/instances.md#instance-derivation-authority Existing kind=window/door ids key one fill:<id> placement each; host profile and face determine p/size/normal, so traversal order cannot introduce another fill or reinterpret a material-only surface as an opening.
@evidence principles/design/instances.md#instance-verification-address A null fill, duplicate placement id or missing model reference falsifies correspondence even if the handwritten total is 26; compare opening→fill and fill→model relationships, then inspect original host/trim contacts.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work The common lower-center origins match space profiles and exterior/interior host planes with scale 1; current source's fill: namespace changes only placement identity spelling, not parent opening dimensions or origin. Complete current contact/GPU approval is not inferred from that correspondence.
@evidence obligations/design/instances.md#instance-prototype-membership Each window/door opening keeps one corresponding model placement; storage openings and the separate gate are accounted explicitly elsewhere instead of counted as extra window/door fills.
@evidence obligations/design/instances.md#instance-identity-transform Lower-edge midpoint, the proper wall-side plane and normal derive p/yaw; rigid scale remains 1 and actual world heights are added once from the host.
@evidence models/00-model-frame.md#model-local-frame Weather-side lower-center origins govern exterior fills and opening-room-side lower-center origins govern interior fills; the four outward +Z yaw choices retain the model's local depth conventions.
@evidence spaces/06-openings.md#external-opening-interface Elevation-owned voids and room reveals retain the same opening id, and only prototypes apply frame recess/trim/sill projection; this child consumes their host records without duplicating the opening or shifting the whole instance by the frame recess.
-->

Following the [common opening frame](../models/00-model-frame.md#model-local-frame), assign one corresponding fill instance to each `kind=window` or `kind=door` opening exported by `src/spaces/environment-links.ts`. Current instance source names its placement `fill:<opening-id>` and connects the opening's `fill` field to that placement; the opening id itself is unchanged. Prototypes point to the models H2s below. Instance translation is the intersection of the rough opening's lower-edge horizontal midpoint and origin plane; rotation is one Y-axis yaw and scale is 1. Local +Y is up. Local +Z faces weather for exterior windows/doors and the opening-side room for interior doors. Yaw 0 faces +Z, π faces −Z, +π/2 faces +X and −π/2 faces −X. Calculate width/height from spaces opening outlines and pass them as model parameters rather than stretching with a separate scale. The tables record only per-id instance choices of prototype, direction and hinge. Recompute p/width/height from the space opening outline each time; keep no copied list. A window/door `fill: null` is not completed correspondence; current `src/instances/filled-building.ts` attaches the referenced placement/model and rejects missing or duplicate bindings.

## Twelve exterior windows {#window-fill-placement}
<!--
@evidence principles/core/common.md#scope-preservation All twelve named exterior openings retain their original room/elevation binding; the tub's obscured awning, stair/garage fixed units and nine double-hung groups are not merged into one representative window.
@evidence principles/core/common.md#substantive-completion The id table selects three window kinds and four elevation yaw values, while current OpeningWindowFills recalculates lower-center weather contacts and dimensions from the built boundary/profile; no copied transform or second frame recess is supplied here.
@evidence principles/core/common.md#declared-basis Individual elevation H2s supply widths/heights/unit counts and room roles, and models/01 supplies weather-side origin and operating kinds; this child assigns those models to the twelve identities without choosing another window size.
@evidence principles/core/inherited-units.md#derived-parent-differentiation A grouped void and sash model gain a named world placement and elevation-specific yaw; three-unit living glazing remains one opening fill while its internal units stay model members.
@evidence principles/design/instances.md#instance-prototype-boundary Double-hung, fixed and awning members use declared W/H/n arguments and rigid unit-scale placement; sash tracks, glazing cells, trim and articulation remain inside their respective window model.
@evidence principles/design/instances.md#instance-derivation-authority Each literal opening id selects kind/unit count, and its host face/profile supplies p/size/yaw; the producer rejects a missing, duplicate or extra exterior window rather than deriving membership from traversal order.
@evidence principles/design/instances.md#instance-verification-address High tub-right-window and the low garage-side host challenge lower-Y/side-normal mapping and wall reveals; inspect actual frame/trim bounds and both-side contacts, not just matching twelve names.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work Elevation kinds/unit counts and model weather origins permit the four yaw mappings without changing any opening or frame depth. The 0.04 m recess remains internal model geometry, so correcting a doubled instance recess requires no parent coordinate revision; current full contact/GPU approval remains unverified.
@evidence models/01-windows.md#double-hung-window Nine living/bedroom/kitchen/family groups select this kind with elevation unit counts; upper/lower tracks and closed reference state stay model-owned while this table assigns their world normals.
@evidence models/01-windows.md#fixed-window The one-unit stair and two-unit garage-side openings select rigid fixed-sash assets, retaining their different heights and world +Z/+X normals without creating articulated variants.
@evidence models/01-windows.md#awning-window The tub's one-unit obscured window selects its top-hinged asset at yaw +π/2; its π/8 maximum and 0.25 m outward reservation remain model/space constraints, not a new placement angle.
@evidence spaces/envelope/front.md#living-front-window Living-front grouped-window rough width 2.80 m and +Z normal derive the double-hung transform.
@evidence spaces/envelope/front.md#bedroom-two-front-window The bedroom-two front outline is passed to the same double-hung prototype.
@evidence spaces/envelope/front.md#stair-front-window Choose the fixed prototype for the small stair window and fit its high-sill outline.
@evidence spaces/envelope/front.md#bedroom-three-front-window Keep the bedroom-three front window distinct from bedroom two by id.
@evidence spaces/envelope/rear.md#kitchen-rear-window Place the rear kitchen-counter window as double-hung with −Z normal.
@evidence spaces/envelope/rear.md#family-rear-window The rear family-room grouped-window width is a prototype argument.
@evidence spaces/envelope/rear.md#primary-rear-window Pass the rear primary-window upper-floor Y outline to its prototype.
@evidence spaces/envelope/left.md#living-left-window Align the living side-window origin behind the fireplace to the −X normal.
@evidence spaces/envelope/left.md#primary-left-window Keep the primary left-window outline under its separate side id.
@evidence spaces/envelope/right.md#family-right-window Align the family right double-hung window with +X normal.
@evidence spaces/envelope/right.md#tub-right-window Assign the awning prototype to the tub bathroom's high obscured window.
@evidence spaces/envelope/right.md#garage-right-window Assign the fixed prototype to garage side daylighting.
@evidenceExclude models/01-windows.md#window-fidelity Weatherstrips, locks, screens and double-glazing omissions limit window representation; this id/yaw unit does not choose or realize those omitted mechanisms and cannot claim their completion from placement correspondence.
@evidence models/01-windows.md#window-local-frame Weather-plane origin and model-internal Z=[-0.18,-0.04] m frame depth locate each asset against its original void; this mapping applies no second -0.04 m recess to the world transform.
@evidenceExclude models/01-windows.md#window-member-sizes Frame/sash/mullion widths and glass thickness are internal model parameters; this table supplies only host W/H/n and creates no separate frame, sash or glazing-cell population.
@evidenceExclude models/01-windows.md#window-muntin-grid The 2×2 clear-sash bars and omitted tub muntins belong inside the chosen assets; they supply no additional opening identity or world yaw for this placement table.
@evidenceExclude models/01-windows.md#window-sill-trim Four trim boards and inner sill/casing depth bands remain window geometry; this child places the complete asset and does not derive another trim instance or reapply sill projection as a translation.
@evidenceExclude models/01-windows.md#window-surface-partitions Nine stable face roles govern binding within a window; this unit keys opening/placement ids and neither creates a new face role nor substitutes id correspondence for actual binding review.
@evidence settings/10-house.md#openings Each room-bound window receives thick frame/sash/muntin/glass geometry rather than a hole or opaque black plate; room/elevation assignment survives the shared prototype choice and numeric dimensions still come from spaces.
@evidence spaces/envelope/left.md#left-openings Living-left and primary-left retain their two separate room-bound voids behind the chimney and at upper-floor height, giving weather normal -X and yaw -π/2 without another left-wall window.
@evidence spaces/envelope/rear.md#rear-openings Kitchen, family and primary rear windows retain their distinct unit counts/height bands on the actual rear wall, with -Z weather normal and yaw π rather than copied front-window transforms.
@evidence spaces/envelope/right.md#right-openings Family, high obscured tub and lower garage-side windows bind to their different right-wall/roof contexts at +X weather normal; sharing yaw +π/2 does not merge their host heights or room ownership.
-->

Each of the following twelve uses one [double-hung](../models/01-windows.md#double-hung-window), [fixed](../models/01-windows.md#fixed-window) or [awning](../models/01-windows.md#awning-window) prototype. Origins lie on weather faces, so only the models prototype applies frame recess into the wall. Calculate origin `p` as `(world X,Y,Z)` m at each opening's lower-edge midpoint; values are not repeated here.

| Opening id | Prototype | yaw |
|---|---|---|
| `living-front-window` | Double-hung | 0 |
| `bedroom-two-front-window` | Double-hung | 0 |
| `stair-front-window` | Fixed | 0 |
| `bedroom-three-front-window` | Double-hung | 0 |
| `kitchen-rear-window` | Double-hung | π |
| `family-rear-window` | Double-hung | π |
| `primary-rear-window` | Double-hung | π |
| `living-left-window` | Double-hung | −π/2 |
| `primary-left-window` | Double-hung | −π/2 |
| `family-right-window` | Double-hung | +π/2 |
| `tub-right-window` | Awning | +π/2 |
| `garage-right-window` | Fixed | +π/2 |

## Three exterior doors and the side-yard gate {#exterior-door-fill-placement}
<!--
@evidence principles/core/common.md#scope-preservation Three wall-door fills remain distinct from the fence gate outside the environment opening list; one garage door owns its four panels/rails and one garden pair owns both leaves, without extra opening instances.
@evidence principles/core/common.md#substantive-completion The three ids select front/garage/garden assets at yaw 0/0/π and host-derived origins, while the house-coordinate gate uses identity placement; the garden origin retains finished threshold Y=0 and the garage retains its -0.15 m floor.
@evidence principles/core/common.md#declared-basis Front/rear opening and threshold owners provide wall-door hosts, side-gate-interface provides the post gap, and models/02 supplies local versus house-coordinate origins; the child selects world transforms rather than door geometry.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Bounded wall voids and four assets gain three opening-linked fills plus one separate gate member; the gate's already world-oriented boards are not translated again by their center or rotated again toward the garden.
@evidence principles/design/instances.md#instance-prototype-boundary Entry jamb/glazing, garage panels/rails, garden paired leaves and gate boards/hardware stay inside their four models; only declared world placement and reference/inspection state select the assets, with scale 1.
@evidence principles/design/instances.md#instance-derivation-authority Literal wall opening ids key three fill:<id> placements derived from built host profiles; fill:side-yard-gate is a separate identity using the gate's world coordinates and walking-surface input, without traversal-dependent membership.
@evidence principles/design/instances.md#instance-verification-address Lowering the garden model to an under-floor wall cut or applying X=12.90 m again to the gate would falsify contacts; inspect those full bodies against threshold/post faces and count the gate separately from environment window/door fills.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work Finished garden threshold Y=0, garage lower datum -0.15 m and the gate's authored world frame resolve the different origin mappings without altering opening extents or prototypes. Their current source placements exist, but full state/contact/GPU acceptance is not inferred from source existence.
@evidence models/02-exterior-doors.md#front-entry-door Its weather-side origin, +X hinge and inward -Z leaf select yaw 0 for front-door; threshold/leaf clearances remain internal model geometry rather than another downward instance offset.
@evidence models/02-exterior-doors.md#garage-sectional-door Its garage-floor/weather origin selects yaw 0 at the low opening, preserving four internal panels and guide rails as one fill instead of one placement per panel or rail reservation.
@evidence models/02-exterior-doors.md#garden-door-pair Its weather origin faces world -Z at yaw π and finished floor Y=0, preserving both leaf pivots inside one model; a wall cut below that floor does not lower the threshold-relative asset.
@evidence spaces/site/side-walk.md#side-gate-interface The 1.20 m post-interior gap, +X gardenward hinge and walking-surface S bound the separate gate, while it remains outside environment wall-opening counts and retains the two waiting/access zones.
@evidence models/02-exterior-doors.md#side-yard-gate Already house-coordinate boards X=[12.31,13.49], Z=[-0.32,-0.28] m and hinge X=13.475 m require identity transform; only the walking-surface height input enters the model rather than another center translation.
@evidence spaces/envelope/front.md#front-entry-filling The rough entry-door outline/front weather face supply its transform.
@evidence spaces/envelope/front.md#garage-front-opening Pass garage opening X=[6.10,11.10] m and low floor datum to its prototype.
@evidence spaces/envelope/rear.md#garden-door Use finished threshold Y=0 as prototype origin instead of the garden-door outline's lower wall cut.
@evidenceExclude models/02-exterior-doors.md#exterior-door-fidelity Locks, motors, springs and latch internals are omitted model mechanisms; this id/transform table generates none of them and cannot turn a garage rail pose into proof of mechanical operation.
@evidenceExclude models/02-exterior-doors.md#exterior-door-surfaces Leaf-exterior/interior/edge, glazing and hardware ids bind internal member faces; this placement unit chooses no new partition, finish or separate threshold model from that list.
@evidence spaces/site/fence.md#fence-gate-junction Existing posts and empty gap retain spaces ownership, so the identity-placed model leaf joins those same posts without another post pair or fixed fence panel across the gate.
@evidence spaces/site/fence.md#fence-ground-profile The adjacent fence and gate share walking-surface-relative lower/top heights, while missing adopted terrain remains unresolved; an identity gate placement does not certify the entire enclosure's ground contact.
@evidence spaces/site/side-walk.md#side-walk-plan The walking surface and two connected side zones supply the gate host height/access context; its leaf remains over that paving rather than receiving an invented map-height fallback or a second side path.
-->

The three exterior-door members each use the [entry](../models/02-exterior-doors.md#front-entry-door), [garage](../models/02-exterior-doors.md#garage-sectional-door) and [garden](../models/02-exterior-doors.md#garden-door-pair) prototype once. Prototypes own reference opening states. Garden-door origin is Y=0 at the finished threshold; do not lower the prototype even when the wall cut continues below finished floor.

| Opening id | Prototype | yaw |
|---|---|---|
| `front-door` | Entry door | 0 |
| `garage-front-door` | Garage door | 0 |
| `garden-door` | Garden door | π |

The [side-yard service-gate boundary](../spaces/site/side-walk.md#side-gate-interface) is a separate fence gap outside the environment opening list. The [side-yard gate prototype](../models/02-exterior-doors.md#side-yard-gate) defines closed boards X=[12.31,13.49] m·Z=[−0.32,−0.28] m and a +X hinge axis in world coordinates. Thus this single instance uses position (0,0,0) m, yaw 0, scale 1; do not apply center X=12.90 m or gardenward −Z as a second transform. Inspect leaf/hardware contact with site post interiors X=[12.30,13.50] m, allowed motion and the parent's passage/waiting zones; do not recreate fence posts/panels. Include the gate in the building-fill population but not in environment `fill` counts. Existing leaf/fence source does not complete adopted terrain or current user/contact/GPU review.

## Eleven interior hinged doors {#interior-door-fill-placement}
<!--
@evidence principles/core/common.md#scope-preservation All eleven independently entered service/upper rooms retain their own door id and opening-room direction; wardrobe access stays through the primary room, and no storage opening or doorless passage enters this hinged-door set.
@evidence principles/core/common.md#substantive-completion The complete table gives world hinge end, opening-room yaw and corresponding local left/right variant for every id; InteriorDoorFills reads host width/thickness/lower datum instead of copying another position list.
@evidence principles/core/common.md#declared-basis Room-route-network and room owners supply destinations/hinge ends, while the two mirrored model variants supply opening-local +Z and π/2 reference state; this child converts world hinge ends into local sides under each yaw.
@evidence principles/core/inherited-units.md#derived-parent-differentiation A room connection and hinged asset gain one stable fill:<door-id> placement, correct room-facing normal and mirrored hinge choice; sharing one model does not copy the pantry's high-Z hinge into a low-Z door.
@evidence principles/design/instances.md#instance-prototype-boundary All eleven use the same interior-door hierarchy with declared width, wall thickness and handle variant; only rigid world placement and its permitted reference/inspection rotation vary, without another threshold or resized leaf.
@evidence principles/design/instances.md#instance-derivation-authority The literal id table determines yaw/hinge choice, while built host/profile determines lower-center origin, width and thickness; source rejects missing/extra door identities and keeps unit scale rather than numbering by traversal.
@evidence principles/design/instances.md#instance-verification-address Pantry's high-Z hinge and primary's yaw π challenge the world-to-local side conversion; compare actual open leaf/handle bounds with each room's waiting/use areas and garage-floor junction instead of checking only a forward normal.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work The eleven room hinge/end assignments map consistently to the model's two mirrored variants at the stated yaw, including pantry high-Z/local-left and primary low-X/local-right. Existing lower-edge datums supply ground/upper height without a new room origin; current full swept-contact/GPU approval is not established by the table.
@evidence models/03-interior-doors.md#interior-door-members Its centered lower-edge/opening-side frame receives host width and 0.15/0.25 m wall depth; world p/yaw retain the shared jamb/leaf hierarchy and add the opening's floor height once.
@evidence models/03-interior-doors.md#interior-door-hinges Low/high world ends and local mirrored pivots convert under the table's yaw, preserving each room's π/2 open reference without exchanging hinge sides or inferring a stop angle from a photograph.
@evidence spaces/05-route-network.md#room-route-network The service branches, laundry-only garage route, five direct upper-hall rooms and primary-only wardrobe edge define which room each leaf opens into; door placement adds no pass-through route through pantry, powder or bedroom.
@evidenceExclude models/03-interior-doors.md#interior-door-fidelity Three visible knuckles and omitted latch/lock/closer mechanisms limit the asset; this placement table neither generates that hardware nor adds a model threshold for the garage's existing floor step.
@evidenceExclude models/03-interior-doors.md#interior-door-surfaces jamb-a/b/core and casing-a/b distinguish two room-side faces inside the chosen model; this id/yaw mapping adds no face partition or separate casing placement and makes no material-binding verdict.
-->

Each of eleven locations uses the [interior-door prototype](../models/03-interior-doors.md#interior-door-members) once. p is the intersection of the opening-room wall face and rough opening's lower center. Hinge low/high means the lower/higher horizontal opening coordinate in the [room-specific hinge table](../models/03-interior-doors.md#interior-door-hinges); mirrored model variants match sides. `local hinge` is left/right viewed from +Z. All reference states follow the prototype's π/2 opening.

| Opening id | yaw | World hinge end | local hinge |
|---|---|---|---|
| `laundry-garage-door` | −π/2 | low Z | Left |
| `entry-living-door` | −π/2 | low Z | Left |
| `service-powder-door` | +π/2 | low Z | Right |
| `service-laundry-door` | +π/2 | low Z | Right |
| `service-pantry-door` | +π/2 | high Z | Left |
| `hall-primary-door` | π | low X | Right |
| `primary-wardrobe-door` | −π/2 | low Z | Left |
| `hall-bedroom-two-door` | 0 | high X | Right |
| `hall-bedroom-three-door` | +π/2 | low Z | Right |
| `hall-shower-door` | π | low X | Right |
| `hall-tub-door` | +π/2 | high Z | Left |

## Boundaries of open passages and built-in sliding doors {#non-door-opening-fills}
<!--
@evidence principles/core/common.md#scope-preservation Two common-room passages remain empty, while coat/linen storage openings receive one fitting each; thirty linen towels retain a separate unbuilt prop population rather than becoming door/shelf members or another room route.
@evidence principles/core/common.md#substantive-completion House-oriented XZ requires no second translation/yaw, but coat floor Y=0 and linen floor Y=3.06 m are distinct; the body corrects the former all-identity instruction and retains stable shelf/stack/layer ids for the towel proposal.
@evidence principles/core/common.md#declared-basis The two passage ids supply empty circulation, closet models supply existing house XZ/floor-relative heights, and upper-linen-storage supplies floor/shelf tops; linen-folded-towels supplies width/depth/count for the separate hosted draft.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Four non-window/door voids gain two explicit empty states and two namespaced fitting placements, with floor height added once to linen; the five shelf hosts gain an indexed towel proposal without another shelf or storage-room edge.
@evidence principles/design/instances.md#instance-prototype-boundary Coat leaves/rails/rod/shelf and linen leaves/rails/five shelves retain their own assets and bounded sliding inputs; towel geometry remains its own prop model, and empty passages generate no leaf or fake fill panel.
@evidence principles/design/instances.md#instance-derivation-authority Passage ids generate no placements; fill:entry-coat-opening and fill:upper-linen-opening select existing fitting models with house XZ and their host floor Y. Shelf/stack/layer indices name proposed towels without traversal-dependent counting.
@evidence principles/design/instances.md#instance-verification-address A second XZ translation would move coat X=2.02 or linen Z=-3.41 m contacts off their walls, while missing linen Y=3.06 m would place it on the wrong storey; inspect both frames and maximum individual leaves separately from the unfinished towel population.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work Closet parents already distinguish house XZ from floor-relative Y and upper-linen-storage supplies finished floor 3.06 m. The former child instruction p=(0,0,0) for both is corrected to a single linen floor lift, matching current source without changing parent dimensions or prototype geometry; actual complete contact/GPU review remains separate.
@evidence models/05-closet-fittings.md#coat-closet-doors The two overlapping leaves and tracks already occupy coat house XZ at ground-floor-relative Y, so one identity placement preserves X≤2.035 m casing and its 0.45 m individual sliding limits without a second opening-center translation.
@evidence models/05-closet-fittings.md#linen-closet-fittings House XZ and floor-relative rails/leaves/five shelf tops receive only Y=3.06 m, retaining separate 0.475 m sliding limits and model-owned casing rather than regenerating shelf or door instances.
@evidenceExclude models/05-closet-fittings.md#closet-fitting-fidelity Rollers, brackets and screws are omitted asset internals, while contents are separately owned; this unit chooses no replacement hardware or physical roller/load verdict from a successful fitting placement.
@evidenceExclude models/05-closet-fittings.md#closet-fitting-surfaces Leaf/panel/rail/rod/shelf/handle/casing ids remain internal model binding roles; this passage/storage membership rule adds no new surface partition or separate rail/shelf population.
@evidence models/05-closet-fittings.md#coat-closet-rod-shelf The ground-floor coat fitting retains its house-oriented rod center X=1.425/Y=1.65 m and stair-limited shelf as model members, without another shelf transform or source claim that sliding leaves complete clothes.
@evidence models/18-house-props.md#linen-folded-towels Three two-towel stacks on five 1.20×0.55 m shelf hosts retain 0.16 m end margins and 0.18 m front clearance; the thirty indexed props remain separate from implemented storage fittings and still await actual meshes/placement.
@evidence settings/10-house.md#upper-hall Corridor storage keeps five shelf roles and direct hall access rather than another passage room; towels give its authored linen use without allowing a storage member to hide the hall's observation scope.
@evidence spaces/rooms/upper-hall.md#upper-hall-plan The notched hall and independently accessed linen front determine storage affiliation and the neighboring arrival route; placing its fittings does not refill that notch or add a room-to-room edge through storage.
@evidence spaces/rooms/upper-hall.md#upper-linen-storage Finished floor 3.06 m, opening X=[1.97,2.97] m and five shelf tops determine the one fitting's floor lift and separate towel hosts; model tracks contact the existing finished opening strip without another floor plate.
-->

Do not include the remaining four `kind=opening` locations in the hinged-door list. `living-common-opening` and `service-common-opening` remain empty for circulation. [Coat sliding doors](../models/05-closet-fittings.md#coat-closet-doors) close `entry-coat-opening`; [linen sliding doors](../models/05-closet-fittings.md#linen-closet-fittings) close `upper-linen-opening`. Both models already define house XZ, but Y is relative to their host floor. Coat placement is p=(0,0,0) m and linen placement p=(0,3.06,0) m, both yaw 0 and scale 1. Current `src/instances/architectural-fitout.ts` uses those transforms for `fill:entry-coat-opening` and `fill:upper-linen-opening`. The former all-identity instruction omitted linen's floor lift. Inspect contact against coat front X=2.02 m, horizontal Z=[−4.51,−3.56] m, floor Y=0; and linen front Z=−3.41 m, horizontal X=[1.97,2.97] m, floor Y=3.06 m. Add that floor height once, apply no second XZ translation/yaw and duplicate no space wall/finished floor.

The separate [folded-towel proposal](../models/18-house-props.md#linen-folded-towels) uses the [five linen shelves](../spaces/rooms/upper-hall.md#upper-linen-storage), three stacks per shelf and two towels per stack. Ids are `upper-linen-towel-<shelf>-<stack>-<layer>`: shelf=1…5 bottom to top, stack=1…3 left to right, layer=1…2 bottom to top. Each rear-bottom-center towel origin uses a depth 0.05 m from the shelf's rear edge, with 0.16 m end margins and 0.02 m stack spacing within shelf length 1.20 m. Those parent values derive X=1.87+0.16+0.14+(stack−1)×0.30 m, Z=-2.66−0.05=-2.71 m and Y=3.06+0.25+(shelf−1)×0.38+(layer−1)×0.06 m. Model-local +Z faces doors at world -Z, so yaw is π and scale 1. All 30 remain on that storage host without directional variation. Their 0.32 m depth leaves the parent's 0.18 m shelf-front clearance. Actual towel meshes and placement remain unbuilt; open-door front/side views must still inspect all five levels, contact and nonintrusion into tracks.

## Placement observation threshold {#opening-fill-observation}
<!--
@evidence principles/core/common.md#scope-preservation All 26 window/door fills, two empty passages, two storage fittings and one separate gate remain in the correspondence/contact review; the thirty unbuilt linen towels are not accepted through fixed-door observations.
@evidence principles/core/common.md#substantive-completion Both-direction opening/placement/model correspondence and close jamb/sill/two-sided wall views inspect the complete set, while separate individual-leaf maxima prevent simultaneous sliding-leaf exchange from disguising another closed state.
@evidence principles/core/common.md#declared-basis Current environment openings and actual placement/model ids supply the census; compiled spatial questions and frame conditions supply observation addresses. Earlier recorded views are provenance, not a new review of this document change or unfinished prop families.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Host/model identities alone do not judge their junctions; this child adds omission/duplication checks, paired face-ID/material contacts and separate articulation states at the same camera without inventing another asset or deleting a spatial question.
@evidence principles/design/instances.md#instance-prototype-boundary Earlier H2s choose all fill assets; this review unit changes neither prototypes nor allowed articulation and cannot treat inspection caps or face-ID colors as authored geometry/materials.
@evidence principles/design/instances.md#instance-derivation-authority Strip only the defined fill: namespace when comparing opening ids with corresponding placement ids, then follow each placement's model reference; the compiled set determines omissions/duplicates rather than using 26 as generation authority.
@evidence principles/design/instances.md#instance-verification-address One window/door null fill, a model reference missing from its placement, or a frame/casing gap in a close two-sided junction view falsifies correspondence; valid ids alone do not prove intermediate motion, user access or current pixels.
@evidence upstream/design/instances.md#parent-revision-from-instance-work spaces/04-observations formerly asserted that compiled topology/environment calls and house source did not exist despite current producers and opening fills. Its status clauses now distinguish existing compiled source and partial fixed fence from unresolved map/object inputs and full current GPU/contact review; no opening extent or prototype origin was changed and no new visual completion is claimed.
@evidence obligations/design/instances.md#instance-placement-review Whole-set correspondence and four-elevation/jamb/sill/two-room contacts judge omissions/gaps; reference and individual maximum states remain distinct, and current full observations are not established by a design census alone.
@evidence settings/20-verification.md#frame-condition Stable canvas/DPR, exterior/interior FOV and same-camera supplementary views keep small jamb/sill contacts comparable; added close views retain the original complete-space questions instead of hiding them with a changed camera.
@evidence settings/20-verification.md#observation-allocation Compiled boundary/opening/room questions and all five additional reference questions remain the denominator; this fill-specific close-view set adds contact questions without replacing in-room observations with one representative opening.
@evidenceExclude settings/20-verification.md#viewer-handoff Port 4173, --port, startup command and short HTTP/console check govern viewer operation, supplying no opening id, transform or pixel verdict; this placement-review H2 launches no server and treats startup success as separate from actual observation.
@evidence spaces/04-observations.md#engine-render-handoff Real model-bearing elements make fills visible while a logical opening/standable surface alone cannot; null/invalid observation poses remain failures, and partial current lowering/source existence does not establish complete current pixel judgment.
@evidence spaces/04-observations.md#reference-spatial-comparisons Intact front/upper-room/common-area comparisons preserve the original room graph, empty garage and two-storey ownership; cutaway-only views cannot substitute for both-side fill contacts and original in-room questions.
@evidence spaces/04-observations.md#spatial-observation-derivation The same current boundary/opening records derive per-room and height-specific junction questions, retaining wall attachments and door/handle states together; matching fill ids neither removes an occluded corner nor proves a user can occupy its pose.
-->

Current building source puts one fill reference in each of 26 window/door openings, leaves 2 passages empty and places 2 storage openings plus the separate gate. This connection differs from `fill: null` in spaces-only output. The recorded review compared all 403 whole-building directional/height-cut/close-view originals and model front/side/oblique material/face-ID pairs, inspecting jambs, sills, casing, muntins, glazing and two-sided contacts. Articulation maxima were read separately with the same oblique camera. Storage sliding inputs moved one leaf at a time to its maximum rather than exchanging both leaves into another closed state. The 30 linen towels remain a separate unbuilt prop draft; fixed storage-door observation does not establish their completion. When opening position/size changes, revise the relevant spaces owner first and update this table together with fill inputs.
