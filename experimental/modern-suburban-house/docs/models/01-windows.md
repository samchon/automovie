# Exterior window filling members

## Window envelope and depth within the wall {#window-local-frame}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns the scope in which each of 12 exterior windows fills one rough opening, matches its envelope and uses wall depth Z = -0.04 to -0.18 m.
@evidence principles/core/common.md#substantive-completion It fixes frame envelope = rough opening, no shims, outer face Z = -0.04 m and inner face Z = -0.18 m, leaving no wall-depth choice to implementation.
@evidence principles/core/common.md#declared-basis Recess 0.04 m/depth 0.14 m come from spaces/06-openings.md#external-opening-interface; coordinates come from 00-model-frame.md#model-local-frame.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It turns the common exterior-opening handoff's 0.04 m weather-face recess and 0.14 m depth into frame faces at local Z=[−0.18,−0.04] m.
@evidence principles/design/models.md#representation-contract Prototype occupancy is rough-opening envelope × depth 0.14 m.
@evidence principles/design/models.md#spatial-convention The exterior weather face is the origin plane; both frame faces have local Z values.
@evidence principles/design/models.md#reviewable-structure Each room's inner reveal section can falsify frame adherence to 0.04 m recess/0.14 m depth.
@evidence principles/design/models.md#model-observable-style-basis Adopt reference 01's black window depth inside the white exterior; use reference 02's cutaway windows only to locate openings. The observable decision is recessed frame depth, without a style label.
@evidence principles/design/models.md#model-scale-layer-completion It locates windows within wall thickness, preventing omission of depth as a board stuck to the wall.
@evidence spaces/06-openings.md#external-opening-interface Consume 0.04 m recess/0.14 m depth as frame outer/inner Z = -0.04/-0.18 m.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consume 06's 0.04/0.14 m reservation and all four elevation owners' openings unchanged; no parent defect affects window envelope selection.
-->

Adopt reference 01's depth of black windows inside white exterior walls; reference 02's cutaway windows serve only opening-location review. Depth follows wall reservations rather than photographic measurement.

Every exterior window uses the [common local frame](00-model-frame.md#model-local-frame), with exterior weather face as origin plane. One model fills one rough rectangular opening from the [common opening handoff](../spaces/06-openings.md#external-opening-interface), receiving coordinates/unit count from four elevation owners. Frame outer width/height match the rough opening. Blocking-level gap shims are omitted under the [representation ceiling](00-model-frame.md#model-representation-ceiling). `frame` outer face is local Z = -0.04 m and inner face Z = -0.18 m, consuming 06's 0.04 m recess/0.14 m depth unchanged. Source owner is `src/models/windows.ts`; inspect each room's inner reveal section.

## Frame, sash, mullion and muntin dimensions {#window-member-sizes}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns member widths frame 0.06/sash 0.05/mullion 0.08/muntin 0.025 m, unit-width formula, depth allocation and glazing normals/UVs.
@evidence principles/core/common.md#substantive-completion Unit width = (rough width − 2×0.06 − (unit count−1)×0.08)/unit count, with refusal below 0.30 m; stair glass width is 0.56 m. Fix mullion X between units and Y/Z inside frame, fixed/hinged sash Z=[−0.13,−0.08] m/glass Z=[−0.113,−0.107] m, distinct sliding front/rear tracks and separate closed plates per glazing cell.
@evidence principles/core/common.md#declared-basis Member-width grounds are charcoal frames in settings/20-verification.md#visual-grammar, default exterior view in #frame-condition and stair-window width 0.78 m.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Turn settings openings' thick frame/sash/glass/muntins into four member widths and glass thickness 0.006 m as model decisions.
@evidence principles/design/models.md#representation-contract Members have width/depth; glazing is a closed thin box with outward normals on both sides. Metal frames emit meter UVs with member length U.
@evidence principles/design/models.md#spatial-convention Width follows frontal elevation; depth is local Z.
@evidence principles/design/models.md#reviewable-structure Measure widths in frontal orthographic view; unit width below 0.30 m fails.
@evidence principles/design/models.md#model-observable-style-basis Adopt black borders common to reference 01's wide front and narrow stair windows. Widths 0.06/0.05 m realize visual-grammar's charcoal lines within white trim.
@evidence principles/design/models.md#model-scale-layer-completion Calculate scale relationships retaining glazing in the smallest window, preventing members from covering glass.
@evidence settings/20-verification.md#visual-grammar Distinction between deep-charcoal frames and white trim grounds frame 0.06/sash 0.05 m widths.
@evidence settings/20-verification.md#frame-condition Define frame/sash widths and frontal orthographic review so they read as distinct lines even in the default exterior view.
@evidence settings/10-house.md#openings Realize thick frame/sash/glass/muntins as explicit widths/depths and separate glazing plates.
@evidence spaces/envelope/front.md#stair-front-window Use width 0.78 m as the smallest window, deriving glass width 0.56 m.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consume visual-grammar/frame-condition and elevation unit counts unchanged; member widths do not conflict with parent values.
-->

Adopt black borders common to reference 01's wide front and narrow stair windows. Derive clear glazing widths arithmetically for each reservation.

Spaces/settings do not choose member widths, so choose frontal border widths `frame` 0.06 m, `sash` 0.05 m, inter-unit `mullion` 0.08 m and central `muntin` 0.025 m as model decisions. Grounds are [common material/envelope appearance](../settings/20-verification.md#visual-grammar), where deep charcoal frames must read as lines inside white trim, [review frame conditions](../settings/20-verification.md#frame-condition), where frame/sash must remain distinguishable in the default exterior view, and the calculation retaining 0.56 m glazing width in the smallest [stair window](../spaces/envelope/front.md#stair-front-window), width 0.78 m. Unit width is (rough width − 2 × 0.06 − (unit count − 1) × 0.08) / unit count; report failure below 0.30 m. Depth is full `frame` 0.14 m, `sash` 0.05 m and separate closed `glass` plates 0.006 m per transparent-grid cell. Each plate is a closed thin box with outward front/back normals, visible from interior/exterior views. Frames/sashes/muntins use planar face normals. For [charcoal microtexture](../materials/01-exterior.md#window-frame-charcoal), record meter-based length U/member-width V from each straight member's starting corner, breaking at contacts. Glazing front/back use horizontal U/vertical V in meters from each plate's lower-left. Source owner is `src/models/windows.ts`; measure member widths in frontal orthographic view.

With weather face local Z=0, fixed/tub-hinged `sash` occupies Z=[−0.13,−0.08] m and glass Z=[−0.113,−0.107] m. Sliding sashes have separate tracks: outer upper Z=[−0.10,−0.05] m, inner lower Z=[−0.17,−0.12] m. Each track's 0.006 m glass plate starts 0.017 m inward from its sash back: upper Z=[−0.083,−0.077], lower Z=[−0.153,−0.147] m. Glazing rectangles are the sash's clear inner width/height, with actual holes cleared in corresponding sash faces. Tub-window `awning-sash` upper pivot lies at its weather-side upper edge Z=−0.08 m.

For unit count n≥2, vertical `mullion` k=1…n−1 is a closed post. With rough-opening left l, bottom y0, height H and preceding unit width c, it occupies X=[l+0.06+k·c+(k−1)·0.08, l+0.06+k·c+k·0.08] m, Y=[y0+0.06,y0+H−0.06] m, Z=[−0.18,−0.04] m. Both ends meet perimeter `frame` inner ends only at faces; sash horizontal regions share no part of the 0.08 m thickness. At n=1 there are 0 mullions.

## Muntin grid {#window-muntin-grid}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns 2-column×2-row muntins for every transparent sash, no muntins on obscured bathroom glass, and attachment on both glazing faces.
@evidence principles/core/common.md#substantive-completion Attach one vertical/horizontal line in 0.01 m deep layers on both glazing faces, splitting horizontal bars at the crossing to avoid shared volume. Compare three sash-depth intervals and glass boundaries numerically.
@evidence principles/core/common.md#declared-basis Muntins come from settings/10-house.md#openings; hierarchy comes from spaces/envelope/front.md#front-openings.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Convert settings muntins into a common 2×2 grid per sash; hierarchy reads only from unit count/window size.
@evidence principles/design/models.md#representation-contract Muntins are separate bars on both glazing faces, connected without holes in glazing.
@evidence principles/design/models.md#spatial-convention Muntins follow sash-center vertical/horizontal lines.
@evidence principles/design/models.md#reviewable-structure Frontal elevation can falsify a common 2×2 grid on every transparent sash or absence of bathroom muntins.
@evidence principles/design/models.md#model-observable-style-basis Adopt transparent cells divided by black vertical/horizontal bars in references 01/04. Muntin patterns do not alter window hierarchy; materials owns color.
@evidence principles/design/models.md#model-scale-layer-completion Define muntin layers on glazing to prevent layer omission.
@evidence settings/10-house.md#openings Consume real exterior muntins as 2-column×2-row grids per transparent sash.
@evidence spaces/envelope/front.md#front-openings Read wide living/bedroom/small stair-window hierarchy from unit count/size rather than muntin pattern.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consume settings openings/front-openings hierarchy unchanged; the grid decision does not conflict with parents.
-->

Adopt transparent cells divided by reference 01/04's black vertical/horizontal muntins. Do not translate tiny photographic reflections into muntins or glazing texture.

[Settings openings](../settings/10-house.md#openings) requires muntins: every transparent sash has one central vertical and horizontal line forming 2 columns × 2 rows. Grid proportions repeat across the elevation so [front-elevation](../spaces/envelope/front.md#front-openings) hierarchy of wide/bedroom/small stair windows reads only from unit count/size, not muntin pattern. The obscured [tub window](../spaces/envelope/right.md#tub-right-window) has no muntins. `muntin` bars attach in 0.01 m deep layers on both glazing faces. For glazing local depth [g0,g1], weather layer is [g1,g1+0.01] and interior layer [g0−0.01,g0]. Each layer's vertical bar spans full glass height; the horizontal bar is two pieces ending on either side of it, avoiding duplicate crossing volume. Four glass plates occupy only rectangles remaining after muntin width 0.025 m, sharing contact faces only. Fixed layers Z=[−0.123,−0.113]·[−0.107,−0.097] m lie within sash [−0.13,−0.08]; sliding upper layers [−0.093,−0.083]·[−0.077,−0.067] m within sash [−0.10,−0.05]; lower [−0.163,−0.153]·[−0.147,−0.137] m within sash [−0.17,−0.12]. Layers/glass share no positive volume. Obscured bathroom glass has no muntins. Source owner is `src/models/windows.ts`.

Four central `glass` plates per sash have [member-dimension](#window-member-sizes) thickness 0.006 m, filling four closed rectangular regions either side/above/below central `muntin` strips. Each width is (sash clear width−0.025 m)/2; each height is (sash clear height−0.025 m)/2. The central bar width is subtracted before halving, matching the transparent-cell formulas below.

## Double-hung hierarchy and reference state {#double-hung-window}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns hierarchy frame→unit-n→upper/lower-sash, track spacing, articulation and reference state for nine living/bedroom/kitchen/family windows.
@evidence principles/core/common.md#substantive-completion Sashes halve unit height; track gap 0.02 m plus combined depth 0.10 m gives 0.12 m within 0.14 m, leaving 0.01 m front/back. Only lower-sash translates 0 to half sash height.
@evidence principles/core/common.md#declared-basis Operating types/closed state come from spaces/06-openings.md#external-opening-interface; coordinates come from four elevation H2s.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Convert 06's double-hung sashes into fixed upper/translating lower model articulation.
@evidence principles/design/models.md#representation-contract Each unit node has two sashes, upper rigid/lower translating.
@evidence principles/design/models.md#spatial-convention lower-sash moves local +Y, range half sash height.
@evidence principles/design/models.md#reviewable-structure Closed/maximum-open oblique perspective can falsify sash escape from frame.
@evidence principles/design/models.md#model-observable-style-basis Adopt reference 01's vertically divided front windows, making double-hung observable through front/rear tracks and half-height sashes.
@evidence principles/design/models.md#model-scale-layer-completion Define unit/sash layers and translation interface, refusing omitted layers/articulation.
@evidence obligations/design/models.md#articulation-ownership lower-sash local +Y translation is the motion interface; upper-sash is rigid.
@evidence spaces/06-openings.md#external-opening-interface Receive double-hung operation; fix upper-sash and translate only lower-sash local +Y.
@evidence spaces/envelope/front.md#living-front-window Fill three-unit living window X = [-5.10, -2.30] m with three double-hung units.
@evidence spaces/envelope/front.md#bedroom-two-front-window Fill the olive bedroom's two-unit window with two double-hung units.
@evidence spaces/envelope/front.md#bedroom-three-front-window Fill the blue-gray bedroom's two-unit window with two double-hung units.
@evidence spaces/envelope/rear.md#kitchen-rear-window Fill the one-unit kitchen window with one double-hung unit.
@evidence spaces/envelope/rear.md#family-rear-window Fill the two-unit rear family window with two double-hung units.
@evidence spaces/envelope/rear.md#primary-rear-window Fill the two-unit rear primary window with two double-hung units.
@evidence spaces/envelope/left.md#living-left-window Fill the one-unit living left window with one double-hung unit.
@evidence spaces/envelope/left.md#primary-left-window Fill the two-unit primary left window with two double-hung units.
@evidence spaces/envelope/right.md#family-right-window Fill the two-unit family right window with two double-hung units.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consume 06 operating assignments/elevation coordinates unchanged; no parent defect requires repair.
-->

Adopt reference 01's upper/lower front-window division. Actual operating positions are unknown from the photograph; use closed reference states.

Living/bedroom/kitchen/family windows are double-hung under [06 operating assignments](../spaces/06-openings.md#external-opening-interface): [three-unit living front](../spaces/envelope/front.md#living-front-window), two-unit [olive](../spaces/envelope/front.md#bedroom-two-front-window)/[blue-gray bedrooms](../spaces/envelope/front.md#bedroom-three-front-window), [one-unit kitchen](../spaces/envelope/rear.md#kitchen-rear-window), [two-unit rear family](../spaces/envelope/rear.md#family-rear-window), [two-unit rear primary](../spaces/envelope/rear.md#primary-rear-window), [one-unit living left](../spaces/envelope/left.md#living-left-window), [two-unit primary left](../spaces/envelope/left.md#primary-left-window), [two-unit family right](../spaces/envelope/right.md#family-right-window). Under `frame`, each `unit-<n>` has `upper-sash`/`lower-sash`, each half the unit's effective height. Outer-track upper and inner-track lower have 0.02 m separation; combined sash depth 0.10 m plus gap gives 0.12 m within `frame` depth 0.14 m, leaving 0.01 m each front/back.

Each `lower-sash` has one local +Y translation interface, from 0 to half its height. `upper-sash` is rigid. Under [06](../spaces/06-openings.md#external-opening-interface), all reference states are closed, translation 0. Source owner is `src/models/windows.ts`; inspect closed/maximum-open oblique perspectives.

Parameterize rough width W/height H/unit count n exactly as [member dimensions](#window-member-sizes). `frame` border is 0.06 m/depth Z=[−0.18,−0.04] m. Each inter-unit `mullion` is a closed post width 0.08 m/depth 0.14 m. Unit width c=(W−2×0.06−(n−1)×0.08)/n m. Upper/lower `sash` each has envelope width c/height (H−2×0.06)/2 m, border 0.05 m/depth 0.05 m, with preceding track gap 0.02 m. Each sash's central vertical/horizontal `muntin` strips are width 0.025 m/depth 0.01 m. Four closed `glass` plates are thickness 0.006 m, transparent-region column width (c−2×0.05−0.025)/2 m and row height ((H−2×0.06)/2−2×0.05−0.025)/2 m. Duplicate no threshold or casing in this sash prototype.

## Fixed-window hierarchy {#fixed-window}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns frame→unit-n→fixed-sash hierarchy for one stair unit and two garage-side units.
@evidence principles/core/common.md#substantive-completion Fixed sash Z=[−0.13,−0.08] m within frame Z=[−0.18,−0.04] m leaves weather clearance 0.04 m/interior 0.05 m; members are rigid without articulation.
@evidence principles/core/common.md#declared-basis Fixed type comes from spaces/06-openings.md#external-opening-interface; positions/counts from front.md#stair-front-window and right.md#garage-right-window.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Convert the common stair/garage fixed type into prototypes with rigid fixed-sash and four glass plates per unit.
@evidence principles/design/models.md#representation-contract Define fixed hierarchy/rigid state.
@evidence principles/design/models.md#spatial-convention fixed-sash consumes common Z=[−0.13,−0.08] m depth, specifying frame placement and both clearances.
@evidence principles/design/models.md#reviewable-structure Stair-landing/garage inner reveal sections can falsify sash placement.
@evidence principles/design/models.md#model-observable-style-basis Adopt reference 01's narrow stair/garage windows as fixed, expressed by a hierarchy without moving nodes.
@evidence principles/design/models.md#model-scale-layer-completion Fixed windows include frame/sash/glass layers rather than rectangular holes.
@evidence spaces/envelope/front.md#stair-front-window Fill stair window X = [-1.62, -0.84], Y = [4.11, 5.21] m with one fixed unit.
@evidence spaces/06-openings.md#external-opening-interface Fix assigned stair/garage sash/glass and fill openings with separate closed members.
@evidence spaces/envelope/right.md#garage-right-window Fill the garage-side two-unit window with two fixed units.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consume 06 and both elevation H2s unchanged; no parent defect requires repair.
@evidence spaces/02-stair.md#stair-floor-opening Consume the handoff that the stair window opens to the actual stair space and subsequent members realize glazing as one fixed unit.
-->

Adopt reference 01's narrow stair/garage windows as fixed. Do not reproduce reflected tree silhouettes as surface geometry.

Under the [common opening handoff](../spaces/06-openings.md#external-opening-interface), [stair window](../spaces/envelope/front.md#stair-front-window) one unit and [garage side window](../spaces/envelope/right.md#garage-right-window) two units are fixed. Under `frame`, each `unit-<n>` has one `fixed-sash`, placed at [common depth](#window-member-sizes) Z=[−0.13,−0.08] m inside frame Z=[−0.18,−0.04] m, leaving weather clearance 0.04 m/interior 0.05 m. No articulation interface exists; all members are rigid. Source owner is `src/models/windows.ts`; inspect stair-landing/garage inner reveal sections.

Fixed windows also receive W/H/n and unchanged [member dimensions](#window-member-sizes): frame border 0.06 m/depth 0.14 m, inter-unit mullion width 0.08 m. One sash per unit has width c=(W−2×0.06−(n−1)×0.08)/n m, border 0.05 m/depth 0.05 m. Central vertical/horizontal `muntin` width is 0.025 m/depth 0.01 m. Four `glass` plates per unit each have column width (c−2×0.05−0.025)/2 m, row height (H−2×0.06−2×0.05−0.025)/2 m and thickness 0.006 m. Stair n=1 has 0 mullions; the two garage units have 1 between them.

## Tub-bathroom awning window {#awning-window}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns the one-unit tub awning hierarchy, hinge axis/range and obscured-glass surface.
@evidence principles/core/common.md#substantive-completion The axis parallels local X at the sash's upper outer edge; range 0–π/8 rad yields projection 0.2411 m for height 0.63 m against parent reservation 0.25 m. Closed sash Z=[−0.13,−0.08] m and weather-side upper pivot are fixed.
@evidence principles/core/common.md#declared-basis Opening/obscured-glass assignments come from spaces/envelope/right.md#tub-right-window and spaces/06-openings.md#external-opening-interface.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Convert 06's high obscured-glass awning window into top-axis rotation capped at π/8 within parent exterior occupancy 0.25 m.
@evidence principles/design/models.md#representation-contract Define one awning-sash beneath frame and an obscured-glass surface.
@evidence principles/design/models.md#spatial-convention Specify hinge position and outward rotation locally.
@evidence principles/design/models.md#reviewable-structure Bathroom inner section/maximum-open oblique perspective can falsify projection.
@evidence principles/design/models.md#model-observable-style-basis Read reference 05's high bathroom-side window as a small daylight source. Materials owns obscurity; models defines only obscured-glass boundaries.
@evidence principles/design/models.md#model-scale-layer-completion Define hinge interface/opening limit, refusing a bathroom window without articulation.
@evidence obligations/design/models.md#articulation-ownership awning-sash top-axis rotation has motion range 0–π/8 rad.
@evidence spaces/envelope/right.md#tub-right-window Fill bathroom window Z = [-8.40, -7.50], Y = [4.56, 5.31] m with one awning unit.
@evidence spaces/06-openings.md#external-opening-interface Receive awning operation and model the upper axis/outward rotation range.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consume right.md/06 bathroom assignments unchanged; no parent defect requires repair.
-->

Read reference 05's high bathroom-side window as a small daylight window. Do not infer hinge direction from the photograph; choose a top hinge fitting the parent reservation.

[Tub window](../spaces/envelope/right.md#tub-right-window) Z = [−8.40,−7.50], Y = [4.56,5.31] m is one awning unit. Under `frame`, one `awning-sash` rotates about a local-X-parallel line through the upper outer sash edge. Its sole motion interface is outward rotation 0–π/8 rad. Opening height 0.75 m minus frame gives sash height 0.63 m; lower-edge outward projection `0.63×sin(π/8)=0.2411` m leaves 0.0089 m inside the [right-elevation reservation 0.25 m](../spaces/envelope/right.md#tub-right-window). This upper bound does not advantageously subtract frame recess. Reference is closed 0 rad. Pass obscurity through `obscured-glass`; materials determines its degree. Source owner is `src/models/windows.ts`.

`frame` closes all four rough-opening sides at width 0.06 m/depth Z=[−0.18,−0.04] m. Inner `sash` width is 0.90−0.12=0.78 m, height 0.75−0.12=0.63 m, border 0.05 m, depth Z=[−0.13,−0.08] m. One `obscured-glass` plate replaces the transparent grid, filling open center width 0.78−0.10=0.68 m/height 0.63−0.10=0.53 m, Y=[4.67,5.20] m and depth Z=[−0.113,−0.107] m as a closed plate 0.006 m thick. Obscurity is that face's materials response; create no muntins.

Inspect closed sash/frame/glass depth order in the bathroom inner reveal section, and maximum π/8 lower-edge projection against the 0.25 m boundary in exterior oblique perspective. These design-review obligations do not themselves verify actual modelSources meshes.

## Sill and exterior trim {#window-sill-trim}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns exterior trim/interior sill/white interior casing width/projection/thickness and sibling placement beside frame.
@evidence principles/core/common.md#substantive-completion Exterior trim is width 0.10 m/thickness 0.035 m from structural weather face; sill length W+0.14 m/depth 0.13 m/thickness 0.03 m; three inner casing boards width 0.07 m/projection 0.015 m.
@evidence principles/core/common.md#declared-basis Limits 0.10/0.06 m come from spaces/06-openings.md#external-opening-interface; projection grounds from settings/20-verification.md#visual-grammar.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Convert 06 trim width ≤0.10 m/projection ≤0.06 m reservations into actual member dimensions.
@evidence principles/design/models.md#representation-contract exterior-trim/interior-sill are frame siblings.
@evidence principles/design/models.md#spatial-convention Trim uses weather-face reference; sill projection derives from frame-inner and interior-finish faces.
@evidence principles/design/models.md#reviewable-structure Frontal elevation/side section can falsify trim width/sill projection.
@evidence principles/design/models.md#model-observable-style-basis Adopt reference 01's projecting white window surround and 04/05 interior sills. Trim 0.035 m from structural weather face stands 0.005 m beyond maximum siding cut 0.030 m, making junction shadow.
@evidence principles/design/models.md#model-scale-layer-completion Include trim/sill layers in the window prototype, preventing omissions.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work spaces/03-surface-owners.md#exterior-surface-handoff left outer trim with elevation owners, duplicating this sill/casing prototype's closed-face ownership. The parent H2 was corrected to assign wall bodies/voids/cut faces to spaces and closed exterior trim/sills to models. spaces/06-openings.md#external-opening-interface width 0.10 m/projection 0.06 m and settings/20-verification.md#visual-grammar were preserved.
@evidence spaces/03-surface-owners.md#exterior-surface-handoff Keep wall cuts in spaces; this prototype creates closed window trim/sills once.
@evidence spaces/06-openings.md#external-opening-interface Consume white trim width 0.10 m/interior sill projection 0.06 m as four exterior boards and sill boards at two depths.
@evidence settings/20-verification.md#visual-grammar Real trim shadow is realized with a board 0.035 m ahead of the structural weather face.
-->

Adopt reference 01's projecting white surrounds and 04/05 interior sills. Section arithmetic checks actual 0.06 m projection beyond interior finish.

Under [06 reservations](../spaces/06-openings.md#external-opening-interface), exterior `exterior-trim` consists of four closed boards width 0.10 m around rough width W/bottom y0/top y1. Side boards occupy the 0.10 m outside opening ends at Y=[y0,y1]. Bottom board occupies X=[left−0.10,right+0.10]·Y=[y0−0.10,y0]; head uses the same X and Y=[y1,y1+0.10] m. Backs meet the flat structural weather face; fronts project 0.035 m, exceeding maximum siding cut 0.030 m by 0.005 m for [common material/envelope](../settings/20-verification.md#visual-grammar) trim shadows, sharing the door/corner-trim reference. Bottom/top boards meet side ends without duplicate volume. Inner `interior-sill` runs from frame inner −0.18 m through interior finish −0.25 m to roomward −0.31 m: depth 0.13 m/thickness 0.03 m. Its opening-body board occupies X=[opening-left,right]·depth [−0.25,−0.18] m; the eared board ahead of finish occupies X=[opening-left−0.07,right+0.07]·depth [−0.31,−0.25] m. Both meet only at depth −0.25 m and share Y=[y0,y0+0.03] m. Thus the sill enters neither lower-wall solid Y<y0 nor side-wall solids outside opening X at depth≥−0.25 m. Roomward projection from interior finish is 0.06 m within 06's limit; full length is W+0.14 m. `exterior-trim`/`interior-sill` are `frame` siblings. Source owner is `src/models/windows.ts`; inspect frontal elevation/side sections.

White `interior-casing` has two jambs and one head above the sill. Given rough W/H and sill top, each jamb occupies 0.07 m outside its opening side, from sill top to opening head. The head extends 0.07 m past both ends and covers 0.07 m above opening head. All three project 0.015 m roomward from finished wall and close thickness/cut ends. Jamb bottoms contact sill top without penetration; head meets jamb tops at right angles without duplicate volume. Derive interior-casing repetition from 12 rough windows; meet tile termination lines in bathroom walls without creating separate tile. All faces receive one face id `interior-casing`.

Each of four `exterior-trim` boards uses its lower-left end as UV origin, board-length U/width V at 1 UV/m. `interior-sill` tops/bottoms use left wall contact as origin, window-width U/roomward projection V; ends/thickness faces reproject independently from their starts with length U/thickness V. `interior-casing` uses each board's bottom/left end, length U/width V at 1 UV/m, restarting backs/ends at the same scale per board. Break seams at trim-board contacts, sill ends/frame tangent and interior-casing/sill tangent. All three members receive back UVs.

Vertical `mullion` uses its bottom rear corner, height U/width V at 1 UV/m. Top/bottom cut ends project independently from each end's left corner. This overrides broad-frame XY projection to align grain along vertical-member length.

## Window surface partitions {#window-surface-partitions}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns nine surface ids frame·sash·mullion·muntin·glass·obscured-glass·exterior-trim·interior-sill·interior-casing.
@evidence principles/core/common.md#substantive-completion Separate frame/sash/mullion/muntin by replacement path, preventing implementation from merging boundaries.
@evidence principles/core/common.md#declared-basis Id rules come from 00-model-frame.md#model-surface-partition-naming; glass conditions from settings/10-house.md#openings.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Settings forbids opaque black glazing substitutes; spaces/06-openings.md#external-opening-interface assigns obscured bathroom glass. Separate glass/obscured-glass and leave optical values to materials.
@evidence principles/design/models.md#representation-contract Define stable surface ownership per window member.
@evidence principles/design/models.md#spatial-convention Ids attach to 01 member nodes without new coordinates.
@evidence principles/design/models.md#reviewable-structure Material-binding views can falsify correspondence between member/id boundaries.
@evidence principles/design/models.md#model-observable-style-basis Adopt reference 01/05 black window members and white inner/outer casing as separate faces. Materials owns charcoal colors; models owns boundaries.
@evidence principles/design/models.md#model-scale-layer-completion Give every window member a surface interface, leaving none empty.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work spaces/03-surface-owners.md#exterior-surface-handoff duplicated exterior-trim ownership between elevation/prototype. The parent was corrected to give closed trim/frame/glass to models; settings/10-house.md#openings and models/00 id rules were preserved.
@evidence spaces/03-surface-owners.md#exterior-surface-handoff Separate elevation wall bodies/voids/cuts from prototype closed frame/casing/glass faces.
@evidence spaces/06-openings.md#external-opening-interface Receive high bathroom obscured-glass awning type, preserving distinct transparent glass/obscured-glass boundaries.
@evidence settings/10-house.md#openings Deliver frame/sash/muntins/glass as separate ids, separating black borders from transparent plates.
-->

Adopt reference 01/05 black window members and white inner/outer casing as distinct faces. Glazing reflection color is not chosen here.

Under [naming rules](00-model-frame.md#model-surface-partition-naming), stable ids are `frame`, `sash`, `mullion`, `muntin`, `glass`, `obscured-glass`, `exterior-trim`, `interior-sill`, `interior-casing`. Although frame/sash/mullion/muntin are intended for the same charcoal family, keep them separate because replacement paths differ. Materials consumes the [settings](../settings/10-house.md#openings) prohibition on opaque black glazing substitutes. Source owner is `src/models/windows.ts`.

Binding views inspect exterior/interior obliques for black frame/sash/muntins, transparent/obscured glazing and white outer trim/inner sill/casing boundaries. This design declaration does not verify actual bindings or current GPU results.

## Window representation limits {#window-fidelity}
<!--
@evidence principles/core/common.md#scope-preservation All window members must read as separate thick members; omit weatherstrips/locks/screens/double glazing/drip grooves.
@evidence principles/core/common.md#substantive-completion Inspectors infer no insulation, waterproofing or operating loads.
@evidence principles/core/common.md#declared-basis The ceiling comes from 00-model-frame.md#model-representation-ceiling and settings/20-verification.md#fidelity.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Convert capture readability into distinct frame/sash/glass/muntin faces and omitted-mechanism lists.
@evidence principles/design/models.md#representation-contract Define supported/unsupported window-proxy observations.
@evidence principles/design/models.md#spatial-convention Use 01 conventions without new coordinates.
@evidence principles/design/models.md#reviewable-structure Rectangular holes or flat substitutes in model-review/full observations falsify it.
@evidence principles/design/models.md#model-observable-style-basis Adopt only reference 01 frame depth/05 interior light-catching surfaces as expression targets, requiring observable thick members instead of a style label.
@evidence principles/design/models.md#model-scale-layer-completion Explicitly distinguish omitted layers from accidental omissions.
@evidence obligations/design/models.md#representation-ceiling Window limits omit weatherstrips/locks/screens/double glazing/drip grooves and prohibit insulation/waterproofing inference.
@evidence settings/20-verification.md#fidelity Consume capture readability of thick windows as separate frame/sash/glass/trim/sill members.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consume fidelity unchanged; no parent revision was needed.
-->

Adopt only reference 01 frame depth/05 interior light-catching surfaces as expression targets. Unseen screens/fine hardware are excluded from this prototype.

Under the [representation ceiling](00-model-frame.md#model-representation-ceiling), frame/sash/mullion/muntins/glass/trim/sill must read as separate thick members rather than rectangular holes or a single plane. Omit weatherstrips, locks, screens, double-glazing air gaps and drip grooves; inspectors infer no insulation, waterproofing or operating loads. Inspection addresses are the [model-review view list](00-model-frame.md#model-review-set) and [complete observations](../spaces/04-observations.md#spatial-observation-derivation). Actual render verification is not established by this design document.
