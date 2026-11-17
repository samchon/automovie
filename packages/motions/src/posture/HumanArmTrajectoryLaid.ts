import { Vector3 } from "@automovie/engine";

import type { HumanArmClearance } from "./HumanArmClearance";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import type { HumanArmTrajectory } from "./HumanArmTrajectory";
import { HumanArmTrajectoryClear as Clear } from "./HumanArmTrajectoryClear";
import { HumanArmTrajectoryContext } from "./HumanArmTrajectoryContext";
import { HumanArmTrajectoryMirror as Mirror } from "./HumanArmTrajectoryMirror";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPlayback } from "./HumanArmTrajectoryPlayback";
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
    trajectories: HumanArmTrajectory.Trajectory[];

    /** Whether the model admits the course. */
    admitted: boolean;

    /** The model term that refuses the course (`M.IEvaluation.worst.term`); empty when admitted. */
    refused: string;

    /** The seconds at which a transport's time law changes its piece: the end of its ramp up to the cruise and the start of its ramp down, for each transport laid with a ramp. A trajectory planned on few knots takes them as knots, since a cubic between two knots draws a ramp or a cruise, not the corner between them. */
    ramps: number[];

    /** The reading: the context builder bound to the problem's body and arms (`HumanArmTrajectoryContext.prepare`) and the context of the course's waypoints, in the mirror image `solve` reads the problem in. */
    read: {
      /** The context builder. */
      of: ReturnType<typeof HumanArmTrajectoryContext.prepare>;

      /** The context at the course's waypoints, the frame grid of the span. */
      context: M.IContext;
    };
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
   * (`T.SPEED`: elbow, wrist, fingertips) of any arm, by a trapezoid of
   * speed whose plateau is `PACE` of the audit's bound and whose two ramps
   * take the share of the span the arc leaves, `1 - L / (v T)`, no more than
   * half (the triangle): the smoothest profile of that family the span
   * allows under the bound (the time-scaling of a fixed path, Hollerbach
   * 1984). The arc is read on the first waypoint's base, the speed the
   * model reads on each waypoint's own (whose fingers may close as the hand
   * arrives): where the course's fastest step as read passes the plateau's
   * pace, the plateau is slowed by that ratio and the course timed again,
   * `RETIMES` times at most. A span too short for the arc at the plateau is
   * laid at constant speed and refused on `speed` by the reading below.
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
   * @returns The course's readers, its admission with the refusing term, and its reading; a course not admitted is `solve`'s seed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the caller gives, how the transports are laid and timed, what is read, the fixed ends, the admission and its equivalence to `solve`'s refusal test.
   * @evidence contracts/development/implementation.md#principled-implementation A joint-space blend in the optimiser's own coordinates, time-scaled along the fastest probe's arc under the speed bound, read by the same context, hard-range projection and evaluation the optimiser's iterates are read by, in the same mirror image `solve` reads a left-first problem in, so an admitted course meets every requirement a solved one meets and a mirrored course is admitted alike.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One context, the hold's encoding, two transports, one evaluation, then the shared playback factory.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No bound is relaxed; a course that misses one is returned to the caller's optimisation.
   * @evidence contracts/development/implementation.md#efficient-algorithms One context build, `ARC` placements of each arm per transport for the arc, at most `RETIMES` readings of a transport's waypoints (one placement each), and one evaluation over N waypoints, the work of a single optimiser iterate, with no limb fit, convexification or quadratic programme; a course inside a shape adds, per detour round, one Jacobian reading and one evaluation (`DETOURS` at most), where the optimiser spends a convexification, quadratic programmes and evaluations a round.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the context builder, the model's placement and evaluation and `solve`'s playback, so both paths are read alike; the builder and the context are returned for `solve` to read the same grid on.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The arc's samples live until return; the readers keep only setups, times and coordinates, as `solve`'s do, and the reading's context lives while the caller holds the result.
   */
  export function admitted(
    problem: HumanArmTrajectory.IProblem,
    held: readonly (readonly (HumanArmClearance.IArm | undefined)[])[],
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
          (arm: HumanArmTrajectory.IArm): "left" | "right" => arm.side,
        ),
      );
    const context: M.IContext = of(read);
    const n: number = context.n;
    const times: readonly number[] = context.times;
    const hold: number[] = [];
    for (let k: number = 0; k < n; ++k)
      if (held.every((arm: readonly (HumanArmClearance.IArm | undefined)[]): boolean => arm[k] !== undefined))
        hold.push(k);
    const first: number = hold.length === 0 ? n - 1 : hold[0]!;
    const last: number = hold.length === 0 ? n - 1 : hold[hold.length - 1]!;
    const x: number[][][] = held.map(
      (course: readonly (HumanArmClearance.IArm | undefined)[], a: number): number[][] =>
        course.map((arm: HumanArmClearance.IArm | undefined, k: number): number[] =>
          k === 0
            ? [...context.rest[a]!]
            : k === n - 1 && !context.open
              ? [...context.back[a]!]
              : arm === undefined || k < first || k > last
                ? []
                : M.ranged(context, a, G.encode(context.setups[a]!, arm)),
        ),
    );
    const ramps: number[] = [];
    const mix = (p: readonly number[], q: readonly number[], w: number): number[] =>
      p.map((v: number, d: number): number => v + (q[d]! - v) * w);

    // One transport between two waypoints already laid, on the blend of its
    // ends and the detours laid on it (`HumanArmTrajectoryClear`): the arcs
    // are read on the base of its first waypoint, the arms' own travel.
    // Returns the share of the path each of its waypoints stands at and the
    // seconds its time law's ramps end and start at.
    type ILaid = { shares: number[]; ramps: number[] };
    const lay = (from: number, to: number, detours: readonly Clear.IDetour[]): ILaid => {
      const shares: number[] = [];
      shares[from] = 0;
      shares[to] = 1;
      if (to - from < 2) return { shares, ramps: [] };
      const ends: [readonly number[], readonly number[]][] = x.map(
        (arm: number[][]): [readonly number[], readonly number[]] => [arm[from]!, arm[to]!],
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
      const placed = (share: number): G.IPlaced[] =>
        ends.map((_: [readonly number[], readonly number[]], a: number): G.IPlaced =>
          G.placed(context.setups[a]!, context.frames[a]![from]!, M.ranged(context, a, path(a, share))));
      const along: number[] = [0];
      let before: G.IPlaced[] = placed(0);
      for (let s: number = 1; s <= ARC; ++s) {
        const now: G.IPlaced[] = placed(s / ARC);
        let step: number = 0;
        now.forEach((arm: G.IPlaced, a: number): void => {
          for (const p of T.SPEED)
            step = Math.max(step, Vector3.length(
              Vector3.subtract(arm.probes[p]![0], before[a]!.probes[p]![0])));
        });
        along.push(along[s - 1]! + step);
        before = now;
      }
      const arc: number = along[ARC]!;
      const seconds: number = times[to]! - times[from]!;

      // The waypoints on a trapezoid of the arc whose plateau runs at a
      // speed, its ramps the share of the span the arc leaves.
      const timed = (plateau: number): number => {
        const ramp: number = Math.max(0, Math.min(0.5, 1 - arc / (plateau * seconds)));
        const run = (w: number): number =>
          ramp < 1e-9
            ? w
            : w < ramp
              ? (w * w) / (2 * ramp * (1 - ramp))
              : w > 1 - ramp
                ? 1 - ((1 - w) * (1 - w)) / (2 * ramp * (1 - ramp))
                : (w - ramp / 2) / (1 - ramp);
        for (let k: number = from + 1; k < to; ++k) {
          const reached: number = arc * run((times[k]! - times[from]!) / seconds);
          let s: number = 1;
          while (s < ARC && along[s]! < reached) ++s;
          const span: number = along[s]! - along[s - 1]!;
          const share: number = (s - 1 + (span > 1e-12 ? (reached - along[s - 1]!) / span : 0)) / ARC;
          shares[k] = share;
          x.forEach((arm: number[][], a: number): void => {
            arm[k] = M.ranged(context, a, path(a, share));
          });
        }
        return ramp;
      };

      // The speed the model reads (`M.evaluate`) is each probe's step
      // against the base of each waypoint, where the arc above is read on
      // the first waypoint's base alone: the base's own change between two
      // waypoints (the fingers' grip closing, which moves the fingertip
      // probe) and the sampled chords add to it. So the course's fastest
      // step as read is measured, and where it passes the plateau's pace
      // the plateau is slowed by that ratio and the course timed again,
      // the time scaling of a fixed path (Hollerbach 1984) applied to the
      // speed as the admission reads it.
      const fastest = (): number => {
        let most: number = 0;
        x.forEach((arm: number[][], a: number): void => {
          let before: G.IPlaced = G.placed(context.setups[a]!, context.frames[a]![from]!, arm[from]!);
          for (let k: number = from; k < to; ++k) {
            const next: G.IPlaced = G.placed(context.setups[a]!, context.frames[a]![k + 1]!, arm[k + 1]!);
            const dt: number = times[k + 1]! - times[k]!;
            for (const p of T.SPEED)
              most = Math.max(most, Vector3.length(V.step(
                context.frames[a]![k]!, context.frames[a]![k + 1]!,
                before.probes[p]![0], next.probes[p]![0])) / dt);
            before = next;
          }
        });
        return most;
      };
      let plateau: number = PACE * M.SPEED_LIMIT;
      let ramp: number = timed(plateau);
      for (let pass: number = 0; pass < RETIMES; ++pass) {
        const planned: number = arc / ((1 - ramp) * seconds);
        // A course already at constant speed cannot be slowed in its span.
        if (ramp < 1e-9) break;
        const ratio: number = fastest() / planned;
        if (ratio * planned <= PACE * M.SPEED_LIMIT) break;
        plateau = (PACE * M.SPEED_LIMIT) / ratio;
        ramp = timed(plateau);
      }
      return {
        shares,
        ramps: ramp >= 1e-9 && ramp < 0.5
          ? [times[from]! + ramp * seconds, times[to]! - ramp * seconds]
          : [],
      };
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
    const transports: ITransport[] = [[0, first], [last, n - 1]].map(
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
    let reading: M.IEvaluation = M.evaluate(context, x);
    for (let round: number = 0; round < DETOURS && reading.worst.value > M.TOLERANCE; ++round) {
      let moved: boolean = false;
      for (const t of transports) {
        if (t.done) continue;
        // One detour per arm still inside; the transport's depth is the
        // deepest of them, the progress the rule below reads.
        const found: Clear.IDetour[] =
          Clear.detour(context, x, reading, t.from, t.to, t.laid.shares, t.region);
        const depth: number = Math.max(0, ...found.map((d: Clear.IDetour): number => d.depth));
        if (found.length > 0 && t.depth !== undefined && !(depth < t.depth)) {
          t.detours.splice(t.detours.length - t.last, t.last);
          t.laid = lay(t.from, t.to, t.detours);
          t.done = true;
          moved = true;
          continue;
        }
        if (found.length === 0) {
          t.done = true;
          continue;
        }
        if (t.depth !== undefined) t.region = Math.min(Clear.WIDEST, t.region * Clear.EXPAND);
        t.depth = depth;
        t.last = found.length;
        t.detours.push(...found);
        t.laid = lay(t.from, t.to, t.detours);
        moved = true;
      }
      if (!moved) break;
      reading = M.evaluate(context, x);
    }
    for (const t of transports) ramps.push(...t.laid.ramps);
    const worst: M.IEvaluation["worst"] = reading.worst;
    return {
      trajectories: problem.arms.map(
        (_: HumanArmTrajectory.IArm, a: number): HumanArmTrajectory.Trajectory =>
          HumanArmTrajectoryPlayback(context.setups, context.times, x, a),
      ),
      admitted: worst.value <= M.TOLERANCE,
      refused: worst.value <= M.TOLERANCE ? "" : worst.term,
      ramps,
      read: { of, context },
    };
  }
}

/** The share of the audit's bound a laid transport's plateau runs at: the margin its sampled arc and its waypoints' chords leave (provisional). */
const PACE: number = 0.97;

/** The samples a laid transport's arc is read on (provisional: under a degree of any joint's travel apiece on a daily reach). */
const ARC: number = 48;

/** The detours a laid course's transports are laid round at most, each round one per transport at its deepest waypoint: the detour is the pairs' linearisation, so a pair nonlinear past it is met by the next round, and a course still inside a shape after them is the optimiser's seed (provisional). */
const DETOURS: number = 10;

/** The times a laid transport is timed again on the speed its waypoints are read at, at most: each slows the plateau by the ratio of the read speed to the planned one, which converges where the base's own motion varies little with the share (provisional). */
const RETIMES: number = 3;
