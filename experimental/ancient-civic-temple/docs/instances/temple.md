# Civic temple instance populations

This document owns repeated membership, stable instance identity, transforms, bounded variation, and placement validity for the reviewed model prototypes. Prototype geometry remains in `docs/models/temple-fit-out.md`, spatial boundaries and reserved routes remain in `docs/spaces/temple.md`, and renderer response remains in `docs/materials/temple.md`.

## Column population {#column-population}

@evidence principles/design/instances.md#instance-prototype-boundary The population reuses `column-prototype` for every porch member; only placement and the declared stone-tone variation may differ, so a silhouette change returns to the model owner.
@evidence principles/design/instances.md#instance-derivation-authority Column IDs `column/south/00..07`, `column/north/00..07`, `column/west/00..03`, and `column/east/00..03` derive from the ordered perimeter cells and fixed 2.00m spacing, not traversal order.
@evidence principles/design/instances.md#instance-verification-address The worst cases are the four inside corners and the two columns nearest the south entry, where the 0.30m protected route band must remain clear.
@evidence obligations/design/instances.md#instance-prototype-membership The complete set is 24 instances of `column-prototype`, with membership determined by the four reviewed colonnade sides and no columns inside rooms or the courtyard.
@evidence obligations/design/instances.md#instance-identity-transform Each member uses its stable perimeter ID, floor contact origin, Y-up transform, zero rotation on north/south runs, and quarter-turn rotation on west/east runs.
@evidence obligations/design/instances.md#instance-placement-review The source must refuse a column whose footprint enters a room threshold, observation reservation, or the courtyard basin clearance.

Authority and status: `author-adopted` instance population derived from the reviewed loop. The four side sequences use 24 members, each with the reviewed column prototype, floor contact at Y `0.00m`, and a fixed seed `temple-columns-v1`. The population has no hero override, LOD tier, motion, or independent geometry.

## Roof tile population {#roof-tile-population}

@evidence principles/design/instances.md#instance-prototype-boundary Every member reuses `roof-tile-prototype`; row overlap and bounded terracotta tone variation do not change the tile silhouette or its three stable surfaces.
@evidence principles/design/instances.md#instance-derivation-authority Row IDs derive from roof host, slope side, row index, and tile index in the reviewed roof bounds; the source never derives identity from array position after filtering.
@evidence principles/design/instances.md#instance-verification-address The eave, ridge-adjacent row, and each roof-corner tile are the review samples because overlap direction and underside contact can fail there first.
@evidence obligations/design/instances.md#instance-prototype-membership Membership covers only the repeated low roof cover over the reviewed roof host, including the fixed ridge and edge subsets, and contains no wall, beam, or roof-mass prototype.
@evidence obligations/design/instances.md#instance-identity-transform Each tile receives a stable row/tile ID, a deterministic transform from the roof slope axes, and the fixed seed `temple-roof-v1`.
@evidence obligations/design/instances.md#instance-placement-review The population must refuse a tile outside the roof host, with a reversed overlap direction, or without underside contact; it must preserve the host opening and edge limits.

Authority and status: `author-adopted` repeated-envelope population. Rows are derived from the reviewed roof extent and the prototype span `0.72m`; the last tile in each row is a bounded edge member rather than a silently scaled replacement. Variation is limited to the material family value declared by `materials`; broken, glazed, or ornamental tiles are outside scope.

## Door population {#door-population}

@evidence principles/design/instances.md#instance-prototype-boundary All seven members reuse `door-prototype`; a state or material change cannot alter the reviewed rectangular frame and leaf silhouette.
@evidence principles/design/instances.md#instance-derivation-authority IDs derive from the seven reviewed opening IDs, and each transform is read from its opening host rather than inferred from room traversal.
@evidence principles/design/instances.md#instance-verification-address The south entrance and the three east-room doors are the representative set because the entry apron, shared separator faces, and direct thresholds test opposite host conditions.
@evidence obligations/design/instances.md#instance-prototype-membership Membership is exactly `opening/south-entrance`, `opening/sanctuary-door`, `opening/communal-door`, `opening/administration-door`, `opening/records-door`, `opening/votive-storage-door`, and `opening/service-gate`.
@evidence obligations/design/instances.md#instance-identity-transform Each ID is `door/<opening-id>`, uses the host opening centre and normal, keeps the leaf at the reviewed frame depth, and has seed `temple-doors-v1`.
@evidence obligations/design/instances.md#instance-placement-review A member is refused if its frame does not bind to exactly one reviewed opening or if its occupied leaf/frame bounds cover the 1.20m room route after the explicit 1.10m door transition.

Authority and status: `author-adopted` fixed population. Doors have no per-member geometry variation, hero override, or animation. The service gate remains a terminal access member and cannot create a loop edge.

## Altar and plinth population {#altar-and-plinth-population}

@evidence principles/design/instances.md#instance-prototype-boundary The single member reuses `altar-and-plinth-prototype`; no instance override changes its two-part landmark silhouette.
@evidence principles/design/instances.md#instance-derivation-authority `altar/sanctuary` is derived from the reviewed `sanctuary` room and its `north` observation point, with no model-invented socket or second axis.
@evidence principles/design/instances.md#instance-verification-address The north-facing sanctuary observation is the representative review because the altar must remain a centered rear landmark while leaving the route to the cardinal points clear.
@evidence obligations/design/instances.md#instance-prototype-membership The complete set contains one member of `altar-and-plinth-prototype` in `sanctuary`.
@evidence obligations/design/instances.md#instance-identity-transform The stable ID is `altar/sanctuary`, its origin is the plinth floor contact, and its transform is centered at `(0.00,0.00,7.20)` with seed `temple-altar-v1`.
@evidence obligations/design/instances.md#instance-placement-review Placement is refused if the plinth crosses the sanctuary room bounds or the reserved route from threshold `(0.00,0.00,6.00)` to center `(0.00,0.00,7.20)`.

Authority and status: `author-adopted` singleton population. This population places the reviewed altar pair and does not add an axis, socket, iconography, contents, or motion.

## Records table population {#records-table-population}

@evidence principles/design/instances.md#instance-prototype-boundary The one member reuses `records-table-prototype`; its placement does not alter the open underside, tabletop, or four-leg silhouette.
@evidence principles/design/instances.md#instance-derivation-authority The stable ID `records-table/00` and floor-contact transform are explicit authored values, independent of furniture iteration order.
@evidence principles/design/instances.md#instance-verification-address The records-room centre route is the review address because the table footprint must leave its 1.20m reserved path and 0.30m protected band open.
@evidence obligations/design/instances.md#instance-prototype-membership The complete set contains one `records-table-prototype` member in `records-room`.
@evidence obligations/design/instances.md#instance-identity-transform The member uses origin `(9.40,0.00,1.00)`, zero yaw, scale one, and seed `temple-records-furniture-v1`.
@evidence obligations/design/instances.md#instance-placement-review The member is refused if its `1.20m x 0.60m` footprint intersects the room route or loses floor contact.

Authority and status: `author-adopted` singleton work-surface population. The table is not a room boundary, a storage chest, or a second model prototype.

## Records shelf population {#records-shelf-population}

@evidence principles/design/instances.md#instance-prototype-boundary Both members reuse `records-shelf-prototype`; shelf spacing and orientation vary only within the placement rule and never alter board intervals.
@evidence principles/design/instances.md#instance-derivation-authority IDs `records-shelf/west` and `records-shelf/east` are explicit members of the records-room set and do not depend on discovery order.
@evidence principles/design/instances.md#instance-verification-address The two side positions are reviewed against the table clearance and the room corners, where vertical storage can obscure the route or wall host.
@evidence obligations/design/instances.md#instance-prototype-membership Membership is exactly two records shelf members in `records-room`, both bound to `records-shelf-prototype`.
@evidence obligations/design/instances.md#instance-identity-transform Each member has a floor-contact transform, seed `temple-records-furniture-v1`, and a fixed scale of one.
@evidence obligations/design/instances.md#instance-placement-review A shelf is refused if its frame leaves the room bounds, intersects the table, or enters the protected route band.

Authority and status: `author-adopted` two-member population. The members are furniture placement only; board count and geometry remain model-owned.

## Records chest population {#records-chest-population}

@evidence principles/design/instances.md#instance-prototype-boundary The single member reuses `records-chest-prototype`; no per-instance override opens the lid or changes its body/lid construction.
@evidence principles/design/instances.md#instance-derivation-authority `records-chest/00` is an explicit member ID and its transform is anchored to the records-room furniture plan.
@evidence principles/design/instances.md#instance-verification-address The low storage position beside the records table is the review address because its closed body must remain legible without narrowing the route.
@evidence obligations/design/instances.md#instance-prototype-membership The complete set contains one records chest in `records-room` bound to `records-chest-prototype`.
@evidence obligations/design/instances.md#instance-identity-transform The member uses floor contact, scale one, seed `temple-records-furniture-v1`, and a fixed transform at the south-east furniture zone.
@evidence obligations/design/instances.md#instance-placement-review The member is refused when its closed bounds overlap the table, shelf, threshold, or reserved route.

Authority and status: `author-adopted` singleton population. Contents, lid motion, and a second records chest are outside this population.

## Storage shelf population {#storage-shelf-population}

@evidence principles/design/instances.md#instance-prototype-boundary Three members reuse `storage-shelf-prototype`; their orientation and position vary, but board intervals and frame silhouette remain model-owned.
@evidence principles/design/instances.md#instance-derivation-authority IDs `storage-shelf/north`, `storage-shelf/middle`, and `storage-shelf/south` are explicit and ordered by the records of the storage room, not by a runtime traversal.
@evidence principles/design/instances.md#instance-verification-address The three shelves are checked at their room-wall contacts and against the central room route, where a misplaced shelf would block cardinal observation.
@evidence obligations/design/instances.md#instance-prototype-membership Membership is exactly three storage shelves in `votive-storage-room` bound to `storage-shelf-prototype`.
@evidence obligations/design/instances.md#instance-identity-transform Each member has scale one, floor contact, seed `temple-storage-furniture-v1`, and an explicit wall-relative transform.
@evidence obligations/design/instances.md#instance-placement-review A shelf is refused if it leaves `votive-storage-room`, collides with another storage member, or enters its 1.20m observation route and 0.30m protection band.

Authority and status: `author-adopted` three-member population. The set does not create a fourth shelf or change the storage room boundary.

## Storage chest population {#storage-chest-population}

@evidence principles/design/instances.md#instance-prototype-boundary Two members reuse `storage-chest-prototype`; their bounded tone variation is material-owned and neither member changes the closed body/lid silhouette.
@evidence principles/design/instances.md#instance-derivation-authority IDs `storage-chest/west` and `storage-chest/east` are explicit, with transforms tied to the storage-room furniture plan.
@evidence principles/design/instances.md#instance-verification-address The pair is reviewed at the service-facing side of the room and beside the shelves, testing closed storage readability and route clearance together.
@evidence obligations/design/instances.md#instance-prototype-membership Membership is exactly two storage chest members in `votive-storage-room` bound to `storage-chest-prototype`.
@evidence obligations/design/instances.md#instance-identity-transform Each member has floor contact, scale one, seed `temple-storage-furniture-v1`, and a fixed transform that preserves the room route.
@evidence obligations/design/instances.md#instance-placement-review A member is refused if its body/lid bounds overlap a shelf, the threshold, or the protected route, or if it is not grounded.

Authority and status: `author-adopted` two-member population. Contents and lid motion are outside scope.

## Storage basket population {#storage-basket-population}

@evidence principles/design/instances.md#instance-prototype-boundary Four members reuse the single canonical `storage-basket-prototype`; tone and rotation vary within bounds without changing the open cavity, rim, or handle silhouette.
@evidence principles/design/instances.md#instance-derivation-authority IDs `storage-basket/00..03` are explicit and seeded, so their order and transforms remain stable when a shelf is edited.
@evidence principles/design/instances.md#instance-verification-address The basket nearest the service-yard side and the highest shelf position are worst cases for grounding, collision, and readable negative space.
@evidence obligations/design/instances.md#instance-prototype-membership The complete set contains four open baskets in `votive-storage-room`, each bound to `storage-basket-prototype` and no alternate basket model.
@evidence obligations/design/instances.md#instance-identity-transform Each member uses seed `temple-storage-props-v1`, a named shelf or floor host, deterministic yaw, and scale in `0.95..1.05`.
@evidence obligations/design/instances.md#instance-placement-review The source refuses an ungrounded basket, a basket whose cavity is occluded by a host, or any member that intersects the route protection band.

Authority and status: `author-adopted` four-member population. Baskets remain open props and cannot become closed chests through variation.

## Votive display population {#votive-display-population}

@evidence principles/design/instances.md#instance-prototype-boundary The single display member reuses `votive-display-prototype`; its recessed field remains an empty negative space and is not filled by instance variation.
@evidence principles/design/instances.md#instance-derivation-authority `votive-display/communal` is anchored to the reviewed `communal-votive-room` host and has one explicit transform.
@evidence principles/design/instances.md#instance-verification-address The west communal room centre is the review address because the display must read from the loop while leaving its threshold and cardinal route open.
@evidence obligations/design/instances.md#instance-prototype-membership The complete set contains one display member in `communal-votive-room` bound to `votive-display-prototype`.
@evidence obligations/design/instances.md#instance-identity-transform The member is floor/contact anchored, uses scale one and seed `temple-votive-v1`, and faces the room centre without changing the prototype recess.
@evidence obligations/design/instances.md#instance-placement-review Placement is refused if the display covers the empty recess, intersects the route reservation, or crosses the communal room bounds.

Authority and status: `author-adopted` singleton population. Display count and wall construction are not delegated to the instance layer.

## Ceramic vessel population {#ceramic-and-basket-population}

@evidence principles/design/instances.md#instance-prototype-boundary Six members reuse `ceramic-vessel-prototype`; scale and warm/cool tone variation stay within the prototype silhouette and do not add a new neck or rim design.
@evidence principles/design/instances.md#instance-derivation-authority IDs `vessel/communal/00..02` and `vessel/storage/00..02` derive from two explicit host subsets and seed `temple-vessels-v1`, not from object creation order.
@evidence principles/design/instances.md#instance-verification-address The three communal display vessels and three storage vessels are reviewed at the display recess and shelf contacts, including the smallest allowed scale.
@evidence obligations/design/instances.md#instance-prototype-membership The complete set contains six members of `ceramic-vessel-prototype`, split between `communal-votive-room` and `votive-storage-room` as named above.
@evidence obligations/design/instances.md#instance-identity-transform Each member has a stable host-qualified ID, deterministic yaw, scale in `0.95..1.05`, and a floor or shelf contact datum.
@evidence obligations/design/instances.md#instance-placement-review A vessel is refused if it floats, enters a route reservation, exceeds its host shelf or recess, or uses a scale outside the declared range.

Authority and status: `author-adopted` six-member population. Vessels do not gain handles, lids, liquid, or a second prototype through variation.

## Lamp population {#lamp-population}

@evidence principles/design/instances.md#instance-prototype-boundary Five members reuse `lamp-prototype`; position and a bounded warm-tone material variation do not change the base, stem, shade, or local origin convention.
@evidence principles/design/instances.md#instance-derivation-authority IDs `lamp/sanctuary`, `lamp/records`, `lamp/storage`, `lamp/loop/west`, and `lamp/loop/east` are explicit and use seed `temple-lamps-v1`.
@evidence principles/design/instances.md#instance-verification-address The sanctuary, records, storage, and two loop positions are reviewed because each has a different host ceiling or route clearance.
@evidence obligations/design/instances.md#instance-prototype-membership Membership is exactly five lamp members bound to `lamp-prototype`, with named room or loop hosts and no unreviewed fixture.
@evidence obligations/design/instances.md#instance-identity-transform Each lamp uses the prototype's floor-contact origin, a fixed scale of one, explicit yaw, and a host-relative transform.
@evidence obligations/design/instances.md#instance-placement-review A lamp is refused if its shade intersects the 3.60m clear-height envelope, falls outside its host, or narrows a reserved route.

Authority and status: `author-adopted` five-member population. Lighting response and illumination process are outside this branch and no animated lamp state is authored.

## Bench population {#bench-population}

@evidence principles/design/instances.md#instance-prototype-boundary Four members reuse `bench-prototype`; orientation and placement vary while the seat, four legs, back rail, and open underside remain unchanged.
@evidence principles/design/instances.md#instance-derivation-authority IDs `bench/south`, `bench/north`, `bench/west`, and `bench/east` derive from the four loop cells and fixed seed `temple-benches-v1`.
@evidence principles/design/instances.md#instance-verification-address Each bench is reviewed at its loop cell and nearest corner because the back rail and seat clearance must not intrude into the 2.00m circulation route.
@evidence obligations/design/instances.md#instance-prototype-membership The complete set contains exactly four members of `bench-prototype`, one in each reviewed loop cell and none in a room or threshold.
@evidence obligations/design/instances.md#instance-identity-transform Each member uses floor contact, explicit cardinal yaw, scale one, and the stable cell-qualified ID.
@evidence obligations/design/instances.md#instance-placement-review A bench is refused if its seat, legs, or back rail overlaps the loop reservation, a column footprint, a threshold, or another bench.

Authority and status: `author-adopted` four-member population. The benches are static set dressing and do not become route barriers or new structural spaces.

## Population-wide derivation and review boundary {#population-wide-derivation-and-review}

@evidence principles/design/instances.md#instance-derivation-authority All membership and transform tables above are inputs to one deterministic instance source; no second hand-maintained output list may override them.
@evidence principles/design/instances.md#instance-verification-address The compiled population review includes every member ID, prototype binding, world bounds, host contact, route clearance, and the worst-case members named by each population.
@evidence obligations/design/instances.md#instance-prototype-membership The complete delivered population is the union of the fourteen addressable sets above and contains no unnamed repeated object.
@evidence obligations/design/instances.md#instance-identity-transform Equal reviewed inputs and seeds must produce equal ordered IDs and transforms, independent of map or object traversal order.
@evidence obligations/design/instances.md#instance-placement-review The source reports stable failures for missing prototypes, duplicate IDs, non-finite transforms, lost contact, forbidden overlap, and unsupported variation or density before returning a partial population.

Authority and status: `author-adopted` population-wide handoff. This H2 owns the cross-population union, deterministic input contract, and review census. It does not duplicate individual member placement decisions or prototype geometry.
