import { Vector3 } from "@automovie/engine";

import type { HumanArmClearance } from "./HumanArmClearance";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import type { HumanArmTrajectory } from "./HumanArmTrajectory";
import { HumanArmTrajectoryContext } from "./HumanArmTrajectoryContext";
import { HumanArmTrajectoryMirror as Mirror } from "./HumanArmTrajectoryMirror";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPlayback } from "./HumanArmTrajectoryPlayback";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

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
   * 1984). A span too short for the arc at the plateau is laid at constant
   * speed and refused on `speed` by the reading below.
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
   * @evidence contracts/development/implementation.md#efficient-algorithms One context build, `ARC` placements of each arm per transport for the arc, and one evaluation over N waypoints, the work of a single optimiser iterate, with no limb fit, convexification or quadratic programme.
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
    const mix = (p: readonly number[], q: readonly number[], w: number): number[] =>
      p.map((v: number, d: number): number => v + (q[d]! - v) * w);

    // One transport between two waypoints already laid: the arcs are read
    // on the base of its first waypoint, the arms' own travel.
    const lay = (from: number, to: number): void => {
      if (to - from < 2) return;
      const ends: [readonly number[], readonly number[]][] = x.map(
        (arm: number[][]): [readonly number[], readonly number[]] => [arm[from]!, arm[to]!],
      );
      const placed = (share: number): G.IPlaced[] =>
        ends.map(([p, q]: [readonly number[], readonly number[]], a: number): G.IPlaced =>
          G.placed(context.setups[a]!, context.frames[a]![from]!, mix(p, q, share)));
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
      const ramp: number = Math.max(0, Math.min(0.5, 1 - arc / (PACE * M.SPEED_LIMIT * seconds)));
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
        x.forEach((arm: number[][], a: number): void => {
          arm[k] = M.ranged(context, a, mix(ends[a]![0], ends[a]![1], share));
        });
      }
    };
    lay(0, first);
    lay(last, n - 1);
    const worst: M.IEvaluation["worst"] = M.evaluate(context, x).worst;
    return {
      trajectories: problem.arms.map(
        (_: HumanArmTrajectory.IArm, a: number): HumanArmTrajectory.Trajectory =>
          HumanArmTrajectoryPlayback(context.setups, context.times, x, a),
      ),
      admitted: worst.value <= M.TOLERANCE,
      refused: worst.value <= M.TOLERANCE ? "" : worst.term,
      read: { of, context },
    };
  }
}

/** The share of the audit's bound a laid transport's plateau runs at: the margin its sampled arc and its waypoints' chords leave (provisional). */
const PACE: number = 0.97;

/** The samples a laid transport's arc is read on (provisional: under a degree of any joint's travel apiece on a daily reach). */
const ARC: number = 48;
