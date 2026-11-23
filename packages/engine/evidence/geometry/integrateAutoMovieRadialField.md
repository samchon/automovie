# src/geometry/integrateAutoMovieRadialField.ts#integrateAutoMovieRadialField

## @evidence contracts/development/implementation.md#principled-implementation

Equal radii turn strongest q^power support into a power-diagram half-plane partition including signed site-plane distances; Green's theorem and radial divergence primitives integrate each cell boundary, with four-node Gauss exact for interior degree-six polynomials in real arithmetic and angular exterior flux. Convexity and well-scaled finite arithmetic remain premises.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pure field integral returns scalar and gradient area integrals; site enumeration, physical domains, materials and image normalization remain caller responsibilities.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses actual polygon/site coordinates and no fixed point-sampling grid, per-consumer constants or expected-output tables; a 512-site work cap rejects explicitly and finite scalar roundoff is clamped to its analytic [0,area] range.

## @evidence contracts/development/common.md#meaningful-documentation

Defines common coordinate units, site-plane offset, q^power strongest-site meaning, area/gradient units, degeneracies, precision limits and the explicit work cap.

## @evidence contracts/development/implementation.md#efficient-algorithms

With S sites and V input vertices, conservative O(S²(V+S)) clipping time and O(V+S) per-cell live polygon storage bound this direct nearest-site partition; actual callers prefilter sphere bounds before this at-most-512-site operation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This pure operation coordinates no persistent requests; caller-owned prepared site lists may be reused without changing the integral.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Working cell polygons and quadrature closures are call-local; the caller owns only the returned scalar/gradient record.
