# src/math/polishAutoMovieQuadraticProgram.ts#polishAutoMovieQuadraticProgram

## @evidence contracts/development/implementation.md#principled-implementation

A feasible primal receives signed-dual coordinate minimizers; other candidates use independent QR working sets, sign-aware departures and full-row blockers. Only original KKT callbacks admit trials, with no convergence promise under a finite budget.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The refiner supplies original residuals and interval groups, this owner executes one correction path, and the working-set step owns reduced algebra.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No phase name, relaxed row, shifted objective or extra native solve selects a path; uncertain factors preserve refusal diagnostics.

## @evidence contracts/development/common.md#meaningful-documentation

Documents both correction methods, grouping and endpoint ownership, feasible-start premise, shared budget and separation from final admission.

## @evidence contracts/development/implementation.md#efficient-algorithms

For B steps and Z coefficients, dual sweeps cost O(B times Z), B the admitted nonnegative safe-integer budget, each loop's only bound (a non-integer or infinite budget throws); working steps add their owner's dense factorization costs and full-row scans, while trace storage is budget-bounded.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Sparse multiplier changes update each sweep's gradient before original full remeasurement; exact coefficient groups share equations without removing original checks.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Current/trial vectors and bounded traces transfer to the result or become unreachable; this owner creates no native instance or task.
