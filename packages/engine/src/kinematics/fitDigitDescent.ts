import { descendDigitTasks } from "./descendDigitTasks";

/**
 * One prioritized descent of a digit's fit: a primary residual (where the
 * point goes) met first, and a secondary one (how it is turned, how its
 * joints couple) bettered only in what the primary leaves free, inside the
 * range the projection keeps.
 *
 * Each step is the damped least-squares step of the primary task, h1 =
 * -(J1'J1 + mu I)^-1 J1'r1, plus the secondary task's damped step taken in
 * the regularized null complement, N = I - (J1'J1 + mu I)^-1 J1'J1. This
 * damped complement is not an exact null projector; actual primary admission
 * below keeps the task priority. The direction follows
 * the task-priority inverse kinematics of Nakamura, Hanafusa and Yoshikawa
 * 1987 ("Task-priority based redundancy control of robot manipulators",
 * IJRR 6(2):3-15) in the damped form of Chiaverini 1997 ("Singularity-robust
 * task-priority redundancy resolution", IEEE TRA 13(3):398-410). A variable
 * standing on a bound its descent pushes against (the projection undoes a
 * resolution's move along the negative gradient) is held for the step, the
 * active set of a projected Newton method (Bertsekas 1982); the gradient is
 * the primary's while the primary is unmet, so the secondary never holds a
 * joint the primary needs.
 *
 * A trial is accepted lexicographically: while the primary is unmet, only
 * when it lowers the primary; once met (within the effector's motion for one
 * resolution step of every joint, `tolerance`), when it keeps the primary met
 * and lowers the secondary. The damping follows Levenberg-Marquardt with
 * Nielsen's update at its bounds (Madsen, Nielsen and Tingleff 2004,
 * Algorithm 3.16, tau = 1e-3): a third on an accepted step, a doubling growth
 * on a rejected one, so the steps shrink until the descent stops, when the
 * step it would take moves no variable by more than `step`. Once the primary
 * is met, a rejected secondary step is first backtracked by halves under the
 * same projected acceptance, down to that original resolution. This admits a
 * feasible shorter step despite the damped complement's primary leakage.
 * Finite differences keep two task probes per variable; a separable clipped
 * coordinate uses its actual feasible span instead of dividing by 2*step,
 * which would halve a derivative at a range end. Interior and coupled
 * projections retain their existing central denominator.
 * Residual, projection and tolerance callbacks are pure functions of their
 * supplied values throughout this synchronous descent, as the finite-difference
 * and damping law require. Rejected damping trials keep the accepted point,
 * Jacobians and active set unchanged; only acceptance rebuilds linearization.
 * A satisfied primary with zero squared secondary cannot admit any strictly
 * improving trial and returns immediately. With no variables, the projected
 * point and empty-column primary Jacobian are the only possible result.
 *
 * @param props The start, the residuals, the projection, the resolution and the primary's tolerance.
 * @returns The variables where the descent stops, projected.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two tasks, the step's form and its sources, the active set, the lexicographic acceptance, the damping and the stop.
 * @evidence contracts/development/implementation.md#principled-implementation Damped task-priority least squares (Nakamura et al. 1987, Chiaverini 1997), feasible-span differences at separable bounds, and projected Newton active sets/backtracking (Bertsekas 1982, https://web.mit.edu/people/dimitrib/ProjectedNewton.pdf). LM damping keeps the existing Madsen/Nielsen update; actual projected lexicographic acceptance enforces primary priority despite approximate N.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure descendDigitTasks owns feasible differencing, active set, primary/secondary direction, projected backtracking and acceptance/damping; this public entry returns only its final variable array.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No iteration count and no weight between the tasks: the primary is never traded for the secondary, and the descent stops at the resolution.
 * @evidence contracts/development/implementation.md#efficient-algorithms Both Jacobians share two residual probes per variable plus projection measurements. A satisfied primary with exact zero squared secondary omits all guaranteed-rejected damping trials; an empty variable set returns its actual residual with empty Jacobian columns. Fixed-point gradients/Gram/active data and per-retry O(F^3) primary factors retain existing reuse. Nonzero secondary backtracking retains its resolution-derived count with no fixed cap. Final primary data serve restart; runtime improvement/cost is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Pure fixed-dimension callbacks make unchanged x/residual/Jacobian/tolerance/active-set data equivalent throughout damping rejection. Acceptance replaces x/residuals/Jacobians together. The internal owner additionally returns final primary data to digit continuation; this wrapper selects the same variable array and releases unused metadata. One retry's identical primary matrix shares factors across right-hand sides, and no point, solution or workspace crosses descents.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function fitDigitDescent(props: fitDigitDescent.IProps): number[] {
  return descendDigitTasks(props).values;
}

/**
 * Companion of {@link fitDigitDescent}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's meaning and unit.
 * @evidence contracts/development/design.md#principled-representation The two tasks as residual functions of the variables, the projection into the range, the resolution and the primary's tolerance.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What one descent reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Plain functions of number arrays; no rig type leaks in.
 */
export namespace fitDigitDescent {
  /** What one descent reads. */
  export interface IProps {
    /** The start, the variables' values. */
    start: readonly number[];

    /** The pure primary residual, metres, with a fixed dimension; boundary probes use feasible coordinates. */
    primary: (x: readonly number[]) => number[];

    /** The pure secondary residual, metres, with a fixed dimension; empty when there is none. */
    secondary: (x: readonly number[]) => number[];

    /** Pure same-dimension projection into the range; returned numerical arrays may be reused after the caller copies them. */
    project: (x: readonly number[]) => number[];

    /** Positive finite variable resolution: the finite-difference step and the stop. */
    step: number;

    /** The primary residual's length at which the primary counts as met, at `x` with its Jacobian. */
    tolerance: (
      x: readonly number[],
      J1: readonly (readonly number[])[],
    ) => number;
  }
}

