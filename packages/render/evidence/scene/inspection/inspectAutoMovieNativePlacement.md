# src/scene/inspection/inspectAutoMovieNativePlacement.ts#inspectAutoMovieNativePlacement

## @evidence contracts/development/common.md#meaningful-documentation

States the authority order, the displayed-matrix check, the identity of each finding and the camera's own rules.

## @evidence contracts/development/implementation.md#principled-implementation

Validates exactly the values Three draws from: the manual matrix that overrides stale components, or the components, then the composed world matrix.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One traversal over visible nodes plus the camera, one field list per node and one finding per field.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No matrix is recomposed, and a world matrix broken only by an invalid local field is reported once, at that field.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per visible node, plus the identity walk for each failing node only.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the world matrices the host settled and the shared entity identity.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Appends plain findings and keeps no reference to the scene.
