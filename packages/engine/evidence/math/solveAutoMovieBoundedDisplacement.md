# src/math/solveAutoMovieBoundedDisplacement.ts#solveAutoMovieBoundedDisplacement

## @evidence contracts/development/implementation.md#principled-implementation

Constraint generation solves positive diagonal squared travel under box bounds and selected contacts; full-row feasibility admits restricted minima, and uninvolved coordinates retain their exact zero optimum.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This owner handles worst-per-group insertion and reconstruction; the shared QP solver owns factors and kernel work while callers supply geometry and units.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Groups order work rather than dropping contacts; original rows are checked on exact clipped outputs, and exhausted budgets or constant contradictions refuse.

## @evidence contracts/development/common.md#meaningful-documentation

States positive masses, caps, grouping/ties, zero start, caller scaling, absolute tolerance, finite rounds and native/convergence diagnostics.

## @evidence contracts/development/implementation.md#efficient-algorithms

For B rounds and Z coefficients, each round scans all contacts in O(Z) and solves only selected incident coordinates; selected population is bounded by original constraints.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Selected rows accumulate across rounds and absent-coordinate minima remain zeros; no global solution survives changed inputs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Selected sets and reduced rows are bounded by input dimensions; delegated workspaces release on failure or completion, and only final travel/diagnostics escape.
