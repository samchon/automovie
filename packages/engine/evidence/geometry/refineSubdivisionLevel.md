# src/geometry/refineSubdivisionLevel.ts#refineSubdivisionLevel

## @evidence contracts/development/implementation.md#principled-implementation

Catmull-Clark connectivity, one quad per parent corner, with the uniform sharpness decrement of DeRose, Kass and Truong (1998); parameter midpoints and centroids are exact because a refined quad's parameter square is the bilinear quarter of its parent's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Coordinates the point, UV and topology steps for one level, so each of those owns only its own rules and this function owns child numbering and parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every face is treated alike apart from the documented sub-face split of the cage's non-quads.

## @evidence contracts/development/common.md#meaningful-documentation

States the child face layout and winding, the sharpness of child edges, and how parameters refine.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the parent's corners, edges and vertices plus the child topology build, which is linear in the child's four corners per parent corner.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The vertex masks from the point step are reused by the UV step.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the child level, about four times the parent's corners; the parent is not retained.
