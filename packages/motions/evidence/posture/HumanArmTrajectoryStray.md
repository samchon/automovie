# src/posture/HumanArmTrajectoryStray.ts#HumanArmTrajectoryStray.IStray

## @evidence contracts/development/common.md#meaningful-documentation

States each member and its unit.

## @evidence contracts/development/design.md#principled-representation

A rigid segment's origin stray and rotation-matrix stray, so any point's stray is the first plus its reach times the second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the swept readings and the casts widen by.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/posture/HumanArmTrajectoryStray.ts#HumanArmTrajectoryStray.IArm

## @evidence contracts/development/common.md#meaningful-documentation

Names the arm's three segments' strays.

## @evidence contracts/development/design.md#principled-representation

One stray per rigid segment.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What a neighbour carries for its interval.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/posture/HumanArmTrajectoryStray.ts#HumanArmTrajectoryStray.arm

## @evidence contracts/development/common.md#meaningful-documentation

States the interval, the placements read and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The cubic's interpolation error within a frame step, h^2 p'' / 8 with h^2 p'' read as the second difference of the origin and of the rotation matrix over the waypoints about each frame; a point's stray from its step chord is the origin's plus its reach times the matrix's (Frobenius bounds the operator norm).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three segments, one pass over the interval's frames each.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The course itself is read through every frame of the interval, so only the step's interpolation error is widened by, never a guessed margin.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per frame of the interval, read once per interval per reading.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The evaluation keeps each interval's strays for every reader of that reading.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records and retains nothing.

# src/posture/HumanArmTrajectoryStray.ts#HumanArmTrajectoryStray.of

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

A rigid point's stray: the origin's plus its reach times the rotation's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number.

# src/posture/HumanArmTrajectoryStray.ts#HumanArmTrajectoryStray.shape

## @evidence contracts/development/common.md#meaningful-documentation

States why a moving shape strays a carried course within a step, the bound and the still case.

## @evidence contracts/development/implementation.md#principled-implementation

Each frame's place is carried exactly by the shape's own motion; within a step the shape's course stands off its chord by its pose's interpolation error, an eighth of the second difference of its origin and rotation matrix, read as an arm segment's is.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the interval's frame steps.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A shape that is not the same segment at both ends of a step is read as still, as the pairs carry it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per frame step of the interval.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of the context's frames, computed where it is read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record and retains nothing.
