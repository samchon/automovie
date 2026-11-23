# src/geometry/sweep/locateAutoMovieSweepPoint.ts#locateAutoMovieSweepPoint

## @evidence contracts/development/implementation.md#principled-implementation

Inverting a sweep's section-plane family by bracketing and bisecting the point's signed plane distance along the spine, the standard root finding for a monotone or piecewise monotone scalar, and reading the direction as the polar angle in the plane the forward map uses.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Uses the surface's frame and polar radius queries, including carried orientation and station turns, within the admitted direction-correspondence domain.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Candidate ranking and endpoint fallback are explicit sampled-search policies; nonfinite points and unsupported parameter correspondence throw rather than returning a false inverse.

## @evidence contracts/development/common.md#meaningful-documentation

States the sampling, the bracketing and bisection, the choice among planes, the end rule, the direction convention and the offset's sign.

## @evidence contracts/development/implementation.md#efficient-algorithms

128 frame queries to bracket, 48 per bracket to refine, and one radius query per candidate; independent of the sweep's resolution.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call locates one point; callers locating many keep the compiled surface.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
