# src/geometry/AutoMovieSpatialCandidates.ts#AutoMovieSpatialCandidates.read

## @evidence contracts/development/implementation.md#principled-implementation

Visits an admitted hierarchy using the same closed overlap test for a branch and its entries. Identity coordinates mean actual overlap, and the public caller can supply its monotone cell coordinate for the existing neighbourhood query.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The result is the same qualifying population for ordered and hierarchy-order callers. The caller separately decides which elements need the shared-cell rank.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Returns the original entries and includes equality at closed box boundaries, with no expanded boxes, approximate overlap or altered ordinals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits an admitted hierarchy once per subject, prunes disjoint branches, and appends only qualifying entries without an additional sorting pass.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call has its own subject and reads the caller-owned prepared hierarchy.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The pending stack is local to one walk. The returned array holds references to just the qualifying entries.

## @evidence contracts/development/common.md#meaningful-documentation

States the coordinate choice and that the result follows hierarchy order.

# src/geometry/AutoMovieSpatialCandidates.ts#AutoMovieSpatialCandidates.compare

## @evidence contracts/development/implementation.md#principled-implementation

Along an axis, the first shared cell is the maximum of the two lower cell indices. Chooses the lower rank by lexicographic X/Y/Z order and then ordinal, exactly as the public collector does.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar comparator ranks candidates for the ordered collector or the existing strict witnesses for the pure self census.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Compares ranks with inequalities before the ordinal tie-break. Equal infinite cell indices remain ties rather than being subtracted into NaN.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most three axes and no allocation per comparison.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The three ranked entries and positive cell width belong to the current comparison.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a scalar without retaining the entries or allocating a result.

## @evidence contracts/development/common.md#meaningful-documentation

States shared-cell XYZ rank and ordinal tie-break.
