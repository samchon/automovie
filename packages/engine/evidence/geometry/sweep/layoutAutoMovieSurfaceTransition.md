# src/geometry/sweep/layoutAutoMovieSurfaceTransition.ts#layoutAutoMovieSurfaceTransition

## @evidence contracts/development/implementation.md#principled-implementation

The 2-to-1 quad reduction strip of subdivision modelling, which changes a ring's count with quads only in one row, keeps the fine ring regular and puts its valence-three poles inside the band, combined with straight columns for ratios below two; blocks spread by centred rounding. A 3-to-1 strip among straight columns was measured worse on a cylinder, 1.6 percent radial and 5.9 degrees against 1.0 and 4.0 at 8 to 16 columns.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pure topology and patch coordinates; the network rig turns corners into vertices on the sweep.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Counts the strip cannot join, an odd difference or more than a halving, are refused instead of being joined by triangles, n-gons or a crease; a larger change chains two bands.

## @evidence contracts/development/common.md#meaningful-documentation

States the rows, the pattern, every extraordinary vertex and its valence, why the coarse ring is not regular, the ring spacing, the interior positions, the shear, the symmetry and its exception, and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(rows x F) quads, each constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per band per rig compile.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the quad list is transferred to the caller.
