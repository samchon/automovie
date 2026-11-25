# src/compose/AutoMovieMotionHumanTouchEffector.ts#AutoMovieMotionHumanTouchEffector.axis

## @evidence contracts/development/common.md#meaningful-documentation

States the rest pose the axes are read in and each axis's direction.

## @evidence contracts/development/implementation.md#principled-implementation

The rig's rest pose fixes the three anatomical axes, mirrored by side for the fingers; the grasp axis is the oblique axis of the power grip in the plane of the palm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One sign and one choice.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The same axes `HumanHand.rotation` aligns from.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTouchEffector.ts#AutoMovieMotionHumanTouchEffector.direction

## @evidence contracts/development/common.md#meaningful-documentation

States the two inputs, the result and the failure.

## @evidence contracts/development/implementation.md#principled-implementation

The weighted sum of the three orthonormal anatomical axes, normalised.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch on the form and one sum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A blend with no length is refused instead of returning an arbitrary axis.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `axis`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTouchEffector.ts#AutoMovieMotionHumanTouchEffector.local

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The surface's offset plus the tool's shares of the hand's length along the axes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One offset and one loop over the tool's axes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The tool is in hand lengths, never metres.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `HumanHand.offset`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTouchEffector.ts#AutoMovieMotionHumanTouchEffector.point

## @evidence contracts/development/common.md#meaningful-documentation

States the input pose and the result's frame.

## @evidence contracts/development/implementation.md#principled-implementation

The hand bone's world transform applied to the effector's rest-frame point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rotation and one sum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the displayed hand, never a goal.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `local`, so the law and its verdicts read one effector.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTouchEffector.ts#AutoMovieMotionHumanTouchEffector.pad

## @evidence contracts/development/common.md#meaningful-documentation

States what is measured, the unit and the tool case.

## @evidence contracts/development/implementation.md#principled-implementation

The signed distance of the surface's point to the hand's (or the fingertip's) own colliders at rest, negated.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bones map of the hand alone and one distance query.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A collider query, never a shape's radius, so any collider kind serves; a body without a hand collider reads 0.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `HumanColliders.distance`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One query over one segment.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTouchEffector.ts#AutoMovieMotionHumanTouchEffector.admit

## @evidence contracts/development/common.md#meaningful-documentation

States the rule, the measured defect it prevents and the tool's case.

## @evidence contracts/development/implementation.md#principled-implementation

A contact is a point of the posed hand's surface that faces the region; a shape that puts other parts of the hand past it has no such point there.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One table lookup and one refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The refusal names the admitted shapes; nothing is changed silently.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTouchEffector.ts#AutoMovieMotionHumanTouchEffector.goal

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs' frames and what the goal carries.

## @evidence contracts/development/implementation.md#principled-implementation

The rotation aligns the effector's facing against the normal and its along axis with the tangent; the wrist follows rigidly.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One alignment and one rigid offset.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An effector at the wrist declares no contact.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `HumanHand.align` and `local`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
