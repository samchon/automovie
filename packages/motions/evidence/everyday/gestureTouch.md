# src/everyday/gestureTouch.ts#gestureTouch.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the body, side and kind it is bound to, which kinds get one, and what is built at once or on first use.

## @evidence contracts/development/implementation.md#principled-implementation

Self-touch takes its fingertip padding from `padding`; pointing takes its reach from the point shape's index-tip offset plus `POINT_REACH` of the arm, on the first pointing query.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One kind branch builds the record; the touch padding is computed at once and the pointing reach and bone readers when first read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A record is used only by a query on the same body, side and kind; any other falls back to computing its geometry, so a wrong record cannot change a goal.

## @evidence contracts/development/implementation.md#efficient-algorithms

The padding scan and the pointing reach run once per plan instead of once per posture; every posture's target and trunk forward kinematics still run.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The body, side and kind fix the padding, the reach and the bone-name readers, so the plan shares them across its postures; every posture, target and workspace is read afresh.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan holds the record, its scalars and at most one pointing and one region reader until it is released; no posture, frame, goal or history enters it.

# src/everyday/gestureTouch.ts#gestureTouch.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

States what the record is bound to and that its optional members fill on first use.

## @evidence contracts/development/design.md#principled-representation

The binding (body, side, kind) and the derived padding and reach in metres, with the trunk readers that depend only on the binding.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members `point` and `touch` read and fill; `gestureStroke.IInput` carries the record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Derived members are computed here from the binding, never supplied by a caller; a query on another binding ignores the record.

# src/everyday/gestureTouch.ts#gestureTouch.point

## @evidence contracts/development/common.md#meaningful-documentation

States the goal and the refusal; the namespace states the source.

## @evidence contracts/development/implementation.md#principled-implementation

The reach is solved as a ray-sphere intersection from the shoulder along the eye's line, never past the target itself.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The line, the reach, the distance on the line, then the hand's turn.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The palm turns back or forward for a line within `STEEP` of the vertical, where palm down has no meaning; `POINT_REACH` is a documented provisional value.

## @evidence contracts/development/implementation.md#efficient-algorithms

One trunk forward-kinematics pass demanding the eye and the shoulder, and constant ray-sphere arithmetic; a prepared record computes the reach once per plan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A record prepared for this body, side and kind supplies the eye and shoulder reader and the reach; without one they are computed here. The target, line, intersection and hand goal are computed at every call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new goal and retains nothing.

# src/everyday/gestureTouch.ts#gestureTouch.touch

## @evidence contracts/development/common.md#meaningful-documentation

States the goal; the namespace gives each gesture's slide.

## @evidence contracts/development/implementation.md#principled-implementation

The material fingertip stands off the region by its measured depth in the distal collider along the surface normal, and slides along the surface's upward tangent.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The region, its upward tangent, the slide, then the goal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The slide sizes are documented provisional values; no body is special-cased.

## @evidence contracts/development/implementation.md#efficient-algorithms

One trunk forward-kinematics pass demanding the region's bone and constant vector work; a prepared record supplies the padding and the region reader, and without one the padding's profile scan runs here.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The region read may borrow its caller's FK workspace; the padding, fixed by body and side, comes from the prepared record. The region's place, the slide and the goal are computed at every call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new goal and retains nothing.

# src/everyday/gestureTouch.ts#gestureTouch.padding

## @evidence contracts/development/common.md#meaningful-documentation

States the fingertip and hand fallback, the profile source and the metre output.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the same posed fingertip landmark and signed collider distance as the touch law.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates the signed distance query to the hand effector owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the profile at the actual fingertip landmark and retains its measured depth.

## @evidence contracts/development/implementation.md#efficient-algorithms

A prepared gesture measures the signed distance once per touching hand.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The padding depends only on the body's profile and the hand, so `prepare` computes it once per plan; a stroke read without a prepared record computes it here.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a scalar and retains no body, profile, shape or frame.
