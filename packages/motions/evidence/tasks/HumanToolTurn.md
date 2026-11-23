# src/tasks/HumanToolTurn.ts#HumanToolTurn

## @evidence contracts/development/common.md#meaningful-documentation

States what is turned, the frames and units of every input and the turn's sense.

## @evidence contracts/development/implementation.md#principled-implementation

A rigid rotation about a line: the grip goes to `about + q (grip - about)` and the hand's rotation to `q r`, with `q` the axis-angle quaternion, so the tool turns with the hand as one body.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The axis is prepared once; each turn is one quaternion, one rotated offset and one product.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The pose and the pivot are read at each call, so the turn is always of the pose the caller holds.

## @evidence contracts/development/implementation.md#efficient-algorithms

The axis's normalisation is done once for every turn (`Quaternion.prepareAxisAngle`); each turn costs constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each turn is its own angle's; nothing is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader holds the pose, the axis and the pivot until the plan that owns it is dropped; each result is fresh.
