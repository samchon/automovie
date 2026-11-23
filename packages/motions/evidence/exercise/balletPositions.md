# src/exercise/balletPositions.ts#balletPositions.feet

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the placements.

## @evidence contracts/development/implementation.md#principled-implementation

Heel points in the floor frame at the entry's feet's midpoint, each foot pivoted flat about its heel to its turned-out heading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Frame, heels, centring, placements.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The relations are the position's; nothing is fitted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The foot's pivot and frame readers.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/exercise/balletPositions.ts#balletPositions.risen

## @evidence contracts/development/common.md#meaningful-documentation

States the pivot.

## @evidence contracts/development/implementation.md#principled-implementation

The foot pivots about its ball, so the metatarsal heads stay down.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pivot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The foot's pivot.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/exercise/balletPositions.ts#balletPositions.drop

## @evidence contracts/development/common.md#meaningful-documentation

States the closed form.

## @evidence contracts/development/implementation.md#principled-implementation

The law of cosines over the thigh and the shank.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

None needed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/exercise/balletPositions.ts#balletPositions.hips

## @evidence contracts/development/common.md#meaningful-documentation

States the read.

## @evidence contracts/development/implementation.md#principled-implementation

The root plus the rest hips turned by the heading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The posture's heading reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/exercise/balletPositions.ts#balletPositions.course

## @evidence contracts/development/common.md#meaningful-documentation

States the course's phases.

## @evidence contracts/development/implementation.md#principled-implementation

Feet keyed into the position, the movement a minimum-jerk share between beats moving the hips and, in a relevé, the feet about their balls.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Placements, movement share, keys, hips.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The beats are the clock's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per sample after a beat lookup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The shared placements and footwork.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The course retains its placements.
