# src/animals/AutoMovieArchetypeEquineCare.ts#AutoMovieArchetypeEquineCare.IPoints

## @evidence contracts/development/common.md#meaningful-documentation

States what each member gives.

## @evidence contracts/development/design.md#principled-representation

The affordances and a frame reader.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `of`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineCare.ts#AutoMovieArchetypeEquineCare.IPoints.frame

## @evidence contracts/development/common.md#meaningful-documentation

World frame; refuses an unknown id.

## @evidence contracts/development/implementation.md#principled-implementation

The rest frame moved by its part's change from rest to the sample, then placed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One part lookup, two compositions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unknown id refuses.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the sample's parts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Rest frames are prepared once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/AutoMovieArchetypeEquineCare.ts#AutoMovieArchetypeEquineCare.of

## @evidence contracts/development/common.md#meaningful-documentation

States the input and output.

## @evidence contracts/development/implementation.md#principled-implementation

Each point is on its part's surface: the trunk capsule's side at the middle of its axis, the head capsule's dorsal surface at the poll, and each pastern bar's axis at its middle, a round handle of the bar's diameter facing out.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record per point, built from the part it lies on.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the parts, once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The rest part frames serve every posed read.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the care records and rest part frames.
