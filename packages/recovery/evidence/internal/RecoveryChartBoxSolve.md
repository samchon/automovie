# src/internal/RecoveryChartBoxSolve.ts#RecoveryChartBoxSolve

## @evidence contracts/development/implementation.md#principled-implementation

Positive diagonal congruence preserves the caller's PSD quadratic and coordinate box in real arithmetic. Exact symmetry/zero-row premises are admitted, scaled FISTA uses an absolute-row-sum estimate, objective restarts retain feasibility, and original projected-gradient termination remains independent of scaled progress or rank.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One numerical helper owns sparse admission, diagonal scaling, projected iterations and original-coordinate qualification; observation assembly, rank diagnostics, geometric fitting and publication remain caller responsibilities.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No symmetrization, epsilon diagonal, regularizer, objective substitution, post-solve clipping or geometric fixture changes the problem. Unrepresentable arithmetic throws and iteration exhaustion retains its actual original gradient metric.

## @evidence contracts/development/common.md#meaningful-documentation

States objective, input PSD premise, exact zero-diagonal semantics, transformed box, numeric limitations, original-coordinate termination and attempted-iteration meaning.

## @evidence contracts/development/implementation.md#efficient-algorithms

For M controls, E sparse entries and K proposals, admission/scaling cost O(M+E); each proposal uses two three-axis sparse products and O(M) vector work. Original and scaled rows plus bounded vector workspaces require O(M+E) storage. No dense factorization or eigenvalue computation is performed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One admitted sparse registry and its scaled entries serve every iteration. Candidate original gradients supply both objective qualification and best-iterate selection; the final best metric is recomputed from the same original problem.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Invocation-local maps, sparse arrays and O(M) vectors expire on return or throw. Only one newly owned interleaved Float64Array and scalar diagnostics transfer to the caller; no input mutation, global cache, process or native handle is acquired.
