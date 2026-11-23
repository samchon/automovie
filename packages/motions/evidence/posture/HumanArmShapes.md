# src/posture/HumanArmShapes.ts#HumanArmShapes.segment

## @evidence contracts/development/common.md#meaningful-documentation

States each input, its unit and the result.

## @evidence contracts/development/implementation.md#principled-implementation

An axis sphere's segment is its place along the arm's axis probes, a collider probe's the segment its collider rides.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per probe kind.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The collider probe's owner is read from the frame, not guessed from its index.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A lookup with nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanArmShapes.ts#HumanArmShapes.nearby

## @evidence contracts/development/common.md#meaningful-documentation

States each input, its unit and the result.

## @evidence contracts/development/implementation.md#principled-implementation

A bounding sphere's distance never exceeds the shape's, so a shape whose sphere lies beyond the reach cannot come within it and is left out.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

An axis probe reads the frame's shapes directly; a collider probe filters its segment's screen.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only shapes that surely lie out of reach are left out; the exact distance stays the caller's.

## @evidence contracts/development/implementation.md#efficient-algorithms

One point-to-sphere distance per shape, over the segment's screen when one is given.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A screen taken once serves every probe, and the exact scalar Vector3.distance avoids a displacement object. Optional shape-indexed gaps let deepest use the same completed sphere distance while frame geometry and this candidate's probe remain unchanged.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh index list and retains no scratch. The caller owns the optional gap buffer, reads only this call's returned indices, and releases it with its candidate evaluation; untouched slots are unspecified.

# src/posture/HumanArmShapes.ts#HumanArmShapes.IScreen

## @evidence contracts/development/common.md#meaningful-documentation

States what each list holds.

## @evidence contracts/development/design.md#principled-representation

The shape indices per segment, the screen `nearby` filters.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three lists, read by `nearby`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Indices into the frame's shapes, not copies.

# src/posture/HumanArmShapes.ts#HumanArmShapes.screen

## @evidence contracts/development/common.md#meaningful-documentation

States each input, its unit and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Each segment's bounding sphere, placed by its own joint, against every shape's sphere.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reading per segment.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The segment's sphere is the frame's own bound of its colliders.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three sphere screens per placement instead of one per probe.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Read by `nearby` for every surface probe of the placement.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanArmShapes.ts#HumanArmShapes.colliders

## @evidence contracts/development/common.md#meaningful-documentation

States each input, its unit and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Each collider rides its segment's joint: its pose composed with the joint's place and turn.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pose per collider and one bounded shape per shape.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The colliders are the frame's own, in its order.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the arm's colliders.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each shape's sphere is `bounded`'s.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanArmShapes.ts#HumanArmShapes.bounded

## @evidence contracts/development/common.md#meaningful-documentation

States each input, its unit and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The sphere is the one the clearance reading tests a point against first, so every screen bounds the same distance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No radius is padded.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per shape, a hull's own sphere aside.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The sphere is `HumanShapeFraming.sphere`'s, the one owner of a placed shape's bound.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanArmShapes.ts#HumanArmShapes.near

## @evidence contracts/development/common.md#meaningful-documentation

States each input, its unit and the result.

## @evidence contracts/development/implementation.md#principled-implementation

A shape whose bounding sphere lies beyond the reach cannot come within it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the frame's shapes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The reach is the caller's; nothing is added to it.

## @evidence contracts/development/implementation.md#efficient-algorithms

One distance per shape.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The exact scalar Vector3.distance preserves the robust norm and shape order without a displacement object. Optional gap output supplies actual completed sphere distances without another norm query.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh list; an optional gap buffer remains caller-owned and is never retained, nor are source placements or computed point pairs.

# src/posture/HumanArmShapes.ts#HumanArmShapes.reachable

## @evidence contracts/development/common.md#meaningful-documentation

States what the list is for, the bound's derivation, which placement is read and the ordering.

## @evidence contracts/development/implementation.md#principled-implementation

A triangle-inequality bound on a serial chain of rigid links from a fixed shoulder; the premise holds because forward kinematics composes fixed rest offsets and rotations only (`resolveHumanArmChain`) and probes are fixed in their segments (`placeHumanArmGeometry`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The chain's two link lengths, one maximum over probes and segment spheres, one pass over the shapes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only shapes no placement can reach are left out, with `ROUNDING` kept on the keeping side for the distances' rounding; no reach, radius or allowance changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(P + S) once per frame for P probes and S shapes, so every later screen of that frame reads the kept shapes instead of S.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The list depends on the frame and the arm's rigid geometry alone, so one list serves every placement, probe and iterate at that frame.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh list and retains nothing.

# src/posture/HumanArmShapes.ts#HumanArmShapes.normal

## @evidence contracts/development/common.md#meaningful-documentation

States each input, its unit and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's normal of the shape at the point, its distance's gradient.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delegation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The direction from the shape's centre is only the engine's fallback where the gradient vanishes.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The engine's query.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `physicalShapeNormal`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanArmShapes.ts#HumanArmShapes.gap

## @evidence contracts/development/common.md#meaningful-documentation

States each input, its unit and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's signed segment-to-shape distance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delegation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A point is the segment from it to itself, read by the same query.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The engine's query.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `physicalShapeSegmentDistance`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanArmShapes.ts#HumanArmShapes.prepareGap

## @evidence contracts/development/common.md#meaningful-documentation

Defines fixed frame/index provenance, lazy geometry preparation, actual varying world segments and candidate-local release.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's opaque prepared distance reader shares only exact fixed shape transforms and retains the same signed proximity mathematics as gap.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Select the original frame shape and delegate preparation to the existing scalar distance owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the actual shape, all segment queries, bounds, branch/error order and metre sign; it supplies no alternate frame numbers, clearance allowance or result callback.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fixed-geometry preparation per selected shape serves repeated probes while changed-point transforms and original closest/hull/search work remain; one-off gap callers create no reader.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The actual deepest-pair candidate owns this reader while its frame geometry stays unchanged; another candidate or frame owns a new reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller releases this opaque reader with the synchronous candidate. Only borrowed fixed pose/shape and private geometry are retained; no probe, distance result or global history is kept.

# src/posture/HumanArmShapes.ts#HumanArmShapes.relative

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the same-rigid-collider premise, world frame and returned point/turn.

## @evidence contracts/development/implementation.md#principled-implementation

The relative world rotation now*inverse(next) carries the offset from next's origin to now's origin.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One relative quaternion and one rotated offset.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Borrows the actual placements of the same shape without re-estimating a centre or padding a distance.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Fixed-size quaternion and vector arithmetic.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its actual placement pair without retaining computed target coordinates.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh point/turn records and retains no source placements.
