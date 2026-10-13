# Common opening-fill model rules

## Local coordinates and placement rules {#model-local-frame}
<!--
@evidence principles/core/common.md#scope-preservation Own shared units/axes/placement rotation for one-opening fill models, the spaces rough-envelope/models member-dimension boundary, and exterior-window/door versus interior-door origin planes.
@evidence principles/core/common.md#substantive-completion Origin is rough-opening lower-edge horizontal center, on weather face for exterior windows/doors or opening-side wall for interior doors; rotation is Y-axis 0/π/±π/2, without implementation reselecting the reference.
@evidence principles/core/common.md#declared-basis Units/axes come from settings/00-production.md#coordinate-units; opening owners/recess 0.04/depth 0.14 m from spaces/06-openings.md#external-opening-interface.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Specify right-handed Y-up/m/rad as opening-lower-center origins on exterior weather/interior opening faces and four Y rotations.
@evidence principles/design/models.md#representation-contract One prototype fills one rough opening, deriving width/height only from it; 01–05 H2s own detailed hierarchies.
@evidence principles/design/models.md#spatial-convention State local origin/+Y=world +Y/+Z=origin-plane outward normal/+X=right viewed from +Z and four rotations, without searching code for conventions.
@evidence principles/design/models.md#reviewable-structure Opening fronts/wall sections in spaces/04-observations.md expose origin-plane/rotation misalignment.
@evidence principles/design/models.md#model-observable-style-basis Define observable placement without copying spaces coordinates, without style/color/light claims.
@evidence principles/design/models.md#model-scale-layer-completion Scale is meter world, layer wall-depth origin plane, interfaces origin/rotation; opening placement lacks no scale relationship.
@evidence settings/00-production.md#coordinate-units Consume right-handed Y-up/m/rad and +Z front-walk direction as fill-local axes/four Y rotations.
@evidence spaces/06-openings.md#external-opening-interface Receive four-elevation coordinate ownership; models duplicates no world coordinates and derives envelope only from rough openings.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consume coordinate-units and 06's owners/0.04/0.14 m reservations unchanged; no contradiction/missing parent value affects origin-plane/rotation selection.
@evidence obligations/core/common.md#layer-boundary Spaces supplies void envelopes/unit counts/hinge sides; models member sections, materials color/optics and instances individual world placements.
@evidence settings/00-production.md#build-allocation The assignment of actual members/furniture/tree prototypes to models defines this frame's scope. Later H2s choose dimensions/geometry; absent source surfaces remain unverified.
@evidence spaces/envelope/left.md#left-openings Receive left-wall opening ownership as weather-origin placement input.
@evidence spaces/envelope/rear.md#rear-openings Consume main rear wall Z=[-10.70,-10.45] m as rear-window/garden-door origin-plane position.
@evidence spaces/envelope/right.md#right-openings Receive right-wall opening ownership as weather-origin placement input.
@evidenceExclude settings/00-production.md#accessibility Accessibility deliverable states supply no member dimension/articulation values.
@evidenceExclude settings/00-production.md#coverage-map The ownership map points to independently cited openings/use-profile owners rather than supplying member values itself.
@evidenceExclude settings/00-production.md#delivery-scope Delivery scope defines no member dimensions/articulation/surfaces.
@evidenceExclude settings/00-production.md#governing-aim Models cites the fidelity/openings owners that specify the governing aim rather than deriving members directly from the aim.
@evidenceExclude settings/00-production.md#operative-subjects Subject/resource inventory supplies no opening/storage geometry values.
@evidenceExclude settings/00-production.md#operator-access Operator/access authority does not determine model members.
@evidenceExclude settings/00-production.md#working-language Models uses the working language but receives no member-decision values from it.
@evidenceExclude settings/10-house.md#house-scale Models receives dimensions from spaces opening H2s resolving whole-house scale into coordinates.
@evidenceExclude settings/10-house.md#main-mass Mass/roof-form decisions belong to structural owners; models creates no main wall/roof body.
@evidenceExclude settings/10-house.md#service-band Models receives doors from individual room plans rather than service-circulation ownership.
@evidenceExclude settings/20-verification.md#completion-boundary Completion/recording procedure defines no member geometry/articulation/surfaces.
@evidenceExclude settings/20-verification.md#data-authority Measurement/frame responsibility defines no member geometry/articulation/surfaces.
@evidenceExclude settings/20-verification.md#execution-boundary Source execution/module procedure defines no member geometry/articulation/surfaces.
@evidenceExclude settings/20-verification.md#implementation-boundary Editing/dependency procedure defines no member geometry/articulation/surfaces.
@evidenceExclude settings/20-verification.md#lifecycle-boundary Authoring-order procedure defines no member geometry/articulation/surfaces.
@evidenceExclude settings/20-verification.md#lighting-state Key/shadow/lit-interior light state belongs to systems; model-review uses neutral backgrounds.
@evidenceExclude settings/20-verification.md#observation-allocation Model-review conditions come from frame-condition; spaces owns whole-house observations rather than this allocation supplying members.
@evidence settings/20-verification.md#reference-authority The non-survey declaration for references 01–05 and settings/spaces-derived coordinates enforce no photograph-proportion back-calculation of construction dimensions.
@evidenceExclude settings/20-verification.md#renderer-boundary Real-3D source/viewer conditions define no member geometry/articulation/surfaces.
@evidenceExclude settings/20-verification.md#role-boundary Authorship/measurement/judgment procedure defines no member geometry/articulation/surfaces.
@evidenceExclude settings/20-verification.md#submission-boundary Commit/push procedure defines no member geometry/articulation/surfaces.
@evidenceExclude settings/20-verification.md#validation-boundary Canonical verification procedure defines no member geometry/articulation/surfaces.
@evidenceExclude settings/20-verification.md#viewer-handoff Viewer startup handoff defines no member geometry/articulation/surfaces.
@evidenceExclude spaces/01-storeys.md#storey-datums Prototypes use local origins; instances consumes finished-storey heights for placement.
@evidenceExclude spaces/02-stair.md#stair-connector-handoff Model balusters create/change no stair connectors.
@evidenceExclude spaces/04-observations.md#engine-render-handoff Space-output render handoff supplies no member values.
@evidenceExclude spaces/04-observations.md#reference-spatial-comparisons Spatial comparisons supply no model-view values beyond the separately cited frame-condition.
@evidenceExclude spaces/05-route-network.md#room-route-network Models receives doors from individual room plans rather than route-network decisions.
@evidenceExclude spaces/08-floor-assembly.md#interstorey-edge-junctions Models creates no interstorey edge/floor structure.
@evidenceExclude spaces/08-floor-assembly.md#interstorey-floor-boundary Models creates no interstorey structure/two-storey floor finishes.
@evidenceExclude spaces/09-ceiling-assembly.md#ceiling-roof-clearance Models creates no ceiling/roof junction structure.
@evidenceExclude spaces/09-ceiling-assembly.md#garage-ceiling-closure Garage-door rail-path uses front.md's overhead reservation without creating ceiling faces.
@evidenceExclude spaces/09-ceiling-assembly.md#upper-ceiling-closure Models creates no upper/stair ceilings.
@evidenceExclude spaces/10-ground-floor.md#garage-ground-floor-base Models creates no garage floor substrate.
@evidenceExclude spaces/10-ground-floor.md#ground-support-handoff Below-floor support/ground handoff supplies no model members.
@evidenceExclude spaces/10-ground-floor.md#main-ground-floor-base Models creates no main-floor substrate.
@evidenceExclude spaces/envelope/front.md#front-roof-closures Models creates no front-gable triangular wall closure.
@evidenceExclude spaces/envelope/left.md#left-roof-closure Models creates no left triangular wall closure.
@evidenceExclude spaces/envelope/rear.md#rear-roof-closures Models creates no rear wall closure below eaves.
@evidenceExclude spaces/porch.md#porch-roof-columns No model H2 creates porch columns/roof.
@evidenceExclude spaces/roof/00-junctions.md#roof-wall-head-junctions Models creates no exterior-wall bodies/tops beneath main/garage roofs.
@evidenceExclude spaces/roof/front-gable-left.md#front-gable-left-roof Weather/underside/envelope thickness of roof.front-gable.left belongs to src/spaces/roof/front-gable-left.ts; models creates no such roof plate.
@evidenceExclude spaces/roof/front-gable-right.md#front-gable-right-roof roof.front-gable.right and F's right slope belong to src/spaces/roof/front-gable-right.ts; models creates no such plate.
@evidenceExclude spaces/roof/garage-back.md#garage-back-roof Gback/roof.garage.back define the structural rear garage plate, not a models plate.
@evidenceExclude spaces/roof/garage-front.md#garage-front-roof Gfront weather/underside define the garage front plate; door rail-path receives front.md overhead reservations rather than this roof face.
@evidenceExclude spaces/roof/main-back.md#main-back-roof Mback/rear eave belong to the structural main-back roof, not models plates.
@evidenceExclude spaces/roof/right-back.md#right-back-roof Rback defines the structural right rear plate, not models plates.
@evidenceExclude spaces/roof/right-front.md#right-front-roof Rfront/step-wall junction define the structural right front plate, not models plates.
@evidenceExclude spaces/rooms/common.md#common-clear-routes Common routes supply no opening-model values.
@evidenceExclude spaces/rooms/common.md#common-room-plan Common envelope is separate; common windows/garden doors receive values from rear.md H2s.
@evidenceExclude spaces/rooms/garage-interior.md#garage-interior-plan Garage interior floor/mudroom connection is separate; garage-door values come from front.md#garage-front-opening.
@evidenceExclude spaces/rooms/garage-interior.md#garage-use-routes Garage access paths supply no member values.
@evidenceExclude spaces/rooms/laundry.md#laundry-through-route Laundry crossing is separate; both door values come from laundry-plan.
@evidenceExclude spaces/rooms/living.md#living-through-route Living floor route is separate; door values come from living-plan.
@evidenceExclude spaces/rooms/pantry.md#pantry-use-route Pantry use route is separate; door values come from pantry-plan.
@evidenceExclude spaces/rooms/service.md#service-access-plan Service route is separate; coat members receive entry-coat-storage values.
@evidenceExclude spaces/rooms/upper-hall.md#upper-hall-plan Hall/five-room links are separate; doors consume each room plan and upper-linen-storage.
@evidenceExclude spaces/site/00-access.md#map-handoff-inputs house-site map boundary/ground inputs/refusals are not consumed by model members.
@evidenceExclude spaces/site/00-access.md#site-access-interface Models creates no site inclusion/paving endpoints/external network contacts.
@evidenceExclude spaces/site/00-access.md#site-local-routes Models creates no porch/terrace/fence route sequence.
@evidenceExclude spaces/site/01-paving-support.md#paving-contact-handoff Shared paving top/bottom contact rules create no model paving.
@evidenceExclude spaces/site/01-paving-support.md#paving-depth-reservation Paving thickness/substrate is separate; gate bottom comes from side-gate-interface at S+0.05 m.
@evidenceExclude spaces/site/01-paving-support.md#raised-platform-support Models creates no porch/terrace raised-flat bodies/closed sections.
@evidenceExclude spaces/site/driveway.md#driveway-plan Concrete driveway is separate; garage-door values come from front.md#garage-front-opening.
@evidenceExclude spaces/site/fence.md#fence-gate-junction Fence clears gate X and delegates values to side-gate-interface; model gate receives only that owner's values.
@evidenceExclude spaces/site/fence.md#fence-ground-profile Fence tops match gate height/bottoms g+0.05 m; model gate height comes from side-gate-interface at S+0.05–1.70 m.
@evidenceExclude spaces/site/front-walk.md#front-walk-plan Models creates no walk from first porch riser to front paving end.
@evidenceExclude spaces/site/side-walk.md#side-walk-plan Models creates no side walking surface; gate width comes from side-gate-interface post interval.
@evidenceExclude spaces/site/terrace.md#garden-lower-landing-plan Models creates no flat waiting surface depth 1.20 m below exterior steps.
@evidenceExclude spaces/site/terrace.md#garden-steps-plan Models creates no exterior terrace-to-landing steps/railings.
-->

References 01–05 are not dimensioned drawings. Technical rules come from settings/space reservations rather than photograph proportions. Refusing image-derived scale does not change envelope/circulation ownership.

Opening-fill models retain [production coordinates](../settings/00-production.md#coordinate-units): right-handed Y-up, length m/angle rad. One model fills one spaces-owned rough opening. Local origin is the lower-edge horizontal center, on one side of its owning wall in the thickness direction: weather face for exterior windows/doors, opening-side wall for interior doors. Local +Y is world +Y, +Z origin-plane outward normal and +X right viewed from +Z. World rotation is Y-axis 0/π/±π/2 according to wall direction, calculated from spaces H2 void coordinates without duplicated world coordinates in models.

Derive envelope width/height only from rough opening; receive unit count/hinge side/opening direction from its owner. [Common external reservations](../spaces/06-openings.md#external-opening-interface) supply window-weather recess 0.04 m/frame depth 0.14 m unchanged. Models chooses member width/depth/thickness; materials color/optics; instances individual world placement/repetition. Source `src/models/frame.ts`; inspect opening fronts/wall sections in [complete observations](../spaces/04-observations.md#spatial-observation-derivation).

## Furniture and fixture local coordinates {#model-furniture-local-frame}
<!--
@evidence principles/core/common.md#scope-preservation Own furniture/fixture/storage origins/axes/rear-edge choices/placement rotation and common meter UVs for all 01–19 members.
@evidence principles/core/common.md#substantive-completion Origin rear-floor-line center/+Z use-front; clear rear/side baseboard strip 0.015×0.10 m and define all-face UV axes/origins/scales/seams.
@evidence principles/core/common.md#declared-basis Units/axes come from coordinate-units; envelopes from room reservations under contracts/reservation-fit.md#reservation-fit.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Specify settings local-transform requirements as rear-edge-center origin/userward +Z/one instance-derived Y rotation.
@evidence principles/design/models.md#representation-contract Room-owner upper-bound boxes/use reservations govern each prototype envelope.
@evidence principles/design/models.md#spatial-convention Define origin/+Y/+Z/+X and one Y world-placement rotation.
@evidence principles/design/models.md#reviewable-structure Room observations falsify rear reference on finish plane, lower 0.10 m clearance for rear/side baseboards width 0.015 m and +Z toward use space.
@evidence principles/design/models.md#model-observable-style-basis References are not surveys; specify observable wall-contact/use orientation without style/material/light claims.
@evidence principles/design/models.md#model-scale-layer-completion Meter scale, floor-contact layer and rear-edge origin provide complete scale/layer placement references.
@evidence settings/00-production.md#coordinate-units Consume Y-up/m, fixing rear-floor-center origin/use-front +Z.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consume coordinate-units/reservation-fit unchanged; no parent defect affected furniture origin rules.
-->

References 01–05 are not dimensioned drawings. Technical rules come from settings/space reservations rather than photograph proportions; refusing image-derived scale preserves envelope/circulation ownership.

Furniture/fixture/storage prototypes not filling openings use [production](../settings/00-production.md#coordinate-units) units/axes. Origin is horizontal center of rear floor-contact edge; +Z approached use-front/+Y world up/+X right viewed from front. Rear edge lies on wall finish for wall-attached prototypes or on the envelope edge opposite use for islands/tables. This is an occupancy reference, not a required flat rear solid. A wall-contact origin beside exposed baseboards clears local Y=[0,0.10] m/Z=[0,0.015] m roomward of wall. If either side meets a baseboard wall, also clear its inward X strip 0.015 m over Y=[0,0.10]. Apply side cuts across full facing depth; subtract rear/side unions only once at corners. Each prototype names affected walls and specifies feet/back-start height/lower relief. Upper back/front/handles/maximum operating states stay within received envelope. Wall-front built-ins retain baseboards behind and use the same relief unless an actual wall opening exists. Under [reservation fit](../contracts/reservation-fit.md#reservation-fit), dimensions come from room upper-bound boxes/use reservations; instances calculates one Y rotation from room coordinates. Source `src/models/frame.ts`; furniture H2s cite this rule.

Use this common handle prototype where an H2 gives no separate dimensions; explicit alternatives/recesses take precedence. Horizontal bar length 0.12/diameter 0.012 m centers 0.06 m inside free edge/0.06 m below top; drawers center horizontally/vertically in their band. Total front projection 0.02 m; two supports length 0.014 m avoid double-counting diameter. Vertical bar length 0.12/diameter 0.012 m centers 0.04 m inside free edge/0.08 m above bottom. Appliance metal bars length 0.25/diameter 0.020 m center 0.06 m inside free edge/vertical midpoint, total projection 0.03 m. Even with handle id shared, materials selects black cabinet coating versus appliance stainless by model H2/instance variant keys. Bars are closed 12-sided volumes with meter length-U/circumference-V UVs.

All 01–19 windows/doors/stairs/storage/baseboards/furniture/fixtures/exterior repetition/props inherit the following meter UVs unless their H2 specifies otherwise. Origin is each member's local lower-left rear corner, restarted (0,0) per plane. Horizontal tops/bottoms use X U/Z V; vertical fronts/backs X U/Y V; sides Z depth U/Y V. Cuts restart longest actual edge U/next edge V. Inclined planes use local +X projected to the plane as U (project +Z if zero), and normal×U tangent as V. Cylinders/frustums use actual axial length U/circumference V, starting circumference seam at +Z for Y axes, +X for Z axes and +Y for X axes. For inclined axes parallel to none, project +Y perpendicular to axis at member start (+Z if zero) as circumference-zero, unfolding actual arc V right-handed. Spheres use +Y pole: longitude actual arc U/latitude from north pole V=Rθ (θ radians from +Y); longitude seam +Z. Longitude U=R sinθ·φ per latitude, pole U=0. Free surfaces accumulate boundary-arc U from the first vertex of the declared starting boundary and shortest surface-distance V perpendicular to it, breaking at branches/sharp edges. One UV unit equals one surface meter. Opposite faces toward negative axes retain physical U direction, moving origins to matching corners, preventing mirrored left/right grain. Continue UVs on contiguous coplanar boards; break only at actual member cuts such as frames/jambs/casing/leaves/hinges/rails/rods/shelves/drawers/cushions/shades/shingle strips. Specific long-grain/roof-member axes/seams override only on the faces their H2 names. Include backs/bottoms/recesses/thickness faces; no face lacks UVs. Models coordinates deliver grain direction/physical scale; materials chooses repeats/optics.

Per-face precedence is explicit prototype axes/origin/seams first, common projection only where absent. Materials consumes these coordinates for repeats/optical responses.

## Reference scale and comparison dimensions {#model-reference-scale}
<!--
@evidence principles/core/common.md#scope-preservation Own common occupancy reference 0.60×0.45×1.90 m/door clear width 0.80 m and door/glass-width comparison arithmetic.
@evidence principles/core/common.md#substantive-completion Compare 90° jamb-face clear width to owner target and glass width after members, placing the occupancy body in the same view against leaf/sill heights.
@evidence principles/core/common.md#declared-basis Reference comes from settings/00-production.md#use-profile.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Convert occupancy/0.80 m targets into model-generation numeric clear/glass-width reporting.
@evidence principles/design/models.md#representation-contract Report clear/glass widths so consumers can compare occupancy.
@evidence principles/design/models.md#spatial-convention Dimensions derive from occupancy/owner targets rather than primitive defaults.
@evidence principles/design/models.md#reviewable-structure Same-view occupancy exposes scale mismatch among independent models.
@evidence principles/design/models.md#model-observable-style-basis References are not surveys; define observable occupancy-scale comparison without style.
@evidence principles/design/models.md#model-scale-layer-completion Common scale/door-window arithmetic refuse models missing scale relationships.
@evidence obligations/design/models.md#reference-scale Name use-profile occupancy as shared reference; verify other envelopes through clear/glass-width derivation.
@evidence settings/00-production.md#use-profile Consume occupancy 0.60×0.45×1.90 m/door width 0.80 m as shared reference/clear-width comparison.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consume dimensions/0.80 m target unchanged; no parent contradiction affects scale.
-->

References 01–05 are not dimensioned drawings. Technical rules come from settings/space reservations rather than photograph proportions; this preserves envelope/circulation ownership.

Common scale is [use/passage assumptions'](../settings/00-production.md#use-profile) body width 0.60/depth 0.45/height 1.90 m and door clear width ≥0.80 m. Every door derives 90° jamb-face clear width against its owner target; every window derives glazing width after member subtraction to test obstruction. Place the body in the same view against rough-opening/actual-leaf/sill heights to expose independent-model scale mismatch. Source `src/models/frame.ts`; report numeric clear/glass widths at generation.

## Representation ceiling and visible limits {#model-representation-ceiling}
<!--
@evidence principles/core/common.md#scope-preservation Define separate thick frames/sashes/muntins/glass/leaves/jambs/handles/hinges, no duplicate spaces front/rear thresholds and no weatherstrips/lock internals/springs/screws/double-glazing air gaps.
@evidence principles/core/common.md#substantive-completion Prohibit rectangular holes/single-plane substitutes and list unsupported insulation/waterproofing/airtightness/load/structural/code inferences, without each H2 reinventing limits.
@evidence principles/core/common.md#declared-basis Receive settings fidelity's prohibition on reducing expression to blocking/topology success.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Turn capture-readable windows/leaves into separate thick members and explicitly omitted internal mechanisms.
@evidence principles/design/models.md#representation-contract Proxy has thick separate members/no internals; unsupported observations are stated.
@evidence principles/design/models.md#spatial-convention No new coordinates; retain model-local-frame conventions.
@evidence principles/design/models.md#reviewable-structure Model-review side orthographic sections falsify single-plane substitutes.
@evidence principles/design/models.md#model-observable-style-basis Observable thickness/separate members replace style labels without optical/light verdicts.
@evidence principles/design/models.md#model-scale-layer-completion Explicit existing/absent layers prevent invented implementation layers.
@evidence obligations/design/models.md#representation-ceiling Define population ceiling/unsupported insulation/waterproofing/airtightness/load/structural/code claims.
@evidence settings/20-verification.md#fidelity Consume capture-readable windows/leaves/not merely blocking as a separate-thick-member list.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consume fidelity unchanged; ceiling contradicts no parent value requiring repair.
-->

References 01–05 are not dimensioned drawings. Technical rules come from settings/space reservations rather than photograph proportions, retaining envelope/circulation owners.

[Fidelity](../settings/20-verification.md#fidelity) requires actual window/leaf readability, without reducing it to blocking/topology success. Make frames/sashes/muntins/glass/leaves/jambs/handles/hinges separate thick members, never rectangular holes/single planes. Spaces already owns front/rear exterior thresholds; duplicate none. Omit weatherstrips, lock internals, springs, screws and double-glazing air gaps. Infer no insulation/waterproofing/airtightness/operating loads/structural safety/code compliance. Source `src/models/frame.ts`; each model H2 states its limits inside this ceiling.

## Surface partition naming {#model-surface-partition-naming}
<!--
@evidence principles/core/common.md#scope-preservation Own one role-indexed opening/furniture/fixture/repetition id list, one role per id and exterior/interior suffix rules.
@evidence principles/core/common.md#substantive-completion Distinguish interior-casing, wall-baseboard, stair-skirt, exterior-trim, casing-a/b and other roles. Assign one id to every closed-member triangle including cuts; exclude joint names from face ids.
@evidence principles/core/common.md#declared-basis Models supplies surface ids rather than color/optics/texture scale under settings surface-allocation.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Add role-based kebab-case ids/two-sided suffixes to geometry/material handoff.
@evidence principles/design/models.md#representation-contract Stable exterior/interior surfaces distinguish adjacent responses; provide common ids.
@evidence principles/design/models.md#spatial-convention Naming introduces no positions; assigns roles to each prototype's closed fronts/backs/cuts.
@evidence principles/design/models.md#reviewable-structure Different ids for one role or one id for two roles misalign binding boundaries and falsify naming.
@evidence principles/design/models.md#model-observable-style-basis Materials retains charcoal/white colors; models owns member-role boundaries.
@evidence principles/design/models.md#model-scale-layer-completion Shared surface-interface names prevent missing surface layers.
@evidence obligations/design/models.md#addressable-model-decisions Independently address common roles/suffixes/cut-end allocation; compare actual bindings with ids emitted by each H2.
@evidence settings/20-verification.md#surface-allocation Consume boundaries into thick members/stable ids, finished by materials under the same binding.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consume surface-allocation unchanged; id list needed no parent revision.
@evidence obligations/core/common.md#production-language Use English kebab-case ids and English role explanations/body, retaining explicit role glosses rather than making readers guess terminology.
-->

References 01–05 are not dimensioned drawings. Technical rules come from settings/space reservations rather than photograph proportions, preserving envelope/circulation ownership.

Under [surface handoff](../settings/20-verification.md#surface-allocation), models supplies stable ids for materials rather than colors/optics/texture scale. Ids are role-based kebab-case, unique within each model and shared across models for identical roles. Common opening ids are `frame`(window frame), `sash`(moving/fixed glazing frame), `mullion`(inter-unit vertical), `muntin`(glazing bar), `glass`(clear glass), `appliance-glass`(opaque controls/oven-door glass), `obscured-glass`(obscured glazing), `exterior-trim`(outer trim), `interior-sill`(inner sill), `interior-casing`(white inner window casing), `leaf`(interior/appliance leaf body), `leaf-exterior`(weather broad face), `leaf-interior`(room broad face), `leaf-panel`(recessed panel/boards), `leaf-edge`(outer-leaf thickness), `panel-edge`(garage divisions/cuts), `gate-batten`(horizontal gate batten), `gutter`(eave collector), `downspout`(vertical drainage pipe), `jamb`(door jamb), `jamb-a`/`jamb-b`(A/B outer jamb faces), `jamb-core`(inner reveals), `casing`(interior casing), `casing-a`/`casing-b`(A/B casing), `handle`, `hinge`, `rail`(track), `baluster`, `bottom-rail`(lower guard), `rod`(clothes rod), `shelf`.

Furniture/fixture roles are body `carcass`(storage body), `plinth`(lower support), `drawer-front`, `countertop`, `top`, `cleat`(shelf support), `leg`, `post`, `apron`, `base`, `board`(wall plate), `hook`; seating `seat`, `toilet-seat`, `seat-cushion`, `back`, `arm`, `footrest`; equipment `appliance-body`, `appliance-interior`, `control-panel`, `cooktop`, `burner`, `basin`(washbasin/sink), `ceramic`, `faucet`, `lid`, `shower-tray`, `mirror`; bedding `bed-frame`, `headboard`, `mattress`, `bedding`, `pillow`; textile/prop `towel`, `curtain`, `clothes`(hanging), `folded`, `field`, `border`, `book`, `pencil`, `container`, `box`(wood grocery box), `basket`, `bin`, `shoe`, `shoe-box`, `lamp-base`, `lamp-shade`, `tool-steel`, `tool-grip`, `door-ring`(washer metal ring), `drum`(stationary cylinder behind washer door), `mirror-frame`; exterior repetition `siding-face`, `siding-butt`, `siding-back`, `siding-top`, `siding-cut`; roof `shingle-face`, `shingle-butt`, `shingle-back`, `shingle-cut`, `roof-flashing`(valley/chimney metal fronts/backs/cuts); attachment `bracket`, `accessory`; planting `bark`(trunk/branches), `foliage`, `stem`; lighting `fixture-housing`, `fixture-diffuser`, `fixture-canopy`, `fixture-stem`, `fixture-shade`, `fixture-glass`(porch glazing); household `cutting-board`, `utensil`, `bowl`, `fruit`, `tray`, `art-frame`(rim/back), `art-print`; fireplace `firebox`, `firebox-trim`, `mantel`.

Each id has one role; do not invent new ids for the same role. Split different inner/outer finishes with -exterior/-interior. Every triangle, including front/back/sides/top/bottom/cuts, receives exactly one id. Pivots/sliding nodes are not face ids. [Spaces threshold owner](../spaces/10-ground-floor.md#ground-threshold-junctions) retains exterior plates without models duplication. Source `src/models/frame.ts`; compare material bindings with actual H2 ids. The recorded building review compared 900 prototypes/922 placements using same-camera material/face-ID views. Separate unbuilt object-draft bindings without source/captures remain unverified.

Independent room-wall baseboards use `wall-baseboard` for all closed wood/MDF board faces. Separate white inclined stair side/landing plates use `stair-skirt`, distinct from structural treads/risers. These differ from furniture plinth; recreate no wall finish as wall-baseboard.

Compare same-camera [model-review](#model-review-set) face-ID/material pairs for one-role/many-id or many-role/one-id errors. One id covers each actual complete face; create no geometry-free substitute face for binding.

## Representation completion by prototype family {#model-representation-completion}
<!--
@evidence principles/core/common.md#scope-preservation Report structural/semantic verdicts separately for windows/exterior doors/interior doors/guards/storage/furniture-fixtures/planting/lighting/props. Envelope/built-in/fixed-room-boundary fixtures enter strict review by physical role, not file number.
@evidence principles/core/common.md#substantive-completion Structural checks concern closed volumes/outward normals/finite coordinates/ids/joints; semantic checks reservation arithmetic/limits/captures, separating building sources from unplaced objects.
@evidence principles/core/common.md#declared-basis Semantic criteria come from reservation-fit and model-review-set.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Divide common completion into nine house families, separating current H2 reservation arithmetic from subsequent source structure/capture review.
@evidence principles/design/models.md#representation-contract Specify volume/normal/id/node requirements per family's structural result.
@evidence principles/design/models.md#spatial-convention Introduce no coordinates; inspect each family's conventions.
@evidence principles/design/models.md#reviewable-structure Semantic review includes capture addresses, refusing uncaptured family completion.
@evidence principles/design/models.md#model-observable-style-basis Make no new style verdict; ask whether each family's observable decisions are answered.
@evidence principles/design/models.md#model-scale-layer-completion Structurally valid families missing scale/layers/boundaries/observations fail semantic review.
@evidence obligations/design/models.md#model-representation-completion Separate family structural/semantic reports; neither entails the other.
@evidence settings/20-verification.md#fidelity The recorded 900 building-prototype review judges readability from real directional/maximum-pose captures and original-face structure. Object drafts without meshes/captures retain unverified structure/readability.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consume reservation-fit/fidelity unchanged; completion-report form needed no parent revision.
@evidence obligations/core/common.md#purpose-fit Separate structure/meaning per nine families, refusing actual-source fit claims from document arithmetic alone.
@evidence obligations/core/common.md#proportionate-development Shared structural/semantic reporting exposes families compressed without arithmetic or inflated without source.
-->

References 01–05 are not dimensioned drawings. Technical rules come from settings/space reservations rather than photograph proportions, preserving envelope/circulation ownership.

Strict building-member review covers all 01–06 windows/doors/stairs/storage/interior trim, and 10–19 continuous exterior wall/roof envelopes/trim, built-in bodies filling floor/wall/opening reservations to form storage boundaries, and fixtures directly forming fixed room partitions. Those H2s declare `Building classification: envelope`, `built-in` or `fixture`. Sink island belongs to fixtures because sink/counter/body form one reservation-bound partition. Individual appliances/ceramics/hooks/mirrors/lights with only utility connections/wall attachment do not form room boundaries; inspect approximate shape/visible contacts. Movable furnishings/bowls/textiles/plants require no strict per-face dimensional witnesses.

Report two verdicts per family. Structure asks whether src/models meshes have closed volumes/outward normals/finite coordinates/declared ids/joint nodes. Meaning asks whether [reservation arithmetic](../contracts/reservation-fit.md#reservation-fit), declared limits and [captures](#model-review-set) are answered. Neither implies the other. Families: [windows](01-windows.md), [exterior doors/gate](02-exterior-doors.md), [interior doors](03-interior-doors.md), [guards](04-stair-members.md), [storage](05-closet-fittings.md)/[baseboards](06-interior-trim.md), [furniture/fixtures](10-kitchen-dining.md)–[outdoor](15-outdoor.md), [planting](16-planting.md), [lighting](17-light-fixtures.md), [household props](18-house-props.md)–[accents](19-room-accents.md). Recorded building input comprised 900 source prototypes/922 placements, including windows/doors/guards/storage/trim/envelopes/built-ins/fixed fixtures. Building completion does not complete unplaced individual furniture/planting/prop drafts. [Reservation account](../accounts/models/reservation-fit.md#model-reservation-fit) enumerates H2 arithmetic; report source structure/capture meanings separately. Source existence/structural success never turns unfinished captures into verified. Source `src/models/frame.ts`.

## Model-review view set {#model-review-set}
<!--
@evidence principles/core/common.md#scope-preservation Own fixed front orthographic/side orthographic section/45° oblique perspectives for all models and reference/maximum-open obliques for articulated models.
@evidence principles/core/common.md#substantive-completion Define canvas1536×1024/DPR1/neutral background/FOV45°/eye1.6 m/body reference, without implementation choosing regression conditions.
@evidence principles/core/common.md#declared-basis Frame conditions come from settings frame-condition/body from use-profile.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Convert exterior/interior frame defaults into fixed model-level views/two articulation states.
@evidence principles/design/models.md#representation-contract Define observable occupancy/articulation states limiting proxy claims.
@evidence principles/design/models.md#spatial-convention Oblique FOV45°/eye1.6 m use degrees/meters.
@evidence principles/design/models.md#reviewable-structure Front exposes silhouette, side section depth, reference/maximum perspectives articulation.
@evidence principles/design/models.md#model-observable-style-basis References are not surveys; neutral background removes shot-light/composition effects to compare model construction.
@evidence principles/design/models.md#model-scale-layer-completion All views include occupancy comparison, refusing scaleless review.
@evidence obligations/design/models.md#model-review-set Define finite neutral views/background/scale references for revision regression.
@evidence settings/20-verification.md#frame-condition Consume canvas1536×1024/DPR1/neutral/FOV45°/eye1.6 m as model-review conditions.
@evidence settings/00-production.md#use-profile Use the same occupancy body in every model view.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consume frame-condition/use-profile unchanged; view set needed no parent revision.
@evidence spaces/04-observations.md#spatial-observation-derivation Whole-house observations own actual placement review independently of model views.
-->

References 01–05 are not dimensioned drawings. Technical rules come from settings/space reservations rather than photograph proportions, preserving envelope/circulation ownership.

Use [frame conditions](../settings/20-verification.md#frame-condition) canvas1536×1024/DPR1/neutral background. Per model capture front orthographic, side orthographic section, 45° oblique(vertical FOV45°/eye1.6 m), and identical obliques at reference/maximum articulation. Include [occupancy body](../settings/00-production.md#use-profile) for scale. This fixed revision-comparison set is independent of shot composition; [whole observations](../spaces/04-observations.md#spatial-observation-derivation) own house placement. Source `src/models/frame.ts`. The recorded review read native GPU originals for three directions/allowed maxima of 900 building prototypes, separating changed geometry/camera sets with derived Frame comparisons and opening new originals for changed material. Do not extend that record to unbuilt furniture/planting/prop drafts.

Record same-camera/pose face-ID overlays in distinct flat colors paired with declared material bindings. First falsifies face duplication/omission; second binding leakage. Colors identify faces, not material choices, and change no original positions/UVs. Recorded building pairs correspond among muntins/glass, leaves/casing/metal, shelves/rods, sanitary bodies/taps and exterior boards/cuts. Neutral-side cap colors identify original-face intersections rather than actual material. Uncaptured object-draft pairs remain unverified.

Neutral orthographic cameras aim at the height midpoint of whichever is taller, model or body1.90 m, leaving 20% vertical margin, including below floor0 to avoid clipping undersides/feet at raster ends. Close side X=0 sections only from actual original-triangle intersection loops, preserving holes. Merge material-separated open patches only when actual shared boundaries and producer-collected member ids agree. Closed solids/distinct members stay separate even when touching; inspection views disable repetition draw batching. Inspection caps change no original mesh/UV/placement volume. sectionSourceFaces lists actual contributing face ids; cap color takes first patch's inspection color, without becoming an authored-cut material verdict. Sources `src/viewer/sectionCaps.ts`; member ids `src/instances/exterior-repetition-geometry.ts`.

Native inspection inputs are pose=closed/pose=maximum, endpoints already allowed by window/exterior/interior/closet/shower builders; doorless fixed prototypes are identical. Current locked toilet-lid profile also has reference state as allowed maximum. Same origin/camera/palette uses union of both actual member bounds, preventing opening-based zoom/scale change. Obliques retain eye1.6 m/FOV45°, increasing only distance until actual model/body projected vertices fit 10% screen margins. Ordinary house inputs keep reference states; inspection maxima are not delivery states. Sources `src/viewer/buildingInputs.cts`/instance producers.

Moving both coat/linen/bedroom sliding leaves to opposite maxima exchanges them and recloses the opening. Inspect front-only maximum as pose=maximum and rear-only as pose=maximum-opposite, keeping the other at closed0. Preserve each articulation endpoint without incorrectly combining both observations as open. Retain the initial simultaneous-maximum capture failure; this correction changes no prototype geometry/allowed travel/ordinary-house closed state.
