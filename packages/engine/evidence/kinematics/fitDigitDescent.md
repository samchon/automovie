# src/kinematics/fitDigitDescent.ts#fitDigitDescent

## @evidence contracts/development/common.md#meaningful-documentation

States the two tasks, the step's form and its sources, the active set, the lexicographic acceptance, the damping and the stop.

## @evidence contracts/development/implementation.md#principled-implementation

Damped task-priority least squares (Nakamura et al. 1987, Chiaverini 1997), feasible-span differences at separable bounds, and projected Newton active sets/backtracking (Bertsekas 1982, https://web.mit.edu/people/dimitrib/ProjectedNewton.pdf). The direction uses the primary step alone until the projected point meets its established tolerance. Once admitted, it adds the secondary step in the damped complement and checks actual projected primary admission for every trial. LM damping follows the existing Madsen/Nielsen update.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

descendDigitTasks owns feasible differencing, active set, primary/secondary direction, projected backtracking and acceptance/damping; this public entry returns only its final variable array.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No iteration count and no weight between the tasks: the primary is never traded for the secondary, and the descent stops at the resolution.

## @evidence contracts/development/implementation.md#efficient-algorithms

Both Jacobians share two residual probes per variable plus projection measurements. Before primary admission each direction solves only its primary system and skips the secondary factor and right-hand sides. A satisfied primary with exact zero squared secondary omits all guaranteed-rejected damping trials. An empty variable set returns its actual residual with empty Jacobian columns. Fixed-point gradients, Gram and active data and per-retry O(F^3) primary factors retain existing reuse. Nonzero secondary backtracking retains its resolution-derived count with no fixed cap. Final primary data serve restart.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Pure fixed-dimension callbacks make unchanged x/residual/Jacobian/tolerance/active-set data equivalent throughout damping rejection. Acceptance replaces x/residuals/Jacobians together. The internal owner additionally returns final primary data to digit continuation; this wrapper selects the same variable array and releases unused metadata. One retry's identical primary matrix shares factors across right-hand sides, and no point, solution or workspace crosses descents.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
