# src/throwing/throwObjectRelease.ts#throwObjectRelease.trunk

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs' units and signs and which joints are written.

## @evidence contracts/development/implementation.md#principled-implementation

The twist is shared by the chest and the spine in the trunk owner's share, and the inclination is added through them alone, so the pelvis stays the carrier's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One joint record, one incline.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The pelvis share is zero by design, stated in the namespace doc.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `AutoMovieMotionHumanTrunk.CHEST` and `HumanTrunk.incline`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/throwing/throwObjectRelease.ts#throwObjectRelease.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it is and its frame.

## @evidence contracts/development/design.md#principled-representation

The thrower, its hand, its style, the standing posture the places are measured on and the hand's world rotation at release.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The five inputs `point` reads, written by `throwObject`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No length is typed: every place is the body's own.

# src/throwing/throwObjectRelease.ts#throwObjectRelease.point

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the frame and unit of the result; the namespace doc gives the rule.

## @evidence contracts/development/implementation.md#principled-implementation

The shoulder of the release pose (square and inclined by the style's tilt), then either the style's place in arm lengths or, where a study gives the elbow's flexion, the wrist at the law-of-cosines reach along the place's direction and the grip one grip offset beyond it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shoulder read, then one of two places.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every length is the body's own measure.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture solve requesting only the shoulder.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `trunk`, the posture resolver, `HumanFrame` and `HumanHand.place`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
