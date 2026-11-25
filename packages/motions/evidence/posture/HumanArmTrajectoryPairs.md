# src/posture/HumanArmTrajectoryPairs.ts#HumanArmTrajectoryPairs.IPair

## @evidence contracts/development/common.md#meaningful-documentation

Defines probe/shape indices, signed millimetre shortfall and the declared-rest flag.

## @evidence contracts/development/design.md#principled-representation

One deepest actual collider probe per audit-part/shape pair at a waypoint; current geometry supplies bounded indices and the context supplies physical allowances. The course between waypoints is the sweeps' record (`HumanArmTrajectorySweep.ISwept`), not a field here.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The merit, refusal and convex rows consume these fields from deepest.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Negative shortfalls remain clear gaps, and exact ties retain the first probe; no padded clearance or combined rest allowance is represented.

# src/posture/HumanArmTrajectoryPairs.ts#HumanArmTrajectoryPairs.ICrossing

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the canonical moving-arm pair owner.

## @evidence contracts/development/design.md#principled-representation

The actual probe, shape, owning segment and millimetre shortfall returned by the moving-arm collision reader.

## @evidence contracts/development/design.md#minimal-and-owned-surface

An alias preserves existing merit/model imports while every field remains owned by HumanArmTrajectoryOverlap.ICrossing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No field is copied, dropped, cast or adapted in this alias.

# src/posture/HumanArmTrajectoryPairs.ts#HumanArmTrajectoryPairs.IEmbedded

## @evidence contracts/development/common.md#meaningful-documentation

Names the owner of body/external corners embedded in an arm collider.

## @evidence contracts/development/design.md#principled-representation

The reverse reader's original corner, collider, owner and millimetre shortfall record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Pair consumers share HumanArmTrajectoryOverlap.IEmbedded directly instead of declaring another reverse-contact type.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias changes neither external-part identity nor own-body reference exemptions.

# src/posture/HumanArmTrajectoryPairs.ts#HumanArmTrajectoryPairs.ILocated

## @evidence contracts/development/common.md#meaningful-documentation

Documents world point/frame fields, optional collider and riding segment, and point-distance/normal callbacks.

## @evidence contracts/development/design.md#principled-representation

An actual site at one candidate, in world metres and quaternion, with queries on its touched collider; a surface-free held grip returns zero surface readings.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The merit, hard task limits and convex rows consume these fields and queries; located constructs the coherent world or attached variants.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional shape/on fields keep the existing producer's cases; callers use its coherent records rather than fabricate a collider or replace a contact disc with point equality.

# src/posture/HumanArmTrajectoryPairs.ts#HumanArmTrajectoryPairs.ILocated.gap

## @evidence contracts/development/common.md#meaningful-documentation

Specifies world-metre input, signed-metre output and the no-surface zero case.

## @evidence contracts/development/implementation.md#principled-implementation

located delegates actual touched geometry to the engine point query; a surface-free closed-chain contact has no surface separation to constrain.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The producer closes over one actual shape or supplies its original constant-zero closure.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No allowance, skin depth or substitute distance enters this callback.

## @evidence contracts/development/implementation.md#efficient-algorithms

One existing engine point query or constant zero, without a body traversal.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Borrows the candidate's touched collider; distance mathematics remains with physicalShapeSegmentDistance.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The located record owns the closure lifetime and borrowed shape; no queried-point or distance history is retained.

# src/posture/HumanArmTrajectoryPairs.ts#HumanArmTrajectoryPairs.ILocated.normalAt

## @evidence contracts/development/common.md#meaningful-documentation

Defines world-metre input and the surface normal, borrowed fallback or surface-free grip zero returned.

## @evidence contracts/development/implementation.md#principled-implementation

located uses physicalShapeNormal's original radial or smooth-plane reading on actual geometry, with its supplied fallback direction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The producer delegates when a shape exists, otherwise returning its original fallback or grip zero.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The engine's normal policy is retained rather than replaced by the bounding-sphere direction.

## @evidence contracts/development/implementation.md#efficient-algorithms

An existing engine normal query or constant fallback work, with no FK or candidate search.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the located candidate's actual shape and fallback; each point still receives its own normal reading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The record holds closure inputs while live, with no query cache; fallback vectors may be borrowed as before.

# src/posture/HumanArmTrajectoryPairs.ts#HumanArmTrajectoryPairs.tangents

## @evidence contracts/development/common.md#meaningful-documentation

States the admitted unit normal and the two unit orthogonal tangents returned.

## @evidence contracts/development/implementation.md#principled-implementation

A coordinate axis chosen away from parallel gives a nonzero cross; normalizing it and crossing again completes an orthogonal basis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Choose a helper axis, normalize one cross, then form the second tangent.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retains the original 0.9 helper-axis branch for basis conditioning without changing any physical bound.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two cross products and one normalization use constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The first tangent constructs the second; vector arithmetic remains with its existing owners.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh tangents and retains neither the normal nor state.

# src/posture/HumanArmTrajectoryPairs.ts#HumanArmTrajectoryPairs.deepest

## @evidence contracts/development/common.md#meaningful-documentation

Defines indexed deepest pairs, the millimetre cut, own-part and joint exclusions and the link-pair certificate read first.

## @evidence contracts/development/implementation.md#principled-implementation

Each audit part is read against a shape first as one link pair: a GJK lower bound between the part's own shapes and the shape (`HumanAuditModel.certify`), trajopt's link-pair reading at a timestep; two convex solids' distance bounds every probe depth between them, so a pair it certifies past the cut has no probe within reach. The pairs left read their probes, the deepest admissible kept. This is the waypoint's discrete reading, whose row moves the waypoint itself; the course between waypoints is read by the sweeps, one per frame step (`HumanArmTrajectorySweep.links`). Every probe the tangle audit reads is read, the hand's against what it rests on included.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Part by part, shape by shape: the part's screen, its certificate, then its probes under branch and bound.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves reach, CUT, exclusions, first-winner ties, rest/reference callbacks and exact query order; every allowance is no more than zero, so a certified bound past the cut leaves every probe beyond it; a rested pair is never certified.

## @evidence contracts/development/implementation.md#efficient-algorithms

Plan-time cost class, once per read waypoint of an iterate: a screen per part and shape, one GJK per part and shape left by the screen, and probes read exactly only in the pairs no certificate clears, each first bounded by the shape's sphere and the hull's box. Nothing is read per displayed frame.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The evaluation that calls it keeps its result for the iterate's merit and convex model, and for a later reading of the same coordinates at the waypoint; within the call, each shape's exact reader is made once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Solids, readers and scratch die with the call; returned map entries hold only indices and shortfalls.

# src/posture/HumanArmTrajectoryPairs.ts#HumanArmTrajectoryPairs.located

## @evidence contracts/development/common.md#meaningful-documentation

States world or riding site inputs and the actual located record returned.

## @evidence contracts/development/implementation.md#principled-implementation

An attached site's local point, rotation and normal are transformed by its actual carrying segment; world sites retain their point and context's touched collider.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

World, surface-free grip and surface-contact branches build the existing coherent site/query records.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps arm-reader call order, touched-shape index, fallback and contact ownership; no pose or surface is inferred from unrelated geometry.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed pose composition plus original collider placement when a riding surface is needed; later queries use that actual shape.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses current placed arms, S.colliders and existing world-shape query owners, without caching site or arm-reader results.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh outer record, borrowing original world points/fallbacks while attached compositions are fresh. Closures retain only their located shape/fallback inputs and no query history.

# src/posture/HumanArmTrajectoryPairs.ts#HumanArmTrajectoryPairs.relative

## @evidence contracts/development/common.md#meaningful-documentation

Defines next-to-current rigid-collider mapping, world point and returned direction rotation.

## @evidence contracts/development/implementation.md#principled-implementation

The matching collider's current frame times inverse next frame carries the probe; a missing/different collider keeps the original point and identity turn.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Check collider identity, delegate its transform to S.relative, or return the original fallback.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps bone/part checks and placement-pair arithmetic without changing sweep bounds or making a moving shape static.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant lookup and quaternion/vector work per relative mapping.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

S.relative owns the rigid transform; the wrapper supplies actual frame shapes and retains no computed map.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Computed point/turn are fresh; fallback borrows the point and creates an identity quaternion. No source state is retained.

# src/posture/HumanArmTrajectoryPairs.ts#HumanArmTrajectoryPairs.pad

## @evidence contracts/development/common.md#meaningful-documentation

States the hand-local contact input and world-metre point returned.

## @evidence contracts/development/implementation.md#principled-implementation

Rigidly carries the contact by the actual hand rotation and adds the current wrist origin.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rotation followed by one translation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Transforms the full contact without a wrist proxy, offset correction or tolerance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant quaternion/vector work for one contact.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the already placed hand and existing quaternion/vector owners.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh point, retaining no contact or placement.

# src/posture/HumanArmTrajectoryPairs.ts#HumanArmTrajectoryPairs.angle

## @evidence contracts/development/common.md#meaningful-documentation

States shortest-angle degrees for admitted unit quaternions.

## @evidence contracts/development/implementation.md#principled-implementation

The absolute quaternion dot removes double-cover sign; twice its clamped arccosine is the shortest rotation angle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ordered dot, absolute value, upper clamp and degree conversion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retains dot grouping and roundoff clamp, with no angular tolerance or alternative residual.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed scalar work and one arccosine, without vector allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the actual rotations without retaining or quantizing them.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one scalar and retains no input or history.

# src/posture/HumanArmTrajectoryPairs.ts#HumanArmTrajectoryPairs.rotationVector

## @evidence contracts/development/common.md#meaningful-documentation

Defines conjugate-relative axis-angle degrees in the reference rotation's frame.

## @evidence contracts/development/implementation.md#principled-implementation

Inverse reference times actual rotation, the original nonnegative-w hemisphere and quaternion logarithm give the existing residual with its near-zero branch.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One relative quaternion, sign choice, vector magnitude and axis-angle scaling.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retains the exact 1e-12 threshold, q.w test, hypot and atan2 grouping; no surrogate or new tolerance is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed quaternion/vector work independent of probe count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses actual rotations with the existing quaternion owner, without cross-candidate inverse/residual caching.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Every branch returns a fresh vector and retains no rotations or previous residuals.
