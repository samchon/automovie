# src/exercise/WorkoutStance.ts#WorkoutStance

## @evidence contracts/development/common.md#meaningful-documentation

States each input and the default.

## @evidence contracts/development/implementation.md#principled-implementation

Fixes the two members every standing kind shares, the base and the `stance` anchor, so a table row states only what differs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/exercise/WorkoutStance.ts#WorkoutStance.rest

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the event names.

## @evidence contracts/development/implementation.md#principled-implementation

The body's relaxed standing key (`ExerciseKey.standing`); a stance kind stays on its feet, so the step needs no identity with the workout's own standing key.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/exercise/WorkoutStance.ts#WorkoutStance.split

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the unit and what the result is used as.

## @evidence contracts/development/implementation.md#principled-implementation

The pelvis's height over the back foot is the leg's length times the lean's cosine; over the front foot it is the shank plus the thigh times its angle's cosine; the two are equal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One arccosine.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A lean past what the thigh can make up clamps at a level thigh.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/exercise/WorkoutStance.ts#WorkoutStance.straight

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

The same equality of the pelvis's height over the two feet, solved for the straight leg.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One arccosine.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/exercise/WorkoutStance.ts#WorkoutStance.stride

## @evidence contracts/development/common.md#meaningful-documentation

States each input and which leg is which.

## @evidence contracts/development/implementation.md#principled-implementation

Each hip takes the trunk's pitch plus its thigh's angle, and the back ankle its leg's lean, so both feet stay level on the floor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One solved angle and one key.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `split`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
