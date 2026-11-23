# src/geometry/pushFlatTriangle.ts#pushFlatTriangle

## @evidence contracts/development/implementation.md#principled-implementation

The face normal is the normalized cross product of two edge vectors, which is the plane normal of any non-degenerate triangle and follows the corner order by the right-hand rule; the loft passes non-degenerate corners because its sections are validated regions with nonzero edges and its path points are distinct, and a zero-area triangle keeps the zero normal `Vector3.normalize` returns rather than an invented direction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper for the flat-shaded side walls of `meshAutoMovieSweep`, writing into the shared `IAutoMovieMeshTarget` that `emptyMeshTarget` creates, so the caller only chooses corner order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Corners are never shared with neighbouring triangles to save vertices, because a shared corner would average two plane normals; no orientation is flipped or repaired here.

## @evidence contracts/development/common.md#meaningful-documentation

States why corners are not shared, the normal formula and its winding rule, the zero-area result, and each parameter's unit and order.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per call: one cross product, one normalization, twenty-four position/normal/UV values and three indices; a loft with S ring edges and P path legs calls it 2SP times, linear in its output.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each triangle's corners and normal are its own by design, so nothing is shared between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing itself; the appended values live in the caller's target, which grows by three vertices and one triangle per call and is handed to the returned mesh.
