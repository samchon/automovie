# Ancient civic temple model designs

This document owns the deterministic blocking prototypes that consume the reviewed temple spaces and settings. It does not own placement, quantity, material construction, water simulation, camera composition, or a stronger fidelity claim than the blocking pass.

## Model scope, scale, and fidelity {#model-scope-scale-and-fidelity}

<!--
@evidence principles/core/common.md#declared-basis This unit fixes the model population from the reviewed settings and spaces scale anchors: floor datum, room height, door clear, room route, and loop width.
@evidence principles/core/common.md#scope-preservation This unit separates prototype geometry from space topology, material response, instance membership, and viewer observation.
@evidence principles/core/common.md#substantive-completion This unit names the complete 17-H2 prototype population, its shared scale board, blocking ceiling, and neutral review set.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds reusable model boundaries beyond the reviewed space topology and does not restate a room as geometry.
@evidence principles/design/models.md#representation-contract This unit defines the population-level solid, open-boundary, surface, and proxy conventions that every prototype H2 specializes.
@evidence principles/design/models.md#spatial-convention This unit fixes the shared Y-up metre frame, floor datum, and scale anchors used by all prototype extents.
@evidence principles/design/models.md#reviewable-structure This unit fixes the common front, side, top, and three-quarter neutral views plus the door and room-height comparison board.
@evidence principles/design/models.md#model-observable-style-basis This unit translates the temple's stone, terracotta, wood, metal, and restrained civic blocking grammar into observable silhouettes without finish claims.
@evidence principles/design/models.md#model-scale-layer-completion This unit closes the population's scale references, part layers, stable-interface rule, refusal boundary, and review ownership.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The model scope checked floor Y=0.00, room clear height 3.60m, 1.10m door clear, 1.20m room-side route, 2.00m loop width, fixed landmark identities, and the rigid blocking ceiling; those parent decisions were sufficient and no model construction exposed a parent defect.
@evidence settings/temple.md#coordinate-unit-convention The complete prototype board uses the reviewed Y-up metre frame, south-to-north orientation, and floor datum rather than a model-local unit convention.
@evidence settings/temple.md#production-fidelity-tier The population is limited to deterministic blocking silhouettes and explicitly refuses photoreal finish, fluid simulation, hidden engineering, and decorative micro-detail.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits The named columns, doors, fountain parts, altar, roof tile, furniture, vessels, lamps, and bench are the model roles that the settings identity makes observable.
@evidence settings/temple.md#delivery-review-condition The finite neutral model board is a pre-placement check and does not replace the compiled topology observation set.
@evidence settings/temple.md#accessibility-deliverable-states The model board reports prototype readability separately from any accessibility certification and leaves the reviewed unverified boundary intact.
@evidence settings/temple.md#audience-operator-access The common door and room-height comparison lets an operator inspect all prototype roles at a stable review distance.
@evidence settings/temple.md#delivery-scope The complete model population covers the promised blocking objects and explicitly hands placement, finish, and topology to later owners.
@evidence settings/temple.md#design-dependent-subject-conditions The prototype limits preserve the compiled route, threshold, fountain, and service interfaces instead of inventing dependent behavior.
@evidence settings/temple.md#governing-aim The neutral model board makes the civic building's object roles and room-legibility aids comparable without pretending to be a final shot.
@evidence settings/temple.md#operative-subject-inventory The 16 named prototype roles in this document correspond to the model subjects listed by settings, while neutral observation is not treated as a design subject.
@evidence settings/temple.md#reference-interpretation-boundary The five references inform silhouette, atmosphere, and material vocabulary only; no image is used as a dimension source or surface texture.
@evidence settings/temple.md#settings-coverage-map The model scope assigns each model subject to one H2 owner and records the downstream placement and finish handoffs.
@evidence settings/temple.md#stage-policy The document is complete enough for the models evidence stage but intentionally stops before model source, materials, and instances.
@evidence spaces/temple.md#one-storey-containment-and-level Prototype heights are checked against the one ground-storey clear volume and never add a level or alter containment.
@evidence spaces/temple.md#spatial-verification-addresses-and-finite-review-set The neutral model board is derived from the reviewed spatial scale and role questions while compiled room topology remains space-owned.
@evidence spaces/temple.md#one-storey-civic-temple-graph Every prototype is a fit-out or envelope representation inside the reviewed civic graph and cannot introduce another room or storey.
@evidence spaces/temple.md#entrance-service-gate-and-route-graph Door and furniture prototypes consume the reviewed threshold and protected route interfaces; they do not create a new connector or circulation loop.
@evidence obligations/core/common.md#purpose-fit The bounded prototype family serves the civic blocking purpose by making the named building roles legible at review distance.
@evidence obligations/core/common.md#layer-boundary This unit keeps geometry, topology, finish, population, and viewer ownership separate.
@evidence obligations/core/common.md#production-language The prototypes retain stable English role identifiers required by the source and evidence interfaces.
@evidence obligations/core/common.md#proportionate-development The population stops at consequential silhouette, contact, negative space, and stable surfaces rather than unsupported detail.
@evidence obligations/design/models.md#addressable-model-decisions The 17 H2 owners each represent one independently implementable and reviewable prototype decision.
@evidence obligations/design/models.md#representation-ceiling The models state what a blocking proxy can and cannot visually support.
@evidence obligations/design/models.md#reference-scale The common door, room-height, floor, route, and loop anchors establish cross-prototype scale.
@evidence obligations/design/models.md#articulation-ownership Every listed prototype is rigid and exposes no motion-writable pivot in this layer.
@evidence obligations/design/models.md#model-review-set The common neutral front, side, top, and three-quarter views make silhouettes comparable before placement.
@evidence obligations/design/models.md#model-representation-completion The population accounts for each promised part layer, interface, limit, and observation owner.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Checked this scope owner against the reviewed floor datum, 3.60m room height, 1.10m door, 1.20m room route, and 2.00m loop anchors; changing any of those inherited anchors would invalidate this population boundary.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 Checked that this H2 owns the 16 named prototype geometries and comparison board while placement, count, material response, topology, and viewer observation remain downstream; assigning an instance or room to this H2 would falsify the split.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 Checked the explicit 17-H2 population, shared scale board, named surface/negative-space conventions, and blocking refusal list; a missing prototype role or an unbounded finish claim would falsify this scope conclusion.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 Checked that the model layer adds reusable object boundaries beyond the reviewed rooms rather than duplicating `sanctuary`, `courtyard`, or `colonnade-loop`; a room-shaped model owner would falsify this derived distinction.
@evidenceReview principles/design/models.md#representation-contract #46718c6 Checked that the population contract covers connected solids, open cavities, stable surface partitions, and the neutral board without silently requiring a generated mesh; an unowned open boundary or surface would falsify the representation contract.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e Checked the shared Y-up metre frame, floor Y=0.00 datum, south-to-north orientation, 1.10m door board, and 3.60m height marker; any prototype using another unit or vertical convention would falsify this common frame.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b Checked that front, side, top, and three-quarter neutral views plus the two scale markers expose the population's silhouettes before placement; a role readable only from a placement-specific camera would falsify this review structure.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 Checked the population's restrained stone, terracotta, wood, and metal blocking vocabulary and its refusal of texture-level finish; a photoreal or historically reconstructed claim would falsify this style boundary.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e Checked that every listed prototype has a scale anchor, addressable parts, stable interfaces, a refusal limit, and a named downstream handoff; an unlisted part or ownerless handoff would falsify population completion.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 Checked the Model scope, scale, and fidelity unit's exact bounds, part contacts, stable interfaces, and refusal boundary; no parent defect was exposed by the upstream check.
@evidenceReview settings/temple.md#coordinate-unit-convention #01e5537 Checked that the full population shares the reviewed Y-up metre frame and floor datum while each prototype supplies its own local extents; a mixed-unit model board would falsify this adoption.
@evidenceReview settings/temple.md#production-fidelity-tier #e1e932d Checked that the board promises only deterministic blocking silhouettes and explicitly excludes photoreal finish, fluid simulation, engineering, and micro-detail; any such promise in this scope would exceed the settings tier.
@evidenceReview settings/temple.md#subject-observable-identity-and-fit-out-limits #73d6425 Checked that the listed column, door, fountain, altar, tile, furniture, vessel, lamp, and bench roles are the exact observable identities, with the board separating their silhouettes; an unnamed catch-all prop would falsify the inventory.
@evidenceReview settings/temple.md#delivery-review-condition #fb23db4 Checked that the neutral board is a pre-placement object review with front/side/top/three-quarter views and is not substituted for compiled topology observations; treating the board as a building delivery view would falsify this boundary.
@evidenceReview settings/temple.md#accessibility-deliverable-states #2d42342 Checked that prototype readability is reported separately from accessibility certification and retains the settings `unverified` boundary; a model-board pass would not falsify or certify room accessibility.
@evidenceReview settings/temple.md#audience-operator-access #0e8cb17 Checked that the 1.10m door board and 3.60m height marker give operators a stable scale comparison for all 16 roles; removing either marker would falsify this operator aid.
@evidenceReview settings/temple.md#delivery-scope #1b40e35 Checked that this scope covers exactly the promised blocking object population and hands placement, count, materials, and compiled topology to later owners; a placement transform in this H2 would falsify the scope.
@evidenceReview settings/temple.md#design-dependent-subject-conditions #cfc9e04 Checked that door thresholds, 1.20m room routes, fountain centre, and service terminal remain consumed interfaces rather than new model-owned graph edges; a prototype adding circulation would falsify this condition.
@evidenceReview settings/temple.md#governing-aim #2aba9c6 Checked that the common board makes civic object roles legible as a blocking population, including the distinct altar, storage, and records silhouettes; a final-shot claim would falsify the governing aim.
@evidenceReview settings/temple.md#operative-subject-inventory #2687aca Checked the one-to-one correspondence between the 16 named prototype roles and the operative inventory, with neutral observation kept as a review condition rather than a model subject; adding a second basket owner would falsify it.
@evidenceReview settings/temple.md#reference-interpretation-boundary #5814353 Checked that all five references contribute only silhouette, atmosphere, and material vocabulary to this population; deriving a prototype dimension from a pixel proportion would falsify the boundary.
@evidenceReview settings/temple.md#settings-coverage-map #68dee2e Checked that each operative model role has one H2 owner and explicit downstream placement/material handoffs, while the scope H2 owns the population rule; an ownerless role would falsify the map.
@evidenceReview settings/temple.md#stage-policy #49599e9 Checked that the scope document stops before model source, materials, and instances while still closing the 17 prototype design decisions; a source export or instance count here would falsify the stage boundary.
@evidenceReview spaces/temple.md#one-storey-containment-and-level #ef236a9 Checked that every prototype is bounded inside the single ground storey and the 3.60m clear volume; a second level or object-induced storey would falsify containment.
@evidenceReview spaces/temple.md#spatial-verification-addresses-and-finite-review-set #bc595fa Checked that the model board derives its scale from the reviewed room thresholds, centers, and cardinal questions while compiled addresses stay space-owned; a board-only observation set would falsify this relation.
@evidenceReview spaces/temple.md#one-storey-civic-temple-graph #917bffd Checked that the 16 prototypes represent fit-out or envelope parts inside the existing five-room, courtyard, and loop graph; a model H2 naming a new room would falsify the graph handoff.
@evidenceReview spaces/temple.md#entrance-service-gate-and-route-graph #b231c39 Checked that doors and furniture preserve the south threshold, room-side 1.20m protected routes, fountain landmark, and terminal service gate without creating a connector; a model-owned route edge would falsify this handoff.
@evidenceReview obligations/core/common.md#purpose-fit #7b32c66 Checked that this population's concrete purpose is civic blocking readability, evidenced by the door/height board and named role silhouettes rather than finish realism.
@evidenceReview obligations/core/common.md#layer-boundary #5271f94 Checked the explicit split between prototype geometry here and topology, material response, instance membership, and viewer rendering elsewhere; moving a courtyard surface owner into this scope would falsify it.
@evidenceReview obligations/core/common.md#production-language #3ef4142 Checked that all 16 prototype IDs and the 17-H2 hierarchy use stable English names consumed by source and evidence, including `fountain-basin` and `storage-basket`.
@evidenceReview obligations/core/common.md#proportionate-development #78feb28 Checked that the population preserves only blocking silhouette, contact, negative space, and stable surfaces, such as open basket/display cavities, and refuses unsupported micro-detail.
@evidenceReview obligations/design/models.md#addressable-model-decisions #226db18 Checked 17 separate H2 boundaries, including the scope owner and each of the 16 prototypes, so each can receive its own source, material, and instance handoff.
@evidenceReview obligations/design/models.md#representation-ceiling #80e74d3 Checked the stated result—readable blocking object roles—and the explicit refusal of final photoreal, simulation, and historical reconstruction; any stronger result claim would falsify this ceiling.
@evidenceReview obligations/design/models.md#reference-scale #2598af4 Checked the shared 1.10m door, 3.60m room, floor, 1.20m route, and 2.00m loop anchors that let column, furniture, and vessel dimensions be compared without image measurement.
@evidenceReview obligations/design/models.md#articulation-ownership #96abfe1 Checked that every listed prototype is rigid and exposes no motion-writable pivot, leaving door opening, water flow, flame, and occupancy to later owners.
@evidenceReview obligations/design/models.md#model-review-set #8d4744e Checked that front, side, top, and three-quarter board views answer object-silhouette questions before placement, and do not claim to answer compiled room or exterior observations.
@evidenceReview obligations/design/models.md#model-representation-completion #76dd818 Checked the population ledger for every promised part layer, stable interface, refusal limit, and downstream observation owner; an unresolved model role would falsify completion.
-->

Authority and status: `author-adopted` model boundary derived from the reviewed settings and spaces. All geometry uses Y-up metres with floor `Y=0.00`. The shared comparison anchors are room clear height `3.60m`, ordinary door clear `1.10m`, room-side route `1.20m`, and colonnade loop width `2.00m`. The complete prototype population is `column`, `door`, `fountain-basin`, `fountain-stream`, `altar-plinth`, `roof-tile`, `records-table`, `records-shelf`, `records-chest`, `storage-shelf`, `storage-chest`, `storage-basket`, `votive-display`, `ceramic-vessel`, `lamp`, and `bench`, plus this scope owner. Placement transforms, count, spacing, material response, and compiled topology remain with their owners.

The neutral model set is front, side, top, and three-quarter at the same metre scale, with a `1.10m` door comparison board and a `3.60m` room-height marker. These views expose silhouette, contact, negative space, and stable surface partition. They do not certify materials, lighting, fluid dynamics, historical reconstruction, or final rendered quality.

Review question: does the complete prototype population remain readable as bounded civic blocking geometry while preserving the reviewed space graph and downstream ownership boundaries?

## Column prototype {#column-prototype}

<!--
@evidence principles/core/common.md#declared-basis The column unit uses the reviewed stone-column role and the shared 3.60m room-height comparison.
@evidence principles/core/common.md#scope-preservation This unit owns only the column's rigid geometry; loop placement and stone response remain downstream.
@evidence principles/core/common.md#substantive-completion This unit closes the base, shaft, capital, exact vertical bounds, surfaces, contact, and refusal boundary.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds a reusable column representation beyond the colonnade-loop space.
@evidence principles/design/models.md#representation-contract The three connected parts, taper, bounds, and named stone surfaces define the column operation without a hidden layer.
@evidence principles/design/models.md#spatial-convention The base-centred floor origin and exact Y intervals make the column comparable and placeable.
@evidence principles/design/models.md#reviewable-structure Front, side, top, and three-quarter views expose the base, shaft taper, capital, and ground contact.
@evidence principles/design/models.md#model-observable-style-basis The rough stone three-part silhouette is observable without a historical-order or carved-detail claim.
@evidence principles/design/models.md#model-scale-layer-completion The corrected part intervals and 5% taper close every visible column layer.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The column check compared its 3.20m total height and 0.32m-to-0.304m shaft taper with the 3.60m room height and checked the 0.45m capital ratio; no parent capability, contact, or space defect was exposed.
@evidence settings/temple.md#coordinate-unit-convention The column's base-centred origin expands to X/Z `-0.225..0.225m`, Y `0.00..3.20m`, with base/shaft/capital seams at Y `0.18` and `2.92m`; any other seam or extent falsifies its coordinate handoff.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits The three-part stone column is the specific vertical landmark required by the settings identity.
@evidence spaces/temple.md#courtyard-and-continuous-colonnade-loop The column receives the reviewed loop running-line and must remain outside the 2.00m clear circulation band.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions The column preserves the loop's repeated stone support role without changing the loop topology.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Checked the column against the reviewed 3.60m room-height anchor: its own total Y extent is 0.00..3.20m and its stone role is inherited from the loop, not invented as a room boundary.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 Checked that this H2 owns only the column solid and its three surface IDs, while loop positions, clear route, stone response, and repetition remain downstream; a loop connector here would falsify the split.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 Checked `base`, `shaft`, `capital`, their Y seams at 0.18m and 2.92m, the 5% shaft taper, and the no-articulation refusal; a missing capital or unsupported carving claim would falsify completion.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 Checked that the column adds a reusable vertical support to `colonnade-loop` rather than duplicating the loop space; a prototype whose boundary was the whole loop would falsify this distinction.
@evidenceReview principles/design/models.md#representation-contract #46718c6 Checked one connected rigid solid with `column-stone-base`, `column-stone-shaft`, and `column-stone-capital`, including closed part contacts and no hidden cavity; merging those surfaces would falsify the contract.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e Checked base-centre origin, X/Z `-0.225..0.225m`, Y `0.00..3.20m`, and the ordered base/shaft/capital intervals; a shifted origin or reversed Y interval would falsify placement handoff.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b Checked front and side views for the 0.40m base, 0.32→0.304m shaft, and 0.45m capital, with top/three-quarter views exposing contact and seams; hiding a layer would falsify readability.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 Checked the column's rough three-part stone silhouette and restrained surface names without fluting, carved relief, or historical-order claims; those additions would exceed this style basis.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e Checked the exact 0.18/2.92m layer boundaries, 5% taper, three stable surfaces, rigid refusal, and instance route-clearance handoff; any unbounded layer would falsify completion.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 Checked the Column unit's exact bounds, part contacts, stable interfaces, and refusal boundary; no parent defect was exposed by the upstream check.
@evidenceReview settings/temple.md#coordinate-unit-convention #01e5537 Checked the column's base-centred Y-up origin and metric envelope X/Z `-0.225..0.225m`, Y `0.00..3.20m`; a prototype using the room-height 3.60m as its own height would falsify this coordinate handoff.
@evidenceReview settings/temple.md#subject-observable-identity-and-fit-out-limits #73d6425 Checked the specific repeated stone support identity through its 0.40m base, tapered shaft, and 0.45m capital; a flat post would fail the settings silhouette anchor.
@evidenceReview spaces/temple.md#courtyard-and-continuous-colonnade-loop #e160d55 Checked that instances can place this 3.20m column outside the 2.00m loop route while preserving the loop-return geometry; a column crossing that band would falsify the consumer handoff.
@evidenceReview spaces/temple.md#spatial-identity-tolerance-and-exclusions #e055926 Checked the repeated support role and its empty surrounding circulation rather than adding a room, wall, or second loop; replacing it with topology would falsify the reviewed spatial identity.
-->

Authority and status: `author-adopted` fixed prototype for the colonnade loop. The local origin is the base contact centre, with occupied bounds X/Z `-0.225..0.225m` and Y `0.00..3.20m`. The hierarchy is `base`, `shaft`, `capital`: base Y `0.00..0.18m` with diameter `0.40m`; shaft Y `0.18..2.92m`, diameter `0.32m` at its base and `0.304m` at its top; capital Y `2.92..3.20m` with diameter `0.45m`. The shaft taper is exactly 5% and the capital-to-shaft-top ratio is approximately 1.48. Stable surfaces are `column-stone-base`, `column-stone-shaft`, and `column-stone-capital`. The parts are one connected rigid solid with no internal negative space or articulation. Instances place it outside the compiled loop route.

Neutral review is front, side, top, and three-quarter against the `3.60m` height marker. Fluting, carved relief, load analysis, and historical order are outside this proxy.

Review question: does the column show three complete vertical layers and the permitted taper without entering the loop route?

## Door prototype {#door-prototype}

<!--
@evidence principles/core/common.md#declared-basis The door unit uses the reviewed 1.10m by 2.10m clear opening and 0.40m host depth.
@evidence principles/core/common.md#scope-preservation This unit owns frame and leaf geometry; spaces owns the semantic void and instances owns placement.
@evidence principles/core/common.md#substantive-completion This unit closes every frame and leaf surface identifier, clear relation, depth, contact, and rigid limit.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds a reusable door representation beyond the opening element.
@evidence principles/design/models.md#representation-contract The jamb, lintel, leaf, and clear void have named boundaries and no hidden surface owner.
@evidence principles/design/models.md#spatial-convention The threshold-centred origin and exact X/Y/Z extents preserve the reviewed opening scale.
@evidence principles/design/models.md#reviewable-structure The neutral door views expose clear width, clear height, frame, leaf, and host fit.
@evidence principles/design/models.md#model-observable-style-basis The light-stone frame and dark-wood leaf contrast is observable without joinery or weather-seal claims.
@evidence principles/design/models.md#model-scale-layer-completion The named jamb, lintel, and leaf boundaries close the door's visible layers and handoff.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The door check compared the 1.10m by 2.10m clear void, 0.40m host depth, and room-side 1.20m route start; the reviewed opening and space interfaces were sufficient and exposed no parent defect.
@evidence settings/temple.md#coordinate-unit-convention The threshold-centred door uses the reviewed Y-up metre frame and floor datum.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits The door identity requires a light frame, dark leaf, clear opening, and room-side route reading.
@evidence spaces/temple.md#room-schedule-and-direct-thresholds The model consumes the reviewed direct room threshold, 1.10m clear width, and room-facing route origin.
@evidence spaces/temple.md#envelope-opening-and-interior-interface The model consumes the reviewed 0.40m host depth and vertical opening range without changing the semantic void.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Checked the door against the reviewed 1.10m by 2.10m room opening and 0.40m host depth; its threshold-centred geometry is the model-specific realization of that opening, not a new opening.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 Checked that frame and leaf geometry belong here while the semantic void, direct room connector, placement, and material response remain space or downstream owners; changing the void here would falsify the split.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 Checked both jambs, lintel, leaf, four stable surface IDs, clear void, 0.40m host, and rigid closed state; missing a jamb or adding opening animation would falsify completion.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 Checked that the door reuses an opening interface as a bounded frame/leaf prototype rather than redefining the host wall or room threshold; a new doorway graph edge would falsify this distinction.
@evidenceReview principles/design/models.md#representation-contract #46718c6 Checked the named stone jamb/lintel surfaces and wood leaf around an unfilled X `-0.55..0.55m`, Y `0.00..2.10m` void; closing that void with a hidden panel would falsify the contract.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e Checked the threshold-centred origin, clear Z `-0.20..0.20m`, leaf Z `-0.16..0.16m`, and Y floor-to-lintel ordering; any offset leaf or host-depth drift would falsify the frame.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b Checked south/room-side front, side, and three-quarter views for clear width, height, frame reveal, and leaf placement; a view that hides the semantic void would falsify reviewability.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 Checked the light-stone frame versus dark-wood leaf as the door's blocking contrast without handles, hinges, joinery, or weather-seal claims; those details are outside this proxy.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e Checked jamb/lintel/leaf intervals, 1.10m clear, 2.10m height, named surfaces, rigid refusal, and room-side route handoff; a frame not fitting the 0.40m host would falsify completion.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 Checked the Door unit's exact bounds, part contacts, stable interfaces, and refusal boundary; no parent defect was exposed by the upstream check.
@evidenceReview settings/temple.md#coordinate-unit-convention #01e5537 Checked the door's threshold origin and metric bounds, especially X `-0.73..0.73m`, Y `0.00..2.32m`, and Z host `-0.20..0.20m`; a door-sized room would falsify this handoff.
@evidenceReview settings/temple.md#subject-observable-identity-and-fit-out-limits #73d6425 Checked the stable identity as a stone frame around a dark rigid leaf with a 1.10m clear void; a solid stone panel would fail the requested door role.
@evidenceReview spaces/temple.md#room-schedule-and-direct-thresholds #e393909 Checked that the model leaves the five source-owned direct thresholds and starts the 1.20m route on the room-facing plane after the 1.10m opening; a model-side connector would falsify this consumer relation.
@evidenceReview spaces/temple.md#envelope-opening-and-interior-interface #440376d Checked the frame's full Z `-0.20..0.20m` host and the leaf's narrower Z `-0.16..0.16m` within the semantic void; any part crossing the host boundary would falsify the interface.
-->

Authority and status: `author-adopted` fixed prototype for the reviewed room openings. The local origin is the threshold centre at floor contact. The semantic clear void is X `-0.55..0.55m`, Y `0.00..2.10m`, within host depth Z `-0.20..0.20m`. The rigid hierarchy and stable surfaces are `stone-jamb-left` / `door-frame-left-stone` with X `-0.73..-0.55m`, Y `0.00..2.10m`, Z `-0.20..0.20m`; `stone-jamb-right` / `door-frame-right-stone` with X `0.55..0.73m`, the same Y/Z bounds; `stone-lintel` / `door-frame-lintel-stone` with X `-0.73..0.73m`, Y `2.10..2.32m`, Z `-0.20..0.20m`; and `wood-leaf` / `door-leaf-wood` with X `-0.55..0.55m`, Y `0.00..2.10m`, Z `-0.16..0.16m`. The leaf remains a closed rigid blocking state; the semantic void and threshold stay space-owned.

Neutral review is from the south entry orientation, the room side, side, and three-quarter. Handles, hinges, joinery, weather seals, and opening animation are outside this proxy.

Review question: does the door expose named stone and wood surfaces while preserving the compiled clear void and its room-side route?

## Fountain basin prototype {#fountain-basin-prototype}

<!--
@evidence principles/core/common.md#declared-basis The basin unit uses the reviewed single central fountain landmark and floor datum.
@evidence principles/core/common.md#scope-preservation This unit owns the basin shell; the space socket owns its identity and instances own placement.
@evidence principles/core/common.md#substantive-completion This unit closes the outer shell, rim, inner cavity, water-seat boundary, bounds, and proxy limit.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds a basin representation beyond the courtyard landmark element.
@evidence principles/design/models.md#representation-contract The basin names its connected stone parts, open top, cavity, and stable surfaces.
@evidence principles/design/models.md#spatial-convention The fountain-centred floor origin and radial extents make the landmark comparable.
@evidence principles/design/models.md#reviewable-structure Top and three-quarter views expose the rim, cavity, contact, and scale against the courtyard.
@evidence principles/design/models.md#model-observable-style-basis The low rough-stone circular basin is observable without carved ornament or hydraulic engineering.
@evidence principles/design/models.md#model-scale-layer-completion The basin's outer, inner, and water-seat layers jointly close its blocking representation.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The basin check compared its 0.85m outer radius, 0.62m inner radius, 0.42m height, and open top with the reviewed fountain centre and loop clearance; no parent socket or space defect was exposed.
@evidence settings/temple.md#coordinate-unit-convention The basin origin is the source central landmark at floor contact and its bounds are X/Z `-0.85..0.85m`, Y `0.00..0.42m`; a shifted centre or alternate height falsifies this coordinate handoff.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits The settings require one low circular stone basin as the courtyard landmark.
@evidence spaces/temple.md#courtyard-and-continuous-colonnade-loop The basin consumes the central courtyard landmark relation and remains clear of the loop route.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions The basin preserves one central fountain landmark and does not add a second socket or route.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Checked the basin against the reviewed single `fountain-center` landmark and floor datum, using the 0.85m outer radius rather than a second courtyard anchor.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 Checked that this H2 owns the basin shell and water-seat boundary only; the source socket owns identity and instances own placement, so a water-flow edge here would falsify the split.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 Checked `basin-foot`, `basin-wall`, `basin-rim`, the open cavity, three stable surfaces, and Y `0.00..0.42m`; a closed top or missing water seat would falsify completion.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 Checked that the circular shell adds geometry to the source landmark without redefining `fountain-center` or the courtyard floor; a second socket would falsify the derived boundary.
@evidenceReview principles/design/models.md#representation-contract #46718c6 Checked the connected foot/wall/rim shell, open top, inner radius `0.62m`, and surfaces `basin-stone-exterior`, `basin-stone-rim`, `basin-water-seat`; filling the cavity would falsify the contract.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e Checked the basin-centred floor-contact origin, radial X/Z `-0.85..0.85m`, and stacked Y intervals `0.00..0.18..0.38..0.42m`; any off-centre origin would falsify placement.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b Checked top view for the 0.62m cavity and side/three-quarter views for the 0.42m low profile, rim, and floor contact; a view hiding the opening would falsify reviewability.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 Checked the low rough-stone circular basin silhouette without carved ornament, pump hardware, plumbing, or water shading; those additions would exceed this blocking style.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e Checked outer/inner radii, foot/wall/rim intervals, open cavity, three surface owners, rigid refusal, and placement handoff; any missing rim layer would falsify completion.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 Checked the basin's 0.85m outer radius, 0.62m cavity, 0.42m height, open top, and landmark clearance against the reviewed courtyard; no parent defect was exposed.
@evidenceReview settings/temple.md#coordinate-unit-convention #01e5537 Checked the basin-centred origin and X/Z `-0.85..0.85m`, Y `0.00..0.42m` extent against the shared floor datum; a rectangular or raised origin would falsify this coordinate relation.
@evidenceReview settings/temple.md#subject-observable-identity-and-fit-out-limits #73d6425 Checked the one low circular stone landmark with a visible cavity and rim; a tall tank or second fountain would fail the settings identity.
@evidenceReview spaces/temple.md#courtyard-and-continuous-colonnade-loop #e160d55 Checked that the 1.70m diameter basin remains a central landmark inside the courtyard hole and outside the 2.00m circulation route; enlarging it into the loop would falsify the handoff.
@evidenceReview spaces/temple.md#spatial-identity-tolerance-and-exclusions #e055926 Checked one `fountain-center` basin with one open cavity and no route element, second socket, or extra room; any of those additions would falsify the spatial identity.
-->

Authority and status: `author-adopted` fixed basin prototype consumed by the `fountain-center` landmark. The local origin is the basin centre at floor contact, with bounds X/Z `-0.85..0.85m` and Y `0.00..0.42m`. The hierarchy is `basin-foot`, `basin-wall`, and `basin-rim`. The foot occupies Y `0.00..0.18m` with outer radius `0.72m`; the wall occupies Y `0.18..0.38m` with outer radius `0.85m` and inner radius `0.62m`; the rim occupies Y `0.38..0.42m` with outer radius `0.85m` and inner radius `0.62m`. Stable surfaces are `basin-stone-exterior`, `basin-stone-rim`, and `basin-water-seat`; the interior is one open negative cavity with its horizontal seat at Y `0.18m`. The basin is rigid and does not own water flow or placement.

Neutral review is top, side, and three-quarter. The proxy shows one low open stone basin; carving, pump hardware, plumbing, and water shading are outside this layer.

Review question: does the basin read as one low open circular landmark at the compiled `fountain-center` without changing route or socket ownership?

## Fountain stream prototype {#fountain-stream-prototype}

<!--
@evidence principles/core/common.md#declared-basis The stream unit uses the reviewed one-stream condition and the basin-centre landmark datum.
@evidence principles/core/common.md#scope-preservation This unit owns one rigid water accent; basin geometry, dynamics, and placement remain with their owners.
@evidence principles/core/common.md#substantive-completion This unit closes the centreline, vertical layers, contact, surface owner, bounds, and simulation refusal.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds a stream representation beyond the courtyard socket.
@evidence principles/design/models.md#representation-contract The stream has named connected parts, one centreline, one stable water surface, and no branching topology.
@evidence principles/design/models.md#spatial-convention The basin-centred floor origin and Y intervals make the static accent reproducible.
@evidence principles/design/models.md#reviewable-structure Side and three-quarter views expose the vertical accent, contact, and route separation.
@evidence principles/design/models.md#model-observable-style-basis The single narrow water accent is observable without fluid-realism claims.
@evidence principles/design/models.md#model-scale-layer-completion The contact, column, and top-break intervals close the stream proxy.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The stream check compared its one centreline, Y 0.25..1.20m bounds, and basin contact with the reviewed one-stream landmark and route clearance; no parent state or space defect was exposed.
@evidence settings/temple.md#coordinate-unit-convention The stream uses the reviewed Y-up metre frame and basin-centred floor datum.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits The settings require one restrained vertical stream accent rather than a second channel or fountain system.
@evidence spaces/temple.md#courtyard-and-continuous-colonnade-loop The stream consumes the fountain-centre relation while remaining inside the landmark clearance and outside circulation.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions The one-centreline proxy preserves the single-stream identity and adds no route element.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Checked the stream against the reviewed one-stream condition at `fountain-center`, using the basin-centre floor datum and no independent channel authority.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 Checked that this H2 owns one rigid water accent while basin geometry, dynamics, placement, and material response remain elsewhere; a pump or route here would falsify the split.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 Checked `base-contact`, `vertical-column`, `top-break`, one centreline, `stream-water`, and Y `0.25..1.20m`; a branch or missing contact would falsify completion.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 Checked that the stream adds a narrow accent to the basin landmark without redefining the courtyard socket or basin shell; a second landmark would falsify this derived distinction.
@evidenceReview principles/design/models.md#representation-contract #46718c6 Checked three connected centreline parts of nominal radius `0.05m` and the sole `stream-water` surface, with no branch, spray volume, or hidden particle layer.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e Checked the basin-centred floor origin, X/Z `-0.05..0.05m`, and Y seams `0.25/0.30/1.15/1.20m`; lateral drift would falsify the static coordinate contract.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b Checked side view for the 0.95m vertical accent and three-quarter view for its centreline/contact against the basin; a front-only arc would falsify the review question.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 Checked one restrained narrow water accent without fluid realism, splash, smoke, or emissive claim; a spray system would exceed the stream proxy.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e Checked the three Y intervals, centreline radius, water surface, simulation refusal, and basin placement handoff; an unbounded stream top would falsify completion.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 Checked one centreline, Y `0.25..1.20m`, basin contact, and route separation against the reviewed courtyard landmark; no parent defect was exposed.
@evidenceReview settings/temple.md#coordinate-unit-convention #01e5537 Checked the floor-contact origin at the basin centre and X/Z `-0.05..0.05m`, Y `0.25..1.20m`; a hanging or off-axis stream would falsify this coordinate handoff.
@evidenceReview settings/temple.md#subject-observable-identity-and-fit-out-limits #73d6425 Checked one narrow vertical stream accent, not a channel, fountain system, or second landmark; those alternatives would fail the role identity.
@evidenceReview spaces/temple.md#courtyard-and-continuous-colonnade-loop #e160d55 Checked that the accent consumes the existing fountain landmark and remains within its clearance without entering the 2.00m loop route; a lateral branch would falsify the relation.
@evidenceReview spaces/temple.md#spatial-identity-tolerance-and-exclusions #e055926 Checked the single centreline and absence of route/connectors, extra socket, or second stream; any additional circulation or water branch would falsify the spatial exclusion.
-->

Authority and status: `author-adopted` static accent prototype consumed by the basin landmark. The local origin is the courtyard floor datum at the basin centre, with occupied bounds X/Z `-0.05..0.05m` and Y `0.25..1.20m`. The rigid hierarchy is `base-contact` Y `0.25..0.30m`, `vertical-column` Y `0.30..1.15m`, and `top-break` Y `1.15..1.20m`, all on one centreline with nominal radius `0.05m`. The sole stable surface is `stream-water`. There is no branch, lateral arc, spray volume, pump, particle state, or motion interface.

Neutral review is side and three-quarter against the basin. Fluid simulation, splash, and physical circulation are outside the proxy.

Review question: does the stream read only as one narrow static vertical accent at the basin centre?

## Altar and plinth prototype {#altar-and-plinth-prototype}

<!--
@evidence principles/core/common.md#declared-basis The altar unit uses the reviewed sanctuary rear-axis role and the shared floor and room-height anchors.
@evidence principles/core/common.md#scope-preservation This unit owns the altar pair; the sanctuary room relation owns placement and materials own response.
@evidence principles/core/common.md#substantive-completion This unit closes plinth, body, exact bounds, surfaces, contact, and unsupported ritual detail.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds a reusable altar representation beyond the sanctuary room.
@evidence principles/design/models.md#representation-contract The two connected stone parts have named boundaries, closed tops, and no hidden layer.
@evidence principles/design/models.md#spatial-convention The plinth-centred floor origin and exact stacked extents make the pair placeable.
@evidence principles/design/models.md#reviewable-structure Front, side, top, and rear-axis three-quarter views expose the stacked widths, depth, and contact.
@evidence principles/design/models.md#model-observable-style-basis The broad stone plinth and smaller body communicate the sanctuary landmark without iconography.
@evidence principles/design/models.md#model-scale-layer-completion The plinth and body layers, surfaces, and bounds jointly close the pair.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The altar check compared the 0.82m total height, 1.30m by 0.80m plinth, 0.90m by 0.48m body, and 3.60m room height; the existing sanctuary room and rear-axis relation were sufficient and exposed no parent defect.
@evidence settings/temple.md#coordinate-unit-convention The altar uses the reviewed Y-up metre frame and floor datum with a local plinth-centred origin.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits The settings require one broad rear-axis altar/plinth landmark rather than a socket invented by the model layer.
@evidence spaces/temple.md#room-schedule-and-direct-thresholds The altar consumes the source `sanctuary` room bounds X `-3.20..3.20m`, Z `6.00..8.40m` and its `north` observation point `(0.00,0.00,7.80)`; it does not require a new opening or socket.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions The one-altar and one-plinth identity remains inside the sanctuary role without changing room topology.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Checked the altar pair against the reviewed `sanctuary` room and its source `north` observation point `(0.00,0.00,7.80)`, not a model-invented socket.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 Checked that this H2 owns the plinth/body solids while the sanctuary room owns placement and route, and materials own response; a new room axis here would falsify the split.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 Checked `plinth` Y `0.00..0.32m`, `altar-body` Y `0.32..0.82m`, both stone surfaces, closed tops, and the no-iconography refusal; a missing support/body layer would falsify completion.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 Checked that the pair adds a reusable landmark representation to `sanctuary` without redefining the room or adding `north-rear-axis`; a new socket would falsify the boundary.
@evidenceReview principles/design/models.md#representation-contract #46718c6 Checked two connected stacked stone parts with plinth X/Z `-0.65..0.65/-0.40..0.40m` and body X/Z `-0.45..0.45/-0.24..0.24m`; a hidden gap would falsify the contract.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e Checked plinth-centred floor origin, combined X/Z `-0.65..0.65/-0.40..0.40m`, Y `0.00..0.82m`, and the source north point; mirrored or shifted placement data would falsify this frame.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b Checked front/side views for the 1.30m by 0.80m plinth and 0.90m by 0.48m body, plus top/three-quarter views for stacking and contact; a broad body would falsify the silhouette.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 Checked the broad stone plinth/smaller stone body landmark without carving, offerings, flame, or ritual iconography; those details are outside the proxy.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e Checked the 0.32m stack seam, 0.82m total height, two stable surfaces, closed contact, rigid refusal, and sanctuary handoff; an ownerless top would falsify completion.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 Checked the pair's 0.82m height, 1.30m/0.80m plinth, 0.90m/0.48m body, and 3.60m room fit against `sanctuary`; no parent defect was exposed.
@evidenceReview settings/temple.md#coordinate-unit-convention #01e5537 Checked the plinth-centred Y-up origin and combined X/Z `-0.65..0.65/-0.40..0.40m`, Y `0.00..0.82m`; using `north` as a new origin would falsify this handoff.
@evidenceReview settings/temple.md#subject-observable-identity-and-fit-out-limits #73d6425 Checked one broad plinth supporting one smaller body on the source sanctuary axis; a socket, pedestal-only, or ritual statue identity would fail the settings role.
@evidenceReview spaces/temple.md#room-schedule-and-direct-thresholds #e393909 Checked the existing sanctuary bounds X `-3.20..3.20m`, Z `6.00..8.40m` and north observation coordinate, while leaving its threshold/route source-owned; a new door would falsify the consumer relation.
@evidenceReview spaces/temple.md#spatial-identity-tolerance-and-exclusions #e055926 Checked one altar/plinth pair inside sanctuary with no second altar, room, socket, or corridor; changing the reviewed graph would falsify the spatial identity.
-->

Authority and status: `author-adopted` fixed pair for the source `sanctuary` room and its `north` observation point. The source room bounds are X `-3.20..3.20m`, Z `6.00..8.40m`, Y `0.00..3.60m`; its observation route has threshold `(0.00,0.00,6.00)`, center `(0.00,0.00,7.20)`, and north point `(0.00,0.00,7.80)`. The model local origin is the plinth centre at floor contact, with combined bounds X `-0.65..0.65m`, Z `-0.40..0.40m`, Y `0.00..0.82m`. The hierarchy is `plinth` Y `0.00..0.32m`, X `-0.65..0.65m`, Z `-0.40..0.40m`, and `altar-body` Y `0.32..0.82m`, X `-0.45..0.45m`, Z `-0.24..0.24m`. Stable surfaces are `altar-plinth-stone` and `altar-body-stone`. Both top boundaries are closed and there is no hidden void between them. Instances consume the existing `sanctuary` room and its source `north` observation point; this model does not request or invent a sanctuary socket or a new named axis.

Neutral review is front, side, top, and rear-axis three-quarter. Carving, offerings, flame, and ritual iconography are outside this proxy.

Review question: does the pair read as one broad plinth supporting one smaller body on the existing sanctuary axis?

## Roof tile prototype {#roof-tile-prototype}

<!--
@evidence principles/core/common.md#declared-basis The roof-tile unit uses the reviewed low terracotta roof profile and repeated envelope role.
@evidence principles/core/common.md#scope-preservation This unit owns one tile; roof boundaries remain space-owned, rows remain instance-owned, and finish remains material-owned.
@evidence principles/core/common.md#substantive-completion This unit closes tile body, overlap lip, underside seat, exact bounds, surfaces, and refusal boundary.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds a reusable envelope tile beyond the roof host.
@evidence principles/design/models.md#representation-contract The tile has named top, edge, and underside interfaces and no transparent or missing topology.
@evidence principles/design/models.md#spatial-convention The eave-corner origin and row/slope axes make repeated orientation deterministic.
@evidence principles/design/models.md#reviewable-structure Top, slope-side, eave, and three-quarter views expose profile, overlap, and termination.
@evidence principles/design/models.md#model-observable-style-basis The thin red terracotta unit is observable without ornament or weathering claims.
@evidence principles/design/models.md#model-scale-layer-completion The body, lip, underside, and contact relation close the repeated unit.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The tile check compared its 0.72m by 0.44m by 0.10m bounds, overlap direction, and underside contact with the reviewed low roof boundary; no parent envelope defect was exposed.
@evidence settings/temple.md#coordinate-unit-convention The tile uses the reviewed Y-up metre frame with explicit row and slope axes.
@evidence settings/temple.md#production-visual-grammar The shallow red terracotta surface is the specific roof grammar consumed by this prototype.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits The roof identity requires a repeated low-profile tile rather than a generic roof block.
@evidence spaces/temple.md#envelope-opening-and-interior-interface The tile consumes the reviewed roof underside and envelope host without creating a new roof boundary.
@evidence spaces/temple.md#surface-decomposition-and-ownership-handoff The tile's top, edge, and underside are stable model interfaces for later material binding.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Checked the tile against the reviewed low terracotta roof role and the repeated-envelope boundary; its single-unit dimensions do not become a roof mass.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 Checked that this H2 owns one tile body, lip, and underside seat while roof host, row population, placement, and material response remain downstream; a ridge or roof owner here would falsify the split.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 Checked `tile-body`, `overlap-lip`, `underside-seat`, X `0.00..0.72m`, Z `0.00..0.44m`, Y `0.00..0.10m`, and three surfaces; a hidden roof assembly would falsify completion.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 Checked that one tile adds an envelope repeat unit beyond the roof host without redefining the host boundary, eave, or ridge; a full roof mesh would falsify this distinction.
@evidenceReview principles/design/models.md#representation-contract #46718c6 Checked the shallow solid body, leading overlap lip, closed underside seat, and stable names `roof-tile-top/edge/underside`; a transparent or unowned underside would falsify the contract.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e Checked the lower-eave corner origin, X row axis, Z slope axis, Y-up frame, and occupied Z `0.00..0.44m`; reversing the overlap direction would falsify repeat orientation.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b Checked top/slope-side views for the overlap profile and eave view for the thin 0.10m slab and underside contact; a flat board with no lip would falsify readability.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 Checked the shallow red-terracotta blocking silhouette without glaze, ornament, breakage, thermal assembly, or weathering claims; those are outside this tile.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e Checked 0.72m row span, 0.44m slope span, 0.10m thickness, three part intervals/surfaces, no-roof refusal, and instance repeat handoff; a lip beyond the bounds would falsify completion.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 Checked the tile's 0.72m by 0.44m by 0.10m bounds, overlap direction, and underside contact against the reviewed roof host; no parent defect was exposed.
@evidenceReview settings/temple.md#coordinate-unit-convention #01e5537 Checked the eave-corner origin and X/Z/Y axes with bounds X `0.00..0.72m`, Z `0.00..0.44m`, Y `0.00..0.10m`; a centred floor origin would falsify row placement.
@evidenceReview settings/temple.md#production-visual-grammar #e9570a7 Checked the red terracotta tile's leading lip, top plane, and darker underside as the specific roof grammar; a generic roof block would fail this relation.
@evidenceReview settings/temple.md#subject-observable-identity-and-fit-out-limits #73d6425 Checked a repeated low-profile tile with an overlap direction and 0.44m slope span, not a roof mass or ridge; either substitution would fail the role identity.
@evidenceReview spaces/temple.md#envelope-opening-and-interior-interface #440376d Checked that the tile consumes the existing roof underside host and creates no opening, ridge, eave, or semantic boundary of its own.
@evidenceReview spaces/temple.md#surface-decomposition-and-ownership-handoff #f83187d Checked that `roof-tile-top`, `roof-tile-edge`, and `roof-tile-underside` remain three stable model hosts for later material binding; collapsing them would falsify the handoff.
-->

Authority and status: `author-adopted` repeated-envelope prototype. The local origin is the lower eave contact corner, with row axis X, slope axis Z, and Y-up. Bounds are X `0.00..0.72m`, Z `0.00..0.44m`, Y `0.00..0.10m`. The hierarchy is `tile-body`, `overlap-lip`, and `underside-seat`. Stable surfaces are `roof-tile-top`, `roof-tile-edge`, and `roof-tile-underside`; the body is a shallow solid slab, the lip is the visible leading overlap edge, and the underside seat is a closed contact boundary. This prototype does not create a roof, ridge, eave, or repeated population.

Neutral review is top, slope-side, eave, and three-quarter. Glazed ornament, broken-tile variation, thermal assembly, and hidden rafters are outside the proxy.

Review question: can repeated instances preserve the tile's overlap direction, thin profile, and top/edge/underside interfaces?

## Records table prototype {#records-table-prototype}

<!--
@evidence principles/core/common.md#declared-basis The records-table unit uses the records-room work-surface role and the reviewed 1.10m door scale.
@evidence principles/core/common.md#scope-preservation This unit owns table geometry; records-room topology, membership, placement, and wood response remain downstream.
@evidence principles/core/common.md#substantive-completion This unit closes top, four legs, contact, bounds, stable surfaces, and rigid limit.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds a single reusable work-surface representation beyond the records room.
@evidence principles/design/models.md#representation-contract The top and four supports are named connected parts with an explicit open underside.
@evidence principles/design/models.md#spatial-convention The floor-centred origin and exact 1.20m by 0.60m by 0.76m bounds establish its scale.
@evidence principles/design/models.md#reviewable-structure Front, side, top, and three-quarter views expose the work surface, legs, contact, and underside.
@evidence principles/design/models.md#model-observable-style-basis The plain civic work-table silhouette is observable without joinery or contents.
@evidence principles/design/models.md#model-scale-layer-completion The top and leg intervals close every visible table layer.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The table check compared its 1.20m by 0.60m footprint, 0.76m height, four-leg clearance, and 1.10m door comparison; the records-room route and scale were sufficient and exposed no parent defect.
@evidence settings/temple.md#coordinate-unit-convention The table's floor-centred origin expands to X `-0.60..0.60m`, Z `-0.30..0.30m`, Y `0.00..0.76m`; a non-zero floor or any bound outside that footprint falsifies this coordinate handoff.
@evidence settings/temple.md#subject-breakdown-production-scope The records-room work-surface role is a separately named fit-out subject in this population.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits The settings require a low work landmark that reads distinctly from vertical storage and closed chests.
@evidence spaces/temple.md#room-schedule-and-direct-thresholds The table is the `records-room` work surface inside source bounds X `7.40..11.40m`, Z `-0.30..2.30m`; its `1.20m × 0.60m` footprint must not intersect the source route from threshold `(7.40,0.00,1.00)` to center `(9.40,0.00,1.00)` or its `0.30m` protected band.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions The table identity is its `0.76m` top and four-leg open underside; a shelf, chest, or closed underside would falsify the records-room work-landmark handoff.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Checked the records table against the records-room work-surface role and the reviewed 1.10m door scale; its 1.20m footprint is an adopted local realization, not a room dimension.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 Checked that this H2 owns the tabletop and four legs while records-room topology, membership, placement, material response, and contents remain downstream; a chest or room edge here would falsify the split.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 Checked the top Y `0.66..0.76m`, four leg contacts Y `0.00..0.66m`, two stable surfaces, and open underside; a fifth support or filled underside would falsify completion.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 Checked that the table adds a reusable work-surface object to `records-room` without reowning the room or threshold; a records-room model would falsify this distinction.
@evidenceReview principles/design/models.md#representation-contract #46718c6 Checked top X/Z `-0.60..0.60/-0.30..0.30m`, four 0.10m square legs at X ±0.50/Z ±0.20, and `records-table-top/legs`; removing the open underside would falsify the contract.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e Checked floor-contact centre origin, bounds X `-0.60..0.60m`, Z `-0.30..0.30m`, Y `0.00..0.76m`, and four leg centres; a shifted floor datum would falsify the table coordinate handoff.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b Checked front/side views for the 0.76m top and leg separation and top/three-quarter views for the open underside; an opaque box would falsify this review.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 Checked the restrained low records work-surface silhouette without drawers, contents, joinery, or wood-grain finish; those details are outside this proxy.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e Checked the 1.20m by 0.60m top, 0.66m leg interval, four contacts, two stable surfaces, rigid refusal, and route-clearance handoff; an unsupported top would falsify completion.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 Checked the table's 1.20m by 0.60m footprint, 0.76m height, four leg contacts, and open underside against the records room; no parent defect was exposed.
@evidenceReview settings/temple.md#coordinate-unit-convention #01e5537 Checked floor-contact origin and bounds X `-0.60..0.60m`, Z `-0.30..0.30m`, Y `0.00..0.76m`; the 1.10m board supplies comparison only and is not substituted for the table extent.
@evidenceReview settings/temple.md#subject-breakdown-production-scope #34ec6da Checked the table as the records-room work-surface subject with top, legs, and underside handoff; records contents and furniture count remain instance-owned.
@evidenceReview settings/temple.md#subject-observable-identity-and-fit-out-limits #73d6425 Checked a distinct four-legged low work surface with a visible open underside; a closed chest-like mass would fail the settings identity.
@evidenceReview spaces/temple.md#room-schedule-and-direct-thresholds #e393909 Checked that the table is a fit-out consumer inside `records-room` and does not touch its direct threshold or reserved 1.20m route; an instance blocking that route would falsify the downstream handoff.
@evidenceReview spaces/temple.md#spatial-identity-tolerance-and-exclusions #e055926 Checked the records table's one work-surface role without adding a room, connector, or second storage category; those substitutions would falsify the spatial exclusion.
-->

Authority and status: `author-adopted` rigid prototype for the records room. The local origin is the floor contact centre, with bounds X `-0.60..0.60m`, Z `-0.30..0.30m`, Y `0.00..0.76m`. The top occupies X `-0.60..0.60m`, Z `-0.30..0.30m`, Y `0.66..0.76m`. Four legs occupy X centres `-0.50` and `0.50m`, Z centres `-0.20` and `0.20m`, each with `0.10m` square section and Y `0.00..0.66m`. Stable surfaces are `records-table-top` and `records-table-legs`; the underside between legs remains open. Instances own count, orientation, and route clearance.

Neutral review is front, side, top, and three-quarter beside the door scale board. Contents, drawers, joinery, and wood response are outside this proxy.

Review question: does the table read as a distinct low work surface with four supports and an open underside?

## Records shelf prototype {#records-shelf-prototype}

<!--
@evidence principles/core/common.md#declared-basis The records-shelf unit uses the records-room vertical storage role and the reviewed door/room scale anchors.
@evidence principles/core/common.md#scope-preservation This unit owns shelf geometry; placement, load, count, and wood response remain downstream.
@evidence principles/core/common.md#substantive-completion This unit closes side frames, three boards, gaps, contact, bounds, and stable surfaces.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds one reusable vertical records storage representation beyond the records room.
@evidence principles/design/models.md#representation-contract The frame and boards have exact intervals and preserve visible gaps as negative space.
@evidence principles/design/models.md#spatial-convention The floor-centred origin and 0.90m by 0.32m by 1.80m bounds establish the shelf scale.
@evidence principles/design/models.md#reviewable-structure Front, side, top, and three-quarter views expose frame rhythm, board gaps, contact, and height.
@evidence principles/design/models.md#model-observable-style-basis The plain vertical records shelf is observable without loaded contents or decorative joinery.
@evidence principles/design/models.md#model-scale-layer-completion The frame and three board intervals close the shelf's visible layers and negative spaces.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The shelf check compared its 1.80m height and three-board gaps with the 3.60m room and 1.10m door anchors; the records-room space and access limits were sufficient and exposed no parent defect.
@evidence settings/temple.md#coordinate-unit-convention The records shelf's floor origin has bounds X `-0.45..0.45m`, Z `-0.16..0.16m`, Y `0.00..1.80m`, with frames at X `-0.40` and `0.40m`; any shifted board interval or frame outside these coordinates falsifies its local placement convention.
@evidence settings/temple.md#subject-breakdown-production-scope The records-room vertical storage role is independently owned here rather than hidden in a furniture family.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits The shelf's vertical rhythm is required to read differently from the table and chest.
@evidence spaces/temple.md#room-schedule-and-direct-thresholds The records shelf fits the source `records-room` bounds X `7.40..11.40m`, Z `-0.30..2.30m` and leaves the `(7.40,0.00,1.00)` to `(9.40,0.00,1.00)` route plus its `0.30m` protected band clear.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions The records shelf is defined by three open boards at Y `0.36..0.44`, `0.86..0.94`, and `1.36..1.44m`; four boards or closed gaps would falsify this room-specific identity.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Checked the records shelf against the reviewed records-storage role and 1.80m height relation; its three board intervals are the host-specific completion fact.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 Checked that this H2 owns two side frames and three boards while room topology, scroll membership, placement, and wood response remain downstream; a storage-room host here would falsify the split.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 Checked frame Y `0.00..1.80m`, boards Y `0.36..0.44/0.86..0.94/1.36..1.44m`, two stable surfaces, and open gaps; missing a board would falsify completion.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 Checked that this three-level unit adds reusable storage geometry to `records-room` without duplicating the room or threshold; a room-scale enclosure would falsify this distinction.
@evidenceReview principles/design/models.md#representation-contract #46718c6 Checked side frames at X ±0.40m, boards spanning X `-0.40..0.40m`, Z `-0.16..0.16m`, and stable frame/board names; closed board gaps would falsify the representation.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e Checked floor-contact centre origin, bounds X `-0.45..0.45m`, Z `-0.16..0.16m`, Y `0.00..1.80m`, and ordered board levels; a 1.70m storage shelf geometry would falsify this record.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b Checked front view for three open shelf gaps and side/top views for frame depth and board span; a solid cabinet silhouette would falsify the review question.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 Checked the restrained open records shelf silhouette without scroll contents, drawers, joinery, or material-finish claims; those details remain outside this proxy.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e Checked 1.80m frame height, three board intervals, two frame contacts, two stable surfaces, open negative gaps, and placement handoff; an unbounded board would falsify completion.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 Checked the shelf's 0.90m width, 0.32m depth, 1.80m height, three board intervals, and open gaps against the records room; no parent defect was exposed.
@evidenceReview settings/temple.md#coordinate-unit-convention #01e5537 Checked floor-contact origin and bounds X `-0.45..0.45m`, Z `-0.16..0.16m`, Y `0.00..1.80m`; the room-height 3.60m marker remains comparison only.
@evidenceReview settings/temple.md#subject-breakdown-production-scope #34ec6da Checked the records-shelf subject as frames plus three named board levels, handing scroll contents and instance count downstream.
@evidenceReview settings/temple.md#subject-observable-identity-and-fit-out-limits #73d6425 Checked the three-board open-gap rhythm that distinguishes this records shelf from the four-level storage shelf; collapsing the gaps would fail identity.
@evidenceReview spaces/temple.md#room-schedule-and-direct-thresholds #e393909 Checked that this shelf stays in records-room away from the direct threshold and its 1.20m protected route; placement, not prototype geometry, owns clearance.
@evidenceReview spaces/temple.md#spatial-identity-tolerance-and-exclusions #e055926 Checked the records storage role without adding a room, wall, route, or second shelf category; a closed cabinet would falsify the reviewed spatial identity.
-->

Authority and status: `author-adopted` rigid prototype for records storage. The local origin is the floor contact centre, with bounds X `-0.45..0.45m`, Z `-0.16..0.16m`, Y `0.00..1.80m`. Two side frames are centred at X `-0.40` and `0.40m`, each `0.10m` wide, `0.10m` deep, and Y `0.00..1.80m`. Three shelf boards span X `-0.40..0.40m`, Z `-0.16..0.16m` at Y `0.36..0.44m`, `0.86..0.94m`, and `1.36..1.44m`. Stable surfaces are `records-shelf-frame-wood` and `records-shelf-board-wood`; the gaps between boards remain open negative space.

Neutral review is front, side, top, and three-quarter beside the door and room-height markers. Loaded scrolls, drawers, joinery, and material response are outside this proxy.

Review question: does the shelf's three-board rhythm remain visibly distinct and preserve open gaps from floor to top frame?

## Records chest prototype {#records-chest-prototype}

<!--
@evidence principles/core/common.md#declared-basis The records-chest unit uses the records-room low closed-storage role and the reviewed door scale.
@evidence principles/core/common.md#scope-preservation This unit owns one chest geometry; placement, quantity, contents, and wood response remain downstream.
@evidence principles/core/common.md#substantive-completion This unit closes body, lid, contact, bounds, surfaces, and rigid state.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds a low closed-storage representation beyond the records room.
@evidence principles/design/models.md#representation-contract The body and closed lid have explicit layers and named stable surfaces.
@evidence principles/design/models.md#spatial-convention The floor-centred origin and 0.80m by 0.45m by 0.55m bounds establish scale.
@evidence principles/design/models.md#reviewable-structure Front, side, top, and three-quarter views expose low mass, lid seam, and floor contact.
@evidence principles/design/models.md#model-observable-style-basis The plain closed chest silhouette is observable without hardware or contents.
@evidence principles/design/models.md#model-scale-layer-completion The body and lid intervals close the chest representation without an unowned drawer layer.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The chest check compared its 0.55m height and 0.80m by 0.45m footprint with the records-room clear box and 1.10m door scale; the parent space was sufficient and exposed no defect.
@evidence settings/temple.md#coordinate-unit-convention The records chest uses a floor-centred X `-0.40..0.40m`, Z `-0.225..0.225m`, Y `0.00..0.55m` envelope with its body/lid seam at Y `0.45m`; any alternate origin or seam falsifies this local coordinate handoff.
@evidence settings/temple.md#subject-breakdown-production-scope The records-room low closed-storage role is independently addressed rather than bundled with the table or shelf.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits The low closed volume is a required distinct records-room silhouette.
@evidence spaces/temple.md#room-schedule-and-direct-thresholds The records chest fits the source `records-room` clear bounds X `7.40..11.40m`, Z `-0.30..2.30m` and its `0.80m × 0.45m` footprint must remain outside the `(7.40,0.00,1.00)` to `(9.40,0.00,1.00)` route and protected band.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions The records chest is one `0.55m` closed body with a `0.10m` lid layer; an open box, drawer stack, or shelf silhouette would falsify the records-room low-storage role.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Checked the records chest against the low closed storage role, with body Y `0.00..0.45m` and lid Y `0.45..0.55m`; this seam is the host-specific basis.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 Checked that this H2 owns only the body/lid solid while records-room topology, contents, placement, count, and wood response remain downstream; a room container here would falsify the split.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 Checked full X/Z `-0.40..0.40/-0.225..0.225m` footprint, body/lid seam, `records-chest-body/lid`, and closed rigid refusal; adding drawers would falsify completion.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 Checked that this low chest is a reusable records object distinct from the table and shelf, without redefining records-room or a storage room.
@evidenceReview principles/design/models.md#representation-contract #46718c6 Checked one closed volume split into body and lid with two stable surfaces and no hidden drawer/cavity; merging the lid surface would falsify the contract.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e Checked floor-contact centre origin, X `-0.40..0.40m`, Z `-0.225..0.225m`, Y `0.00..0.55m`, and lid seam Y `0.45m`; a basket-sized origin would falsify the record.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b Checked front/side views for the low 0.55m mass and top view for the lid footprint, with three-quarter view exposing the seam; a tall cabinet would falsify readability.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 Checked the restrained closed records chest silhouette without drawers, hinges, hardware, contents, or wood finish; those are outside this proxy.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e Checked 0.45m body, 0.10m lid, two stable surfaces, rigid closed state, and records-room placement/count handoff; a missing lid boundary would falsify completion.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 Checked the chest's 0.80m by 0.45m footprint, 0.55m height, body/lid contact, and stable surfaces against records-room fit; no parent defect was exposed.
@evidenceReview settings/temple.md#coordinate-unit-convention #01e5537 Checked the floor-contact origin and X/Z/Y bounds `-0.40..0.40/-0.225..0.225/0.00..0.55m`; the door board is only a comparison anchor.
@evidenceReview settings/temple.md#subject-breakdown-production-scope #34ec6da Checked the records-chest subject as one closed body plus lid and handed count, contents, and placement to instances.
@evidenceReview settings/temple.md#subject-observable-identity-and-fit-out-limits #73d6425 Checked the low closed records chest as distinct from the open shelf and four-legged table; an unnamed furniture block would fail the role identity.
@evidenceReview spaces/temple.md#room-schedule-and-direct-thresholds #e393909 Checked that the chest is a records-room fit-out object whose instance must remain outside the direct threshold and 1.20m route; the prototype creates no connector.
@evidenceReview spaces/temple.md#spatial-identity-tolerance-and-exclusions #e055926 Checked one records storage volume without changing room order, direct door, route, or loop topology; a second room or cabinet wall would falsify the exclusion.
-->

Authority and status: `author-adopted` rigid prototype for records storage. The local origin is the floor contact centre, with bounds X `-0.40..0.40m`, Z `-0.225..0.225m`, Y `0.00..0.55m`. The body occupies Y `0.00..0.45m`; the lid occupies Y `0.45..0.55m`, both with the full X/Z footprint. Stable surfaces are `records-chest-body` and `records-chest-lid`. The lid is closed and rigid; drawers, hinges, contents, and hardware are outside this proxy.

Neutral review is front, side, top, and three-quarter beside the table and shelf. Instances own count and placement.

Review question: does the chest read as one low closed volume rather than as an unnamed part of another furniture prototype?

## Storage shelf prototype {#storage-shelf-prototype}

<!--
@evidence principles/core/common.md#declared-basis The storage-shelf unit uses the votive-storage-room vertical storage role and the shared room/door scale.
@evidence principles/core/common.md#scope-preservation This unit owns storage shelf geometry; stacking, placement, quantity, and finish remain downstream.
@evidence principles/core/common.md#substantive-completion This unit closes side frames, four boards, exact gaps, contact, bounds, and surfaces.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds the storage-room shelf representation beyond the room topology.
@evidence principles/design/models.md#representation-contract The frame and four shelf boards have exact intervals and stable surfaces.
@evidence principles/design/models.md#spatial-convention The floor-centred origin and 0.90m by 0.34m by 1.70m bounds establish scale.
@evidence principles/design/models.md#reviewable-structure Front, side, top, and three-quarter views expose four-board rhythm and contact.
@evidence principles/design/models.md#model-observable-style-basis The plain storage shelf is observable without loaded contents or woven detail.
@evidence principles/design/models.md#model-scale-layer-completion The four board intervals, frame, and open gaps close the prototype.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The shelf check compared its 1.70m height, four-board intervals, and 0.34m depth with the storage-room clear box and route; those parent decisions were sufficient and exposed no defect.
@evidence settings/temple.md#coordinate-unit-convention The storage shelf's floor origin has bounds X `-0.45..0.45m`, Z `-0.17..0.17m`, Y `0.00..1.70m`, and its four boards use the stated Y intervals; a three-board or shifted-frame realization falsifies this storage coordinate convention.
@evidence settings/temple.md#subject-breakdown-production-scope The storage-room shelf is an independent prototype with a distinct consumer and size.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits The four-board vertical rhythm distinguishes storage furniture from the records shelf.
@evidence spaces/temple.md#room-schedule-and-direct-thresholds The storage shelf fits source bounds X `7.40..11.40m`, Z `-5.20..-0.70m` and leaves the route from threshold `(7.40,0.00,-2.95)` to center `(9.40,0.00,-2.95)` plus its `0.30m` protected band clear.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions The storage shelf's four open boards at Y `0.35..0.43`, `0.70..0.78`, `1.05..1.13`, and `1.40..1.48m` distinguish it from the records shelf; closed gaps or three boards would falsify the storage identity.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Checked the storage shelf against the votive-storage role, using four board levels at Y `0.35..0.43`, `0.70..0.78`, `1.05..1.13`, and `1.40..1.48m`.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 Checked that this H2 owns storage frames and boards while room topology, vessel/basket contents, placement, density, and wood response remain downstream; a storage inventory here would falsify the split.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 Checked 1.70m frames, four boards, open gaps, two stable surfaces, and the no-loading refusal; removing a level or filling a gap would falsify completion.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 Checked this four-level shelf as a reusable storage object distinct from the three-level records shelf and from the votive-storage room itself.
@evidenceReview principles/design/models.md#representation-contract #46718c6 Checked side frames at X ±0.40m and boards spanning X `-0.40..0.40m`, Z `-0.17..0.17m`, with named frame/board surfaces; a cabinet back would falsify the open contract.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e Checked floor-contact centre origin, bounds X `-0.45..0.45m`, Z `-0.17..0.17m`, Y `0.00..1.70m`, and the four ordered board intervals; records-shelf dimensions would falsify this frame.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b Checked front view for four board levels and three open gaps, with side/top views exposing the frame depth and board span; a solid storage box would falsify readability.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 Checked the restrained open votive-storage shelf silhouette without contents, loading, density, joinery, or wood-finish claims.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e Checked 1.70m height, four 0.08m boards, two frame contacts, two surfaces, open negative gaps, and placement handoff; a fifth level would falsify completion.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 Checked the shelf's 0.90m width, 0.34m depth, 1.70m height, four board levels, and open gaps against votive-storage-room fit; no parent defect was exposed.
@evidenceReview settings/temple.md#coordinate-unit-convention #01e5537 Checked floor-contact origin and X `-0.45..0.45m`, Z `-0.17..0.17m`, Y `0.00..1.70m`; the 3.60m room marker remains a comparison only.
@evidenceReview settings/temple.md#subject-breakdown-production-scope #34ec6da Checked the storage-shelf subject as side frames plus four boards, handing vessels, baskets, count, and placement downstream.
@evidenceReview settings/temple.md#subject-observable-identity-and-fit-out-limits #73d6425 Checked four visible levels and the open gaps that distinguish this shelf from `records-shelf`; three levels would fail this role identity.
@evidenceReview spaces/temple.md#room-schedule-and-direct-thresholds #e393909 Checked that instances consume votive-storage-room space while preserving its direct threshold and 1.20m room route; this prototype emits no route edge.
@evidenceReview spaces/temple.md#spatial-identity-tolerance-and-exclusions #e055926 Checked one open storage shelf without adding a room, wall, connector, or duplicate basket owner; any of those would falsify the exclusion.
-->

Authority and status: `author-adopted` rigid prototype for the votive-storage room. The local origin is the floor contact centre, with bounds X `-0.45..0.45m`, Z `-0.17..0.17m`, Y `0.00..1.70m`. Side frames are centred at X `-0.40` and `0.40m`, each `0.10m` wide and deep, Y `0.00..1.70m`. Four boards span X `-0.40..0.40m`, Z `-0.17..0.17m` at Y `0.35..0.43m`, `0.70..0.78m`, `1.05..1.13m`, and `1.40..1.48m`. Stable surfaces are `storage-shelf-frame-wood` and `storage-shelf-board-wood`; all board gaps remain open.

Neutral review is front, side, top, and three-quarter beside the door scale board. Contents, loading, and storage density are outside this proxy.

Review question: does the storage shelf retain four visible levels and open gaps without being confused with the records shelf?

## Storage chest prototype {#storage-chest-prototype}

<!--
@evidence principles/core/common.md#declared-basis The storage-chest unit uses the votive-storage-room low closed-storage role and the shared door scale.
@evidence principles/core/common.md#scope-preservation This unit owns storage chest geometry; contents, stacking, placement, and finish remain downstream.
@evidence principles/core/common.md#substantive-completion This unit closes body, lid, contact, bounds, stable surfaces, and rigid state.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds a storage-room chest representation beyond room topology.
@evidence principles/design/models.md#representation-contract The body and lid are separate named layers with closed boundaries.
@evidence principles/design/models.md#spatial-convention The floor-centred origin and exact 0.78m by 0.46m by 0.55m bounds establish scale.
@evidence principles/design/models.md#reviewable-structure Front, side, top, and three-quarter views expose the low mass, lid, and floor contact.
@evidence principles/design/models.md#model-observable-style-basis The plain storage chest is observable without hardware or loaded-state claims.
@evidence principles/design/models.md#model-scale-layer-completion The body and lid intervals close the complete storage chest proxy.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The chest check compared its 0.55m height and 0.78m by 0.46m footprint with the storage-room clear box and reserved route; no parent defect was exposed.
@evidence settings/temple.md#coordinate-unit-convention The storage chest uses a floor-centred X `-0.39..0.39m`, Z `-0.23..0.23m`, Y `0.00..0.55m` envelope with its lid seam at Y `0.45m`; any alternate seam or extent falsifies this coordinate handoff.
@evidence settings/temple.md#subject-breakdown-production-scope The storage-room chest is independently addressed with its own consumer and bounds.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits The low closed storage role is distinct from shelf gaps and basket opening.
@evidence spaces/temple.md#room-schedule-and-direct-thresholds The storage chest fits the source `votive-storage-room` bounds X `7.40..11.40m`, Z `-5.20..-0.70m` and its `0.78m × 0.46m` footprint must remain outside the `(7.40,0.00,-2.95)` to `(9.40,0.00,-2.95)` route and protected band.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions The storage chest is one `0.55m` closed body with a `0.10m` lid and no alcove; an open container or room boundary would falsify the storage fit-out role.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Checked the storage chest against the votive-storage low closed-volume role, with body Y `0.00..0.45m` and lid Y `0.45..0.55m`.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 Checked that this H2 owns one body/lid geometry while votive-storage topology, contents, placement, count, and wood response remain downstream; a shelf board here would falsify the split.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 Checked full X/Z `-0.39..0.39/-0.23..0.23m` bounds, body/lid seam, two stable surfaces, and closed rigid refusal; an unbounded drawer would falsify completion.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 Checked this chest as a storage-specific reusable object distinct from records chest, storage shelf, and the room boundary.
@evidenceReview principles/design/models.md#representation-contract #46718c6 Checked one closed body with a separate lid surface `storage-chest-lid` over `storage-chest-body`, with no drawer or hidden cavity.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e Checked floor-contact centre origin, X `-0.39..0.39m`, Z `-0.23..0.23m`, Y `0.00..0.55m`, and lid seam Y `0.45m`; a records-chest envelope would falsify this frame.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b Checked front/side views for the 0.55m low mass and top/three-quarter views for the lid boundary; a tall cabinet silhouette would falsify readability.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 Checked the restrained closed storage chest silhouette without contents, drawers, hardware, loading state, or wood finish.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e Checked 0.45m body, 0.10m lid, two stable surfaces, closed rigid limit, and storage-room placement/count handoff; a missing lid seam would falsify completion.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 Checked the chest's 0.78m by 0.46m footprint, 0.55m height, body/lid contact, and storage-room fit; no parent defect was exposed.
@evidenceReview settings/temple.md#coordinate-unit-convention #01e5537 Checked floor-contact origin and bounds X `-0.39..0.39m`, Z `-0.23..0.23m`, Y `0.00..0.55m`; the door board is comparison only.
@evidenceReview settings/temple.md#subject-breakdown-production-scope #34ec6da Checked the storage-chest subject as one closed body plus lid, handing contents, count, and placement to instances.
@evidenceReview settings/temple.md#subject-observable-identity-and-fit-out-limits #73d6425 Checked the low storage chest as distinct from the open four-level shelf and tapered basket; a generic box would fail the identity anchor.
@evidenceReview spaces/temple.md#room-schedule-and-direct-thresholds #e393909 Checked that instances must keep this chest away from votive-storage direct threshold and 1.20m room route; the prototype adds no connector.
@evidenceReview spaces/temple.md#spatial-identity-tolerance-and-exclusions #e055926 Checked one storage chest without changing room order, route, direct door, or loop topology; a cabinet wall would falsify the exclusion.
-->

Authority and status: `author-adopted` rigid prototype for the votive-storage room. The local origin is the floor contact centre, with bounds X `-0.39..0.39m`, Z `-0.23..0.23m`, Y `0.00..0.55m`. The body occupies Y `0.00..0.45m`; the lid occupies Y `0.45..0.55m`. Stable surfaces are `storage-chest-body` and `storage-chest-lid`. The lid remains closed and rigid; contents, drawers, hardware, and loading state are outside this proxy.

Neutral review is front, side, top, and three-quarter beside the storage shelf and basket. Instances own count and placement.

Review question: does the chest read as one low closed storage mass with a stable lid boundary?

## Storage basket prototype {#storage-basket-prototype}

<!--
@evidence principles/core/common.md#declared-basis The storage-basket unit uses the storage-room open-rim container role and the shared small-prop scale.
@evidence principles/core/common.md#scope-preservation This unit is the sole canonical owner of storage-basket geometry; contents, placement, count, and fiber response remain downstream.
@evidence principles/core/common.md#substantive-completion This unit closes body taper, rim opening, handle, contact, exact bounds, and stable surfaces.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds one reusable open container representation beyond the room topology.
@evidence principles/design/models.md#representation-contract The tapered body, open rim, and handle have named parts and a preserved negative cavity.
@evidence principles/design/models.md#spatial-convention The floor-centred origin and 0.42m diameter/0.48m height anchors make the basket comparable.
@evidence principles/design/models.md#reviewable-structure Top and three-quarter views expose the open rim, handle, taper, and contact.
@evidence principles/design/models.md#model-observable-style-basis The basket role is observable without individual weave strands or loaded contents.
@evidence principles/design/models.md#model-scale-layer-completion The body, rim, handle, cavity, and bounds close the only canonical basket representation.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The basket check compared its 0.42m footprint, 0.48m height, open cavity, and route clearance with the storage-room clear box; the parent space was sufficient and exposed no defect.
@evidence settings/temple.md#coordinate-unit-convention The canonical basket uses a contact-centred X/Z `-0.21..0.21m`, Y `0.00..0.48m` envelope, with its open rim at Y `0.40..0.44m`; a closed top or competing local extent falsifies this coordinate convention.
@evidence settings/temple.md#subject-breakdown-production-scope The storage-basket is independently owned here with one named consumer and one stable boundary.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits The open-rim basket is a distinct small storage role rather than a duplicate ceramic or furniture owner.
@evidence spaces/temple.md#room-schedule-and-direct-thresholds The basket fits the source `votive-storage-room` bounds X `7.40..11.40m`, Z `-5.20..-0.70m`; its `0.42m` footprint must stay outside the `(7.40,0.00,-2.95)` to `(9.40,0.00,-2.95)` route and `0.30m` protected band.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions The basket identity is its tapered `0.18m` to `0.21m` body, inner rim radius `0.16m`, and open cavity with handle; a closed cylinder, woven duplicate, or second owner would falsify the storage identity.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Checked the sole `storage-basket` owner against the votive-storage contact convention and its distinctive tapered cavity, rather than the ceramic-vessel role.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 Checked that this H2 owns basket base/body/rim/handle geometry while storage placement, shelf membership, contents, and fiber response remain downstream; a second basket owner would falsify the split.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 Checked four parts, three stable surfaces, Y `0.00..0.48m`, tapered radii `0.18→0.21m`, handle, and open interior; a solid fill would falsify completion.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 Checked this basket as a reusable open storage object distinct from both storage chest and ceramic vessel; the latter explicitly does not define a basket.
@evidenceReview principles/design/models.md#representation-contract #46718c6 Checked base/body/rim/handle, inner radius `0.16m`, open cavity above Y `0.40m`, and `storage-basket-fiber/rim/handle`; closing the cavity would falsify the contract.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e Checked floor-or-shelf contact origin, X/Z `-0.21..0.21m`, Y `0.00..0.48m`, and the handle's Z `-0.04..0.04m`; a ceramic-sized envelope would falsify this frame.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b Checked front/side views for the 0.32m tapered body and handle rise, top view for the 0.16m cavity, and three-quarter view for the rim; an opaque pot would falsify readability.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 Checked the restrained fiber basket silhouette without weaving strands, contents, wetness, or deformation claims; those details are outside this proxy.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e Checked base/body/rim/handle intervals, cavity, three surfaces, sole-owner rule, rigid refusal, and shelf/ground handoff; missing the handle would falsify completion.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 Checked the basket's 0.42m outer span, 0.48m height, tapered body, 0.16m cavity, and contact against storage fit; no parent defect was exposed.
@evidenceReview settings/temple.md#coordinate-unit-convention #01e5537 Checked contact-centre origin and X/Z `-0.21..0.21m`, Y `0.00..0.48m`; the `0.48m` height is a basket-specific anchor, not a room coordinate.
@evidenceReview settings/temple.md#subject-breakdown-production-scope #34ec6da Checked the basket subject as the only four-part open storage vessel and handed shelf/ground contact, membership, count, and contents downstream.
@evidenceReview settings/temple.md#subject-observable-identity-and-fit-out-limits #73d6425 Checked the tapered open cavity and handle as the basket identity; a cylindrical closed chest or ceramic neck would fail this role.
@evidenceReview spaces/temple.md#room-schedule-and-direct-thresholds #e393909 Checked that basket instances consume votive-storage room space while preserving its direct threshold, route, and protected band; the prototype emits no access edge.
@evidenceReview spaces/temple.md#spatial-identity-tolerance-and-exclusions #e055926 Checked one canonical basket geometry without a new room, wall, route, or competing basket owner; any duplicate name would falsify the exclusion.
-->

Authority and status: `author-adopted` and sole canonical prototype for `storage-basket`. The local origin is the floor or shelf contact centre, with bounds X/Z `-0.21..0.21m`, Y `0.00..0.48m`. The hierarchy is `basket-base` Y `0.00..0.08m`, outer radius `0.18m`; tapered `basket-body` Y `0.08..0.40m`, radius `0.18m` at its foot and `0.21m` at its rim; `basket-rim` Y `0.40..0.44m`, outer radius `0.21m`, inner radius `0.16m`; and `basket-handle` within X `-0.18..0.18m`, Z `-0.04..0.04m`, Y `0.40..0.48m`. Stable surfaces are `storage-basket-fiber`, `storage-basket-rim`, and `storage-basket-handle`. The interior X/Z `-0.16..0.16m` above Y `0.40m` is one open negative cavity. This H2 is the only owner of the `storage-basket` name; the ceramic-vessel H2 does not define a basket.

Neutral review is front, side, top, and three-quarter beside the storage shelf and door scale board. Weaving strands, contents, wetness, and deformation are outside this proxy.

Review question: does the basket retain one open tapered cavity and handle silhouette with no competing owner?

## Votive display prototype {#votive-display-prototype}

<!--
@evidence principles/core/common.md#declared-basis The votive-display unit uses the communal-votive-room public offering role and the shared door scale.
@evidence principles/core/common.md#scope-preservation This unit owns display geometry; vessel membership, placement, quantity, and materials remain downstream.
@evidence principles/core/common.md#substantive-completion This unit closes plinth, board, ledge, recess, bounds, contact, and omitted iconography.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds one reusable public display representation beyond the communal room topology.
@evidence principles/design/models.md#representation-contract The plinth, upright board, ledge, and recess have named boundaries and one stable surface partition.
@evidence principles/design/models.md#spatial-convention The floor-centred origin and exact display extents establish a small-room scale.
@evidence principles/design/models.md#reviewable-structure Front, side, top, and three-quarter views expose low plinth, upright board, ledge, recess, and contact.
@evidence principles/design/models.md#model-observable-style-basis The civic offering display is observable without precious contents or iconography.
@evidence principles/design/models.md#model-scale-layer-completion The display layers and recessed negative space close the blocking representation.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The display check compared its 1.30m width, 1.40m height, ledge, recess, and protected room route with the communal-votive room; the parent boundary was sufficient and exposed no defect.
@evidence settings/temple.md#coordinate-unit-convention The display's floor-contact origin has bounds X `-0.65..0.65m`, Z `-0.20..0.20m`, Y `0.00..1.40m`, with its board beginning at Y `0.20m`; a generic block or shifted ledge falsifies this coordinate handoff.
@evidence settings/temple.md#subject-breakdown-production-scope The communal-votive display is a separately named fit-out subject.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits The low public offering display must read as a display without claiming its vessel population.
@evidence spaces/temple.md#room-schedule-and-direct-thresholds The display consumes the communal-votive room clear box and preserves its room-side route.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions The display preserves the communal offering role and does not own vessel count or density.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Checked the display against the communal-votive fixture role, including its 1.40m board height and explicit recessed field rather than a generic shelf.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 Checked that this H2 owns plinth, board, ledge, and recess boundary while communal-votive topology, vessel membership, placement, contents, and stone response remain downstream.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 Checked `display-plinth`, `display-board`, `display-ledge`, the open field X `-0.42..0.42m`/Y `0.80..1.22m`, three surfaces, and rigid refusal; filling the field would falsify completion.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 Checked that the display adds a reusable offering fixture beyond the communal-votive room without defining vessel population or a new wall.
@evidenceReview principles/design/models.md#representation-contract #46718c6 Checked board X `-0.55..0.55m`, ledge X `-0.58..0.58m`, and the actual open recessed boundary Z `-0.09..-0.02m`; a solid box named recess would falsify the contract.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e Checked floor-contact centre origin, X `-0.65..0.65m`, Z `-0.20..0.20m`, Y `0.00..1.40m`, and the recessed field coordinates; a filled or shifted field would falsify this frame.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b Checked front view for plinth/board/ledge and the visible empty field, with side/top/three-quarter views exposing ledge depth and recess; a flat board would falsify reviewability.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 Checked the restrained stone civic display silhouette without precious materials, iconography, offerings, or display population.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e Checked 0.20m plinth, 1.40m board, 0.10m ledge band, open recess, three surfaces, rigid refusal, and communal-votive placement handoff.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 Checked the display's 1.30m by 0.40m footprint, 1.40m height, ledge, and empty recessed field against communal-votive fit; no parent defect was exposed.
@evidenceReview settings/temple.md#coordinate-unit-convention #01e5537 Checked floor-contact origin and X `-0.65..0.65m`, Z `-0.20..0.20m`, Y `0.00..1.40m`, including recess X/Z/Y bounds; a room-sized board would falsify this relation.
@evidenceReview settings/temple.md#subject-breakdown-production-scope #34ec6da Checked the display subject as plinth, board, ledge, and empty field, handing contents and instance membership downstream.
@evidenceReview settings/temple.md#subject-observable-identity-and-fit-out-limits #73d6425 Checked the low offering fixture identity through its upright board, projecting ledge, and visible recessed field; a solid cabinet would fail it.
@evidenceReview spaces/temple.md#room-schedule-and-direct-thresholds #e393909 Checked that the fixture is a communal-votive fit-out object kept clear of the direct threshold and 1.20m room route by instances; no connector is emitted here.
@evidenceReview spaces/temple.md#spatial-identity-tolerance-and-exclusions #e055926 Checked one display fixture with one empty recess and no added room, route, wall, or vessel population; filling the recess would falsify the spatial exclusion.
-->

Authority and status: `author-adopted` rigid display prototype for the communal-votive room. The local origin is the floor contact centre, with bounds X `-0.65..0.65m`, Z `-0.20..0.20m`, Y `0.00..1.40m`. The hierarchy is `display-plinth` X `-0.65..0.65m`, Z `-0.20..0.20m`, Y `0.00..0.20m`; `display-board` X `-0.55..0.55m`, Z `-0.08..0.08m`, Y `0.20..1.40m`; and `display-ledge` X `-0.58..0.58m`, Z `-0.20..0.02m`, Y `0.62..0.72m`. A recessed field X `-0.42..0.42m`, Z `-0.09..-0.02m`, Y `0.80..1.22m` is a visible negative boundary. Stable surfaces are `display-plinth-stone`, `display-board-stone`, and `display-ledge-stone`; the display is rigid and does not own vessel membership.

Neutral review is front, side, top, and three-quarter beside the door scale board. Precious materials, iconography, offering contents, and display population are outside this proxy.

Review question: does the display read as a low civic offering fixture with an upright board, ledge, and visible recess?

## Ceramic vessel prototype {#ceramic-vessel-prototype}

<!--
@evidence principles/core/common.md#declared-basis The ceramic-vessel unit uses the communal display small-prop role and the reviewed door-relative scale.
@evidence principles/core/common.md#scope-preservation This unit owns only the ceramic vessel; display membership, quantity, placement, and material response remain downstream.
@evidence principles/core/common.md#substantive-completion This unit closes foot, body, neck, rim, open top, exact bounds, and stable surfaces.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds a reusable vessel representation beyond the display topology.
@evidence principles/design/models.md#representation-contract The foot-body-neck-rim hierarchy has named surfaces and a real open negative cavity.
@evidence principles/design/models.md#spatial-convention The floor or shelf contact origin and 0.32m diameter/0.34m height anchors establish scale.
@evidence principles/design/models.md#reviewable-structure Top and three-quarter views expose the foot, body, shoulder, neck, rim, and open top.
@evidence principles/design/models.md#model-observable-style-basis The ceramic vessel role is observable without painted iconography or liquid contents.
@evidence principles/design/models.md#model-scale-layer-completion The four vertical layers and open top close the vessel proxy.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The vessel check compared its 0.32m diameter, 0.34m height, open top, and shelf/display contact with the room fit-out boundaries; no parent defect was exposed.
@evidence settings/temple.md#coordinate-unit-convention The vessel uses the reviewed Y-up metre frame and an explicit contact-centred origin.
@evidence settings/temple.md#subject-breakdown-production-scope The ceramic vessel is independently named from its display consumer and from the canonical storage basket.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits The open-rim ceramic prop is a required small offering silhouette.
@evidence spaces/temple.md#room-schedule-and-direct-thresholds The vessel consumes communal display or storage shelf contact regions without changing room routes.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions The vessel preserves the offering-prop role and leaves population density to instances.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Checked the ceramic vessel against the small open-rim votive object role, with separate foot, body, neck, and rim intervals.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 Checked that this H2 owns vessel geometry while storage/display membership, placement, ceramic response, and the separate basket owner remain downstream.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 Checked `vessel-foot`, `vessel-body`, `vessel-neck`, `vessel-rim`, open top, three stable surfaces, and Y `0.00..0.34m`; merging neck into rim would falsify completion.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 Checked this vessel as a reusable votive object distinct from the canonical tapered `storage-basket`; the ceramic H2 explicitly does not define that basket.
@evidenceReview principles/design/models.md#representation-contract #46718c6 Checked foot radius `0.10m`, body radius `0.16m`, neck radius `0.10m`, rim outer/inner radii `0.13/0.10m`, and open top; a closed lid would falsify the contract.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e Checked floor-or-shelf contact origin, X/Z `-0.16..0.16m`, and Y seams `0.04/0.26/0.31/0.34m`; a missing neck interval would falsify this frame.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b Checked top/three-quarter views for the open rim and neck step, with side view exposing foot/body/neck/rim proportions; a basket-like handle would falsify readability.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 Checked the restrained ceramic silhouette without painted decoration, contents, wetness, firing process, or basket weaving.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e Checked four vertical parts, 0.34m height, three stable surfaces, open top, basket refusal, and shelf/display handoff; an unaddressable neck would falsify completion.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 Checked the vessel's 0.32m span, 0.34m height, four part intervals, open rim, and contact against the reviewed storage/display interfaces; no parent defect was exposed.
@evidenceReview settings/temple.md#coordinate-unit-convention #01e5537 Checked contact-centre origin, X/Z `-0.16..0.16m`, Y `0.00..0.34m`, and neck Y `0.26..0.31m`; the basket's 0.48m height is not silently inherited.
@evidenceReview settings/temple.md#subject-breakdown-production-scope #34ec6da Checked the ceramic-vessel subject as four named stacked parts and handed contents, membership, count, and placement to instances.
@evidenceReview settings/temple.md#subject-observable-identity-and-fit-out-limits #73d6425 Checked the open-rim foot/body/neck/rim silhouette, distinct from the storage basket and display board; absorbing neck into rim would fail the identity.
@evidenceReview spaces/temple.md#room-schedule-and-direct-thresholds #e393909 Checked that vessel instances consume communal-votive or votive-storage room space while preserving direct thresholds and 1.20m routes; no access edge belongs here.
@evidenceReview spaces/temple.md#spatial-identity-tolerance-and-exclusions #e055926 Checked one small open ceramic role without adding room, route, wall, handle, or basket owner; any duplicate basket definition would falsify the exclusion.
-->

Authority and status: `author-adopted` rigid prototype for `ceramic-vessel`. The local origin is the floor or shelf contact centre, with bounds X/Z `-0.16..0.16m`, Y `0.00..0.34m`. The hierarchy is `vessel-foot` Y `0.00..0.04m`, radius `0.10m`; `vessel-body` Y `0.04..0.26m`, radius `0.16m`; `vessel-neck` Y `0.26..0.31m`, radius `0.10m`; and `vessel-rim` Y `0.31..0.34m`, outer radius `0.13m`, inner radius `0.10m`. Stable surfaces are `ceramic-foot`, `ceramic-body`, and `ceramic-rim`. The top is open negative space above the inner radius. This prototype does not define `storage-basket`; that name and geometry belong only to `storage-basket-prototype`.

Neutral review is top and three-quarter beside the display and door scale board. Painted decoration, contents, wetness, and firing process are outside this proxy.

Review question: does the vessel read as a small open-rim ceramic object without colliding with the canonical basket owner?

## Lamp prototype {#lamp-prototype}

<!--
@evidence principles/core/common.md#declared-basis The lamp unit uses the restrained small vertical accent role and the shared basket/door scale anchors.
@evidence principles/core/common.md#scope-preservation This unit owns lamp geometry; mount placement, count, light response, and materials remain downstream.
@evidence principles/core/common.md#substantive-completion This unit closes one origin, mount offset convention, base, stem, shade, underside, bounds, and surfaces.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds one reusable lamp representation beyond room topology.
@evidence principles/design/models.md#representation-contract The three rigid parts and open shade underside have exact bounds and stable names.
@evidence principles/design/models.md#spatial-convention The floor-contact origin and separate mounting offset remove the former origin alternative.
@evidence principles/design/models.md#reviewable-structure Side and three-quarter views expose base, stem, shade, underside, and contact.
@evidence principles/design/models.md#model-observable-style-basis The small metal lamp silhouette is observable without emitted-light, flame, or smoke claims.
@evidence principles/design/models.md#model-scale-layer-completion The base, stem, shade, mount convention, and bounds close the lamp proxy.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The lamp check compared its 0.20m base, 0.42m total height, 0.18m shade, and floor/mount contact cases with the room fit-out scale; the parent settings and spaces were sufficient and exposed no defect.
@evidence settings/temple.md#coordinate-unit-convention The lamp now has one floor-contact local origin in the reviewed Y-up metre frame; wall mounting is a downstream offset.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits The restrained lamp is a small vertical accent whose identity must remain separate from room lighting behavior.
@evidence spaces/temple.md#room-schedule-and-direct-thresholds The lamp's `0.20m` base and `0.42m` height can use a floor or explicit mount offset inside a reviewed room clear box, but any placement intersecting that room's source threshold-to-center route or `0.30m` protected band falsifies the contact handoff.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions The lamp preserves the limited accent population and does not redefine a room or loop.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Checked the lamp against the small rigid civic-light role, using one floor-contact datum even when an instance later adds a wall/shelf offset.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 Checked that this H2 owns base, stem, and shade geometry while mounting offset, light intensity, material response, placement, and occupancy remain downstream.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 Checked `lamp-base`, `lamp-stem`, `lamp-shade`, Y `0.00..0.42m`, the open underside, three surfaces, and no-flame/no-articulation refusal.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 Checked the lamp as a reusable fit-out object distinct from the door, vessel, and basket, with no wall or shelf topology added by the prototype.
@evidenceReview principles/design/models.md#representation-contract #46718c6 Checked base diameter `0.20m`, stem diameter `0.06m`, shade diameter `0.18m`, open underside at Y `0.30m`, and `lamp-base/stem/shade` surfaces.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e Checked the single floor-contact centre origin, X/Z `-0.10..0.10m`, Y intervals `0.00..0.08/0.08..0.30/0.30..0.42m`; a mounting origin would falsify the prototype frame.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b Checked side view for the three stacked parts and shade underside, and three-quarter view for the narrow stem; a hanging-only view would falsify reviewability.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 Checked the restrained metal lamp silhouette without flame, emissive lighting, smoke, or hanging articulation claims.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e Checked three Y intervals, one origin, open shade underside, three stable surfaces, mounting-offset refusal, and instance handoff; a second origin would falsify completion.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 Checked the lamp's 0.20m base, 0.42m height, part contacts, shade opening, and room fit against the reviewed storage/display interfaces; no parent defect was exposed.
@evidenceReview settings/temple.md#coordinate-unit-convention #01e5537 Checked the floor-contact centre origin and X/Z `-0.10..0.10m`, Y `0.00..0.42m`; wall/shelf mounting remains an explicit instance offset, not a second coordinate convention.
@evidenceReview settings/temple.md#subject-observable-identity-and-fit-out-limits #73d6425 Checked the base-stem-shade lamp identity beside the 0.48m basket and 1.10m door board; a flame or hanging fixture would exceed it.
@evidenceReview spaces/temple.md#room-schedule-and-direct-thresholds #e393909 Checked that lamp placement must stay clear of room thresholds and 1.20m routes even though the prototype itself emits no route connector.
@evidenceReview spaces/temple.md#spatial-identity-tolerance-and-exclusions #e055926 Checked one lamp geometry with one origin and no added room, route, socket, light system, or hanging topology; any of those would falsify the exclusion.
-->

Authority and status: `author-adopted` rigid prototype with one canonical local origin: floor contact centre at Y `0.00`. Occupied bounds are X/Z `-0.10..0.10m`, Y `0.00..0.42m`. The hierarchy is `lamp-base` Y `0.00..0.08m`, diameter `0.20m`; `lamp-stem` Y `0.08..0.30m`, diameter `0.06m`; and `lamp-shade` Y `0.30..0.42m`, diameter `0.18m`, with an open underside at Y `0.30m`. Stable surfaces are `lamp-base`, `lamp-stem`, and `lamp-shade`. A wall or shelf mounting case adds an explicit instance transform offset from the same floor-contact datum; it does not create a second model origin. There is no flame, emissive response, smoke, or hanging articulation.

Neutral review is side and three-quarter beside the `0.48m` basket and `1.10m` door scale board. Light intensity and colour are material/system decisions.

Review question: does the lamp retain one comparable base-stem-shade silhouette under either placement offset without offering two local-origin conventions?

## Bench prototype {#bench-prototype}

<!--
@evidence principles/core/common.md#declared-basis The bench unit uses the reviewed low civic seat role and the 2.00m loop scale.
@evidence principles/core/common.md#scope-preservation This unit owns seat, legs, and rail geometry; count, orientation, placement, route clearance, and finish remain downstream.
@evidence principles/core/common.md#substantive-completion This unit closes seat, four leg bounds, back rail, contact, underside negative space, and stable surfaces.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds a reusable seat representation beyond the colonnade space.
@evidence principles/design/models.md#representation-contract The seat, four supports, and rail have named parts, exact bounds, and open underside.
@evidence principles/design/models.md#spatial-convention The floor-centred origin and exact seat/leg/rail intervals establish scale.
@evidence principles/design/models.md#reviewable-structure Front, side, top, and three-quarter views expose seat, supports, rail, contact, and route side.
@evidence principles/design/models.md#model-observable-style-basis The plain low civic bench is observable without cushions or occupancy claims.
@evidence principles/design/models.md#model-scale-layer-completion The support and rail geometry completes the review-critical silhouette promised by this prototype.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work The bench check compared its 1.40m seat, four support positions, 0.48m rail height, and underside clearance with the 2.00m loop and route; the parent space was sufficient and exposed no defect.
@evidence settings/temple.md#coordinate-unit-convention The bench's floor-centred bounds are X `-0.70..0.70m`, Z `-0.24..0.24m`, Y `0.00..0.48m`, with leg centres at X `-0.55/0.55m` and Z `-0.14/0.14m`; any missing support or shifted rail falsifies this coordinate handoff.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits The low civic seat and its restrained rail are the specific bench identity required by the settings.
@evidence spaces/temple.md#courtyard-and-continuous-colonnade-loop The bench consumes the colonnade role while instances keep the 2.00m loop and 1.20m clear route free.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions The bench preserves the loop fit-out role through its `1.40m` seat, four `0.10m` supports, shallow rail, and open underside; filling the underside or exceeding the route handoff would falsify the loop identity even though count and placement remain instance-owned.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Checked the bench against the low civic seat role and the reviewed 2.00m loop/1.20m route anchors; its 0.48m top is a local fit-out dimension.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 Checked that this H2 owns seat, four legs, and back rail while loop topology, instance placement, occupancy, and wood response remain downstream; route ownership here would falsify the split.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 Checked seat Y `0.30..0.42m`, four 0.10m legs Y `0.00..0.30m`, back rail Y `0.38..0.48m`, three stable surfaces, and open underside.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 Checked the bench as reusable seating geometry distinct from the loop space and from table/chest prototypes; it does not redraw circulation.
@evidenceReview principles/design/models.md#representation-contract #46718c6 Checked seat X/Z `-0.70..0.70/-0.24..0.24m`, four leg centres X ±0.55/Z ±0.14, rail X `-0.60..0.60m`/Z `0.14..0.24m`, and named surfaces.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e Checked floor-contact centre origin, bounds X `-0.70..0.70m`, Z `-0.24..0.24m`, Y `0.00..0.48m`, and open underside; a bench-height route would falsify the frame.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b Checked front view for four supports and back rail, side view for the 0.48m rise, top view for seat footprint, and three-quarter view for underside openness.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 Checked the restrained low wood civic seat silhouette without cushions, occupancy, grain, weathering, or seating simulation.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e Checked seat/legs/rail intervals, four leg contacts, open underside, three stable surfaces, rigid refusal, and route-clearance handoff; missing rail bounds would falsify completion.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 Checked the bench's 1.40m by 0.48m footprint, 0.48m height, four supports, rail contact, and loop fit; no parent defect was exposed.
@evidenceReview settings/temple.md#coordinate-unit-convention #01e5537 Checked the floor-contact centre origin and X/Z `-0.70..0.70/-0.24..0.24m`, Y `0.00..0.48m`; the loop route remains a downstream clearance constraint.
@evidenceReview settings/temple.md#subject-observable-identity-and-fit-out-limits #73d6425 Checked the low seat identity through four visible supports, shallow back rail, and open underside; a solid chest or platform would fail it.
@evidenceReview spaces/temple.md#courtyard-and-continuous-colonnade-loop #e160d55 Checked that instances preserve the compiled 2.00m loop and 1.20m clear route around this 1.40m seat footprint; encroachment would falsify the handoff.
@evidenceReview spaces/temple.md#spatial-identity-tolerance-and-exclusions #e055926 Checked one rigid bench without adding a room, wall, route edge, or loop change; filling the underside or moving topology here would falsify the exclusion.
-->

Authority and status: `author-adopted` rigid bench prototype. The local origin is the floor contact centre, with bounds X `-0.70..0.70m`, Z `-0.24..0.24m`, Y `0.00..0.48m`. The seat occupies X `-0.70..0.70m`, Z `-0.24..0.24m`, Y `0.30..0.42m`. Four legs are square `0.10m` sections, each Y `0.00..0.30m`, centred at X `-0.55` and `0.55m`, Z `-0.14` and `0.14m`; their underside remains open negative space. The back rail occupies X `-0.60..0.60m`, Z `0.14..0.24m`, Y `0.38..0.48m`. Stable surfaces are `bench-seat`, `bench-legs`, and `bench-back-rail`. Instances must keep the compiled `2.00m` loop route and its `1.20m` clear handoff free.

Neutral review is front, side, top, and three-quarter against the loop route board. Cushions, occupancy, wood grain, and weathering are outside this proxy.

Review question: does the bench read as a low civic seat with four visible supports, a shallow back rail, and an open underside while leaving route clearance to instances?
