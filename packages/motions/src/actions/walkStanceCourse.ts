import type { IAutoMovieMotionHumanWalkStanceCourse } from "@automovie/interface";

import { ROM_TOLERANCE } from "@automovie/engine";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The course of a stepping take's stances, solved once when the take is
 * planned as one trajectory optimisation: at every knot the pelvis's drop,
 * each planted foot's pitch about its ball, the trunk's pitch and roll about
 * the hips, and each foot's turn on the floor, so the heel rises, the hips
 * lower and the trunk bends continuously by construction (a course whose
 * second differences are penalised cannot jump; where two minima of one
 * instant trade places the course moves between them smoothly, paying for
 * it).
 *
 * A knot names its pelvis as a function of the trunk's tilt: a take that
 * keeps its centre of mass on a planned course moves the pelvis against the
 * shift the tilt makes, so bending the trunk carries the hips. A take may
 * hold the trunk instead. A foot that lands may turn out on the floor, within
 * the hip's rotation from the pelvis (`walkReach.TWIST`), and keeps that turn
 * while it stands; one already standing keeps its heading.
 *
 * At each knot each planted foot is brought to its ball's place on the floor
 * and pitched about it; the leg from the hip, lowered by the drop, reaches
 * its ankle with the knee bent at least `KNEE` (stance's greatest
 * extension), the ankle stays inside the dorsal range its load allows (from
 * `ANKLE_DORSIFLEXION.unloaded` under no weight to `.loaded` under all of
 * it, in proportion to the foot's share, less `walkLeg.ANKLE`), and the
 * thigh trails no further behind the pelvis
 * than the hip extends (`walkReach.EXTENSION`). Two legs that stand, one of
 * them set down in the take, keep clear of each other as the tangle audit
 * reads them (`walkLegClearance`), so a foot that crosses the other stands in
 * front of or behind it. Where the take names points
 * its feet bear (its centre of pressure, its caught extrapolated centre of
 * mass), a raised heel leaves each no shallower inside the base than the feet
 * as scheduled hold it: a foot bears only the points of its sole within
 * `HumanFoot.BEARING` of the floor (Winter's base of support, as
 * `HumanFoot.base` reads it). A foot in the air carries its pitch and its
 * turn through its swing on the course's acceleration alone, so a stance
 * joins its swing where the course meets it. The cost is:
 * - the ankle's dorsiflexion past the heel-off angle, 10 degrees (the
 *   dorsiflexion walking needs, Kadaba, Ramakrishnan and Wootten 1990, J
 *   Orthop Res 8:383, as cited by the ISB 2005 abstract 0619), on a smooth
 *   hinge as wide as its spread, 4 degrees (stance's peak dorsiflexion 15.9 +-
 *   4.1 degrees, PMC4016931), so the heel rises where more dorsiflexion costs
 *   more than turning about the ball;
 * - turning about the ball, `BALL` degrees costing as much as a spread of
 *   dorsiflexion (provisional);
 * - the drop, `UPRIGHT` metres costing as much (provisional: a body stands as
 *   tall as its stances let it);
 * - the trunk's tilt, `TRUNK` degrees costing as much (provisional: a body
 *   stands upright where its legs let it);
 * - a landing foot's turn, `TURN` degrees costing as much (provisional);
 * - the course's acceleration: each series' second difference over a knot's
 *   step squared, against `ACCELERATION` (provisional).
 *
 * It is solved by penalty sequential convex optimisation with a trust region,
 * TrajOpt's outer loop (Schulman et al. 2014), run by the shared loop
 * (`HumanSequentialConvex`, `optimise`): each subproblem is the cost's
 * Gauss-Newton model with every constraint's linearisation an exact l1
 * penalty, a banded problem on the shared quadratic program under the linear
 * rows, inside the region. It stops once every constraint is met within the
 * joints' tolerance (`MET`), or reports the least excess it reached where the
 * constraints cannot be met together. It starts from a course that stands tall and upright
 * with flat feet. Each leg is read as the posture poses it at the ankle the
 * course places, so the course's knees are the shown ones; a leg that cannot
 * reach its ankle stands on its reachable shell toward it.
 */
export namespace walkStanceCourse {
  /** The heel-off angle of the ankle's dorsiflexion, degrees (Kadaba et al. 1990). */
  export const HEEL_OFF: number = 10;

  /** The spread of the ankle's dorsiflexion in stance, degrees (15.9 +- 4.1 degrees peak, PMC4016931). */
  export const SPREAD: number = 4;

  /** Degrees of turning about the ball that cost as much as a spread of dorsiflexion past heel-off (provisional). */
  export const BALL: number = 15;

  /** Metres of drop that cost as much as a spread of dorsiflexion past heel-off (provisional). */
  export const UPRIGHT: number = 0.05;

  /** Degrees of the trunk's tilt that cost as much as a spread of dorsiflexion past heel-off (provisional). */
  export const TRUNK: number = 10;

  /** Degrees of a landing foot's turn that cost as much as a spread of dorsiflexion past heel-off (provisional). */
  export const TURN: number = 15;

  /** The accelerations that cost as much as a spread of dorsiflexion past heel-off: the drop's m/s짼, and a pitch's, the trunk's and a turn's degrees/s짼 (provisional). */
  export const ACCELERATION: {
    drop: number;
    pitch: number;
    trunk: number;
    turn: number;
  } = { drop: 4, pitch: 3000, trunk: 1000, turn: 3000 };

  /** The least knee flexion of a planted leg, degrees: the posture's own (`resolveHumanPosture.KNEE`). */
  export const KNEE: number = resolveHumanPosture.KNEE;

  /** The excess under which every constraint is met, degrees: the joints' tolerance (`ROM_TOLERANCE`), the resolution a joint's angle is solved and read to. Every constraint is in degrees: one on an angle directly, and one on a length (a reach, a landing's region, a borne point's depth, the legs' clearance) as the turn of the leg about its hip that moves its ankle by that length (`reachOf`), so a length is met within the leg's reach times the tolerance in radians, 0.15 mm on a 0.87 m leg, the most a leg's joints solved to their tolerance move its ankle. */
  export const MET: number = ROM_TOLERANCE;

  /**
   * A course read at a second, linearly between its knots.
   *
   * @param course The course.
   * @param seconds Seconds since the take's start.
   * @returns The course's values there.
   */
  export function at(course: IAutoMovieMotionHumanWalkStanceCourse.ICourse, seconds: number): IAutoMovieMotionHumanWalkStanceCourse.IReading {
    const knots: readonly IAutoMovieMotionHumanWalkStanceCourse.IKnot[] = course.knots;
    if (knots.length === 1)
      return {
        drop: course.drop[0]!,
        pitch: { left: course.pitch.left[0]!, right: course.pitch.right[0]! },
        trunk: { pitch: course.trunk.pitch[0]!, roll: course.trunk.roll[0]! },
        turn: { left: course.turn.left[0]!, right: course.turn.right[0]! },
      };
    const first: number = knots[0]!.seconds;
    const step: number = knots[1]!.seconds - first;
    const u: number = Math.min(
      knots.length - 1,
      Math.max(0, (seconds - first) / step),
    );
    const k: number = Math.min(knots.length - 2, Math.floor(u));
    const w: number = u - k;
    const lerp = (series: Float64Array): number =>
      series[k]! + (series[k + 1]! - series[k]!) * w;
    return {
      drop: lerp(course.drop),
      pitch: { left: lerp(course.pitch.left), right: lerp(course.pitch.right) },
      trunk: { pitch: lerp(course.trunk.pitch), roll: lerp(course.trunk.roll) },
      turn: { left: lerp(course.turn.left), right: lerp(course.turn.right) },
    };
  }
}
