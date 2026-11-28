# src/curves/AutoMovieRecoveryConicApproximation.ts#AutoMovieRecoveryConicApproximation.cubicCriticalParameters

## @evidence contracts/development/common.md#meaningful-documentation

The caller contract gives four planar Bernstein controls, normalized phase and preservation of distinct roots.

## @evidence contracts/development/implementation.md#principled-implementation

Cubic first and higher derivatives give polynomial conditions for geometric events. Those conditions are solved and filtered in the cubic's interior phase, preserving its original chart and distinct representable roots.

## @evidence contracts/development/implementation.md#efficient-algorithms

The degree and maximum candidate population are fixed for one cubic. No source callbacks or geometry samples are required.

# src/curves/AutoMovieRecoveryConicApproximation.ts#AutoMovieRecoveryConicApproximation.evaluate

## @evidence contracts/development/common.md#meaningful-documentation

The caller contract gives the normalized parameter, two unit endpoint weights, one positive middle weight and the output's millimetre plane.

## @evidence contracts/development/implementation.md#principled-implementation

Quadratic Bernstein weights are multiplied by the stored middle weight before evaluating homogeneous coordinates. The common denominator is positive over the normalized chart and division returns the rational point.

## @evidence contracts/development/implementation.md#efficient-algorithms

The routine computes three fixed weights and one denominator to use for both coordinates. It allocates one coordinate pair.

# src/curves/AutoMovieRecoveryConicApproximation.ts#AutoMovieRecoveryConicApproximation.distance

## @evidence contracts/development/common.md#meaningful-documentation

The method describes Euclidean distance between two planar millimetre points in the same frame.

## @evidence contracts/development/implementation.md#principled-implementation

The coordinate differences form the displacement vector. The Euclidean norm gives its length in the original units.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two differences and one hypot suffice. The operation has no retained state.

# src/curves/AutoMovieRecoveryConicApproximation.ts#AutoMovieRecoveryConicApproximation.cross

## @evidence contracts/development/common.md#meaningful-documentation

The method states signed planar determinant and the positive orientation convention.

## @evidence contracts/development/implementation.md#principled-implementation

For two ordered planar vectors, the 2 by 2 determinant is signed parallelogram area. Exchanging vector order negates the result.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two products and their difference compute the determinant directly.

# src/curves/AutoMovieRecoveryConicApproximation.ts#AutoMovieRecoveryConicApproximation.validate

## @evidence contracts/development/common.md#meaningful-documentation

The contract describes domain ordering, interior breaks, finite positive tolerance and both safe-integer work limits.

## @evidence contracts/development/implementation.md#principled-implementation

The checks reject nonfinite endpoints, a collapsed domain, non-interior breaks, invalid millimetre tolerance and budget values that exceed the stated integer and subdivision precision limits. The conditions are reported in check order.

## @evidence contracts/development/implementation.md#efficient-algorithms

One walk of supplied breaks and fixed work-policy checks precede any source numerical queries.

# src/curves/AutoMovieRecoveryConicApproximation.ts#AutoMovieRecoveryConicApproximation.approximateAhn

## @evidence contracts/development/common.md#meaningful-documentation

The documentation names the radial-displacement fit criterion, source callback and endpoint-jet requirements, line extension and sampled/partial outcomes.

## @evidence contracts/development/implementation.md#principled-implementation

Tangent intersection creates the rational quadratic control triangle. With each paired source and candidate on the same ray, monotonically changing middle weight permits the extreme sampled lobe displacement to be balanced before a disjoint check. Chart splits keep true source corners, and unresolved leaves retain diagnostics.

## @evidence contracts/development/implementation.md#efficient-algorithms

The routine samples only the candidate intervals in its bounded subdivision. Each interval uses a finite fitting and validation grid. The declared depth and leaf limits bound repeated radial evaluation. The output retains accepted arcs and diagnostics.

# src/curves/AutoMovieRecoveryConicApproximation.ts#AutoMovieRecoveryConicApproximation.approximateGhosh

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states equal signed normal extrema, smooth input charts, held-out checks, line extension and finite sampled coverage.

## @evidence contracts/development/implementation.md#principled-implementation

Endpoint tangencies constrain the conic family. Trial weights bracket signed normal discrepancy, and exchanging separately bracketed extrema refines their balance. Validation nodes are independent of the chosen fit nodes. Admitted intervals respect the sampled curvature and representability conditions.

## @evidence contracts/development/implementation.md#efficient-algorithms

The admitted chart interval, depth and arc limits bound repeated weight trials and subdivision. Source queries are counted and each solver owns its retained samples only until the fit completes.

# src/curves/AutoMovieRecoveryConicApproximation.ts#AutoMovieRecoveryConicApproximation.balanceGhoshApproximation

## @evidence contracts/development/common.md#meaningful-documentation

The caller contract names the compactified weight, the returned millimetre maximum and bounded exchange/refusal.

## @evidence contracts/development/implementation.md#principled-implementation

An initial sample grid brackets local displacement extrema. Golden-section refinement distinguishes extrema inside a bracket from the initial grid values, and two signed lobes guide weight bisection. Failure to resolve an admitted exchange yields no fitted pair.

## @evidence contracts/development/implementation.md#efficient-algorithms

A finite exchange budget limits repeated extrema checks. Each accepted trial reuses the current source bracket population during balance.

# src/curves/AutoMovieRecoveryConicApproximation.ts#AutoMovieRecoveryConicApproximation.displaceGhoshApproximation

## @evidence contracts/development/common.md#meaningful-documentation

The caller contract gives tangent-triangle coordinates, inverse-millimetre normal components, the compactified limit and millimetre displacement or refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Substituting the barycentric line into the compactified conic equation yields a quadratic in signed physical displacement. Roots are qualified against the positive tangent triangle, where a unique geometric intersection gives the selected displacement. A double root is one point.

## @evidence contracts/development/implementation.md#efficient-algorithms

The operation constructs one fixed quadratic and considers its at most two roots. It retains no geometry or callback.
