# Movable furnishings and props of the temple

This file owns the reusable prototypes of the objects stage. It uses right-handed Y-up metre coordinates and the [shared scale](../contracts/principles-models.md#temple-reference-scale), and only the prose dimensions and formulas of each H2 are inputs to the shape design. The occupancy box is based on the union of the solid ranges of each part, and when it generously wraps that union it is stated to be a conservative bound. instances sets the per-room copy count, rotation and spacing. The surface ID is the part name, and a name is added only when a separate sub-surface is needed. For every floor-standing object the local Y=0 is the floor face, and no manufacture, load or historical physical restoration is claimed.

## Stone bench for waiting and work {#bench}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The 1.40×0.46×0.45m bench is lower than the adult walking envelope and stays beside the courtyard passage, and each exposed plane of the stone `seat` and `pier` takes the default per-outward-normal UV.
@evidenceExclude settings/00-delivery.md#coverage-map The settings ownership map is an index of settings, and the prototype consumes the envelope, interior, object and environment H2s the map points to directly, so it takes no extra shape from the map itself.
@evidence principles/core/common.md#scope-preservation This H2 sets together the form, parts, occupancy range, review and instances placement ownership of the low waiting furnishing of the courtyard and main door.
@evidence principles/core/common.md#substantive-completion It sets the dimensions, contact faces and width parameter of the top slab and two piers, the open lower part and the occupancy box.
@evidence principles/core/common.md#declared-basis The first paragraph distinguishes the 2026-09-25 user instruction to make objects as the existence scope, 35-objects#bench and 30-interiors#fountain as parent authority, the reference images as visual basis, and dimensions and joints as model decisions.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It narrows the low waiting furnishing of the courtyard and main door of 35-objects#bench to a local origin, shape dimensions, parts and surfaces and a reviewable occupancy box.
@evidence principles/design/models.md#representation-contract It sets the contact of seat and pier and the void under the seat, and excludes a closed box-shaped bench.
@evidence principles/design/models.md#spatial-convention It sets the floor-centre origin, the front on +Z, the width variant and the union occupancy range.
@evidence principles/design/models.md#reviewable-structure It checks that the 0.40m open lower part and the separation of the two piers show from the front and side.
@evidence principles/design/models.md#model-observable-style-basis Two plain stands and a thick stone slab convey a shared furnishing.
@evidence principles/design/models.md#model-scale-layer-completion It sets the 1.40m base form and the 1.10m wide variant with the same joint method and closes the occupancy boxes of both variants.
@evidence settings/30-interiors.md#fountain It takes the low bench at the courtyard edge and hands instances a placement that keeps the walking line around the fountain.
@evidence settings/50-production.md#references It uses the restrained scale of stone and timber furnishings of images 01, 03 and 05 as the comparison datum.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work The low waiting furnishing of the courtyard and main door had no settings identity owner, so 35-objects#bench was created and added to the room list of 30-interiors#fountain. The shape prose was set after this parent repair.
@evidence settings/35-objects.md#bench It takes the existence, form range and state of the low waiting furnishing of the courtyard and main door and derives the dimensions and parts of an independent prototype.
-->

The [object identity](../settings/35-objects.md#bench) and the [space of use](../settings/30-interiors.md#fountain) are the parents of this prototype. It compares the form and spatial relations of [reference images 01, 03 and 05](../settings/50-production.md#references), and the existence of the object comes from the user's 2026-09-25 instruction to make all objects. The dimensions and joints below are model decisions within that range.

The bench is a stone slab without backrest or armrests on two separate stone piers. The local origin is the ground centre, and the front is +Z. The base width is W=1.40m and the short variant W=1.10m, and the other values are shared. The top slab has thickness 0.06m and depth 0.45m, with top face Y=0.46m. The piers have width 0.12m and depth 0.36m, and their two centres are X=±(W/2−0.17)m. The piers are Y=0~0.40m, and the top slab is Y=0.40~0.46m, so they are in contact, and the middle underneath is open. The base-form occupancy box is 1.40×0.46×0.45m, and the short variant substitutes only W.

It serves as a waiting furnishing at the edges of the main door, courtyard and colonnade, but instances sets the real quantity and the positions outside passages.

Part map: `seat`=top slab; `pier`=pier.

Parts and surfaces are `seat` and `pier`. The top face of `seat` is the used face, and the material grain is taken later by materials. From the front and side of the review board, the 0.40m open lower part and the separation of the two piers are viewed. A pier away from the ground or a closed box-shaped bench is a failure.

The UV0 of the bench `seat` and the two `pier` is the default planar projection along the outward normal of each top and side face. The 0.40m open lower part is not filled, and seams lie at the butts of the piers and the top slab.

## Small portable lamp {#portable-lamp}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The 0.24×0.28×0.24m small lamp fits the range of hand-held furnishings; the round sides of `foot`, `stem` and `dish` use a Y-axis solid-of-revolution UV with a +X seam, and the dish interior a separate lowest-ring V.
@evidenceExclude settings/00-delivery.md#delivery-scope The delivered space list and viewer promise belong to spaces and the viewer, and the object kinds of model prototypes come from the individual identities of 35-objects and 30-interiors.
@evidence principles/core/common.md#scope-preservation This H2 sets together the form, parts, occupancy range, review and instances placement ownership of the movable furnishing separate from the tall sanctuary lampstand.
@evidence principles/core/common.md#substantive-completion It sets the ranges of foot, stem and concave dish, the joining heights and the 16-segment round faces.
@evidence principles/core/common.md#declared-basis The first paragraph distinguishes the 2026-09-25 user instruction to make objects as the existence scope, 35-objects#portable-lamp and 20-envelope#entrance-porch, 30-interiors#fountain, #offering-room and #administration as parent authority, the reference images as visual basis, and dimensions and joints as model decisions.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It narrows the movable furnishing of 35-objects#portable-lamp, separate from the tall sanctuary lampstand, to a local origin, shape dimensions, parts and surfaces and a reviewable occupancy box.
@evidence principles/design/models.md#representation-contract It sets foot, stem and dish, the dish open upward and a flameless proxy.
@evidence principles/design/models.md#spatial-convention It sets the floor-centre origin and the 0.24×0.28×0.24m occupancy box.
@evidence principles/design/models.md#reviewable-structure From the side it checks that the dish depth and the thin stand do not merge into one cylinder.
@evidence principles/design/models.md#model-observable-style-basis It varies the shallow dish and dark metal silhouette of images 02 and 04 at a small scale.
@evidence principles/design/models.md#model-scale-layer-completion The scale difference between the large lampstand and the small lamp and the surface boundaries are set, so the furnishings of each room use the same prototype.
@evidence settings/30-interiors.md#services It applies the unlit lamp state to the small furnishing too.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work There was no owner for a small movable furnishing distinct from the tall lampstand of 35-objects#lampstands, so 35-objects#portable-lamp was created and added to the main door list of 20-envelope#entrance-porch and the courtyard, offering room and office room lists of 30-interiors. The identity separate from the lampstand was set first, then the shape prose was written.
@evidence settings/35-objects.md#portable-lamp It takes the existence, form range and state of the movable furnishing separate from the tall sanctuary lampstand and derives the dimensions and parts of an independent prototype.
-->

The [object identity](../settings/35-objects.md#portable-lamp) and the spaces of use of the [main door](../settings/20-envelope.md#entrance-porch), [courtyard](../settings/30-interiors.md#fountain), [offering room](../settings/30-interiors.md#offering-room) and [office](../settings/30-interiors.md#administration) are the parents of this prototype. It compares the form and spatial relations of [reference images 02 and 04](../settings/50-production.md#references), and the existence of the object comes from the user's 2026-09-25 instruction to make all objects. The dimensions and joints below are model decisions within that range.

This lamp is a movable furnishing separate from the [tall metal lampstand](fixtures.md#lampstand), and the working of oil, wick and flame is not shown. The same furnishing is used at the main door, courtyard, offering room and office. The local origin is the centre of the foot bottom. The foot is a 16-segment disc of radius 0.10m and height 0.035m, the stem is a cylinder of radius 0.012m at Y=0.035~0.23m, and the dish is an open flat-bottomed cup of outer radius 0.12m at Y=0.23~0.28m. The dish inner radius is 0.105m, the bottom thickness 0.008m, and the top ring thickness 0.015m. The stem touches the foot top face and the dish underside respectively. The occupancy box is 0.24×0.28×0.24m.

instances sets the real position and quantity.

Part map: `foot`=foot; `stem`=stem; `dish`=dish.

Parts and surfaces are `foot`, `stem` and `dish`. The three solids of revolution have 16 segments around, and the dish inner face has its own normals and UV seam. On the review board the real concavity of the round dish and the stem end contact are viewed. Adding a flame or turning the dish into a closed disc is a failure.

The `foot`, `stem` and `dish` of the small lamp unwrap UV0 as a circumference arc-length U from a +X seam and a section generatrix V. The concave dish interior is separated from the outside, and the lower disc is projected planarly.

## Two-place jar rack {#jar-rack}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The timber `top` of the 1.18×0.28×0.58m two-place rack takes a +X U and the square `leg` a +Y U, the two well walls owned by the top slab take a Y-axis circumference U and generatrix V, and the `well` floor a planar UV.
@evidence principles/core/common.md#scope-preservation This H2 sets together the form, parts, occupancy range, review and instances placement ownership of the storage room furniture that holds two jars.
@evidence principles/core/common.md#substantive-completion It sets the dimensions of the top slab, two wells and four legs, the open underside, and the well radius 0.16m larger than the storage jar base radius 0.10m.
@evidence principles/core/common.md#declared-basis The first paragraph distinguishes the 2026-09-25 user instruction to make objects as the existence scope, 35-objects#jar-rack and 30-interiors#storage as parent authority, the reference images as visual basis, and dimensions and joints as model decisions.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It narrows the storage room furniture of 35-objects#jar-rack that holds two jars to a local origin, shape dimensions, parts and surfaces and a reviewable occupancy box.
@evidence principles/design/models.md#representation-contract It sets the real shallow wells and contact faces of top, leg and well and does not re-author the jars themselves.
@evidence principles/design/models.md#spatial-convention It sets the floor-centre origin, the front on +Z and the 1.18×0.28×0.58m occupancy.
@evidence principles/design/models.md#reviewable-structure It views the two wells, four legs and the opening under the top slab from above and the side.
@evidence principles/design/models.md#model-observable-style-basis It reads as a low timber rack that does not cover the separate stored objects of images 02 and 05 with one large box.
@evidence principles/design/models.md#model-scale-layer-completion The two well radii 0.16m are larger than the bases of the storage jar and the carrying jar, fixing one rack size group.
@evidence settings/30-interiors.md#storage It is a rack placed so that the wall-side goods of the storage room leave a passage.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work The storage room furniture holding two jars had no settings identity owner, so 35-objects#jar-rack was created and added to the room list of 30-interiors#storage. The shape prose was set after this parent repair.
@evidence settings/35-objects.md#jar-rack It takes the existence, form range and state of the storage room furniture holding two jars and derives the dimensions and parts of an independent prototype.
-->

The [object identity](../settings/35-objects.md#jar-rack) and the [space of use](../settings/30-interiors.md#storage) are the parents of this prototype. It compares the form and spatial relations of [reference images 02 and 05](../settings/50-production.md#references), and the existence of the object comes from the user's 2026-09-25 instruction to make all objects. The dimensions and joints below are model decisions within that range.

The rack is not a prototype of the two jars but an independent low timber piece of furniture under them. instances sets the real position and quantity. The local origin is the floor centre, the long side is X, and the front is +Z. The top slab has width 1.18m, depth 0.58m and thickness 0.06m and lies at Y=0.22~0.28m. The four legs are square 0.07m, with centres (X,Z)=(±0.52,±0.22)m, and at Y=0~0.22m they touch the top slab. The two round wells of the top slab are at centre X=±0.29m, Z=0, with radius 0.16m and depth 0.012m, open upward, and do not penetrate the board. `top` owns the intact lower board at Y=0.22~0.268m and the board outside the two round holes and the hole walls at Y=0.268~0.28m. `well` owns only the Y=0.268m floor face of each of the two holes and, being a zero-thickness face, shares no volume with `top`. The well floor is the instance support datum of the jar, and instances makes the real contact judgement. The occupancy box is 1.18×0.28×0.58m.

The round side walls of the wells are the inner faces of the holes in `top`, and `well` owns only the well floor at Y=0.268m. The well radius 0.16m is larger than the base radius 0.10m of the [storage jar](wares.md#storage-jar) and the base radius 0.07m of the [carrying jar](wares.md#carry-jar). The top slab solid under the `well` floor continues into `top`, and the two parts do not emit the same volume twice.

Part map: `top`=top slab; `leg`=leg; `well`=well floor.

Parts and surfaces are `top`, `leg` and `well`. The well circumference has 16 segments. On the review board the two empty wells are checked from above and the open underside from the side. A board whose wells penetrate it, or a board without wells that clashes with the ceramics, is a failure.

The long top slab of the two-place rack `top` takes +X across its width, and the four `leg` +Y upward from the floor, as the U of UV0. The two round well walls belonging to `top` unwrap as a Y-axis circumference arc-length U and generatrix V from a +X seam, and the `well` floor has a separate seam with a horizontal planar projection.

## Two-handed carrying yoke {#carrying-yoke}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The X length of the 1.16×0.17×0.12m yoke is set to the two-handed carrying width; the timber `beam` takes a −X→+X long-axis U, and the `hook` at both ends a large-circle and tube-section arc-length UV of a YZ torus.
@evidence principles/core/common.md#scope-preservation This H2 sets together the form, parts, occupancy range, review and instances placement ownership of the carrying furnishing set down in the service yard.
@evidence principles/core/common.md#substantive-completion It sets the dimensions, centres and contact of the bar and hooks and the fixed state, so it is not mistaken for a load calculation.
@evidence principles/core/common.md#declared-basis The first paragraph distinguishes the 2026-09-25 user instruction to make objects as the existence scope, 35-objects#carrying-yoke and 30-interiors#service-yard as parent authority, the reference images as visual basis, and dimensions and joints as model decisions.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It narrows the carrying furnishing of 35-objects#carrying-yoke set down in the service yard to a local origin, shape dimensions, parts and surfaces and a reviewable occupancy box.
@evidence principles/design/models.md#representation-contract It sets the separation of beam and hook and the hook holes and includes no rope or load.
@evidence principles/design/models.md#spatial-convention It sets the bar-centre origin, the +X long axis and the 1.16×0.17×0.12m occupancy.
@evidence principles/design/models.md#reviewable-structure It views both ends of the thin beam and the voids inside the two hooks on the ±X end elevations.
@evidence principles/design/models.md#model-observable-style-basis It reads the hand-carrying scale of the yard as a composition of a simple straight timber and metal hooks.
@evidence principles/design/models.md#model-scale-layer-completion It fixes the range of the hooks at both ends and excludes any lifting motion after placement.
@evidence settings/30-interiors.md#service-yard It belongs to the few carried goods of the open work yard.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work The carrying furnishing set down in the service yard had no settings identity owner, so 35-objects#carrying-yoke was created and added to the room list of 30-interiors#service-yard. The shape prose was set after this parent repair.
@evidence settings/35-objects.md#carrying-yoke It takes the existence, form range and state of the carrying furnishing set down in the service yard and derives the dimensions and parts of an independent prototype.
-->

The [object identity](../settings/35-objects.md#carrying-yoke) and the [space of use](../settings/30-interiors.md#service-yard) are the parents of this prototype. It compares the form and spatial relations of [reference images 02 and 05](../settings/50-production.md#references), and the existence of the object comes from the user's 2026-09-25 instruction to make all objects. The dimensions and joints below are model decisions within that range.

The yoke is in the fixed state of being set down when not in use. The local origin is the bar centre, and the long axis is +X. The timber beam is X=−0.58~0.58m, Y=−0.025~0.025m, Z=−0.025~0.025m. The metal hooks at both ends are 16×8-segment tori in the YZ plane with outer radius 0.06m and inner radius 0.04m, at centre X=±0.50m, Y=−0.085m, Z=0. The hook top face Y=−0.025m touches the beam underside, and the inside of the hook is empty. The occupancy box is 1.16×0.17×0.12m.

instances sets the real position and quantity.

Part map: `beam`=beam; `hook`=hook.

Parts and surfaces are `beam` and `hook`. The two hooks are repeats of the same shape, and the first centre is on the −X side. On the ±X end elevations of the review board, the two hook holes and the separation of timber and metal members are viewed. Real load strength or carrying motion is not claimed.

The yoke `beam` increases the timber grain U of UV0 from the local −X end to the +X end, and the two `hook` unwrap with the centreline and tube circumference arc lengths of a YZ-plane torus. The beam ends and the hook anchor points are separate seams.

## Small handcart {#handcart}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The long deck of the 0.76×0.72×1.80m handcart is a fixed shape that can be pushed beside the walking envelope; `deck`, `handle` and `support` take their long axes as U, and the X-axis `axle` and `wheel` a circumference U and axial length V.
@evidence principles/core/common.md#scope-preservation This H2 sets together the form, parts, occupancy range, review and instances placement ownership of the outdoor prop of the service yard with stopped wheels.
@evidence principles/core/common.md#substantive-completion It sets the closed ranges and ground contact of the deck, two wheels, axle and handles.
@evidence principles/core/common.md#declared-basis The first paragraph distinguishes the 2026-09-25 user instruction to make objects as the existence scope, 35-objects#handcart and 30-interiors#service-yard as parent authority, the reference images as visual basis, and dimensions and joints as model decisions.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It narrows the outdoor prop with stopped wheels of 35-objects#handcart in the service yard to a local origin, shape dimensions, parts and surfaces and a reviewable occupancy box.
@evidence principles/design/models.md#representation-contract It sets the separation of deck, axle, wheel and handle, the open underside and the stationary wheels.
@evidence principles/design/models.md#spatial-convention It sets the origin at the floor centre below the axle, the front on +Z, and the 0.76×0.72×1.80m occupancy that is the union of the parts.
@evidence principles/design/models.md#reviewable-structure It checks the ground contact of the two wheels and the void under the deck from the front and side.
@evidence principles/design/models.md#model-observable-style-basis It limits the silhouette to a handcart, not a rough wagon, for small outdoor deliveries.
@evidence principles/design/models.md#model-scale-layer-completion It fixes the deck, wheels, axle, handles and supports of the 0.76m wide handcart stopped in the service yard as one occupancy box.
@evidence settings/30-interiors.md#service-yard It receives it as a furnishing of the work yard with an outside delivery door.
@evidence settings/10-building.md#use-profile It follows the boundary of a stationary outdoor prop that proves neither wheel rolling nor door passage.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work The wheeled-carrying exclusion of 10-building#use-profile was repaired to allow stationary outdoor props, and the identity and room list of 35-objects#handcart and 30-interiors#service-yard were set first. The deck, wheels, axle and handles were designed within that boundary.
@evidence settings/35-objects.md#handcart It takes the existence, form range and state of the outdoor prop with stopped wheels in the service yard and derives the dimensions and parts of an independent prototype.
-->

The [object identity](../settings/35-objects.md#handcart) and the [space of use](../settings/30-interiors.md#service-yard) are the parents of this prototype. It compares the form and spatial relations of [reference images 01, 02 and 05](../settings/50-production.md#references), and the existence of the object comes from the user's 2026-09-25 instruction to make all objects. The dimensions and joints below are model decisions within that range.

The handcart is a small empty carrier with two wheels and two long handles attached. The local origin is the ground below the horizontal centre of the wheel axle, and the front is +Z. The wheel centres are (X,Y,Z)=(±0.34,0.23,0.10)m, with radius 0.23m and thickness 0.08m, as X-axis cylinders of revolution with 16 segments. The outer X ends of the two wheels are ±0.38m. The axle is a cylinder of radius 0.018m spanning X=−0.34~0.34m, Y=0.23m, Z=0.10m. The deck is X=−0.30~0.30m, Y=0.43~0.49m, Z=−0.65~0.60m. The handles continue as two square timbers at X=±0.24m from the deck back Z=−0.65m to Z=−1.20m and rise over Y=0.43~0.72m. The wheel bottoms are in contact with the ground at Y=0, and the middle under the deck is open. The occupancy box is 0.76×0.72×1.80m.

The axle cylinder has 16 segments around. Between the deck underside Y=0.43m and the axle top face Y=0.248m, centred at (X,Z)=(±0.24,0.10)m with an X and Z section of 0.04m each, two vertical timber supports join them. The Y range of the supports is 0.248~0.43m, and their top face touches the deck and their underside the axle. The supports are Z=0.08~0.12m. The two handles are square timbers of X width 0.04m and vertical thickness 0.04m. The centrelines are straight lines at X=±0.24m from (Y,Z)=(0.45,−0.65)m to (0.70,−1.20)m, and the section is translated along the centreline. The handles are Z=−1.20~−0.65m. The start face overlaps the back section of the deck and is fixed there, and the occupied height of the end is Y=0.72m.

Each end of the axle enters 0.04m in the X direction from the inner face of each wheel and is fixed at the wheel centre.

instances sets the real position and quantity.

Part map: `deck`=deck; `axle`=axle; `wheel`=wheel; `handle`=handle; `support`=support.

Parts and surfaces are `deck`, `axle`, `wheel`, `handle` and `support`. The wheels are stationary fixed members, and there is no rolling animation interface. On the review board the same ground contact of the two wheels, the supports running from the axle to the deck, the void under the deck and the rear handles are viewed. No load capacity is claimed from appearance.

The long +Z of the handcart `deck`, the backward-extending axis of the two `handle` and the +Y of the vertical `support` are each the U of UV0. The `axle` and two `wheel` unwrap with an X-axis cylinder circumference U turning from +Z to +Y and a +X axial length V.

## Bucket with handle {#bucket}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The conservative 0.315×0.4502×0.30m bucket including the handle stays within a hand-held envelope; the inside and outside of `body` use separate Y-axis solid-of-revolution UVs, and `handle` a +X anchor→−X anchor tube arc-length UV.
@evidence principles/core/common.md#scope-preservation This H2 sets together the form, parts, occupancy range, review and instances placement ownership of the yard vessel with an open mouth and a handle.
@evidence principles/core/common.md#substantive-completion It sets the base, widened mouth, inner floor and 16 body segments, and the two anchor points, top and 12-span path of the half-ellipse handle.
@evidence principles/core/common.md#declared-basis The first paragraph distinguishes the 2026-09-25 user instruction to make objects as the existence scope, 35-objects#bucket and 30-interiors#service-yard as parent authority, the reference images as visual basis, and dimensions and joints as model decisions.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It narrows the yard vessel with an open mouth and a handle of 35-objects#bucket to a local origin, shape dimensions, parts and surfaces and a reviewable occupancy box.
@evidence principles/design/models.md#representation-contract It sets body and handle, the open mouth, the real inner floor and the void under the handle.
@evidence principles/design/models.md#spatial-convention From the floor-centre origin it distinguishes the smooth hull 0.315×0.45×0.30m from the real polyhedron's Y of about 0.450114m and sets the occupancy box 0.315×0.4502×0.30m that wraps it.
@evidence principles/design/models.md#reviewable-structure From the side it checks that the handle loop and inner depth are distinguishable from a ceramic jar.
@evidence principles/design/models.md#model-observable-style-basis It adopts the widened mouth and single loop silhouette of a low tool for carrying water.
@evidence principles/design/models.md#model-scale-layer-completion It sets a size smaller than the basin, an open boundary and the ownership of per-room repetition, closing the bucket role.
@evidence settings/30-interiors.md#service-yard It receives it as a furnishing moved by hand in the outdoor work yard.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work The yard vessel with an open mouth and a handle had no settings identity owner, so 35-objects#bucket was created and added to the room list of 30-interiors#service-yard. The shape prose was set after this parent repair.
@evidence settings/35-objects.md#bucket It takes the existence, form range and state of the yard vessel with an open mouth and a handle and derives the dimensions and parts of an independent prototype.
-->

The [object identity](../settings/35-objects.md#bucket) and the [space of use](../settings/30-interiors.md#service-yard) are the parents of this prototype. It compares the form and spatial relations of [reference images 02 and 05](../settings/50-production.md#references), and the existence of the object comes from the user's 2026-09-25 instruction to make all objects. The dimensions and joints below are model decisions within that range.

The bucket is a fixed empty vessel, and a water surface or a real contained amount is absent from the model. The local origin is the floor centre. The body outside is a 16-segment frustum widening from radius 0.11m at Y=0 to radius 0.15m at Y=0.28m. The bottom thickness is 0.02m, and the inside is open from radius 0.095m at Y=0.02m up to radius 0.135m under the mouth. The handle is a tube along a half-ellipse centreline in the XY plane, with tube radius 0.01m and 8 segments around. The space under the middle of the handle is empty.

The handle centreline is set as a half-ellipse. t=0..π is divided into 12 equal parts, and each point is placed at (X,Y,Z)=(0.1475 cos t,0.27+0.17 sin t,0)m, passing exactly through the ends (±0.1475,0.27)m and the top (0,0.44)m. The outer X of the smooth tube hull is ±0.1575m and its top Y is 0.45m, and the contact centre enters the body outer face by about 0.0011m, while the whole 12-span octagonal tube does not touch the inner wall. This smooth reference hull box is 0.315×0.45×0.30m. The real 12-span octagonal tube reaches Y of about 0.450114m at the mitre vertices. The occupancy box is 0.315×0.4502×0.30m, a conservative bound that generously wraps the real polyhedral union. The X width of the real polyhedron is about 0.3149m.

Both ends of the handle tube enter the body wall and are fixed, and part of the end discs shows outside the body. An open void remains between the middle arc and the body.

This bucket is a separate empty vessel smaller than the [courtyard fountain](fixtures.md#fountain). instances takes the placement role of a furnishing moved by hand in the courtyard and service yard, and there is no real carrying motion.

Part map: `body`=body; `handle`=handle.

Parts and surfaces are `body` and `handle`. The inner face of `body` has its own normals and UV seam. On the review board the widened mouth and the real void of the half-ellipse handle are viewed. The partial exposure of the end discs reads as part of the joint, and a shape whose handle end rings are not inserted into the body, whose handle floats off the body, or whose mouth is closed is a failure.

The inside and outside of the bucket `body` each unwrap UV0 with a circumference U and generatrix V from their own +X seam. The half-ellipse `handle` takes the centreline arc length from the +X start point to the −X end point as U and the tube circumference as V, with seams at both tube ends.

## Low planter with soil {#planter}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The 0.42×0.36×0.42m low planter fits the low furnishing range of the porch passage; the round `pot` sides use a solid-of-revolution UV with a +X seam, and the horizontal exposed `soil` face a planar UV.
@evidence principles/core/common.md#scope-preservation This H2 sets together the form, parts, occupancy range, review and instances placement ownership of the soil planter at the courtyard edge.
@evidence principles/core/common.md#substantive-completion It sets the heights of the base, rim, inner wall and soil face and the empty space above.
@evidence principles/core/common.md#declared-basis The first paragraph distinguishes the 2026-09-25 user instruction to make objects as the existence scope, 35-objects#planter and 30-interiors#fountain as parent authority, the reference images as visual basis, and dimensions and joints as model decisions.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It narrows the soil planter at the courtyard edge of 35-objects#planter to a local origin, shape dimensions, parts and surfaces and a reviewable occupancy box.
@evidence principles/design/models.md#representation-contract It sets the pot and soil surfaces, the open top and the separate placement of plants on the soil.
@evidence principles/design/models.md#spatial-convention It sets the floor-centre origin and the 0.42×0.36×0.42m occupancy.
@evidence principles/design/models.md#reviewable-structure In plan it checks that the soil face is below the ceramic rim and the top of the planter is open.
@evidence principles/design/models.md#model-observable-style-basis A simple wide-mouthed ceramic and a small soil face avoid exaggerating garden ornament.
@evidence principles/design/models.md#model-scale-layer-completion It hands plant instances and positions to instances and closes only the boundary of ceramic and soil in this prototype.
@evidence settings/40-environment.md#vegetation It receives low vegetation as individual plant prototypes, and the planter itself does not stand in for a tree.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work The soil planter at the courtyard edge had no settings identity owner, so 35-objects#planter was created and added to the room list of 30-interiors#fountain. The shape prose was set after this parent repair.
@evidence settings/35-objects.md#planter It takes the existence, form range and state of the soil planter at the courtyard edge and derives the dimensions and parts of an independent prototype.
-->

The [object identity](../settings/35-objects.md#planter) and the [space of use](../settings/30-interiors.md#fountain) are the parents of this prototype. It compares the form and spatial relations of [reference images 01 and 03](../settings/50-production.md#references), and the existence of the object comes from the user's 2026-09-25 instruction to make all objects. The dimensions and joints below are model decisions within that range.

The planter is a wide ceramic piece placed outside. The local origin is the floor centre. The outer body widens from base radius 0.14m to mouth radius 0.21m over Y=0~0.36m, and the inside is open from radius 0.12m to 0.19m from the floor Y=0.03m. The rim has radial thickness 0.02m. The exposed soil surface is a closed soil volume with underside Y=0.03m at radius 0.12m and top face Y=0.270m at radius 0.165m, 0.09m below the rim. The plants above it are instances of the [grass prototype](landscape.md#grass-tuft), and the soil surface itself makes no planting holes. Round faces have 16 segments. The occupancy box is 0.42×0.36×0.42m.

At Y=0.270m the inner wall radius is 0.12+(0.19−0.12)(0.270−0.03)/(0.36−0.03)≈0.1709m. The top radius of the soil surface is set at 0.165m, leaving a gap of about 0.0059m to the inner wall. The soil surface underside lies on the pot inner floor Y=0.03m, touching it.

instances sets the real position and quantity.

Part map: `pot`=pot; `soil`=soil surface.

Parts and surfaces are `pot` and `soil`. `soil` is a closed volume continuing from the floor to the exposed top face and does not emit volume overlapping `pot`. On the plan and side of the review board it is checked that the soil surface sits inside the rim and does not pierce the outer wall. The kind and number of plants are not the shape of this model.

The outside and inside of the planter `pot` each unwrap a circumference U and generatrix V from a +X seam. The top face of `soil` uses a planar UV0 along the +Y outward normal, with seams at the part boundary of rim and soil.

## Plain votive plaque {#votive-plaque}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The 0.36×0.42×0.14m votive plaque is a small solid plate to stand on a desk or altar, and each rectangular exposed face of the letterless `base` and `slab` uses the default planar UV.
@evidence principles/core/common.md#scope-preservation This H2 sets together the form, parts, occupancy range, review and instances placement ownership of the letterless plaque of the offering room.
@evidence principles/core/common.md#substantive-completion It sets the base width and front and back stable faces and the plaque height, thickness and contact.
@evidence principles/core/common.md#declared-basis The first paragraph distinguishes the 2026-09-25 user instruction to make objects as the existence scope, 35-objects#votive-plaque and 30-interiors#offering-room as parent authority, the reference images as visual basis, and dimensions and joints as model decisions.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It narrows the letterless plaque of the offering room of 35-objects#votive-plaque to a local origin, shape dimensions, parts and surfaces and a reviewable occupancy box.
@evidence principles/design/models.md#representation-contract It sets the separation of base and slab, the front and back planes, and the absence of letters or images on the slab itself.
@evidence principles/design/models.md#spatial-convention It sets the floor-centre origin, the front on +Z and the 0.36×0.42×0.14m occupancy.
@evidence principles/design/models.md#reviewable-structure From the front and side it checks that the thin slab stands on a low foot.
@evidence principles/design/models.md#model-observable-style-basis It makes a small votive marker with an outline and a blank slab instead of a readable inscription.
@evidence principles/design/models.md#model-scale-layer-completion It sets a one-size prototype as an offering room prop and includes no content letters.
@evidence settings/10-building.md#civic-identity It does not make fake inscriptions in an ancient language on object surfaces either.
@evidence settings/30-interiors.md#offering-room It is placed as one kind of small hand-held offering.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work The letterless plaque of the offering room had no settings identity owner, so 35-objects#votive-plaque was created and added to the room list of 30-interiors#offering-room. The shape prose was set after this parent repair.
@evidence settings/35-objects.md#votive-plaque It takes the existence, form range and state of the letterless plaque of the offering room and derives the dimensions and parts of an independent prototype.
-->

The [object identity](../settings/35-objects.md#votive-plaque) and the [space of use](../settings/30-interiors.md#offering-room) are the parents of this prototype. It compares the form and spatial relations of [reference images 02 and 04](../settings/50-production.md#references), and the existence of the object comes from the user's 2026-09-25 instruction to make all objects. The dimensions and joints below are model decisions within that range.

The votive plaque is a small rectangular slab with no letters to write or read. The local origin is the centre of the base bottom, and the front is +Z. The base is a box of width 0.36m, depth 0.14m and height 0.04m. The slab has width 0.32m, height 0.38m and thickness 0.035m and rises at the centre over Y=0.04~0.42m, touching the base top face. There are no carved letters, images or real donor names. The occupancy box is 0.36×0.42×0.14m.

instances sets the real position and quantity.

Part map: `base`=base; `slab`=slab.

Parts and surfaces are `base` and `slab`. From the front and side of the review board it is checked that the slab and base touch and that the thickness of the rectangular slab remains. If letters read or it stands in the air without a base, it is a failure.

The UV0 of the votive plaque `base` and `slab` is the default planar projection along the outward normal of the slab front and back and of the base top and sides. Seams lie at the butt where the slab stands on the base and at the edges of the plain slab.

## Low offering tray {#offering-tray}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The 0.52×0.055×0.34m tray keeps the size of a low hand-held furnishing and an open middle, and sets the planar UVs of the `floor` and the four `rim` boards by each outward normal.
@evidence principles/core/common.md#scope-preservation This H2 sets together the form, parts, occupancy range, review and instances placement ownership of the shallow tray that gathers bowls.
@evidence principles/core/common.md#substantive-completion It sets the width, thickness and contact of the floor board and four rims and the empty inner range.
@evidence principles/core/common.md#declared-basis The first paragraph distinguishes the 2026-09-25 user instruction to make objects as the existence scope, 35-objects#offering-tray and 30-interiors#offering-room as parent authority, the reference images as visual basis, and dimensions and joints as model decisions.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It narrows the shallow tray that gathers bowls of 35-objects#offering-tray to a local origin, shape dimensions, parts and surfaces and a reviewable occupancy box.
@evidence principles/design/models.md#representation-contract It sets the closed boards of floor and rim, the open top and the separate instances of the bowls it holds.
@evidence principles/design/models.md#spatial-convention It sets the floor-centre origin and the 0.52×0.055×0.34m occupancy.
@evidence principles/design/models.md#reviewable-structure It views the open middle and the four rims from above and the real depth from the side.
@evidence principles/design/models.md#model-observable-style-basis The low thin border is visually distinct from the large stone top slab of the table.
@evidence principles/design/models.md#model-scale-layer-completion The seat height for dishes and small ceramics is set, so only the placement is left to instances.
@evidence settings/30-interiors.md#offering-room It takes the role of gathering small offering vessels on the table.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work The shallow tray that gathers bowls had no settings identity owner, so 35-objects#offering-tray was created and added to the room list of 30-interiors#offering-room. The shape prose was set after this parent repair.
@evidence settings/35-objects.md#offering-tray It takes the existence, form range and state of the shallow tray that gathers bowls and derives the dimensions and parts of an independent prototype.
-->

The [object identity](../settings/35-objects.md#offering-tray) and the [space of use](../settings/30-interiors.md#offering-room) are the parents of this prototype. It compares the form and spatial relations of [reference images 02 and 04](../settings/50-production.md#references), and the existence of the object comes from the user's 2026-09-25 instruction to make all objects. The dimensions and joints below are model decisions within that range.

The tray is a rectangle in which four low borders surround an open floor. The local origin is the centre of the bottom face, and the long side is X. The floor has width 0.52m, depth 0.34m and thickness 0.018m. The four rims are 0.015m thick inward from the outer floor edge and rise over Y=0.018~0.055m, butting at the corners. The effective inner plane is 0.49×0.31m and opens at the floor top face Y=0.018m. The occupancy box is 0.52×0.055×0.34m.

The two X-direction front and back rims occupy X=−0.26~0.26m with Z=−0.17~−0.155m and Z=0.155~0.17m respectively. The two Z-direction left and right rims occupy X=−0.26~−0.245m and X=0.245~0.26m with Z=−0.155~0.155m respectively. The corners butt face to face, but the rims share no volume.

instances sets the placement for gathering small bowls on the [offering table](fixtures.md#offering-table) of the offering room or the sanctuary altar, and the number of bowls.

Part map: `floor`=floor; `rim`=rim.

Parts and surfaces are `floor` and `rim`. The `rim` row is the union range of the four outer boards, not a box filling the middle. On the plan and side of the review board the empty middle and the butts of the four borders are viewed. A disc indistinguishable from one shallow bowl is a failure.

The UV0 of the tray `floor` and the four-sided `rim` uses a planar projection per outward normal for the horizontal floor and each vertical border. The open middle is not filled with a board, and seams lie at the four corners and part boundaries.

## Folded textile {#textile}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The 0.55×0.045×0.40m folded textile lies on desk and shelf tops, and within one `cloth` the top and bottom faces of the two layers and the fold bands are each split with planar UVs.
@evidence principles/core/common.md#scope-preservation This H2 sets together the form, parts, occupancy range, review and instances placement ownership of the folded cover cloth distinct from the floor cushion.
@evidence principles/core/common.md#substantive-completion It sets the width, depth and thickness parameters, the folded ends and the floor contact.
@evidence principles/core/common.md#declared-basis The first paragraph distinguishes the 2026-09-25 user instruction to make objects as the existence scope, 35-objects#textile and 30-interiors#storage as parent authority, the reference images as visual basis, and dimensions and joints as model decisions.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It narrows the folded cover cloth of 35-objects#textile, distinct from the floor cushion, to a local origin, shape dimensions, parts and surfaces and a reviewable occupancy box.
@evidence principles/design/models.md#representation-contract It sets the two faces, thickness and fold boundaries of the cloth and excludes fine weave.
@evidence principles/design/models.md#spatial-convention It sets the bottom-face-centre origin, the front on +Z and the 0.55×0.045×0.40m base occupancy.
@evidence principles/design/models.md#reviewable-structure From the side it checks that a thin but non-zero thickness and the two-layer fold read.
@evidence principles/design/models.md#model-observable-style-basis It conveys an everyday prop through a low fold outline without exaggerating the rough weave as shape.
@evidence principles/design/models.md#model-scale-layer-completion It sets the base folded cloth and the small cover variant that change only W, D and T, and hands material differences to materials.
@evidence settings/30-interiors.md#sanctuary The prop on the sanctuary altar does not hide the central hierarchy.
@evidence settings/30-interiors.md#storage It is a cover furnishing of the room that handles large vessels.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work The folded cover cloth distinct from the floor cushion had no settings identity owner, so 35-objects#textile was created and added to the room list of 30-interiors#storage. The shape prose was set after this parent repair.
@evidence settings/35-objects.md#textile It takes the existence, form range and state of the folded cover cloth distinct from the floor cushion and derives the dimensions and parts of an independent prototype.
-->

The [object identity](../settings/35-objects.md#textile) and the [space of use](../settings/30-interiors.md#storage) are the parents of this prototype. It compares the form and spatial relations of [reference images 04 and 05](../settings/50-production.md#references), and the existence of the object comes from the user's 2026-09-25 instruction to make all objects. The dimensions and joints below are model decisions within that range.

One folded cover cloth prototype is given only width W, depth D and thickness T. The base folded cloth is W=0.55m, D=0.40m, T=0.045m, and the small cover is a variant with W=0.42m, D=0.36m, T=0.03m. The [floor cushion](ritual.md#floor-cushion) is a separate prototype, not a variant of this textile. The local origin is the bottom face centre, and the front is +Z. The lower layer is Y=0~T/4 and the upper layer Y=3T/4~T, closed thin boards with an empty T/2 gap between them. The front and back fold bands have a rectangular section of Z=±(D/2−0.015)~±D/2m, Y=T/4~3T/4 and touch the two layers. Each band runs over X=−W/2~W/2m, and between the two layers at the left and right X ends it is open. The four corners are a blocking proxy limited to hard right angles, and the weave of threads, crease grain and seams are not geometry. The base-form occupancy box is 0.55×0.045×0.40m, and the variant substitutes W×T×D.

The per-room uses are the cloth on the sanctuary altar, the work cloths of the offering room, office and records room, and the covers of the large vessels in the storage room. instances sets positions and quantity so that no cloth hides the visual centre of the altar or a passage.

Part map: `cloth`=textile.

Parts and surfaces are `cloth`, and the upper and lower layers and the folded bands are different UV seams under one surface ID. From the side of the review board the two layers and the empty gap, the front and back fold bands and the contact with the face it lies on are viewed. If the two layers look like one solid board, it is a failure. Invisible textile properties are not inferred from the shape.

The two flat boards and the front and back folded bands of the folded `cloth` each use the default UV0 per outward normal, and at the folded edges vertices are copied even within the same part to place seams. The empty height between the two layers is not filled with faces for a pattern.

## Writing stylus {#stylus}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The 0.22×0.012×0.012m stylus is a writing tool size; the X-axis `shaft` takes a +Z→+Y circumference U and +X length V, and the sloped `tip` faces planar UVs of their outward normals.
@evidence principles/core/common.md#scope-preservation This H2 sets together the form, parts, occupancy range, review and instances placement ownership of the stylus on the writing desk.
@evidence principles/core/common.md#substantive-completion It sets the length, thickness, tip contact and cylinder segments, fixing the minimum shape that reads on a desk.
@evidence principles/core/common.md#declared-basis The first paragraph distinguishes the 2026-09-25 user instruction to make objects as the existence scope, 35-objects#stylus and 30-interiors#administration as parent authority, the reference images as visual basis, and dimensions and joints as model decisions.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It narrows the stylus on the writing desk of 35-objects#stylus to a local origin, shape dimensions, parts and surfaces and a reviewable occupancy box.
@evidence principles/design/models.md#representation-contract It sets the contact of shaft and tip and an exterior with no carved letters.
@evidence principles/design/models.md#spatial-convention It sets the central origin, the +X long axis and the 0.22×0.012×0.012m occupancy.
@evidence principles/design/models.md#reviewable-structure From above it checks that the thin rod and the cone of the tip are distinguishable.
@evidence principles/design/models.md#model-observable-style-basis It conveys the function through a thin rod and a point without exaggerated ornament.
@evidence principles/design/models.md#model-scale-layer-completion It is set as a prototype separate from the writing tablet and excludes the creation of real letters.
@evidence settings/30-interiors.md#administration It is an object placed with the tool vessel and on the workbench of the small writing room.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work The stylus on the writing desk had no settings identity owner, so 35-objects#stylus was created and added to the room list of 30-interiors#administration. The shape prose was set after this parent repair.
@evidence settings/35-objects.md#stylus It takes the existence, form range and state of the stylus on the writing desk and derives the dimensions and parts of an independent prototype.
-->

The [object identity](../settings/35-objects.md#stylus) and the [space of use](../settings/30-interiors.md#administration) are the parents of this prototype. It compares the form and spatial relations of [reference image 05](../settings/50-production.md#references), and the existence of the object comes from the user's 2026-09-25 instruction to make all objects. The dimensions and joints below are model decisions within that range.

The stylus is a small rod that sharpens in the local +X direction. It is a prototype separate from the [writing tablet](portable.md#writing-tablet) and makes no real letters. The origin is the middle of the overall length. The shaft is an 8-segment cylinder of X=−0.11~0.09m with radius 0.006m. The tip is an 8-segment cone narrowing from radius 0.006m to 0 over X=0.09~0.11m, in contact with the shaft end face. There are no grip patterns or real writing marks. The occupancy box is 0.22×0.012×0.012m.

It lies with the tool vessel on the desks of the office and records room, and instances sets the real position and rotation.

Part map: `shaft`=shaft; `tip`=tip.

Parts and surfaces are `shaft` and `tip`. On the review board it is checked that the joint has no gap and that the tip reads with a slope different from the shaft. instances sets the real placement and rotation on the desk.

The UV0 of the stylus `shaft` is an X-axis cylinder circumference U turning from a +Z seam toward +Y and a −X→+X length V. Each sloped triangular face of the pointed `tip` has seams split by the planar projection of its own outward normal.

## Letterless writing tablet {#writing-tablet}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The 0.28×0.025×0.22m writing tablet is a small work surface on a desk; each plane of the border `frame` and the low `writing-face` is projected with the default UV, and the central step is a seam.
@evidenceExclude settings/00-delivery.md#working-language The working language is no shape dimension or UV0 input of the writing tablet, and the production-language H2 of the models account covers the English notation of the prototype prose.
@evidence principles/core/common.md#scope-preservation This H2 sets together the form, parts, occupancy range, review and instances placement ownership of the letterless writing board.
@evidence principles/core/common.md#substantive-completion It sets the thickness and step of the outer board and inner face, closing a shape that can lie on a top slab.
@evidence principles/core/common.md#declared-basis The first paragraph distinguishes the 2026-09-25 user instruction to make objects as the existence scope, 35-objects#writing-tablet and 30-interiors#administration as parent authority, the reference images as visual basis, and dimensions and joints as model decisions.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It narrows the letterless writing board of 35-objects#writing-tablet to a local origin, shape dimensions, parts and surfaces and a reviewable occupancy box.
@evidence principles/design/models.md#representation-contract It sets the surface separation of frame and writing-face and the real recessed middle.
@evidence principles/design/models.md#spatial-convention It sets the bottom-face-centre origin and the 0.28×0.025×0.22m occupancy.
@evidence principles/design/models.md#reviewable-structure From above it checks that the four border sides and the low middle read.
@evidence principles/design/models.md#model-observable-style-basis It shows a writing tool with only a shallow work surface and a timber border, without writing letters.
@evidence principles/design/models.md#model-scale-layer-completion It is an independent board larger than the stylus but smaller than the desk top slab, closing the relation of the work room props.
@evidence settings/30-interiors.md#administration It is a prop on the desk of the small writing room where work has stopped.
@evidence settings/10-building.md#civic-identity It bans fake inscriptions and reproduced script on this object too.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work The letterless writing board had no settings identity owner, so 35-objects#writing-tablet was created and added to the room list of 30-interiors#administration. The shape prose was set after this parent repair.
@evidence settings/35-objects.md#writing-tablet It takes the existence, form range and state of the letterless writing board and derives the dimensions and parts of an independent prototype.
-->

The [object identity](../settings/35-objects.md#writing-tablet) and the [space of use](../settings/30-interiors.md#administration) are the parents of this prototype. It compares the form and spatial relations of [reference image 05](../settings/50-production.md#references), and the existence of the object comes from the user's 2026-09-25 instruction to make all objects. The dimensions and joints below are model decisions within that range.

The writing tablet is a shallow rectangular timber frame without letters. The origin is the bottom face centre, and the long side is X. It has outer width 0.28m, depth 0.22m and height 0.025m, and the border leaves a border of width 0.018m inward. The central writing face is a blank parchment face of thickness 0.001m at X=−0.122~0.122m, Z=−0.092~0.092m, with top face Y=0.014m. The central timber board is closed from bottom face Y=0 to top face Y=0.013m, and the writing face touches that top face, so they share no volume. There is a 0.011m step between the border top face Y=0.025m and the writing face. The occupancy box is 0.28×0.025×0.22m.

It serves as a blank writing face on the desks of the office and records room where work has stopped, and instances sets the spacing to the scrolls. The width 0.28m is larger than the 0.22m length of the [stylus](portable.md#stylus) and smaller than the 0.90m width of the [reading table](fixtures.md#desk), so they can lie on the same work surface.

Part map: `frame`=frame; `writing-face`=writing face.

Parts and surfaces are `frame` and `writing-face`. `writing-face` is the top face inside the frame, not a duplicated board volume. On the review board the central step is read and it is checked that there is no empty hole and no arbitrary letters.

The UV0 of the writing tablet `frame` and `writing-face` is a planar projection per outward normal of the horizontal writing face and the surrounding ledge. No letters or inscriptions are cut, and seams lie at the central step and the boundary of the two parts.

## Bundle of binding rope {#rope-coil}

<!--
@evidence contracts/principles-models.md#temple-reference-scale The 0.226×0.024×0.226m rope bundle is a small storage furnishing; the three XZ rings `rope` take a centreline arc-length U and tube circumference V, and the binding `tie` on top a planar UV.
@evidence principles/core/common.md#scope-preservation This H2 sets together the form, parts, occupancy range, review and instances placement ownership of the loose rings separate from the rope tied to records.
@evidence principles/core/common.md#substantive-completion It sets the three radii, tube thickness, band contact and segment counts, so the rope is not replaced by a flat picture.
@evidence principles/core/common.md#declared-basis The first paragraph distinguishes the 2026-09-25 user instruction to make objects as the existence scope, 35-objects#rope-coil and 30-interiors#storage as parent authority, the reference images as visual basis, and dimensions and joints as model decisions.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It narrows the loose rings of 35-objects#rope-coil, separate from the rope tied to records, to a local origin, shape dimensions, parts and surfaces and a reviewable occupancy box.
@evidence principles/design/models.md#representation-contract It sets the contact of rope and tie and the empty gaps between the three rings.
@evidence principles/design/models.md#spatial-convention It sets the floor-centre origin and the 0.226×0.024×0.226m occupancy.
@evidence principles/design/models.md#reviewable-structure It checks that the three lines and gaps show in plan and the small height from the side.
@evidence principles/design/models.md#model-observable-style-basis It conveys the small tool through the silhouette of three thick tori instead of a fine twist pattern.
@evidence principles/design/models.md#model-scale-layer-completion It closes the occupancy box of the loose stationary rings separate from the rope tied to documents and leaves the real placement and binding to instances.
@evidence settings/30-interiors.md#storage It is the place of the furnishing for tying goods in the storage room.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work The loose rings separate from the rope tied to records had no settings identity owner, so 35-objects#rope-coil was created and added to the room list of 30-interiors#storage. The shape prose was set after this parent repair.
@evidence settings/35-objects.md#rope-coil It takes the existence, form range and state of the loose rings separate from the rope tied to records and derives the dimensions and parts of an independent prototype.
-->

The [object identity](../settings/35-objects.md#rope-coil) and the [space of use](../settings/30-interiors.md#storage) are the parents of this prototype. It compares the form and spatial relations of [reference images 02 and 05](../settings/50-production.md#references), and the existence of the object comes from the user's 2026-09-25 instruction to make all objects. The dimensions and joints below are model decisions within that range.

The rope bundle is three concentric rings laid down, not real coiling mechanics. The local origin is the floor centre, and the ring centres are all (0,0.008,0)m. The centreline radii are, from the inside, 0.045m, 0.075m and 0.105m, and the tube radius is 0.008m. Each torus has 16 main segments and 8 tube segments, and between the nearest ring surfaces of the smooth tori there is an empty gap of 0.014m, while the real gap of the 16-sided polyhedra is about 0.0137m. The thin tie band of width X=−0.012~0.012m spans Z=−0.113~0.113m and Y=0.016~0.024m above the three rings, touching them and crossing the rings without closing the central empty hole down to the floor. The occupancy box is 0.226×0.024×0.226m.

It is rope placed separately in the records room, storage room and service yard and differs from the binding tie attached to the existing scrolls. instances sets where goods are tied in the storage room and the real binding relation.

Part map: `rope`=ring; `tie`=tie band.

Parts and surfaces are `rope` and `tie`. On the review board the three gaps and the upper contact of the band are viewed. The fine twist of a single strand and the physical motion of actually tying objects are not shown.

The three `rope` rings unwrap the large-circle centreline and the small tube circumference arc lengths of the XZ plane as the U and V of UV0, and the rectangular `tie` crossing above uses a planar projection per face normal. They split at the ring seams and the band edges.
