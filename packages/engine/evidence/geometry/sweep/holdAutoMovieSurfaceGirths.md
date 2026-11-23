# src/geometry/sweep/holdAutoMovieSurfaceGirths.ts#holdAutoMovieSurfaceGirths

## @evidence contracts/development/implementation.md#principled-implementation

The limit along a regular isoline is the tensor-product B-spline's isoline, measured by Gauss-Legendre quadrature; the correction is a smooth radial scale along the spine whose knot values solve the coupled perimeter equations by Broyden's quasi-Newton method from a diagonal proportionality guess that is exact only under the stated uncoupled conditions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validation, the regular-row check, the measurement and the iteration are one pass each; the factor lives in the sweep rig's scale, so samples, probes and poses read it without change.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A ring through an extraordinary vertex, where the isoline is not the B-spline, is refused instead of measured approximately; a solve that does not converge is refused.

## @evidence contracts/development/common.md#meaningful-documentation

States the ring's requirements, the measurement, the factor's knots and ends, the iteration, its exactness and its tolerance.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N network rings, F faces, R girth-row vertices and G girth constraints: O(N) admission, O(F) adjacency and O(N G) anchor discovery, then at most 24 rest fits plus O(R) quadrature, factor-knot preparation and O(G^3) dense solve per fit. Without girths only the initial ring filter runs. Positive-step backtracking is bounded by representable halving and refuses non-finite steps.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Runs once per rig compile; the factor it leaves is what every pose reuses.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains no state after return; temporary adjacency, row controls and dense solve arrays cost O(V + F + R + G^2) for V cage vertices, plus ring/profile records, and are released on completion or refusal. The sweep rigs own the installed scale factors.
