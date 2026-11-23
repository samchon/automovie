# src/film/samplePracticalSurfaceTrackMaterial.ts#samplePracticalSurfaceTrackMaterial

## @evidence contracts/development/common.md#meaningful-documentation

States the admission and shot-clock premises and the inclusive key boundary.

## @evidence contracts/development/implementation.md#principled-implementation

Upper-bound search finds the predecessor of the first key strictly after the sample. An admitted track begins at zero, so that predecessor exists at every in-shot time.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The search reads only the key times, then returns the selected material id.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No interpolation or elapsed playback state participates in material selection.

## @evidence contracts/development/implementation.md#efficient-algorithms

Logarithmic search with constant auxiliary space.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Borrows the admitted key order rather than deriving a separate index to retain.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the selected id escapes the call.
