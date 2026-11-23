# src/geometry/curve/tessellateAutoMovieContourStrip64.ts#tessellateAutoMovieContourStrip64

## @evidence contracts/development/implementation.md#principled-implementation

Two interior-progress bits exclude repeated modulo crossedges on simple rings. Best-first conflict search reuses this recurrence as a lower-bound solver: duplicate-face and overfull-edge conflicts forbid at least one contributing transition; a residual link failure excludes its complete current path. A proven invalid or physically collapsed boundary prunes impossible qualification. Zero-area transitions retain the periodic walk without merging sheet identities; publication omits only those primitives and preserves the finite remainder with explicit unqualified diagnostics.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two oriented walks and a triangle receiver define the operation; vertex identity belongs to the receiver.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Sheet keys or object identity define topology; no coordinate weld, density compensation, original mesh or shading normal repairs a tiling. Quality failure preserves finite indexed positive-area geometry and its observer diagnostics; an unrepresentable primitive is not declared qualified.

## @evidence contracts/development/common.md#meaningful-documentation

States seam selection, branch support, zero-slit partial finite publication and omitted primitive counts, optional observation and timing, and the absence of a global cyclic or fold guarantee.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each constrained four-state grid costs O(nm), followed by expected O(n+m) admission. Simple rings need one solve. For Q subproblems of maximum constraint depth D, work is O(Q(nm+DlogD+logQ)); retained paths and constraints cost O(Q(n+m+D)), with one O(nm) grid per solve. D is at most the transition count. Exhaustive slit search can be exponential and has no implicit geometric budget.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Tile areas and sheet identities are shared by every constrained solve; each grid is evaluated once and reused during its backtrack. Equivalent forbidden-transition sets are not solved twice.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Grids expire after each solve, and the per-strip heap, paths and graph maps expire after success or failure; no global cache is retained.
