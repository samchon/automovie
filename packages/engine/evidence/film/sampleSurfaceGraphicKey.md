# src/film/sampleSurfaceGraphicKey.ts#sampleSurfaceGraphicKey

## @evidence contracts/development/common.md#meaningful-documentation

States the inclusive key rule, the independence from earlier samples and the refusal of a negative or non-finite time.

## @evidence contracts/development/implementation.md#principled-implementation

Upper-bound search finds the first key strictly after the sample; its predecessor is the key in force, which exists because admission opens every track at zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads only key times and returns an index, so render can toggle the group it prebuilt for that key.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No interpolation or playback state participates; a seek and a sequential run read the same key.

## @evidence contracts/development/implementation.md#efficient-algorithms

Logarithmic in the key count with constant space.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Borrows the admitted key order instead of building an index to retain.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only an integer escapes.
