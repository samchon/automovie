# src/sport/SwimStroke.ts#SwimStroke.strokes

## @evidence contracts/development/common.md#meaningful-documentation

States the input and that the values are provisional.

## @evidence contracts/development/implementation.md#principled-implementation

Exercise keys on the body (`ExerciseKey.from`), so what a key leaves unstated is the body's own standing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One table.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `ExerciseKey.from`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/sport/SwimStroke.ts#SwimStroke.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The second gives the cycle and the place in it; the two keys around that place are blended in joint space on minimum-jerk progress and pinned by the hip joints on the point the plane carries along.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The cycle's times, the travelling point, the posture, the events.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The staged speed is divided by the tempo that stretches the keys. The stationary option fixes the hip target for an external translation model. A stroke of one key is held.

## @evidence contracts/development/implementation.md#efficient-algorithms

Every stroke read, including a stationary single key, performs actual canonical admission and pin FK with only the pin hips' ancestry requested. Fixed key-pair union preparation retains the original interpolation and pin mean.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only fixed key pairs and ordered joint unions are shared; every actual query constructs and pins its current key instead of replaying a completed posture.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns its selected stroke row and fixed key-pair readers until released, without storing a completed pinned posture or queried-time cache.
