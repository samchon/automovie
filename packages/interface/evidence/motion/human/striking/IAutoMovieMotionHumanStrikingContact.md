# src/motion/human/striking/IAutoMovieMotionHumanStrikingContact.ts#IAutoMovieMotionHumanStrikingContact

## @evidence contracts/development/common.md#meaningful-documentation

pose: The posed frame of the segment that carries the shape, world metres.

## @evidence contracts/development/design.md#principled-representation

pose: The posed frame of the segment that carries the shape, world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: reaction/knockdown.ts (knockdown.shapes, return); reaction/knockdown.ts (knockdown.lowest, colliders); reaction/knockdown.ts (knockdown.bottom, c); striking/StrikingBody.ts (StrikingBody.colliders, return); striking/StrikingContact.ts (StrikingContact.distance, shape); striking/StrikingContact.ts (StrikingContact.nearest, shapes).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieRigidTransform, IAutoMoviePhysicalShape identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/striking/IAutoMovieMotionHumanStrikingContact.ts#IAutoMovieMotionHumanStrikingContact.ICollider

## @evidence contracts/development/common.md#meaningful-documentation

Each variant and member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The profile's own shape with the posed frame of the segment that carries it, so every kind the profile can hold is posed one way and no second shape vocabulary exists.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shape, its segment's pose and the bone name a verdict reports.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the interface's shape and transform.

# src/motion/human/striking/IAutoMovieMotionHumanStrikingContact.ts#IAutoMovieMotionHumanStrikingContact.INearestResult

## @evidence contracts/development/common.md#meaningful-documentation

name: Name of the nearest physical shape, as supplied by the queried shape collection. distance: Signed queried-point-to-shape distance, metres; negative inside the shape.

## @evidence contracts/development/design.md#principled-representation

name: Name of the nearest physical shape, as supplied by the queried shape collection. distance: Signed queried-point-to-shape distance, metres; negative inside the shape.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: striking/StrikingContact.ts (StrikingContact.nearest, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in StrikingContact.nearest.
