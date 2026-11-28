# src/fitting/AutoMovieRecoveryBezierFit.ts#AutoMovieRecoveryBezierFit.fit

## @evidence contracts/development/common.md#meaningful-documentation

The public contract gives the minimum point count, millimetre phases, safe-integer span budget, physical corner indexing and the correspondence callback's publication order.

## @evidence contracts/development/implementation.md#principled-implementation

Arc-length-weighted endpoint-handle normal equations retain the declared one-sided tangents. Restricting the candidate cubic to each ordered chord and elevating the chord to degree three makes the maximum control difference a Bernstein convex-hull estimate. Adaptive splits preserve the shared direction at smooth joins. Finite controls, physical adjacency, positive widths and valid corner indices are checked before they can enter the fit. A two-point interval that still exceeds the estimate is returned with toleranceMet false.

## @evidence contracts/development/implementation.md#efficient-algorithms

The fit copies the borrowed point tuples once and accumulates physical length before fitting. Each candidate visits only its observation interval and gets at most four accepted-improvement rounds. Splitting increases the span partition while the allowed span count bounds queued and emitted work. Workspace is local and the observer receives only a copy of accepted local parameters.
