# Fixtures and furniture

## Fountain basin and jet {#fountain}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The 2.30×about 1.09×2.30m basin occupancy leaves courtyard passage, and the Y-axis solids of revolution of `rim` and `basin-inner` and the `ripple` torus take arc-length UVs from a +X seam, while the horizontal `water` face takes a planar UV.
@evidence principles/core/common.md#scope-preservation It sets the fountain basin down to the step, rim wall, inner floor, water surface, nozzle, jet and ripple ring, and hands water flow and reflection to systems.
@evidence principles/core/common.md#substantive-completion In addition to the step, rim, water surface, the jet start Y=0.49m and end dimensions, it fixes the ripple ring radius 0.11m, width 0.008m and height 0.006m, the half-ellipse equation and the 8-part section, so the source does not choose the basin section again.
@evidence principles/core/common.md#declared-basis It states that the outer diameter, rim height, water surface and jet height come from rooms/courtyard.md#court-volume, the single jet from 30-interiors#fountain, the nozzle and fixed water level from #services, and the form from images 02 and 03.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It turns the setting of a low round fountain and the courtyard basin dimensions into the model decisions of a concave water-holding space and a round water surface.
@evidence principles/design/models.md#representation-contract It sets the step, rim, basin-inner, water, ripple, nozzle and jet parts and surfaces, the real concave space inside the rim, the step underside contact, 48 segments and where smooth normals apply.
@evidence principles/design/models.md#spatial-convention It places the origin on the courtyard floor finish at the basin centre and records the occupancy box 2.30×about 1.09×2.30m.
@evidence principles/design/models.md#reviewable-structure It views the three heights in front, the round water surface in plan, and the walking margin from the courtyard centre and the sanctuary door axis, and makes a square water slab or a tall cup form a failure.
@evidence principles/design/models.md#model-observable-style-basis It records that the round stone rim and thin jet of images 02 and 03 are adopted and the tall cup form of image 04 is not.
@evidence principles/design/models.md#model-scale-layer-completion The reviewed courtyard dimensions, the water depth 0.32m and the rule that the water surface ends inside the rim are set together, completing the fountain layer.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The outer diameter 2.0m, rim 0.52m, water surface −0.08m and jet 0.65m of court-volume and the fixed water level of services were compared with the basin section; all are accommodated, so the parents were not changed.
@evidence settings/30-interiors.md#fountain It receives the fountain setting of a low round stone basin and a single jet as the basin prototype.
@evidence spaces/rooms/courtyard.md#court-volume It uses the outer diameter 2.0m, rim 0.52m, water surface 0.08m below the rim and jet 0.65m above the water surface as they are.
@evidence settings/30-interiors.md#services It receives the water supply ending in a nozzle and the fixed water level as the nozzle base and the still water surface.
@evidence spaces/observations.md#geometry-observations It uses the courtyard centre→four directions and the sanctuary door axis stations as views of the walking margin around the basin.
@evidence settings/50-production.md#references It adopts the round stone rim, low step and thin jet of images 02 and 03 and discards the cup form of 04.
-->

These are the low round stone basin and single water jet of the [fountain courtyard](../settings/30-interiors.md#fountain). The basis is the round stone rim, low step and thin jet rising straight from the centre in images 02 and 03, and the tall cup form of image 04 is not adopted. The outer diameter 2.0m, rim height 0.52m, water surface 0.08m below the rim and jet 0.65m above the water surface of the reviewed [courtyard](../spaces/rooms/courtyard.md#court-volume) are used as they are. The fixed water level of the [service state](../settings/30-interiors.md#services) is the state input of this static shape.

The local origin is the courtyard floor finish at the basin centre. The step is a disc of diameter 2.30m and height 0.08m, and above it the rim wall is an annular wall of outer diameter 2.00m and thickness 0.18m rising from the floor to 0.52m, with a 0.02m chamfer on its top outer edge. The inner floor is 0.12m above the floor and holds a water depth of 0.32m. The water surface is a disc of diameter 1.64m inside the rim, 0.44m above the floor. The water surface disc leaves empty the 0.08m radius of the central nozzle base and starts at the nozzle outer face. The central nozzle base is a cylinder of radius 0.08m that rises from the inner floor to 0.05m above the water surface, and the jet starts at the nozzle top Y=0.49m and is a frustum (bottom radius 0.025m, top 0.012m) rising to 0.65m above the water surface, and on the water surface there is one low ripple ring of centreline radius 0.11m. The ripple section has horizontal width 0.008m and height 0.006m above the surface, a **half-elliptic crest**. For the horizontal offset r from the centreline and the height h above the surface, (r/0.004m)²+(h/0.006m)²=1, h≥0, and both base ends are in contact with the water surface. The torus has 48 segments around; the half-elliptic section links 9 vertices dividing the angle 0~π into 8 equal parts, including both base ends, and the closing face below the surface is not drawn but merged with the water surface. The ripple inner radius 0.106m is 0.026m outside the nozzle base radius 0.08m, so the two do not penetrate each other. Other round members have 48 segments, and the rim wall and jet use smooth normals. The occupancy box is 2.30×about 1.09×2.30m.

The closed floor plate of `basin-inner` is Y=0.115~0.120m and the `water` disc Y=0.435~0.440m, each 0.005m thick, and each circumference has 48 segments. The ripple `ripple` starts at the water surface Y=0.44m and its crest touches Y=0.446m, and its outer radius is 0.114m.

Part map: `step`=step; `rim`=rim; `basin-inner`=inner floor; `water`=water surface; `ripple`=ripple; `nozzle`=nozzle; `jet`=jet.

Parts and surfaces are `step`, `rim`, `basin-inner`, `water`, `ripple`, `nozzle` and `jet`. So that water does not leave the circle, the water surface ends at the rim inner wall and no square slab is used. The rim inner wall and the inner floor are the real concave space holding the water. The step underside is a hidden face touching the courtyard floor. This model is placed once at the courtyard centre, and water flow and light reflection are later decisions of systems.

On the review board, the front view shows the three heights of step, rim and jet, and the plan shows the round form and that the water surface stays only inside the rim. Building observation checks from the courtyard centre toward the four directions and on the sanctuary door axis that walking space remains around the basin. A square water slab, a water surface higher than the rim, multiple sprays or a tall cup form is a failure.

The round sides of the fountain `rim`, `basin-inner`, `nozzle` and `jet` unwrap UV0 with the arc length U from a +X seam and the section generatrix V, and `ripple` with the arc lengths of the large circle and the tube section. The horizontal faces of `step` and `water` separate their seams by the default projection per outward normal.

## Stone altar and step {#altar}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The 2.40×1.10×1.60m step, top slab and pedestals are sized to sit on the sanctuary north axis, and the default planar UV applies to the independent stone slab faces of `step`, `top` and `support`.
@evidence principles/core/common.md#scope-preservation It sets the step and the stone altar on it down to dimensions, top slab projection, the empty space between the two pedestals, the standing place and the placement reservation.
@evidence principles/core/common.md#substantive-completion The step 2.40×1.60×0.15m, the altar 1.40×0.75×0.95m, the top slab 0.14m with 0.04m projection, the two pedestal slabs and the 0.20m setback leave the source no altar to choose again.
@evidence principles/core/common.md#declared-basis It states that the altar range comes from 35-objects#altar, the step height from 10-building#ground-access and the local step of storey.md#ground-storey, and the placement reservation from rooms/sanctuary.md#sanctuary-volume.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It turns the stone altar setting into the model decisions of a one-step platform, pedestals open front to back and a 0.625m standing place in front.
@evidence principles/design/models.md#representation-contract It sets the step, top and support parts, the offering bowl face on the top slab, the hidden contact faces of the pedestals and step, and the empty space between the pedestals.
@evidence principles/design/models.md#spatial-convention It places the origin at the centre of the step floor face with the altar front on local +Z (toward the sanctuary door) and records the occupancy box 2.40×1.10×1.60m.
@evidence principles/design/models.md#reviewable-structure It views the top slab projection, the empty space between pedestals and the north axis placement of the step and sanctuary threshold in three views, and makes a single box, a height over 1.05m or an altar without a step a failure.
@evidence principles/design/models.md#model-observable-style-basis It rests on the slab tops and pedestals of images 02 and 04 and provides no human figure, letters or ornament.
@evidence principles/design/models.md#model-scale-layer-completion The step height, altar height and front standing place are set together with the sanctuary reservation, completing the altar layer.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The altar range, the one-step height of ground-access, the local step storey handed to fit-out and the 0.7m behind and 1.5m in front reservations of sanctuary-volume were compared with the altar; all are accommodated, so the parents were not changed.
@evidence settings/35-objects.md#altar It receives the dimension range of a thick stone altar as the 1.40×0.75×0.95m altar.
@evidence settings/30-interiors.md#sanctuary It receives the hierarchy of an altar on a low step in the sanctuary as one step-and-altar model.
@evidence spaces/storey.md#ground-storey It consumes the local step the storey handed to fit-out as this model's step part.
@evidence settings/10-building.md#ground-access It uses the one-step height range as the step height 0.15m.
@evidence spaces/rooms/sanctuary.md#sanctuary-volume It hands the north axis reservation (at least 0.7m behind the altar, at least 1.5m in front) to instances as the placement datum.
@evidence spaces/openings.md#doors It uses the door-sanctuary swing reservation as the range the altar must not overlap.
@evidence settings/10-building.md#civic-identity It receives the identity of making no fake inscriptions or deity claims as the decision that the altar has no letters or ornament.
@evidence settings/50-production.md#references It rests on the slab tops and pedestals of images 02 and 04.
@evidenceExclude settings/20-envelope.md#stone-floors Floor slab paving and joints are owned by the spaces floors and materials/instances, and the step is the local step storey handed to fit-out, so the model takes no decision from the floor setting.
-->

This is the thick stone altar on the low step of the [sanctuary](../settings/30-interiors.md#sanctuary). The basis is the size range of the [stone altar](../settings/35-objects.md#altar) and the slab top and pedestals of images 02 and 04, and no human figure, letters or ornament is provided. The step is the local step that the reviewed [storey](../spaces/storey.md#ground-storey) handed over to fit-out.

The local origin is the centre of the step floor face, and the altar front faces local +Z (toward the sanctuary door). The step is a slab of width 2.40m, depth 1.60m and height 0.15m within the one-step height range of [floor and ground access](../settings/10-building.md#ground-access). The altar stands on the step, and from the step top it has height 0.95m, width 1.40m, depth 0.75m. The top slab has thickness 0.14m and projects 0.04m beyond the pedestal on all sides. The pedestal is two stone slabs at the sides (width 0.28m, depth 0.67m, height 0.81m), and between them a width 0.76m and height 0.81m space is pierced front to back so the underside of the top slab shows. The altar steps back 0.20m from the centre of the step top and leaves a standing place of 0.625m in front. The occupancy box is 2.40×1.10×1.60m.

Part map: `step`=step; `top`=top slab; `support`=pedestal.

Parts and surfaces are `step`, `top` and `support`. The top face of the top slab is the face the [shallow offering bowl](wares.md#offering-bowl) lies on. The pedestal top and bottom faces and the step underside are hidden contact faces. instances consumes the reviewed north axis reservation of the sanctuary (at least 0.7m behind the altar to the wall, an activity depth of at least 1.5m in front) for placement.

On the review board the front, side and 3/4 views show the top slab projection, the empty space between the two pedestals and the single step. Building observation checks from the sanctuary threshold that the altar lies on the north central axis and stays clear of the door swing. A single box without pedestals, a height over 1.05m, or an altar standing on the floor without the step is a failure.

The UV0 of the altar `step`, `top` and `support` is the default planar projection along the outward normal of each stone slab. Vertices are split at the top slab underside, the pedestal top faces and the hard edges of the step.

## Plain niche {#niche}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The 1.24×1.94×0.42m niche stands against the north wall and is shallower than the walking envelope, and the concave stone faces of `plinth`, `body`, `recess-frame`, `recess` and `cap` are projected planarly along each normal.
@evidenceExclude spaces/ownership.md#surface-map The surface ownership map divides the wall, floor and roof solids of spaces, and model part surface IDs are set by each prototype H2 inside its independent object.
@evidence principles/core/common.md#scope-preservation It sets the plain niche behind the altar down to plinth, body, concave recess, cap and the freestanding condition against the wall.
@evidence principles/core/common.md#substantive-completion The plinth 1.20×0.40×0.60m, body 1.10×0.36×1.20m, recess 0.60×0.80×0.22m with its opening height, and the cap dimensions leave the source no niche to choose again.
@evidence principles/core/common.md#declared-basis It states that the form comes from the rear niche of image 02, the absence of a cult figure from 30-interiors#sanctuary, and the wall position from the north wall of rooms/sanctuary.md#sanctuary-volume.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It turns the hierarchy setting of the sanctuary into the model decision of a concave recess holding only vessels, without a cult figure.
@evidence principles/design/models.md#representation-contract It sets the five parts plinth, body, recess-frame, recess and cap. The sides of the recess are owned by body, the top and bottom by recess-frame and the back by recess. The wall contact is made by the plinth and cap at Z=0.
@evidence principles/design/models.md#spatial-convention It places the origin at the centre of the back edge of the floor face with the front on local +Z and records the occupancy box 1.24×1.94×0.42m.
@evidence principles/design/models.md#reviewable-structure It views the recess depth and cap projection in front and the centre behind the altar from the sanctuary door axis, and makes a slab without a recess, a hole in the wall or a human figure a failure.
@evidence principles/design/models.md#model-observable-style-basis It uses the rear niche structure of image 02 as the form basis but provides no human cult figure.
@evidence principles/design/models.md#model-scale-layer-completion A freestanding member that does not pierce the wall and the ownership boundary of the vessels placed in the recess are set together, completing the niche layer.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The figure-free hierarchy of the sanctuary setting and the north wall and 0.7m behind-altar reservation of sanctuary-volume were compared with the niche depth 0.42m; it fits within the reservation, so the parents were not changed.
@evidence settings/30-interiors.md#sanctuary It receives the sanctuary hierarchy holding only offering vessels without a human cult figure as the plain niche.
@evidence spaces/rooms/sanctuary.md#sanctuary-volume It uses the north wall behind the altar and the 0.7m reservation as the wall the niche stands against and its depth limit.
@evidence settings/50-production.md#references It uses the rear niche structure of image 02 as the form basis.
-->

This is the small plain niche that makes the hierarchy behind the altar in the [sanctuary](../settings/30-interiors.md#sanctuary). The form basis is the rear niche structure of image 02, but no human cult figure is provided and only offering vessels are placed. It is a freestanding stone piece attached to the wall and does not pierce the wall.

The local origin is the centre of the back edge of the floor face, and the front is local +Z. The plinth has width 1.20m, depth 0.40m and height 0.60m, and above it the body has width 1.10m, depth 0.36m and height 1.20m, and in the middle of the body front face a concave recess of width 0.60m, height 0.80m and depth 0.22m opens from 0.15m above the body underside. The body sides wrap the recess vertically, the recess frame boards limit the void above and below, and the recess back makes the depth of the recess. On top, a cap of width 1.24m, depth 0.42m and height 0.14m rests on the body. The occupancy box is 1.24×1.94×0.42m.

The body is front to back Z=0.02~0.38m, and the cap is Z=0~0.42m. `body` is the full-height stone slabs left and right of the recess at X=−0.55~−0.30m and +0.30~+0.55m. `recess-frame` is the lower and upper stone slabs at X=−0.30~+0.30m, Y=0.60~0.75m and 1.55~1.80m, with Z=0.02~0.38m. `recess` is the rear stone slab at X=−0.30~+0.30m, Y=0.75~1.55m, Z=0.02~0.16m, and 0.22m is empty from its front face Z=0.16m to the recess front Z=0.38m. This back board owns the Z=0.02~0.16m volume, so there is no unowned void behind the recess inside the body. The Z=0~0.02m gap between the wall and the back board remains outside the body.

Part map: `plinth`=plinth; `body`=body sides; `recess-frame`=recess frame boards; `recess`=recess back; `cap`=cap.

Parts and surfaces are `plinth`, `body`, `recess-frame`, `recess` and `cap`. The sides of the recess are `body`, the top and bottom `recess-frame`, and the recess back `recess`. The plinth and cap back faces (Z=0) are hidden contact faces touching the sanctuary north wall, and the body, the frame boards and the back board back faces (Z=0.02) are faces 0.02m off the wall. Between the plinth and the cap the gap shows on both sides. instances sets the vessels in the recess and the placement position.

On the review board, the front view shows the recess depth and the cap projection, and building observation checks on the sanctuary door axis that the niche is centred behind the altar. A slab without a recess, a hole pierced in the wall, or a human figure is a failure.

UV0 projects the inside of the niche `recess` and the ledges of `recess-frame` with different plane normals. `plinth`, `body` and `cap` split seams at edges and part boundaries and keep the shallow occupancy Z=0~0.42m.

## Metal lampstand {#lampstand}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The 0.26×1.15×0.26m lampstand is narrower than the sanctuary passage, and the 16-sided round sides of `foot`, `stem`, `knop` and `dish` unwrap as a Y-axis arc-length U and generatrix V from a +X seam.
@evidence principles/core/common.md#scope-preservation It sets the metal lampstand down to foot, stem, two knops, dish, height, voids and placement ownership.
@evidence principles/core/common.md#substantive-completion It fixes the foot frustum bottom and top diameters 0.26/0.16m, the stem top Y=1.10m, the knop centres 0.35/0.80m, the dish bottom 0.006m, inner floor 1.106m and rim top 1.15m, so the source does not choose the lampstand section again.
@evidence principles/core/common.md#declared-basis It states that the form comes from 35-objects#lampstands and images 02 and 04, the absence of flame from the unlit lamps of 30-interiors#services, and the left and right placement in the sanctuary from #sanctuary.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It turns the lampstand setting into the model decisions of a hierarchy of wide foot, two knops and shallow dish and a static shape without flame.
@evidence principles/design/models.md#representation-contract It sets the foot, stem, knop and dish parts, the concave space inside the dish and 16 segments.
@evidence principles/design/models.md#spatial-convention It places the origin at the centre of the foot bottom and records the occupancy box 0.26×1.15×0.26m.
@evidence principles/design/models.md#reviewable-structure It views the foot, knop and dish hierarchy of the front silhouette and the height of about 0.6 times the envelope, and makes a lamp more than 0.3m above the altar top or a stem without a foot a failure.
@evidence principles/design/models.md#model-observable-style-basis It rests on the wide foot, thin stem and shallow round dish of images 02 and 04 and provides no flame.
@evidence principles/design/models.md#model-scale-layer-completion The height 1.15m is compared with the altar top 1.10m including the step and the walking envelope, closing scale and layer together.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The form range of lampstands, the unlit lamps of services and the left and right placement of sanctuary were compared with the lampstand; a static shape suffices, so the parents were not changed.
@evidence settings/35-objects.md#lampstands It receives the composition of a dark metal freestanding lampstand as foot, stem, knops and dish.
@evidence settings/30-interiors.md#services It receives the display state of unlit lamps as a dish without flame.
@evidence settings/30-interiors.md#sanctuary It hands the left and right lamp placement in the sanctuary to instances as positions to set.
@evidence settings/50-production.md#references It rests on the wide foot, thin stem and shallow dish of images 02 and 04.
-->

This is the dark metal freestanding piece of the [lampstand](../settings/35-objects.md#lampstands). The basis is the wide foot, thin stem and shallow round dish of images 02 and 04, and following the [service state](../settings/30-interiors.md#services) there is no flame. instances sets the left and right placement positions and count in the [sanctuary](../settings/30-interiors.md#sanctuary).

The local origin is the centre of the foot bottom. The foot is a low frustum of bottom diameter 0.26m and top diameter 0.16m (height 0.06m) with a disc above it (diameter 0.16m, height 0.02m). The stem is a cylinder of radius 0.015m rising from the disc top Y=0.08m over length 1.02m, and at its top end Y=1.10m it carries the dish bottom. The two knops are cylinders of radius 0.03m and height 0.03m placed at **centre Y=0.35m and 0.80m from the floor**. The top dish is a flat-bottomed cup of outer diameter 0.22m, bottom Y=1.10m and bottom thickness 0.006m. The inner floor is Y=1.106m, the inner vertical wall radius is 0.10m and the outer vertical wall radius is 0.11m, so the wall thickness is 0.01m. The inner depth 0.044m and the rim top Y=1.15m agree. The bottom underside, inner floor, inner and outer vertical walls and rim top are linked in order, and only the dish interior is left as a void. Round members have 16 segments. The occupancy box is 0.26×1.15×0.26m.

The two knop cylinders overlap the stem cylinder coaxially and are fixed. This lap is not a separate inner void but the union of one metal member.

Part map: `foot`=disc; `stem`=stem; `knop`=knop; `dish`=dish.

Parts and surfaces are `foot`, `stem`, `knop` and `dish`. The dish interior is a concave void. instances sets the number of left and right placements in the sanctuary and the positions free of toppling.

On the review board the front silhouette shows the hierarchy of foot, knop and dish and a height of about 0.6 times the walking envelope. A lamp more than 0.3m higher than the altar top Y=1.10m including the step, a rod without a dish, or a stem standing without a foot is a failure.

The UV0 of the round sides of the lampstand `foot`, `stem`, `knop` and `dish` unwraps with the real radius of each section and a +X seam. The dish interior starts a separate V at the lowest inner ring, and the disc faces split by default planar projection.

## Offering table {#offering-table}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The `top` and `trestle` stone planes of the 0.75×0.82×2.20m table along the long axis of the offering room each use per-normal UVs, and the empty space between the two trestles is not filled with a closed board for UVs.
@evidence principles/core/common.md#scope-preservation It sets the long stone table of the offering room down to top slab, two trestles, empty space and placement ownership.
@evidence principles/core/common.md#substantive-completion It fixes the top slab 2.20×0.75×0.10m with top 0.82m, the trestle section and the 0.35m from the ends of the long side of the top slab to the centreline, so the source does not choose the trestle positions or faces again.
@evidence principles/core/common.md#declared-basis It states that the size range comes from 35-objects#offering-table, the room role from 30-interiors#offering-room, the long axis and passage reservation from rooms/offering.md#offering-volume, and the form from image 02.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It turns the offering table setting into the model decisions of a low, long proportion distinct from the altar and two trestles that let the underside of the top show.
@evidence principles/design/models.md#representation-contract It sets the top and trestle parts, the vessel face on the top slab, the trestle top contact, and the empty space between the two trestles and under both ends.
@evidence principles/design/models.md#spatial-convention It places the origin at the centre of the floor face with the long side on local Z and records the occupancy box 0.75×0.82×2.20m.
@evidence principles/design/models.md#reviewable-structure It views the empty space under the top and the two trestles in side view and the long reading from both ends of the offering room long axis, and makes box-shaped trestles or a height over 0.9m a failure.
@evidence principles/design/models.md#model-observable-style-basis It rests on the long stone top of image 02 and uses a low height distinct from the altar as the refuting criterion.
@evidence principles/design/models.md#model-scale-layer-completion The table height 0.82m is compared with the altar 0.95m and the ownership of the long-axis placement in the room is set, completing the table layer.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The offering-table range and the Z long axis and side passages of offering-volume were compared with the table width 0.75m and length 2.20m; side passages remain in the 4.0m wide room, so the parents were not changed.
@evidence settings/35-objects.md#offering-table It receives the size range of the offering table as the top slab 2.20×0.75m and height 0.82m.
@evidence settings/30-interiors.md#offering-room It receives the long table of the shared offering room as a long stone table in the middle of the room.
@evidence spaces/rooms/offering.md#offering-volume It hands the room assignment with the table long axis on Z and use on both sides to instances as the direction to consume.
@evidence spaces/observations.md#geometry-observations It uses the auxiliary stations at both ends of the offering room long axis as views to check that the table reads long.
@evidence settings/50-production.md#references It rests on the long stone top of image 02.
-->

This is the long stone offering table of the [shared offering room](../settings/30-interiors.md#offering-room). The basis is the range of the [offering table](../settings/35-objects.md#offering-table) and the long stone top of image 02. Unlike the altar it is low and long, and the underside of the top slab shows.

The local origin is the centre of the floor face, and the long side is local Z. The top slab has length 2.20m, width 0.75m and thickness 0.10m, with top height 0.82m and underside Y=0.72m. The two trestles are stone slabs of Z-direction thickness 0.12m, X-direction width 0.60m and height 0.72m, each standing with its centreline at Z=±0.75m, 0.35m inward from the ±Z end faces of the long side of the top slab. The trestle top faces are in face contact with the top slab underside. The occupancy box is 0.75×0.82×2.20m.

Part map: `top`=top slab; `trestle`=trestle.

Parts and surfaces are `top` and `trestle`. The top slab top face is a face where instances can place bowls and vessels. The trestle top face is a hidden contact face touching the top slab underside. The space between the two trestles and below both ends is empty. instances sets the long axis direction in the offering room and the side passages from the reviewed offering room reservation.

On the review board the side view shows the empty space under the top slab and the two trestles, and building observation from both ends of the offering room long axis checks that the table reads long in the middle of the room. Box-shaped trestles or a height over 0.9m is a failure.

The offering table `top` and the two `trestle` use the default per-outward-normal UV0 of each stone slab. The top slab underside and the trestle top faces are projected as separate faces, with seams at the hard edges of both ends.

## Offering room display shelf and office wall shelf {#display-shelf}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The offering room 1.60×1.40×0.40m and office 1.00×1.20×0.30m variants leave passage in front of the wall, and the long `side` unwraps a +Y U and the horizontal `board` a +X U.
@evidenceExclude spaces/building.md#containment The space parent hierarchy is a spaces identity; a prototype has no parent room, and instances sets the parent of a placed element.
@evidence principles/core/common.md#scope-preservation It sets the offering room display shelf and the office wall shelf as two variants of one family down to dimensions, shelf heights and wall clearance.
@evidence principles/core/common.md#substantive-completion The display shelf 1.60×0.40×1.40m with four shelf heights, the office variant 1.00×0.30×1.20m with two cells, the side panel and board thicknesses and the 0.02m clearance from the wall leave the source no shelf to choose again.
@evidence principles/core/common.md#declared-basis It states that the shelf composition comes from 35-objects#shelves, the roles of the two rooms from 30-interiors#offering-room and #administration, and the wall positions from the two room volumes.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It turns the shelf setting into the model decisions of a display shelf with wide, low cells and a short office variant that holds no scrolls.
@evidence principles/design/models.md#representation-contract It sets the side and board parts, the empty cells open front and back, and the absence of a back board.
@evidence principles/design/models.md#spatial-convention It places the origin at the centre of the back edge of the floor face with the front on +Z and records the occupancy boxes of the two variants.
@evidence principles/design/models.md#reviewable-structure It views the three wide cells and the side panel thickness in front and makes a box without cells or a shelf sunk into the wall a failure.
@evidence principles/design/models.md#model-observable-style-basis It follows the shelf setting of thick side panels and wide, low cells and keeps the office variant from reading like the records room cell shelf.
@evidence principles/design/models.md#model-scale-layer-completion The dimensions of the two variants and the boundary of the objects they hold are set, completing the shelf layer of the two rooms.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The 1.40/1.20m heights and 0.40/0.30m depths of the two variants were each compared with the height 1.2~1.8m and depth 0.25~0.45m of shelves. They do not block passage at the north and west walls of offering-volume or the wall shelf place of office-volume, so no parent dimension or room boundary needed changing.
@evidence settings/35-objects.md#shelves It receives timber shelves with thick side panels and wide, low cells as the display shelf family.
@evidence settings/30-interiors.md#offering-room It receives the wall-side display of the offering room as the 1.60m display shelf variant.
@evidence settings/30-interiors.md#administration It receives the office wall shelf for a few ceramic pieces as the 1.00m variant.
@evidence spaces/rooms/offering.md#offering-volume It hands the north and west wall priority display assignment over as the walls where the display shelf stands.
@evidence spaces/rooms/administration.md#office-volume It hands the office wall shelf place over as the wall where the short variant stands.
-->

This is the timber display shelf on the wall side of the [shared offering room](../settings/30-interiors.md#offering-room), and it also covers the wall shelf of the [office](../settings/30-interiors.md#administration) as a short variant of the same family. The basis is the thick side panels and wide, low cells of the [shelves](../settings/35-objects.md#shelves), and it is not embedded in the wall. The [north and west wall priority places](../spaces/rooms/offering.md#offering-volume) of the offering room and the [wall shelf place](../spaces/rooms/administration.md#office-volume) of the office remain placement inputs of instances.

The local origin is the centre of the back edge of the floor face, and the front is +Z. It has width 1.60m, depth 0.40m and height 1.40m, with side panel thickness 0.04m. The undersides of the four shelf boards of thickness 0.03m lie at Y=0.10m, 0.55m, 1.00m and 1.37m above the floor, so that the top face of the top board ends at Y=1.40m. There is no back board, and it stands 0.02m off the wall. The occupancy box is 1.60×1.40×0.40m. The two side panels occupy Y=0~1.40m, and the four boards are fitted between the inner faces of the side panels at X=−0.76~+0.76m and share no volume.

The office variant has width 1.00m, depth 0.30m and height 1.20m, and the undersides of the three shelf boards of thickness 0.03m lie at Y=0.10m, 0.65m and 1.17m above the floor, so that the top face of the top board ends at Y=1.20m and there are two cells. Only the office's few ceramic pieces go on it, and scrolls are not stacked to make it read like the records room. The occupancy box is 1.00×1.20×0.30m. In the short variant too, the side panels are Y=0~1.20m and the three boards lie within X=−0.46~+0.46m.

Part map: `side`=side panel; `board`=shelf board.

Parts and surfaces are `side` and `board`. The cells are voids open front and back, and bowls lie on the shelf board tops. instances sets the placement and wall faces of the two variants.

On the review board the front view shows the three wide cells and the side panel thickness. A box without cells, or a shelf sunk into the wall, is a failure.

The vertical `side` of the display shelf takes +Y upward from the floor, and each shelf `board` +X from left to right, as the U of UV0. Seams are split at the front and back ends of the four and three boards of each variant and at the butts with the side panels.

## Writing desk and reading table {#desk}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The 1.10×0.75×0.60m writing desk and 0.90×0.72×0.55m reading table fit the work envelope, and `leg` takes a +Y U while `top` and the horizontal `stretcher` take each long local edge as U.
@evidence principles/core/common.md#scope-preservation It sets the office writing desk and the records room reading table as two size variants of one composition down to top slab, legs and stretchers.
@evidence principles/core/common.md#substantive-completion It fixes the width, depth and height of the two variants, the 0.04m top slab, the leg centres X/Z=±(half width/half depth−0.06m), and the stretcher height and section, so the source does not choose the desk leg positions again.
@evidence principles/core/common.md#declared-basis It states that the composition comes from 35-objects#workstation, the roles of the two rooms from 30-interiors#administration and #records, and the form from the work table of image 05.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It turns the desk and seat setting into the model decision of two size variants with a void the stool goes into.
@evidence principles/design/models.md#representation-contract It sets the top, leg and stretcher parts, the voids under the top slab and between the legs, and the absence of drawers, wheels and cushions.
@evidence principles/design/models.md#spatial-convention It places the origin at the centre of the floor face and records the occupancy boxes of the two variants as width×height×depth.
@evidence principles/design/models.md#reviewable-structure It views the two variants side by side for the separation of top slab, legs and stretchers and makes a box-shaped desk or a height over 0.8m a failure.
@evidence principles/design/models.md#model-observable-style-basis It rests on the work table of image 05 and claims no modern drawers or wheels.
@evidence principles/design/models.md#model-scale-layer-completion The heights 0.75/0.72m of the two variants are compared with the stool 0.45m, closing the scale layer together with the seat.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The workstation range and the work places of office-volume and records-volume were compared with the two variants; they fit in the 4.0m wide rooms, so the parents were not changed.
@evidence settings/35-objects.md#workstation It receives the desk composition of top slab, four legs and stretchers as two variants.
@evidence settings/30-interiors.md#administration It receives the office writing work as the 1.10m writing desk.
@evidence settings/30-interiors.md#records It receives the small reading table of the records room as the 0.90m variant.
@evidence spaces/rooms/administration.md#office-volume It hands the office writing work place over as the room where the writing desk stands.
@evidence spaces/rooms/records.md#records-volume It hands the records room reading place over as the room where the reading table stands.
@evidence settings/50-production.md#references It rests on the work table of image 05.
-->

These are the writing desk of the [office](../settings/30-interiors.md#administration) and the small reading table of the [records room](../settings/30-interiors.md#records). The basis is the top slab, four legs and supporting stretchers of the [desk and seat](../settings/35-objects.md#workstation) and the work table of image 05. They are two size variants of the same composition.

The local origin is the centre of the floor face. The writing desk has width 1.10m, depth 0.60m and height 0.75m, and the reading table width 0.90m, depth 0.55m and height 0.72m, with top slab thickness 0.04m, and the legs are square 0.06m. The two top slabs are 0.30m and 0.27m higher than the 0.45m seat top of the [stool](fixtures.md#stool). In both variants the four leg centres are all combinations of (X,Z)=(±(width/2−0.06m), ±(depth/2−0.06m)). The stretchers between the four leg centres connect the two X-direction lines and the two Z-direction lines of each variant, their section has horizontal width 0.04m and vertical height 0.05m, and their **underside** is at Y=0.15m above the floor. The occupancy box is width×height×depth for each.

Part map: `top`=top slab; `leg`=leg; `stretcher`=stretcher.

Parts and surfaces are `top`, `leg` and `stretcher`. Under the top slab and between the legs is the void the stool goes into. There are no drawers, wheels or cushions. instances sets the position in each room.

On the review board the two variants are viewed side by side to confirm the separation of top slab, legs and supporting stretchers. A box-shaped desk or a height over 0.8m is a failure.

The desk `top` takes +X along the width, the four square `leg` +Y from the floor, and the cross and lengthwise `stretcher` +X and +Z, as the U of UV0. The end faces of slabs and legs have independent seams.

## Stool {#stool}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The 0.40×0.45×0.35m stool goes into the void under the desk, with `seat` taking a width +X U, the four `leg` a height +Y U and the two-direction `stretcher` each long axis as U.
@evidence principles/core/common.md#scope-preservation It sets the stool of the office and records room down to seat, four legs, stretchers and placement ownership.
@evidence principles/core/common.md#substantive-completion It fixes the seat 0.40×0.35×0.04m with top 0.45m, the four leg centres X=±0.16m, Z=±0.135m with square 0.04m, and the stretcher section 0.025×0.03m at height 0.12m, so the source does not choose the stool shape again.
@evidence principles/core/common.md#declared-basis It states that the 0.42~0.48m height range comes from 35-objects#workstation and the two rooms that use it from 30-interiors#administration and #records.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It turns the seat setting into the model decisions of a stool without a backrest and a seat about 0.3m lower than the desk top slab.
@evidence principles/design/models.md#representation-contract It sets the seat, leg and stretcher parts and the void under the seat.
@evidence principles/design/models.md#spatial-convention It places the origin at the centre of the floor face and records the occupancy box 0.40×0.45×0.35m.
@evidence principles/design/models.md#reviewable-structure Beside a desk variant it checks that the seat is about 0.3m lower than the top slab and makes a chair with a backrest or a box-shaped seat a failure.
@evidence principles/design/models.md#model-observable-style-basis It makes the setting of a simple seat refutable through a shape without backrest or cushion.
@evidence principles/design/models.md#model-scale-layer-completion The seat height is compared with the two desks and position ownership is set with instances, completing the seat layer.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The 0.42~0.48m range of workstation was compared with the seat 0.45m; it goes into the voids under both desks, so the parents were not changed.
@evidence settings/35-objects.md#workstation It receives the 0.42~0.48m stool height range as the 0.45m seat.
@evidence settings/30-interiors.md#administration It receives the seat of the office writing desk as the stool.
@evidence settings/30-interiors.md#records It receives the seat of the records room reading table as the stool.
-->

This is the simple seat of the office and records room. The basis is the 0.42~0.48m high stool of the [desk and seat](../settings/35-objects.md#workstation).

The local origin is the centre of the floor face. The seat is 0.40×0.35m with thickness 0.04m, and its top height is 0.45m. The four legs are square 0.04m, and their centres are all combinations of (X,Z)=(±0.16m,±0.135m). The stretchers connecting the four leg centres are square timbers whose section, orthogonal to the length axis, has horizontal thickness 0.025m and vertical height 0.03m, and their underside is 0.12m above the floor. The occupancy box is 0.40×0.45×0.35m.

Part map: `seat`=seat; `leg`=leg; `stretcher`=stretcher.

Parts and surfaces are `seat`, `leg` and `stretcher`. The space under the seat is empty. instances sets the position and the relation to the desk.

On the review board it stands beside a desk variant to check that the seat is about 0.3m lower than the top slab. A chair with a backrest or cushion, or a box-shaped seat, is a failure.

The long width of the stool `seat` takes +X, the long height of the four square `leg` +Y, and the two-direction `stretcher` +X or +Z as the U of UV0. There is a seam at each butt of seat, legs and stretchers.

## Records room cell shelf {#scroll-shelf}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The 1.80×1.70×0.40m records shelf keeps twenty empty cells, with `frame` taking a +Y U, the horizontal `board` a +X U and `divider`, whose depth is longest, a +Z U.
@evidence principles/core/common.md#scope-preservation It sets the scroll cell shelf of the records room down to the 4×5 grid, board thicknesses, cell dimensions and the absence of a back board.
@evidence principles/core/common.md#substantive-completion The 1.80×0.40×1.70m size, the 0.04m side panels, the 0.03m dividers and the cells of width (1.80−2×0.04−3×0.03)/4≈0.41m and height (1.70−2×0.04−4×0.03)/5=0.30m leave the source no grid to choose again.
@evidence principles/core/common.md#declared-basis It states that the many tiers of small cells come from 35-objects#shelves, the room role from 30-interiors#records, and the cells with scrolls laid flat from images 02 and 05.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It turns the shelf setting into the model decision of a twenty-cell grid distinct from the offering room display shelf.
@evidence principles/design/models.md#representation-contract It sets the three parts frame, board and divider, the voids of the twenty cells, and the scrolls lying on the cross board tops.
@evidence principles/design/models.md#spatial-convention It places the origin at the centre of the back edge of the floor face with the front on +Z and records the occupancy box 1.80×1.70×0.40m.
@evidence principles/design/models.md#reviewable-structure It views the 4×5 grid and cell depth in front and makes a box without a grid or a display shelf with wide cells a failure.
@evidence principles/design/models.md#model-observable-style-basis It rests on the cells with scrolls laid flat in images 02 and 05.
@evidence principles/design/models.md#model-scale-layer-completion The cell dimensions are compared with the 0.28m scroll length and the ownership of the count per cell is set, completing the records storage layer.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The shelves composition and the access in front of the shelf of records-volume were compared with the cell shelf depth 0.40m; access remains in the 4.0×3.75m room, so the parents were not changed.
@evidence settings/35-objects.md#shelves It receives a shelf with many tiers of small cells as a 4×5 cell grid.
@evidence settings/30-interiors.md#records It receives the scroll cell shelf of the records room as this prototype.
@evidence spaces/rooms/records.md#records-volume It hands the records room shelf place and front access over as the room where the cell shelf stands.
@evidence settings/50-production.md#references It rests on the cells with scrolls laid flat in images 02 and 05.
-->

This is the cell shelf for scrolls of the [records room](../settings/30-interiors.md#records). The basis is the many tiers of small cells of the [shelves](../settings/35-objects.md#shelves) and the cells with scrolls laid flat in images 02 and 05.

The local origin is the centre of the back edge of the floor face, and the front is +Z. It has width 1.80m, depth 0.40m and height 1.70m, with side, top and bottom panel thickness 0.04m and divider and shelf board thickness 0.03m, making cells of 4 columns and 5 tiers. One cell is (1.80−2×0.04−3×0.03)/4≈0.41m wide and (1.70−2×0.04−4×0.03)/5=0.30m high, open front and back, with no back board. The occupancy box is 1.80×1.70×0.40m. The two side panels occupy Y=0~1.70m and X=−0.90~−0.86m and +0.86~+0.90m. The bottom board is Y=0~0.04m and the top board Y=1.66~1.70m, and both are fitted inside the side panels at X=−0.86~+0.86m. The four middle cross boards lie at Y=0.34~0.37m, 0.67~0.70m, 1.00~1.03m and 1.33~1.36m. The centre X of the three vertical dividers is −0.4375m, 0m and +0.4375m, and each is 0.03m thick. The dividers are split into separate closed boards for each of the five open height intervals Y=0.04~0.34m, 0.37~0.67m, 0.70~1.00m, 1.03~1.33m and 1.36~1.66m, so they do not duplicate volume with the cross boards.

The cell width of about 0.41m is wider than the 0.28m length of the rolled base form of the [scroll](wares.md#scroll). instances sets how many go into which cell.

Part map: `frame`=side panel; `board`=cross board; `divider`=divider.

Parts and surfaces are `frame`, `board` and `divider`. [Scrolls](wares.md#scroll) lie in the twenty empty cells on the shelf board tops. The count per cell is set by instances.

On the review board the front view shows the 4×5 grid and the cell depth. A box without a grid, or wide cells like the offering room display shelf, is a failure.

The vertical `frame` of the records shelf takes +Y, the six horizontal `board` +X, and the divider `divider` the front-to-back depth +Z as the U of UV0. Seams lie at each board end of the twenty cells and at part boundaries.

## Storage chest {#chest}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The 0.82×0.505×0.535m closed chest lies within the setting's chest width, depth and height ranges, with the long +X of the timber `body` and `lid` as U and the default planar UV for the metal `hasp` and `strap`.
@evidence settings/20-envelope.md#material-language The timber `body` and `lid` and the metal `hasp` and `strap` of the chest stay separate part surfaces; the model emits UV0, and materials sets colour, roughness and texture binding.
@evidence principles/core/common.md#scope-preservation It sets the storage chest in a closed fixed state down to body, separate lid, joint line, hasp, hinge bands and corner bands.
@evidence principles/core/common.md#substantive-completion It fixes the body, lid and 0.005m clearance, the three contact segments of the hasp linking the body and lid front faces, the bent contact path of the hinge bands at X=±0.27m and the four corner L-section bands, so the source does not choose the chest hardware contacts again.
@evidence principles/core/common.md#declared-basis It states that the composition comes from 35-objects#chests, the per-room use of the locked chest and lidded box from 30-interiors#records and #storage, and the form from the low chest with a hasp in image 05.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It turns the storage chest setting into the model decision of a fixed member read through the joint line of the closed lid and metal bands.
@evidence principles/design/models.md#representation-contract It sets the body, lid, hasp and strap parts and surfaces and records that no inner void or contents are delivered.
@evidence principles/design/models.md#spatial-convention It places the origin at the centre of the floor face with the front on +Z and records the occupancy box 0.82×0.505×0.535m including bands and lid.
@evidence principles/design/models.md#reviewable-structure It views the lid thickness, joint line and hasp separation and makes a box without a lid or a chest without a hasp a failure.
@evidence principles/design/models.md#model-observable-style-basis It rests on the low chest with a locking hasp in image 05.
@evidence principles/design/models.md#model-scale-layer-completion The closed fixed state and absence of a joint agree with the articulation map and the placement ownership is set, completing the chest layer.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The 0.82×0.535×0.505m occupancy box of the base chest was compared with the width 0.6~1.0m, depth 0.4~0.6m and height 0.4~0.6m of chests. The records requirement of room to open and close is kept by spaces even with a closed fixed display, so no parent needed changing.
@evidence settings/35-objects.md#chests It receives a storage chest with a timber body and separate lid as this prototype.
@evidence settings/30-interiors.md#records It receives the low chest with visible locking hardware of the records room as the chest with a hasp.
@evidence settings/30-interiors.md#storage It receives the lidded boxes of the storage room as this fixed chest prototype with a separate lid and hasp.
@evidence settings/50-production.md#references It rests on the low chest with a hasp in image 05.
-->

These are the timber body and separate lid of the [storage chest](../settings/35-objects.md#chests). The basis is the low chest with a locking hasp in image 05, and it is fixed in the closed state. The lidded boxes of the [storage room](../settings/30-interiors.md#storage) are also made from this prototype, and instances sets their positions and count.

The local origin is the centre of the floor face, and the front is +Z. The body is a box of width 0.80m, depth 0.50m and height 0.44m, and the lid has width 0.82m, depth 0.52m and thickness 0.06m and lies above the body at Y=0.445~0.505m. The 0.005m open joint line between the body top Y=0.44m and the lid underside is a real gap between the two members, and no fake engraving is cut into the body or lid. The iron hasp `hasp` at the front centre is a single bent plate of width 0.08m at X=−0.04~+0.04m that links the body and the lid. The lower segment is Y=0.35~0.44m, Z=+0.25~+0.26m, so it touches the body front face. The connecting segment shifts its front and back Z faces together linearly over Y=0.44~0.445m from +0.25/+0.26m to +0.26/+0.27m, crossing the 0.005m lid gap. The upper segment is Y=0.445~0.505m, Z=+0.26~+0.27m, so it touches the lid front face. Each segment shares a plate face of the same width and thickness at the Y plane where they meet and does not enter the solid interior of the body or lid. The two hinge bands on the back are bent metal plates with centre X=±0.27m, width 0.04m and thickness 0.005m. Each band joins in order a segment Y=0.36~0.44m touching the body back face Z=−0.25m, a connecting segment rising 0.005m above the joint and bent back over Z=−0.25→−0.26m, and a segment Y=0.445~0.505m touching the lid back face Z=−0.26m. The body-side band is Z=−0.255~−0.25m and the lid-side band Z=−0.265~−0.26m, and the top end touches at the height of the lid top. The four corner bands are L-sections wrapping the front-left, front-right, back-left and back-right vertical edges (X=±0.40m,Z=±0.25m) of the body. Each band, on the abutting X and Z faces, is 0.04m wide from the edge and 0.005m thick outward and continues over Y=0~0.44m. The overall height is 0.505m, and the occupancy box is 0.82×0.505×0.535m.

The L-shaped bands of the four corners are also included in the `strap` part. The union of the rear hinge bands and the four front and rear corner bands is the occupancy of this part, and no band belongs to a separate part or the body timber.

Part map: `body`=body; `lid`=lid; `hasp`=hasp; `strap`=band.

Parts and surfaces are `body`, `lid`, `hasp` and `strap`. No inner void or contents are delivered. The records room and storage room use this base chest prototype within the setting range, and instances sets placement and copy count. No chest is assigned to the office.

The timber faces of `body` and `lid` and the metal faces of `hasp` and `strap` are separate parts, and the model emits the UV0 of each face. Colour, roughness, texture and per-part binding belong to the [material binding](../materials/10-model-bindings.md#binding-map).

The long timber faces of the chest `body` and `lid` unwrap local +X as the U of UV0. The front hasp `hasp` and the front, rear and corner metal `strap` are projected along their own outer plane normals, with seams at the boundary between timber and metal.

On the review board the lid thickness, joint line and hasp must read separately. A box without a lid, or a chest without a hasp, is a failure.
