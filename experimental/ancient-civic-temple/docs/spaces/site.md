# Local site supporting the temple

## Site unit and extent {#site-extent}

<!--
@evidence principles/core/common.md#scope-preservation Uses the whole rectangle 25m beyond each exterior building face, separating ground/paving/placement zones from distant ridge outside, rather than making only a front scenery fragment.
@evidence principles/core/common.md#substantive-completion Defines unit temple-site, root element site.root, kind site space, and four convex cells' X/Z/Y extents numerically.
@evidence principles/core/common.md#declared-basis Uses 40-environment#site's authored 25m and building#footprint coordinates, without claiming parcel or surveyed-road boundaries.
@evidence principles/design/spaces.md#space-topology Makes temple-site a separate root outside building/storey, connected only through two connectors; four cells meet building spaces only at exterior outline faces.
@evidence principles/design/spaces.md#space-boundary-authority Extent.ts singly owns site extents/datums, building owns its outline, and entrance owns recessed flooring; site has no surface inside the outline.
@evidence principles/design/spaces.md#space-verification-address Site observations fail site/building volume overlap, paving outside extent, or building elements beneath site.root.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Turns the 25m local setting/site allocation into a separate unit, root space, and four-cell structure.
@evidence upstream/design/spaces.md#settings-and-map-revision-from-space-work Designing site as a space exposed build-scope allocation to unavailable maps, so 00-delivery#build-scope moved it to spaces. A 25m rectangle also conflicted with 40-environment#site's former maximum distance from walls at corners; that H2 was repaired to a rectangle offset from each of four faces (a6e001e1).
@evidence settings/40-environment.md#site Offsets each exterior face perpendicularly 25m into X=-35.5~35.5, Z=-35.25~35.25, separating distant background outside.
@evidence settings/00-delivery.md#build-scope Owns ground, curbs, distant ridge, and placement zones under the repaired allocation, leaving neighbor/vegetation objects to models/instances.
-->

Consume ground, path, boundary, and placement-zone allocation from [local site](../settings/40-environment.md#site) and [build scope/branches](../settings/00-delivery.md#build-scope). `temple-site` is separate from building `temple`. Its root element is `site.root`; its root space is `temple-site`, kind `site`. Neither belongs beneath building root or storey `temple-ground`. Only two [site/building connectors](#site-connections) join site and interior spaces. This production's maps branch is closed. When spaces had entered review before maps, parent settings moved site allocation to spaces so it would not depend on an active unreviewed foundation; this file remains the sole site space owner. `lint.config.ts` declares the current branch stages.

As [site settings](../settings/40-environment.md#site) specify, offset each of the [outline](building.md#footprint)'s four exterior faces perpendicularly 25m, giving rectangle X=-35.5~35.5m, Z=-35.25~35.25m. Corners are farther than 25m from the nearest wall point; this is a local production limit, not a parcel boundary or surveyed road. Inside are [grade](#site-grade), [earth/curbs/paving](#site-paving), and [placement zones](#placement-zones); outside only [distant ridge/foothills](#distant-ridge). Site supplies no surface, space, or placement inside building X=±10.5m, Z=±10.25m. The entrance recess floor retains [entrance](rooms/entrance.md#entrance-volume) ownership.

Four convex cells cover `temple-site` minus the building: south/north strips spanning all X at Z=10.25~35.25m and -35.25~-10.25m, and east/west strips at Z=-10.25~10.25m, X=10.5~35.5m and -35.5~-10.5m. Every cell spans Y=-0.30m~6.0m. The lower limit is beneath lowest grade -0.24m; the upper limit logically contains walking/observations without sky-blocking faces. Cells meet each other only along faces and building spaces only along exterior outline faces, never with positive-volume overlap.

Assembly owner is `src/spaces/site/assembly.ts`; `src/spaces/site/extent.ts` exports sole extent/datum inputs. [Site observations](observations.md#geometry-observations) provide counterexamples. Repair this owner first for compiled site/building overlap, paving beyond the extent, or building elements under `site.root`.

## Ground heights {#site-grade}

<!--
@evidence principles/core/common.md#scope-preservation Applies one rule to main road, exterior service area, east/west wall slopes, and the entire site rather than matching only two contacts.
@evidence principles/core/common.md#substantive-completion Defines Y=0 north of yard-front, Y=-0.24 south of south-outer, and Y=-0.24×(Z+2.45)/12.7 between.
@evidence principles/core/common.md#declared-basis Uses storey#ground-storey heights and building#plan-datums transition lines; slope is authored, not drainage engineering or surveyed terrain.
@evidence principles/design/spaces.md#space-topology Connects main stair foot/service frontage continuously with neither X slope nor mounds before choosing geometry.
@evidence principles/design/spaces.md#space-boundary-authority Storey owns contact heights and datum table owns transition Z; this H2 supplies the intervening formula and minimum for wall bottoms.
@evidence principles/design/spaces.md#space-verification-address East/west wall and both contact sections fail gaps, mismatched contact heights, or steps at slope transitions.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Defines continuous road/service access through a three-segment Z-only grade formula and planar subdivision.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared ground-access main-step permission/level service access and storey heights -0.24/0. Around 1.9% over 12.7m satisfies both without revising parent heights or limits.
@evidence settings/10-building.md#ground-access Receives low main steps and level service entry at different ground heights without copying either to the other.
@evidence settings/40-environment.md#site Provides continuous paths and ground/plinth contact through slopes along east/west outer walls.
-->

Join [ground-access](../settings/10-building.md#ground-access) main steps/level service entry and [storey](storey.md#ground-storey) main road Y=-0.24m/service exterior Y=0 with one ground. Height depends only on Z. North of [datum](building.md#plan-datums) `yard-front` Z=-2.45m use Y=0; south of `south-outer` Z=10.25m use Y=-0.24m. Across the intervening 12.7m, use Y=-0.24×(Z+2.45)/12.7. Around 1.9% slope lowers toward the south frontage, with no X slope or local mounds.

The main stair foot then meets Y=-0.24m, while the service frontage at center Z=-6.4m meets Y=0. Ground is designed to receive each contact independently. Along east/west exteriors the same slope meets wall faces, giving [wall-bottom](storey.md#wall-ground-contact) minimum contact -0.24m at the front. This authored continuous join is neither drainage engineering nor surveyed terrain.

Derive all site surfaces and curb tops from this rule, exported as one function in `src/spaces/site/extent.ts`. Split surfaces at Z=-2.45m and Z=10.25m so every piece is planar; supports use the same planar height rule. Observe east/west wall longitudinal sections and both contact sections. Ground/wall gaps, mismatched contacts, or transition steps fail.

## Earth strips, curbs, and paving {#site-paving}

<!--
@evidence principles/core/common.md#scope-preservation Partitions the entire extent into wall-base earth, curbs, front street, three alleys, main approach, service frontage, and neighbor ground without gaps.
@evidence principles/core/common.md#substantive-completion Defines plan regions/surface IDs, earth depths 3.0m/1.0m, curb width 0.30m, height 0.12m, and embedment 0.10m.
@evidence principles/core/common.md#declared-basis Uses image 01 and 40-environment#site for paving/curb/dry-earth relations; region dimensions are authored choices.
@evidence principles/design/spaces.md#space-topology Interrupts the curb ring only at two access paths, with disjoint surfaces and earth touching walls.
@evidence principles/design/spaces.md#space-boundary-authority Uses site-grade heights, entrance-return inner faces for approach width, openings for service width, and materials for paving texture.
@evidence principles/design/spaces.md#space-verification-address Overview regions, both curb interruptions, four corners, and alley-slope sections expose detached earth, blocked access, or duplicate surfaces.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Turns stone paths, low curbs, and dry earth into eight plan regions and curb-interruption rules.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared 40-environment#site paving/curb/earth and vegetation's wall-base grass with regions. All fit one plan without changing parent materials or extent.
@evidence settings/40-environment.md#site Creates rough main-front paving, low curbs, and dry wall-edge earth as distinct paving/curb/earth surfaces.
-->

Allocate [local site's](../settings/40-environment.md#site) rough front paving, low curbs, and narrow dry wall-edge earth in plan. All heights follow [grade](#site-grade).

| Region | Plan extent (m) | Surface |
| --- | --- | --- |
| Wall-base earth strip | Building outline to curb inner line X=±11.5, north Z=-11.25, south Z=13.25 | `surface.site.earth` |
| Curbs | 0.30m outside inner lines (X=±11.5~±11.8, Z=-11.25~-11.55, Z=13.25~13.55), top 0.12m above grade | `surface.site.curb` |
| Front street | Z=13.55~21.55, full extent width | `surface.site.paving` |
| East/west alleys | X=11.8~14.8 and -14.8~-11.8, Z=-11.55~13.55 | `surface.site.paving` |
| North alley | Z=-14.55~-11.55, X=-14.8~14.8 | `surface.site.paving` |
| Main approach paving | X=-1.65~1.65, Z=10.25~13.55 | `surface.site.paving` |
| Service frontage paving | X=10.5~11.8, Z=-7.3~-5.5 | `surface.site.paving` |
| Neighbor ground | Remaining area inside extent | `surface.site.ground` |

Front earth depth is 3.0m; east/west/north width is 1.0m. Interrupt curbs at main approach X=±1.65 and service frontage Z=-7.3~-5.5, leaving no 0.12m access curb. Main width matches entrance-return inner faces; service frontage extends clear door width 1.1m by 0.35m at both sides. Curbs join at four corners as a continuous rectangular ring.

Earth/paving/neighbor ground are open top-only surfaces at grade. Curbs are closed stone bands from 0.10m below to 0.12m above grade. Surfaces do not overlap; curb footprints contain only curb. Materials binds paving joints/relief and soil texture; spaces creates no individual paving stones. Only [wall-base grass](../settings/40-environment.md#vegetation), no trees/neighbors, may occupy the earth strip.

Source owner is `src/spaces/site/ground.ts`. Observe overview regions, both approach interruptions, four curb corners, and east/west alley-slope sections. Earth detached from walls, curbs blocking access, or coincident surfaces fail.

## Site/building connections {#site-connections}

<!--
@evidence principles/core/common.md#scope-preservation Makes both main-stair/exterior-service contacts connectors and permits no other passage.
@evidence principles/core/common.md#substantive-completion Defines both IDs, kinds, directions, endpoints, step counts, widths, and clear heights in the table.
@evidence principles/core/common.md#declared-basis Uses entrance stair dimensions, openings door dimensions, and storey#threshold-support ownership.
@evidence principles/design/spaces.md#space-topology Keeps only temple-site↔entrance and service-yard↔temple-site without registering site as storey or second outer-boundary space.
@evidence principles/design/spaces.md#space-boundary-authority Circulation.ts owns connectors, assembly.ts site support/space, and service-yard its threshold floor.
@evidence principles/design/spaces.md#space-verification-address Both connector sections and route-width obstacles fail wall/column/curb penetration or endpoints outside owning spaces.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Converts two building-contact IDs into stair/passage connector records to actual exterior space.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared building#approach-contacts, entrance's two steps, and openings' service dimensions with connectors. All are consumed unchanged without parent contact/access revisions.
@evidence settings/40-environment.md#site Creates two actual site-to-building connectors for continuous road/service access.
@evidence settings/10-building.md#ground-access Uses two-step main stair and level service passage, without service steps.
-->

Consume two [building contact](building.md#approach-contacts) IDs through two `temple-site` connectors. Both exterior-side spaces are `temple-site`.

| Connector | Kind/direction | Path and dimensions |
| --- | --- | --- |
| connector.site-entrance-stair | stair, temple-site→entrance, bidirectional | X=0, before stair foot Z=10.60m (Y=-0.24) to upper landing Z=9.90m (Y=0), two steps (0.12m riser, 0.35m tread), [entrance stair](rooms/entrance.md#entrance-volume) width 1.8m |
| connector.door-service-exterior | passage, service-yard→temple-site, bidirectional | Z=-6.4m, 0.3m inside inner wall face (X=9.6) to 0.3m beyond outer face (X=10.8), Y=0, [exterior service door](openings.md#doors) width/clear height 1.1×2.2m |

Read main connector clear height from the porch underside along its path; portions beyond roof are open sky. Service follows the existing door-passage rule; [threshold ownership](storey.md#threshold-support) remains service-yard. Site walking support uses earth/paving, excluding neighbor ground and curbs.

No other passage joins building/site. Site is neither a building room nor storey: do not assign `temple-site` to `temple-ground` or as a second outer-wall boundary space. Exterior walls remain single-room facades. `src/spaces/circulation.ts` owns connectors; `src/spaces/site/assembly.ts` owns site support/space. Observe both connector sections and route-width obstacles. Penetrating walls/columns/curbs or endpoints outside their spaces fail.

## Neighbor and tree placement zones {#placement-zones}

<!--
@evidence principles/core/common.md#scope-preservation Bounds background placement through four neighbor zones, wall-base grass, paving/access prohibitions, and protected observation sightlines.
@evidence principles/core/common.md#substantive-completion Defines region extents/permitted objects, 1.5m setback, 0.6m grass strip, and 0.5m access-side exclusions.
@evidence principles/core/common.md#declared-basis Uses 40-environment#neighborhood/#vegetation height/nonocclusion requirements; setbacks are authored choices.
@evidence principles/design/spaces.md#space-topology Locates regions on neighbor ground beyond paving without curb/paving overlap or exterior sightline blockage.
@evidence principles/design/spaces.md#space-boundary-authority Spaces owns zones, instances positions/counts/sizes/rotations, and models geometry.
@evidence principles/design/spaces.md#space-verification-address Compares overview zones/actual placements; outside-zone or paved objects and blocked observation sightlines fail.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Turns settings' nonocclusion/heights into four coordinate zones, permitted objects, and forbidden widths.
@evidence upstream/design/spaces.md#settings-and-map-revision-from-space-work Defining regions exposed 40-environment#neighborhood allocation of neighbor positions/sizes to unavailable maps; repaired it to spaces zones and instances placement.
@evidence settings/40-environment.md#neighborhood Limits across-street neighbor envelopes to four zones and rejects occlusion of porch/gables/outline or observation sightlines.
@evidence settings/40-environment.md#vegetation Places trees only in neighbor zones and grass only at wall bases, away from doors/access paving.
-->

Define zones and prohibitions for instances placing [neighbors](../settings/40-environment.md#neighborhood) and [vegetation](../settings/40-environment.md#vegetation). Spaces owns only zones; instances owns positions/counts/sizes/rotations, and models owns geometry.

| Zone | Plan extent (m) | Permitted objects |
| --- | --- | --- |
| South neighbors | Z=23.05~35.25, full width | Neighbor envelopes, trees |
| West neighbors | X=-35.5~-16.3, Z=-35.25~12.05 | Neighbor envelopes, trees |
| East neighbors | X=16.3~35.5, Z=-35.25~12.05 | Neighbor envelopes, trees |
| North neighbors | Z=-35.25~-16.05, X=-16.3~16.3 | Neighbor envelopes, trees |
| Wall-base grass | Earth strip within 0.6m of exterior wall faces | Grass |

Neighbor regions sit on neighbor ground, 1.5m back from paving edges. No objects occupy paving, curbs, main approach, or service frontage outside these regions. Exclude grass within 0.5m of either side of main/service paving. Neighbor heights must be below or comparable to the temple per settings. Even within zones, reject placements blocking [exterior observations](observations.md#geometry-observations) or their sightlines to porch, gables, and outline.

`src/spaces/site/extent.ts` exports zones for instances. Currently `src/instances/site.ts` assembles three neighbor envelopes, four trees, and six grass clumps. Comparing overview regions/placements, main/service access, and west alley views found no occlusion of porch, gables, or access sightlines. Outside-zone objects, objects on paving, or blocked exterior observation sightlines fail.

## Distant ridge and foothills {#distant-ridge}

<!--
@evidence principles/core/common.md#scope-preservation Owns only the 40~100m ridge and foothills outside site, without walking, facilities, or vegetation objects.
@evidence principles/core/common.md#substantive-completion Defines foot/crest radii, crest-height formula, 72 subdivisions, and 220m-square foothills.
@evidence principles/core/common.md#declared-basis Uses 40-environment#distant-terrain distance/low-profile requirements; radii and height formula are authored choices.
@evidence principles/design/spaces.md#space-topology Keeps ridge/foothills as background outside walking support, spatial cells, and placement zones.
@evidence principles/design/spaces.md#space-boundary-authority Foothills inherit site-grade heights; ridge.ts singly owns ridge geometry.
@evidence principles/design/spaces.md#space-verification-address Exterior overview and west street-end eye-height views test ridge hierarchy and foothill steps/gaps.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Turns the low 40~100m ridge into radii, height formula, and subdivided three-dimensional geometry.
@evidence upstream/design/spaces.md#settings-and-map-revision-from-space-work Creating ridge exposed 40-environment#distant-terrain heights/outlines allocated to unavailable maps; repaired that H2 to the spaces site owner.
@evidence settings/40-environment.md#distant-terrain Creates low gentle volumetric ridge around 41.3~97.8m from the building without photographs.
-->

Own the [distant terrain](../settings/40-environment.md#distant-terrain)'s low gentle 40~100m volumetric ridge as an open ring around the origin. Inner foot radius is 56m, crest 88m, outer foot 108m; feet enter the ground at Y=-0.30m. Nearest building distance is around 41.3m from outline corners (radius around 14.7m) to inner foot; farthest is around 97.8m from axial exterior faces to outer foot, within settings.

For azimuth φ (0 toward front +Z, increasing toward east +X), crest height is H(φ)=7.0−2.5·cos φ+1.2·sin(3φ+0.7)+0.6·sin(7φ+1.9) m. The front ±60° stays low around 3.3~5.9m; rear ±60° rises around 8.1~10.7m to form the horizon behind roofs. Inner slope is around 19° at its highest and no more than around 11° toward the front. Divide circumference into 72 pieces (5°), each with inner/outer triangular slopes. Between ridge and local site, foothills continue the [grade](#site-grade) rule outside site to a square of side 220m.

Ridge/foothills are background without walking, facilities, or vegetation objects, excluded from supports and space cells. Use neither flat photos nor billboards, nor mountain/cliff forms dominating the temple. Surfaces are `surface.site-distant.ridge` and `surface.site-distant.ground`; owner is `src/spaces/site/ridge.ts`. Observe exterior-setting overview and eye height at west front-street end (X=-26, Z=18) for a low ridge behind the temple silhouette and no site/foothill steps or gaps.
