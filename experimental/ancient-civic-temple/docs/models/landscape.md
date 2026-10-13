# Site trees and neighbouring envelopes

## Tall narrow evergreen {#cypress}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The 1.50×9.0×1.50m evergreen is taller than the adult envelope and stands in the site placement zones; the 12-sided sides of `trunk` use a Y-axis cylinder UV with a +X seam, and the three `crown` masses use per-face planar UVs.
@evidence settings/40-environment.md#daylight The gaps between the three crown masses and the trunk of the evergreen are read on the neutral board with the front upper-left 45° daylight and sky fill fixed.
@evidence principles/core/common.md#scope-preservation It sets the tall narrow evergreen down to the trunk and three overlapping crown masses, height, segments, normals and the gaps between masses.
@evidence principles/core/common.md#substantive-completion It fixes the 12 segments around the trunk frustum and the radii, heights, centre XYZ and 10×6 segments of the three ellipsoids, so the source does not choose the crown axes or trunk section again.
@evidence principles/core/common.md#declared-basis It states that the tree identity comes from 40-environment#vegetation and image 01 and the place from spaces/site.md#placement-zones.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It turns the vegetation setting into the model decision of a three-mass crown with gaps rather than a single cone.
@evidence principles/design/models.md#representation-contract It sets the trunk and crown parts, the gaps at the waists between masses, 10×6 segments and flat face normals.
@evidence principles/design/models.md#spatial-convention It places the origin at the ground centre of the trunk base and records the occupancy box of about 1.50×9.0×1.50m.
@evidence principles/design/models.md#reviewable-structure It views the height of about 4.7 times the envelope and the lapping of the three masses, and makes a single cone, a cuboid crown or masses without a trunk a failure.
@evidence principles/design/models.md#model-observable-style-basis It rests on the dark vertical crowns of image 01 and does not claim botanical accuracy of the species.
@evidence principles/design/models.md#model-scale-layer-completion Height, mass composition and the ownership of position and size variants within the placement zones are set, completing the tree prototype layer.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The narrow-crowned tree of vegetation and the four zones of placement-zones were compared with the height of about 9.0m and the width 1.50m; it can stand within the zones, so the parents were not changed.
@evidence settings/40-environment.md#vegetation It receives the tall narrow-crowned evergreen as a three-mass crown tree.
@evidence spaces/site.md#placement-zones It hands the four placement zones that allow neighbours and trees over as the range for individual positions.
@evidence settings/50-production.md#references It rests on the dark vertical crowns of image 01.
@evidenceExclude settings/40-environment.md#distant-terrain The distant terrain outside the local site rectangle is a background ridge that delivers no vegetation instances, so no tree prototype stands there, and the ridge shape is owned by the spaces site.
@evidenceExclude spaces/site.md#site-grade The tree origin is the ground centre, and instances reads the ground height from the site ground rule, so the prototype carries no slope.
-->

This is the tall narrow-crowned tree of the [vegetation](../settings/40-environment.md#vegetation). The basis is the dark vertical crowns of image 01, and botanical accuracy of the species is not claimed. The gaps between the trunk, the branch masses and the leaf masses must read at review distance, so it is made of three overlapping masses rather than a single cone mass. The trunk frustum has 12 segments around and one span in height.

The local origin is the ground centre at the trunk base. The trunk is a frustum (height 1.4m) narrowing from radius 0.12m to 0.08m, and the crown is three elongated ellipsoid masses overlapping upward. The centre (X,Y,Z) of the lower mass is (0,3.0,0)m, horizontal radius 0.75m, overall height 3.6m. The middle one is (+0.10,5.4,0)m, radius 0.62m, height 3.4m, and the upper one (-0.10,7.6,0)m, radius 0.42m, height 2.8m. The two upper axes are offset 0.10m in opposite X directions. The overall height is 9.0m, and the ellipsoids are polyhedra of 10 segments around by 6 segments in height whose flat face normals let the faces of the leaf masses read. Taken from the extremes of the smooth ellipsoids, the conservative occupancy box is 1.50×9.0×1.50m. The real Z width of the 10-gon section polyhedra is about 1.427m.

The trunk top end Y=1.4m enters 0.20m into the lower crown mass beyond its bottom end Y=1.2m and unites the two members.

Part map: `trunk`=trunk; `crown`=crown.

Parts and surfaces are `trunk` and `crown`. The narrowing waists between the masses are the gaps. instances sets the individual positions, size variants and count within the [placement zones](../spaces/site.md#placement-zones).

The gaps between the three crown masses and the trunk are read on the neutral board set with the front upper-left 45° altitude daylight and sky fill of [daylight and atmosphere](../settings/40-environment.md#daylight).

On the review board the height of about 4.7 times the walking envelope and the lapping of the three masses are viewed. A single cone, a cuboid crown or masses without a trunk is a failure.

The UV0 of the evergreen `trunk` unwraps the circumference arc length U and the height V from a +X seam at the base. The faces of the three `crown` ellipsoids use the default planar projection per outward normal and split at the mass boundaries.

## Broad-crowned tree {#broad-tree}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The broadleaf tree of about 4.4×5.2×4.2m stands on the site beyond the human envelope; `trunk` uses a Y-axis circumference UV, the three `branch` a circumference U and length V with the seam at +X projected orthogonally onto the branch axis, and `crown` planar UVs.
@evidence principles/core/common.md#scope-preservation It sets the low broad-crowned tree down to trunk, three branches, six crown masses, gaps and segments.
@evidence principles/core/common.md#substantive-completion It fixes the end coordinates of the trunk and three branches, the centres and three semi-axes of the six crown masses, 12 trunk segments and 8 branch segments, so the source does not choose mass positions or branch sections again.
@evidence principles/core/common.md#declared-basis It states that the tree identity comes from 40-environment#vegetation and images 01 and 03 and the place from spaces/site.md#placement-zones.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It turns the vegetation setting into the model decision of a six-mass crown in which the branches show.
@evidence principles/design/models.md#representation-contract It sets the trunk, branch and crown parts, the gaps between masses where branches show, 10×6 segments and flat face normals.
@evidence principles/design/models.md#spatial-convention It places the origin at the ground centre of the trunk base and records the occupancy box of about 4.4×5.2×4.2m.
@evidence principles/design/models.md#reviewable-structure It views the trunk, branches and gaps between masses in front and plan, and makes a one-sphere crown or masses without visible branches a failure.
@evidence principles/design/models.md#model-observable-style-basis It rests on the round, spreading grey-green crowns of images 01 and 03.
@evidence principles/design/models.md#model-scale-layer-completion The layers of branches and crown masses and the ownership of position, size and rotation variants are set, completing the broad tree layer.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The broad-crowned tree of vegetation and the zone widths of placement-zones were compared with the crown of about 4.4m; it fits within the zones set back 1.5m, so the parents were not changed.
@evidence settings/40-environment.md#vegetation It receives the low, broad grey-green crowned tree as branches and a six-mass crown.
@evidence spaces/site.md#placement-zones It hands the placement zones set back 1.5m from the paving over as the range where the broad crown stands.
@evidence settings/50-production.md#references It rests on the round, spreading crowns of images 01 and 03.
@evidenceExclude spaces/site.md#site-extent The 25m site extent is already contained by the placement zones, so the tree prototype consumes only the zones instead of the extent and makes no site-level cell or model.
-->

This is the low, broad grey-green crowned tree of the [vegetation](../settings/40-environment.md#vegetation). The basis is the round, spreading crowns of images 01 and 03. The trunk frustum has 12 segments around and one span in height, and the three branch cylinders each have 8 segments around and one span in length.

The local origin is the ground centre at the trunk base. The trunk is a frustum (height 1.6m) narrowing from radius 0.18m to 0.13m. The three branches of radius 0.07m extend from the trunk centre (0,1.5,0)m to (-1.05,2.6,-0.55)m, (+1.05,2.6,-0.55)m and (0,2.6,+1.10)m respectively, with lengths of about 1.6m. The crown is set by the centres and X, Y, Z semi-axes of the following six ellipsoids. All coordinates and semi-axes are in m.

| Mass | Centre (X,Y,Z) | Semi-axes (X,Y,Z) |
| --- | --- | --- |
| back left | (-1.05,3.25,-0.55) | (1.15,1.35,1.05) |
| back right | (+1.05,3.25,-0.55) | (1.15,1.35,1.05) |
| centre | (0,3.55,+0.85) | (1.20,1.65,1.20) |
| front left | (-1.15,3.45,+0.95) | (0.90,1.30,1.10) |
| front right | (+1.15,3.45,+0.95) | (0.90,1.30,1.10) |
| back centre | (0,3.50,-0.95) | (1.05,1.40,1.15) |

With the crown top 5.20m, X range -2.20~+2.20m and Z range -2.10~+2.05m, the conservative occupancy box is about 4.4×5.2×4.2m by the smooth ellipsoids, and the real Z width of the 10-gon section polyhedra is about 4.04m. Gaps where branches show must remain between the masses. The ellipsoids have 10×6 segments and flat face normals.

The bases of the three branches enter into the upper part of the trunk and fix the junction. The opposite end of each branch enters into a crown mass and fixes the junction. The middle of each branch shows between the crown masses.

Part map: `trunk`=trunk; `branch`=branch; `crown`=crown.

Parts and surfaces are `trunk`, `branch` and `crown`. instances sets the position, size and rotation variants within the [placement zones](../spaces/site.md#placement-zones).

On the review board the front and plan views show the trunk and branches and the gaps between masses. A crown of one sphere, or masses with no visible branches, is a failure.

The broad tree `trunk` uses a Y-axis cylinder UV0 with a +X seam, and the three `branch` use a circumference U and branch length V from a seam where +X is projected orthogonally onto the start axis. The `crown` ellipsoids split with per-face-normal planar UVs.

## Grass at the wall foot {#grass-tuft}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The grass envelope of at most 0.35m is lower than adult passage and lies only in the band outside thresholds, and the several flat front and back faces of one `blade` are projected with the default UV of each outward normal.
@evidence principles/core/common.md#scope-preservation It sets the grass tuft at the wall foot down to a bundle of twelve triangular blade plates, height, double-sided surfaces and the zones where placement is banned.
@evidence principles/core/common.md#substantive-completion It sets the width, height, direction and outward lean of the twelve blades by deterministic formulas of the blade index, so the source does not choose the angles again.
@evidence principles/core/common.md#declared-basis It states that the grass identity comes from 40-environment#vegetation and image 01, the dry soil at the wall edge from 40-environment#site, and the grass band from spaces/site.md#placement-zones.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It turns the setting of a little grass at the wall foot into the model decisions of a bundle of double-sided blade plates and the exclusion of thresholds and walking paths.
@evidence principles/design/models.md#representation-contract It sets one blade part and its double-sided surfaces.
@evidence principles/design/models.md#spatial-convention It places the origin at the ground centre of the tuft.
@evidence principles/design/models.md#reviewable-structure It checks that the scale beside the wall plinth is about 0.15 times the envelope and makes cuboid grass or a tuft blocking a door a failure.
@evidence principles/design/models.md#model-observable-style-basis It rests on the dry grass tufts at the wall edge of image 01.
@evidence principles/design/models.md#model-scale-layer-completion The size and the placement ownership within the grass band are set, completing the grass prototype layer.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The soil strip at the wall edge of the site setting and the 0.6m grass band and 0.5m approach paving exclusion of placement-zones were compared with the tuft width 0.35m; it can lie within the band, so the parents were not changed.
@evidence settings/40-environment.md#vegetation It receives the little grass at the wall foot as a bundle of blade plates.
@evidence settings/40-environment.md#site It receives the narrow dry soil strip at the wall edge as the ground where the tufts lie.
@evidence spaces/site.md#placement-zones It hands the 0.6m wide wall-foot grass band and the 0.5m approach paving exclusion over as the placement range.
@evidence settings/50-production.md#references It rests on the dry grass at the wall edge of image 01.
@evidenceExclude spaces/storey.md#wall-ground-contact The exterior wall bottom is the spaces rule that walls go down to the lowest ground value, and the grass tuft only lies on the soil strip in front of it without changing the wall bottom.
-->

This is the little grass at the wall foot of the [vegetation](../settings/40-environment.md#vegetation). The basis is the dry grass tufts at the wall edge in image 01. It lies on the dry soil of the [local site](../settings/40-environment.md#site), and instances sets the real positions within the wall-foot grass band of the [placement zones](../spaces/site.md#placement-zones).

The local origin is the ground centre of the tuft. For the twelve blades `bladeFan(i)`, i is an integer 0~11 and the direction is θ=2πi/12. The blade width is `0.02+0.005×(i mod 3)`m, the tip height is `0.20+0.15×((5i mod 12)/11)`m, the base centre is 0.03m from the origin in direction θ, and the outward lean of the tip from the base centre in the same direction is `0.08+0.04×((i mod 4)/3)`m. The base edge of each blade spreads half the width to each side of the base centre perpendicular to θ, and the apex is the tip position. The blades of this bundle of triangular plates are double-sided surfaces. The occupancy box is 0.35×0.35×0.35m, which generously wraps the maximum radius 0.15m and height 0.35m.

Part map: `blade`=blade.

Parts and surfaces are the single `blade`. instances sets the positions, count and size variants within the [wall-foot grass band](../spaces/site.md#placement-zones) and places none on thresholds or walking paths.

On the review board it stands beside the wall plinth to check that its scale is about 0.15 times the walking envelope. Cuboid grass, or a tuft blocking a door, is a failure.

The front and back UV0 of the grass `blade` is a planar projection chosen by the outward normal of each face, with vertices split at the thin blade outlines. No extra geometry for a leaf pattern is made outside the 0.35m occupancy.

## Neighbouring plaster house envelope {#neighbor-house}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The A 8.6×4.733×6.6m and B 6.6×5.952×7.6m envelopes are larger than the human envelope but stay in the site placement zones, and `roof` uses +X U on the +Z front slope, −X U on the −Z back slope and +X U on the mono-pitch, each with V from the eave to the high side.
@evidenceExclude settings/00-delivery.md#governing-aim Comparing the whole building against the five references belongs to the building observation positions, and the prototype review board judges only the shapes and voids of separated members.
@evidenceExclude spaces/building.md#footprint The outer footprint is owned by the building mass, and models take only the reviewed clear dimensions and datum lines of rooms, colonnade and roofs to make independent members.
@evidence principles/core/common.md#scope-preservation It sets the neighbouring plaster house envelope down to the walls, roof, door and window recesses and plinth band of the two variants and the envelope-only condition.
@evidence principles/core/common.md#substantive-completion In addition to the 0.30m thick walls and roof dimensions including the two gable walls of A and the sloped wall top of B, it fixes for both variants the door and window centres in the front-face frame, their clear sizes, the 0.20m depth and the remaining 0.10m back wall.
@evidence principles/core/common.md#declared-basis It states that the identity comes from 40-environment#neighborhood and image 01, the place from spaces/site.md#placement-zones, and the height comparison datum from the coping 4.85m of junctions#plinth-coping.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It turns the setting of surrounding buildings into the model decisions of two envelope-only variants with no interior and a height lower than or similar to the temple.
@evidence principles/design/models.md#representation-contract It sets the wall, plinth, roof and recess parts, the door and window recesses that cut only 0.20m of the 0.30m wall and keep 0.10m, and the background ceiling of a slab roof without tile modules.
@evidence principles/design/models.md#spatial-convention It places the origin on the ground at the centre of the floor rectangle and records the occupancy boxes of the two variants.
@evidence principles/design/models.md#reviewable-structure It views the front and 3/4 views of the two variants and their height against the coping 4.85m, and makes a neighbour taller than the temple, pierced windows or a single-colour box a failure.
@evidence principles/design/models.md#model-observable-style-basis It rests on the low tile-roofed houses across the narrow street in image 01 but provides no tile modules because of the background ceiling.
@evidence principles/design/models.md#model-scale-layer-completion The two variants, the height comparison and the ownership of position and rotation within the placement zones are set, completing the background envelope layer.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The buildings lower than or similar to the temple of neighborhood, the four zones of placement-zones and the coping 4.85m were compared with the calculated heights 4.733/5.952m of the two variants. B is higher than the coping but lower than the sanctuary ridge of about 7.67m, so it falls in the similar height range, and occlusion is handled by instances placement.
@evidence settings/40-environment.md#neighborhood It receives the plaster buildings lower than or similar to the temple as two envelope variants.
@evidence spaces/site.md#placement-zones It hands the placement zones that allow neighbouring houses over as the range where position, rotation and count are set.
@evidence spaces/junctions.md#plinth-coping It uses the parapet coping top 4.85m as the height comparison datum for the two variants.
@evidence settings/50-production.md#references It rests on the low tile-roofed houses across the street in image 01.
@evidenceExclude spaces/site.md#distant-ridge The distant ridge and foothills are already owned by the site-distant open surface of the spaces site, and the neighbouring envelope lies only within the 25m local placement zones, so it does not consume the ridge.
@evidenceExclude spaces/site.md#site-paving The soil strips, paving and neighbour floor plots are spaces site surfaces, and the neighbouring envelope is a floorless shell of walls and roof, so it does not make the plots again.
-->

These are plaster buildings of the [surroundings and distant background](../settings/40-environment.md#neighborhood) that are lower than or similar to the temple. The basis is the low tile-roofed houses across the narrow street in image 01; only the envelope is made, with no interior or movement path. Two variants reduce the sense of repetition.

Variant A is a single-storey gable house. The local origin is the ground at the centre of the floor rectangle, and the wall base is X=±4.0m, Z=±3.0m. The solid thickness of the four walls is 0.30m inward. The ridge is parallel to the X axis at Z=0m. The roof top face is Y=3.40m at the eave ends Z=±3.30m and `3.40+3.30×tan(22°)=4.733m` at the centre. The eaves on the four sides project 0.30m beyond the walls, and the slab thickness is vertical 0.16m. The front and back long walls at Z=±3.0m rise to the roof underside `3.40+0.30×tan(22°)−0.16=3.361m`, and at the two short ends X=±4.0m the `wall` part includes closed triangular gable walls rising above walls of this height to the centre height `4.733−0.16=4.573m`. No penetrating hole lets the attic at either end show. The front is the long wall on local +Z, and the door and window X centres and floor-based Y are set within it. The door of A is at X=0m, bottom Y=0m, size 1.0×2.1m, and the two windows are at X=±2.20m, bottom Y=1.35m, each 0.6×0.8m. Variant B is a two-storey-high mono-pitch house whose wall base is X=±3.0m, Z=±3.5m, using the same 0.30m solid thickness inward. From the roof top face Y=4.40m on the front wall line Z=+3.5m the roof rises 12° toward the back, so the top face on the back wall line Z=−3.5m is `4.40+7.0×tan(12°)=5.888m`, the front eave end Z=+3.8m is 4.336m and the rear eave end Z=−3.8m is 5.952m. There are 0.30m eaves on the four sides, and the line 0.16m vertically below the slab top is the wall top. Therefore the front wall closes up to Y=4.24m and the back wall up to Y=5.728m, and the two side walls close under the roof along the trapezoidal top `Y=4.24+(3.5−Z)×tan(12°)`. The front of B is also local +Z; the door is at X=0m, bottom Y=0m, size 1.0×2.1m, and the four windows are at X=±1.70m and bottom Y=1.25m and 2.95m in all combinations, each 0.6×0.8m. All door and window recesses of both variants are recessed 0.20m inward from the front face and have closed backs. Subtracting the recess depth 0.20m from the wall thickness 0.30m leaves an opaque back wall of 0.10m. Both variants have a separate plinth band face 0.5m high from the floor. The roof is a slab without placed tile modules, keeping the background representation ceiling. Including the roof eave ends, the occupancy box is A 8.6×4.733×6.6m, B 6.6×5.952×7.6m.

Part map: `wall`=wall; `plinth`=plinth band; `roof`=roof; `recess`=door and window recess. The plinth band is a closed band 0.008m thick outside the wall, and the front and back bands turn the corners up to a 0.008×0.008m square so that their faces meet the side bands. The 1.0m width of the front door is left open. The union envelope with shared faces removed is emitted so that four triangles do not lie on one corner line.

Parts and surfaces are `wall`, `plinth`, `roof` and `recess` (inner faces of the door and window recesses). The door and window recesses are closed concave spaces and are not pierced. instances sets the position, rotation and count within the [placement zones](../spaces/site.md#placement-zones) so that they do not hide the temple's gables, porch or outline.

On the review board the front and 3/4 views of the two variants are viewed, and against the temple parapet coping 4.85m, A must be lower and B of similar height. A neighbour taller than the temple, pierced windows that show an interior, or a single-colour box is a failure.

The UV0 of the neighbouring house `roof` uses +X U on the front gable slope at local +Z, −X U on the back gable slope at −Z and +X U on the mono-pitch slope, and on all three slopes the real slope length V increases from the eave to the high side. `wall`, `plinth` and the closed `recess` split by the default planar projection per outward normal.
