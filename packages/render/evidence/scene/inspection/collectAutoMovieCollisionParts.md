# src/scene/inspection/collectAutoMovieCollisionParts.ts#collectAutoMovieCollisionParts

## @evidence contracts/development/common.md#meaningful-documentation

States which drawn object yields which geometry authority, how parts are named and when a surface is posed.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the drawn world and instance matrices, the generator's slot, cord and assembly records, and the shared entity path for identity.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One traversal dispatches each drawn object kind to one reader module.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nesting and names grant no group; a built rigid model groups its parts only while each still holds its built placement. A clash with a source-declared path is refused rather than renamed by time.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits visible nodes once and names meshes with one frontier memo per layer.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Readers share cached topology and box proofs; surfaces are posed only on demand.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned closures borrow the placed meshes for the current observation only.
