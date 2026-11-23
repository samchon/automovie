# src/physics/physicalShapeGjk.ts#physicalShapeGjk

## @evidence contracts/development/common.md#meaningful-documentation

States the solids as cores widened by radii, the cast as the union of two placements' cores, both bounds and why each holds, the floor's early stop, and the convergence criterion.

## @evidence contracts/development/implementation.md#principled-implementation

Gilbert, Johnson and Keerthi's distance iteration on support points, the simplex's nearest point by its Voronoi regions (Ericson 2005, 5.1.5 and 5.1.6); the upper bound is the nearest simplex point's norm and the lower bound the support plane's distance, v . w / |v|, which every point of the cores' difference lies beyond.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop: a support pair, the bounds, the stop tests, the simplex's nearest point; segment, triangle and tetrahedron cases in their own functions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No iteration count: it stops when the bounds' gap is under a nanometre (the audits' own recording threshold), when the caller's floor is settled, or when an iteration brings the simplex no nearer the origin, which exact arithmetic always does; where the cores meet it gives no lower bound rather than a guessed depth.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each iteration scans both cores' points once; the simplices are subsets of the finitely many vertex differences and the nearest distance strictly falls, so the iterations are bounded by the cores' vertex pairs, in practice a handful; the floor stops it as soon as a caller's question is answered.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of two solids; callers keep the solids they read again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds only the simplex of the current call and returns a fresh pair of numbers.
