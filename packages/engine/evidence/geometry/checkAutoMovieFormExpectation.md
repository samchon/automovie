# src/geometry/checkAutoMovieFormExpectation.ts#checkAutoMovieFormExpectation

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates each stated field with the measure that owns it: extents from the placed positions, pieces and genera from `measureAutoMovieMeshPieces`, solid and empty points from `createAutoMovieMeshWindingQuery`, and pairs from `measureAutoMovieModelContacts`. The shape fields then run on the form's axis-aligned box and convex hull, the two stand-ins a weak expectation cannot tell from the form, so a passing expectation is shown to be able to fail.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission, merging, the per-subject shape evaluation, the pair evaluation and the two mutant builders are separate private steps; placement is the shared `placeAutoMovieModelPartMesh` and the hull the shared `buildAutoMovieConvexHull`, so no measure is reimplemented here.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Ranges are inclusive as the record states, genera are compared exactly after sorting, and no tolerance of its own is introduced. A pair naming a missing part or one part twice, and pairs without a contact distance, are refused rather than read as a passing or failing pair.

## @evidence contracts/development/common.md#meaningful-documentation

States how parts are placed and merged, which measure answers each field, how mutants are built and when they are loose, the pass rule, and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Merging and extents are linear in vertices. Pieces are near-linear in triangles. Each solid or empty point costs one pass over the subject's triangles. Pairs cost one contact report, run only when pairs are stated. The hull mutant runs `physicalHullFaces` on every placed vertex, O(V^2) in its extent step, and is built only when a shape field is given.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The merged form mesh and its vertex list are built once and shared by the form evaluation and both mutants; each subject builds one winding query for all its points and one piece census for pieces and genera.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the merged mesh, the vertex list, two mutant meshes and one winding snapshot per subject for the call, all released on return; the result holds only findings and loose mutants.
