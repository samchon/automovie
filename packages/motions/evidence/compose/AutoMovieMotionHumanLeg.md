# src/compose/AutoMovieMotionHumanLeg.ts#AutoMovieMotionHumanLeg.arc

## @evidence contracts/development/common.md#meaningful-documentation

States the path's formula, where it peaks and each input's unit.

## @evidence contracts/development/implementation.md#principled-implementation

The lowest-order curve that leaves and lands at the floor with one peak: a parabola over the straight line, with the foot's turn interpolated on the sphere.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The shared swingAnkle owner raises only the fresh vector returned by the engine's interpolation, avoiding a second copied ankle record, then the engine interpolates its turn.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Progress is clamped to [0, 1], so the foot never goes under the floor past either end.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant interpolation/rotation work returns one fresh ankle vector whose owned height is raised directly, avoiding a second ankle copy while retaining the exact original lift expression and live endpoint reads.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse beyond the engine's vector and quaternion interpolation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanLeg.ts#AutoMovieMotionHumanLeg.prepareArc

## @evidence contracts/development/common.md#meaningful-documentation

States fixed borrowed endpoints/clearance, metre units, original progress clamp, first-actual-read ankle preparation and fresh placement ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Uses arc's same straight-line plus 4*c*s*(1-s) ankle owner and the engine's exact fixed-endpoint slerp producer, preserving shorter-arc choice, near-parallel threshold and final normalization.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One prepared rotation and lazy fixed-endpoint vector reader precede a progress clamp, shared owned-vector lift and current rotation evaluation; no alternate swing curve is introduced.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every actual progress computes its original ankle and quaternion. No endpoint shortcut, changed clearance, time sample, lowered contact policy or interpolated result is reused.

## @evidence contracts/development/implementation.md#efficient-algorithms

Across Q reads, ankle endpoint subtractions and rotation dot/shorter-arc choice/fixed angle/sine prepare once; every ankle interpolation, original lift expression, current quaternion weights and normalization remain, with no measured speedup claim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The explicit fixed departure/landing pair establishes vector/rotation prerequisite equivalence for the engine producers; a changed placement or clearance requires a new swing reader. Current progress and output placements are never retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The action owns two borrowed endpoint placements, clearance and bounded slerp/lazy fixed-vector readers until released; every returned placement/vector/quaternion is fresh and retains no reader or time history.

# src/compose/AutoMovieMotionHumanLeg.ts#AutoMovieMotionHumanLeg.goal

## @evidence contracts/development/common.md#meaningful-documentation

States each input and what of the posture is read.

## @evidence contracts/development/implementation.md#principled-implementation

The ankle and the foot's rotation are the goal; the knee's hint follows the foot's heading; a bearing foot declares the toes' joint as its contact so the heel rises about the ball instead of the foot sliding.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record with one conditional pair of members.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A free foot declares neither a plant nor a contact, so the resolver does not pin a foot in the air.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `AutoMovieMotionHumanBend.knee`, `HumanFoot.heading` and `HumanFoot.offset`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanLeg.ts#AutoMovieMotionHumanLeg.prepareGoal

## @evidence contracts/development/common.md#meaningful-documentation

States fixed body/placement/bearing, current root/yaw input, borrowed placement fields, fresh contact/goal ownership and lazy first-read preparation.

## @evidence contracts/development/implementation.md#principled-implementation

The fixed foot rotation determines one HumanFoot heading and the fixed body determines one toe-contact offset. Every read still computes the same knee hint from its actual root/yaw before the original planted/contact fields are formed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lazy fixed-heading knee reader and optional lazy contact feed the goal-record owner shared with goal; the knee remains HumanBend's shared cold/prepared numerical owner with actual root/yaw inputs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves fixed ankle/rotation values, real per-write knee calculation and original contact geometry. The first contact preparation remains after a successful knee calculation, failed contact preparation is not retained, and no goal or posture result is cached.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed foot-heading rotation/atan2 and body toe-offset subtraction run once across Q reads. HumanBend.prepareKnee shares fixed outer-heading products and exact current-yaw inner metadata, while every actual root translation, nested knee evaluation and fresh goal/contact allocation remain; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller establishes unchanged body, side, placement and bearing; a changed one requires a new preparation. Root and yaw are current inputs, and no sampled time, previous knee or achieved target is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One reader borrows fixed body/placement and retains four copied rotation scalars, one bounded prepared knee-metadata reader and at most one contact vector until its owning action ends; returned goals retain no reader or time history.

# src/compose/AutoMovieMotionHumanLeg.ts#AutoMovieMotionHumanLeg.preparePlacement

## @evidence contracts/development/common.md#meaningful-documentation

States fixed body/side/rotation snapshot, exact component guard, actual placement/bearing inputs, lazy knee/contact order, fallback and fresh/borrowed output ownership.

## @evidence contracts/development/implementation.md#principled-implementation

The same cold goal owner handles changed rotations. Matching rotation values share one heading and genuine Bend.prepareKnee producer; every actual root/yaw still computes its knee, and only actual bearing requests read/copy the original toe offset after a successful knee.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

prepareGoal and this placement reader share one private fixed-rotation producer, while goal and changed-rotation fallback share one cold numerical owner and all paths form the original goal record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Object.is retains signed-zero/nonfinite distinctions; every current ankle, rotation and bearing is read. Changed rotations keep ordinary heading/knee/contact admission, free feet never inherit a previous contact, and no target, fit, pose or contact threshold is substituted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Across Q matching-rotation reads, fixed heading/toe metadata and fixed/last-yaw knee products prepare once; every actual knee translation and fresh goal/contact remains. Changed rotations retain cold work, with no measured speedup claim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Copied quaternion scalars and fixed unchanged body/side prove only the reused heading/knee/contact prerequisites. Current world ankle, root, yaw and bearing remain actual inputs; changed quaternion values are never treated as the prepared rotation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The action owns four rotation scalars, one bounded knee producer and at most one toe-offset vector until release. No actual placement, root, goal, query result, workspace or time history is retained.

# src/compose/AutoMovieMotionHumanLeg.ts#AutoMovieMotionHumanLeg.place

## @evidence contracts/development/common.md#meaningful-documentation

States what the leg follows and the channel claimed.

## @evidence contracts/development/implementation.md#principled-implementation

Each second the placement and the bearing are evaluated and turned into the leg's goal on the posture so far, so the knee's hint follows the root the earlier rows moved.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One goal written into one limb.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Writes its own limb only and leaves every other member of the posture as it is.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per written second.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `goal`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive closes over its props only and holds no per-second state.

# src/compose/AutoMovieMotionHumanLeg.ts#AutoMovieMotionHumanLeg.plant

## @evidence contracts/development/common.md#meaningful-documentation

States the window and what the foot does in it.

## @evidence contracts/development/implementation.md#principled-implementation

A stance foot is one placement that bears throughout.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One place primitive supplies the borrowed placement over the named window and declares its root/own-leg input channels.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The window is two named instants of the clock, so no time is written twice.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates current placement values and the actual root/yaw knee to place/goal. Explicit root/own-leg reads preserve direct leg joints while omitting unrelated prefix writers; callers owning unchanged geometry can use prepareGoal as crouch does.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant goal work remains per write, with dependency-aware prefix reads. Borrowed placement values stay live; no immutable-geometry premise is added to this existing factory.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive retains its borrowed arguments and constant callbacks until released, storing no prepared placement result or time history.

# src/compose/AutoMovieMotionHumanLeg.ts#AutoMovieMotionHumanLeg.step

## @evidence contracts/development/common.md#meaningful-documentation

States the two ends, the window, the time course and when the foot bears.

## @evidence contracts/development/implementation.md#principled-implementation

A swing foot travels its arc on the minimum-jerk profile and bears only once it has arrived, so it lands without sliding.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call of `place` with the arc and the landing test.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Bearing is read from the clock's linear share reaching 1 and not from the eased progress, which approaches 1 before the instant.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates current progress/bearing to the clock and live borrowed endpoint values to arc. Root/own-leg dependencies preserve direct leg joints and omit unrelated prefix writers; explicitly fixed-pair consumers use prepareArc without changing this existing factory's borrowed-input behavior.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive retains its borrowed endpoints, clearance and clock/window until released, without prepared placement results or time history.
