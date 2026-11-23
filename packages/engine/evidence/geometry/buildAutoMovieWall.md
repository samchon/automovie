# src/geometry/buildAutoMovieWall.ts#buildAutoMovieWall

## @evidence contracts/development/implementation.md#principled-implementation

Sorted distinct opening edges partition the wall into rectilinear cells classified at their centres; emit faces only between standing and removed/outside cells, the boundary of their union. Admission excludes overlaps and corner pinches, while binary64 midpoint arithmetic and the downstream weld grid limit representable detail; finite scalar admission alone is not an arbitrary-scale topology certificate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission, the lattice and face emission are one pass each in this function, with `pushCellFace` deriving each face's corner order from its axis so no hand-written corner table can drift from the winding.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Pinched and overlapping openings are refused by name instead of being nudged apart or merged, and corners come from shared lattice values rather than from rounded per-cell centres.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and extent, why hidden faces are dropped, the exact-weld rule, why there are no UVs and what to use instead, every refusal and that admission precedes output.

## @evidence contracts/development/implementation.md#efficient-algorithms

For k openings the lattice has at most (2k+1)^2 cells; overlap admission is O(k^2), cut sorting O(k log k), standing classification O(k) per cell and emission constant per cell. The worst case is cubic in openings, with no workload cap or measured speed claim.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One mesh per wall description; a caller placing identical walls can keep the returned mesh.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns new position, normal and index arrays bounded by six quads per standing cell; the id set, cut lists and standing flags are released on return.
