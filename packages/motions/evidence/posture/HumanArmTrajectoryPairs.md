# src/posture/HumanArmTrajectoryPairs.ts#HumanArmTrajectoryPairs

## @evidence contracts/development/common.md#meaningful-documentation

Names waypoint collision pairs, moving sites and the shared geometric readings used by the merit and convex model.

## @evidence contracts/development/design.md#principled-representation

Pair indices identify actual frame geometry; shortfalls are millimetres, while site points and shape inputs stay in world metres and angular residuals in degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owns fixed-body pairs, site placement and rotation readings; moving-arm and reverse pairs alias HumanArmTrajectoryOverlap rather than repeat its definitions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Keeps collider identity, reference depths, declared rests, grasp contacts and the original query cut; no scene-specific target or new tolerance is represented.

# src/posture/HumanArmTrajectoryPairs.ts#HumanArmTrajectoryPairs.IPair

## @evidence contracts/development/common.md#meaningful-documentation

Defines probe/shape indices, signed millimetre shortfall, the declared-rest flag and the swept segment a shortfall is read on.

## @evidence contracts/development/design.md#principled-representation

One deepest actual collider probe per audit-part/shape pair; current geometry supplies bounded indices and the context supplies physical allowances.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The merit, refusal and convex rows consume these fields from deepest; the swept reading carries its own gradient for the convex row.

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

Defines indexed deepest pairs, millimetre cut, own-part/joint exclusions and the optional neighbouring placements the swept reading uses.

## @evidence contracts/development/implementation.md#principled-implementation

Bounding spheres, first of each audit part's probes (`HumanArmPartScreen`) and then of each probe, conservatively select actual probes; reference allowances and shape gaps select each pair's deepest admissible reading, read at the waypoint and over the probe's swept segments to its neighbours with the played cubic's stray toward the shape (`HumanArmTrajectoryHalfStep`), TrajOpt's continuous-time term (Schulman et al. 2014). Every probe the tangle audit reads is read, the hand's against what it rests on included.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Each probe's complete sphere pass precedes the unchanged exact-query loop; a private buffer transfers completed sphere distances and selected shapes lazily acquire opaque fixed-geometry readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves reach, CUT, exclusions, first-winner ties, rest/reference callbacks and exact query order; every bound used to leave a probe unread is widened by the probe's longest swept segment, so the skip stays conservative.

## @evidence contracts/development/implementation.md#efficient-algorithms

Plan-time cost class, once per waypoint read by the solve: Q audit parts are screened against the segment screen's shapes (O(Q S)), then P probes against their part's shapes only, with exact queries only where the branch-and-bound admits them and at most two segment queries per pair the unit-slope bound does not clear. Nothing is read per displayed frame.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

nearby supplies the same candidate probe's actual sphere gap. A prepared engine reader shares only each selected shape's unchanged frame geometry; every exact distance and original allowance/rest query still runs in order, and callbacks leave geometry/probes unchanged.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Numeric gaps and at most one opaque reader per queried frame shape die with this candidate read. The reader array is created only after an actual exact query is selected; returned map entries contain only scalar indices/shortfalls, never scratch or a retained query reader.

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
