import { ROM_TOLERANCE } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanFoot } from "../posture/HumanFoot";
import type { HumanLegChain } from "../posture/HumanLegChain";
import type {
  HumanQuadraticProgram as Q,
} from "../posture/HumanQuadraticProgram";
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

  /** The trunk's tilt about the hips, as the posture's pitch and roll (`AutoMovieMotionHumanLean.pivot`). */
  export interface ITrunk {
    /** The posture's pitch, degrees, forward positive. */
    pitch: number;

    /** The posture's roll, degrees. */
    roll: number;
  }

  /** The pelvis at a knot under a trunk's tilt, before the drop. */
  export interface IPelvis {
    /** Its world rotation, the hip joints' frame. */
    rotation: IAutoMovieQuaternion;

    /** The hip joints, world metres. */
    hips: Record<"left" | "right", IAutoMovieVector3>;
  }

  /** A planted foot at a knot. */
  export interface IStance {
    /** The foot. */
    side: "left" | "right";

    /** Its placement as scheduled. */
    placement: HumanFoot.IPlacement;

    /** Whether it may turn out on the floor, a foot that has landed in the take; it keeps the turn it lands with while it stands. */
    turning?: boolean;

    /** A landing the course places: the foot slides on the floor from its placement toward `goal`, its ankle inside `region`, and keeps where it lands while it stands; held where it is placed when absent. */
    landing?: {
      /** The ankle the landing is pulled toward, world metres. */
      goal: IAutoMovieVector3;

      /** The landing ankle's excesses over its region's bounds, metres, each at most none inside it. */
      region: (ankle: IAutoMovieVector3) => number[];
    };

    /** The leg's bend branch and swivel as the posture's fit last posed it here (`HumanLegChain`), which the course holds: its knee and its ankle's dorsiflexion are read from the leg so posed, and two legs that both carry one keep clear of each other; the knee is read by `walkLeg.lean` and the legs' clearance is not read when absent. */
    swivel?: ISwivel;
  }

  /**
   * A leg's held swivel (`HumanLegChain.ISwivel`), with its first-order piece
   * when the take linearises the posture's fit about a course: the swivel
   * then moves by `slope` times each of the leg's own variables' change from
   * `about`, in `LEG` order.
   */
  export interface ISwivel extends HumanLegChain.ISwivel {
    /** The swivel's slope in each of the leg's variables, degrees per unit. */
    slope?: readonly number[];

    /** The variables the piece is taken about. */
    about?: readonly number[];
  }


  /** A knot. */
  export interface IKnot {
    /** Seconds since the take's start. */
    seconds: number;

    /** The planted feet. */
    stances: readonly IStance[];

    /** The pelvis under a trunk's tilt. */
    pelvis: (trunk: ITrunk) => IPelvis;

    /** The trunk's tilt the take holds; free when absent. */
    trunk?: ITrunk;

    /** The pelvis's drop the take holds, metres; free when absent. */
    drop?: number;

    /** The points the take asks its feet to bear, on the floor, world metres; none when absent. */
    borne?: readonly IAutoMovieVector3[];
  }

  /** The solved course. */
  export interface ICourse {
    /** The knots. */
    knots: readonly IKnot[];

    /** The pelvis's drop at each knot, metres. */
    drop: Float64Array;

    /** Each foot's pitch at each knot, degrees, negative heel up; carried through a swing where it does not stand. */
    pitch: Record<"left" | "right", Float64Array>;

    /** The trunk's tilt at each knot, degrees. */
    trunk: Record<"pitch" | "roll", Float64Array>;

    /** Each foot's turn on the floor at each knot, degrees about +Y. */
    turn: Record<"left" | "right", Float64Array>;

    /** Each foot's slide on the floor from its placement at each knot, world metres. */
    slide: Record<"left" | "right", Record<"x" | "z", Float64Array>>;

    /** The largest excess the course leaves over its constraints, degrees (`MET`); at most `MET` when it meets them all. */
    unmet: number;

    /** Each knot's planted legs as the course stands them, in its stances' order. */
    planted: readonly (readonly IPlanted[])[];
  }

  /** A planted leg as the course stands it, the inputs of the posture's leg fit. */
  export interface IPlanted {
    /** The leg. */
    side: "left" | "right";

    /** The pelvis's world rotation, the hip joints' frame. */
    pelvis: IAutoMovieQuaternion;

    /** The hip joint, lowered by the drop, world metres. */
    hip: IAutoMovieVector3;

    /** The ankle the course places, world metres; a leg that cannot reach it stands on its reachable shell toward it. */
    ankle: IAutoMovieVector3;

    /** The foot's world rotation. */
    rotation: IAutoMovieQuaternion;

    /** The foot's heading, degrees. */
    heading: number;

    /** The pelvis's drop, metres. */
    drop: number;
  }

  /** A course read at a second. */
  export interface IReading {
    /** The pelvis's drop, metres. */
    drop: number;

    /** Each foot's pitch, degrees. */
    pitch: Record<"left" | "right", number>;

    /** The trunk's tilt. */
    trunk: ITrunk;

    /** Each foot's turn, degrees. */
    turn: Record<"left" | "right", number>;
  }

  /**
   * A course's evaluation (`problem`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit.
   * @evidence contracts/development/design.md#principled-representation The cost, the l1 excess and the largest excess, as a sequential convex method's merit reads them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IEvaluation {
    /** The cost, half the sum of the squared residuals. */
    objective: number;

    /** The constraints' total excess, degrees (`MET`). */
    violation: number;

    /** The largest excess. */
    worst: number;
  }

  /**
   * A course's problem as a sequential convex method takes it (Schulman et
   * al. 2014's): its variables at the start, its evaluation at a course, its
   * convex subproblem about one (the cost's Gauss-Newton model, each
   * constraint linearised as a soft l1 row of a weight, the linear rows hard,
   * inside a trust region in units of `TRUST`), a step's course and its
   * record. A course whose first `from` knots `start` settles is solved over
   * the rest from two knots before them, those two held, as `solve` holds
   * them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and frame.
   * @evidence contracts/development/design.md#principled-representation The problem a sequential convex method convexifies: TrajOpt's soft rows over the course's own cost, constraints and linear rows.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The start, the evaluation, the subproblem, the step, the tolerance and the record.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the course's own sweep, rows and record.
   */
  export interface IProblem {
    /** The variables at the start. */
    start: Float64Array;

    /** The course's evaluation at its variables. */
    evaluate: (x: Float64Array) => IEvaluation;

    /** The convex subproblem in the step about the variables, its soft rows weighted `mu`, without its region (`region`); with `objective` false, the rows alone (`HumanSequentialConvex.IOptions.restore`). */
    convexify: (x: Float64Array, mu: number, objective?: boolean) => Q.IProblem;

    /** The step's hard rows about the variables within the trust region `radius`, in units of `TRUST` (one is `TRUST`). */
    region: (x: Float64Array, radius: number) => Q.IRow[];

    /** A step's largest coordinate in the region's units (`TRUST`). */
    length: (step: Float64Array) => number;

    /** The variables after a step. */
    stepped: (x: Float64Array, step: Float64Array) => Float64Array;

    /** The excess under which every constraint is met (`MET`). */
    tolerance: number;

    /** The course at its variables. */
    course: (x: Float64Array, unmet: number) => ICourse;

    /** A knot's planted legs at the variables, its index the take's; none for a knot the problem holds. */
    planted: (x: Float64Array, knot: number) => IPlanted[];

    /** A leg's own variables' indices at a knot (`LEG`), its index the take's. */
    variables: (knot: number, side: "left" | "right") => number[];

    /** The first knot the problem moves, the take's index. */
    first: number;
  }

  /**
   * A course read at a second, linearly between its knots.
   *
   * @param course The course.
   * @param seconds Seconds since the take's start.
   * @returns The course's values there.
   */
  export function at(course: ICourse, seconds: number): IReading {
    const knots: readonly IKnot[] = course.knots;
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
