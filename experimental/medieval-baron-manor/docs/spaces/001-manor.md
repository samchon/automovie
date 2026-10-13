# Manor space design

## Actual manor space {#manor-space}
<!--
@evidence settings/001-production.md#delivery-scope Places the whole main house, every room, the furniture, the garden and the approach in one environment.
@evidence settings/001-production.md#governing-aim Binds the family's household functions into the connections and placement of one house.
@evidence settings/001-production.md#language-access Provides English room descriptions together with exact source and viewpoint IDs.
@evidence settings/001-production.md#operator-access Provides an observation plan that selects the normal exterior, the interior and declared states.
@evidence settings/001-production.md#accessibility-products Describes rooms, items, coordinates and visual questions as text.
@evidence settings/001-production.md#coordinate-datum Consumes the shared world axes and the ground and upper finished floor levels.
@evidence settings/001-production.md#reference-priority Applies each source's exterior, cutaway, garden, hall and upper-floor questions to the fixed graph.
@evidence settings/001-production.md#visual-grammar Applies the timber frame, infill walls, foundation, divided windows, roof and household materials globally.
@evidence settings/001-production.md#fidelity Connects the environment derived from actual models and placement to visual observation.
@evidence settings/001-production.md#review-condition Distinguishes the default interior eye height from high auxiliary observation.
@evidence settings/001-production.md#observation-population Connects the visual questions of the whole space to default and conditional auxiliary viewpoints.
@evidence settings/001-production.md#review-roles Distinguishes the roles of planning before observation and of opening PNGs directly.
@evidence settings/001-production.md#completion-condition Consumes a completion judgment limited to the current source and observations.
@evidence settings/001-production.md#pilot-boundary Keeps the detailed placement of the hall within the design of the whole main house.
@evidence settings/001-production.md#coverage-map Finds the basis of spatial placement at the settings owner addresses.
@evidence settings/001-production.md#subject-inventory Distinguishes architectural, household and garden subjects and observation roles by placement and viewpoint.
@evidence settings/002-household.md#household Consumes the family background of three bedrooms and a six-place hall as the actual room composition.
@evidence settings/002-household.md#family-hall Places the hall's table, benches, hearth, chest, pottery, tray and rug.
@evidence settings/002-household.md#kitchen-pantry Puts the worktable, tools, hearth and stored goods of the kitchen and pantry in their rooms.
@evidence settings/002-household.md#ledger-room Places the desk, seat, shelf, lockable chest, writing tools and ledger in the work room.
@evidence settings/002-household.md#service-room Puts the washing stand, storage, rack, basin, barrel and broom in the eastern service room.
@evidence settings/002-household.md#bedrooms Places the beds, bedding, storage, seats and tables of the three bedrooms.
@evidence settings/002-household.md#upper-washroom Puts the basin, privy items, jug, towels, screen and latch in the common room.
@evidence settings/002-household.md#upper-storage Puts the shared textile shelves and the lidded box in the independent upper storage.
@evidence settings/002-household.md#water-and-waste Places jugs, basins and waste-water items in their household rooms.
@evidence settings/002-household.md#garden Composes the apple tree, natural-stone pond, herb bed and gravel path in the central garden.
@evidence settings/002-household.md#make-scope Distinguishes ownership of actual models and placement from the space carrier.
@evidence settings/003-spatial-basis.md#single-house Places one U-shaped main house wrapping the southern garden and the site approach.
@evidence settings/003-spatial-basis.md#area-budget Keeps the adopted model scale and does not fill the courtyard or the stair opening.
@evidence settings/003-spatial-basis.md#ground-access Composes the entrance, three galleries, the single stair and each required room's direct door.
@evidence settings/003-spatial-basis.md#single-stair Connects eight northward risers and eight eastward risers at one half landing.
@evidence settings/003-spatial-basis.md#upper-access Opens direct doors to the five upper rooms from the rear east-west straight corridor.
@evidence settings/003-spatial-basis.md#surface-responsibility Registers inner and outer boundaries, floors and roof from the same actual walls and openings.

@evidence principles/core/common.md#declared-basis Derives the spatial placement and observation decisions from the fixed settings and the current model sources.
@evidence principles/core/common.md#scope-preservation Keeps ownership of both whole storeys, every room, the household items, the garden and the envelope.
@evidence principles/core/common.md#substantive-completion Settles the rooms, items and stair of one environment and the selection for each current visual question.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Decides room assignment, placement coordinates and concrete viewpoints from the settings' uses and fixed graph.
@evidence principles/design/spaces.md#space-boundary-authority Links the shared settings' axes, storeys and uses, and owns the actual spatial placement here.
@evidence principles/design/spaces.md#space-topology Sets room containment and the connections of direct doors, galleries, corridor and one stair together with the implementing source.
@evidence principles/design/spaces.md#space-verification-address Connects the visual questions of spaces and items to default perspectives and auxiliary cutaway and close views.
@evidence upstream/design/spaces.md#settings-and-map-revision-from-space-work Comparing per-room placement with the current models' appearance revealed a defect in which settings/001-production.md#visual-grammar and the family-hall, kitchen-pantry, ledger-room, service-room, bedrooms, upper-washroom, upper-storage, water-and-waste and garden units of settings/002-household.md passed on form standards through item names alone. Those parents were first reinforced with identifying parts, material regions, current production dimensions and open states, and this space was revised to reference the dimension standards while owning placement coordinates and connections. No map parent and no real-building certification are newly introduced.
@evidence contracts/manor-spatial-requirements.md#manor-spatial-requirements Owns, in the same actual environment, the forms of one U-shaped main house, the continuous gallery, the central turning stair and the upper straight corridor.
-->

This design composes the whole south-opening U-shaped two-storey main house as one 3D environment. It applies [the fixed spatial composition](../settings/003-spatial-basis.md) together with [the five source images](../settings/001-production.md#reference-priority). settings owns the identity to reproduce and the reference scale of the envelope and items, and the placement, member relationships and observation plan below realize that standard as space.

The space carrier computes an in-memory typed environment directly from the actual models, members and transforms of the current model entries and instance-set. Room polygons, storey heights, walls and openings, the courtyard, the pond and the stair serve as the spatial boundaries of that environment. No separate abbreviated box replaces the main house. The registered owner is `manorSpaceSource` in `src/spaces/manor.ts`; `src/manorEnvironment.js` assembles the values of `src/models/manor.js` and `src/instances/manor.js`, and `src/manorSpatialState.ts` computes the spatial connections. No JSON file or separate derived state store is required as input.

**Main house and composition by storey**

The ground floor's hall, kitchen, pantry, ledger, service and entrance, and gallery-west, gallery-rear and gallery-east belong to the same main house. The southern garden and the three galleries form the inside of the U; the hall is in the west wing, the kitchen and pantry at the rear west, the ledger room at the rear east, and the storage and washing room in the east wing. The entrance is in the centre and connects to the galleries and the one turning stair. The door of each required room connects directly to the same gallery or the entrance.

The upper floor divides into master, child-west, child-east, washroom and storage, and corridor and landing. The master bedroom is in the west wing, one small bedroom each at the rear west and east, and the shared washroom and privy and the separate shared storage in the east wing. Direct doors open to each room from the rear east-west straight corridor. The central landing connects to this corridor, and no room reached through another bedroom and no second stair are made.

Wall segments and door/window openings are registered from the same actual geometry. The upward-facing triangles of floors and treads serve as surfaces of the space carrier, and the connection between the central stair and the door positions is registered. The courtyard and the stair opening are not filled with a union of room volumes. The outer walls, inner walls, windows, doors and roof express the exterior and interior of one main house together in the current render.

**Ground-floor furniture and household items**

The table of [the family hall](../settings/002-household.md#family-hall) is centred at (X=-6.57, Z=2.35) with its long axis north-south. At the same Z, the west bench is at X=-7.22 and the east bench at X=-6.01, and the plan sizes of the tabletop and seats use the settings standard. The rug is placed at centre (-6.55, 2.35), 1.66×2.55m. The rug top Y=0.456, the seat top Y=0.906, and the tabletop underside Y=1.166 and top Y=1.221 are kept as current model values.

The west boundary of the hall X=-7.38 and the braces between the two windows, the window sills and the timber framing are expressed as one interior composition. The lamp board centre is (X=-7.3725, Y=2.27, Z=1.725). The storage chest faces north at centre (X=-6.72, Z=5.30), and the stone fireplace is at (X=-6.05, Z=-0.78). Pottery tableware, the water jug, the tray and the textiles create traces of life around the table and the heated space. The existing geometry of the seats, tabletop, legs and rails is preserved.

The worktable of [the kitchen](../settings/002-household.md#kitchen-pantry) applies the settings length and depth and is placed at centre (X=-5.80, Z=-4.65) with its work surface at Y=1.34. The north window and tool rack and the chopping board, knife, bowls and jug on the worktable are expressed together. The pottery jug with handle and cover uses the current geometry placed at (X=-5.18, Z=-4.67), with its base at Y=1.34 and its overall height within Y=1.64. The kitchen hearth is at (X=-6.05, Z=-1.98) and the pantry shelving at (X=-2.93, Z=-3.60), and the sacks, barrels and lidded containers belong to the same pantry.

[The ledger room](../settings/002-household.md#ledger-room) places the writing tools and open ledger around the desk (X=5.60, Z=-3.60), the seat (5.60, -2.70), the ledger shelf (3.85, -5.00) and the storage chest with an expressed lock (6.60, -1.90). [The storage and washing room](../settings/002-household.md#service-room) has the washing stand (6.85, 2.50), the cupboard (6.22, 5.32), the drying rack (5.50, 4.80), and basins, barrels and a broom. Food and dirty washing are kept as different household expressions in their own rooms.

The entrance has a bench and a shoe cupboard, and a storage chest sits under the stair. Benches and storage around the galleries, and the timber frames and ironwork of doors and windows, are also preserved as actually placed assets. Repeated items and vegetation keep their common prototypes and installation transforms, and each installation belongs to the main-house environment.

**Upper floor and central stair**

In [the bedrooms](../settings/002-household.md#bedrooms), the master bed is centred at (X=-5.40, Z=3.80), and the small bedrooms' beds are at (-5.80, -4.50) and (5.25, -4.50). The master bedroom holds a wardrobe, a storage chest, a small seat, a night table and a water jug, and the two small bedrooms each hold bedding, a storage chest, a table and a seat. The different forms and materials of the wooden frames and of the mattresses, blankets and pillows are expressed.

In [the shared washroom and privy](../settings/002-household.md#upper-washroom), the basin is at (X=3.74, Z=1.75) and the privy items at (3.88, 3.10), and the jug, towel rack, screen and latch expression are kept. [The shared storage](../settings/002-household.md#upper-storage) composes spare bedding and folded textiles on the shelving (5.35, 3.25) and in the lidded storage box (6.65, 4.90). In the corridor and on the landing, an elongated runner and wall lamps connect the timber spaces of the private floor.

[The central turning stair](../settings/003-spatial-basis.md#single-stair) rises eight times northward from the entrance and eight times eastward from the half landing. The ground finished level is Y=0.45, the half landing Y=1.89 and the upper finished level Y=3.33, and the half landing and the upper floor are the last surfaces of their runs. No separate 17th riser is added.

The lower seven treads lie at X=-1.28~-0.04, starting from a first tread at Z=-2.43~-2.17 and stepping 0.26m each to the north, with top surfaces rising by 0.18m from Y=0.63. The half landing is X=-1.28~-0.04, Z=-5.23~-3.99. The upper seven treads continue eastward at Z=-5.23~-3.99; the first six are 0.26m deep and the last is 0.28m at X=1.52~1.80. The upper top surfaces rise by 0.18m from Y=2.07. The current member placement, including the lower railing centrelines X=-1.25 and -0.07 and the upper railing centrelines Z=-5.20 and -4.02, is kept.

**Exterior, garden and observation**

Following [the architectural language](../settings/001-production.md#visual-grammar), the stone foundation, dark brown timber frame, warm off-white infill walls, small divided windows and pitched roofs with eaves are applied to the whole main house. [The garden](../settings/002-household.md#garden) is composed of one apple tree with gaps between its branches and leaves and a little fruit; a pond with a natural-stone rim, water surface, shallow margin and dark bottom; a herb bed; and a gravel path. The southern approach path and the stone steps of the central entrance are included, and no outbuilding, tower or curtain wall is added.

Observation selects, according to [the current required set](../settings/001-production.md#observation-population), viewpoints that confirm the legibility of the exterior, each storey, every room, the garden, and the actual items and materials. Cutaways are used to explain the relationship of storeys and rooms, and the normal exterior is viewed as well. Declared door and lid states and close viewpoints are used when an item is occluded and does not read. The current render is read directly to confirm the visual completion of the forms written in this design.

The following is the first observation plan, selected to match the visual questions from the viewpoints present in the current source. The default interior viewpoints use 1.60m above the finished floor from [the neutral specification](../settings/001-production.md#review-condition). Furniture and spaces are read from the interior viewpoints below, which sit at Y=2.05 on the ground floor and Y=4.93 on the upper floor. The plans, frame cutaway, roof overhead and stair cutaway are auxiliary observations explaining form and storey relationships. Actual on-screen occlusion and the current UI selection are confirmed at capture time.

| Visual question and corresponding composition | Default viewpoint | Required auxiliary role |
| --- | --- | --- |
| Source 01: Do the U-shaped outline and the timber frame, infill walls and foundation read as one main house? | `reference-exterior`, `04-whole-north-west` | `roof-overhead` reads the roof planes and chimney composition. |
| Source 02: Do the rooms and furniture of the two storeys and the connection of the one stair, galleries and corridor read? | The interior viewpoints of each room below | `ground-plan`, `upper-plan` and `frame-axonometric` explain the per-storey layout and the stacked composition. |
| Source 03: Is the relationship of the tree, pond, stones, herbs and path to the gallery visible? | `reference-courtyard`, `garden-reverse` | Add `pond--oblique-a` when water and stones are occluded in context, and `apple-tree--oblique-a` when the tree form is occluded. |
| Source 04: Do the hall's table, both benches, rug, hearth, chest and pottery read together? | `hall--corner-b`, `hall--corner-d` | Use `hall--hearth-clear` as a high additional viewpoint when the hearth is occluded in both frames. |
| Does the relationship of the kitchen's hearth, worktable, tools, chopping board and pottery to the pantry read? | `kitchen--corner-b`, `kitchen--corner-d` | Confirm occluded placement additionally with `kitchen--inside-entry`, and the worktable items themselves with `kitchen-counter--oblique-a`. |
| Do the pantry's shelving, sacks, barrels, lidded containers and interior finish read? | `pantry--corner-a`, `pantry--corner-c` | Add the high `pantry--aisle-high` only when items on the shelves are occluded. |
| Do the ledger room's desk, seat, ledger shelf and lockable chest read? | `ledger--corner-a`, `ledger--corner-b` | Add `ledger--bookcase-front` if the bookcase items cannot be distinguished. |
| Do the basin, barrels, storage, drying rack and cleaning tools of the storage and washing room read? | `service--corner-a`, `service--corner-b` | If an item is occluded in both frames, add an existing interior viewpoint that shows that actual installation. |
| Do the entrance's bench and shoe storage and the chest under the stair read? | `entrance--corner-a`, `entrance--understair-storage` | Use state selection of the chest below only when its contents are needed on screen. |
| Do the posts, beams and floors of the three galleries and the garden-side form read as one continuous house? | `gallery-turn-west`, `gallery-rear--clear-lane`, `gallery-turn-east` | The three viewpoints read the continuity of the gallery members and the garden-side form. |
| Source 05: Do the master bedroom's bedding, clothing storage, seat and small table read? | `master--inside-entry`, `master--corner-b` | Read the parts occluded under different door states separately. |
| Do the bed, bedding, desk, seat and chest of the west small bedroom read? | `child-west--corner-b`, `child-west--corner-d` | Observation of another bedroom does not substitute. |
| Do the separate furniture and interior finish of the east small bedroom read? | `child-east--corner-a`, `child-east--corner-c` | Even with assets repeated from the west room, this room's placement is read directly. |
| Do the basin, jug, towels, screen and privy items of the shared washroom and privy read? | `washroom--north-working-detail`, `washroom--south-working-detail` | Add `latrine--oblique-a` for the item itself when hidden by the screen, and the high context `washroom--screen-front` or `washroom--screen-back` only when needed. |
| Do the shelving, textiles and box of the shared storage and its bent room shape read? | `storage--corner-a`, `storage--corner-c` | Add `storage--nook-in` for the bent part and `storage--aisle-high` for items on high shelves when needed. |
| Do the doors, runner and lamps of the upper corridor and landing and their spatial relationship read? | `corridor-west-to-east`, `landing-to-corridor` | Reinforce the two runs, landing and railing form of the stair with the `stair-section-west` cutaway. |

Room corner viewpoints show the current source's door leaves in the closed pose, and other interior context viewpoints show the declared default pose. Item articulation uses the state assigned to that viewpoint or the default. This state difference is recorded in the frame description. `ground-plan`, `upper-plan`, `frame-axonometric` and `stair-section-west` hide or cut some members to show the internal composition and are read together with the normal exterior. A standalone oblique viewpoint shows the item itself, and an interior context viewpoint shows its placement. Visual questions left over at the default viewpoints are confirmed at the auxiliary viewpoints.
