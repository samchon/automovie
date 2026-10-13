# Temple architectural-member placement

Place [reviewed prototypes](../models/columns.md) in the once-assembled plan, roofs, and openings. This document owns independent architectural-member counts/transforms; parents own envelope solids, prototype geometry, and material properties. Derive IDs from roles/datum names, never randomness, cameras, or generation order. Placements failing prototype dimensional contact or blocking passage openings fail.

## Colonnade and porch columns/beams {#columns-beams}

<!--
@evidence principles/core/common.md#declared-basis Uses court/ring datums and column/beam capital-bottom faces, adding four north/south axes and three internal east/west axes here.
@evidence principles/core/common.md#scope-preservation Addresses 14 colonnade columns, two porch columns, four side beams, and porch beam while preserving central entrance/sanctuary passage axes.
@evidence principles/core/common.md#substantive-completion Fixes shared corners, slope-specific prototypes, side beam rotations, capital/beam contact, and access-axis gaps numerically and through counterexample positions.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Court boundaries and column heights alone do not determine 14 axes or east 19° membership; this unit defines offsets, shared corners, and prototype membership.
@evidence principles/design/instances.md#instance-prototype-boundary Uses only columns.md's 12°/19° colonnade and separate porch prototypes, without individual scaling.
@evidence principles/design/instances.md#instance-derivation-authority Axes stand 0.175m from court boundaries; four corners/intermediate axes derive from shared datums and spacing.
@evidence principles/design/instances.md#instance-verification-address Separately tests central gaps between four north/south columns and beam contact of three intermediate east 19° columns.
@evidence obligations/design/instances.md#addressable-instance-decisions This H2 singly owns column/beam counts, axes, and contact heights.
@evidence obligations/design/instances.md#instance-prototype-membership 12° columns occupy four north/four south and three west intermediate axes; 19° columns occupy three east intermediate axes; porch columns occupy two axes.
@evidence obligations/design/instances.md#instance-identity-transform Column IDs derive from colonnade/side/axis and beam IDs from sides; scale is 1 with rotation 0 or 90°.
@evidence obligations/design/instances.md#instance-variation-tiers Allows only roof-dependent 12°/19° prototypes without simplification tiers or density switches.
@evidence obligations/design/instances.md#instance-placement-review Reads capital-top/beam-bottom contact beneath north/south beam ends and east beam center, plus main/sanctuary usable widths.
@evidence models/columns.md#colonnade-column Uses the 0.34m bases and 12°/19° height prototypes unchanged.
@evidence models/columns.md#porch-column Places two porch prototypes at X=±1.35m with porch beam above 3.20m capitals.
@evidence models/entablature.md#colonnade-beam Places four side variants and east end steps above respective columns.
@evidence models/entablature.md#porch-entablature Places one horizontal beam on two porch columns, checking prototype top contact supporting the small gable.
@evidence spaces/building.md#plan-datums Uses court/ring/porch lines as sole axis/center inputs.
@evidence spaces/rooms/colonnade.md#ring-volume Keeps columns outside actual usable widths and both central door axes on all four sides.
@evidence spaces/rooms/entrance.md#entrance-volume Two recessed porch columns flank the main sightline and support the gable beam.
@evidence settings/20-envelope.md#colonnade Realizes continuous stone columns/timber beams through 14 columns and four beams' floor-to-capital contacts.
@evidence settings/20-envelope.md#entrance-porch Two columns/one beam join beneath the small gable without blocking entrance frontage.
@evidence settings/10-building.md#use-profile Keeps column positions outside central access axes for walking/carrying envelopes.
@evidence materials/00-surface-palette.md#stone Retains light stone across porch/colonnade bases and shafts and all entablature.porch parts, including the horizontal porch beam.
@evidence materials/00-surface-palette.md#timber Repeats the four colonnade side beams as dark timber, separately from the limestone porch entablature.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work Compared prototype heights/base widths and court/ring datums; north/south access and east step contacts fit existing parent dimensions.
-->

Use axes 0.175m outward from courtyard boundaries X=±3.5m, Z=−1.75/6.10m. North/south each have four columns at X=−3.675, −1.225, 1.225, 3.675m. East/west share corner columns and evenly divide only three interior axes, totaling 14. North/south/west and all corners use 12° prototypes; east intermediates use 19°. Align each beam's local X length with its side, touching its underside to the corresponding slope prototype's capital top. Porch axes are X=±1.35m, Z=10.00m, supporting the 3.30m beam underside Y=3.20m. Keep main/sanctuary central axes empty. Repeated IDs include side/axis coordinates. All use one detailed tier without individual arbitrary scales or seeds.

## Doors and clerestories {#openings}

<!--
@evidence principles/core/common.md#declared-basis Derives frames/leaves from spaces/openings passage centers, wallLow/High, swings, clerestory profiles/sills, and width/thickness prototypes.
@evidence principles/core/common.md#scope-preservation Places frames/leaves at eight passages and host-thickness frames at eight clerestories, including two double and six single doors.
@evidence principles/core/common.md#substantive-completion Defines wall-axis rotation, bilateral/swing-side hinges, 90° open state, and sill−frame origins for reproducible transforms.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Spaces/models own holes/dimensions; this unit adds actual frame/leaf counts, hinge-side transforms, and open passage state.
@evidence principles/design/instances.md#instance-prototype-boundary Uses only passage-specific frames/leaves and host-thickness clerestory variants, adding no width or glass.
@evidence principles/design/instances.md#instance-derivation-authority Centers derive from passages and wallLow/High midpoint; windows from profile center/sill.
@evidence principles/design/instances.md#instance-verification-address Tests both hinges at main/sanctuary double doors, exterior service opening direction, and eight north/south/east/west windows.
@evidence obligations/design/instances.md#instance-prototype-membership Each passage has one frame and one or two leaves; eight windows share two thickness variants.
@evidence obligations/design/instances.md#instance-identity-transform Uses opening ID/leaf side with host-axis rotations 0 or 90°.
@evidence obligations/design/instances.md#instance-variation-tiers Opens closed prototypes 90° about actual hinges as the default, without arbitrary LOD or new leaves.
@evidence obligations/design/instances.md#instance-placement-review Reads floor/void agreement at thresholds and opposite views for leaves disappearing inside walls.
@evidence models/openings.md#door-frame Binds width/height/wall-thickness frame prototypes to the same passages.
@evidence models/openings.md#double-door-leaf Gives main/sanctuary doors two half leaves at opposite hinges.
@evidence models/openings.md#single-door-leaf Gives six room/service doors one width-specific leaf each.
@evidence models/openings.md#window-frame Retains 0.30/0.60m hosts and empty 0.4m windows.
@evidence spaces/openings.md#doors Reads center, axis, wallLow/High, and swing directly from passages.
@evidence spaces/openings.md#clerestories Reads each boundary, sill, and profile directly.
@evidence spaces/storey.md#threshold-support Fits frame/open-leaf origins to finished passage floors without blocking actual thresholds.
@evidence spaces/openings.md#boundary-ownership Attaches frames only to existing passage/window hosts without new holes.
@evidence settings/20-envelope.md#openings Places two double/six single doors open and eight high empty frames.
@evidence materials/00-surface-palette.md#timber Keeps open leaves at eight passages visually distinct from walls.
@evidence materials/00-surface-palette.md#stone Extends stone frames through actual opening depth.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work Existing eight passage widths/swings and eight window heights/thicknesses accommodate placement without new holes/prototype dimensions.
-->

Center frames in wall depth and align local X with wall length. Place two half leaves at bilateral double-door hinges, one leaf at each remaining swing-side hinge. Closed prototype hinge positions are local (X=0.021m,Z=0) for double leaves and (X=0,Z=0.031m) for singles. Attach these points to actual threshold hinges and rotate placements 90°. Doubles open together toward +Z at entrance and −Z at sanctuary; singles toward −X at offering/exterior service and +X at other east rooms/yard. Subtract rotated hinge coordinates to determine placement origins rather than mistaking prototype origin for hinge. From passage front/room views, open leaves must neither penetrate walls nor block widths. Windows use profile center and `sill−frame` height facing exterior. Repeated IDs preserve original opening IDs.

## Roof tiles and timber structure {#roof-members}

<!--
@evidence principles/core/common.md#declared-basis Uses composed patch planes and 0.40×0.52m tiles/0.44m row pitch to define one world grid across pieces.
@evidence principles/core/common.md#scope-preservation Separately includes actual tiles on all patches, slope-specific ridges, rafters on four sides, two sanctuary trusses, and low-room joist repeats.
@evidence principles/core/common.md#substantive-completion Defines tile axes/normal/slab contact/two pitches/boundary checks, two truss Z axes, and rafter/joist intervals.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Models own individual sections and spaces patches/rooms; this unit adds shared grids and member entry/stop/repetition rules.
@evidence principles/design/instances.md#instance-prototype-boundary Repeats tile.roof, slope ridges, and individual rafters/trusses/joists without revising roofs/sections.
@evidence principles/design/instances.md#instance-derivation-authority Derives rows/columns from patch planes/slopes/boundaries, preserving one world grid across changed subdivision order.
@evidence principles/design/instances.md#instance-verification-address Uses east/west valleys, sanctuary/porch ridge contacts, and one eave's open semicircle as worst samples.
@evidence obligations/design/instances.md#instance-prototype-membership Uses whole tiles and boundary-cut same-lineage variants on one grid, with separate truss/joist sets.
@evidence obligations/design/instances.md#instance-identity-transform Tile IDs use patch/world U/V; truss IDs use two Z coordinates.
@evidence obligations/design/instances.md#instance-variation-tiers Fixes 0.40m width/0.44m slope pitch, selects actual host-half-space cuts from models/cladding.md, and retains unit-scale placement with silhouette variation inside model lineage.
@evidence obligations/design/instances.md#instance-placement-review Reads tile-bottom/roof-top contact, valley/eave/ridge gaps, and two trusses/four low-room joists in overview/upward interior views.
@evidence models/cladding.md#roof-tile Rotates 0.40m tegula/imbrex modules to roof slopes.
@evidence models/cladding.md#ridge-tile Chooses 19°/22° variants from actual gable slopes.
@evidence models/entablature.md#rafter Repeats four-side rafters every 0.50m, checking roof underside/beam contact.
@evidence models/entablature.md#sanctuary-truss Places local ties at sanctuary Z=−8.30/−5.50m.
@evidence models/entablature.md#ceiling-joist Places X-direction joists every 0.60m in four low-ceiling rooms.
@evidence spaces/roofs/assembly.md#roof-junctions Uses composed patch planes/thickness/boundaries as sole contact inputs.
@evidence spaces/roofs/colonnade.md#north-canopy Stops actual grid at north eaves/valleys and joins underside rafters to beams.
@evidence spaces/roofs/colonnade.md#south-canopy Checks whole-tile occupancy and eave-rafter contact at porch/parapet boundaries.
@evidence spaces/roofs/west.md#west-roof Tests whole-member highest points against coping underside at the high west termination.
@evidence spaces/roofs/east.md#east-roof Places tiles/19° ridges on both east slopes and checks both valleys.
@evidence spaces/roofs/sanctuary.md#sanctuary-roof Covers both 22° slopes/ridge while retaining two visible trusses beneath floating eaves.
@evidence spaces/roofs/porch.md#porch-roof Covers actual 22° planes without empty small ridge/front eaves.
@evidence spaces/junctions.md#plinth-coping Compares full tile tops to coping underside 4.69m and stops whole units that cannot clear the high west end.
@evidence spaces/junctions.md#gable-closures Checks ridge/tile boundaries against actual sanctuary/porch/east gable closures.
@evidence settings/20-envelope.md#roof-form Transforms the same tile prototype across 12° monopitches, 19° east, and 22° sanctuary/porch groups.
@evidence settings/20-envelope.md#ceilings Repeats visible sanctuary trusses, low-room joists, and colonnade rafters beneath roofs.
@evidence materials/00-surface-palette.md#roof-tile Checks red material on actual tegula/imbrex at valleys/eaves.
@evidence materials/00-surface-palette.md#timber Retains visible timber faces while repeating rafters/trusses/joists.
@evidence upstream/design/instances.md#parent-revision-from-instance-work Tile/slope datums and timber sections fit without new room heights. Direct rendering exposed gaps from skipped whole valley tiles, prompting actual boundary-cut variants/ridge-bearing intervals in models/cladding.md first.
-->

Coplanar patches share one world tile grid. Local +Z points upslope and +Y follows the roof normal; bottoms contact `upper`. Flat width is 0.40m, full X occupancy including imbrex −0.20~+0.285m, and slope length 0.52m. Lateral pitch 0.40m and upslope pitch 0.44m give 0.08m overlap; horizontal world pitch multiplies slope pitch by cos(slope angle). Reuse prototypes where full occupancy fits the composed plane; otherwise select variants cut by actual boundary half-spaces. Variant IDs use plane group/U/V/piece number. Retain partial valley/eave tiles so broad empty substrate strips do not appear. In the final 0.16m before three gable ridges, continue only flat tiles to support cover feet. Cut every high-west member at world Y≤4.68m, 0.01m below coping underside 4.69m. Red roof substrate is not tile geometry. Sanctuary trusses use Z=−8.30/−5.50m; room joists repeat at 0.60m across each Z interval. Dedicated eave rafters repeat at 0.50m along all four colonnade sides, with actual underside/beam contact.

## Courtyard fountain and building review {#fountain-review}

<!--
@evidence principles/core/common.md#declared-basis Uses courtBack/courtFront, courtyard finished floor, and one stationary fixture.fountain for center height/ID.
@evidence principles/core/common.md#scope-preservation Includes one courtyard fountain and all-building fixed views 01~05 for column/door/roof/timber/material contacts and occlusion.
@evidence principles/core/common.md#substantive-completion Fixes arithmetic center, floor contact, one ID, and central walking contact, testing disconnected/penetrating members per view.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds midpoint placement ID/floor transform and full-building samples to parent open courtyard/single basin.
@evidence principles/design/instances.md#instance-prototype-boundary Places only fixture.fountain, changing neither basin nor jet in placement.
@evidence principles/design/instances.md#instance-derivation-authority Center is X=0 and midpoint courtBack/courtFront Z; height comes from courtyard floor.
@evidence principles/design/instances.md#instance-verification-address Sanctuary-door axis tests one basin/open access; courtyard diagonals test basin/paving contact and water/stone boundaries.
@evidence obligations/design/instances.md#instance-prototype-membership Exactly one courtyard fountain, with no room/yard copies.
@evidence obligations/design/instances.md#instance-identity-transform Uses element.building.fountain, floor origin, and identity rotation.
@evidence obligations/design/instances.md#instance-variation-tiers Uses one stationary jet state without dynamic deformation/replacement tiers.
@evidence obligations/design/instances.md#instance-placement-review Reads exterior 01, cutaway 02, courtyard 03, sanctuary 04, and administrative colonnade 05 at fixed daylight/1600×1000 for all member contacts/occlusion.
@evidence models/fixtures.md#fountain Retains seven basin/water/jet parts as one stationary prototype.
@evidence spaces/rooms/courtyard.md#court-volume Uses floor, open sky, and single-fountain position.
@evidence settings/30-interiors.md#fountain Fixes one low basin at the arithmetic center of four colonnade sides with approach clearance.
@evidence settings/30-interiors.md#services Keeps water/one jet fixed without new dynamic deformation.
@evidence materials/00-surface-palette.md#water Observes fixed water/jet separately from basin stone.
@evidence materials/00-surface-palette.md#stone Reads light rim stone/paving contact separately from water in diagonal views.
@evidence materials/00-surface-palette.md#paving Seats the basin on cut-stone paving without burial or floating.
@evidence settings/00-delivery.md#review-condition Five fixed 1600×1000 views test colonnade/door/roof/fountain contact and occlusion.
@evidence settings/00-delivery.md#coordinates Uses parent metre/Y-up/south +Z coordinates and rotates model-local axes accordingly.
@evidence settings/00-delivery.md#coverage-map Delivers spatial retention, architecture, and exterior-object sets separately; prop instances remain another unfinished set.
@evidence settings/00-delivery.md#build-scope Assembles surfaces/architecture/neighbors/vegetation from parent models/spaces.
@evidence settings/00-delivery.md#delivery-scope Assembles one reusable fixed temple library without film or people.
@evidence settings/00-delivery.md#governing-aim Preserves main/courtyard/sanctuary axis and direct colonnade rooms as actual staged space.
@evidence settings/00-delivery.md#working-language Uses English placement documents with exact model/space/member IDs.
@evidence settings/40-environment.md#daylight Compares views/contacts at one fixed daylight/exposure without emissive planes or weather states.
@evidence settings/50-production.md#references Adds image 01~05 role comparisons to all observations without claiming photographic surveying.
@evidence settings/50-production.md#runtime-boundary Passes one CommonJS producer/public-lowering result without ESM/shared-package bypasses.
@evidence settings/50-production.md#fidelity Tests architectural joins/room legibility with actual geometry/materials without demanding fine sculpture for individual props.
@evidence settings/50-production.md#gpu-observation Reads actual AMD renderer and independent cube/temple pixels together, rather than requested flags.
@evidence settings/50-production.md#measurement-truth Distinguishes normal, white-screen failure, old-source captures, and unsupported questions; measures current compiled output.
@evidence settings/50-production.md#acceptance The 2026-09-28 resumption authorized sole-author full-render self-judgment/evidence termination, without completion claims while visual/checking work remains.
@evidence settings/50-production.md#execution-authority That resumption permitted viewer/check continuation in pipes/hidden children inside production, with shared packages/dependencies frozen.
@evidence settings/50-production.md#author-commits That resumption continued feat/benchmark-one-hour-completion/Draft PR2627, coordinating explicit-path production commits/pushes with supervisor/index order.
@evidence spaces/observations.md#geometry-observations Reads current derived centers/corners/thresholds, exposed facades/corners/roofs/undersides/exterior access/joins rather than five references alone.
@evidence spaces/observations.md#viewer-path Distinguishes inspection cutaway from delivery beauty, reading actual members/rooms from the same output/lens/1600×1000 raster.
@evidence obligations/core/common.md#purpose-fit Building.md owns architecture, envelope.md retained solids, and site.md exterior counts/transforms; removing any removes its membership/contact judgment.
@evidence obligations/core/common.md#layer-boundary These documents own membership/IDs/transforms/tiers/placement judgment, retaining prototype geometry/spatial boundaries/material recipes in parents.
@evidence obligations/core/common.md#production-language Explains positions/contacts/extents in English while preserving exact code IDs/metre values.
@evidence obligations/core/common.md#proportionate-development Gives actual tile repetition/open doors/column-beam contacts separate detailed H2s from retained shell/small grass, without letting one fountain paragraph stand for all 430m² membership; declared prop parents remain included but their complete judgment is separate.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work Basin radius fits central paving/access axes without blocking passage or requiring parent relocation.
-->

Fountain origin is X=0, Z=(courtBack+courtFront)/2, Y=courtyard floor. Place only this basin without repetition; inspect central walking contact and water/stone surfaces frontally/diagonally. Building review includes image 01~05 roles, recording disconnected or penetrating material bindings, actual tiles, open-door passages, capitals/beams, and underside timber per view.

Assembly comprises this file's independent architecture, envelope.md's full original rooms/circulation/envelope/site retention, and site.md's exterior objects. One detailed tier uses metre/Y-up/south +Z coordinates. Current environment derives all centers/corners/thresholds/facades/outer corners/roofs/undersides/exterior access/joins; five references are supplemental. Inspection cutaways do not replace delivery beauty. English placement prose preserves exact IDs while parents retain geometry, boundaries, and recipes. Preserve declared prop-parent H2s and citations.

The 2026-09-28 handoff superseded its earlier settings' independent reviewer, old branch, and stopping assignments for that resumption: the sole author read actual renders, self-judged/repaired, and terminated with evidence. It required pipes/hidden children without new windows and production/CommonJS/shared-package boundaries. Actual GPU proof used renderer plus independent cube pixels. White screens, stale source, and unsupported questions remained separate from normal renders. Its verified explicit production paths were committed/pushed after index coordination to that branch/PR2627. These execution/Git facts do not establish geometry completion and do not replace the current issue's instructions.
