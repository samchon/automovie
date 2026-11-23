# src/geometry/subdivideAutoMovieSurface.ts#subdivideAutoMovieSurface

## @evidence contracts/development/implementation.md#principled-implementation

Uniform Catmull-Clark refinement with the Hoppe boundary and crease rules and the semi-sharp extension of DeRose, Kass and Truong (1998), limit masks from Halstead, Kass and DeRose (1993) and the crease cross tangent of Biermann, Levin and Zorin (2000), and eigenvectors of the local subdivision matrix where those masks do not apply; every rule is an affine mask evaluated in a fixed order, which is what makes the output deterministic. The stated approximations are crease sides of one or of four or more faces, where the standard rules leave no tangent plane containing the crease.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission, one-level refinement and limit evaluation are separate functions over one level record; this function owns the level loop, the per-vertex parameter choice and the output layout.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No caller-specific rule or tolerance; a vanishing normal is refused rather than replaced, and the cage is never repaired.

## @evidence contracts/development/common.md#meaningful-documentation

States the rules applied at boundaries, creases and corners, that limit results do not depend on the level and the exceptions, the UV and determinism guarantees, every refusal, and the growth per level that bounds the level.

## @evidence contracts/development/implementation.md#efficient-algorithms

For `F` cage corners and `L` levels, each level is linear in its size and the last has about `F * 4^(L - 1)` quads, so time and space are dominated by the final level, at most `1024 F` quads under the six-level cap; the limit adds one point refinement of that level and a bounded ring iteration per vertex, plus a fixed eigenvector iteration, quadratic in the ring size, at each dart or three-face crease side.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each level is computed once from the previous one, and the limit reuses one shared point refinement for every vertex.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the current level is held while refining; the returned surface owns arrays linear in the final level and nothing else is retained.
