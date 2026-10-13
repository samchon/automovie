# Family and living program

## Living scope of the citizen family {#household-program}

<!--
@evidence principles/core/common.md#declared-basis Interprets the brief of an ordinary citizen family as the background of the rooms in use and records the production decision not to make character assets.
@evidence principles/core/common.md#scope-preservation Expresses traces of living through furniture, building services, and storage while not dropping the upper-floor sleeping privacy from the delivery.
@evidence principles/core/common.md#substantive-completion Instead of the name family, decides the division between common living and private sleeping, the medium of expression, and the scope of undelivered characters.
@evidence principles/core/settings.md#fact-status States its status as the production background of a spatial program, not an observation of a specific real family.
@evidence principles/core/settings.md#source-support Cites no body shape or living statistics of a real family, so no unconfirmed human performance is derived from the furniture program.
@evidence principles/core/settings.md#capability-boundary The rooms represent the background of family living but provide no body proportions or autonomous behaviour of residents.
@evidence principles/core/settings.md#constraint-sufficiency Does not place characters to explain room functions in their stead; rooms are identified by the necessary living furniture.
@evidence principles/core/settings.md#observable-identity The common living of one house and the sleeping privacy separated on the upper floor are the observable difference of a family house.
-->

**Status:** production invention, a decision that translates the user brief's "ordinary citizen family" into a fit-out program.

The residents are not specific character assets but the background of use of the spaces. Traces of living are expressed through the furniture, building services, and storage that identify the rooms, and no body proportions or autonomous behaviour of characters is delivered. The house has the ordinary density of a family living together in one house while gaining sleeping privacy on the upper floor.

## Ground-floor program {#ground-program}

<!--
@evidence principles/core/common.md#declared-basis The entry, directly connected workroom, continuous common area, and right core are from the brief, and the furniture and service choices that make each function read are authoring decisions of this living program.
@evidence principles/core/common.md#scope-preservation Keeps the shoe storage, bench, work furniture, sofa, dining table, kitchen, powder room, and storage so that the whole ground-floor interior is not reduced to a summary of one common area.
@evidence principles/core/common.md#substantive-completion Sets the furniture functions of the entry, workroom, living area, and core and the continuous common area, and links the independent decision on the variable states to flex-states.
@evidence principles/core/settings.md#fact-status The listed living items are an adopted program, not the fact that the furniture is realized in the current source or passed an actual usability check.
@evidence principles/core/settings.md#source-support The living functions are production choices interpreting the brief and claim no specific furniture product specifications or human performance numbers without basis.
@evidence principles/core/settings.md#capability-boundary This H2 assigns the ground floor's living items and functions and defines no new transformation capability. The allowed state changes of the workroom are owned by flex-states.
@evidence principles/core/settings.md#constraint-sufficiency Living, dining, and kitchen are one space without partitions, and changing the workroom state does not hand that program to another room.
@evidence principles/core/settings.md#observable-identity The shoe storage and bench, the desk and shelves, and the sofa, six dining seats, island, sink, and refrigerator identify the distinct ground-floor living functions.
-->

The central front entry has the exterior entry door, shoe storage, a bench, and a mail and charging shelf attached to a flat wall with no architectural hole. The existing `entry-charging-shelf` is a temporary mesh of this object; the shelf shape is handled by models, and the per-room placement of the charger and shelf by instances. The front flex workroom, connected directly from the entry, has an adjustable desk, chair, wall shelving, a folding work surface, a translucent privacy screen, and hidden storage. The two rest states of the variable furniture are owned by [Workroom states](#flex-states). The single dog-leg stair at the centre of the entry leads to the upper landing.

The single continuous common room at the rear joins living, dining, and kitchen without partitions. The living area has a sofa, low table, media/storage wall, and reading light; the dining area a table and six seats; and the kitchen an island, sink, induction cooktop, refrigerator, tall pantry, and recycling/utility cabinet. The opaque service core on the right holds the powder/utility room and the ground-floor storage. The powder/utility room has a basin, toilet, and cleaning storage, and the washer is in the upper service room. This list sets the living functions of the rooms, and the ownership of object shapes and placement follows [Surface decomposition](003-spatial-basis.md#surface-decomposition).

## Rest states of the variable workroom {#flex-states}

<!--
@evidence principles/core/common.md#declared-basis The variable workroom is a user requirement, and the two rest states of the storage bed, work and guest sleeping, are a production choice realizing that requirement.
@evidence principles/core/common.md#scope-preservation Keeps both the work and the guest sleeping functions and removes neither the fixed desk, shelves, sliding door, nor entry passage in either state.
@evidence principles/core/common.md#substantive-completion Decides the closed panel and handle, the opened mattress and grounded legs, the fixed furniture, the undelivered animation, and the operator's selection path.
@evidence principles/core/settings.md#fact-status The two states are production definitions of static shapes, not an observation of the device's actual mechanical safety or automatic operation.
@evidence principles/core/settings.md#source-support The storage bed is an interpretation of the workroom reference and does not claim values taken from a specific product's specifications, loads, or certification.
@evidence principles/core/settings.md#capability-boundary The bed provides only the work and guest rest states, the desk and shelves are fixed, and no intermediate transformation or desk height adjustment animation is provided.
@evidence principles/core/settings.md#constraint-sufficiency Both states keep the entry passage, and state selection is recorded by 004#operator-access as the current producer input and observation basis.
@evidence principles/core/settings.md#observable-identity During work the vertical storage panel and handle, and in the guest state the horizontal mattress and the legs touching the floor, are forms of the same variable furniture.
-->

**Basis: a production choice that interprets the user's variable workroom requirement as physical furniture.** The default delivered state of the variable workroom is the work mode, in which the wall storage bed is closed and reads as a vertical panel and handle and the desk is in its seated state. The additional inspection state is the guest sleeping mode, a rest state in which the bed is lowered so the mattress lies parallel to the floor and the support legs are grounded. The desk and shelves are fixed, and the sliding door and entry passage are kept in both states. Automatic transformation performance and mechanical safety performance are not delivered. The desk height adjuster and the folding auxiliary top are identified as physical members, but no separate animation control is added.

The path of state selection and observation is owned by [User control](004-observation.md#operator-access). The source produces each rest shape from explicit inputs of the same producer.

## Upper-floor program {#upper-program}

<!--
@evidence principles/core/common.md#declared-basis The primary bedroom, two small bedrooms, bathroom, and storage are the user program, and adopting a separate service and laundry room is a stated production choice.
@evidence principles/core/common.md#scope-preservation Attaches every upper room directly to one corridor and keeps each bedroom's furniture and the bathroom, storage, and services.
@evidence principles/core/common.md#substantive-completion Decides the primary double bed and the two single beds, the bathroom fixtures, and the functions of the service and laundry room so that design does not invent new uses.
@evidence principles/core/settings.md#fact-status The upper program is the intended living function, not a statement that actual convenience of use or service operation was verified.
@evidence principles/core/settings.md#source-support The number of bedrooms and the direct connections rest on the user brief and claim no survey of an actual family's living or bathroom standard.
@evidence principles/core/settings.md#capability-boundary upper-service holds laundry, inspection, and storage but cannot become a sleeping room or a second corridor.
@evidence principles/core/settings.md#constraint-sufficiency The listed furniture and services cannot be deleted to make a room look larger, and the doors must actually face the same straight corridor.
@evidence principles/core/settings.md#observable-identity The double bed, nightstands, and wardrobe, the two single beds, the tub/shower, toilet, and basin, and the linen storage distinguish the different rooms.
-->

One short straight corridor starting at the stair landing directly connects the primary bedroom, child bedroom 1, child bedroom 2, the bathroom, and storage. The corridor does not branch, and each room faces the corridor through an actual door. The primary bedroom has a double bed, bedside tables, a wardrobe, and a small desk, and the two small bedrooms each have a single bed, a wardrobe, and a desk or shelf.

The bathroom includes a vanity, toilet, shower/tub, and towel storage, and the upper storage has linen and cleaning cabinets. upper-service is adopted as a separate service and laundry room with a door directly on the corridor. It includes the washer and dryer, cleaning storage, and an inspection area and is not used as a sleeping room or a second corridor. Each room keeps its intended living items, and furniture and services are not deleted to make a room look larger. This list sets the living functions of the rooms, and object shape, per-room placement, emission, and finish binding are handled by each owner of [Surface decomposition](003-spatial-basis.md#surface-decomposition).

## Program boundary {#program-boundary}

<!--
@evidence principles/core/common.md#declared-basis Distinguishes the production authority of the living program from the two graphs of 003-spatial-basis that own the spatial connections.
@evidence principles/core/common.md#scope-preservation Does not own the connection meaning twice and keeps only the living program and fit-out meaning in this file.
@evidence principles/core/common.md#substantive-completion Sets the unverified boundary of circulation speed, comfort, services, evacuation, structure, and energy performance and limits exaggeration downstream.
@evidence principles/core/settings.md#fact-status States directly that usability and building performance without separate measurement are unverified.
@evidence principles/core/settings.md#source-support Is not read as providing an external basis for performance numbers or code compliance, and does not repurpose the furniture program as such data.
@evidence principles/core/settings.md#capability-boundary This H2 limits the scope of verification and certification and allows no new production-world capability. What to place in a room and which workroom state to show are owned by the program owners of the same file.
@evidence principles/core/settings.md#constraint-sufficiency Spatial connections change only in the linked ground/upper-graph, and a furniture choice of the program document does not redefine a connection.
@evidence principles/core/settings.md#observable-identity This H2, which sets the absence of usability certification, defines no new room or character appearance. Identifying rooms by living items is owned by ground-program and upper-program of the same file.
-->

This document is the owner of the living program and the visual fit-out meaning. The spatial connections are owned by the [ground-floor graph](003-spatial-basis.md#ground-graph) and the [upper-floor graph](003-spatial-basis.md#upper-graph). It is not read as verifying an actual family's circulation speed, seating comfort, service operation, or carrying, reach, evacuation, structural, or energy performance. Those checks have no separate measurement and are therefore `unverified`.

## Operating subjects and use conditions {#operative-subjects}

<!--
@evidence principles/core/common.md#declared-basis Two adults, two children, and two visitor seats are a production choice that sets the meaning of the bedrooms and dining table.
@evidence principles/core/common.md#scope-preservation Classifies the family, building, furniture, services, glass, lighting, planting, and operator each into an owner or out of scope so that no subject of state change is missed.
@evidence principles/core/common.md#substantive-completion States the functions not executed, such as PV generation, fluid and heat loads, and plant growth, and closes the operator's selection range.
@evidence principles/core/settings.md#fact-status The family background is not a character asset, and the visible PV and fixtures do not perform actual power or flow calculations.
@evidence principles/core/settings.md#source-support Declares the family size, the background of the furniture, as a production input and does not treat it as a source on the 2080s population or actual energy performance.
@evidence principles/core/settings.md#capability-boundary The operator selects the observation, glass, and workroom rest states but cannot steer residents or edit the spatial graph.
@evidence principles/core/settings.md#constraint-sufficiency The landscape is fixed and surrounding residents, vehicles, and animals do not change the result, so no separate operating subject is invented.
@evidence principles/core/settings.md#observable-identity The subjects of the four family seats and two visitor seats, the visible services, the fixed planting, and the selectable glass and bed states are identified.
-->

**Basis: a production choice that sets the living program of this library.** The family has two adults and two children as background, and no actual character, face, or body assets or movement performance are made. The family size explains one primary bedroom and two small bedrooms and, of the six seats at the common dining table, four family seats and two visitor seats. The interior family subject is owned by this H2 and the per-storey programs above.

The building, rooms, doors, stair, storage, and services are explicit canon of the spatial and living programs. The state of the electrochromic glass, translucent layer, and shades is set by the privacy owner of the spatial basis, and that of daylight and the interior lights by the visual grammar owner of production and delivery. The solar modules are visible members of the canopy, not a subject that executes power generation, power supply, or weather control. For water, ventilation, power, and drainage, only the visible fixtures and the service inspection space are delivered, and flow, pressure, heat load, and wiring calculations are out of scope.

The landscape is fixed planting on a small site, with no wind, growth, or seasonal change simulation. The viewer operator selects only the space, observation id, inspection mode, the allowed glass states, and the workroom's work and guest sleeping rest states. The owner of these controls is the observation and use conditions. There is no authority to operate residents on their behalf or to change the spatial graph of the documents. Surrounding residents, institutions, vehicles, and animals neither appear in the delivery nor change state, so no separate subject is made.

## Inspection conditions the design must accommodate {#design-subject-conditions}

On the stair, the cylinder climbs along the contact of the actual tread, landing, and arrival floor polygons. During horizontal travel, at the position where the 0.60m-diameter disc first touches a higher walking surface, the floor rises vertically to that height and horizontal travel resumes. Interpolating the foot positions of a straight stair route diagonally as they are would pierce the forward riser, so this contact-based path is used. Contact events are derived from the intersections of the route segments with the radius offset of the polygon edges and the vertex circles. The starting approach extends by one radius from the first route point opposite the first direction of travel and must lie inside the entry cell. An upper floor overlapping in X/Z is not promoted to a walking surface if it is higher than the highest foot height of the current route section plus one actual rise; it stays a ceiling obstacle. All supporting geometry also stays in the triangle collision population. The whole volume of the cylinder is checked in each horizontal section and each vertical rise section of the path, with a tolerance of 1mm. This method is a continuous geometric path of a contacting virtual cylinder, not certification of actual human leg motion, safety, or evacuation.

<!--
@evidence principles/core/common.md#declared-basis Adopts the vertical cylinder of 0.60m diameter and 1.80m height as an explicit virtual inspection input, not a human standard.
@evidence principles/core/common.md#scope-preservation Keeps the actual connections of doors, corridor, and stair and the passage check that furniture does not block, without extending it into safety certification.
@evidence principles/core/common.md#substantive-completion Sets the horizontal section, height, and floor grounding conditions and the handling of results left unverified when a tool cannot compute them.
@evidence principles/core/settings.md#fact-status The cylinder is a production input that does not represent a particular age, sex, or disability status and is not a fact about actual people.
@evidence principles/core/settings.md#source-support Does not claim the values are derived from a real human standard and limits the precision of the diameter and height to the virtual inspection scope.
@evidence principles/core/settings.md#capability-boundary The virtual cylinder is a clearance inspection input, not a production-world capability given to residents. A check that the cylinder can be placed along a path does not allow actual human carrying, turning, or evacuation abilities.
@evidence principles/core/settings.md#constraint-sufficiency Does not replace the cylinder clearance measurement with the 1.60m camera eye height and leaves items without an actual tool unverified.
@evidence principles/core/settings.md#observable-identity The inspection subject is fixed as a vertical cylinder of circular section standing on the floor, so implementers do not each invent a different volume.
-->

**Basis: an explicit virtual inspection input, not an actual human standard.** The first structural passage check asks whether the virtual walking envelope of a vertical cylinder standing on the floor (horizontal section diameter 0.60m, height 1.80m) continues along the single stair, doors, and corridor. These numbers do not claim to represent actual people of a particular age, sex, or disability status or to meet a permit standard. If the actual measurement tool cannot compute the clearance of this envelope, the clearance is left unverified separately from the path connection.

Carrying loads, wheelchair turning, accompaniment by a helper, infant safety, reach range, furniture use postures, the working radius of service maintenance, structural loads, and evacuation time are outside the scope of this usability certification. Those actions are not judged convenient or safe from pictures alone. This scope is not a permission to remove actual doors, stairs, storage, or furniture. The design and fit-out must confirm that open door leaves and physical furniture do not block the declared passage. The camera check at the 1.60m eye height is a condition of the observation apparatus and does not measure this walking envelope in its place.

## Inherited defaults and intentional differences {#inherited-defaults}

<!--
@evidence principles/core/common.md#declared-basis Under the user instruction of an everyday dwelling rather than an exaggerated future facility, classifies the basic relations to inherit and the explicit differences.
@evidence principles/core/common.md#scope-preservation Keeps the flat roof, curtain wall, electrochromic glass, PV, and variable workroom as adopted canon instead of hiding them as implicit conventions.
@evidence principles/core/common.md#substantive-completion Sets the basic relations of gravity, furniture grounding, and door operation and the reopening condition for undecided facts such as occupations and addresses.
@evidence principles/core/settings.md#fact-status Does not put undecided occupations, years, or addresses into props as if they were facts and keeps them as undecided matters with no effect on the delivery.
@evidence principles/core/settings.md#source-support Does not assert future institutions, electricity prices, or social customs as external facts, so there are no baseless precise future values.
@evidence principles/core/settings.md#capability-boundary The future setting gives no authority to change gravity, material joining, or passage relations at will.
@evidence principles/core/settings.md#constraint-sufficiency Adding a prop or label that depends on an undecided fact first requires revising this settings boundary.
@evidence principles/core/settings.md#observable-identity Vertical walls, furniture on the floor, and ordinary door relations are kept so that the target identity does not turn into a spaceship or a non-everyday facility.
-->

**Basis: the user instruction not to make a 2080s everyday dwelling into an exaggerated future facility.** The basic relations of furniture standing on the floor, vertical walls, an enclosed interior, the gravity direction -Y, and ordinary interior doors opened by hand are kept. The flat-roofed rectangular main house, curtain wall, electrochromic privacy, PV canopy, and variable workroom are stated production choices, not implicit defaults.

Food, book titles, the residents' occupations, administrative institutions, electricity prices, and the exact year and address, which do not affect the delivered result, are not decided. To later add labels or props that depend on such facts, this settings boundary is revised first. Being in the future is not interpreted as permission to change gravity, material joining, or passage customs at will.
