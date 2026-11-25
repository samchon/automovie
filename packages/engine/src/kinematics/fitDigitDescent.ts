import type { IAutoMovieFitDigitDescent } from "@automovie/interface";

import { descendDigitTasks } from "./descendDigitTasks";

/**
 * One prioritized descent of a digit's fit: a primary residual (where the
 * point goes) met first, and a secondary one (how it is turned, how its
 * joints couple) bettered only in what the primary leaves free, inside the
 * range the projection keeps.
 *
 * The primary direction is its damped least-squares step, h1 =
 * -(J1'J1 + mu I)^-1 J1'r1. Once the primary meets its tolerance, add
 * the secondary task's damped step in the regularized null complement,
 * N = I - (J1'J1 + mu I)^-1 J1'J1. This
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
 */
export function fitDigitDescent(props: IAutoMovieFitDigitDescent.IProps): number[] {
  return descendDigitTasks(props).values;
}

