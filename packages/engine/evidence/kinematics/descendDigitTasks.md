# src/kinematics/descendDigitTasks.ts#descendDigitTasks

## @evidence contracts/development/implementation.md#principled-implementation

Task-priority damped least squares keeps its projected active set. Separable clipped probes use actual coordinate span; interior/coupled probes retain central differences. Damped N is not exact, so primary-met trials use binary projected backtracking under original lexicographic acceptance (Bertsekas 1982). With a secondary task, once the primary is met and squared secondary is zero, strict secondary improvement is impossible, so no trial can change the point; with none, the primary has nothing to yield to and is descended to the variables' resolution. Empty variables have the exact empty-column Jacobian. Acceptance replaces variables/residuals/Jacobians together. A rejection multiplies the damping by a doubling factor, restarting a damping that underflowed to zero from the least positive double, so consecutive rejections overflow it within about sqrt(2 * 2098) = 65 and the primary factor then refuses. Each acceptance strictly lowers the residual its phase serves; a phase change follows the caller's tolerance at the new point, whose exclusion of revisited points is not proven here.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One owner separates feasible differencing, fixed-point linearization, damped direction, projected backtracking and original acceptance/damping. fitDigitDescent selects variables; fitDigitToTarget consumes actual final primary data for its unchanged restart test.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Targets, constraints, task order, primary tolerance and variable resolution remain unchanged. A bound-shortened probe is not divided by an untravelled distance, and a full-step primary rejection does not discard its feasible shorter prefixes. No rank cutoff, added physical epsilon, fixed retry cap, forced-zero residual or convergence certificate is introduced.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each nonempty Jacobian uses two residual probes and projections per variable. An admitted primary beside a secondary task whose squared residual is zero returns before guaranteed-rejected trials; a lone primary pays the damped steps down to the resolution; empty variables need only actual projected residuals. Otherwise one point shares linearization across damping retries and primary factors across RHS columns. A primary-met secondary direction tries O(1+log2(maxAbsStep/resolution)) dyadic scales before damping retry. Final data remove duplicate restart FK probes; runtime cost/speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Pure fixed-dimension callbacks make x/residuals/Jacobians/free sets equivalent across damping rejection and scale trials. Every retained projected iterate/probe and task residual is copied before later callbacks can reuse output storage. Acceptance replaces the fixed point; rejected scales never replace it. Final primary data use the same feasible differencing owner and resolution as the solve, without replacing demands or retaining answers across descents.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One descent owns its copied point, two projected probe arrays per live column, task/Jacobian arrays and one damping linearization. Backtracking retains only the current trial/residuals and halves finite step magnitude until existing resolution; no trial history grows. Final values/residual/primary Jacobian transfer to the synchronous caller; other state releases on return/throw.

## @evidence contracts/development/common.md#meaningful-documentation

States the returned point/linearization relationship, pure callback scope, original stop and the public/continuation consumers.
