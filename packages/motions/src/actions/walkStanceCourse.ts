import {
  ANKLE_DORSIFLEXION,
  Quaternion,
  ROM_TOLERANCE,
  Vector3,
  wrapDegrees,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanLegChain } from "../posture/HumanLegChain";
import { HumanQuadraticProgram as Q } from "../posture/HumanQuadraticProgram";
import { HumanSequentialConvex as SCO } from "../posture/HumanSequentialConvex";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { walkLeg } from "./walkLeg";
import { walkLegClearance } from "./walkLegClearance";
import { walkReach } from "./walkReach";

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

  /** A leg's own variables at a knot, in the order a swivel's piece reads them: the drop, the trunk's pitch and roll, and the foot's pitch, turn and slide across and along. */
  export const LEG: readonly string[] = [
    "drop",
    "trunk pitch",
    "trunk roll",
    "pitch",
    "turn",
    "slide x",
    "slide z",
  ];

  /**
   * A leg's own variables' indices in a course's variable vector (`LEG`).
   *
   * @param knot The knot's index.
   * @param side The leg.
   * @returns The indices.
   */
  export function variables(knot: number, side: "left" | "right"): number[] {
    return LEG.map((_: string, v: number): number =>
      legOf(WIDTH * knot, side, v),
    );
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
   * Solve a take's stance course.
   *
   * A course whose first knots are settled, `from` of them as `start` holds
   * them, is solved over the rest alone, from two knots before them, those
   * two held, so its second differences run on across the join: a receding
   * horizon with a two-knot overlap. It is not the whole problem's solution,
   * in which a later knot could still pull the earlier ones through the
   * shared costs and constraints; a caller that holds knots states how far it
   * holds them and checks the result against the whole solve.
   *
   * @param body The body.
   * @param knots The knots, evenly spaced; one knot alone is a posture.
   * @param start A course of the same take's first knots to start from, where a nearly equal course was solved before; flat and upright when absent.
   * @param from How many of the first knots `start` settles; none when absent.
   * @returns The course.
   */
  export function solve(
    body: IHumanBody,
    knots: readonly IKnot[],
    start?: ICourse,
    from: number = 0,
  ): ICourse {
    return optimise(body, problem(body, knots, start, from));
  }

  /**
   * A course's problem solved by the shared sequential convex loop
   * (`HumanSequentialConvex`, TrajOpt's outer loop, Schulman et al. 2014)
   * under the body's schedule (`schedule`) and `ROUNDS`, its penalty steered
   * at every iterate from `PENALTY` (`HumanSequentialConvex.IOptions.steer`),
   * so the objective does not pull a course off its constraints: each
   * convex subproblem, the problem's own with any rows the caller adds, is
   * solved within the region by `HumanQuadraticProgram`, warm-started across
   * the region's shrinking and from the multipliers of the last step taken,
   * and a step is predicted to lower the merit by what it lowers the
   * subproblem's value, its Gauss-Newton cost and its soft rows' l1 excess.
   *
   * @param body The body.
   * @param shape The problem at the start, whose variables, region and steps every course shares.
   * @param at The problem a course is evaluated by, and, about a course whose subproblem is built (`model`), the problem convexified there and the rows added to it; `shape` with none when absent.
   * @returns The course at the last iterate taken, its largest excess as `unmet`.
   */
  export function optimise(
    body: IHumanBody,
    shape: IProblem,
    at: (
      x: Float64Array,
      model: boolean,
    ) => { problem: IProblem; rows: Q.IRow[] } = (): {
      problem: IProblem;
      rows: Q.IRow[];
    } => ({ problem: shape, rows: [] }),
  ): ICourse {
    // The multipliers of the last step taken, which the next subproblem
    // starts from.
    let duals: Map<string, number> | undefined;

    // The last step solved, its model and region, which a correction of it reads.
    let last:
      | {
          x: Float64Array;
          model: Q.IProblem;
          rows: number;
          mu: number;
          radius: number;
          step: Float64Array;
        }
      | undefined;
    const problem: SCO.IProblem<Float64Array, IEvaluation> = {
      evaluate: (x: Float64Array): IEvaluation => {
        return at(x, false).problem.evaluate(x);
      },
      feasible: (evaluation: IEvaluation): boolean =>
        evaluation.worst <= shape.tolerance,
      convexify: (
        x: Float64Array,
        _evaluation: IEvaluation,
        mu: number,
        _radius: number,
        objective: boolean,
      ): SCO.IModel<Float64Array> => {
        const about: { problem: IProblem; rows: Q.IRow[] } = at(x, true);
        const convex: Q.IProblem = about.problem.convexify(x, mu, objective);
        const model: Q.IProblem = {
          ...convex,
          rows: [...convex.rows, ...about.rows],
        };
        const zero: number = Q.value(model, new Float64Array(model.n));
        let trusted: Q.IProblem | undefined;
        let warm: Q.IState | undefined;
        return {
          solve: (radius: number): SCO.IStep<Float64Array> => {
            trusted = {
              ...model,
              rows: [...model.rows, ...shape.region(x, radius)],
            };
            warm = Q.solve(trusted, warm, duals);
            last = {
              x,
              model,
              rows: convex.rows.length,
              mu,
              radius,
              step: warm.x,
            };
            const length: number = shape.length(warm.x);
            // The soft rows' linearised excess at the step, in their own
            // degrees, the violation the steering reads.
            let violation: number = 0;
            let worst: number = 0;
            for (const row of model.rows) {
              if (row.weight === undefined) continue;
              let value: number = 0;
              for (let r: number = 0; r < row.index.length; r++)
                value += row.coef[r]! * warm.x[row.index[r]!]!;
              const over: number = Math.max(row.l - value, value - row.u, 0);
              violation += over;
              worst = Math.max(worst, over);
            }
            return {
              trial: shape.stepped(x, warm.x),
              predicted: zero - Q.value(model, warm.x),
              violation,
              met: worst <= shape.tolerance,
              length,
              // The step at the region's edge, to the solver's own accuracy.
              full: length >= radius * (1 - Q.TOLERANCE),
            };
          },
          taken: (): void => {
            duals = Q.multipliers(trusted!, warm!);
          },
        };
      },

      // The second-order correction of a rejected step (Nocedal and Wright
      // 2006, section 15.6, (15.36); `HumanSequentialConvex.IProblem.correct`):
      // each row's linearisation error at the trial, e = g(trial) - (g(x) +
      // a d), is taken off its bounds, and the subproblem at `x` is solved
      // again within the same region, so the step lands where the rows'
      // second-order miss is met. A row's error is read from the rows
      // linearised at the trial, which list the same constraints in the same
      // order: there its bounds are L - g(trial), U - g(trial).
      correct: (
        x: Float64Array,
        step: SCO.IStep<Float64Array>,
      ): Float64Array | null => {
        if (last === undefined || last.x !== x) return null;
        const there: Q.IProblem = at(step.trial, true).problem.convexify(
          step.trial,
          last.mu,
          true,
        );
        // The same constraints in the same order, or no correction.
        if (there.rows.length !== last.rows) return null;
        const d: Float64Array = last.step;
        const rows: Q.IRow[] = last.model.rows.map(
          (row: Q.IRow, i: number): Q.IRow => {
            if (i >= there.rows.length) return row;
            let predicted: number = 0;
            for (let r: number = 0; r < row.index.length; r++)
              predicted += row.coef[r]! * d[row.index[r]!]!;
            const error: number = row.l - there.rows[i]!.l - predicted;
            return { ...row, l: row.l - error, u: row.u - error };
          },
        );
        const corrected: Q.IState = Q.solve({
          ...last.model,
          rows: [...rows, ...shape.region(x, last.radius)],
        });
        return shape.stepped(x, corrected.x);
      },
    };
    const solved: SCO.IResult<Float64Array, IEvaluation> = SCO.minimise(
      problem,
      shape.start,
      {
        schedule: schedule(body),
        penalties: [PENALTY],
        rounds: ROUNDS,
        steer: true,
      },
    );
    return at(solved.x, false).problem.course(
      solved.x,
      solved.evaluation.worst,
    );
  }

  /** A course's knots from `join` on. */
  function cut(start: ICourse, join: number): ICourse {
    const rest = (series: Float64Array): Float64Array => series.slice(join);
    return {
      knots: start.knots.slice(join),
      drop: rest(start.drop),
      pitch: { left: rest(start.pitch.left), right: rest(start.pitch.right) },
      trunk: { pitch: rest(start.trunk.pitch), roll: rest(start.trunk.roll) },
      turn: { left: rest(start.turn.left), right: rest(start.turn.right) },
      slide: {
        left: { x: rest(start.slide.left.x), z: rest(start.slide.left.z) },
        right: { x: rest(start.slide.right.x), z: rest(start.slide.right.z) },
      },
      unmet: start.unmet,
      planted: start.planted.slice(join),
    };
  }

  /** A course's first `join` knots followed by a tail solved from there. */
  function joined(
    knots: readonly IKnot[],
    start: ICourse,
    join: number,
    tail: ICourse,
  ): ICourse {
    const series = (head: Float64Array, rest: Float64Array): Float64Array => {
      const out: Float64Array = new Float64Array(knots.length);
      out.set(head.subarray(0, join));
      out.set(rest, join);
      return out;
    };
    return {
      knots,
      drop: series(start.drop, tail.drop),
      pitch: {
        left: series(start.pitch.left, tail.pitch.left),
        right: series(start.pitch.right, tail.pitch.right),
      },
      trunk: {
        pitch: series(start.trunk.pitch, tail.trunk.pitch),
        roll: series(start.trunk.roll, tail.trunk.roll),
      },
      turn: {
        left: series(start.turn.left, tail.turn.left),
        right: series(start.turn.right, tail.turn.right),
      },
      slide: {
        left: {
          x: series(start.slide.left.x, tail.slide.left.x),
          z: series(start.slide.left.z, tail.slide.left.z),
        },
        right: {
          x: series(start.slide.right.x, tail.slide.right.x),
          z: series(start.slide.right.z, tail.slide.right.z),
        },
      },
      unmet: tail.unmet,
      planted: [...start.planted.slice(0, join), ...tail.planted],
    };
  }

  /**
   * The course's problem over its knots, its first `hold` knots held as
   * `start` holds them: the starting variables, the cost and the constraints
   * at a course (`sweep`), the rows linear in it (`bounds`), and each
   * stance's reading.
   *
   * @param body The body.
   * @param knots The knots.
   * @param start A course to start from.
   * @param hold How many first knots are held.
   * @returns The problem.
   */
  function build(
    body: IHumanBody,
    knots: readonly IKnot[],
    start: ICourse | undefined,
    hold: number,
  ) {
    const n: number = knots.length;
    const step: number = n > 1 ? knots[1]!.seconds - knots[0]!.seconds : 1;
    const limit: number = reachOf(body);
    // A length a constraint reads, in the degrees the leg turns about its hip
    // to move its ankle by it, so a constraint on a length and one on an
    // angle are met within the same tolerance (`MET`).
    const lengthwise: number = 180 / (Math.PI * limit);
    const dorsal: number = ANKLE_DORSIFLEXION.loaded - walkLeg.ANKLE;
    const unloadedDorsal: number = ANKLE_DORSIFLEXION.unloaded - walkLeg.ANKLE;
    const size: number = WIDTH * n;
    const pitchOf = (side: "left" | "right"): number =>
      side === "left" ? 1 : 2;
    const slideOf = (side: "left" | "right"): number =>
      side === "left" ? 7 : 9;
    const turnOf = (side: "left" | "right"): number =>
      side === "left" ? 5 : 6;
    const scheduled: number[][] = knots.map((knot: IKnot): number[] =>
      knot.stances.map((s: IStance): number =>
        HumanFoot.pitch(s.placement.rotation),
      ),
    );
    const flat = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: p.x,
      y: 0,
      z: p.z,
    });

    // Each knot's pelvis at the trunk's tilt it was last read at: the
    // differences that move the drop, a pitch or a turn read it again.
    const pelves: { pitch: number; roll: number; pelvis: IPelvis }[] = [];
    const pelvisAt = (k: number, pitch: number, roll: number): IPelvis => {
      const kept = pelves[k];
      if (kept !== undefined && kept.pitch === pitch && kept.roll === roll)
        return kept.pelvis;
      const pelvis: IPelvis = knots[k]!.pelvis({ pitch, roll });
      pelves[k] = { pitch, roll, pelvis };
      return pelvis;
    };

    // A stance's reach, dorsiflexion, trailing and turn from the pelvis at a
    // course's values for its knot.
    const read = (
      x: Float64Array,
      k: number,
      j: number,
    ): {
      reach: number;
      dorsi: number;
      trail: number;
      twist: number;
      leg: walkLegClearance.ILeg | null;
      planted: IPlanted;
    } => {
      const o: number = WIDTH * k;
      const s: IStance = knots[k]!.stances[j]!;
      const pelvis: IPelvis = pelvisAt(k, x[o + 3]!, x[o + 4]!);
      const hip: IAutoMovieVector3 = {
        ...pelvis.hips[s.side],
        y: pelvis.hips[s.side].y - x[o]!,
      };
      const placement: HumanFoot.IPlacement = HumanFoot.turned(
        slid(s.placement, x[o + slideOf(s.side)]!, x[o + slideOf(s.side) + 1]!),
        x[o + turnOf(s.side)]!,
      );
      const heading: number = HumanFoot.heading(placement.rotation);
      const pitch: number = x[o + pitchOf(s.side)]!;
      const pivoted: HumanFoot.IPlacement = HumanFoot.pivot(
        body,
        s.side,
        "mtp",
        HumanFoot.point(body, s.side, "mtp", placement),
        heading,
        pitch,
      );
      const ankle: IAutoMovieVector3 = pivoted.ankle;
      const reach: number = Vector3.length(Vector3.subtract(ankle, hip));
      // The leg as the posture's fit poses it, at the swivel the take holds
      // (`HumanLegChain`): its knee then bends where the shown knee does, and
      // the ankle's dorsiflexion is the shank's lean over the foot's heading
      // (as `walkLeg.lean` reads it, there of its own knee) plus the pitch.
      // A held swivel's first-order piece moves it with the leg's own
      // variables (`ISwivel`).
      const swivel: HumanLegChain.ISwivel | undefined =
        s.swivel === undefined
          ? undefined
          : {
              branch: s.swivel.branch,
              swivel:
                s.swivel.swivel +
                (s.swivel.slope ?? []).reduce(
                  (sum: number, g: number, v: number): number =>
                    sum + g * (x[legOf(o, s.side, v)]! - s.swivel!.about![v]!),
                  0,
                ),
            };
      // The leg as the posture poses it at the ankle the course places: one
      // the leg cannot reach stands on its reachable shell along the line to
      // the ankle (`hingedArmSwivel.branches`), as the shown leg does, and
      // the reach's own constraint answers for the excess.
      const posed: HumanLegChain.IPosed | null =
        swivel === undefined
          ? null
          : HumanLegChain.pose(body, s.side, pelvis.rotation, hip, ankle, swivel);
      const held: IAutoMovieVector3 = posed?.ankle ?? ankle;
      const forward: IAutoMovieVector3 = HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: heading },
        { x: 0, y: 0, z: 1 },
      );
      const shin: IAutoMovieVector3 | null =
        posed === null ? null : Vector3.subtract(posed.knee, held);
      return {
        reach,
        dorsi:
          (shin === null
            ? walkLeg.lean(body, hip, held, heading)
            : (Math.atan2(Vector3.dot(shin, forward), shin.y) * 180) / Math.PI) +
          pitch,
        trail: walkLeg.trailing(
          body,
          { x: 0, y: 0, z: 0 },
          Quaternion.rotateVector(
            Quaternion.inverse(pelvis.rotation),
            Vector3.subtract(held, hip),
          ),
          0,
        ),
        twist: wrapDegrees(heading - HumanFoot.heading(pelvis.rotation)),
        leg:
          posed === null
            ? null
            : { ...posed, side: s.side, rotation: pivoted.rotation },
        planted: {
          side: s.side,
          pelvis: pelvis.rotation,
          hip,
          ankle,
          rotation: pivoted.rotation,
          heading,
          drop: x[o]!,
        },
      };
    };
    // How deep inside the base the knot's feet bear a point at a course's
    // pitches and turns, metres, negative outside: a foot's pitch raises a
    // point of its sole by its distance from the pivot's line times the
    // pitch's sine, so the foot bears its outline up to where that height
    // reaches `HumanFoot.BEARING`, a region that shrinks continuously as the
    // heel rises; the toes lie flat ahead of the ball.
    // Each stance's sole laid flat, read once, and turned on the floor about
    // its ankle as the course turns the foot.
    const soles: {
      outline: IAutoMovieVector3[];
      ball: IAutoMovieVector3;
      heel: IAutoMovieVector3;
      ahead: IAutoMovieVector3;
      ankle: IAutoMovieVector3;
    }[][] = knots.map((knot: IKnot) =>
      knot.stances.map((s: IStance) => ({
        outline: hull(HumanFoot.sole(body, s.side, s.placement).map(flat)),
        ball: flat(HumanFoot.point(body, s.side, "ball", s.placement)),
        heel: flat(HumanFoot.point(body, s.side, "heel", s.placement)),
        ahead: Vector3.normalize(
          flat(
            Quaternion.rotateVector(s.placement.rotation, { x: 0, y: 0, z: 1 }),
          ),
        ),
        ankle: flat(s.placement.ankle),
      })),
    );
    const sole = (
      k: number,
      j: number,
      turn: number,
      dx: number,
      dz: number,
    ) => {
      const out = soles[k]![j]!;
      if (turn === 0 && dx === 0 && dz === 0) return out;
      const turning: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        { x: 0, y: 1, z: 0 },
        turn,
      );
      const about = (p: IAutoMovieVector3): IAutoMovieVector3 => {
        const q: IAutoMovieVector3 = Vector3.add(
          out.ankle,
          Quaternion.rotateVector(turning, Vector3.subtract(p, out.ankle)),
        );
        return { x: q.x + dx, y: 0, z: q.z + dz };
      };
      return {
        outline: out.outline.map(about),
        ball: about(out.ball),
        heel: about(out.heel),
        ahead: Quaternion.rotateVector(turning, out.ahead),
        ankle: about(out.ankle),
      };
    }; // The part of a stance's sole it bears at a pitch and a turn.
    const region = (
      k: number,
      j: number,
      pitch: number,
      turn: number,
      dx: number,
      dz: number,
    ): IAutoMovieVector3[] => {
      const { outline, ball, heel, ahead } = sole(k, j, turn, dx, dz);
      const rise: number = Math.sin((Math.abs(pitch) * Math.PI) / 180);
      if (rise < 1e-9) return outline;
      return pitch < 0
        ? clip(outline, ball, ahead, -HumanFoot.BEARING / rise)
        : clip(
            outline,
            heel,
            Vector3.scale(ahead, -1),
            -HumanFoot.BEARING / rise,
          );
    };
    // A planted foot's share of the weight at a knot: the whole of it when it
    // stands alone or the take names no centre of pressure; otherwise in
    // proportion to how near the centre of pressure lies to it, against how
    // near it lies to the other foot (each nearness its distance to that
    // foot's outline, none inside it), as the centre of pressure lies where
    // the weight bears.
    const shares: number[][] = knots.map((knot: IKnot, k: number): number[] => {
      const pressure: IAutoMovieVector3 | undefined = knot.borne?.[0];
      if (knot.stances.length < 2 || pressure === undefined)
        return knot.stances.map((): number => 1);
      const far: number[] = knot.stances.map((_: IStance, j: number): number =>
        Math.max(0, -depth(soles[k]![j]!.outline, pressure)),
      );
      const sum: number = far[0]! + far[1]!;
      return sum > 0
        ? [far[1]! / sum, far[0]! / sum]
        : knot.stances.map((): number => 0.5);
    });
    const load = (k: number, j: number): number => shares[k]![j]!;
    // The base the knot's feet bear at a course's pitches and turns.
    const support = (x: Float64Array, k: number): IAutoMovieVector3[] =>
      hull(
        knots[k]!.stances.flatMap(
          (s: IStance, j: number): IAutoMovieVector3[] =>
            region(
              k,
              j,
              x[WIDTH * k + pitchOf(s.side)]!,
              x[WIDTH * k + turnOf(s.side)]!,
              x[WIDTH * k + slideOf(s.side)]!,
              x[WIDTH * k + slideOf(s.side) + 1]!,
            ),
        ),
      );

    // The starting course: flat feet, an upright or held trunk, no turn, and
    // the drop each knot's legs need.
    const x: Float64Array = new Float64Array(size);
    for (let k: number = 0; k < n; k++) {
      const o: number = WIDTH * k;
      const knot: IKnot = knots[k]!;
      x[o + 3] = knot.trunk?.pitch ?? 0;
      x[o + 4] = knot.trunk?.roll ?? 0;
      const pelvis: IPelvis = knot.pelvis({
        pitch: x[o + 3]!,
        roll: x[o + 4]!,
      });
      let drop: number = 0;
      knot.stances.forEach((s: IStance, j: number): void => {
        x[o + pitchOf(s.side)] = scheduled[k]![j]!;
        const hip: IAutoMovieVector3 = pelvis.hips[s.side];
        const dh: number = Math.hypot(
          hip.x - s.placement.ankle.x,
          hip.z - s.placement.ankle.z,
        );
        if (dh < limit)
          drop = Math.max(
            drop,
            hip.y - s.placement.ankle.y - Math.sqrt(limit * limit - dh * dh),
          );
      });
      x[o] = knot.drop ?? drop;
      // A held knot is its start's.
      if (start !== undefined && k < hold) {
        const values: number[] = [
          start.drop[k]!,
          start.pitch.left[k]!,
          start.pitch.right[k]!,
          start.trunk.pitch[k]!,
          start.trunk.roll[k]!,
          start.turn.left[k]!,
          start.turn.right[k]!,
          start.slide.left.x[k]!,
          start.slide.left.z[k]!,
          start.slide.right.x[k]!,
          start.slide.right.z[k]!,
        ];
        values.forEach((v: number, i: number): void => {
          x[o + i] = v;
        });
        continue;
      }
      // A course solved before for the same first knots starts this one.
      if (start !== undefined && k < start.knots.length) {
        if (knot.drop === undefined) x[o] = start.drop[k]!;
        if (knot.trunk === undefined) {
          x[o + 3] = start.trunk.pitch[k]!;
          x[o + 4] = start.trunk.roll[k]!;
        }
        for (const side of ["left", "right"] as const) {
          const j: number = knot.stances.findIndex(
            (s: IStance): boolean => s.side === side,
          );
          const pitch: number = start.pitch[side][k]!;
          if (
            j < 0 ||
            (scheduled[k]![j]! <= 1e-6 && pitch <= scheduled[k]![j]!)
          )
            x[o + pitchOf(side)] = pitch;
          if (j < 0 || knot.stances[j]!.turning === true)
            x[o + turnOf(side)] = start.turn[side][k]!;
          if (j < 0 || knot.stances[j]!.landing !== undefined) {
            x[o + slideOf(side)] = start.slide[side].x[k]!;
            x[o + slideOf(side) + 1] = start.slide[side].z[k]!;
          }
        }
      }
    }

    // The cost and the constraints at a course: each cost residual with its
    // gradient (the model reads both, the merit the residual alone), and each
    // constraint as its excess over its bound, in degrees, a length read as
    // the leg's turn that moves its ankle by it, with its gradient. Gradients are read only
    // when `linear` asks for them.
    const sweep = (
      x: Float64Array,
      linear: boolean,
      residual: (r: number, idx: number[], g: number[]) => void,
      constraint: (over: number, idx: number[], g: () => number[]) => void,
    ): void => {
      for (let k: number = 0; k < n; k++) {
        const o: number = WIDTH * k;
        const knot: IKnot = knots[k]!;
        // A held knot is read only through the second differences it joins.
        if (k < hold) {
          if (k > 0 && k < n - 1 && k + 1 >= hold)
            for (let s: number = 0; s < WIDTH; s++) {
              const scale: number = step * step * ACCELERATIONS[s]!;
              const a: number = o - WIDTH + s;
              const b: number = o + s;
              const c: number = o + WIDTH + s;
              residual(
                (x[a]! - 2 * x[b]! + x[c]!) / scale,
                [a, b, c],
                [1 / scale, -2 / scale, 1 / scale],
              );
            }
          continue;
        }
        // The body stands as tall and as upright as it can.
        residual(x[o]! / UPRIGHT, [o], [1 / UPRIGHT]);
        if (knot.trunk === undefined) {
          residual(x[o + 3]! / TRUNK, [o + 3], [1 / TRUNK]);
          residual(x[o + 4]! / TRUNK, [o + 4], [1 / TRUNK]);
        }
        knot.stances.forEach((s: IStance, j: number): void => {
          const p: number = o + pitchOf(s.side);
          const t: number = o + turnOf(s.side);
          const d: number = o + slideOf(s.side);
          const idx: number[] = [o, p, o + 3, o + 4, t, d, d + 1];
          const at = read(x, k, j);
          // Each variable moved once, every quantity read from that move.
          const moved: ReturnType<typeof read>[] = linear
            ? idx.map((i: number) => {
                const kept: number = x[i]!;
                x[i] = kept + STEPS[i % WIDTH]!;
                const r = read(x, k, j);
                x[i] = kept;
                return r;
              })
            : [];
          const grad = (
            pick: (r: ReturnType<typeof read>) => number,
          ): number[] =>
            moved.map(
              (r: ReturnType<typeof read>, a: number): number =>
                (pick(r) - pick(at)) / STEPS[idx[a]! % WIDTH]!,
            );
          // The ankle's dorsiflexion past heel-off, on a smooth hinge.
          const z: number = (at.dorsi - HEEL_OFF) / SPREAD;
          const slope: number = 1 / (1 + Math.exp(-z)) / SPREAD;
          const dorsi: number[] = grad((r): number => r.dorsi);
          residual(
            softplus(z),
            idx,
            dorsi.map((g: number): number => slope * g),
          );
          // Turning about the ball past the schedule's pitch, and a landing
          // foot's turn on the floor.
          residual((x[p]! - scheduled[k]![j]!) / BALL, [p], [1 / BALL]);
          if (s.turning === true) {
            residual(x[t]! / TURN, [t], [1 / TURN]);
            // The hip turns the foot no further than it rotates.
            constraint(at.twist - walkReach.TWIST, [t], (): number[] => [1]);
            constraint(-at.twist - walkReach.TWIST, [t], (): number[] => [-1]);
          }
          // A landing slides toward its goal, inside its region.
          const landing = s.landing;
          if (landing !== undefined) {
            const ankle = (dx: number, dz: number): IAutoMovieVector3 => ({
              x: s.placement.ankle.x + dx,
              y: s.placement.ankle.y,
              z: s.placement.ankle.z + dz,
            });
            const here: IAutoMovieVector3 = ankle(x[d]!, x[d + 1]!);
            residual((here.x - landing.goal.x) / PLACE, [d], [1 / PLACE]);
            residual((here.z - landing.goal.z) / PLACE, [d + 1], [1 / PLACE]);
            const excess: number[] = landing.region(here);
            excess.forEach((value: number, b: number): void => {
              constraint(value * lengthwise, [d, d + 1], (): number[] => {
                const h: number = STEPS[slideOf(s.side) % WIDTH]!;
                return [
                  (landing.region(ankle(x[d]! + h, x[d + 1]!))[b]! - value) /
                    h *
                    lengthwise,
                  (landing.region(ankle(x[d]!, x[d + 1]! + h))[b]! - value) /
                    h *
                    lengthwise,
                ];
              });
            });
          }
          // The leg reaches its ankle, the ankle stays in its range, and the
          // thigh trails no further than the hip extends.
          constraint((at.reach - limit) * lengthwise, idx, (): number[] =>
            grad((r): number => r.reach).map(
              (g: number): number => g * lengthwise,
            ),
          );
          // An ankle reaches as far as its foot is loaded: the loaded range
          // under the whole weight, the unloaded one under none, in
          // proportion between, the foot's share of the weight read from
          // where the take's centre of pressure lies between the feet
          // (`load`), so a foot that is about to leave the floor, or has just
          // met it, keeps the range of the weight it bears.
          constraint(
            at.dorsi -
              (unloadedDorsal + (dorsal - unloadedDorsal) * load(k, j)),
            idx,
            (): number[] => dorsi,
          );
          constraint(at.trail - walkReach.EXTENSION, idx, (): number[] =>
            grad((r): number => r.trail),
          );
        });
        // The feet bear the points the take asks them to: a raised heel
        // leaves each no shallower inside the base than the feet as
        // scheduled hold it, nor outside where they hold it.
        const borne: readonly IAutoMovieVector3[] = knot.borne ?? [];
        if (knot.stances.length > 0 && borne.length > 0) {
          const idx: number[] = knot.stances.flatMap((s: IStance): number[] => [
            o + pitchOf(s.side),
            o + turnOf(s.side),
            o + slideOf(s.side),
            o + slideOf(s.side) + 1,
          ]);
          const kept: number[] = idx.map((i: number): number => x[i]!);
          knot.stances.forEach((s: IStance, j: number): void => {
            x[o + pitchOf(s.side)] = scheduled[k]![j]!;
          });
          const flatBase: IAutoMovieVector3[] = support(x, k);
          idx.forEach((i: number, r: number): void => {
            x[i] = kept[r]!;
          });
          const base: IAutoMovieVector3[] = support(x, k);
          // The bases at each variable moved, built only for a constraint
          // that asks for its gradient.
          let moved: IAutoMovieVector3[][] | undefined;
          const bases = (): IAutoMovieVector3[][] =>
            (moved ??= idx.map((i: number): IAutoMovieVector3[] => {
              const before: number = x[i]!;
              x[i] = before + STEPS[i % WIDTH]!;
              const out: IAutoMovieVector3[] = support(x, k);
              x[i] = before;
              return out;
            }));
          for (const point of borne) {
            const held: number = Math.min(0, depth(flatBase, point));
            const deep: number = depth(base, point);
            constraint((held - deep) * lengthwise, idx, (): number[] =>
              bases().map(
                (hull: IAutoMovieVector3[], a: number): number =>
                  -(depth(hull, point) - deep) /
                  STEPS[idx[a]! % WIDTH]! *
                  lengthwise,
              ),
            );
          }
        }
        // Two legs that stand, both posed at the swivels the take holds, keep
        // clear of each other as the tangle audit reads them, within the
        // skin's give (`walkLegClearance`): a foot that crosses the other,
        // as a sideways recovery's does, lands and stands in front of or
        // behind it, its leg clear of the other leg.
        if (
          knot.stances.length === 2 &&
          knot.stances.every((s: IStance): boolean => s.swivel !== undefined)
        ) {
          const idx: number[] = [
            o,
            o + 3,
            o + 4,
            ...knot.stances.flatMap((s: IStance): number[] => [
              o + pitchOf(s.side),
              o + turnOf(s.side),
              o + slideOf(s.side),
              o + slideOf(s.side) + 1,
            ]),
          ];
          // The excess is the greatest of linear pieces, each a probe's depth
          // below a face plane: its gradient is its binding piece's, read
          // with each variable moved.
          const clear: walkLegClearance.IReading = walkLegClearance.reading(
            body,
            read(x, k, 0).leg!,
            read(x, k, 1).leg!,
          );
          constraint(
            (clear.excess - walkLegClearance.BOUND) * lengthwise,
            idx,
            (): number[] =>
              idx.map((i: number): number => {
                const kept: number = x[i]!;
                x[i] = kept + STEPS[i % WIDTH]!;
                const moved: number = clear.at(
                  read(x, k, 0).leg!,
                  read(x, k, 1).leg!,
                );
                x[i] = kept;
                return (moved - clear.excess) / STEPS[i % WIDTH]! * lengthwise;
              }),
          );
        }
        // The course's acceleration, each series over three knots.
        if (k > 0 && k < n - 1)
          for (let s: number = 0; s < WIDTH; s++) {
            const scale: number = step * step * ACCELERATIONS[s]!;
            const a: number = o - WIDTH + s;
            const b: number = o + s;
            const c: number = o + WIDTH + s;
            residual(
              (x[a]! - 2 * x[b]! + x[c]!) / scale,
              [a, b, c],
              [1 / scale, -2 / scale, 1 / scale],
            );
          }
      }
    };

    // The rows linear in the course, about a course, inside the trust region:
    // the drop no less than none; a planted foot pitched about its ball no
    // higher than its schedule pitches it, one the schedule sets on its heel
    // keeping that pitch; the trunk held where the take holds it; a foot that
    // has not landed in the take unturned, and a turn kept while its foot
    // stands. A foot in the air carries its pitch and its turn on the
    // acceleration alone.
    const bounds = (x: Float64Array, trust: number): Q.IRow[] => {
      const rows: Q.IRow[] = [];
      const fixed = (i: number, value: number): void => {
        rows.push({
          index: [i],
          coef: [1],
          l: value - x[i]!,
          u: value - x[i]!,
        });
      };
      const range = (
        i: number,
        low: number,
        high: number,
        wide: number,
      ): void => {
        rows.push({
          index: [i],
          coef: [1],
          l: Math.max(low - x[i]!, -wide * trust),
          u: Math.min(high - x[i]!, wide * trust),
        });
      };
      for (let k: number = 0; k < n; k++) {
        const o: number = WIDTH * k;
        const knot: IKnot = knots[k]!;
        if (k < hold) {
          for (let i: number = 0; i < WIDTH; i++) fixed(o + i, x[o + i]!);
          // A stance that runs on past the held knots keeps its turn and its
          // slide across the join.
          for (const s of knot.stances) {
            const next: IStance | undefined = knots[k + 1]?.stances.find(
              (t: IStance): boolean => t.side === s.side,
            );
            if (k + 1 >= hold && next?.placement === s.placement)
              for (const i of [
                o + turnOf(s.side),
                o + slideOf(s.side),
                o + slideOf(s.side) + 1,
              ])
                rows.push({
                  index: [i, i + WIDTH],
                  coef: [1, -1],
                  l: x[i + WIDTH]! - x[i]!,
                  u: x[i + WIDTH]! - x[i]!,
                });
          }
          continue;
        }
        if (knot.drop !== undefined) fixed(o, knot.drop);
        else range(o, 0, Infinity, TRUST.drop);
        if (knot.trunk !== undefined) {
          fixed(o + 3, knot.trunk.pitch);
          fixed(o + 4, knot.trunk.roll);
        } else {
          range(o + 3, -Infinity, Infinity, TRUST.angle);
          range(o + 4, -Infinity, Infinity, TRUST.angle);
        }
        for (const side of ["left", "right"] as const) {
          const j: number = knot.stances.findIndex(
            (s: IStance): boolean => s.side === side,
          );
          const p: number = o + pitchOf(side);
          const t: number = o + turnOf(side);
          if (j < 0) {
            range(p, -Infinity, Infinity, TRUST.angle);
            range(t, -Infinity, Infinity, TRUST.angle);
            range(o + slideOf(side), -Infinity, Infinity, TRUST.slide);
            range(o + slideOf(side) + 1, -Infinity, Infinity, TRUST.slide);
            continue;
          }
          const pitch: number = scheduled[k]![j]!;
          if (pitch > 1e-6) fixed(p, pitch);
          else range(p, -walkLeg.STEEPEST, pitch, TRUST.angle);
          const stance: IStance = knot.stances[j]!;
          if (stance.turning !== true) fixed(t, 0);
          else range(t, -Infinity, Infinity, TRUST.angle);
          const d: number = o + slideOf(side);
          for (const i of [d, d + 1])
            if (stance.landing === undefined) fixed(i, 0);
            else range(i, -Infinity, Infinity, TRUST.slide);
          // A turn kept from one knot to the next of the same stance.
          const next: IStance | undefined = knots[k + 1]?.stances.find(
            (s: IStance): boolean => s.side === side,
          );
          if (next !== undefined && next.placement === stance.placement)
            for (const i of [t, d, d + 1])
              rows.push({
                index: [i, i + WIDTH],
                coef: [1, -1],
                l: x[i + WIDTH]! - x[i]!,
                u: x[i + WIDTH]! - x[i]!,
              });
        }
      }
      return rows;
    };

    return { n, size, x, sweep, bounds, read };
  }

  /** A course's record at its variables. */
  function record(
    knots: readonly IKnot[],
    n: number,
    x: Float64Array,
    unmet: number,
    read: (x: Float64Array, k: number, j: number) => { planted: IPlanted },
  ): ICourse {
    const series = (slot: number): Float64Array =>
      Float64Array.from(
        { length: n },
        (_: unknown, k: number): number => x[WIDTH * k + slot]!,
      );
    return {
      knots,
      drop: series(0),
      pitch: { left: series(1), right: series(2) },
      trunk: { pitch: series(3), roll: series(4) },
      turn: { left: series(5), right: series(6) },
      slide: {
        left: { x: series(7), z: series(8) },
        right: { x: series(9), z: series(10) },
      },
      unmet,
      planted: knots.map((knot: IKnot, k: number): IPlanted[] =>
        knot.stances.map(
          (_: IStance, j: number): IPlanted => read(x, k, j).planted,
        ),
      ),
    };
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
   * A course's problem (`IProblem`).
   *
   * @param body The body.
   * @param knots The knots, evenly spaced.
   * @param start A course of the same take's first knots to start from.
   * @param from How many of the first knots `start` settles; none when absent.
   * @returns The problem.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the windowing.
   * @evidence contracts/development/implementation.md#principled-implementation TrajOpt's convex subproblem: the cost's Gauss-Newton model and the constraints as exact l1 penalties of their linearisations, the linear rows hard.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The window, the build, then four closures over it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every constraint the course reads is a row.
   * @evidence contracts/development/implementation.md#efficient-algorithms One sweep per evaluation or subproblem, its gradients only for the subproblem.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the course's build and record.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the build in its closures only.
   */
  export function problem(
    body: IHumanBody,
    knots: readonly IKnot[],
    start?: ICourse,
    from: number = 0,
  ): IProblem {
    const windowed: boolean =
      start !== undefined && from >= 2 && from <= start.knots.length;
    const join: number = windowed ? from - 2 : 0;
    const tail: readonly IKnot[] = windowed ? knots.slice(join) : knots;
    const built = build(
      body,
      tail,
      windowed ? cut(start!, join) : start,
      windowed ? 2 : 0,
    );
    const size: number = built.size;
    return {
      start: Float64Array.from(built.x),
      evaluate: (x: Float64Array): IEvaluation => {
        let objective: number = 0;
        let violation: number = 0;
        let worst: number = 0;
        built.sweep(
          x,
          false,
          (r: number): void => {
            objective += (r * r) / 2;
          },
          (over: number): void => {
            violation += Math.max(0, over);
            worst = Math.max(worst, over);
          },
        );
        return { objective, violation, worst };
      },
      convexify: (
        x: Float64Array,
        mu: number,
        objective: boolean = true,
      ): Q.IProblem => {
        const p: Float64Array[] = Array.from(
          { length: size },
          (): Float64Array => new Float64Array(BAND + 1),
        );
        const q: Float64Array = new Float64Array(size);
        const rows: Q.IRow[] = [];
        built.sweep(
          x,
          true,
          (r: number, idx: number[], g: number[]): void => {
            if (!objective) return;
            for (let a: number = 0; a < idx.length; a++) {
              q[idx[a]!]! += r * g[a]!;
              for (let b: number = 0; b < idx.length; b++)
                if (idx[a]! <= idx[b]!)
                  p[idx[a]!]![idx[b]! - idx[a]!]! += g[a]! * g[b]!;
            }
          },
          (over: number, idx: number[], g: () => number[]): void => {
            rows.push({
              key: `c|${rows.length}`,
              index: idx,
              coef: g(),
              l: -Infinity,
              u: -over,
              weight: mu,
            });
          },
        );
        // Each variable gets a whisker of curvature so the step's system is
        // definite where a residual leaves a variable free.
        for (let i: number = 0; i < size; i++) p[i]![0]! += 1e-9;
        return {
          n: size,
          band: BAND,
          p,
          q,
          rows,
        };
      },
      region: (x: Float64Array, radius: number): Q.IRow[] =>
        built.bounds(x, radius),
      length: (step: Float64Array): number => {
        let longest: number = 0;
        for (let i: number = 0; i < step.length; i++)
          longest = Math.max(longest, Math.abs(step[i]!) / UNIT[i % WIDTH]!);
        return longest;
      },
      stepped: (x: Float64Array, step: Float64Array): Float64Array =>
        x.map((v: number, i: number): number => v + step[i]!),
      tolerance: MET,
      course: (x: Float64Array, unmet: number): ICourse => {
        const solved: ICourse = record(tail, built.n, x, unmet, built.read);
        return windowed ? joined(knots, start!, join, solved) : solved;
      },
      planted: (x: Float64Array, knot: number): IPlanted[] =>
        knot < join + (windowed ? 2 : 0)
          ? []
          : tail[knot - join]!.stances.map(
              (_: IStance, j: number): IPlanted =>
                built.read(x, knot - join, j).planted,
            ),
      variables: (knot: number, side: "left" | "right"): number[] =>
        variables(knot - join, side),
      first: join + (windowed ? 2 : 0),
    };
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

  /** The variables of a knot: the drop, the left and the right pitch, the trunk's pitch and roll, the left and the right turn, and the left and the right slide along x and z. */
  const WIDTH: number = 11;

  /** The half-bandwidth of the course's quadratic programs: a second difference spans two knots. */
  const BAND: number = 2 * WIDTH;

  /** Each variable's forward-difference step: a hundredth of a millimetre of drop or of slide, a thousandth of a degree, a heel's toward rising. */
  const STEPS: readonly number[] = [
    1e-5, -1e-3, -1e-3, 1e-3, 1e-3, 1e-3, 1e-3, 1e-5, 1e-5, 1e-5, 1e-5,
  ];

  /** Each variable's acceleration against `ACCELERATION`. */
  const ACCELERATIONS: readonly number[] = [
    ACCELERATION.drop,
    ACCELERATION.pitch,
    ACCELERATION.pitch,
    ACCELERATION.trunk,
    ACCELERATION.trunk,
    ACCELERATION.turn,
    ACCELERATION.turn,
    ACCELERATION.drop,
    ACCELERATION.drop,
    ACCELERATION.drop,
    ACCELERATION.drop,
  ];

  /** The trust region at its widest: a step of the drop, metres, and of an angle, degrees. */
  const TRUST: { drop: number; angle: number; slide: number } = {
    drop: 0.02,
    angle: 5,
    slide: 0.02,
  };

  /** Each variable's unit in the trust region (`TRUST`), by its slot in a knot (`WIDTH`). */
  const UNIT: readonly number[] = [
    TRUST.drop,
    TRUST.angle,
    TRUST.angle,
    TRUST.angle,
    TRUST.angle,
    TRUST.angle,
    TRUST.angle,
    TRUST.slide,
    TRUST.slide,
    TRUST.slide,
    TRUST.slide,
  ];

  /** Each of a leg's own variables' scale (`LEG`), the trust region's width for it (`TRUST`): metres of drop, degrees of the trunk's tilt and of the foot's pitch and turn, metres of slide. */
  export const SCALE: readonly number[] = [
    TRUST.drop,
    TRUST.angle,
    TRUST.angle,
    TRUST.angle,
    TRUST.angle,
    TRUST.slide,
    TRUST.slide,
  ];

  /**
   * A body's course's trust-region schedule for the shared loop
   * (`HumanSequentialConvex.ISchedule`): Nocedal and Wright's Algorithm 4.1
   * (Numerical Optimization, 2nd ed., 2006) as written. A step is taken
   * where the merit falls at all, `eta` at the low end of the algorithm's
   * [0, 1/4); a step whose ratio is under 1/4 quarters the region, and one
   * over 3/4 that reaches the region's edge doubles it, to the widest. The
   * region's unit is `TRUST`, the widest step the course's linearisation is
   * trusted over, so the widest region and the first are one. The solve has
   * settled where the region could move no variable by the constraints'
   * tolerance (`MET` degrees of an angle, or a drop or a slide of the length
   * the leg turns through that many degrees to move its ankle by,
   * `reachOf`), which the region reaches from the widest in `tries`
   * quarterings, or where the model predicts a decrease under the quadratic
   * program's relative accuracy of the merit
   * (`HumanQuadraticProgram.TOLERANCE`), which its step cannot resolve.
   *
   * @param body The body.
   * @returns The schedule.
   */
  export function schedule(body: IHumanBody): SCO.ISchedule {
    const length: number = (MET * Math.PI * reachOf(body)) / 180;
    const least: number = Math.min(
      length / TRUST.drop,
      length / TRUST.slide,
      MET / TRUST.angle,
    );
    const shrink: number = 1 / 4;
    return {
      eta: 0,
      low: 1 / 4,
      high: 3 / 4,
      shrink,
      expand: 2,
      boundary: true,
      widest: 1,
      trust: 1,
      least,
      tries: Math.ceil(Math.log(least) / Math.log(shrink)),
      improved: (merit: number): number => Q.TOLERANCE * merit,
    };
  }

  /** A leg's reach at its least knee flexion (`KNEE`), metres: from its hip to its ankle, by the law of cosines over the thigh and the shank. */
  function reachOf(body: IHumanBody): number {
    return Math.sqrt(
      body.measure.thigh ** 2 +
        body.measure.shank ** 2 +
        2 *
          body.measure.thigh *
          body.measure.shank *
          Math.cos((KNEE * Math.PI) / 180),
    );
  }
  /** The penalty the course's constraints are first weighed by, which the steering raises where the course needs it (`HumanSequentialConvex.IOptions.steer`): KNITRO-Active's first penalty (Byrd, Nocedal and Waltz 2008, Optim Methods Softw 23:197; p. 13 of the 2007 technical report), as TrajOpt's (Schulman et al. 2014; sco's initial_merit_error_coeff). */
  export const PENALTY: number = 10;

  /** Convexifications per penalty at most: TrajOpt's default (sco's max_iter, 50). */
  export const ROUNDS: number = 50;

  /** Metres a landing lies off its goal that cost as much as a spread of dorsiflexion past heel-off (provisional): a landing goes where it is aimed unless the legs cannot hold it there. */
  const PLACE: number = 0.01;

  /**
   * A convex outline cut by a line: the part where `(q - at) 쨌 normal` is at
   * least `offset`.
   *
   * @param outline The outline, counter-clockwise on the floor.
   * @param at A point of the line's reference, on the floor.
   * @param normal The kept side's unit direction, on the floor.
   * @param offset The kept side's least distance along it, metres.
   * @returns The kept part's corners.
   */
  function clip(
    outline: readonly IAutoMovieVector3[],
    at: IAutoMovieVector3,
    normal: IAutoMovieVector3,
    offset: number,
  ): IAutoMovieVector3[] {
    const out: IAutoMovieVector3[] = [];
    for (let i: number = 0; i < outline.length; i++) {
      const a: IAutoMovieVector3 = outline[i]!;
      const b: IAutoMovieVector3 = outline[(i + 1) % outline.length]!;
      const da: number = Vector3.dot(Vector3.subtract(a, at), normal) - offset;
      const db: number = Vector3.dot(Vector3.subtract(b, at), normal) - offset;
      if (da >= 0) out.push(a);
      if (da >= 0 !== db >= 0) out.push(Vector3.lerp(a, b, da / (da - db)));
    }
    return out;
  }

  /**
   * The convex hull of points on the floor, counter-clockwise in x and z, by
   * Andrew's monotone chain; the few points of two soles need no more.
   *
   * @param points The points.
   * @returns The hull's corners.
   */
  function hull(points: readonly IAutoMovieVector3[]): IAutoMovieVector3[] {
    const sorted: IAutoMovieVector3[] = [...points].sort(
      (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
        a.x - b.x || a.z - b.z,
    );
    if (sorted.length < 3) return sorted;
    const turn = (
      o: IAutoMovieVector3,
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
    ): number => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
    const chain = (order: IAutoMovieVector3[]): IAutoMovieVector3[] => {
      const out: IAutoMovieVector3[] = [];
      for (const p of order) {
        while (
          out.length >= 2 &&
          turn(out[out.length - 2]!, out[out.length - 1]!, p) <= 0
        )
          out.pop();
        out.push(p);
      }
      out.pop();
      return out;
    };
    return [...chain(sorted), ...chain([...sorted].reverse())];
  }

  /**
   * How deep inside a convex outline a point lies, metres, negative outside:
   * its distance to the nearest edge, signed.
   *
   * @param hull The outline, counter-clockwise on the floor.
   * @param point The point.
   * @returns Metres.
   */
  function depth(
    hull: readonly IAutoMovieVector3[],
    point: IAutoMovieVector3,
  ): number {
    let inside: boolean = hull.length >= 3;
    let nearest: number = Infinity;
    for (let i: number = 0; i < hull.length; i++) {
      const a: IAutoMovieVector3 = hull[i]!;
      const b: IAutoMovieVector3 = hull[(i + 1) % hull.length]!;
      const ex: number = b.x - a.x;
      const ez: number = b.z - a.z;
      const px: number = point.x - a.x;
      const pz: number = point.z - a.z;
      // Counter-clockwise in x-z: the inside lies where the cross is positive.
      if (ex * pz - ez * px < 0) inside = false;
      const span: number = ex * ex + ez * ez;
      const u: number =
        span > 0 ? Math.min(1, Math.max(0, (px * ex + pz * ez) / span)) : 0;
      nearest = Math.min(nearest, Math.hypot(px - u * ex, pz - u * ez));
    }
    return inside ? nearest : -nearest;
  }

  /**
   * A placement slid on the floor.
   *
   * @param foot The placement.
   * @param dx The slide along x, metres.
   * @param dz The slide along z, metres.
   * @returns The slid placement; the same one for no slide.
   */
  function slid(
    foot: HumanFoot.IPlacement,
    dx: number,
    dz: number,
  ): HumanFoot.IPlacement {
    return dx === 0 && dz === 0
      ? foot
      : {
          ankle: {
            x: foot.ankle.x + dx,
            y: foot.ankle.y,
            z: foot.ankle.z + dz,
          },
          rotation: foot.rotation,
        };
  }

  /** A leg's `v`th variable (`LEG`) at a knot whose variables begin at `o`. */
  function legOf(o: number, side: "left" | "right", v: number): number {
    const slide: number = side === "left" ? 7 : 9;
    return (
      o +
      [0, 3, 4, side === "left" ? 1 : 2, side === "left" ? 5 : 6, slide, slide + 1][v]!
    );
  }

  /** The smooth hinge, `ln(1 + e^v)`. */
  function softplus(v: number): number {
    return v > 30 ? v : Math.log1p(Math.exp(v));
  }
}
