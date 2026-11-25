import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanArmTrajectory,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import type { HumanArmTrajectory } from "./HumanArmTrajectory";
import { HumanArmTrajectoryBridge } from "./HumanArmTrajectoryBridge";
import { HumanArmTrajectoryClear as Clear } from "./HumanArmTrajectoryClear";
import { HumanArmTrajectoryContext } from "./HumanArmTrajectoryContext";
import { HumanArmTrajectoryEffector } from "./HumanArmTrajectoryEffector";
import { HumanArmTrajectoryMirror as Mirror } from "./HumanArmTrajectoryMirror";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPlayback } from "./HumanArmTrajectoryPlayback";
import { HumanArmTrajectoryRetime } from "./HumanArmTrajectoryRetime";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanArmTrajectoryTravel as V } from "./HumanArmTrajectoryTravel";

/**
 * An arms' course laid without optimisation and read by the trajectory
 * model (`HumanArmTrajectory.admitted`): kept when the model admits it,
 * the optimiser's seed and frame grid when not.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the module lays, who reads it and what becomes of it either way.
 * @evidence contracts/development/design.md#principled-representation The course as the arms' coordinates on the frame grid's instants, its verdict and the context it was read on.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The record and its one producer, read through `HumanArmTrajectory` by ArmCourse and ArmPlanned.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No bound is the course's own: the admission is the model's evaluation.
 */
export namespace HumanArmTrajectoryLaid {
  /**
   * A laid course as `admitted` read it, and what that reading built, which
   * a following `HumanArmTrajectory.solve` of the same problem reads instead
   * of building it again.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member, when the course is kept and what the reading's context is for.
   * @evidence contracts/development/design.md#principled-representation The course's readers, its verdict with the refusing term, and the frame grid's context the verdict was read on.
   * @evidence contracts/development/design.md#minimal-and-owned-surface ArmPlanned reads the verdict and the readers, ArmCourse the refusing term, and `solve` the reading.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The context is the model's own record, handed on whole; no part of it is restated.
   */
  export interface IAdmitted {
    /** Each arm's trajectory through the course, in the problem's order. */
    trajectories: IAutoMovieMotionHumanArmTrajectory.Trajectory[];

    /** Whether the model admits the course. */
    admitted: boolean;

    /** The model term that refuses the course (`M.IEvaluation.worst.term`); empty when admitted. */
    refused: string;

    /** The reading: the context builder bound to the problem's body and arms (`HumanArmTrajectoryContext.prepare`) and the context of the course's waypoints, in the mirror image `solve` reads the problem in. */
    read: IRead;
  }

  /** The prepared inputs and verdict shared by admission and fallback. */
  interface IRead {
    /** The context builder. */
    of: ReturnType<typeof HumanArmTrajectoryContext.prepare>;

    /** The context at the course's waypoints, the frame grid of the span. */
    context: M.IContext;

    /** The course's coordinates at those waypoints, each arm's. */
    x: number[][][];

    /** The model's reading of the course there; absent for a stretch cut from a refused course (`HumanArmTrajectory.solve`), which is solved from that course alone. */
    evaluation?: M.IEvaluation;
  }

  /**
   * A course laid without optimisation, admitted when it meets what a solved
   * trajectory must meet. The caller gives each arm on the hold, where its
   * goal's fit puts it; the reach and the return are laid here, in the
   * model's own coordinates (`G.encode`: the upper arm on its swing-twist
   * chart, so no clinical alias turns a continuous arm into a jump): every
   * arm of the group blended on one share from its rest to its arm at the
   * hold's first waypoint, and from the hold's last to its return. The
   * share is timed along the arc of the fastest bounded probe
   * (`T.SPEED`: elbow, wrist, fingertips) of any arm, using minimum jerk
   * (Flash and Hogan 1985). The straight course fixes the law's own pace,
   * `M.UNIT` times its arc over the transport's seconds. The arc is read
   * on the first waypoint's base. The model measures actual speed on each
   * waypoint's own base, including changes such as fingers closing.
   * Where the reading finds a transport inside a shape past what the
   * admission allows, the transport is laid again round a detour of its
   * deepest waypoint (`HumanArmTrajectoryClear`), `DETOURS` rounds at most.
   *
   * The course is read by the model's own evaluation (`M.evaluate`: every
   * site, range, clearance, crossing and speed bound) at the problem's own
   * waypoints, its first and its returned last waypoint the problem's rest
   * and back, and admitted only when its worst violation is within
   * `M.TOLERANCE`, the test `solve` refuses by. The caller gives waypoints
   * no more than a frame apart, so the course is read on the frame grid a
   * solved trajectory is admitted on.
   *
   * @param problem The problem on the course's waypoints.
   * @param held Each arm's clinical triples at each waypoint of the hold, in the problem's order; a waypoint of the reach or the return is not read.
   * @param tempo The explicit replan's duration multiplier. It recovers the original seconds for the law's pace, which is never held below `M.ENVELOPE`, whether or not the span stretches.
   * @param inheritedPace The original action's speed bound in metres per second by time, retained on another contact branch.
   * @returns The course's readers, its admission with the refusing term, and its reading; a course not admitted is `solve`'s seed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the caller gives, how the transports are laid and timed, what is read, the fixed ends, the admission and its equivalence to `solve`'s refusal test.
   * @evidence contracts/development/implementation.md#principled-implementation A joint-space blend in the optimiser's own coordinates, time-scaled along the fastest probe's arc under the speed bound, read by the same context, hard-range projection and evaluation the optimiser's iterates are read by, in the same mirror image `solve` reads a left-first problem in, so an admitted course meets every requirement a solved one meets and a mirrored course is admitted alike.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One context, the hold's encoding, two transports, one evaluation, then the shared playback factory.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No bound is relaxed; a course that misses one is returned to the caller's optimisation.
   * @evidence contracts/development/implementation.md#efficient-algorithms One context build, `ARC` placements of each arm per transport for the arc, a forward pass through the waypoints and arc samples, and one model evaluation. A collision can add one Jacobian reading per detoured arm and one evaluation of only the waypoints replaced in that round, up to `DETOURS` rounds.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the context builder, the model's placement and evaluation and `solve`'s playback, so both paths are read alike; the builder and the context are returned for `solve` to read the same grid on.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The arc's samples live until return; the readers keep only setups, times and coordinates, as `solve`'s do, and the reading's context lives while the caller holds the result.
   */
  export function admitted(
    problem: HumanArmTrajectory.IProblem,
    held: readonly (readonly (
      | IAutoMovieMotionHumanArmClearance.IArm
      | undefined
    )[])[],
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
    const context: M.IContext = of(read);
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
    const mix = (
      p: readonly number[],
      q: readonly number[],
      w: number,
    ): number[] => p.map((v: number, d: number): number => v + (q[d]! - v) * w);

    // One transport between two waypoints already laid, on the blend of its
    // ends and the detours laid on it (`HumanArmTrajectoryClear`): the arcs
    // are read on the base of its first waypoint, the arms' own travel.
    // Returns the share of the path each of its waypoints stands at.
    // The pace is the law's own on the transport: `UNIT` times its straight
    // arc (no detour) over its seconds, read where it is first laid.
    interface ILaid {
      /** Each waypoint's progress along this transport. */
      shares: number[];
      /** The original joint arc's speed bound, metres per second. */
      pace: number;
      /** The transport follows a straight wrist path in the carrier frame. */
      effector: boolean;
    }
    const lay = (
      from: number,
      to: number,
      detours: readonly Clear.IDetour[],
      known?: number,
    ): ILaid => {
      const shares: number[] = [];
      shares[from] = 0;
      shares[to] = 1;
      const seconds: number = times[to]! - times[from]!;
      if (!(seconds > 0)) return { shares, pace: known ?? 0, effector: false };
      const ends: [readonly number[], readonly number[]][] = x.map(
        (arm: number[][]): [readonly number[], readonly number[]] => [
          arm[from]!,
          arm[to]!,
        ],
      );
      const path = (a: number, share: number): number[] => {
        const out: number[] = mix(ends[a]![0], ends[a]![1], share);
        for (const detour of detours) {
          const w: number = Clear.bump(share, detour.share);
          if (w > 0)
            detour.delta[a]!.forEach((v: number, d: number): void => {
              out[d]! += w * v;
            });
        }
        return out;
      };
      const placed = (
        share: number,
      ): IAutoMovieMotionHumanArmGeometry.IPlaced[] =>
        ends.map(
          (
            _: [readonly number[], readonly number[]],
            a: number,
          ): IAutoMovieMotionHumanArmGeometry.IPlaced =>
            G.placed(
              context.setups[a]!,
              context.frames[a]![from]!,
              M.ranged(context, a, path(a, share)),
              false,
            ),
        );
      const along: number[] = [0];
      let before: IAutoMovieMotionHumanArmGeometry.IPlaced[] = placed(0);
      for (let s: number = 1; s <= ARC; ++s) {
        const now: IAutoMovieMotionHumanArmGeometry.IPlaced[] = placed(s / ARC);
        let step: number = 0;
        now.forEach(
          (arm: IAutoMovieMotionHumanArmGeometry.IPlaced, a: number): void => {
            for (const p of T.SPEED)
              step = Math.max(
                step,
                Vector3.length(
                  Vector3.subtract(arm.probes[p]![0], before[a]!.probes[p]![0]),
                ),
              );
          },
        );
        along.push(along[s - 1]! + step);
        before = now;
      }
      const arc: number = along[ARC]!;
      const pace: number = known ?? (M.UNIT * arc) / seconds;

      // A single interval has a pace but no interior waypoint to lay.
      if (to - from === 1) return { shares, pace, effector: false };

      // A straight wrist path is the first option. Its endpoints are
      // expressed in their own carrier frames, so a moving base never
      // changes the path the arm itself takes. The joint arc retains the
      // original pace and is the alternative when the wrist path fails.
      if (known === undefined) {
        const solvers: ReturnType<typeof HumanArmTrajectoryEffector>[] =
          ends.map(
            (
              [p, q],
              a: number,
            ): ReturnType<typeof HumanArmTrajectoryEffector> =>
              HumanArmTrajectoryEffector(
                context.setups[a]!,
                { frame: context.frames[a]![from]!, coordinates: p },
                { frame: context.frames[a]![to]!, coordinates: q },
                read.arms[a]!.sites[from]?.rotation !== undefined ? read.arms[a]!.sites[from]!.contact
                  : read.arms[a]!.sites[to]?.rotation !== undefined ? read.arms[a]!.sites[to]!.contact : undefined,
              ),
          );
        const tried: number[][][] | undefined = HumanArmTrajectoryBridge(
          times.slice(from, to + 1), ends, solvers, path,
        );
        if (tried !== undefined) {
          for (let k: number = from + 1; k < to; ++k) {
            shares[k] = minimumJerk.share((times[k]! - times[from]!) / seconds);
            x.forEach((arm: number[][], a: number): void => {
              arm[k] = M.ranged(context, a, tried[a]![k - from]!);
            });
          }
          return { shares, pace, effector: true };
        }
      }

      // The waypoints on the minimum-jerk time law of the arc (Flash and
      // Hogan 1985): the share of the arc reached at a share `w` of the span
      // is `10 w^3 - 15 w^4 + 6 w^5`, whose peak speed is `M.UNIT` times the
      // arc over the span, the law's own pace on a straight lay. A detour's
      // longer arc, or a base whose own change adds to a probe's step, can
      // pass the pace; the reading below refuses that stretch to the
      // optimiser, which alone may leave the closed form.
      let s: number = 1;
      for (let k: number = from + 1; k < to; ++k) {
        const w: number = (times[k]! - times[from]!) / seconds;
        const reached: number = arc * minimumJerk.share(w);
        while (s < ARC && along[s]! < reached) ++s;
        const span: number = along[s]! - along[s - 1]!;
        const share: number =
          (s - 1 + (span > 1e-12 ? (reached - along[s - 1]!) / span : 0)) / ARC;
        shares[k] = share;
        x.forEach((arm: number[][], a: number): void => {
          arm[k] = M.ranged(context, a, path(a, share));
        });
      }
      return { shares, pace, effector: false };
    };

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
      laid: ILaid;
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
    const holding: number = inheritedPace === undefined ? ((): number => {
      let most: number = 0;
      x.forEach((arm: number[][], a: number): void => {
        let previous: IAutoMovieMotionHumanArmGeometry.IPlaced | undefined;
        for (let k: number = first; first < last && k <= last; ++k) {
          const before: IAutoMovieMotionHumanArmGeometry.IPlaced | undefined =
            previous;
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
    })() : 0;
    const [reach, back]: ITransport[] = transports as [ITransport, ITransport];
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
    context.speed = inheritedPace ?? ((seconds: number): number =>
      seconds <= times[first]!
        ? reachPace
        : seconds >= times[last]!
          ? backPace
          : onHold);

    let reading: M.IEvaluation = M.evaluate(context, x);
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
    reading = HumanArmTrajectoryRetime(context, x, reading, transports, mix);
    const worst: M.IEvaluation["worst"] = reading.worst;
    return {
      trajectories: problem.arms.map(
        (
          _: HumanArmTrajectory.IArm,
          a: number,
        ): IAutoMovieMotionHumanArmTrajectory.Trajectory =>
          HumanArmTrajectoryPlayback(context.setups, context.times, x, a),
      ),
      admitted: worst.value <= M.TOLERANCE,
      refused: worst.value <= M.TOLERANCE ? "" : worst.term,
      read: { of, context, x, evaluation: reading },
    };
  }
}

/** The samples a laid transport's arc is read on (provisional: under a degree of any joint's travel apiece on a daily reach). */
const ARC: number = 48;

/** The detours a laid course's transports are laid round at most, each round one per transport at its deepest waypoint: the detour is the pairs' linearisation, so a pair nonlinear past it is met by the next round, and a course still inside a shape after them is the optimiser's seed (provisional). */
const DETOURS: number = 10;
