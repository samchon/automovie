# src/posture/HumanArmTrajectorySweep.ts#HumanArmTrajectorySweep.ISwept

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit and frame.

## @evidence contracts/development/design.md#principled-representation

One frame step of a probe's course, an axis sphere's or an audit collider probe's: its two frames, its two ends carried into the shape's frame at the interval's first waypoint with the turns that carry directions back, its clearance (a collider probe's less the played course's stray toward the shape), its bound and the shape's nearest-point reading, the facts the violation and its linearisation are made of.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Eleven members, all read by the convex model; the merit reads `clear` and `lower`, the evaluation `from` and `other` to place a miss.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Indices into the placed arm's probes and the frame's shapes, not copies; `near` is the reading itself, which the convex model would otherwise make again.

# src/posture/HumanArmTrajectorySweep.ts#HumanArmTrajectorySweep.of

## @evidence contracts/development/common.md#meaningful-documentation

States what is read, through which frames, what is left out and the order.

## @evidence contracts/development/implementation.md#principled-implementation

A sphere's course through every frame of the interval, each step a capsule, read relative to the shape's own motion as continuous collision detection against a moving obstacle is; each step within the active set is its own sweep with its own signed distance less the radius (`physicalShapeNearest`), as trajopt subdivides a long interval into several casts, each its own contact, so the convex model moves every step of a miss at once. A step a previous exact reading of the same course still keeps clear is certified by conservative advancement (Mirtich 1996, PhD thesis, ch. 3): each end of its chord lies within the course's chord travel since that reading of the reading's chord ends, prepared once per course by `HumanArmTrajectorySweepBound.chords` and read by its `travel`, and a segment's signed distance to a convex shape changes no more than its ends move.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the eight spheres and the shapes near each, one pass over the interval's frames.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The reach, the allowances at each step's frames and the radius are the model's own; a step is left out only where it moves less than the sphere's radius relative to the shape, so it can pass through nothing its places do not touch, or where the shape's declared bounding sphere, the conservative-advancement certificate from the last exact reading or the step's exact distance shows it clear of its allowance by more than `T.CHECK`, past both the merit and the convex rows; the certificate's travel is a rounded prefix-sum difference, its precision limit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Eight sphere screens over the waypoint's reachable shapes, a closed-form step-to-centre bound per frame step (TrajOpt's d_check, Schulman et al. 2014, section IV), one O(log n) certificate per step from the last exact reading, and one exact nearest-point query only where both fall within the check distance; the course's chord bound is prepared once per sphere and shape in O(n) for n frame steps.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The reading is kept on the iterate's evaluation with each step's nearest point, so the convex model of the same iterate reads these records instead of the geometry again.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records and retains nothing.

# src/posture/HumanArmTrajectorySweep.ts#HumanArmTrajectorySweep.links

## @evidence contracts/development/common.md#meaningful-documentation

States what is read, in which order the certificates come, what a sweep records and what is left out.

## @evidence contracts/development/implementation.md#principled-implementation

Trajopt's link-pair cast (Schulman et al. 2014, section IV-C): each audit part's solids cast over the whole interval through every frame, carried into the shape's frame and widened by the played course's stray (`HumanArmTrajectoryLinks.cast`), certify the pair clear of every allowance by one GJK lower bound (`HumanAuditModel.certify`), since two convex solids' distance bounds every probe depth between them and every allowance is no more than zero. Where it does not, each frame step is cast alone, the subdivision trajopt makes of an interval past its longest valid segment, and only a step whose cast fails reads its probes' chords less the cubic's interpolation error toward the shape (an eighth of the second difference about the step's frames, along the shape's outward normal at the nearest point). Each failing step is its own contact, its deepest probe's, so the convex model moves every step of a miss at both its frames. A step after one whose cast certified a clearance is itself certified clear while the part's solids' points have moved less than that clearance since (conservative advancement, Mirtich 1996, PhD thesis, ch. 3): its cast is the hull of the same points at its own two frames, and a hull's distance to a convex shape changes no more than its points move; the points' travel is prepared once per part and shape (`HumanArmTrajectorySweepBound.solids`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Part by part, shape by shape: the screen, the interval's cast, each step's cast, then the step's probes under branch and bound (`HumanArmTrajectoryDeepestStep`); the conservative-advancement bound is `HumanArmTrajectorySweepBound`'s.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A declared rest touches its shape by design, so it is never certified and its probes are read on every step; the stray is a bound in every direction, so a cast certified clear covers the course played; a probe is left unread only where the shape's bounding sphere less that stray shows it within its allowance or no deeper than the step's deepest so far.

## @evidence contracts/development/implementation.md#efficient-algorithms

Plan-time cost class, once per read interval of an iterate: one GJK per part and shape left by the screen, one per frame step only where the interval's cast fails and no earlier step's clearance still covers the step (an O(log n) read of the bound prepared once per part and shape in O(n p) carries for n frames and p solid points), and probes read exactly only on the steps whose cast fails. The frames' solids are made once per interval on the first cast that reads them. Nothing is read per displayed frame.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The reading is kept on the iterate's evaluation with each step's nearest point, so the convex model of the same iterate reads these records instead of the geometry again, and a later reading whose interval window is unchanged takes them as they are.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records and retains nothing.