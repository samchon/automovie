# src/geometry/construction/AutoMovieConstructionSplitConormal.ts#AutoMovieConstructionSplitConormal

## @evidence contracts/development/implementation.md#principled-implementation

Both branches read the same exact seam tangent and the same transverse direction. At each fork the cross product of the original parent's normal and the seam tangent supplies this direction. In the interior the divider's unit normal supplies it. A quintic step with zero first and second endpoint derivatives interpolates across the declared corner width. The support stops at the seam's midpoint when both fork windows would overlap.

Each branch supplies the signed projection of its existing cross ribbon at the two forks and its own physical speed at the midpoint. The signed gain retains its sign by convex interpolation. The tangential gain vanishes off the fork support. Both branches therefore span the same tangent plane as their loop clocks traverse the common seam in opposite directions.

The quintic Hermite start-derivative weight `s(1 - s)^3(1 + 3s)` follows from the six endpoint value, slope and second derivative conditions. It installs that transverse germ and preserves the original rail jet. Differentiating the seam's cubic gives its third arclength derivative only where the transverse correction needs it. This is a local Hermite constraint in the sense of the published branching construction. [Gabrielides et al.](https://users.math.uoc.gr/~mkaravel/files/papers/bransurf.pdf)

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Each curved seam prepares its own fork vectors once. Each incident branch reads the prepared plane and its own strip coefficients. The line reader supplies the tangent, curvature and requested piecewise curvature derivative at the actual clock.

## @evidence contracts/development/implementation.md#efficient-algorithms

The original seam solve serves the position and both derivative reads. Baseline cross jets read the four active periodic cubic controls. The transverse correction adds a fixed number of scalar and vector operations per seam query.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No independent per-branch normal fit, numerical differentiation, mesh normal replacement or broadened admission threshold supplies the match. A cross direction that turns against its own parent fork is refused.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The realization owns the two fork vectors and the strip's original coefficient rows. No geometry result is kept across invocations.
