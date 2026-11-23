# src/geometry/boundAutoMovieConvexSeparation.ts#boundAutoMovieConvexSeparation

## @evidence contracts/development/implementation.md#principled-implementation

The separating-axis bound by Cauchy-Schwarz over outward-rounded projection intervals, owned by `boundAutoMovieProjectionSeparation`; candidate axes are face normals of vertex triples, scaled by their largest coordinate difference so the cross product cannot overflow needlessly, plus closest-pair displacements, and since any nonzero axis gives a valid bound, the rounding of a proposal never weakens the proof.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This function only proposes directions and keeps the best bound; projection arithmetic lives in `boundAutoMovieProjectionSeparation` and closest pairs in `closestPointsBetweenSegments`, so the separation query, attachment contact and this bound share one enclosure owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance, sampled distance or nearest corner turns a touch into a pass, and the resident triangle's normal is tried first only because it is the cheapest likely proof, which changes cost and never the admitted answer.

## @evidence contracts/development/common.md#meaningful-documentation

States the admitted hulls, the units and ownership, why the bound is sound, every refusal, the candidate order, what zero does not mean, the early-stop contract of `sufficient`, and what `spend` is charged for.

## @evidence contracts/development/implementation.md#efficient-algorithms

For vertex counts n and m, triples cost C(n,3) + C(m,3) directions and pairs C(n,2) times C(m,2) closest-point solves, each followed by an O(n + m) projection, so the worst case is quartic in the larger run; features are three-vertex fans or short shaft rings, the resident run is one triangle whose single normal usually proves the target first, and `spend` lets the caller cap the total.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of two runs; the separation query reuses its compiled triangles across calls, and verdict reuse belongs to the ribbon fit.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates only short-lived direction vectors and closest-point records per candidate and keeps one running scalar; nothing outlives the call, which returns a number.
