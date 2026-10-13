# Spatial basis

## Coordinates and overall dimensions {#coordinate-datum}

<!--
@evidence principles/core/common.md#declared-basis Y-up, metres, front -Z, and right +X are this production's coordinate choice, and two storeys of 11×12m and about 250㎡ are user targets.
@evidence principles/core/common.md#scope-preservation Keeps the coordinate and time conventions in one place and has exact room dimensions consume the mass and storey owner of spaces.
@evidence principles/core/common.md#substantive-completion Closes the shared basis by setting the floor y=0, the absence of a timeline in the static library, and seconds as the unit of UI operation.
@evidence principles/core/settings.md#fact-status Does not mix gross and net area and does not read reference pixels or production dimensions as physical surveys.
@evidence principles/core/settings.md#source-support The axes and units are a declared production convention and claim no external source of actual building survey or code or structural certification.
@evidence principles/core/settings.md#capability-boundary Viewer operation time uses seconds, but no timeline that advances the building state automatically is delivered.
@evidence principles/core/settings.md#constraint-sufficiency Only the linked design owner changes the exact mass, storey lines, walls, and room boundaries. The architectural source is implemented and has a history of measurement and GPU observation from earlier independent verdicts, but the full observation of the current revised tree is verified separately.
@evidence principles/core/settings.md#observable-identity The world's front, rear, and right and the ground-floor reference floor are fixed, so different observers do not reconstruct the house mirrored.
-->

**Status: the review eligibility of settings, spaces, and spaceSources was reconfirmed in the v-112 independent verdict.** The world unit is m in right-handed Y-up coordinates. +X is right in plan, +Z is the rear, the front is -Z, and the ground floor is at y=0. This is a static library with no delivered timeline or fps. Viewer operation time uses seconds but does not advance the building's state automatically. It follows the targets of two storeys of about 11×12m and about 250㎡. Gross and net area are not mixed, and dimensions are not back-computed from reference pixels.

For a +Y-up camera outside the front (-Z) looking toward +Z, screen right is -X. Plan right and the observer's screen right are not called by the same word. The envelope's "right opaque core" and the left/right names of the elevations are based on the reference front observation screen, so the core is on the -X side.

The exact mass, storey lines, wall thicknesses, and room boundaries are owned by [mass and storeys of the space design](../spaces/002-spatial-graph.md#mass-and-storeys). Each number is a production decision, not a survey of an actual building or code or structural certification. The current architectural source implements these dimensions and has a measurement history from earlier independent verdicts. This sentence does not replace the full dimensional and visual verification of the revised tree.

## Ground-floor spatial graph {#ground-graph}

<!--
@evidence principles/core/common.md#declared-basis The stair, workroom, and common area connected directly to the entry and the right opaque core are the user's fixed spatial graph.
@evidence principles/core/common.md#scope-preservation Preserves the direct connections from the entry to the three functions and the storey membership of every room.
@evidence principles/core/common.md#substantive-completion Designates the design consumption boundary so that ground-partition owns the division and doors and single-stair owns the inter-storey route and floor hole.
@evidence principles/core/settings.md#fact-status Distinguishes that from/to names or lines on the floor are not observations of passage and that actual wall holes, landings, and floors are needed.
@evidence principles/core/settings.md#source-support The fixed connections are direct conditions of the brief, and no external certification of actual passage safety or a permitted plan is attached.
@evidence principles/core/settings.md#capability-boundary The entry must connect passage, and a logical id alone gives no ability to pass through walls.
@evidence principles/core/settings.md#constraint-sufficiency Uses no unowned access gap and must implement actual connections in which each required room belongs to one storey.
@evidence principles/core/settings.md#observable-identity Fixes the ground-floor relation in which the front workroom, the continuous living/dining/kitchen at the rear, and the central single stair read from the entry.
-->

**Authority: direct user instruction.** The entry connects directly to the single dog-leg stair, the continuous living, dining, and kitchen at the rear, and the front variable workroom. The bathroom, storage, and services are gathered in the right opaque core. Actual walls and door holes and the stair's landing and floors must provide these connections, and passage is not claimed from from/to names or lines on the floor alone.

[Ground-floor partition](../spaces/002-spatial-graph.md#ground-partition) owns the division and door positions, and [single stair](../spaces/002-spatial-graph.md#single-stair) owns the inter-storey route and the required slab opening. A required room belongs to one storey and uses no unowned access gap.

## Upper-floor spatial graph {#upper-graph}

<!--
@evidence principles/core/common.md#declared-basis Reaching the required rooms directly from a short straight corridor is from the brief, and adopting upper-service follows the confirmed living program.
@evidence principles/core/common.md#scope-preservation Keeps the primary bedroom, two small bedrooms, bathroom, storage, and service room on one corridor and forbids branching and disconnection.
@evidence principles/core/common.md#substantive-completion Allows the stair hole as part of the single stair and sets the condition of escalating to the coordinator when a reference detail conflicts with the fixed graph.
@evidence principles/core/settings.md#fact-status Does not keep the earlier claim that interpreted the required stair hole as the same as the forbidden double-height living void.
@evidence principles/core/settings.md#source-support The upper connections and forbidden structures rest on the user contract, and the references are not used as dimensioned drawings or a basis for legal permission.
@evidence principles/core/settings.md#capability-boundary The stair and its railing provide the inter-storey connection but cannot add a second stair or a separate living void.
@evidence principles/core/settings.md#constraint-sufficiency If implementing a reference would require changing the user graph, that authoring stops and changes only by a coordinator decision.
@evidence principles/core/settings.md#observable-identity One short straight corridor starting at the stair landing, with room doors facing it directly, is the form of the upper private zone.
-->

**Authority: direct user instruction.** One short straight corridor starting at the stair landing connects directly, through actual doors, to the primary bedroom, the two small bedrooms, the bathroom, and storage. The service and laundry room upper-service is also accessed directly from the same corridor. No branching corridor, second stair, disconnected room, or separate double-height living void is made.

[Upper-floor partition](../spaces/002-spatial-graph.md#upper-partition) owns the room, corridor, and door positions. The required stair hole and its railing are part of the allowed single stair. If implementing every detail of the references at once would require changing this user graph, the affected authorship stops and receives the coordinator's decision.

## Envelope and openings {#envelope-and-privacy}

<!--
@evidence principles/core/common.md#declared-basis The curtain-wall positions and the opaque core are from the brief, and the landmark relations of the wooden door, stair glass, flat roof, and PV are an interpretation of the provided images.
@evidence principles/core/common.md#scope-preservation Keeps in the envelope scope all of the glass of the front stair, most of the rear, and the upper front, the right core, the actual glazing members, and the exterior shading.
@evidence principles/core/common.md#substantive-completion Decides the screen relation of the wooden door and the stair glass, the floor/transom and room/jamb alignment, the physical frames, reveals, sills, and hardware, and the flat-roof canopy.
@evidence principles/core/settings.md#fact-status Distinguishes coordinate +X from the left and right of the front screen and does not add a gable or chimney, which are not confirmed in the references.
@evidence principles/core/settings.md#source-support The basis of the envelope is the observed relations of the attached PNGs, and no dimensions or actual structural safety are back-computed from photo pixels.
@evidence principles/core/settings.md#capability-boundary This H2 sets the relations and members of the fixed envelope and defines no new state capability of the glass. The changing tint and shade and the fixed layers are owned by privacy-states.
@evidence principles/core/settings.md#constraint-sufficiency Aligns the curtain wall to the floor lines and room boundaries, makes no cantilever of the main house, and takes the exact repetition range from the elevation interface of the space design.
@evidence principles/core/settings.md#observable-identity The wooden door and stair glass relation on the front perspective screen, the dark frames, the bright stone-family walls, and the thin PV canopy fix the appearance of the same house.
-->

**Authority: the user brief and the shape interpretation of the five references.** The front stairwell, most of the rear, and part of the upper front are curtain wall, and the right service core is opaque. On the front perspective observation screen, the wooden entrance door reads to the left of the stairwell glass. This does not mean that coordinate +X should be taken as screen right. The workroom is at the front on the +X side and connects directly from the entry through a door. The references' right opaque core means the -X side, which is the right of the front screen. The floor/transom and room/jamb boundaries are aligned. The actual mullions, transoms, heads, sills, reveals, door leaves, frames, and hardware must read at review distance. The dimensions and repetition range of the boundaries consume the [elevation interface](../spaces/002-spatial-graph.md#envelope-interface).

A thin solar canopy sits above the flat roof, showing its supports and connections. No cantilever of the main house is made. Bright stone-family opaque faces, dark metal frames, and continuous wood floors and cabinetry are the common material language. A gable or chimney is not an observation of the provided references and is not added.

The initial values of the glass, the per-state tint and shade, and the fixed translucent layers are owned by [Privacy states](#privacy-states).

## Privacy states {#privacy-states}

<!--
@evidence principles/core/common.md#declared-basis A production choice that makes the brief to resolve plenty of glass together with residential privacy concrete as three static optical states per space.
@evidence principles/core/common.md#scope-preservation Keeps the privacy of the common area, stair, workroom, bedrooms, and bathroom and does not replace the fixed translucent layers and actual shades with a single tint.
@evidence principles/core/common.md#substantive-completion Sets the daytime initial value, the 60%/100% shade of the private state, the 100% of the night shade, and the invariance conditions of the fixed layers and light sources.
@evidence principles/core/settings.md#fact-status The three states are an authored optical representation, not proof of actual night weather, electrochromic, security, or energy performance.
@evidence principles/core/settings.md#source-support The per-state shade ratios are production inputs, not performance figures cited from a real electrochromic product or test report.
@evidence principles/core/settings.md#capability-boundary The glass tint and the lowered area of the roller shade change, but the bathroom's fixed translucent layer, the exterior shading, the comparison light, and the exposure do not.
@evidence principles/core/settings.md#constraint-sufficiency Even by day the lower sightline band of the workroom and bedrooms and the bathroom are translucent, and in the private state only the common area and stair get 60% shade while the private rooms get 100%.
@evidence principles/core/settings.md#observable-identity The bright transparent common glass, the translucent lower band of the private rooms, the actual lowered shade area, and the fixed bathroom glass must be distinguishable in each state.
-->

**Basis: a production choice that interprets the user's privacy requirement as static optical states.** The default state is day. The rear common area and the front stair glass are bright and transparent, and the roller shades are raised. The lower sightline band of the front workroom and the upper bedrooms is translucent, and the tinted glass above it looks brighter. The bathroom keeps its whole privacy glazing translucent in every state. The exterior shading is in the same position in all three states.

In the private state, the common area and stair glass are tinted dark and the shades are lowered to 60% of the window's clear height. The workroom and bedrooms lower their shades 100%. In the night shade state, the shades of every living zone are lowered 100%, and the needed daylight areas of the doors and stairwell are not left as transparent interior exposure either. The bathroom's fixed translucent layer stays as it is. When comparing the two changed states, the default light and exposure are not changed, and no claim is made of reproducing an actual night.

The glass tint, the fixed translucent layer, and the actual lowered area of the roller shade are different properties. None of them is replaced by a single transparency value. The normalized optical inputs of the materials and the shade geometry are owned by the design that realizes this state meaning. The source reads the targets from each façade's room ownership and applies the state in bulk. The actual electrochromic device, energy, and security performance are unverified.

## Surface ownership declaration {#surface-decomposition}

<!--
@evidence principles/core/common.md#declared-basis Adopts the user instruction that one author owns one complete visual surface.
@evidence principles/core/common.md#scope-preservation Preserves the four whole elevations, roof, storeys, stair, individual rooms, and site as independent complete surfaces so that the same face is not painted in parts.
@evidence principles/core/common.md#substantive-completion This H2 owns the assignment of authors and source modules per concrete surface and rejects a completion that only renames one existing source file.
@evidence principles/core/settings.md#fact-status This assignment distinguishes the temporary object and emissive meshes of the existing room sources and the temporary material strings of the architectural and room sources from the final models, instances, systems, and materials owners; the upstream ownership boundary passed an independent re-verdict at v-112, and the later source handover of objects and materials is incomplete.
@evidence principles/core/settings.md#source-support Per-surface ownership is a user authoring procedure and is not used as an external performance claim that geometry quality is automatically guaranteed.
@evidence principles/core/settings.md#capability-boundary A surface owner's edit authority is a production responsibility, not an operating capability of building members. The assigned author must take the state constraints of the glass and furniture from the corresponding settings.
@evidence principles/core/settings.md#constraint-sufficiency Does not call the decomposition complete with only string groups declared and requires actual module implementation and an independent verdict.
@evidence principles/core/settings.md#observable-identity Assigning a surface to a sole author is a work responsibility, not a new sensory identity of an elevation or room. The actual forms of the four elevations and the rooms are set by the linked space design and the envelope owner of this file.
-->

**Authority: direct user instruction and the branch contract.** Sole authorship of a complete visual surface is a user instruction. The basis for dividing object shape and surface addresses to models, placement to instances, the emission process to systems, and finish binding to materials is the [branch ownership table](../../.agents/skills/source-authoring/design-branches.md) and the v-097 F1 upstream repair instruction. The assignment below sets the sole architectural owner and implementation module of the four whole elevations, roof/canopy, the two storeys, the single stair, the individual rooms, and the site. Preserving the current source is a temporary decision to keep the GPU observation path. The upstream ownership revision passed the v-112 independent re-verdict, and the object and material source handover is still incomplete.

**Status: the existing architectural surface source and the flat-wall entry shelf source are implemented, and the object ownership and material binding handover are incomplete.** This consumes the [stage 1 graph](../spaces/002-spatial-graph.md). The entry's mail and charging function is realized by a shelf that does not cut into the wall, with no architectural niche hole or lining. The material strings written directly in the current architectural and room sources are temporary values, not finish bindings approved by materialSources. The current author is one main author, and the independent reviewer has no write authority. Even with a future fan-out, one complete architectural surface is assigned whole to one person. A filename or the existence of a temporary mesh is not counted as a completed handover.

Each elevation, front, rear, left, and right, is owned as one whole. Left and right are based on the front observation screen; left is +X and the right service core is -X. The same elevation is not split, as in a front stair/flex split. The final exposed faces of each room's inner walls, excluding floor and ceiling, are made by the room owner, and two child rooms or three core rooms are not merged into one. The entry charging shelf is a wall-mounted object without an architectural hole. The reusable shapes and stable exposed part/face addresses of benches, shelves, desks, chairs, beds, storage cabinets, kitchen and sanitary fixtures, indoor planters and plants, props, and luminaires are handled by models. The per-room membership, transforms, and repetition of prototypes and the per-variable-state object placement are handled by instances, and the emission, illuminance, and state process of light sources by systems. The stable addresses of architectural faces and object faces are exposed by spaces and models respectively, and materials decides the finish binding and material response for those addresses. A face-generating owner carries the decided finish id but does not choose the binding again. The interior structural wall bodies and junctions are made by the storey owner consuming the topology input, and the exterior wall bodies and outer corners by the corresponding elevation owner. The elevation exterior and the room interior are different actual faces. The final exposed face geometry of the continuous floors and interior ceilings is owned by the corresponding storey owner, which carries the finish binding of materials. The room owner neither generates those faces nor decides their binding. Only the exterior eave part of the roof owner's underside is exposed, and the final exposed face of the interior ceiling belongs to the upper owner. The underside of the structural slab body is a hidden structural face behind the interior ceiling finish and is not generated again as a visual finish. The same face is not generated twice.

| Complete surface | Sole author | Assigned implementation source | Scope |
| --- | --- | --- | --- |
| Whole front | main author | src/house/envelope/front.ts | two-storey glazing, exterior of the entrance door, stair glass, spandrel, jamb, shade |
| Whole rear | main author | src/house/envelope/rear.ts | common area and primary bedroom glass, bath closure, all frames and shades |
| Whole left | main author | src/house/envelope/left.ts | opaque return, designed openings, joints, roof junction |
| Whole right | main author | src/house/envelope/right.ts | service wall, privacy opening, panel joints |
| Whole roof and canopy, top and underside | main author | src/house/envelope/roof.ts | roof structure, top face, exterior-exposed eave underside, edge, supports, PV, repeated slats |
| Ground-floor structure and continuous floor/ceiling | main author | src/house/storeys/ground.ts | datum, wall bodies, shared opening voids, floor/ceiling boundary |
| Upper-floor structure and continuous floor/ceiling | main author | src/house/storeys/upper.ts | slab and stair hole, wall bodies, opening voids, storey line |
| One dog-leg stair | main author | src/house/circulation/stair.ts | two flights, landing, treads, risers, stringers, guard, handrail, slab-hole input |
| Entry | main author | src/house/rooms/entry.ts | inner wall faces, door interior; the charging shelf is a separate object, not an architectural niche |
| Variable workroom | main author | src/house/rooms/flex.ts | inner wall faces, sliding door interior |
| Continuous common area | main author | src/house/rooms/common.ts | one living/dining/kitchen room boundary and inner wall faces |
| Ground-floor powder/utility | main author | src/house/rooms/powder.ts | room inner wall faces |
| Ground-floor storage | main author | src/house/rooms/storage-ground.ts | room inner wall faces |
| Primary bedroom | main author | src/house/rooms/primary.ts | room inner wall faces |
| Small bedroom 1 | main author | src/house/rooms/child-one.ts | inner wall faces of the whole L-shaped room |
| Small bedroom 2 | main author | src/house/rooms/child-two.ts | inner wall faces of the whole room |
| Upper corridor | main author | src/house/rooms/corridor.ts | inner wall faces of the straight passage, inner boundary of the room doors |
| Upper bathroom | main author | src/house/rooms/bathroom.ts | room inner wall faces |
| Upper storage | main author | src/house/rooms/storage-upper.ts | room inner wall faces |
| Upper services | main author | src/house/rooms/service-upper.ts | architectural boundary of the inspection area and inner wall faces |
| Whole site and landscape | main author | src/house/site/garden.ts | ground, paths, exterior entry steps, planting, grounding |

The shared portal owner declares the door hole's position, clear dimensions, host wall, from/to spaces, and state only once. The elevation and the room do not each duplicate the same door leaf geometry. The subject's generating owner owns the stable addresses and seam of both faces of the door leaf, and materials decides the two-sided finish binding for those addresses. The other owner passes the requirements of its own face as input. A seam change triggers reverification of the neighbouring surface and does not split ownership.

**State during the handover and retirement responsibility.** The current `src/house/rooms/*.ts` use not only the object functions and `lights()` of `src/house/rooms/interior.ts` but also directly made emissive meshes such as `dining-pendant` in `common.ts` and the two `primary-lamp` in `primary.ts`. All of them are temporary consumption paths of the earlier implementation. To keep the current observation set, those meshes remain until both `instanceSources` and `systemSources` reach `review` by an independent verdict, and no new object shape or part address is authored on this path. The main author implements and gets verdicts on the prototypes and surface addresses in `modelSources`, the per-room placement and repetition in `instanceSources`, and the emission process and elements in `systemSources`. Right after the two later sources reach review, the main author, in **one tree of a single commit**, removes the object and emissive calls of the room sources and the duplicate functions of `interior.ts` and replaces them with the neutral assembly path. Before retirement, every existing object element ID is linked in one row of the correspondence table with its successor instance ID and model part/face ID, and every existing emissive element ID with its successor instance ID, model luminaire part/face ID, **and** system emitter ID. Whether an emissive element came from `lights()` or from a direct primitive does not change this full-coverage condition. One successor address is not counted twice as the replacement of two retired elements, and an intentional removal states the original ID and the reason. 0 missing and 0 duplicates are confirmed in the compiled topology and the observation set. The current viewer creates a SpotLight for every emissive element, so none of them is retired before the systemSources replacement of every emissive element reaches review. `spaceSources` neither imports `src/models` or `src/instances` directly or indirectly nor generates object prototypes. The object meshes and finish strings of the current room sources are not approved permanent ownership, and the current visual and material verdicts are `unverified`.

**Responsibilities of the assembly and observation tools.**

The current `src/spaces/citizen-house.ts` registers in the library the environment received from `buildHouse()`, including the temporary fit-out. After the handover the name of the neutral assembly boundary is `src/house/build.ts`, and `buildHouse()` consumes the independent sources of spaces, models, materials, instances, and systems to make a single environment. `src/spaces/citizen-house.ts` is separated to provide only the architectural output of the spaces branch and does not import the sources of other branches directly or indirectly. The final library registration and the viewer use the result of the neutral `buildHouse()`. The graph, room bounds, portals, stair, and each complete architectural surface are implemented as separate modules. The common primitive helpers only generate unit geometry and decide no room placement or elevation.

The viewer's server, mesh upload, lighting, camera controls, inspection overlay, and observation set derivation are each separated as tool responsibilities. The viewer invents no new geometry or room bounds of the source. The observation set is generated from the current topology that compiled successfully, and an independent observer cannot reduce that denominator. This tool assignment is not a means to pre-pass a particular view or hide a missing opening.
