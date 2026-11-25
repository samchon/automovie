import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanArmTrajectory,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import type { HumanArmTrajectory } from "./HumanArmTrajectory";
import { HumanArmTrajectoryAdmission as Admission } from "./HumanArmTrajectoryAdmission";
import { HumanArmTrajectoryClear as Clear } from "./HumanArmTrajectoryClear";
import { HumanArmTrajectoryContext } from "./HumanArmTrajectoryContext";
import { HumanArmTrajectoryKnots as Knots } from "./HumanArmTrajectoryKnots";
import { HumanArmTrajectoryLay } from "./HumanArmTrajectoryLay";
import { HumanArmTrajectoryMirror as Mirror } from "./HumanArmTrajectoryMirror";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPlayback } from "./HumanArmTrajectoryPlayback";
import { HumanArmTrajectoryRetimeLaid } from "./HumanArmTrajectoryRetimeLaid";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanArmTrajectoryTravel as V } from "./HumanArmTrajectoryTravel";

/**
 * An arms' course laid without optimisation and read by the trajectory model
 * (`HumanArmTrajectory.admitted`): kept when the model admits it, the
 * optimiser's seed and frame grid when not.
 */
export namespace HumanArmTrajectoryLaid {
  /**
   * A laid course as `admitted` read it, and what that reading built, which a
   * following `HumanArmTrajectory.solve` of the same problem reads instead of
   * building it again.
   */
  export interface IAdmitted {
    /** Each arm's trajectory through the course, in the problem's order. */
    trajectories: IAutoMovieMotionHumanArmTrajectory.Trajectory[];

    /** Whether the model admits the course. */
    admitted: boolean;

    /**
     * The model term that refuses the course (`M.IEvaluation.worst.term`);
     * empty when admitted.
     */
    refused: string;

    /**
     * The reading: the context builder bound to the problem's body and arms
     * (`HumanArmTrajectoryContext.prepare`) and the context of the course's
     * waypoints, in the mirror image `solve` reads the problem in.
     */
    read: IRead;
  }

  /** The prepared inputs and verdict shared by admission and fallback. */
  interface IRead {
    /** The input in the frame the context was prepared in. */
    readonly problem: HumanArmTrajectory.IProblem;

    /** The context builder. */
    of: ReturnType<typeof HumanArmTrajectoryContext.prepare>;

    /** The context at the course's waypoints, the frame grid of the span. */
    context: M.IContext;

    /** The course's coordinates at those waypoints, each arm's. */
    x: number[][][];

    /** The bounded rates given to the returned trajectory reader. */
    rates?: Knots.IRates;

    /**
     * The model's reading of the course there; absent for a stretch cut from a
     * refused course (`HumanArmTrajectory.solve`), which is solved from that
     * course alone.
     */
    evaluation?: M.IEvaluation;
  }

  /** The inputs shared by every admission of a different hold in one problem. */
  type IPrepared = Pick<IRead, "problem" | "of" | "context">;

  /** Each arm's coordinates at authored hold waypoints, in problem order. */
  type IHeld = readonly (readonly (
    | IAutoMovieMotionHumanArmClearance.IArm
    | undefined
  )[])[];

  /**
   * A course laid without optimisation, admitted when it meets what a solved
   * trajectory must meet. The caller gives each arm on the hold, where its
   * goal's fit puts it; the reach and the return are laid here, in the model's
   * own coordinates (`G.encode`: the upper arm on its swing-twist chart, so no
   * clinical alias turns a continuous arm into a jump): every arm of the group
   * blended on one share from its rest to its arm at the hold's first waypoint,
   * and from the hold's last to its return. The share is timed along the arc of
   * the fastest bounded probe (`T.SPEED`: elbow, wrist, fingertips) of any arm,
   * using minimum jerk (Flash and Hogan 1985). The straight course fixes the
   * law's own pace, `M.UNIT` times its arc over the transport's seconds. The
   * arc is read on the first waypoint's base. The model measures actual speed
   * on each waypoint's own base, including changes such as fingers closing.
   * Where the reading finds a transport inside a shape past what the admission
   * allows, the transport is laid again round a detour of its deepest waypoint
   * (`HumanArmTrajectoryClear`), `DETOURS` rounds at most.
   *
   * The course is read by the model's own evaluation (`M.evaluate`: every site,
   * range, clearance, crossing and speed bound) at the problem's own waypoints,
   * its first and its returned last waypoint the problem's rest and back, and
   * admitted only when its worst violation is within `M.TOLERANCE`, the test
   * `solve` refuses by. The caller gives waypoints no more than a frame apart,
   * so the course is read on the frame grid a solved trajectory is admitted
   * on.
   *
   * @param problem The problem on the course's waypoints.
   * @param held Each arm's clinical triples at each waypoint of the hold, in
   *   the problem's order; a waypoint of the reach or the return is not read.
   * @param tempo The explicit replan's duration multiplier. It recovers the
   *   original seconds for the law's pace, which is never held below
   *   `M.ENVELOPE`, whether or not the span stretches.
   * @param inheritedPace The original action's speed bound in metres per second
   *   by time, retained on another contact branch.
   * @returns The course's readers, its admission with the refusing term, and
   *   its reading; a course not admitted is `solve`'s seed.
   */
  export function admitted(
    problem: HumanArmTrajectory.IProblem,
    held: IHeld,
    tempo: number = 1,
    inheritedPace?: M.IContext["speed"],
  ): IAdmitted {
    // Read in the mirror image when the first arm is the left, as `solve`
    // reads it, so a course and its mirror are admitted alike to the bit;
    // clinical triples read the same on either side.
    const read: HumanArmTrajectory.IProblem = Mirror.leftFirst(problem)
      ? Mirror.mirrored(problem)
      : problem;
    const of: ReturnType<typeof HumanArmTrajectoryContext.prepare> =
      HumanArmTrajectoryContext.prepare(
        read.body,
        read.arms.map(
          (arm: HumanArmTrajectory.IArm): AutoMovieHumanSide => arm.side,
        ),
      );
    return layCourse(
      { problem: read, of, context: of(read) },
      held,
      tempo,
      inheritedPace,
    );
  }

  /**
   * Admit a changed hold on its original frames, sites, and pace. Lay the
   * transports again and read the entire new path in those prepared frames.
   *
   * @param course The original laid course of the same canonical problem.
   * @param held The replacement hold in the course's arm order.
   * @param tempo The explicit replan's duration multiplier.
   * @returns A fresh admission of the replacement hold.
   */
  export function readmit(
    course: IAdmitted,
    held: IHeld,
    tempo: number = 1,
  ): IAdmitted {
    return layCourse(
      course.read,
      held,
      tempo,
      course.read.context.speed,
      course.read,
    );
  }

  /** Lay, time and certify the path on the prepared problem's frames. */
  function layCourse(
    prepared: IPrepared,
    held: IHeld,
    tempo: number,
    inheritedPace: M.IContext["speed"] | undefined,
    earlier?: IRead,
  ): IAdmitted {
    const { problem: read, of } = prepared;
    // A course owns only its pace and candidate coordinates. Its geometry,
    // sites and pair readers are fixed by the canonical problem.
    const context: M.IContext = { ...prepared.context };
    const n: number = context.n;
    const times: readonly number[] = context.times;
    const hold: number[] = [];
    for (let k: number = 0; k < n; ++k)
      if (
        held.every(
          (
            arm: readonly (
              | IAutoMovieMotionHumanArmClearance.IArm
              | undefined
            )[],
          ): boolean => arm[k] !== undefined,
        )
      )
        hold.push(k);
    const first: number = hold.length === 0 ? n - 1 : hold[0]!;
    const last: number = hold.length === 0 ? n - 1 : hold[hold.length - 1]!;
    const x: number[][][] = held.map(
      (
        course: readonly (IAutoMovieMotionHumanArmClearance.IArm | undefined)[],
        a: number,
      ): number[][] =>
        course.map(
          (
            arm: IAutoMovieMotionHumanArmClearance.IArm | undefined,
            k: number,
          ): number[] =>
            k === 0
              ? [...context.rest[a]!]
              : k === n - 1 && !context.open
                ? [...context.back[a]!]
                : arm === undefined || k < first || k > last
                  ? []
                  : M.ranged(context, a, G.encode(context.setups[a]!, arm)),
        ),
    );
    const scope: HumanArmTrajectoryLay.IScope = { context, read, x, times };
    const lay: (
      from: number,
      to: number,
      detours: readonly Clear.IDetour[],
      known?: number,
    ) => HumanArmTrajectoryLay.ILaid = (
      from: number,
      to: number,
      detours: readonly Clear.IDetour[],
      known?: number,
    ): HumanArmTrajectoryLay.ILaid =>
      HumanArmTrajectoryLay(scope, from, to, detours, known);

    // The reach and the return laid on their blends, then each laid again
    // round the deepest waypoint the reading finds inside a shape past what
    // the admission allows (`HumanArmTrajectoryClear.detour`), `DETOURS`
    // rounds at most, every detour of a transport kept as it is laid again.
    // A transport's region grows by the optimiser's own factor after a
    // detour that made the transport shallower, and a detour that did not is
    // taken back and ends that transport's detours: the trust region's rule
    // (Nocedal and Wright, Algorithm 4.1) on the detour's own steps.
    type ITransport = {
      from: number;
      to: number;
      detours: Clear.IDetour[];
      laid: HumanArmTrajectoryLay.ILaid;
      region: number;
      depth?: number;
      last: number;
      done: boolean;
    };
    const transports: ITransport[] = [
      [0, first],
      [last, n - 1],
    ].map(
      ([from, to]: number[]): ITransport => ({
        from: from!,
        to: to!,
        detours: [],
        laid: lay(from!, to!, []),
        region: Clear.REGION,
        last: 0,
        done: false,
      }),
    );

    // The law's own pace at every second (`M.IContext.speed`): each
    // transport's, read on its straight course above, and on the hold the
    // fastest of the hold's own motion (the arm on its sites, as the caller
    // gives it) and the two transports'. A transport the law does not move
    // takes the fastest of the others; an arm the law moves nowhere has no
    // pace to keep and none bounds it.
    const holding: number =
      inheritedPace === undefined
        ? ((): number => {
            let most: number = 0;
            x.forEach((arm: number[][], a: number): void => {
              let previous:
                | IAutoMovieMotionHumanArmGeometry.IPlaced
                | undefined;
              for (let k: number = first; first < last && k <= last; ++k) {
                const before:
                  | IAutoMovieMotionHumanArmGeometry.IPlaced
                  | undefined = previous;
                previous =
                  arm[k]!.length === 0
                    ? undefined
                    : G.placed(
                        context.setups[a]!,
                        context.frames[a]![k]!,
                        arm[k]!,
                        false,
                      );
                if (before === undefined || previous === undefined) continue;
                for (const p of T.SPEED)
                  most = Math.max(
                    most,
                    Vector3.length(
                      V.step(
                        context.frames[a]![k - 1]!,
                        context.frames[a]![k]!,
                        before.probes[p]![0],
                        previous.probes[p]![0],
                      ),
                    ) /
                      (times[k]! - times[k - 1]!),
                  );
              }
            });
            return most;
          })()
        : 0;
    const reach: ITransport = transports[0]!;
    const back: ITransport = transports[1]!;
    const widest: number = Math.max(reach.laid.pace, back.laid.pace, holding);
    // The course may move as fast as a daily reach's fastest hand
    // (`M.ENVELOPE`) where the law's own pace is slower, whether or not its
    // span stretches: stretching decides only what a refusal for speed
    // does (`HumanArmTrajectory.solve`), never what is fast enough.
    const paced = (pace: number): number => {
      const own: number = pace > 0 ? pace : widest > 0 ? widest : Infinity;
      // Replanning gives this path more seconds, so the law's pace continues
      // to read the original seconds (current seconds / tempo).
      return Math.max(own * tempo, M.ENVELOPE);
    };
    const onHold: number = paced(widest);
    const reachPace: number = paced(reach.laid.pace);
    const backPace: number = paced(back.laid.pace);
    context.speed =
      inheritedPace ??
      ((seconds: number): number =>
        seconds <= times[first]!
          ? reachPace
          : seconds >= times[last]!
            ? backPace
            : onHold);

    // The earlier reading shares this exact clock, pace and geometry. Mark
    // any changed coordinate so evaluation also rereads the adjacent sweep
    // windows that use it.
    let kept: Parameters<typeof M.evaluate>[2] = undefined;
    if (earlier?.evaluation !== undefined) {
      const laid: boolean[] = times.map(
        (_: number, k: number): boolean =>
          x.some((arm: number[][], a: number): boolean => {
            const before: number[] = earlier.x[a]![k]!;
            const after: number[] = arm[k]!;
            return (
              before.length !== after.length ||
              after.some(
                (value: number, d: number): boolean =>
                  !Object.is(value, before[d]),
              )
            );
          }),
      );
      if (laid.some((changed: boolean): boolean => !changed))
        kept = { reading: earlier.evaluation, laid };
    }
    let reading: M.IEvaluation = M.evaluate(context, x, kept);
    const relaid: boolean[] = new Array<boolean>(n).fill(false);
    for (const t of transports) {
      if (
        !t.laid.effector ||
        !reading.failing.slice(t.from + 1, t.to).some(Boolean)
      )
        continue;
      t.laid = lay(t.from, t.to, [], t.laid.pace);
      for (let k: number = t.from + 1; k < t.to; ++k) relaid[k] = true;
    }
    if (relaid.some(Boolean))
      reading = M.evaluate(context, x, { reading, laid: relaid });
    for (
      let round: number = 0;
      round < DETOURS && reading.worst.value > M.TOLERANCE;
      ++round
    ) {
      let moved: boolean = false;

      // The waypoints this round lays again, a transport's inner ones: every
      // other waypoint keeps its coordinates, so the round's reading reads
      // only these (`M.evaluate`'s `kept`).
      const laid: boolean[] = new Array<boolean>(n).fill(false);
      const relay = (t: ITransport): void => {
        t.laid = lay(t.from, t.to, t.detours, t.laid.pace);
        for (let k: number = t.from + 1; k < t.to; ++k) laid[k] = true;
      };
      for (const t of transports) {
        if (t.done) continue;
        // One detour per arm still inside; the transport's depth is the
        // deepest of them, the progress the rule below reads.
        const found: Clear.IDetour[] = Clear.detour(
          context,
          x,
          reading,
          t.from,
          t.to,
          t.laid.shares,
          t.region,
        );
        const depth: number = Math.max(
          0,
          ...found.map((d: Clear.IDetour): number => d.depth),
        );
        if (found.length > 0 && t.depth !== undefined && !(depth < t.depth)) {
          t.detours.splice(t.detours.length - t.last, t.last);
          relay(t);
          t.done = true;
          moved = true;
          continue;
        }
        if (found.length === 0) {
          t.done = true;
          continue;
        }
        if (t.depth !== undefined)
          t.region = Math.min(Clear.WIDEST, t.region * Clear.EXPAND);
        t.depth = depth;
        t.last = found.length;
        t.detours.push(...found);
        relay(t);
        moved = true;
      }
      if (!moved) break;
      reading = M.evaluate(context, x, { reading, laid });
    }
    reading = HumanArmTrajectoryRetimeLaid(
      context,
      x,
      reading,
      transports,
      HumanArmTrajectoryLay.blend,
    );
    const rates: Knots.IRates = Knots.bounded(context, x);
    reading = Admission.continuous(context, times, x, rates, reading);
    const worst: M.IEvaluation["worst"] = reading.worst;
    return {
      trajectories: read.arms.map(
        (
          _: HumanArmTrajectory.IArm,
          a: number,
        ): IAutoMovieMotionHumanArmTrajectory.Trajectory =>
          HumanArmTrajectoryPlayback(
            context.setups,
            context.times,
            x,
            a,
            rates,
          ),
      ),
      admitted: worst.value <= M.TOLERANCE,
      refused: worst.value <= M.TOLERANCE ? "" : worst.term,
      read: { problem: read, of, context, x, rates, evaluation: reading },
    };
  }
}

/**
 * The detours a laid course's transports are laid round at most, each round one
 * per transport at its deepest waypoint: the detour is the pairs'
 * linearisation, so a pair nonlinear past it is met by the next round, and a
 * course still inside a shape after them is the optimiser's seed
 * (provisional).
 */
const DETOURS: number = 10;
