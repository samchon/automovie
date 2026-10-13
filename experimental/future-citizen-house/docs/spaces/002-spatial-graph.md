# Stage 1 spatial graph revision

## Mass and storeys {#mass-and-storeys}

<!--
@evidence principles/core/common.md#declared-basis Follows the settings' metre, Y-up, and main house scale and distinguishes the wall thicknesses and floor, ceiling, and roof heights as inputs of this design. No dimensions were back-computed from the references, and the implementation history of the current source is not confused with the authoring basis of the dimensions.
@evidence principles/core/common.md#scope-preservation Keeps the scale of two storeys in one rectangle and assigns down to the interior heights and the structural zone. To meet the target of about 250㎡, no missing space is hidden and gross and net area are not treated as the same value.
@evidence principles/core/common.md#substantive-completion The outer and inner extents, the two finished floors, the two ceilings, the roof top, and the exterior and interior wall thicknesses are fixed, so the rooms, portals, and stair can consume the same datum. Structural certification and new area measurement are kept apart from these design values as unverified.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Added the inter-storey heights, the structural zone, and the interior clear faces to the settings' coordinate convention and approximate scale. With this the source no longer needs to decide the inside and outside of the walls or the upper arrival height for the first time.
@evidence principles/design/spaces.md#space-topology This datum sets the relation of the two storeys inside the perimeter and the structural zone between them, and the room division is consumed by the per-storey owners below. No separate volume is added to secure interior height.
@evidence principles/design/spaces.md#space-boundary-authority The outer boundary, storey lines, and thicknesses are the single input of mass-and-storeys, and each room and opening references those values. No other file owns a separate storey height or exterior wall interior on the ground of the gross target.
@evidence principles/design/spaces.md#space-verification-address Distinguishes gross, the storey floor excluding the hole, and the interior net area so that they are read from new output. Room containment and the datum agreement of the stair and the window heads are refuted by the linked full verification.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the coordinates and two storeys of 11×12m of settings/003 and the target of about 250㎡ of settings/001 with the actual two-storey outer boundary and structural zone. The target does not command an exact net area, so honestly distinguishing the 264㎡ gross was enough, and there was no need to change the settings or map boundaries.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Keeps one rectangle and two floor datums and does not meet area or height with a separate wing, cantilever, or living void. The exact new net area is left as a verification result.
@evidence settings/003-spatial-basis.md#coordinate-datum Authors the stated outer boundary and the two storey heights in the same metre, Y-up coordinates and derives the interior clear faces from the wall thicknesses. It does not confuse the axis convention with the left and right of the reference screens and distinguishes the current architectural source from the full verdict of the new tree.
-->

**Status: the review eligibility of settings, spaces, and spaceSources was reconfirmed in the v-112 independent verdict.** It follows the [coordinate basis](../settings/003-spatial-basis.md#coordinate-datum). The dimensions of this document are authoring decisions, not values back-computed from reference pixels. The nodes and connection meanings of the fixed graph are kept, and the current source implements these values in plan and the complete surface owners. The earlier independent verdicts observed the compiled result and the GPU screen, but the full observation denominator of the current revised tree and production completion are `unverified`.

The main house outer boundary x=-5.50..5.50, z=-6.00..6.00 is kept. The reference interior of the 0.24m exterior wall is x=-5.26..5.26, z=-5.76..5.76. The ground floor is y=0, the upper floor y=3.20, the ceiling of each storey y=2.90/6.10, and the top of the roof structure y=6.40. The interior wall thickness is 0.18m. The 0.30m inter-storey structural zone and the 2.90m interior height are authoring inputs that the stair and window heads reach together, not certified structural safety values.

The total of the two storeys by the outer boundary is 264㎡. "About 250㎡" is the scale of the production target, and the earlier sentence that subtracting the walls and stair from 264㎡ gives exactly 250㎡ is not used. Gross, the floor excluding the inter-storey hole, and the interior net area are measured separately from new output. The current new area result is unverified.

## Ground floor {#ground-level}

<!--
@evidence settings/003-spatial-basis.md#surface-decomposition Assigns the ground-floor structure and the continuous floor and ceiling to one storey owner so that individual rooms cannot make those final horizontal faces again. This responsibility does not mean the actual module exists or the surface verification is complete.
-->

<!--
@evidence principles/core/common.md#declared-basis The ground-floor height comes from mass-and-storeys, the room composition from ground-partition, and the sole responsibility for horizontal finishes from the settings surface assignment. This storey sets no separate storey height; the foundation bottom y=-0.60 is this H2's authored value that buries 0.15m below the ground -0.45 of site-access, and the foundation top -0.016 comes from the 0.016m ground-floor finish thickness that this H2 set.
@evidence principles/core/common.md#scope-preservation Includes all five ground-floor rooms and the one stair to the upper floor, and keeps under the same storey responsibility the slab's floor and ceiling, the structural partitions, the foundation buried below the ground, and its plinth outer face (the threshold plate section below the entrance belongs to the front elevation owner). Duplicate horizontal finishes layered per room are not allowed.
@evidence principles/core/common.md#substantive-completion The house membership of ground-storey, the lower room population, the upper connection, and the generation responsibility and extent of the floor/ceiling and the foundation and plinth are set. There is no gap requiring the source to newly decide the ownership hierarchy between storey and rooms or the foundation depth.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Gathered the parent datum and the ground-floor program into the child room and stair relations and the horizontal surface responsibility of one storey. Instead of reformatting the numeric storey height, it decides the containment relations of the realizing subjects.
@evidence principles/design/spaces.md#space-topology ground-storey is under house, the five rooms of ground-partition are inside it, and upper-storey is reached only by single-stair. The hierarchy of floors and rooms is not inferred from furniture mesh names.
@evidence principles/design/spaces.md#space-boundary-authority The floor and ceiling numbers keep the single ownership of the datum, and the room cells stay with the corresponding rooms. The storey owner's horizontal finishes and the room owner's wall finishes do not own the same visual face at the same time.
@evidence principles/design/spaces.md#space-verification-address Has the full verification confirm the room parent and the protrusion of cells outside the storey, the substance of the partitions, slab collisions, and the continuity of the foundation, ring, and threshold plate in the outer -0.45..0 band, so that a failure in which only the logical storey name matches is not missed.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the direct ground-floor connection graph and the per-storey floor and ceiling responsibility of the surface decomposition with the parent assignment of the five rooms. They fit in a storey sharing the same datum, so no separate mezzanine or change to the parent ownership rule was needed.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Gives every ground-floor room ground-storey as its parent and leaves the upper connection to the one stair. An implementation that expresses a room without storey membership only by a structure name fails this assignment.
-->

storey id ground-storey is a child of house and uses the ground-floor floor and ceiling of the [mass and storey datum](#mass-and-storeys). The five rooms of the [ground-floor partition](#ground-partition) belong to this storey, and the [single stair](#single-stair) connects to the upper floor. The storey owner owns all of the slab's interior exposed floor and ceiling and the structural partitions. Room owners do not overlay the same horizontal finishes. The storey owner's foundation fills the whole main house outer boundary x=-5.50..5.50, z=-6.00..6.00 from y=-0.60 to the ground-floor structural top -0.016; in the exterior wall thickness section the bearing ring at -0.016..0 continues to the bottom end of the elevations; and below the clear width of the [entrance](#front-entry), the [threshold plate](#door-interface) of the front elevation owner, which cuts the door opening, fills that section. The outer face at -0.45..0 exposed above the [site ground](001-citizen-house.md#site-access) y=-0.45 is the plinth, and the face excluding that threshold plate section is owned by the storey owner on the same outer plane as the elevation. The foundation is buried 0.15m deeper than the ground, so the main house touches the ground. This 0.15m burial is an authored value of this storey owner, not a survey, ground, or structural calculation value; the foundation top -0.016 is the structural top below the 0.016m ground-floor finish thickness, and that finish thickness is also an authored value of this storey owner. Previously the foundation ended at -0.30, leaving a 0.15m gap to the ground open around the whole perimeter (2026-09-24 envelope design verdict F2). The [full verification](#stage-one-verification) checks the room parent and the protrusion of cells outside the storey, wall substance, slab collisions, and outline grounding.

## Upper floor {#upper-level}

<!--
@evidence settings/003-spatial-basis.md#surface-decomposition Consumes the assignment in which the upper owner handles the upper slab, stair hole, and continuous horizontal finishes and the rooms handle only the inner walls. Object fit-out is separated into models and instances, and the roof's exterior underside is not mixed with the upper interior ceiling.
-->

<!--
@evidence principles/core/common.md#declared-basis The upper floor and ceiling are read from the common datum, the seven rooms from upper-partition, and the required floor hole from stair-opening. A new void position is not chosen at the storey owner's convenience.
@evidence principles/core/common.md#scope-preservation Holds all seven upper rooms and the continuous horizontal finishes and partitions and forbids any floor loss other than the single stair hole. The corridor and the small core are not dropped from the upper population.
@evidence principles/core/common.md#substantive-completion The parent, sub-divisions, allowed openings, and structure and finish responsibilities of upper-storey are decided. The source does not choose to make the upper slab a solid plate or to hollow it out further at will.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Bound the settings' upper private zone into a common storey of seven rooms and assigned only the inter-storey stair passage as a floor exception. This does more than list the room program names again.
@evidence principles/design/spaces.md#space-topology upper-storey is a child of house and contains the seven rooms. The actual connection with the ground floor is stair-opening, and the interior of no other room is made an empty pass-through volume.
@evidence principles/design/spaces.md#space-boundary-authority Height is owned by mass-and-storeys and the hole extent by stair-opening. The storey makes the slab and the final horizontal faces from those inputs, and room owners do not generate the same ceiling a second time.
@evidence principles/design/spaces.md#space-verification-address Linked the membership of the upper rooms, unnecessary floor voids, and the slab and stair arrival to the full verification. It asks separately about the counterexample in which only the upper plan looks good while the stair passage is blocked.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the upper floor's short corridor, directly connected bedrooms, service zone, and surface ownership settings with one upper-storey and the required stair hole. They could be assigned without an additional storey or living void, so the parent scope was not changed.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Puts every upper room in the same storey and allows only the required stair passage in the floor. No double-height living room or second stair is made as a new connection.
-->

storey id upper-storey is a child of house and uses the upper-floor floor and ceiling of the [mass and storey datum](#mass-and-storeys). The seven rooms of the [upper-floor partition](#upper-partition) belong to this storey. The floor is not emptied except for the [required stair opening](#stair-opening). The continuous horizontal finishes and structural partitions are owned by the storey owner, and the [full verification](#stage-one-verification) checks the upper room membership, unnecessary voids, and the slab and stair junction.

## Ground-floor partition and direct connections {#ground-partition}

<!--
@evidence principles/core/common.md#declared-basis Resolved the direct connections of settings/003#ground-graph into five explicit rooms and the wall/opening relations between them. The room boundaries rest on each cell owner and the gap thickness on the common datum.
@evidence principles/core/common.md#scope-preservation Includes all of the entry, workroom, continuous common area, powder room, and storage and lets the entry reach the stair and the common area directly. The empty strips between walls are not used as additional unowned corridors.
@evidence principles/core/common.md#substantive-completion The ground-floor partition population and the destination of each direct connection are set. Reading this owner, the source need not decide again living connections such as whether storage is reached through the powder room.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Added to the fixed entry, workroom, and rear common area relations the core access decisions that the powder room connects directly to the entry and the storage directly to the common area, and the shared wall treatment between cells.
@evidence principles/design/spaces.md#space-topology The five rooms divide ground-storey; the front door leads to entry, and entry leads to the workroom, powder room, common area, and stair. storage is a closed destination accessed from common-room.
@evidence principles/design/spaces.md#space-boundary-authority This H2 owns the connection graph, leaving the clear cell coordinates to each room and the wall thickness to the datum. Two rooms do not define a shared gap at the same time as different passages or walls.
@evidence principles/design/spaces.md#space-verification-address Has the actual boundaries and connectors read by the containment and reachability checks, catching as failures connections that have only a door record and pierce physical walls.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the fixed ground-floor graph and the sanitary and storage uses of ground-program with the body text of the five rooms and their connecting openings. The required rooms fit in one storey while keeping the workroom directly connected to the entry and the rear common area, so the parent's living scope was not revised.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Keeps the core connections from the entry to the single stair, the rear common area, and the front workroom and invents no branch corridor in the room gaps. Actual door and wall verification remains open separately.
@evidence settings/003-spatial-basis.md#ground-graph Places the workroom and common area directly connected to the entry and one stair as they are and states the destination access of the right core. The source cannot change the link order to make a required room a pass-through room.
@evidence settings/002-household.md#ground-program Assigns the spatial places of entry, work, common living, sanitation, and storage to the five rooms. The entry mail and charging shelf is an object attached to a flat wall without an architectural hole, so the space owner cuts no niche. The program is not omitted by shortening the room list.
-->

The interior of the [ground floor](#ground-level) is divided into five rooms: the [entry](#entry), [workroom](#flex-workroom), [common area](#common-room), [powder room](#powder-utility), and [storage](#storage-1f). Each room's clear cell owns its own boundary. The gap between cells is one shared wall with the [wall thickness](#mass-and-storeys) and is not used as an unnamed corridor.

Entering the entry through the [front door](#front-entry), one reaches the [stair](#single-stair) and the [common area opening](#entry-common) directly. The workroom and powder room have doors directly on the entry, and storage directly on the common area. The [settings' ground-floor graph](../settings/003-spatial-basis.md#ground-graph) is not changed. The actual boundaries and connectors are read in the containment and reachability checks of the [full verification](#stage-one-verification).

## Entry {#entry}

<!--
@evidence settings/002-household.md#ground-program Receives the functions of arrival, shoe storage, and briefly sitting and the mail and charging shelf attached to a flat wall as spatial conditions of the entry. There is no wall cut for the shelf. A realization that removes the east walkway when furniture is placed does not satisfy this program relation.
-->

<!--
@evidence principles/core/common.md#declared-basis Inherits ground-storey and ground-program and sets here the clear cell of the entry and the walkway east of the stair. The storey height and the effective dimensions of the connecting doors follow their owners.
@evidence principles/core/common.md#scope-preservation Accommodates inside the entry the five-way relation of the front arrival, workroom, powder room, common area, and stair. The passage left after placing the stair is not pushed out into an unnamed exterior gap.
@evidence principles/core/common.md#substantive-completion The parent, horizontal clear extent, direct connections, and walkway beside the stair of entry are decided. It is a design that resolves the state in which the entry has only door names and no actual space to occupy.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Added the entry cell and the east walkway to the parent's arrival and living distribution role, deciding the physical position that the stair and the directly connected rooms share.
@evidence principles/design/spaces.md#space-topology entry is inside ground-storey, is entered from the exterior door, and connects to the named openings and single-stair. This room itself is not defined again as a duplicate corridor.
@evidence principles/design/spaces.md#space-boundary-authority The x/z clear cell of the entry is owned by entry, and y is left to the storey. The host, cut, and clear dimensions of the connections consume front-entry and the three interior portals, so the room does not become a second owner of the door positions.
@evidence principles/design/spaces.md#space-verification-address Links the containment and the actual perimeter walls, each threshold, and the in-room observations to the full verification. A case in which the walkway disappears after placing the stair is not passed by the existence of a room label.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the entry's shoe cabinet and bench and the program directly connected to the common area and workroom with the cell that has the stair and the east walkway. The setting of entering from the site through one door could be kept, so no new hall or parent graph revision was required.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Assigns the entry as the common direct connection space of the single stair, rear common area, and front workroom and puts it in ground-storey. The connections are not detoured through a new room or a branch corridor.
-->

room id is entry, and the parent is [ground-storey](#ground-level). This room owns the clear cell x=-2.84..2.84, z=-5.76..-0.32m, and the y range follows the storey owner. The entry directly connects the front entrance, the workroom, the powder room, the rear common area, and the single stair. The x=1.58..2.84 walkway east of the stair is kept inside the room. The mail and charging shelf of the [living program](../settings/002-household.md#ground-program) is an object attached to a flat wall, and this room's walls have no architectural hole or niche lining for that shelf.

The direct connections are owned by [front-entry](#front-entry), [entry-flex](#entry-flex), [entry-common](#entry-common), and [entry-powder](#entry-powder). Shared walls are derived only from the room perimeter and do not block internal seams or door holes. The containment, adjacent physical boundaries, thresholds, and in-room observations of this clear cell are compared in the [full verification](#stage-one-verification).

## Variable workroom {#flex-workroom}

<!--
@evidence settings/002-household.md#design-subject-conditions Places the two furniture states, work and guest, in the same clear cell and asks together about the passage of open doors, physical furniture, and the designated virtual cylinder. If the cylinder cannot be measured, placement feasibility is not passed.
-->

<!--
@evidence settings/002-household.md#ground-program Assigns the desk, storage, and additional guest function to the front workroom directly connected to the entry. The work function is not moved to the dining area or an upper bedroom to remove the required room.
-->

<!--
@evidence principles/core/common.md#declared-basis Takes the ground-floor work program and the work/guest states and sets the front clear cell and the relation of sole entry from the entry. It states that the actual passage of the two furniture states is not yet observed.
@evidence principles/core/common.md#scope-preservation Keeps the workroom as an independent front room while preserving its direct connection to the entry. The guest state or the inspection cylinder condition is not omitted on the ground of the narrow width.
@evidence principles/core/common.md#substantive-completion The storey, cell, effective width, and sole entrance portal of flex-workroom are fixed. Later fit-out must resolve the two states and passage within this room's actual extent and cannot secretly enlarge the room.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Assigned the parent's variable work function to one room at the front +X and its relation with the entry, and stated the effective width. It does not just repeat the names of the desk and bed states but adds the spatial constraints the states must fit in.
@evidence principles/design/spaces.md#space-topology The workroom is one room of ground-storey and is entered only from the entry through entry-flex. Its adjacency to the common area is not interpreted as an additional entry route.
@evidence principles/design/spaces.md#space-boundary-authority The workroom's horizontal cell is owned by this H2, the height by ground-level, and the pocket door by entry-flex. Walls are derived from the perimeter, so the furniture space is not inflated by a copy of the internal boundary.
@evidence principles/design/spaces.md#space-verification-address Links the room containment, entry threshold, adjacent walls, and in-room view to the full verification and states that the passage of the two furniture states is before physical inspection. A path blocked when the furniture unfolds is a separate counterexample.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Adopted the front work of ground-program, the vertical storage and horizontal sleeping states of flex-states, and the virtual cylinder condition as constraints of this cell. At the current stage there is no basis to reduce the parent states, and it does not pretend to have verified that the fit-out works.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Preserves the front workroom directly connected to the entry as a ground-floor room. The graph is not changed to a separate wing, a courtyard, or entry via the common area to make the glass or the variable furniture look good.
@evidence settings/002-household.md#flex-states Receives both the work and guest rest states as a spatial constraint that must hold, together with passage, within the same clear width. This spatial assignment does not yet claim the realization of the bed geometry or a successful state transition.
-->

room id is flex-workroom, and the parent is [ground-storey](#ground-level). This room owns the clear cell x=3.02..5.26, z=-5.76..-0.32m, and the y range follows the storey owner. It is a front workroom entered directly only from the entry. Within the 2.24m clear width it must accommodate the settings' two states, work and guest, and the [passage cylinder](../settings/002-household.md#design-subject-conditions), and the feasibility of the furniture placement is before physical inspection. It consumes the [living program](../settings/002-household.md#ground-program).

The direct connection is owned by [entry-flex](#entry-flex). Shared walls are derived only from the room perimeter and do not block internal seams or door holes. The containment, adjacent physical boundaries, threshold, and in-room observations of this clear cell are compared in the [full verification](#stage-one-verification).

## Rear continuous common area {#common-room}

<!--
@evidence settings/002-household.md#ground-program Has one rear room continuing without walls accommodate sofa living, six-seat dining, and the island kitchen. The access to storage and the path to the kitchen are not placed only inside the dining table's occupancy.
-->

<!--
@evidence principles/core/common.md#declared-basis Assigns the living, dining, and kitchen of ground-program to one rear room and sets in this design the cell extent and the entry and storage connections. The height follows the ground-floor datum.
@evidence principles/core/common.md#scope-preservation Preserves living, dining, and kitchen as a whole continuing without walls and includes the storage access. It keeps the living circulation from being dropped by a layout in which the kitchen can be reached only by crossing the dining table.
@evidence principles/core/common.md#substantive-completion The clear cell, parent, internal continuity, and two connecting portals of the common area are fixed. There is no gap requiring living, dining, and kitchen to be re-divided into three arbitrary rooms.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Made the parent's three common functions concrete as one space across the full rear width and its access relations with the entry and storage. It also adds the continuous circulation constraint that the furniture placement must accept.
@evidence principles/design/spaces.md#space-topology common-room is a continuous room inside ground-storey connected through entry-common and common-storage. No new door or closed wall is made between living and kitchen.
@evidence principles/design/spaces.md#space-boundary-authority The x/z cell of the common area is owned here, and the two openings and the storey height consume other designated owners. The room span of the exterior glazing also references this cell, so no separate rear width arises.
@evidence principles/design/spaces.md#space-verification-address Compares the in-room view, threshold, and walls and connectors and leaves to the full verification whether the passage to the kitchen passes through furniture. The fact that the rear glass is wide does not alone approve the continuity of the common area.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Assigned the sofa, dining table, and island kitchen of ground-program and the common area relation directly connected to the entry to one rear clear cell. No contradiction requiring a new partition between the three functions or a change to the parent living program appeared, and actual furniture access is left to a later check.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Keeps most of the rear as the continuous space of living, dining, and kitchen, entered directly from the entry. The three functions are not changed into separate rooms or additional corridors.
-->

room id is common-room, and the parent is [ground-storey](#ground-level). This room owns the clear cell x=-5.26..5.26, z=-0.14..5.76m, and the y range follows the storey owner. Living, dining, and kitchen are kept as one room continuing without walls. It connects directly to the entry and the ground-floor storage and makes no passage that reaches the kitchen only by crossing the dining table. It consumes the [living program](../settings/002-household.md#ground-program).

The direct connections are owned by [entry-common](#entry-common) and [common-storage](#common-storage). Shared walls are derived only from the room perimeter and do not block internal seams or door holes. The containment, adjacent physical boundaries, thresholds, and in-room observations of this clear cell are compared in the [full verification](#stage-one-verification).

## Ground-floor powder room {#powder-utility}

<!--
@evidence settings/003-spatial-basis.md#surface-decomposition Links the inner wall faces of the powder room owner and the independent core cell. The prototypes and placement of the basin, toilet, and cleaning storage are handled by models and instances respectively, and the laundry function stays in the upper service room.
-->

<!--
@evidence settings/002-household.md#ground-program Assigns the ground-floor powder/utility room as a core room directly connected to the entry. No separate functional extension that also puts the upper laundry program here is made.
-->

<!--
@evidence principles/core/common.md#declared-basis Put the powder room of ground-program and its washing, toilet, and cleaning storage functions in the cell on the right of the front screen. The surface decomposition assigns only the inner wall face (lining) shapes and stable addresses of this room, and the washer of the upper service room is not moved here.
@evidence principles/core/common.md#scope-preservation Keeps the powder room as an independent sanitary space directly connected to the entry and keeps access to washing, the toilet, and cleaning storage. It is not used as a pass-through room to another room, which would remove privacy or access to a required destination.
@evidence principles/core/common.md#substantive-completion The parent and x/z cell of powder-utility, its direct entrance door, and its destination are decided. Later service placement is not in a state where it must first invent the outline of this core.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Assigned the parent's sanitary function to a concrete room at the front of the right opaque core and set it as an independent destination entered from the entry. It adds the interior boundary that was buried in an abstract service core.
@evidence principles/design/spaces.md#space-topology The powder room belongs to ground-storey, connects to the entry by entry-powder alone, and is not the pass-through path to storage or other rooms. The perimeter shared walls make this closed destination.
@evidence principles/design/spaces.md#space-boundary-authority The horizontal boundary of the powder cell is owned by this room and the vertical extent by ground-level. The entry door opening consumes entry-powder, so the service placement does not move the door at will.
@evidence principles/design/spaces.md#space-verification-address The room's storey membership, actual perimeter, threshold, and the access around the sanitary fixtures are observation targets of the full verification. A failure in which only a room name sits behind the opaque exterior wall without walls or access is not allowed.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the powder/utility room and right core of ground-program and the room inner wall ownership of surface-decomposition with the cell directly connected to the entry. The sanitary fixture shapes and placement were handed to models and instances, and laundry was left in the service room of upper-program, so the parent program was not assigned twice.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Puts the ground-floor sanitary space in the right opaque core and ground-storey and connects it to the entry through an actual door. The core is not pulled out as a separate wing or made a disconnected destination reached only through another room.
-->

room id is powder-utility, and the parent is [ground-storey](#ground-level). This room owns the clear cell x=-5.26..-3.02, z=-5.76..-2.24m, and the y range follows the storey owner. It is the sanitary space, directly connected to the entry, in the opaque core on the right of the front screen. It secures the actual access areas around the washing, toilet, and cleaning storage and is not used as a pass-through room for other rooms. It consumes the [living program](../settings/002-household.md#ground-program).

The direct connection is owned by [entry-powder](#entry-powder). Shared walls are derived only from the room perimeter and do not block internal seams or door holes. The containment, adjacent physical boundaries, threshold, and in-room observations of this clear cell are compared in the [full verification](#stage-one-verification).

## Ground-floor storage {#storage-1f}

<!--
@evidence settings/002-household.md#ground-program Keeps the storage needed for common living as a ground-floor core destination entered directly from the common area. It is not changed to a relation in which storage can be reached only by passing through the sanitary space.
-->

<!--
@evidence principles/core/common.md#declared-basis Assigns the storage function of ground-program to the same right core and sets in this H2 the cell entered from the common area. The ceiling and floor follow the ground-floor owner.
@evidence principles/core/common.md#scope-preservation Keeps the ground-floor storage as a separate room with a direct door and preserves its closed division from the powder room. The actual space of the storeroom is not omitted with only a visible cabinet.
@evidence principles/core/common.md#substantive-completion The parent, clear cell, common area entry, and closed boundary with the powder room of storage-1f are decided. The later source does not choose again which living space to attach the storage to.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Made the storage the parent required concrete as a clear cell behind the core's powder room and a destination directly connected to the common area. It adds access that does not pass through the sanitary space and a mutually closed neighbour relation.
@evidence principles/design/spaces.md#space-topology The storage is contained in ground-storey and connected to common-room through common-storage. The adjacent faces toward the powder room and the entry do not mean passages.
@evidence principles/design/spaces.md#space-boundary-authority This room owns only the horizontal clear cell of the storage; y consumes ground-level and the door common-storage. The shared walls are derived between room perimeters, so the storage depth is not authored twice at will.
@evidence principles/design/spaces.md#space-verification-address The full verification looks at the cell containment, physical boundaries, common area threshold, and interior view together. A state with only a logical storage cell and a missing actual partition can be refuted separately.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the parent conditions of ground-floor common living, storage, and the independent use of the sanitary space with the common area door and the closed wall to the powder room. An assignment that passes through no other room was possible, so the parent graph was not revised.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Puts the storage in the right core as a ground-floor room and connects it to the common area through an actual door. The empty area of the core is not left as an unowned passage or a room without a connection.
-->

room id is storage-1f, and the parent is [ground-storey](#ground-level). This room owns the clear cell x=-5.26..-3.02, z=-2.06..-0.32m, and the y range follows the storey owner. It is a storeroom in the same core with a door directly on the common area. It shares a closed boundary with the powder room. It consumes the [living program](../settings/002-household.md#ground-program).

The direct connection is owned by [common-storage](#common-storage). Shared walls are derived only from the room perimeter and do not block internal seams or door holes. The containment, adjacent physical boundaries, threshold, and in-room observations of this clear cell are compared in the [full verification](#stage-one-verification).

## Door frames and opening occupancy {#door-interface}

<!--
@evidence principles/core/common.md#declared-basis Ordinary doors come from inherited-defaults, and the frame face width 0.06m, the leaf thickness 0.045m, and the open inspection state are values adopted by this design.
@evidence principles/core/common.md#scope-preservation Keeps the door leaves, frames, handles, and the obstacle occupancy of open leaves, so a connection is not reduced to one rectangular hole.
@evidence principles/core/common.md#substantive-completion Set the direction that extends the structural cut from the clear opening, the consumption of the host thickness, the 0.016m threshold plate that fills the host thickness under the clear opening, and the differences among hinged, pocket, and leafless.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds to the ordinary door canon the actual occupancy of the frame and leaf and an inspection state that opens 90° into the room.
@evidence principles/design/spaces.md#space-topology The door state changes the passability of a connection, so a route through a closed door is distinguished from open passage.
@evidence principles/design/spaces.md#space-boundary-authority Each opening owns its effective width and height, and this common interface derives the frame and leaf from those values.
@evidence principles/design/spaces.md#space-verification-address Compares the structural cut, jambs, leaf, and swept area with the room cells and furniture and refutes the existence of the door members and the passability separately.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the ordinary door canon with the allowed controls of operator-access and distinguished door opening as an authoring inspection state. No parent revision widening the user control scope was needed.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Links the requirement of reaching rooms through actual doors to the clear opening, the physical members, and the state record.
@evidence settings/002-household.md#inherited-defaults Makes the ordinary door concrete as a frame and leaf with thickness and keeps an open door as an obstacle too. It is not replaced with a teleporting future device.
-->

<!--
@evidence settings/004-observation.md#operator-access Limits door opening to the author's passage inspection state and adds no door control at will beyond the glass and bed in the operator's selection list. It consumes, as a spatial decision, the separation of the allowed control scope from the door state inspection and does not claim to implement UI code here.
-->

It makes the [ordinary door adoption](../settings/002-household.md#inherited-defaults) concrete as spatial opening and closing. Outside the clear opening of room doors and the entrance door are jambs and a head of face width 0.06m, and the leaf thickness is 0.045m. The frame depth consumes the whole host wall thickness. The door leaf is not replaced with a hole without thickness. The clear width and height are owned by each opening H2, and the structural cut extends by both jambs and the head. The storey's 16mm floor finish is only inside the room cells, so in the host wall thickness section under the clear opening a threshold plate 0.016m thick is placed across the whole clear width between the jambs, aligning its top with the floor datum (0 or 3.20). Without the threshold plate, each door would expose the structural top as a groove 16mm lower, and the floor finishes on both sides would break at that groove (compiled scene comparison during the 2026-09-24 materials r5 preparation). The threshold plate of the entrance door fills the front exterior wall thickness between the exterior landing and the entry floor, and the leafless entry-common opening has the same threshold plate.

A hinged door is checked for passage in the state opened 90° into the corresponding room. The entrance door opens into the entry, and room doors into the room on the side opposite the corridor, with each door owner setting the named room. The workroom's pocket door slides sideways by the clear opening into the wall pocket. entry-common is a leafless opening. The door leaf, hinge, and handle are derived from the same opening, and the open-state leaf is not excluded from the obstacles either.

This door opening and closing is the author's passage inspection state and consumes the [ordinary door canon](../settings/002-household.md#inherited-defaults). No door control is added at will to the viewer user's glass and bed selection list. Each authoring check records the closed/open state and the source. A route through a closed door is not reported as open-state passage. The [full verification](#stage-one-verification) checks the interference of every structural cut, jamb, leaf, and open-state swept area with the room cells and furniture. It is not structural or safety certification.

## Front entrance {#front-entry}

<!--
@evidence principles/core/common.md#declared-basis The front entry comes from the ground graph, and the centre 2.22m and clear 1.05×2.30m are an authoring choice to avoid collision with the stairwell frame.
@evidence principles/core/common.md#scope-preservation Keeps one entrance with an actual door leaf from the site landing to the entry and puts no fake entrance for the exterior.
@evidence principles/core/common.md#substantive-completion Designates the host face, centre, width, height, sill, and route endpoints on both sides, so the door position is not left to the discretion of the implementation stage.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Turns the requirement of entering straight into the entry into a specific clear opening of the front boundary and its connection to the landing.
@evidence principles/design/spaces.md#space-topology from is the site landing and to is entry, and the front perimeter is the actual passage boundary between them.
@evidence principles/design/spaces.md#space-boundary-authority The entrance door owns the clear dimensions, and the sill comes from ground-level, the frame from door-interface, and the host plane from front-face.
@evidence principles/design/spaces.md#space-verification-address Keeps the clearance between the stairwell glazing and the frame, the landing grounding, the route endpoint containment, and the passage cylinder collision as counterexamples of this opening.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the single front entrance and the stairwell glazing conditions with the door centre candidates and separated their occupancy with a 0.12m shift. There is no need to change the parent's entry graph.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Assigns the entrance as an actual exterior entrance connected directly to the central circulation and does not detour through a separate porch building or a second stair.
@evidence settings/002-household.md#design-subject-conditions Links the door's effective width and the passage around the open leaf to the virtual cylinder question. These dimensions are not reported as actual human or code certification.
-->

It is the one direct connection [exterior site](001-citizen-house.md#site-access) ↔ [entry](#entry). The host wall is the [front boundary](003-surface-ownership.md#front-face), the centre in the width direction is x=2.22m, and this opening owner sets clear width 1.05m and clear height 2.30m. The sill is the [ground floor](#ground-level). One enters the entry floor from the last landing of the front entrance steps. The opening and closing of the wooden door leaf have an actual member covering the threshold.

The door centre was moved 0.12m from the earlier candidate x=2.10. It is a repair to keep the end of the [stairwell glazing](003-surface-ownership.md#front-stair-glazing) and the door frame from overlapping while staying within the entry's east walkway. The actual frame clearance with the [door frame occupancy](#door-interface) applied must be verified.

These values are the effective dimensions excluding the jambs, head, and leaf. The structural cut is derived by adding the frame thickness. The route extends from the opening centre into the interior on each side by at least half the boundary thickness plus 0.20m to reach the actual from/to cells. The exterior entrance connects to the site landing. The opening shape, the door state, the endpoint containment, and the collision of the [passage cylinder](../settings/002-household.md#design-subject-conditions) must be refutable in the [full verification](#stage-one-verification).

## Entry–workroom door {#entry-flex}

<!--
@evidence settings/002-household.md#flex-states Assigns the sliding door kept in both rest states, work and guest, to a pocket between the entry and the workroom and sets the storage of the open leaf toward -Z.
-->

<!--
@evidence principles/core/common.md#declared-basis Inherits the relation of entering the workroom directly from the entry and adopted the 1.20m opening at z=-1.10 and the -Z pocket.
@evidence principles/core/common.md#scope-preservation Does not turn the workroom entrance toward the common area or the exterior and keeps the actual storage position of the open leaf too.
@evidence principles/core/common.md#substantive-completion The door centre, clear size, host, storey sill, and pocket direction are set, so the door cannot be forced into the short +Z wall end.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds to the direct access of the variable workroom the spatial occupancy of the sliding direction and the storage inside the shared wall.
@evidence principles/design/spaces.md#space-topology Puts one opening in the shared wall of entry and flex-workroom, making a direct route between the two cells.
@evidence principles/design/spaces.md#space-boundary-authority The width and centre come from this opening, the plane from wall-entry-flex, and the floor from ground-level.
@evidence principles/design/spaces.md#space-verification-address Checks whether the pocket length, the open leaf, the endpoints on both sides, and the passage cylinder fit the actual cells and the shared wall.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the direct workroom access and the sliding door that flex-states keeps in both states with the shared wall length and chose the -Z pocket in this opening. The entry connection and the room use need not change in the parent.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Assigns the fixed connection in which the front workroom attaches directly to the entry to a physical pocket door.
@evidence settings/002-household.md#design-subject-conditions Asks whether the open pocket door blocks the passage cylinder and does not judge access complete from the clear width alone.
-->

It is the one direct connection [entry](#entry) ↔ [flex-workroom](#flex-workroom). The host wall is [wall-entry-flex](#wall-entry-flex), the centre in the width direction is z=-1.10m, and this opening owner sets clear width 1.20m and clear height 2.20m. The sill is the [ground floor](#ground-level). The sliding pocket is placed inside the shared wall toward -Z, and the open leaf is stored in the wall in front of the opening. It is not pushed into the short wall end on the +Z side.

These values are the effective dimensions excluding the jambs, head, and leaf. The structural cut is derived by adding the frame thickness. The route extends from the opening centre into the interior on each side by at least half the boundary thickness plus 0.20m to reach the actual from/to cells. The opening shape, the door state, the endpoint containment, and the collision of the [passage cylinder](../settings/002-household.md#design-subject-conditions) must be refutable in the [full verification](#stage-one-verification).

## Entry–common area opening {#entry-common}

<!--
@evidence principles/core/common.md#declared-basis Adopted the clear 1.30×2.20m opening at x=2.05 for the requirement of continuing straight from the entry to the rear common area.
@evidence principles/core/common.md#scope-preservation Connects the continuity of living, dining, and kitchen with the entry and adds no separate hall or branch corridor.
@evidence principles/core/common.md#substantive-completion Set the centre aligned with the walkway east of the stair, the leafless opening type, and the cell endpoints on both sides.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Spatializes the living circulation to the rear common area as a specific shared-wall opening that continues without a door leaf.
@evidence principles/design/spaces.md#space-topology entry and common-room continue directly through one passage that pierces wall-entry-common.
@evidence principles/design/spaces.md#space-boundary-authority This opening sets the centre, effective width and height, leafless type, and route connection, and the wall plane, frame, and storey height consume their own owners.
@evidence principles/design/spaces.md#space-verification-address Checks whether the route reaches the east walkway and the actual common area cell and whether the jambs intrude into the effective width.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the direct connection requirement of the ground graph with the band east of the stair and the shared wall. A leafless 1.30m passage could be placed, so no additional corridor is required of the parent.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Keeps the main circulation from the single entry to the continuous common area as this actual opening.
@evidence settings/002-household.md#design-subject-conditions The passage cylinder can collide with the jambs and nearby furniture even without a leaf, so the route check is not waived.
-->

It is the one direct connection [entry](#entry) ↔ [common-room](#common-room). The host wall is [wall-entry-common](#wall-entry-common), the centre in the width direction is x=2.05m, and this opening owner sets clear width 1.30m and clear height 2.20m. The sill is the [ground floor](#ground-level). It is a continuous interior opening without a door leaf that continues the walkway east of the stair.

These values are the effective dimensions excluding the jambs, head, and leaf. The structural cut is derived by adding the frame thickness. The route extends from the opening centre into the interior on each side by at least half the boundary thickness plus 0.20m to reach the actual from/to cells. The opening shape, the door state, the endpoint containment, and the collision of the [passage cylinder](../settings/002-household.md#design-subject-conditions) must be refutable in the [full verification](#stage-one-verification).

## Entry–powder room door {#entry-powder}

<!--
@evidence principles/core/common.md#declared-basis Takes the powder room placement directly connected to the entry and set the clear 0.90×2.20m at z=-3.20 and the opening into the room.
@evidence principles/core/common.md#scope-preservation Keeps the powder room as a room used directly from the entry and keeps the open door from occupying the stair passage instead.
@evidence principles/core/common.md#substantive-completion Designates the host wall, sill, centre, and the room it opens into, so the handle, hinge, and route are derived from the same opening.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Gives the small sanitary room of the ground program a concrete side entrance position and the occupancy of an inward leaf.
@evidence principles/design/spaces.md#space-topology The two cells entry and powder-utility continue through one door in the actual shared wall, without going via the common area.
@evidence principles/design/spaces.md#space-boundary-authority The z centre and clear dimensions are owned by the door, and the wall thickness and centre plane consume the linked boundary owner.
@evidence principles/design/spaces.md#space-verification-address Keeps per opening the interference of the leaf opened into the powder room with the basin and toilet placement, the endpoint containment, and the cylinder collision.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the direct entry connection and the ordinary door conditions with the clear room extent of the core. The door opens into the powder room, so no change to the stair or the parent graph is required.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Makes a door from the entry so that the sanitary room of the right core is reached without a break, and adds no separate corridor.
@evidence settings/002-household.md#design-subject-conditions Asks about the collision of the designated cylinder with the open leaf but does not use the 0.90m width as a substitute for physical accessibility certification.
-->

It is the one direct connection [entry](#entry) ↔ [powder-utility](#powder-utility). The host wall is [wall-entry-powder](#wall-entry-powder), the centre in the width direction is z=-3.20m, and this opening owner sets clear width 0.90m and clear height 2.20m. The sill is the [ground floor](#ground-level). The door opens into the powder room and does not intrude into the entry's stair or walkway.

These values are the effective dimensions excluding the jambs, head, and leaf. The structural cut is derived by adding the frame thickness. The route extends from the opening centre into the interior on each side by at least half the boundary thickness plus 0.20m to reach the actual from/to cells. The opening shape, the door state, the endpoint containment, and the collision of the [passage cylinder](../settings/002-household.md#design-subject-conditions) must be refutable in the [full verification](#stage-one-verification).

## Common area–storage door {#common-storage}

<!--
@evidence principles/core/common.md#declared-basis Authored the door centre at x=-4.14 and a 0.90×2.20m clear for the ground-floor storage attached to the common area.
@evidence principles/core/common.md#scope-preservation The storage is accessed from the common area, and the closed boundary toward the entry is not turned into an arbitrary second entrance.
@evidence principles/core/common.md#substantive-completion Sets the leaf opening into the storage, the ground sill, and the shared host, linking the storage entry to actual members.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Gave the common→storage connection of ground-partition a door centre and the in-room opening occupancy.
@evidence principles/design/spaces.md#space-topology The route from common-room to storage-1f pierces the Z-direction shared wall of the two rooms.
@evidence principles/design/spaces.md#space-boundary-authority The clear door dimensions are here, and wall-common-storage derives its plane from the faces of both rooms, avoiding duplicate values.
@evidence principles/design/spaces.md#space-verification-address Records a leaf blocking the common area passage, a collision of the door with storage furniture, and a route not reaching a cell as failures of this door id.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the storage condition directly connected to the common area with the shared span and opened the door into the room, without changing the parent conditions of the entry or the living circulation.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Provides the actual reachability of the opaque core storage with the common area door and does not leave it as a disconnected room.
@evidence settings/002-household.md#design-subject-conditions Even at the narrow storeroom entry, checks the virtual passage cylinder and the open leaf together and does not pass on the nominal clear dimensions alone.
-->

It is the one direct connection [common-room](#common-room) ↔ [storage-1f](#storage-1f). The host wall is [wall-common-storage](#wall-common-storage), the centre in the width direction is x=-4.14m, and this opening owner sets clear width 0.90m and clear height 2.20m. The sill is the [ground floor](#ground-level). The door opens into the storeroom and does not block the common area.

These values are the effective dimensions excluding the jambs, head, and leaf. The structural cut is derived by adding the frame thickness. The route extends from the opening centre into the interior on each side by at least half the boundary thickness plus 0.20m to reach the actual from/to cells. The opening shape, the door state, the endpoint containment, and the collision of the [passage cylinder](../settings/002-household.md#design-subject-conditions) must be refutable in the [full verification](#stage-one-verification).

## Single dog-leg stair and required floor opening {#single-stair}

The actual wooden top of the landing is also registered as the `stair-half-landing-walk` walking surface. The polygon is derived from the generated landing centre (0.14,-4.92) and width 2.64, depth 1.20, and the height from the halfRise of the actual 9-step ascent; it is not a separate coordinate or a hidden collision box. The earlier source generated only the landing solid and missed the walk surface, so it could not explain the cylinder's floor contact continuously. The stair reach, headroom, and railing collision are checked together on the same actual triangles as the contact-based ascent path of the [inspection conditions](../settings/002-household.md#design-subject-conditions).

<!--
@evidence principles/core/common.md#declared-basis Interprets the one dog-leg stair requirement as two flights and one landing, taking the heights from the storey datum and the 18 risers and 0.28m going from an authoring choice.
@evidence principles/core/common.md#scope-preservation Keeps the two flights as one continuous stair and neither omits the railing, landing, or actual treads nor adds a second stair.
@evidence principles/core/common.md#substantive-completion Decided down to each flight's x/z extent and direction, the 9 treads, the connection with the landing, and the end tread height rule.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds to the parent condition of a central stair the opposite-direction flights and the riser and landing height relation derived from the floor difference.
@evidence principles/design/spaces.md#space-topology Binds the only inter-storey route, from entry through the middle landing to arrival at upper-corridor, to the actual tread tops.
@evidence principles/design/spaces.md#space-boundary-authority The rise is a function of the storey height difference, and the slab hole is owned by stair-opening. The stair owner makes no separate storey height.
@evidence principles/design/spaces.md#space-verification-address Asks in new output about headroom, return clearance, tread/landing contact, and the interference of the guard with the route, and these are currently unverified.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the two storey datums and the single stair condition with the arrival of 18 risers and two flights. There is no planning contradiction requiring a separate stair or a living void, but the actual clearance is not yet verified.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Places one dog-leg stair connecting the two storeys in the central entry, and the current stair source implements the landing and railing. Passage performance is left as a separate verification question.
@evidence settings/003-spatial-basis.md#ground-graph Assigns the single stair rising from the centre of the entry to the upper floor to two flights and one landing and adds no separate inter-storey connection.
-->

A single stair made of two flights and one middle landing is placed inside entry. The lower flight rises toward the front (-Z) at x=0.26..1.46, and the upper flight, turning at the landing, rises toward the rear (+Z) at x=-1.08..0.12. The horizontal extent of the two flights is z=-4.32..-1.80, and the middle landing is x=-1.18..1.46, z=-5.52..-4.32. The landing actually reaches the full width of both flights. The upper flight is set 0.10m inside the opening, so the outer surface of the west stringer at x=-1.225 stays 0.015m inside the west end of the hole at x=-1.24.

The floor height difference of the two storeys of the [mass and storey datum](#mass-and-storeys) is divided into 18 risers, so the current rise=(3.20-0)/18m. Each flight has 9 risers and a 2.52m run at a nominal going of 0.28m. The landing's y is the ground floor height plus 9×rise, and the upper arrival equals the upper floor height. Each flight also has 9 treads. Each tread is 0.28m long with one riser at each near edge in the rising direction, and the top of the n-th tread is the starting height + n×rise. The 9th lower tread therefore meets the landing and the 9th upper tread meets the upper floor at the same height, with no additional riser after them. The first riser is the flight's starting line, and the far edge of the last tread reaches the landing/arrival boundary. The route consumes the actual tread tops and the centre of the landing. This document has not yet verified the staircase clearance.

The [required floor opening](#stair-opening) owns the relation of the upper slab with the upper arrival.

The guard and handrail follow the actual tread pitch and the landing. Each flight's round steel stringers lie outside both sides of the 1.20m tread width with a 0.065m-radius section, their centre axes 0.080m outside the tread sides. A 0.015m gap therefore remains between the stringer surface and the tread side, and the axis does not pierce the inside of the treads or risers. The stringer axis joins the point 0.12m below the top of the first tread centre to the point 0.12m below the top of the last tread centre, with both end points extended horizontally by 0.107m each toward their support boundaries while keeping the end heights. The vertical depth from the tread centre to the axis therefore changes from about 0.058..0.182m from the first tread to the last. The supports at both ends of the lower flight are the ground floor and the middle landing, and both ends of the upper flight are the middle landing and the upper slab trimmer. The end of the round surface is within 0.001m of the z face of each boundary, and the start is within 0.002m of the top of the floor or landing. This is a connection target of the authored shape, not certification of fastening strength. The upper west stringer is placed inside the hole, and volume penetration against compiled box members, including the slab, ceiling, landing, and walls, is checked by a full sample check. No opaque panel blocking the whole stair is used. A glass guard at the upper opening edge does not mean an independent double-height void and is therefore optional. The stair owner owns the frame shape and the stable face addresses, and the landing, railing, handrail, and stringers are currently implemented in `src/house/circulation/stair.ts`. The finish binding of those faces is decided by materials, and the material strings of the current source are temporary values before the handover. Headroom, return clearance, and actual passage performance have no separate measurement in new output and are unverified.

## Required floor opening of the stair {#stair-opening}

<!--
@evidence principles/core/common.md#declared-basis Under the parent condition that allows only the hole needed for the stair, set the slab opening at x=-1.24..1.58,z=-5.64..-1.80.
@evidence principles/core/common.md#scope-preservation Limits the hole to the passage area of the single stair and does not extend a double-height void into the living room or other rooms.
@evidence principles/core/common.md#substantive-completion Fixed the opening outline and the direct starting line of the corridor and made one derived input for the slab strips, beams, and railing supports.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Narrowed the condition of the stairwell's required opening to a specific rectangle of the upper slab and its arrival relation with the corridor.
@evidence principles/design/spaces.md#space-topology Owns the passage boundary through which the stair route passes the upper slab and continues directly into upper-corridor.
@evidence principles/design/spaces.md#space-boundary-authority The slab and the guard supports are derived from the same hole, and the stair treads or the corridor cell do not duplicate the hole dimensions separately.
@evidence principles/design/spaces.md#space-verification-address Verifies the actual area, slab strips, headroom, and upper arrival connection together, catching the counterexample in which a slab collision remains even with the hole.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the prohibition of voids other than the stair and the straight corridor's starting condition with the hole extent. The corridor starts right at the upper arrival line, so no additional living void is needed.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Keeps only the required floor opening for the single stair to pass, preserving the graph that forbids a double-height living room and a second stair.
-->

The stair hole of the upper slab is placed only at x=-1.24..1.58, z=-5.64..-1.80. The remaining slab strips, beams, and railing supports of the hole are derived from the same opening input. upper-corridor starts right at the upper flight's arrival line z=-1.80, so no other room is passed through and no corridor is added. The hole is the area needed for the single stair, and no double-height void cutting through the living room is made.

This opening connects the [single stair](#single-stair) and the [upper floor](#upper-level). Double-height voids of other living spaces are not allowed. The actual area of the hole, the slab strips, the headroom of the stair route, and the arrival at the [corridor](#upper-corridor) are confirmed together in the [full verification](#stage-one-verification).

## Upper-floor partition and short straight corridor {#upper-partition}

<!--
@evidence settings/002-household.md#household-program Assigns the corridor and the direct entrances of the independent bedrooms so that the family living together in one house gains upper-floor sleeping privacy. No actual resident assets are made as space.
@evidence settings/002-household.md#operative-subjects Preserves in the upper room population the one primary bedroom and two small bedrooms that explain two adults and two children. Character behaviour or service operation is not added as an executing subject of the space.
-->

<!--
@evidence principles/core/common.md#declared-basis Takes the straight corridor and the six directly connected rooms of upper-graph and decomposes them into the individual cell and opening owners of seven rooms.
@evidence principles/core/common.md#scope-preservation Attaches the primary bedroom, two small bedrooms, bathroom, storage, and service room all directly to the corridor and adds no branch or pass-through room.
@evidence principles/core/common.md#substantive-completion Assigns the upper floor area to each room, the shared gaps, and the required stair hole, and sets that the L-shaped cell seam is not a wall.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Expands the upper program into the actual seven room addresses, the doors and closed boundaries between them, and the unowned area check.
@evidence principles/design/spaces.md#space-topology The seven rooms inside upper-storey, the six direct doors of the central corridor, and the front stair arrival form the upper containment and connection.
@evidence principles/design/spaces.md#space-boundary-authority This assembly H2 does not repeat the coordinates of the individual cells and designates each room and connection H2 as the sole dimension owner.
@evidence principles/design/spaces.md#space-verification-address Asks together about containment, adjacent boundaries, reach, and unowned floor, so the partition is not approved from a picture that merely looks connected.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Assigned the upper graph and living program to the seven rooms and the union of the two L-shaped cells. No contradiction requiring a branch corridor or a room to delete was found in the plan.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Fixes the relation that reaches the three bedrooms and the core directly from the short straight corridor and makes no disconnected room or second corridor.
@evidence settings/003-spatial-basis.md#upper-graph Assigns the upper direct connections to six actual opening owners and allows no detour through another room from the stair arrival.
@evidence settings/002-household.md#upper-program Distributes the upper sleeping, sanitary, storage, and service roles over all seven rooms and does not shrink the living program because of the envelope shape.
-->

The [upper floor](#upper-level) is seven rooms reached directly from the [corridor](#upper-corridor): the [primary bedroom](#primary-bedroom), [small bedroom 1](#child-bedroom-1), [small bedroom 2](#child-bedroom-2), [bathroom](#upper-bathroom), [storage](#upper-storage), and [service room](#upper-service). Each room's cell and connection H2 is the sole dimension owner. It consumes the [settings' upper graph](../settings/003-spatial-basis.md#upper-graph) and adds no other pass-through room or branch corridor. The independent entrances of this corridor and the three bedrooms consume [the family's common living and upper sleeping privacy](../settings/002-household.md#household-program) and [the assignment of three sleeping rooms for two adults and two children](../settings/002-household.md#operative-subjects).

No wall is made at the seam of the two L-shaped rooms. Walls exist only at each perimeter and shared gap, and the whole upper floor except the required stair opening must be explained by rooms or physical boundaries. The [full verification](#stage-one-verification) judges containment, adjacent boundaries, reach, and unowned areas.

## Upper straight corridor {#upper-corridor}

<!--
@evidence principles/core/common.md#declared-basis Interpreted the single corridor of upper-program as the clear plan x=-2.84..0.12,z=-1.80..2.40. The height consumes upper-storey.
@evidence principles/core/common.md#scope-preservation It is one corridor reaching the six rooms directly from the stair landing and adds no branch or pass-through path via a bedroom.
@evidence principles/core/common.md#substantive-completion Sets the front starting line, width 2.96m, length 4.20m, and the six door addresses, fixing the space of upper access.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Expanded the parent decision of a short straight corridor into the stair arrival line, the clear cell, and the actual opening relations of each room.
@evidence principles/design/spaces.md#space-topology The corridor, a room of upper-storey, is the connection hub of single-stair and the six room doors and does not belong twice to another storey.
@evidence principles/design/spaces.md#space-boundary-authority The corridor owns its clear plan and takes the y range from the storey, each door from its opening, and the slab hole from stair-opening.
@evidence principles/design/spaces.md#space-verification-address Compares the stair arrival, door routes, furniture occupancy, and interior observation with the cell, detecting detours outside rooms and unowned floor.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the six upper direct doors and the single corridor condition with one 4.20m division. No branch or pass-through room is required of the parent.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Keeps the short straight corridor starting at the stair landing as the only upper distribution space.
@evidence settings/002-household.md#upper-program Linked the corridor that directly connects the three bedrooms, bathroom, storage, and separate service room to actual door addresses.
-->

The parent of room id upper-corridor is [upper-storey](#upper-level). The clear plan is one rectangle x=-2.84..0.12, z=-1.80..2.40m, and the y range is owned by the storey owner. It starts at the upper stair arrival line. It is one straight corridor 4.20m long with a clear width of 2.96m and makes no branch or other pass-through room. It consumes the [upper living program](../settings/002-household.md#upper-program).

The direct entrances use the actual openings and routes of [corridor-primary](#corridor-primary), [corridor-child-one](#corridor-child-one), [corridor-child-two](#corridor-child-two), [corridor-bathroom](#corridor-bathroom), [corridor-storage](#corridor-storage), and [corridor-service](#corridor-service). The stair connects right at the corridor's front boundary. The cell perimeter is distinguished from the [stair opening](#stair-opening) so that no unowned floor or passage outside rooms is made. The [full verification](#stage-one-verification) checks the cell, doors, furniture passage, and in-room observation.

## Primary bedroom {#primary-bedroom}

<!--
@evidence principles/core/common.md#declared-basis Assigns the primary bedroom of the upper sleeping program to the rear clear 8.10×3.18m and shows 25.76㎡ only as a calculated value of the authoring input.
@evidence principles/core/common.md#scope-preservation The primary bedroom is an independent room distinct from the small bedrooms and remains a private space entered directly via the corridor.
@evidence principles/core/common.md#substantive-completion Sets the four boundaries of the rear cell, the storey membership, and the entrance opening, so the position cannot later be chosen at will to match the exterior.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Added to the primary bedroom role of upper-program the rear width and depth and the direct connection of corridor-primary.
@evidence principles/design/spaces.md#space-topology primary-bedroom is inside upper-storey and connects to the upper corridor only through corridor-primary.
@evidence principles/design/spaces.md#space-boundary-authority The room's clear plan comes from here, the floor/ceiling from upper-level, and the entrance's door frame dimensions from the opening owner.
@evidence principles/design/spaces.md#space-verification-address The cell containment, the passage with the room door, bed, and other physical furniture, and the observation inside its own room are the verification addresses of this rear room.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the upper program requiring three bedrooms with the rear primary bedroom placement. No parent change deleting a small bedroom or the corridor connection because of this room is needed.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Connects the primary bedroom directly to the short corridor and makes no private circulation passing through another bedroom.
@evidence settings/002-household.md#upper-program Provides the interior area of the primary bedroom that reads with a double bed, storage, and desk, leaving the furniture implementation and collision verdict to later work.
-->

The parent of room id primary-bedroom is [upper-storey](#upper-level). The clear plan is one rectangle x=-2.84..5.26, z=2.58..5.76m, and the y range is owned by the storey owner. It is the rear primary bedroom. The plan area of the authoring input is about 25.76㎡, larger than the two small bedrooms. This is not a measurement of the compiled net area. It consumes the [upper living program](../settings/002-household.md#upper-program).

The direct entrance uses the actual opening and route of [corridor-primary](#corridor-primary). The cell perimeter is distinguished from the [stair opening](#stair-opening) so that no unowned floor or passage outside rooms is made. The [full verification](#stage-one-verification) checks the cell, doors, furniture passage, and in-room observation.

## Small bedroom 1 {#child-bedroom-1}

<!--
@evidence principles/core/common.md#declared-basis Set the clear plan of the first small bedroom as the union of two cells and distinguishes 20.94㎡, a calculation of the authored dimensions, from an actual survey.
@evidence principles/core/common.md#scope-preservation Keeps the front bedroom and the extension directly connected to the corridor as one room and does not put a wall at the seam, which would make a disconnected leftover room.
@evidence principles/core/common.md#substantive-completion Decided the inside and outside of the L by designating the extents of the two rectangles, the open seam, the upper-storey membership, and the direct door.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds to the first upper small bedroom the L-shaped spatial decision of a main body east of the stair and an extension reaching the corridor.
@evidence principles/design/spaces.md#space-topology The two cells belong to the same child-bedroom-1, and corridor-child-one connects the extension directly with the corridor.
@evidence principles/design/spaces.md#space-boundary-authority Only the perimeter of the union is the room boundary, and the internal seam is not a wall input. The stair hole and the y range consume separate owners.
@evidence principles/design/spaces.md#space-verification-address Adds the observations of the L's concave corner and extension and checks the door and furniture passage together with the cell containment.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Fitted the front small bedroom and the direct corridor connection condition with two cells and opened the seam. There is no need to fill the stair hole with the bedroom or add a second corridor to the parent.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements The first small bedroom reaches the corridor directly as an independent upper sleeping room, and the area left beside the stair is not left as a disconnected space.
@evidence settings/002-household.md#upper-program Assigned the area of the first bedroom, where a single bed, wardrobe, and desk or shelf fit, and its passage check.
-->

The parent of room id child-bedroom-1 is [upper-storey](#upper-level). The clear plan is the union of x=1.76..5.26, z=-5.76..-0.32m and x=0.30..1.76, z=-1.62..-0.32m, and the y range is owned by the storey owner. It is one L-shaped room joining the front east of the stair and the extension directly connected to the corridor. No wall is made at the shared seam of the two cells. The authoring input area is about 20.94㎡, before actual measurement. It consumes the [upper living program](../settings/002-household.md#upper-program).

The direct entrance uses the actual opening and route of [corridor-child-one](#corridor-child-one). The cell perimeter is distinguished from the [stair opening](#stair-opening) so that no unowned floor or passage outside rooms is made. The [full verification](#stage-one-verification) checks the cell, doors, furniture passage, and in-room observation. In addition to the four corners, the L-shaped room adds observations of the concave corner and the extension.

## Small bedroom 2 {#child-bedroom-2}

<!--
@evidence principles/core/common.md#declared-basis The second small bedroom was adopted at x=0.30..5.26,z=-0.14..2.40, and 12.60㎡ is a design calculation distinguished from the source's actual net area measurement.
@evidence principles/core/common.md#scope-preservation Does not merge the two small bedrooms into one and does not use this room as a pass-through room to the primary bedroom.
@evidence principles/core/common.md#substantive-completion Sets the rectangular cell, the storey height consumption, and the corridor-child-two entrance, fixing the boundary of the east sleeping room.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Matches the second item of the two small bedrooms requirement with the east middle division and an independent room door.
@evidence principles/design/spaces.md#space-topology child-bedroom-2, a child of upper-storey, continues directly to the corridor and has no pass-through connection with the bedrooms on either side.
@evidence principles/design/spaces.md#space-boundary-authority The room coordinates are owned once in this H2, and the surrounding walls are derived from this face and the adjacent room faces.
@evidence principles/design/spaces.md#space-verification-address Verifies the containment and passage of the door, furniture, and observation viewpoints within the narrow depth and does not replace them with a screen that looks wide.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared this east division with the requirement of two separate small bedrooms and direct room doors. It is assigned without changing the number of rooms or the upper corridor form in the parent.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Keeps one of the two small bedrooms as an actual cell and room door, preserving the number of sleeping rooms and the independent reach relation.
@evidence settings/002-household.md#upper-program Did not delete the living items and passage of the second single-bed room and left them as later fit-out questions within this clear area.
-->

The parent of room id child-bedroom-2 is [upper-storey](#upper-level). The clear plan is one rectangle x=0.30..5.26, z=-0.14..2.40m, and the y range is owned by the storey owner. It is the east small bedroom and not a pass-through room for another bedroom. The authoring input area is about 12.60㎡, before actual measurement. It consumes the [upper living program](../settings/002-household.md#upper-program).

The direct entrance uses the actual opening and route of [corridor-child-two](#corridor-child-two). The cell perimeter is distinguished from the [stair opening](#stair-opening) so that no unowned floor or passage outside rooms is made. The [full verification](#stage-one-verification) checks the cell, doors, furniture passage, and in-room observation.

## Upper bathroom {#upper-bathroom}

<!--
@evidence principles/core/common.md#declared-basis An authoring design that assigns the bathroom of upper-program to the west core x=-5.26..-3.02,z=1.28..5.76.
@evidence principles/core/common.md#scope-preservation The shower, toilet, basin, and towel storage are accessed within one bathroom, which is not reduced to a pass-through circulation for a bedroom.
@evidence principles/core/common.md#substantive-completion Sets the boundary, storey membership, and corridor door of the elongated core room, providing the actual placement area of the sanitary fixtures.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Makes the upper sanitary program concrete as a rear west core division and a door directly connected to the corridor.
@evidence principles/design/spaces.md#space-topology The bathroom is a room inside upper-storey, accessed directly from the corridor through corridor-bathroom.
@evidence principles/design/spaces.md#space-boundary-authority The bathroom clear extent is owned here, the exterior privacy window by the envelope owner, and the height by upper-level.
@evidence principles/design/spaces.md#space-verification-address Leaves to the full verification whether the door and sanitary fixtures block passage and whether room observation is possible inside the actual cell.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the opaque core and the direct entrance of the upper bathroom with the current west division. No parent change requiring entry via a bedroom or an additional corridor is needed.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Gathers the bathroom into the right opaque core and connects it from the upper straight corridor with a direct door.
@evidence settings/002-household.md#upper-program Keeps the stated vanity, toilet, shower/tub, and towel storage as the living scope inside the bathroom.
-->

The parent of room id upper-bathroom is [upper-storey](#upper-level). The clear plan is one rectangle x=-5.26..-3.02, z=1.28..5.76m, and the y range is owned by the storey owner. It is the bathroom of the west opaque core. The shower/tub, toilet, basin, and towel storage of the upper program take this room as their destination and are not entered through a bedroom. The current temporary room source makes a shower tray and does not implement a bathtub. The final fixture choice, shape, and in-room placement are left to the verdict of later owners. It consumes the [upper living program](../settings/002-household.md#upper-program).

The direct entrance uses the actual opening and route of [corridor-bathroom](#corridor-bathroom). The cell perimeter is distinguished from the [stair opening](#stair-opening) so that no unowned floor or passage outside rooms is made. The [full verification](#stage-one-verification) checks the cell, doors, furniture passage, and in-room observation.

## Upper storage {#upper-storage}

<!--
@evidence principles/core/common.md#declared-basis Adopted the upper linen storage requirement as a west clear 2.24×1.24m room, and the depth is a target of the later check of physical storage and door passage.
@evidence principles/core/common.md#scope-preservation Does not merge the storage into an inaccessible name inside the bathroom or service room and keeps it as a room directly connected to the corridor.
@evidence principles/core/common.md#substantive-completion Sets the four cell boundaries, the upper-storey membership, and the corridor-storage door, so even a small space has an independent revision address.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds to the upper storage program the placement of a short division in the middle of the core and an independent door.
@evidence principles/design/spaces.md#space-topology upper-storage lies between the bathroom and the service room but receives passage directly from upper-corridor, not from those two rooms.
@evidence principles/design/spaces.md#space-boundary-authority Owns here z=-0.14..1.10 of the storage cell and derives the end walls and the door host from the adjacent faces.
@evidence principles/design/spaces.md#space-verification-address Compares the open leaf and the linen cabinet with the shallow cell, detecting a storage placement that blocks actual passage.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the direct entrance requirement of the upper storage with the middle room of the core. There is no planning reason to ask the parent for passage through the service room or deletion of the storage.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Keeps the upper storage as an opaque core room reached from the straight corridor through an actual door.
@evidence settings/002-household.md#upper-program Sets the clear area and direct corridor door of a separate upper storage room where the linen and cleaning cabinets fit. The cabinet prototypes and placement are handled by models and instances.
-->

The parent of room id upper-storage is [upper-storey](#upper-level). The clear plan is one rectangle x=-5.26..-3.02, z=-0.14..1.10m, and the y range is owned by the storey owner. It is linen storage attached directly to the corridor. No connection is made in which the storage can be reached only by entering the service room or the bathroom. It consumes the [upper living program](../settings/002-household.md#upper-program).

The direct entrance uses the actual opening and route of [corridor-storage](#corridor-storage). The cell perimeter is distinguished from the [stair opening](#stair-opening) so that no unowned floor or passage outside rooms is made. The [full verification](#stage-one-verification) checks the cell, doors, furniture passage, and in-room observation.

## Upper service and laundry room {#upper-service}

<!--
@evidence principles/core/common.md#declared-basis Adopts the separate service and laundry room program as the union of two cells that includes the floor band west of the stair.
@evidence principles/core/common.md#scope-preservation Does not turn the laundry and service room into a sleeping room or a second corridor and puts even the leftover space beside the stair into one closed room.
@evidence principles/core/common.md#substantive-completion Sets the extents of the two cells, the open seam, and the closed boundaries west of the stair and at the corridor front, explaining the ends of the L-shaped perimeter.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds to the living role of upper-service an L-shaped layout combining the wide front part beside the stair and the rear wing reaching the corridor.
@evidence principles/design/spaces.md#space-topology The two cells are one upper-service with seam passage and the direct entrance of corridor-service, and it does not open onto the stair hole.
@evidence principles/design/spaces.md#space-boundary-authority Distinguishes the union perimeter from the closed segments facing the stair and corridor so that a separate owner cannot generate the seam or a nonexistent wall.
@evidence principles/design/spaces.md#space-verification-address Leaves the concave corner and extension observations, the stair opening interference, and the service, door, and passage checks as questions of this L-shaped room.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the two cells and the closed side walls so that the separate service room and the single stair and corridor are preserved at the same time. No second corridor or change of use to a sleeping room is required of the parent.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Gathers the services into the right opaque core and makes a door directly to the corridor without leaving the floor band beside the stair as a disconnected zone.
@evidence settings/002-household.md#upper-program Provides a separate upper room for the washer and dryer, cleaning storage, and inspection area and does not make it a service pass-through path for other rooms.
-->

The parent of room id upper-service is [upper-storey](#upper-level). The clear plan is the union of x=-5.26..-1.42, z=-5.76..-1.98m and x=-5.26..-3.02, z=-1.98..-0.32m, and the y range is owned by the storey owner. It is one L-shaped room that includes the upper floor band west of the stair. The seam of the two cells is open, and walls are placed only on the perimeter. The boundaries at x=-1.42..-1.24 west of the stair opening and at z=-1.98..-1.80 at the corridor front are closed. The wall at x=-3.02..-2.84 exists only behind z=-1.98. It consumes the [upper living program](../settings/002-household.md#upper-program).

The direct entrance uses the actual opening and route of [corridor-service](#corridor-service). The cell perimeter is distinguished from the [stair opening](#stair-opening) so that no unowned floor or passage outside rooms is made. The [full verification](#stage-one-verification) checks the cell, doors, furniture passage, and in-room observation. In addition to the four corners, the L-shaped room adds observations of the concave corner and the extension.

## Corridor–primary bedroom door {#corridor-primary}

<!--
@evidence principles/core/common.md#declared-basis Adopted the x=-0.58 centre and a 0.90×2.20m clear door for the requirement of a primary bedroom directly connected to the upper corridor.
@evidence principles/core/common.md#scope-preservation Connects the rear primary bedroom without going via another sleeping room and keeps the door leaf and frame as actual occupancy too.
@evidence principles/core/common.md#substantive-completion The host, sill, centre, size, and opening into the primary bedroom are decided, so the furniture placer does not choose the room door position again.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Turns the abstract edge from the corridor to the primary bedroom into a specific door of the rear shared wall and the cell endpoints on both sides.
@evidence principles/design/spaces.md#space-topology It is one door piercing the boundary between upper-corridor and primary-bedroom and includes no third room in from/to.
@evidence principles/design/spaces.md#space-boundary-authority The door owns the x centre and effective width, and the host plane comes from the two clear faces of wall-corridor-primary.
@evidence principles/design/spaces.md#space-verification-address Checks by door id the frame containment within the shared span, the route endpoint inside the primary bedroom, and the open leaf collision.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the upper direct room door and the ordinary door canon with the rear shared span of the corridor. There is no need to require passing through a bedroom or branching the corridor of the parent.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements The primary bedroom is connected through an actual door at the end of the short straight corridor and does not remain a disconnected rear room.
@evidence settings/002-household.md#design-subject-conditions Includes the open leaf inside the primary bedroom among the obstacles of the cylinder check and does not approve passage on the nominal door width alone.
-->

It is the one direct door [upper-corridor](#upper-corridor) ↔ [primary-bedroom](#primary-bedroom). The host wall is [wall-corridor-primary](#wall-corridor-primary), the centre in the width direction is x=-0.58m, and the clear width is 0.90m and the clear height 2.20m. The sill is placed on the [upper floor](#upper-level). The door leaf and frame opening into the room do not block the corridor, and the opened member is also included among the obstacles of the passage cylinder check.

The door hole is derived by adding the jamb and head thicknesses, and the route enters at least 0.20m into the cells on both sides from the centre of that hole. The [full verification](#stage-one-verification) checks whether the clear width and the frame fit inside the actual shared wall span and whether the route endpoints and door-state match the physical door.

## Corridor–small bedroom 1 door {#corridor-child-one}

<!--
@evidence principles/core/common.md#declared-basis Adopted the corridor direct connection condition of the first small bedroom as a door centred at z=-0.95 in the L-shaped extension.
@evidence principles/core/common.md#scope-preservation Makes no detour through the stair hole or the second bedroom to enter the front bedroom.
@evidence principles/core/common.md#substantive-completion Designates the 0.90×2.20m clear, the host, the upper sill, and the opening into the room, fixing the entry position of the short L-shaped extension.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Makes the direct access of small bedroom 1 concrete as a physical portal crossing the wall thickness at the west perimeter of the extension.
@evidence principles/design/spaces.md#space-topology The corridor and the extension cell of child-bedroom-1 are the two sides of the door, which continues to the front main body through the open seam.
@evidence principles/design/spaces.md#space-boundary-authority The door's z centre is set here, and the host span is consumed from the perimeter of the L union so that the seam is not mistaken for a wall.
@evidence principles/design/spaces.md#space-verification-address Checks the frame margin in the short shared span, the open leaf, and the route endpoint inside the actual extension cell.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the direct entrance of upper-graph and the ordinary door with the width of the L-shaped extension. The room door can be assigned without splitting the room or adding a corridor.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Keeps the first small bedroom's direct upper door as a physical opening and does not reuse the stairwell as the room's access passage.
@evidence settings/002-household.md#design-subject-conditions The open door leaf of the L-shaped extension is also an obstacle of the designated cylinder, and if the actual clearance cannot be measured it remains unverified.
-->

It is the one direct door [upper-corridor](#upper-corridor) ↔ [child-bedroom-1](#child-bedroom-1). The host wall is [wall-corridor-child-one](#wall-corridor-child-one), the centre in the width direction is z=-0.95m, and the clear width is 0.90m and the clear height 2.20m. The sill is placed on the [upper floor](#upper-level). The door leaf and frame opening into the room do not block the corridor, and the opened member is also included among the obstacles of the passage cylinder check.

The door hole is derived by adding the jamb and head thicknesses, and the route enters at least 0.20m into the cells on both sides from the centre of that hole. The [full verification](#stage-one-verification) checks whether the clear width and the frame fit inside the actual shared wall span and whether the route endpoints and door-state match the physical door.

## Corridor–small bedroom 2 door {#corridor-child-two}

<!--
@evidence principles/core/common.md#declared-basis Chose the centre z=1.05 and clear 0.90×2.20m for the independent entrance of the second small bedroom.
@evidence principles/core/common.md#scope-preservation Connects the east bedroom directly from the corridor and does not turn it into a continuous passage to another bedroom.
@evidence principles/core/common.md#substantive-completion Designates the upper sill, the leaf and frame opening into the room, and the endpoints on both sides, providing the inputs to implement an actual door.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Added the centre position in the shared wall and the physical occupancy to the required edge between the second sleeping room and the corridor.
@evidence principles/design/spaces.md#space-topology It is the single door from upper-corridor to child-bedroom-2, and this door makes no connection other than the two rooms.
@evidence principles/design/spaces.md#space-boundary-authority wall-corridor-child-two owns the host plane/span, and this H2 owns the clear dimensions and the z centre.
@evidence principles/design/spaces.md#space-verification-address Asks whether the frame leaves the host span and whether the route entering the room passes through the open leaf or furniture.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the direct corridor connection of the second small bedroom and the ordinary inward door with the east shared span, and no change to the parent room count or graph was needed.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Keeps the address that realizes the independent reachability of the second small bedroom with a side door of the straight corridor.
@evidence settings/002-household.md#design-subject-conditions Checks cylinder passage in the door state including the open leaf and does not confuse effective width and actual collision as the same measurement.
-->

It is the one direct door [upper-corridor](#upper-corridor) ↔ [child-bedroom-2](#child-bedroom-2). The host wall is [wall-corridor-child-two](#wall-corridor-child-two), the centre in the width direction is z=1.05m, and the clear width is 0.90m and the clear height 2.20m. The sill is placed on the [upper floor](#upper-level). The door leaf and frame opening into the room do not block the corridor, and the opened member is also included among the obstacles of the passage cylinder check.

The door hole is derived by adding the jamb and head thicknesses, and the route enters at least 0.20m into the cells on both sides from the centre of that hole. The [full verification](#stage-one-verification) checks whether the clear width and the frame fit inside the actual shared wall span and whether the route endpoints and door-state match the physical door.

## Corridor–bathroom door {#corridor-bathroom}

<!--
@evidence principles/core/common.md#declared-basis An authoring choice that assigns a 0.90×2.20m door at z=1.86 to the direct corridor access of the upper bathroom.
@evidence principles/core/common.md#scope-preservation Bathroom entry does not go through a bedroom or storage, and an actual door leaf and frame must exist even behind the opaque core.
@evidence principles/core/common.md#substantive-completion Sets the opening into the bathroom, the upper sill, the host, and the route's cell entry, so the core door is not left as a simple hole.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Makes the upper sanitary access concrete as a designated door centre in the shared wall west of the corridor and the physical leaf occupancy.
@evidence principles/design/spaces.md#space-topology It is a door that connects upper-corridor and upper-bathroom directly and does not connect to the bath's other adjacent spaces.
@evidence principles/design/spaces.md#space-boundary-authority The bathroom door width comes from this owner, and the wall centre plane and whole span are referenced from wall-corridor-bathroom without derivation.
@evidence principles/design/spaces.md#space-verification-address Verifies the containment of the door frame in the shared span and the interference of the inward leaf, the sanitary fixtures, and the route endpoints.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the bathroom directly connected to the corridor and the ordinary door conditions with the side wall of the core. This opening does not require the parent to route through another room or add a corridor.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Keeps the relation that the right core bathroom must reach the single upper corridor directly through an actual door.
@evidence settings/002-household.md#design-subject-conditions Does not exclude the door opened into the bathroom or the sanitary fixtures from the cylinder check and claims no actual bodily accessibility certification.
-->

It is the one direct door [upper-corridor](#upper-corridor) ↔ [upper-bathroom](#upper-bathroom). The host wall is [wall-corridor-bathroom](#wall-corridor-bathroom), the centre in the width direction is z=1.86m, and the clear width is 0.90m and the clear height 2.20m. The sill is placed on the [upper floor](#upper-level). The door leaf and frame opening into the room do not block the corridor, and the opened member is also included among the obstacles of the passage cylinder check.

The door hole is derived by adding the jamb and head thicknesses, and the route enters at least 0.20m into the cells on both sides from the centre of that hole. The [full verification](#stage-one-verification) checks whether the clear width and the frame fit inside the actual shared wall span and whether the route endpoints and door-state match the physical door.

## Corridor–storage door {#corridor-storage}

<!--
@evidence principles/core/common.md#declared-basis Adopted the centre z=0.48 and clear 0.90×2.20m for the independent door of the upper storage.
@evidence principles/core/common.md#scope-preservation Keeps a door member and direct access even for the small storeroom and does not turn it into storage used only from the bathroom or service room.
@evidence principles/core/common.md#substantive-completion Designated the door centre and size in the narrow shared span, the upper sill, and the opening into the room.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Expands the direct connection of the linen storage into a physical portal in the short wall in the middle of the core.
@evidence principles/design/spaces.md#space-topology It is the only door connecting upper-storage and the corridor, and there is no additional route at the boundaries with the neighbouring bathroom and service room.
@evidence principles/design/spaces.md#space-boundary-authority Sets the storage door dimensions in this H2 and fits them within the actual overlapping face length of wall-corridor-storage.
@evidence principles/design/spaces.md#space-verification-address Checks whether the jambs, head, and clear width fit the host span within the 1.24m room length and the passage behind the open door.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the upper storage and the direct corridor access with the small shared span and kept a design that contains the door frame. The parent was not revised to remove the storage or route through another room.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements The storage is a destination reached through an actual door of the straight corridor, not a disconnected space that exists only as a label.
@evidence settings/002-household.md#design-subject-conditions Keeps in view that the open leaf and furniture inside the narrow storeroom can block the designated cylinder passage, and does not replace the check with a nominal opening.
-->

It is the one direct door [upper-corridor](#upper-corridor) ↔ [upper-storage](#upper-storage). The host wall is [wall-corridor-storage](#wall-corridor-storage), the centre in the width direction is z=0.48m, and the clear width is 0.90m and the clear height 2.20m. The sill is placed on the [upper floor](#upper-level). The door leaf and frame opening into the room do not block the corridor, and the opened member is also included among the obstacles of the passage cylinder check.

The door hole is derived by adding the jamb and head thicknesses, and the route enters at least 0.20m into the cells on both sides from the centre of that hole. The [full verification](#stage-one-verification) checks whether the clear width and the frame fit inside the actual shared wall span and whether the route endpoints and door-state match the physical door.

## Corridor–service room door {#corridor-service}

<!--
@evidence principles/core/common.md#declared-basis Adopts a 0.90×2.20m door centred at z=-0.95 for the direct access of the separate upper service room.
@evidence principles/core/common.md#scope-preservation The service room is entered from the corridor, and its L-shaped front part is not made an additional passage entered via the stair.
@evidence principles/core/common.md#substantive-completion Designated the actual wall host, the upper sill, and the opening into the room, and set that both endpoints must enter their own cells.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Makes the independent service room program concrete as a side door where the L's rear wing meets the corridor.
@evidence principles/design/spaces.md#space-topology corridor-service enters the rear cell of upper-service from the corridor and continues to the front part through the open seam.
@evidence principles/design/spaces.md#space-boundary-authority The perimeter of the service union decides the host span, and this opening owns the centre, the clear dimensions, the opening into the room, and the route connection.
@evidence principles/design/spaces.md#space-verification-address Compares under this door id the host range, the route endpoints, and the interference of the open leaf with the laundry equipment.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the connection of the separate service room and the single corridor with the rear wing. The direct door is assigned without a parent graph change passing through the upper stair or storage.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Connects the service core directly to the single straight corridor and leaves no disconnected upper destination.
@evidence settings/002-household.md#design-subject-conditions Keeps the open leaf inside the service room as a cylinder obstacle and does not extend to the actual maintenance working radius or human safety certification.
-->

It is the one direct door [upper-corridor](#upper-corridor) ↔ [upper-service](#upper-service). The host wall is [wall-corridor-service](#wall-corridor-service), the centre in the width direction is z=-0.95m, and the clear width is 0.90m and the clear height 2.20m. The sill is placed on the [upper floor](#upper-level). The door leaf and frame opening into the room do not block the corridor, and the opened member is also included among the obstacles of the passage cylinder check.

The door hole is derived by adding the jamb and head thicknesses, and the route enters at least 0.20m into the cells on both sides from the centre of that hole. The [full verification](#stage-one-verification) checks whether the clear width and the frame fit inside the actual shared wall span and whether the route endpoints and door-state match the physical door.

## Entry and workroom shared wall {#wall-entry-flex}

<!--
@evidence principles/core/common.md#declared-basis Takes the clear faces of entry +X and workroom -X as inputs and interprets the mean centre plane and the actual gap as the wall.
@evidence principles/core/common.md#scope-preservation Keeps the workroom's independent boundary along its whole length but lets only entry-flex pass, so the room is not merged into the continuous common area.
@evidence principles/core/common.md#substantive-completion Sets the overlapping perimeter segment, the storey height, the two adjacent rooms, and the only opening, fixing the existence of the wall between the two rooms.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Refines the relation of the workroom directly connected to the entry into a combination of a closed shared wall and one pocket opening.
@evidence principles/design/spaces.md#space-topology entry and flex-workroom are the rooms on both sides of this boundary, and passage is limited to entry-flex.
@evidence principles/design/spaces.md#space-boundary-authority Finds the plane from the mean of both faces and compares the gap with the interior wall thickness of the datum, so no separate wall centre is made per room.
@evidence principles/design/spaces.md#space-verification-address Keeps an unauthorized gap outside the pocket opening, differing centre planes, and duplicate faces as the verification of this shared boundary.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the ground-floor directly connected workroom and the interior wall datum with the facing faces of the two rooms. The parent connection is kept, and the closed part and the door can be set in the spatial boundary.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Keeps the actual wall and door relation of the variable room directly connected to the entry and does not claim an independent room from a cell label alone.
-->

This boundary lies between the +X clear face of [entry](#entry) and the -X clear face of [flex-workroom](#flex-workroom). It uses the whole length over which the two rooms' facing perimeter segments overlap, and an internal L seam is not counted as perimeter. The centre plane is derived as the arithmetic mean of the two clear face positions. If the distance between the two faces differs from the [interior wall thickness](#mass-and-storeys), the check fails as a contradiction of the room boundary inputs.

The vertical extent is the floor–ceiling of the storey to which the two rooms belong. The boundary's adjacent spaces are only these two rooms, and [entry-flex](#entry-flex) is the only passage opening. Room cells do not replace the wall geometry; the structural body is handled by the corresponding storey owner, and the exposed interior finishes on both sides by each room owner. The [full verification](#stage-one-verification) detects differing centre planes, routes crossing the wall, gaps passing without an opening, and duplicate faces.

## Entry and common area shared wall {#wall-entry-common}

<!--
@evidence principles/core/common.md#declared-basis Takes the overlap of the rear clear face of the entry and the front clear face of the common area as the basis of the shared wall.
@evidence principles/core/common.md#scope-preservation Preserves the opening from the entry to the common area while filling the rest of the boundary with a physical wall, leaving no unowned strip.
@evidence principles/core/common.md#substantive-completion Designates the facing +Z/-Z faces of the two rooms, the storey's vertical extent, and entry-common, distinguishing connection from closure.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Expands the requirement of direct connection to the common area into a shared boundary between the two rooms and one leafless opening.
@evidence principles/design/spaces.md#space-topology entry and common-room meet at this wall, but passage arises only through entry-common.
@evidence principles/design/spaces.md#space-boundary-authority The wall plane is the mean of the two faces and the whole span is the overlap length, so no separate front coordinate of the common area is made.
@evidence principles/design/spaces.md#space-verification-address Detects route penetration outside the door, double walls, and unclosed gaps by comparing the actual boundary and connector.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the rear common area directly connected to the entry and the single stair circulation with this shared span, and the opening can be placed without an additional corridor.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Attributes the host of the opening leading straight into the rear continuous common area to an actual boundary with thickness.
-->

This boundary lies between the +Z clear face of [entry](#entry) and the -Z clear face of [common-room](#common-room). It uses the whole length over which the two rooms' facing perimeter segments overlap, and an internal L seam is not counted as perimeter. The centre plane is derived as the arithmetic mean of the two clear face positions. If the distance between the two faces differs from the [interior wall thickness](#mass-and-storeys), the check fails as a contradiction of the room boundary inputs.

The vertical extent is the floor–ceiling of the storey to which the two rooms belong. The boundary's adjacent spaces are only these two rooms, and [entry-common](#entry-common) is the only passage opening. Room cells do not replace the wall geometry; the structural body is handled by the corresponding storey owner, and the exposed interior finishes on both sides by each room owner. The [full verification](#stage-one-verification) detects differing centre planes, routes crossing the wall, gaps passing without an opening, and duplicate faces.

## Entry and powder room shared wall {#wall-entry-powder}

<!--
@evidence principles/core/common.md#declared-basis Takes the east clear face of the powder room and the west clear face of the entry as inputs of the common boundary and takes the height from the ground-floor datum.
@evidence principles/core/common.md#scope-preservation Keeps both the closed character of the core sanitary room and the direct door from the entry, allowing no missing side other than the door.
@evidence principles/core/common.md#substantive-completion Designated the two adjacent spaces and the one entry-powder and decided the derivation rules of the wall's length, centre, and thickness.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Narrows the powder room placement accessed from the entry to the shared face of the sanitary room and the entry and one opening relation.
@evidence principles/design/spaces.md#space-topology This boundary separates only the powder room and the entry and makes no separate passage to the storage or the stair.
@evidence principles/design/spaces.md#space-boundary-authority Compares the difference of powder +X/entry -X with the interior wall datum, so a mismatch is not absorbed into an arbitrary thickness.
@evidence principles/design/spaces.md#space-verification-address Refutes under the same boundary id entry into the powder room outside the actual opening, differing planes, and duplicate finishes.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the sanitary room directly off the entry and the right core conditions with the two clear faces. The composition of this wall does not change the parent's sanitary room position or passage graph.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements The right core sanitary room is closed by physical boundaries and reached without a break through the entry door.
-->

This boundary lies between the +X clear face of [powder-utility](#powder-utility) and the -X clear face of [entry](#entry). It uses the whole length over which the two rooms' facing perimeter segments overlap, and an internal L seam is not counted as perimeter. The centre plane is derived as the arithmetic mean of the two clear face positions. If the distance between the two faces differs from the [interior wall thickness](#mass-and-storeys), the check fails as a contradiction of the room boundary inputs.

The vertical extent is the floor–ceiling of the storey to which the two rooms belong. The boundary's adjacent spaces are only these two rooms, and [entry-powder](#entry-powder) is the only passage opening. Room cells do not replace the wall geometry; the structural body is handled by the corresponding storey owner, and the exposed interior finishes on both sides by each room owner. The [full verification](#stage-one-verification) detects differing centre planes, routes crossing the wall, gaps passing without an opening, and duplicate faces.

## Common area and storage shared wall {#wall-common-storage}

<!--
@evidence principles/core/common.md#declared-basis Sets the length over which the rear face of storage and the front face of common overlap as the extent of the wall with the storage door.
@evidence principles/core/common.md#scope-preservation Connects the storage directly to the rear common area but closes everything outside the door, keeping the extent of a separate room.
@evidence principles/core/common.md#substantive-completion Keeps common-storage as the only opening and derives the wall span, plane, and height from the two rooms and the ground datum.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Gives the edge from the common area to the storage a thick boundary and closed faces other than the door.
@evidence principles/design/spaces.md#space-topology The adjacent spaces of this boundary are only common-room and storage-1f, and storage access follows the stated door.
@evidence principles/design/spaces.md#space-boundary-authority Takes the storage and common area clear coordinates and uses the gap mean and difference, keeping no second dimensional source for the wall.
@evidence principles/design/spaces.md#space-verification-address Fully checks the agreement of the common-storage route with the wall cut, penetration outside the opening, and double walls.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the ground-floor storage placement directly connected to the common area with the shared face and the door. No parent change redirecting a new entrance to the entry is needed.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Keeps even the storage of the opaque core as a room with an actual door and boundary, not leaving reachability to a space label.
-->

This boundary lies between the +Z clear face of [storage-1f](#storage-1f) and the -Z clear face of [common-room](#common-room). It uses the whole length over which the two rooms' facing perimeter segments overlap, and an internal L seam is not counted as perimeter. The centre plane is derived as the arithmetic mean of the two clear face positions. If the distance between the two faces differs from the [interior wall thickness](#mass-and-storeys), the check fails as a contradiction of the room boundary inputs.

The vertical extent is the floor–ceiling of the storey to which the two rooms belong. The boundary's adjacent spaces are only these two rooms, and [common-storage](#common-storage) is the only passage opening. Room cells do not replace the wall geometry; the structural body is handled by the corresponding storey owner, and the exposed interior finishes on both sides by each room owner. The [full verification](#stage-one-verification) detects differing centre planes, routes crossing the wall, gaps passing without an opening, and duplicate faces.

## Corridor and primary bedroom shared wall {#wall-corridor-primary}

<!--
@evidence principles/core/common.md#declared-basis Takes the mean of the rear corridor face and the front primary bedroom face as the wall plane and uses the upper datum as the height input.
@evidence principles/core/common.md#scope-preservation Keeps the private boundary of the rear primary bedroom while preserving the one direct door at the end of the corridor.
@evidence principles/core/common.md#substantive-completion Designates the host and adjacent rooms of corridor-primary and decides the whole clear face overlap as the wall length.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds to the primary bedroom's direct corridor access the physical combination of a room-separating wall and one opening.
@evidence principles/design/spaces.md#space-topology Takes only the space between the corridor and the primary bedroom as the boundary and does not mix the relations with the other bedrooms into this wall.
@evidence principles/design/spaces.md#space-boundary-authority Consumes the Z faces of the primary bedroom and corridor to make the boundary and allows no independently authored wall coordinates.
@evidence principles/design/spaces.md#space-verification-address Checks per shared wall the passage of the rear door route through the actual cut and the gaps and duplicate faces outside the door.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the direct door from the straight corridor to the primary bedroom and the datum thickness with the facing faces, and there is no need to change the parent bedroom and corridor composition.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements The primary bedroom has a door in the actual boundary of the single corridor and is reached without a corridor extension or branch.
-->

This boundary lies between the +Z clear face of [upper-corridor](#upper-corridor) and the -Z clear face of [primary-bedroom](#primary-bedroom). It uses the whole length over which the two rooms' facing perimeter segments overlap, and an internal L seam is not counted as perimeter. The centre plane is derived as the arithmetic mean of the two clear face positions. If the distance between the two faces differs from the [interior wall thickness](#mass-and-storeys), the check fails as a contradiction of the room boundary inputs.

The vertical extent is the floor–ceiling of the storey to which the two rooms belong. The boundary's adjacent spaces are only these two rooms, and [corridor-primary](#corridor-primary) is the only passage opening. Room cells do not replace the wall geometry; the structural body is handled by the corresponding storey owner, and the exposed interior finishes on both sides by each room owner. The [full verification](#stage-one-verification) detects differing centre planes, routes crossing the wall, gaps passing without an opening, and duplicate faces.

## Corridor and small bedroom 1 shared wall {#wall-corridor-child-one}

<!--
@evidence principles/core/common.md#declared-basis Takes the overlap of the corridor's east side and the first small bedroom's west perimeter as the door host and excludes the internal L seam.
@evidence principles/core/common.md#scope-preservation Keeps the directly connected extension of the L-shaped bedroom and does not wrongly extend the shared wall to the seam, splitting the room in two.
@evidence principles/core/common.md#substantive-completion Set the rooms on both sides, the perimeter overlap, the datum height, and the sole passage of corridor-child-one.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Assigns the first bedroom's direct door to the actual boundary between the L perimeter and the corridor.
@evidence principles/design/spaces.md#space-topology This wall separates upper-corridor and the extension of child-bedroom-1 and connects them only at the designated door.
@evidence principles/design/spaces.md#space-boundary-authority Consumes only the overlap of the L cell union's perimeter and the corridor face, so the bedroom's internal seam is not made a separate boundary.
@evidence principles/design/spaces.md#space-verification-address Refutes by plan and the actual boundary the door containment in the short perimeter span, a double centre plane, and closure of the seam.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the upper direct bedroom door condition with the perimeter of the L-shaped extension. There is no need to close the cell seam or add a second corridor to the parent.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Preserves the first small bedroom's direct corridor connection as an actual shared wall and opening relation.
-->

This boundary lies between the +X clear face of [upper-corridor](#upper-corridor) and the -X clear face of [child-bedroom-1](#child-bedroom-1). It uses the whole length over which the two rooms' facing perimeter segments overlap, and an internal L seam is not counted as perimeter. The centre plane is derived as the arithmetic mean of the two clear face positions. If the distance between the two faces differs from the [interior wall thickness](#mass-and-storeys), the check fails as a contradiction of the room boundary inputs.

The vertical extent is the floor–ceiling of the storey to which the two rooms belong. The boundary's adjacent spaces are only these two rooms, and [corridor-child-one](#corridor-child-one) is the only passage opening. Room cells do not replace the wall geometry; the structural body is handled by the corresponding storey owner, and the exposed interior finishes on both sides by each room owner. The [full verification](#stage-one-verification) detects differing centre planes, routes crossing the wall, gaps passing without an opening, and duplicate faces.

## Corridor and small bedroom 2 shared wall {#wall-corridor-child-two}

<!--
@evidence principles/core/common.md#declared-basis Sets the wall by comparing the clear face difference of the second bedroom's west side and the corridor's east side with the interior wall thickness.
@evidence principles/core/common.md#scope-preservation Keeps a physical wall separating the east second bedroom from the corridor and lets only one door pass.
@evidence principles/core/common.md#substantive-completion Fixes the upper height, the whole overlap span, and the corridor-child-two host so that the room boundary has an actual member.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Added the roles of a closed boundary and a door cut to the second sleeping room facing the corridor.
@evidence principles/design/spaces.md#space-topology The two adjacent rooms are upper-corridor and child-bedroom-2, and the boundary outside the door allows no passage.
@evidence principles/design/spaces.md#space-boundary-authority The wall centre plane, thickness, and length are derived from the two room faces, so the bedroom and the corridor do not own different walls.
@evidence principles/design/spaces.md#space-verification-address Checks that the route of corridor-child-two passes the actual opening and that there is no detour outside the wall or duplicate face.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the corridor door of the independent second bedroom with the overlap of the two clear faces and does not revise the parent relation to pass through another bedroom.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Answers the upper condition that keeps each of the two small bedrooms as a room with an actual boundary and door.
-->

This boundary lies between the +X clear face of [upper-corridor](#upper-corridor) and the -X clear face of [child-bedroom-2](#child-bedroom-2). It uses the whole length over which the two rooms' facing perimeter segments overlap, and an internal L seam is not counted as perimeter. The centre plane is derived as the arithmetic mean of the two clear face positions. If the distance between the two faces differs from the [interior wall thickness](#mass-and-storeys), the check fails as a contradiction of the room boundary inputs.

The vertical extent is the floor–ceiling of the storey to which the two rooms belong. The boundary's adjacent spaces are only these two rooms, and [corridor-child-two](#corridor-child-two) is the only passage opening. Room cells do not replace the wall geometry; the structural body is handled by the corresponding storey owner, and the exposed interior finishes on both sides by each room owner. The [full verification](#stage-one-verification) detects differing centre planes, routes crossing the wall, gaps passing without an opening, and duplicate faces.

## Corridor and bathroom shared wall {#wall-corridor-bathroom}

<!--
@evidence principles/core/common.md#declared-basis Takes the bathroom +X and corridor -X faces as inputs of this core boundary and consumes the upper floor–ceiling.
@evidence principles/core/common.md#scope-preservation Closes the space between the bathroom and the corridor but keeps the direct door and does not merge the sanitary room into a pass-through room.
@evidence principles/core/common.md#substantive-completion Decided the two rooms of the boundary, the only corridor-bathroom opening, and the plane/span formula.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Makes the upper bathroom's direct connection condition concrete as a shared boundary with a door on the side of the core.
@evidence principles/design/spaces.md#space-topology Only upper-bathroom and upper-corridor adjoin this wall, and the passage connector belongs to the designated door.
@evidence principles/design/spaces.md#space-boundary-authority If the gap between the two faces differs from the datum, it fails as an input contradiction, and the bathroom area is not corrected at will from the wall side.
@evidence principles/design/spaces.md#space-verification-address A route outside the bathroom door, a gap without an opening, and duplicate finishes are failure items of the actual boundary verification.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the opaque core and the direct sanitary access from the corridor with the shared face, and no change to the parent's room placement or corridor form was needed.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Connects the core bathroom to the single corridor through an actual door and does not leave it as a logical division without walls.
-->

This boundary lies between the +X clear face of [upper-bathroom](#upper-bathroom) and the -X clear face of [upper-corridor](#upper-corridor). It uses the whole length over which the two rooms' facing perimeter segments overlap, and an internal L seam is not counted as perimeter. The centre plane is derived as the arithmetic mean of the two clear face positions. If the distance between the two faces differs from the [interior wall thickness](#mass-and-storeys), the check fails as a contradiction of the room boundary inputs.

The vertical extent is the floor–ceiling of the storey to which the two rooms belong. The boundary's adjacent spaces are only these two rooms, and [corridor-bathroom](#corridor-bathroom) is the only passage opening. Room cells do not replace the wall geometry; the structural body is handled by the corresponding storey owner, and the exposed interior finishes on both sides by each room owner. The [full verification](#stage-one-verification) detects differing centre planes, routes crossing the wall, gaps passing without an opening, and duplicate faces.

## Corridor and upper storage shared wall {#wall-corridor-storage}

<!--
@evidence principles/core/common.md#declared-basis The whole overlap of the upper storage's east face and the corridor's west face is the basis of this short door host.
@evidence principles/core/common.md#scope-preservation Keeps the wall separating the storage room together with its sole door, so the small room is not reduced to a decorative label.
@evidence principles/core/common.md#substantive-completion Derives centre, thickness, and span from the two clear faces and set that only corridor-storage passes.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Assigns to the independent access of the linen storage the closure of a short actual shared wall and a door hole.
@evidence principles/design/spaces.md#space-topology It is the boundary of upper-storage and upper-corridor and does not mix in the service room or bathroom as pass-through targets.
@evidence principles/design/spaces.md#space-boundary-authority Consumes the short z extent of the storage room as it is and does not extend the wall span outside the room to fit the door.
@evidence principles/design/spaces.md#space-verification-address Compares at this boundary the actual shared span and door frame, passage outside the opening, and whether there are double walls.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the condition of a direct upper storage with the short side wall and kept the door assignment. There is no reason to delete the parent's storage program or turn it into a core pass-through room.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Preserves together the closed room boundary of the upper storage and the direct access of the straight corridor.
-->

This boundary lies between the +X clear face of [upper-storage](#upper-storage) and the -X clear face of [upper-corridor](#upper-corridor). It uses the whole length over which the two rooms' facing perimeter segments overlap, and an internal L seam is not counted as perimeter. The centre plane is derived as the arithmetic mean of the two clear face positions. If the distance between the two faces differs from the [interior wall thickness](#mass-and-storeys), the check fails as a contradiction of the room boundary inputs.

The vertical extent is the floor–ceiling of the storey to which the two rooms belong. The boundary's adjacent spaces are only these two rooms, and [corridor-storage](#corridor-storage) is the only passage opening. Room cells do not replace the wall geometry; the structural body is handled by the corresponding storey owner, and the exposed interior finishes on both sides by each room owner. The [full verification](#stage-one-verification) detects differing centre planes, routes crossing the wall, gaps passing without an opening, and duplicate faces.

## Corridor and service room shared wall {#wall-corridor-service}

<!--
@evidence principles/core/common.md#declared-basis Uses as the wall extent only the overlap of the east perimeter of the service room's L and the corridor's west side, excluding the internal seam.
@evidence principles/core/common.md#scope-preservation Keeps the independent boundary of the separate service room and its one direct room door and does not confuse them with the front stair side wall.
@evidence principles/core/common.md#substantive-completion Set the combination of upper-service, upper-corridor, and corridor-service and the wall calculation based on the common datum.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds to the direct entrance of the upper service room the spatial decision to use the perimeter of the L's rear wing as the host.
@evidence principles/design/spaces.md#space-topology This boundary separates the rear service cell and the corridor and, past the door, reaches the whole service room through the open seam.
@evidence principles/design/spaces.md#space-boundary-authority Takes only the union perimeter segments and computes the face mean, so the joint line inside the cells is not taken as a new wall.
@evidence principles/design/spaces.md#space-verification-address A route leaving the service door and wrong closure or duplicate faces of the L seam are refuted by the actual plan and boundary checks.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the separate access of the service room and the unbranched corridor condition with the rear shared face, and there is no contradiction requiring an additional passage from the parent.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Lets one room of the right service core be reached through an actual door of the corridor and does not leave it as a disconnected name beside the stair.
-->

This boundary lies between the +X clear face of [upper-service](#upper-service) and the -X clear face of [upper-corridor](#upper-corridor). It uses the whole length over which the two rooms' facing perimeter segments overlap, and an internal L seam is not counted as perimeter. The centre plane is derived as the arithmetic mean of the two clear face positions. If the distance between the two faces differs from the [interior wall thickness](#mass-and-storeys), the check fails as a contradiction of the room boundary inputs.

The vertical extent is the floor–ceiling of the storey to which the two rooms belong. The boundary's adjacent spaces are only these two rooms, and [corridor-service](#corridor-service) is the only passage opening. Room cells do not replace the wall geometry; the structural body is handled by the corresponding storey owner, and the exposed interior finishes on both sides by each room owner. The [full verification](#stage-one-verification) detects differing centre planes, routes crossing the wall, gaps passing without an opening, and duplicate faces.

## Ground-floor core internal boundary {#wall-powder-storage}

<!--
@evidence principles/core/common.md#declared-basis Sets the part where the rear face of the powder room and the front face of the storage face each other as a doorless core internal wall.
@evidence principles/core/common.md#scope-preservation Keeps the sanitary room and the storeroom as independent destinations and does not turn the contact of the two rooms into a passage permission.
@evidence principles/core/common.md#substantive-completion Fixed the closure of the whole overlap segment, the storey height, the absence of an opening or connector, and the structure and finish responsibilities.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds an actual separating boundary without an entrance to the independent use of the two core functions.
@evidence principles/design/spaces.md#space-topology The two rooms are adjacent but do not pass to each other, and each uses its own door on the entry or the common area.
@evidence principles/design/spaces.md#space-boundary-authority The centre and thickness come from the two room faces and fail if they differ from the datum, so no separate core division line is made.
@evidence principles/design/spaces.md#space-verification-address Checks a missing partition and the forbidden powder→storage route as counterexamples of the closed boundary.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the independent sanitary and storage destinations with the ground graph; each can keep its own entrance, so there is no need to add a core pass-through circulation to the parent.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Divides the rooms of the opaque core with actual boundaries and does not add arbitrary doors on the ground of resolving disconnection.
-->

It is the boundary that closes the whole overlap segment where the +Z perimeter clear face of [powder-utility](#powder-utility) and the -Z perimeter clear face of [storage-1f](#storage-1f) face each other. The internal seam of an L cell is excluded. The position is the mean of the two clear faces and the thickness is derived from their difference, which must equal the [interior wall thickness](#mass-and-storeys). The height consumes the storey datum of the two rooms.

This boundary has no opening or passage connector. The legitimate entrance of each room is only through the door linked by its room H2. The structural body is handled by the storey owner and the interior finishes on both faces by the corresponding room owner. The [full verification](#stage-one-verification) checks gaps without walls, two differing centre planes, and forbidden passage between rooms.

## Workroom and common area boundary {#wall-flex-common}

<!--
@evidence principles/core/common.md#declared-basis Uses the clear face overlap of the rear of the workroom and the front of the common area as the input of a closed wall.
@evidence principles/core/common.md#scope-preservation Keeps the independence of the workroom directly connected to the entry and does not cut an additional entrance into the common area behind.
@evidence principles/core/common.md#substantive-completion Sets the whole overlap of the two rooms, the floor–ceiling, and the no-opening condition so that it becomes an actual closed boundary.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds the relation of a separating face without passage to the adjacent placement of the workroom and the common area.
@evidence principles/design/spaces.md#space-topology flex and common share this wall but move between each other only through their own entry connections.
@evidence principles/design/spaces.md#space-boundary-authority Computes the wall from the mean and difference of the room perimeters, so the depth of the common area or the workroom is not rewritten from the wall.
@evidence principles/design/spaces.md#space-verification-address Refutes an unnamed rear passage, a missing wall, and a double plane in the plan and the boundary output.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the workroom's direct access from the entry and the continuous common area requirement with this closed boundary. There is no need to change the parent to an entrance via the common area.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Keeps the variable workroom's direct relation with the entry while distinguishing it from the rear living zone with a physical wall.
-->

It is the boundary that closes the whole overlap segment where the +Z perimeter clear face of [flex-workroom](#flex-workroom) and the -Z perimeter clear face of [common-room](#common-room) face each other. The internal seam of an L cell is excluded. The position is the mean of the two clear faces and the thickness is derived from their difference, which must equal the [interior wall thickness](#mass-and-storeys). The height consumes the storey datum of the two rooms.

This boundary has no opening or passage connector. The legitimate entrance of each room is only through the door linked by its room H2. The structural body is handled by the storey owner and the interior finishes on both faces by the corresponding room owner. The [full verification](#stage-one-verification) checks gaps without walls, two differing centre planes, and forbidden passage between rooms.

## Boundary between the small bedrooms {#wall-child-one-two}

<!--
@evidence principles/core/common.md#declared-basis Derives the wall between the two sleeping rooms from the perimeter overlap of the first bedroom's +Z and the second bedroom's -Z.
@evidence principles/core/common.md#scope-preservation Preserves the two small bedrooms as separate rooms and does not make one pass-through room with a door or open gap between them.
@evidence principles/core/common.md#substantive-completion Assigned an upper-height wall without openings to the whole perimeter excluding the internal L seam.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Spatializes the two small bedroom programs as a closed separating face with actual thickness.
@evidence principles/design/spaces.md#space-topology child1 and child2 are adjacent but each is accessed through its own corridor door and they do not pass directly to each other.
@evidence principles/design/spaces.md#space-boundary-authority Uses the L union perimeter as input, distinguishing the first bedroom's internal seam from the perimeter between the two rooms.
@evidence principles/design/spaces.md#space-verification-address Keeps a forbidden connector and a wall-less gap between the two sleeping rooms as failures of this boundary.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared two independent small bedrooms and their own corridor entrances with this closed boundary. There is no reason to revise the parent to merge the rooms or make a pass-through room.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements The two small bedrooms remain actual separate rooms, and no access via another bedroom is made.
-->

It is the boundary that closes the whole overlap segment where the +Z perimeter clear face of [child-bedroom-1](#child-bedroom-1) and the -Z perimeter clear face of [child-bedroom-2](#child-bedroom-2) face each other. The internal seam of an L cell is excluded. The position is the mean of the two clear faces and the thickness is derived from their difference, which must equal the [interior wall thickness](#mass-and-storeys). The height consumes the storey datum of the two rooms.

This boundary has no opening or passage connector. The legitimate entrance of each room is only through the door linked by its room H2. The structural body is handled by the storey owner and the interior finishes on both faces by the corresponding room owner. The [full verification](#stage-one-verification) checks gaps without walls, two differing centre planes, and forbidden passage between rooms.

## Small bedroom 2 and primary bedroom boundary {#wall-child-two-primary}

<!--
@evidence principles/core/common.md#declared-basis Closes the whole segment where the rear face of the second small bedroom meets the front face of the primary bedroom.
@evidence principles/core/common.md#scope-preservation Keeps the independent boundary of the primary bedroom and the child bedroom, not shrinking the three sleeping room program.
@evidence principles/core/common.md#substantive-completion Sets the shared span, the upper datum, the no-opening condition, and the two-sided finish responsibility, leaving no gap in the separating wall.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Added to the separate entrances of the two bedrooms a physical boundary that blocks direct room-to-room passage.
@evidence principles/design/spaces.md#space-topology There is no connector between child2 and primary, and both rooms use their own doors on the single corridor.
@evidence principles/design/spaces.md#space-boundary-authority Consumes the clear face mean and gap and does not newly set the primary bedroom's front line or child2's depth.
@evidence principles/design/spaces.md#space-verification-address Keeps bedrooms continuing without a wall and an unstated room-to-room passage as verification failures.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the three bedrooms and the direct corridor connection with the facing faces of the two rooms. There is no parent contradiction requiring a door between them.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Divides the primary bedroom and the second small bedroom with an actual boundary and does not bypass the corridor's direct connections.
-->

It is the boundary that closes the whole overlap segment where the +Z perimeter clear face of [child-bedroom-2](#child-bedroom-2) and the -Z perimeter clear face of [primary-bedroom](#primary-bedroom) face each other. The internal seam of an L cell is excluded. The position is the mean of the two clear faces and the thickness is derived from their difference, which must equal the [interior wall thickness](#mass-and-storeys). The height consumes the storey datum of the two rooms.

This boundary has no opening or passage connector. The legitimate entrance of each room is only through the door linked by its room H2. The structural body is handled by the storey owner and the interior finishes on both faces by the corresponding room owner. The [full verification](#stage-one-verification) checks gaps without walls, two differing centre planes, and forbidden passage between rooms.

## Upper service and storage boundary {#wall-service-storage}

<!--
@evidence principles/core/common.md#declared-basis Adopts the rear perimeter of the service room's L and the front of the storage as a doorless core boundary.
@evidence principles/core/common.md#scope-preservation Keeps the services and the linen storage as independent rooms and does not use one as the access passage of the other.
@evidence principles/core/common.md#substantive-completion Designated the closure of the whole room perimeter overlap, the upper datum, and the absence of an opening.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Gives the separate service and storage programs an actual adjacent boundary without a door.
@evidence principles/design/spaces.md#space-topology service and storage adjoin but each uses its own corridor door, and this boundary has no passage connector.
@evidence principles/design/spaces.md#space-boundary-authority Excludes the internal seam of service and takes only the union perimeter and the storage face as wall position inputs.
@evidence principles/design/spaces.md#space-verification-address Checks a gap leaking from the service room to the storage, differing planes of the two rooms, or a missing wall.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the separate direct accesses of the upper service room and the storage with this closed boundary. There is no need to reassign the two functions in the parent as a pass-through relation.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Even inside the core, rooms have independent boundaries and corridor entrances, and no unowned passage is made.
-->

It is the boundary that closes the whole overlap segment where the +Z perimeter clear face of [upper-service](#upper-service) and the -Z perimeter clear face of [upper-storage](#upper-storage) face each other. The internal seam of an L cell is excluded. The position is the mean of the two clear faces and the thickness is derived from their difference, which must equal the [interior wall thickness](#mass-and-storeys). The height consumes the storey datum of the two rooms.

This boundary has no opening or passage connector. The legitimate entrance of each room is only through the door linked by its room H2. The structural body is handled by the storey owner and the interior finishes on both faces by the corresponding room owner. The [full verification](#stage-one-verification) checks gaps without walls, two differing centre planes, and forbidden passage between rooms.

## Upper storage and bathroom boundary {#wall-storage-bath}

<!--
@evidence principles/core/common.md#declared-basis Separates the two core functions with the rear clear face of the upper storage and the front clear face of the bathroom as inputs.
@evidence principles/core/common.md#scope-preservation Does not merge the linen room and the bathroom and preserves each one's direct corridor door.
@evidence principles/core/common.md#substantive-completion Decided the whole facing perimeter length as a no-opening wall of the upper floor–ceiling.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds a separating boundary without passage to the roles of separate sanitary and storage destinations.
@evidence principles/design/spaces.md#space-topology The adjacency of storage and bathroom is expressed by this wall, and passage is owned by each room's corridor portal.
@evidence principles/design/spaces.md#space-boundary-authority Sets the wall from the distance and mean between the two faces and does not change the bathroom depth or storage length from the boundary side.
@evidence principles/design/spaces.md#space-verification-address Links passage between the two no-opening core rooms and gaps or duplicates of the wall to the full verification.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the upper storage and bathroom and their direct access from the single corridor with the closed separating face, and there is no reason to change the parent's room count or access.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Lets the bathroom and the storage be reached as actual individual rooms without making one the transit room of the other.
-->

It is the boundary that closes the whole overlap segment where the +Z perimeter clear face of [upper-storage](#upper-storage) and the -Z perimeter clear face of [upper-bathroom](#upper-bathroom) face each other. The internal seam of an L cell is excluded. The position is the mean of the two clear faces and the thickness is derived from their difference, which must equal the [interior wall thickness](#mass-and-storeys). The height consumes the storey datum of the two rooms.

This boundary has no opening or passage connector. The legitimate entrance of each room is only through the door linked by its room H2. The structural body is handled by the storey owner and the interior finishes on both faces by the corresponding room owner. The [full verification](#stage-one-verification) checks gaps without walls, two differing centre planes, and forbidden passage between rooms.

## Bathroom and primary bedroom side boundary {#wall-bath-primary}

<!--
@evidence principles/core/common.md#declared-basis Sets the part of the clear faces where the bathroom's east side and the primary bedroom's west side overlap as a closed side wall.
@evidence principles/core/common.md#scope-preservation Distinguishes the bathroom the family uses from the corridor from the primary bedroom and does not turn it into a detour entrance exclusive to the primary bedroom.
@evidence principles/core/common.md#substantive-completion The two adjacent rooms, no opening, the upper datum, and the structure and finish responsibilities are decided.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Added a separating relation without a direct door to the side-by-side placement of the rear primary bedroom and the core bathroom.
@evidence principles/design/spaces.md#space-topology bath and primary adjoin at the side but have no passage, and each room reaches its own corridor door.
@evidence principles/design/spaces.md#space-boundary-authority Derives the wall from the overlapping segment of bathroom +X and primary bedroom -X and writes no new core width.
@evidence principles/design/spaces.md#space-verification-address Keeps forbidden passage from the primary bedroom to the bathroom, a wall-less gap, and two differing centre planes as verification targets.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the closed side boundary with the direct corridor connection conditions of the bathroom and the primary bedroom. There is no need to add an en-suite entrance to the parent.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Preserves the graph in which the three bedrooms and the bathroom are each reached directly from the straight corridor.
-->

It is the boundary that closes the whole overlap segment where the +X perimeter clear face of [upper-bathroom](#upper-bathroom) and the -X perimeter clear face of [primary-bedroom](#primary-bedroom) face each other. The internal seam of an L cell is excluded. The position is the mean of the two clear faces and the thickness is derived from their difference, which must equal the [interior wall thickness](#mass-and-storeys). The height consumes the storey datum of the two rooms.

This boundary has no opening or passage connector. The legitimate entrance of each room is only through the door linked by its room H2. The structural body is handled by the storey owner and the interior finishes on both faces by the corresponding room owner. The [full verification](#stage-one-verification) checks gaps without walls, two differing centre planes, and forbidden passage between rooms.

## Service room and corridor front boundary {#wall-service-corridor-front}

<!--
@evidence principles/core/common.md#declared-basis Takes the overlap of the +Z perimeter of the service room's front part and the corridor's -Z face as a closed front boundary.
@evidence principles/core/common.md#scope-preservation Keeps the sole door on the rear side of the service room and does not cut the corridor front into an additional service passage.
@evidence principles/core/common.md#substantive-completion Set it as an upper boundary that closes only the part where the two faces overlap and places no opening or connector.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Made the adjacency of the L-shaped service room and the straight corridor concrete as a closed front face distinct from the existing side entrance.
@evidence principles/design/spaces.md#space-topology This contact face of service and corridor is not passed through, and corridor-service provides the only entrance from another side.
@evidence principles/design/spaces.md#space-boundary-authority Consumes only the overlap of the two clear faces and does not extend the wall to the stair arrival at the corridor front.
@evidence principles/design/spaces.md#space-verification-address Checks in the actual plan a route piercing the doorless front and a boundary over-extended to the stair arrival.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the direct side door of the service room and the corridor starting at the stair landing with the overlap segment. There is no need to change the parent's stair arrival or corridor direction.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Preserves the single corridor starting at the stair landing and makes no unnamed additional passage at the core front.
-->

It is the boundary that closes the whole overlap segment where the +Z perimeter clear face of [upper-service](#upper-service) and the -Z perimeter clear face of [upper-corridor](#upper-corridor) face each other. The internal seam of an L cell is excluded. The position is the mean of the two clear faces and the thickness is derived from their difference, which must equal the [interior wall thickness](#mass-and-storeys). The height consumes the storey datum of the two rooms.

This boundary has no opening or passage connector. The legitimate entrance of each room is only through the door linked by its room H2. The structural body is handled by the storey owner and the interior finishes on both faces by the corresponding room owner. The [full verification](#stage-one-verification) checks gaps without walls, two differing centre planes, and forbidden passage between rooms.

## Upper side walls of the stair hole {#stair-enclosure}

<!--
@evidence principles/core/common.md#declared-basis With the stair hole, the clear edges of the two upper rooms, the storey's 16mm floor finish thickness, and the interior face of the front exterior wall body as inputs, distinguishes the closed side walls, the extent of the stair-side finish faces, and the open corridor arrival.
@evidence principles/core/common.md#scope-preservation Keeps both the stair passage hole and the independent bedroom and service room, and does not push walls into the slab hole, which would reduce the headroom.
@evidence principles/core/common.md#substantive-completion In addition to the closure of the east and west side walls and the front of the child1 extension, the opening of the corridor arrival, and the reason for the 0.18m setback repair, set the front starting point of the side walls, the slab-top start of the finish faces toward the hole and the two junction faces, and the exposure extent and owners of the top of the front strip and the interior face of the exterior wall.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Added to the upper connection of the single stair the decision that secures actual wall thickness between the room boundaries and the hole edges.
@evidence principles/design/spaces.md#space-topology The stair arrives only at the north corridor, and there are closed boundaries toward the service room and the small bedroom, so it does not leak into those rooms.
@evidence principles/design/spaces.md#space-boundary-authority The wall positions are derived from the hole and the room clear edges, and child1's current cell owns the setback coordinate.
@evidence principles/design/spaces.md#space-verification-address Checks together the three closed boundaries, the open arrival, and hole intrusion in the upper plan, stair section, and physical collisions.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the single stair and the direct corridor connection condition with the upper room edges and set back only the child1 extension behind the interior wall thickness. There is no need to change the parent's inter-storey graph.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements While preserving passage through the required stair hole, arrives at the upper straight corridor without going through other rooms.
-->

Closed side walls of the [interior wall thickness](#mass-and-storeys) are placed between the west side of the [stair floor opening](#stair-opening) and the east side of [upper-service](#upper-service), and between its east side and the west side of [child-bedroom-1](#child-bedroom-1). The position is the mean of the facing clear edges. The north arrival section reaching the corridor is open, and the north section reaching the extension of child-bedroom-1 is closed with a wall that secures its thickness in front of the room perimeter.

The short front of child-bedroom-1's extension sets back from the north side of the stair opening by the interior wall thickness. To secure this relation, the earlier candidate z=-1.80 was repaired to z=-1.62, and the room's current cell owns that value. Wall thickness is not put inside the slab hole, which would reduce the headroom of the upper treads. The thin slab strip at the front is the structural margin at the stair opening edge, not another room or corridor. These three boundaries and the open arrival are compared in the upper plan, stair section, and physical collisions of the [full verification](#stage-one-verification).

**Side wall extent and the continuity of the hole faces.** The bodies of the two side walls, like the other interior walls, start at the front z=-5.76, the room clear edge, and close the whole clear edges of upper-service and child-bedroom-1 from the stair void. On the void side, where there is no 6mm room lining, the stair-side finish face of the side walls continues to the interior face of the front exterior wall body at z=-5.766. The storey's 16mm floor finish (y=3.184..3.20) is only inside the room cells, so the stair-side finish faces of the side walls and return facing the hole and the two junctions whose faces lie at the hole edge (the x=-1.24 face at the north end of the west wall and the z=-1.80 face at the west end of the child-bedroom-1 return) run from the slab top y=3.184 to the upper ceiling 6.10. The vertical faces of the hole therefore have no gap between the end of the lower ceiling, the slab cut face 2.908..3.184, and the finish face above it. The earlier source ended the side walls at z=-5.64 and started the stair-side finish at 3.20, so the two rooms opened to the void through a 0.126m gap and a 16mm slot remained at the hole edge (2026-09-24 materials r4 verdict F2).

The top of the front slab strip (x=-1.24..1.58, z=-5.766..-5.64, y=3.184) and the interior face of the front exterior wall body above it (in the same x range, y=3.184..3.28 below the window cut and 6.04..6.10 above the head) remain exposed faces inside the hole. The former is a face of the storey owner and the latter of the front elevation owner, and neither is a shelf for a person to stand on or to put things on. The finishes of the two faces are set by materials.

## Entry and ground-floor storage side boundary {#wall-entry-storage}

<!--
@evidence principles/core/common.md#declared-basis Compared the whole overlap of the storage's east side and the entry's west side with the sole entrance common-storage and set it as a closed wall.
@evidence principles/core/common.md#scope-preservation Does not omit the storage's boundary on the entry side either, so no unnamed passage arises behind the core.
@evidence principles/core/common.md#substantive-completion Fixes the closure and no-opening of the whole z segment, the plane/thickness derivation from the two faces, and the structure and finish ownership.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds, on the opposite side of the decision of storage directly connected to the common area, an actual side wall with no passage to the entry.
@evidence principles/design/spaces.md#space-topology entry and storage adjoin but are not connected directly by this wall, and storage entry follows common-storage.
@evidence principles/design/spaces.md#space-boundary-authority Takes the centre and thickness from the storage and entry clear faces and authors no separate east line of the storage.
@evidence principles/design/spaces.md#space-verification-address Refutes in the full verification a route piercing this wall from the entry and an unnamed passage of a missing boundary.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the storage directly connected to the common area and the entry circulation with this closed side wall, and there is no need to require a second storage door of the parent.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Keeps the closed core storage as an actual room while adding no unauthorized branch passage.
-->

It closes the whole z segment where the +X clear face of [storage-1f](#storage-1f) and the -X clear face of [entry](#entry) face each other. The centre plane and thickness are derived from the two clear faces and compared with the [interior wall thickness](#mass-and-storeys). The only entrance of the storage is the [common area door](#common-storage), so this wall has no opening or passage.

The ground-floor owner handles the structural body, and the two room owners each handle their interior finish. The [full verification](#stage-one-verification) refutes a route piercing this wall from the entry and an unnamed passage.

## Junctions at interior wall ends {#wall-junctions}

<!--
@evidence principles/core/common.md#declared-basis Judges the residual rectangles from the end points and thicknesses each boundary derived and makes no separate absolute coordinates for junctions.
@evidence principles/core/common.md#scope-preservation Closes all T and cross junctions of both storeys but forbids extending the range to fill rooms, doors, or the stair hole.
@evidence principles/core/common.md#substantive-completion Set the inclusion and exclusion of residual areas, the sorting of adjacent boundary ids, the shared reference to one solid, and the butting of wall ends.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds a joining rule by which the storey owner closes the small unowned areas between ends once while keeping the independent ownership of the shared walls.
@evidence principles/design/spaces.md#space-topology A junction connects only adjacent wall ends and cannot belong to the passage area of a room or opening.
@evidence principles/design/spaces.md#space-boundary-authority Makes the id of the same junction from the sorted set of boundaries, all referencing one element, which prevents duplicate solids.
@evidence principles/design/spaces.md#space-verification-address Checks gaps, overlaps, and blocked passages in the plans of both storeys and corner perspectives, forbidding a repair that hides them by lengthening wall ends.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the per-storey structural ownership and the complete surface conditions with the joining of interior wall ends. Sharing with the exterior wall corners, there is no need to re-divide the parent's surface ownership.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Closes the gaps in the physical boundaries between rooms without blocking doors or the stair or inventing additional passage space.
-->

Each [storey owner](#ground-level) closes the junctions between the ends of shared walls of the same storey only once. The centre plane, thickness, and end points of the interior walls are derived by each boundary from the room clear faces, and this H2 does not overwrite them with separate coordinates. Of the rectangles left between the ends of mutually orthogonal wall strips, only the parts that belong to no room cell, opening, or stair hole and that connect adjacent wall ends are assigned to junction solids. The boundary ids touching the same junction are sorted to make one stable id, and every adjacent boundary references the same element.

For example, the small crossing between the rear end of the entry–flex wall and the entry/common and flex/common walls is one ground-floor junction. The wall bodies on both sides are not lengthened to pierce each other but butt against that solid at their endpoints. The same judgement applies to the upper T junctions and the perimeter of the L-shaped rooms. Parts inside rooms, doors, or the stair hole rather than the boundary gaps cannot be filled.

The [upper-floor owner](#upper-level) also makes junctions by the same rule, and the exterior wall corners are owned by the [elevation owners](003-surface-ownership.md#whole-surface-owners), so the storey does not fill them again. The plans of both storeys and the corner perspectives of the [full verification](#stage-one-verification) check gaps, duplicate solids, and junctions blocking passages.

## Elevation and site interface {#envelope-interface}

<!--
@evidence principles/core/common.md#declared-basis Takes the room clear perimeters, the storey datum, and the roof canopy span as the basis of the bays and the PV repetition, and uses no reference pixels.
@evidence principles/core/common.md#scope-preservation Does not change room boundaries or floor lines for the sake of the envelope shape and also keeps the actual junction of the site landing and the entry sill.
@evidence principles/core/common.md#substantive-completion Designated the glazing host/span owners, the maximum PV pitch, the ceil count, the 0.04m gap, and the site connection.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Makes the curtainwall and PV requirements concrete as a spatial interface that takes the repetition count from the room/floor correspondence and the canopy span.
@evidence principles/design/spaces.md#space-topology The envelope closes the room perimeters, and the entry opening continues at the same sill as the site landing.
@evidence principles/design/spaces.md#space-boundary-authority Glazing consumes openings and rooms and PV the roof span, and each complete owner owns the derived members.
@evidence principles/design/spaces.md#space-verification-address Leaves mismatches of bays with room and storey boundaries and breaks of the landing/sill to the full verification.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the priority relation of the envelope and the fixed graph with the room-based bays and the PV span. There is no reason to change the parent graph or storey lines for the exterior.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Aligns the curtainwall bays with the interior rooms and floor lines and connects the site entry of the single main house to the actual opening.
@evidence settings/003-spatial-basis.md#envelope-and-privacy Assigns the front and rear glass and the PV canopy to the envelope that consumes the rooms, storeys, and roof span. Visual success of the privacy material states is not claimed from this interface alone.
-->

The clear perimeter of each room and the [storey datum](#mass-and-storeys) are consumed by the [envelope boundary](003-surface-ownership.md#whole-surface-owners). The [glazing interface](003-surface-ownership.md#glazing-interface) decides the repeated bays, and each opening H2 owns its host, span, sill, and head. Room boundaries are not moved and floor lines are not erased to make the envelope look bigger.

PV takes the [canopy span](003-surface-ownership.md#roof-face) and divides it evenly into modules of at most 1.20m in x and at most 1.90m in z. The count in each direction is ceil(span/maximum), and the projected gap between the outer frames of adjacent cassettes is 0.04m. The outer cassette dimension is therefore pitch-0.04, and the actual dimension of the PV panel excluding the frame is derived from this value by applying the seating section owned by roof-face. There is no separate rule that makes the panel directly as pitch-0.04. The spatial decision, the PV member shape, and the stable face addresses are owned by the roof owner, and the finish binding of those faces is decided by materials. The direct material strings and the PV cell representation of the current roof source are temporary consumption before the handover.

The last landing of the [site access](001-citizen-house.md#site-access) reaches the sill of the [entrance door](#front-entry). The [full verification](#stage-one-verification) checks this exterior/interior junction together with every bay/room and storey boundary.

## Unpaid verification of stage 1 {#stage-one-verification}

<!--
@evidence settings/001-production.md#build-or-adopt Sets that the spaces are read from output that passed through the new production source and the public engine boundary, so the rejected boxes or reference images are not adopted as verification values of the new geometry.
@evidence settings/001-production.md#verification-boundary Requires the actual output and GPU observation after the canonical lint and leaves unmeasured questions unverified. Success numbers are not replaced by other commands.
@evidence settings/001-production.md#roles-and-accessibility Distinguishes the roles in which the author repairs, the observer measures, and an independent read-only reviewer gives the current visual verdict. The author's self-check does not replace that verdict.
@evidence settings/001-production.md#runtime-and-restart Keeps the review declaration and follows the in-place rewrite path that closes the affected evidence, implementation, and visual checks again. Open failures are not erased by a stage regression.
@evidence settings/002-household.md#program-boundary Does not extend the structural and visual questions of rooms and passage into physical usability or service, evacuation, structural, or energy certification and states the unmeasured boundary.
-->

<!--
@evidence principles/core/common.md#declared-basis The fixed graph and the full observation denominator are the basis of the verification questions, and it states that the table is an inspection plan, not a verification result of the current tree.
@evidence principles/core/common.md#scope-preservation Keeps every room, exterior exposed face, and opening and the five references, and does not reduce the difficult L-shape observations or the physical member checks.
@evidence principles/core/common.md#substantive-completion Decided what to verify by assigning counterexamples and the needed outputs to storey membership, reach, the stair, partition, bays, and the full observation.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Expands the settings' closing condition into concrete failure questions of the current house such as slab collisions, floating endpoints, and wall-less divisions.
@evidence principles/design/spaces.md#space-topology Keeps the room parent, passage via actual thresholds, the arrival of the single stair, and unowned areas as separate questions of the topology verification.
@evidence principles/design/spaces.md#space-boundary-authority Counts, positions, and membership are read from new compiled output so that this table does not become a manual room/door census different from the implementation.
@evidence principles/design/spaces.md#space-verification-address Pairs each verification item with a failure form so that the connection of the logical graph alone cannot approve penetration of physical walls or furniture.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared the full observation and visual verdict conditions with the inspection plan. While acknowledging the partial observation of the earlier independent verdicts, it leaves questions not measured on the current tree unverified and does not reduce the parent's closing denominator.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements Keeps the storey membership of every room, the actual doors and single stair reach, and the curtainwall correspondence as open checks of new output and GPU observation.
@evidence settings/001-production.md#delivery-review-condition Adds the five references to the full topology observation and declares no completed re-review before an independent visual verdict.
-->

The architectural source was implemented under [new production and public engine adoption](../settings/001-production.md#build-or-adopt). Passing through the canonical lint of the [set verification execution boundary](../settings/001-production.md#verification-boundary) and the engine consumption boundary, the following are read from the current output. This table is not a completion record replacing the partial observations of earlier independent verdicts but an inspection plan to apply to the current tree.

| Question | Counterexample and needed output |
| --- | --- |
| Storey membership of every room | a missing or duplicate room parent, a cell outside the storey |
| Reaching every room from the entry | a connector not passing an actual threshold, penetration of walls or furniture, a floating endpoint |
| Inter-storey reach of the single stair | a route outside the landing, a slab blocking the stairwell, a discontinuity between the upper arrival and the corridor |
| Complete room partition | a division with only a logical cell and no physical wall, overlapping or unowned areas |
| Outline grounding | a section where the foundation, bearing ring, or threshold plate breaks in the y=-0.45..0 band of the four outer planes, site ground or a walking surface entering inside the outline, an exterior member floating above the ground |
| Agreement of glass and interior | a mismatch of a room boundary with a bay/jamb or floor/transom |
| Full observation denominator | the setting, the exposed elevations, corners, roof, underside, openings, and entrances, and every space's threshold, 4 inner corners, and 4 centre directions, plus the additional corners of the two L-shaped rooms |
| Additional reference questions | each of the five compared with the current physical 3D screen, with the section marked as inspection |

The table above is the inspection plan of the current output, not a completion account. The existing independent verdicts observed some questions of the architectural source and the GPU screen, but the extent to which each question of the table was actually paid on this revised tree and the whole production completion are unverified. Following the coordinator's correction, the stage stays at review and the open evidence, implementation, and visual checks are closed again by the set path. For the upstream three layers, v-112's independent read-only reviewer compared down to the GPU screen and reconfirmed their review eligibility. The object source handover and the whole production completion verdict are a separate stage. These spatial checks do not replace the physical usability, structural, energy, and evacuation certification distinguished by [Program boundary](../settings/002-household.md#program-boundary).
