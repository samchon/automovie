# src/geometry/construction/AutoMovieConstructionSplitCompose.ts#AutoMovieConstructionSplitCompose.basis

## @evidence contracts/development/implementation.md#principled-implementation

The stations advance along `v x u` of a section's frame, so the signed product is the direction out of an end.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three normalizations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A degenerate frame returns null; no default axis is substituted.

## @evidence contracts/development/common.md#meaningful-documentation

States the axes and the null case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure conversion coordinates no work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record.

# src/geometry/construction/AutoMovieConstructionSplitCompose.ts#AutoMovieConstructionSplitCompose.cut

## @evidence contracts/development/implementation.md#principled-implementation

Each plane is carried from its named frame into kernel coordinates and the rail is the child's skin on their common kept region (`AutoMovieConstructionSkinCut`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Frame, planes, then the cut.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A zero normal and every refusal of the cut are returned with the child's name.

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

The cut's own cost.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One cut per child coordinates no shared work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the caller-owned cut.

# src/geometry/construction/AutoMovieConstructionSplitCompose.ts#AutoMovieConstructionSplitCompose.derive

## @evidence contracts/development/implementation.md#principled-implementation

Sections, composition, the ring's crossings with each seam plane by sign change and bisection, then the offset wedge's cut of each child.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Four steps in the order their results are needed.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses a section not admitted in the plane, every refusal of the composition, a seam plane that does not cross the ring twice, forks that do not nest and every refusal of a rail; no phase is authored or snapped. Two ring crossings between two of the ring's samples are not seen.

## @evidence contracts/development/common.md#meaningful-documentation

States each step and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Per child two cuts; per seam one pass round the ring at eight samples per band column and two bisections.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each seam plane serves its host forks and both neighbours' rails.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the caller-owned record; the sections are released.
