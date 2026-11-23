# src/geometry/construction/sampleAutoMovieConstructionCurves.ts#sampleAutoMovieConstructionCurves

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates the realized surface map itself: a section is its iso-station curve at a principal layer, a guide its iso-phase curve at a quarter phase, the axis the mean of each ring's samples. The premises are the realizer's: every chain has a surface of its name, whose phase has period `2 pi`, and layer stations increase strictly. Phase `k` of `n` is computed as `(pi / 2) (4 k / n)`, so the quarter samples sit at exactly `q pi / 2`, which are the guide phases a view-lofted section touches its box at. Each polyline is a chord approximation with no stated error bound, and the sample mean leans toward the side of a ring where equal phase steps are shorter.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Option admission and one surface index by name here, then one helper per responsibility: `sampleChain` assembles a chain's curves, `stationsOf` lists its stations, `sampleRing` evaluates one ring. Sections, guides and axis are three readings of the same ring, so they cannot disagree about a sample.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both densities are caller parameters with documented defaults and the unit change is the kernel's shared `SCALE`. A non-finite sample is left out and flagged instead of replaced by a neighbour or zero, a chain without a surface is refused instead of skipped, and no chain name or node kind is treated specially.

## @evidence contracts/development/common.md#meaningful-documentation

States the chart and units read, each kind's stations and phases, the id of each curve, what the axis is and is not, the flag and omission rules, the output order and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

A chain with `L` layer intervals in range costs `(L steps + 1) phases` surface evaluations, 3120 at the defaults for eight intervals, and each evaluation costs what the surface's own evaluator costs, which dominates. One ring per station serves the section, the four guides and the axis, so guides add no evaluations. Surfaces are found through one map by name. Space is one ring buffer per chain plus the returned points.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call samples the realization it is given and keeps nothing between calls, so a caller that draws the curves twice keeps the first list.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The name index and the ring buffer are local to one call. A surface may lend the vector it returns, so each sample's components are copied before the next evaluation, and the returned curves hold numbers only, with no reference to the realization.
