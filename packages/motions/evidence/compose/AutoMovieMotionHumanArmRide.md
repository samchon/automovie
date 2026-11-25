# src/compose/AutoMovieMotionHumanArmRide.ts#AutoMovieMotionHumanArmRide.gripped

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the members and why no normal is given.

## @evidence contracts/development/implementation.md#principled-implementation

A closed chain through a held object: the second grip is the first's pose times the grasp's relative offset.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One inverse rotation, one wrist point, two relative readings.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The lead's planned site, not the lead hand as posed.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanArmRide.ts#AutoMovieMotionHumanArmRide.riding

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and each member.

## @evidence contracts/development/implementation.md#principled-implementation

A point on a rigid segment is constant in the segment's frame; its normal is the nearest collider shape's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The segment's bone, its colliders' nearest shape, three readings in its frame.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The normal is the touched collider's, not the direction from the bone.

## @evidence contracts/development/implementation.md#efficient-algorithms

Ordered joint admission and only the selected segment's FK ancestors/output precede one profile scan and its shape distances; unrelated profile frames are not placed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `poseBones`, `HumanColliders.placed`, `physicalShapeSegmentDistance` and `physicalShapeNormal`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
