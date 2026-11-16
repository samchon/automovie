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
import type { IWalkStanceProblem } from "./IWalkStanceProblem";

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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines course variables, clocks, physical residuals/constraints, their units and published or provisional constants.
 * @evidence contracts/development/design.md#principled-representation Knots express world goals and trunk-dependent pelvis geometry, solved course arrays retain their declared physical units and each constraint has a degree-scaled evaluation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The stance model, solver and stagger consumers share these existing knot, problem, course and reading records plus one interpolation operation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Body dimensions, schedules and goals enter as data; parallel array lengths, evenly spaced nonempty knots and finite values remain owning-problem premises.
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
   * The trunk's tilt about the hips, as the posture's pitch and roll.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Members name posture pitch and roll in degrees.
   * @evidence contracts/development/design.md#principled-representation Two simultaneous angular coordinates describe tilt, with finite values validated by their owning motion inputs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Both coordinates are used by pelvis framing, constraint reading and trunk writing.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No body or action-specific angle is encoded in the record.
   */
  export interface ITrunk {
    /** The posture's pitch, degrees, forward positive. */
    pitch: number;

    /** The posture's roll, degrees. */
    roll: number;
  }

  /**
   * The pelvis at a knot under a trunk's tilt, before the drop.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States world rotation, hip-joint metres and pre-drop timing.
   * @evidence contracts/development/design.md#principled-representation The pelvis orientation and both hip locations form one physical frame; finite normalized rotations remain the producer's premise.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The geometry needs exactly this orientation and the two hip positions.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses interface vectors/quaternions and body-generated hips without a second rig representation.
   */
  export interface IPelvis {
    /** Its world rotation, the hip joints' frame. */
    rotation: IAutoMovieQuaternion;

    /** The hip joints, world metres. */
    hips: Record<"left" | "right", IAutoMovieVector3>;
  }

  /**
   * A planted foot at a knot, with optional authored landing and fitted swivel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Members define world placement, turning permission, goal/region metres and the fitted knee reading.
   * @evidence contracts/development/design.md#principled-representation One scheduled foot can independently permit turn, request a landing region or hold a fitted branch/swivel; absence has its documented fixed-foot meaning.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The stance model consumes all five fields; HumanFoot and HumanLegChain retain their existing placement and fit ownership.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Side is a closed union and geometry/landing values are caller data, with physical feasibility enforced by the stance constraints.
   */
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States degree-valued swivel, branch identity, derivative units and the shared LEG coordinate order.
   * @evidence contracts/development/design.md#principled-representation Extends the actual leg-chain fit with an optional first-order piece; matching slope/about lengths remain the sequential producer's premise.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Stagger linearization writes the piece and stance geometry reads it; a plain held fit needs neither optional array.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the original fit branch and numerical slopes without a preselected knee shape or fitted trajectory table.
   */
  export interface ISwivel extends HumanLegChain.ISwivel {
    /** The swivel's slope in each of the leg's variables, degrees per unit. */
    slope?: readonly number[];

    /** The variables the piece is taken about. */
    about?: readonly number[];
  }


  /**
   * One instant's scheduled supports and pelvis geometry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Members state action-local seconds, planted feet, trunk-dependent pelvis, optional held angles/drop and borne world-floor points.
   * @evidence contracts/development/design.md#principled-representation Separates the fixed instant's geometry from the solved course coordinates, permitting independent trunk/drop holds; chronological even spacing remains the owning solver's premise.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The model reads these six fields and shares the existing stance/trunk/pelvis records with recovery framing.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every body frame and support demand is supplied by the take, without a built-in pose, gait or body shape.
   */
  export interface IKnot {
    /** Seconds since the take's start. */
    seconds: number;

    /** The planted feet. */
    stances: readonly IStance[];

    /** The pelvis under a trunk's tilt.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Maps degree pitch/roll to the knot's actual world rotation and pre-drop hip positions.
     * @evidence contracts/development/implementation.md#principled-implementation The supplied physical frame carries centre travel against the trunk's mass shift and tilts hip joints about the body's rest hips under the knot's fixed stance-directed heading.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Knot framing owns this root/pelvis law; the stance model requests its actual trunk coordinates without a second pelvis model.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the body's hip geometry, entry clinical hips and exact translation/rotation grouping without a posed result table.
     * @evidence contracts/development/implementation.md#efficient-algorithms Existing producers prepare one upright frame per knot and evaluate each varying trunk with constant two-hip rigid-transform work.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed knot/body/entry/feet facts and the upright inverse are shared; the geometry owner may retain three exact pitch/roll readings under this same immutable frame.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The knot owns a fixed-size frame closure until its course/problem releases it, with no growing query history or external handle.
     */
    pelvis: (trunk: ITrunk) => IPelvis;

    /** The trunk's tilt the take holds; free when absent. */
    trunk?: ITrunk;

    /** The pelvis's drop the take holds, metres; free when absent. */
    drop?: number;

    /** The points the take asks its feet to bear, on the floor, world metres; none when absent. */
    borne?: readonly IAutoMovieVector3[];
  }

  /**
   * The solved physical coordinates at every original knot.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Members name metre/degree arrays, fitted goal records and largest remaining degree-scaled violation.
   * @evidence contracts/development/design.md#principled-representation Parallel Float64Array series preserve the original knot clock and distinct leg/trunk coordinates; their common knot length is a solver-produced invariant.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Interpolation, continuation and recovery judgement consume all coordinate groups, unmet and planted records.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Stores an actual solved course with its reported excess, not a precomputed pose table or success flag hiding infeasibility.
   */
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

  /**
   * A planted leg's actual posture-fit inputs at the current course.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Members state world hip/ankle metres, pelvis/foot rotations, heading degrees and metre drop.
   * @evidence contracts/development/design.md#principled-representation One closed side and its parent/effector frames specify the canonical leg fit; range and reach are validated by that fit and the stance constraints.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The sequential fit, final course record and recovery comparisons consume these seven existing goal quantities.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses original interface vectors/quaternions and reports the requested ankle separately from any reachable-shell posing performed by the leg reader.
   */
  export interface IPlanted {
    /** The leg. */
    side: "left" | "right";

    /** The pelvis's world rotation, the hip joints' frame. */
    pelvis: IAutoMovieQuaternion;

    /** The hip joint, lowered by the drop, world metres. */
    hip: IAutoMovieVector3;

    /** The requested ankle the course places, world metres; the constraint reader separately poses an unreachable leg on its reachable shell toward it. */
    ankle: IAutoMovieVector3;

    /** The foot's world rotation. */
    rotation: IAutoMovieQuaternion;

    /** The foot's heading, degrees. */
    heading: number;

    /** The pelvis's drop, metres. */
    drop: number;
  }

  /**
   * Interpolated drop and angles at one action-local second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Members state metre drop and degree-valued foot/trunk angles.
   * @evidence contracts/development/design.md#principled-representation One simultaneous physical reading carries both foot sides and the trunk tilt, with the course's clamped linear time interpolation supplied by at.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Stagger foot settlement and trunk writing share exactly these four coordinate groups.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Contains the course's interpolated values, without an independent posture model or an outcome flag.
   */
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
   * @evidence contracts/development/common.md#meaningful-documentation Members state objective/degree-scaled violations and raw ordered constraint intervals at this exact course.
   * @evidence contracts/development/design.md#principled-representation Aggregate merit quantities remain separate from unclamped per-constraint zero-step bounds, so a second-order correction can read actual nonlinear excess instead of a penalty.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The sequential loop reads three original aggregates; its correction consumes the same evaluation's ordered bounds without requesting an unused trial Jacobian/model.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The actual model sweep produces every interval in convexify row order; signed negative excess remains present and no clamped penalty substitutes for a physical constraint reading.
   */
  export interface IEvaluation {
    /** The cost, half the sum of the squared residuals. */
    objective: number;

    /** The constraints' total excess, degrees (`MET`). */
    violation: number;

    /** The largest excess. */
    worst: number;

    /** Every nonlinear constraint's zero-step interval at this exact course, in convexify row order, before clipping violations to nonnegative penalties. */
    bounds: readonly Pick<Q.IRow, "l" | "u">[];
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
  export type IProblem = IWalkStanceProblem;

  /**
   * A course read at a second, linearly between its knots.
   *
   * @param course The course.
   * @param seconds Seconds since the take's start.
   * @returns The course's values there.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States action-local seconds and linear interpolation between the course's knots.
   * @evidence contracts/development/implementation.md#principled-implementation On a nonempty evenly spaced course, clamps time to its knot range and linearly interpolates each drop/angle series; a single knot is constant.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One clamped interval and weight serve every returned coordinate series.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains original endpoint clamps, knot selection and scalar arithmetic without resampling or changing continuity.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant indexing and interpolation for the fixed coordinate count, independent of knot count.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All requested coordinates share this query's interval/weight; different query times are evaluated directly without a cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh scalar record and retains no course or query state.
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
    const lerp: (series: Float64Array) => number = (series: Float64Array): number =>
      series[k]! + (series[k + 1]! - series[k]!) * w;
    return {
      drop: lerp(course.drop),
      pitch: { left: lerp(course.pitch.left), right: lerp(course.pitch.right) },
      trunk: { pitch: lerp(course.trunk.pitch), roll: lerp(course.trunk.roll) },
      turn: { left: lerp(course.turn.left), right: lerp(course.turn.right) },
    };
  }
}
