# src/compose/AutoMovieMotionHumanArmTarget.ts#AutoMovieMotionHumanArmTarget.origin

## @evidence contracts/development/common.md#meaningful-documentation

States each input and that the result is in the given floor frame.

## @evidence contracts/development/implementation.md#principled-implementation

The surface's world point and the hand's world rotation, taken into the floor frame by its inverse: the hand's place relative to the body.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two inverse transforms.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the relaxed hand, the shape an arm has before a movement shapes it.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `HumanHand.frame`, `HumanFrame.local` and `HumanFrame.turn`.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads the supplied resolved map and actual hand surface, then performs constant floor-frame transforms; no body bone map is rebuilt here.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanArmTarget.ts#AutoMovieMotionHumanArmTarget.point

## @evidence contracts/development/common.md#meaningful-documentation

States what of the posture is read and the result's frame and unit.

## @evidence contracts/development/implementation.md#principled-implementation

The floor-frame transform of the origin's point by the posture's root and heading, the inverse of what `origin` stored.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One transform.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The root's own height is kept, as `origin` measured from it.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `HumanFrame.point`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanArmTarget.ts#AutoMovieMotionHumanArmTarget.goal

## @evidence contracts/development/common.md#meaningful-documentation

States what the goal places and why it carries the surface as its contact.

## @evidence contracts/development/implementation.md#principled-implementation

The wrist follows rigidly from the surface's point and the hand's rotation; the surface's offset from the wrist is the contact the resolver holds when the rotation is out of range.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One wrist placement and one offset lookup.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A surface at the wrist itself declares no contact, since a zero offset gives the resolver no lever to re-aim by.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A row carrying its issuer's offset (prepareTarget) places the wrist from it, as prepareSurfaceGoal does; any other row reads both hand geometries. Every world point, rotation and bend remains the row's own.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two actual surface lookups remain in cold goal, including shaped-hand FK for digit surfaces, followed by constant rigid placement/contact assembly. Fixed consumers use prepareGoal or prepareSurfaceGoal to share only their unchanged geometry; no measured speedup is claimed.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanArmTarget.ts#AutoMovieMotionHumanArmTarget.fromWrist

## @evidence contracts/development/common.md#meaningful-documentation

Defines actual wrist/hint inputs, local contact units, original zero-contact branch and borrowed output ownership.

## @evidence contracts/development/implementation.md#principled-implementation

A surface target already computed its wrist and actual bend; goal assembly preserves those values rather than placing the same surface or solving the bend again.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One original length comparison feeds the same field assembly used by cold and fixed-geometry goals.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retains the exact length < 1e-9 condition, including its nonfinite behavior, and keeps the achieved wrist, original hint and local pivot unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant scalar length and wrapper assembly replace duplicate hand-offset/placement work at prepared consumers; every actual wrist/bend computation remains with its producer.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Cold goal and prepared Placed.arm consume the same assembly; completed wrist/hint values are shared only within their one unchanged target computation, without a result cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the fresh goal borrows its point/rotation/bend and any emitted contact exactly as the cold goal does.

# src/compose/AutoMovieMotionHumanArmTarget.ts#AutoMovieMotionHumanArmTarget.prepareGoal

## @evidence contracts/development/common.md#meaningful-documentation

States fixed geometry, varying world point, unchanged-body premise and fresh goal payload ownership.

## @evidence contracts/development/implementation.md#principled-implementation

HumanHand.offset supplies the same local surface point as cold goal; the common wrist-placement owner rotates it by the same fixed hand quaternion and subtracts it from every actual target. The original contact-length comparison decides whether contact is emitted.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One offset lookup, one prepared wrist placement and copied bend/contact scalars feed the same private assembly as fromWrist without owning hand geometry or IK.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The same surface/shape geometry, unnormalized rotation policy, contact offset and 1e-9-metre zero-contact rule remain. No world point, goal or fit answer is sampled or cached.

## @evidence contracts/development/implementation.md#efficient-algorithms

Surface geometry and its quaternion-vector rotation run once rather than twice and once per each of Q cold goals; every actual query still constructs fresh point, rotation, bend and optional contact payloads. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The consumer explicitly fixes body/side/surface/shape/rotation/bend; numeric snapshots isolate caller and returned-output edits. A changed fixed dependency requires a new producer, while each point remains a current input.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The action owns constant-size private rotated-offset, quaternion, bend and optional contact scalars until release. No body, target input object, query history or external handle is retained after preparation.

# src/compose/AutoMovieMotionHumanArmTarget.ts#AutoMovieMotionHumanArmTarget.prepareSurfaceGoal

## @evidence contracts/development/common.md#meaningful-documentation

Fixes unchanged body geometry, side, surface and shape; every call reads its current world point/rotation/bend and returns a fresh wrist/contact with borrowed current rotation/bend.

## @evidence contracts/development/implementation.md#principled-implementation

The shaped hand's local offset is independent of world target translation/rotation, so its original geometry is read once while the original rotate-then-subtract placement runs for every actual target.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One copied local offset and original contact-length decision feed placeHumanHandSurface and the same goal assembler as cold and fixed-world goals.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No world rotation, bowed point, bend, finger curl, IK or contact tolerance is frozen; exact length < 1e-9 and nonfinite behavior remain unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

One actual local surface computation replaces two per goal, including digit FK when needed; each current quaternion-vector rotation and subtraction remains actual. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only fixed body/side/surface/shape geometry is shared; changing that domain requires another reader. Fresh contact copies prevent a returned goal from changing later prepared placement.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The owner retains one local numeric offset and contact decision until release, without a body, target record, pose, time result or reader history; each result keeps current point/rotation/bend ownership.

# src/compose/AutoMovieMotionHumanArmTarget.ts#AutoMovieMotionHumanArmTarget.prepareTarget

## @evidence contracts/development/common.md#meaningful-documentation

Fixes body/side/surface/shape and returns fresh target rows from each world point/rotation/bend/curl, with the shared offset `goal` places the wrist from.

## @evidence contracts/development/implementation.md#principled-implementation

The offset depends on the body, side, surface and shape alone, so it is a value of the rows that share them; the row carries it as data and `goal` reads it in place of the hand.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One offset read, then one row assembly per call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No point, rotation, curl, bend or solver result is frozen; a row that changes its surface or shape drops the offset by the record's rule.

## @evidence contracts/development/implementation.md#efficient-algorithms

One local-surface computation serves Q emitted rows; each current wrist runs its own quaternion-vector placement. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fixed body/side/surface/shape is the domain of the one offset; each row's world placement is its own.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The producer owns one frozen offset until release; each row shares it and retains no body, reader or query history.

# src/compose/AutoMovieMotionHumanArmTarget.ts#AutoMovieMotionHumanArmTarget.prepareSidedTarget

## @evidence contracts/development/common.md#meaningful-documentation

Fixes body/side/surface/shape and emits fresh ISided rows in side/surface/shape then placement order, with the shared offset.

## @evidence contracts/development/implementation.md#principled-implementation

As `prepareTarget`; the side is request data the gesture consumer reads.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One offset read, then one row assembly per call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No generic callback cache, prior sample or solved pose is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

One local-offset computation serves Q fresh requests, one object each. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only the fixed body/side/surface/shape domain shares the offset; the gesture hand producer makes another emitter when its surface or shape changes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The producer owns one frozen offset until release; returned requests borrow their world payloads and retain no prior, pose or workspace.
