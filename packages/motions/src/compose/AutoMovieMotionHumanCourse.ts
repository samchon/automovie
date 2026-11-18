import {
  Quaternion,
  Vector3,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanCourse,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBalance } from "../everyday/HumanBalance";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";

/**
 * The course of the hips along a heading that keeps a body's extrapolated
 * centre of mass on a target while its feet move.
 *
 * A step moves the base of support, and the body stays balanced through it
 * when its extrapolated centre of mass, the centre plus its velocity over the
 * inverted pendulum's eigenfrequency `w = sqrt(g / l)` (Hof, Gazendam and
 * Sinke 2005, J Biomech 38:1; `l` 1.34 hip heights), stays inside the base.
 * Asking that point to be on a target `T(t)` is the first-order equation
 * `c' = w (T - c)` for the centre `c`: the centre follows the target the way
 * a low-pass filter follows its input, with the time constant `1 / w`, about
 * a third of a second. The centre therefore trails a foot that steps away
 * and arrives after it lands, which is what a stepping body does.
 *
 * `solve` integrates that equation on a time grid, exactly for a target held
 * over each step, and at every knot finds the hips' place at which the solved
 * posture's whole-body centre of mass (the engine's segmental model through
 * {@link HumanBalance.prepareCentre}) stands on the filtered centre. The law reads
 * the course back by a cubic through the knots.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the balance condition, its source, the equation it becomes, the integration and what is solved at each knot.
 * @evidence contracts/development/design.md#principled-representation One pure function from a posture builder and a target to a course in metres along the heading.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns the dynamic balance course of stepping laws; the mass model and the margin stay with the engine and `HumanBalance`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No gain or lag is typed: the time constant is the pendulum's and the hips' place is found on the solved posture.
 */
export namespace AutoMovieMotionHumanCourse {
  /** Seconds between two knots of the course, half a film frame. */
  export const STEP: number = 1 / 48;

  /** Corrections of the hips' place per knot. */
  export const CORRECTIONS: number = 2;

  /**
   * Solve a course.
   *
   * @param props The posture builder, the target and the span.
   * @param through Last observable second on the same clock; defaults to the original span end. The solve retains all predecessor knots and both neighbours required by the last cubic. Reads after this instant return its value.
   * @returns The hips' place along the heading at a second, clamped to the span; a span of no length holds its one solved place.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result, its clamping and the span of no length; the namespace gives the law.
   * @evidence contracts/development/implementation.md#principled-implementation The extrapolated centre of mass condition integrated exactly per step for a held target, the hips placed on the solved posture's centre by fixed-point corrections, read back by a Catmull-Rom cubic through the knots.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One synchronous metadata scope owns the knot loop; only numeric knots, count and step leave it for the interpolating closure.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The correction assumes the centre follows the hips one to one and repeats, so a leg that reconfigures is absorbed by the next correction and not by a typed gain. A span of no length has no step to interpolate across and holds its one place instead of dividing by zero.
   * @evidence contracts/development/implementation.md#efficient-algorithms One complete posture solve at the start and CORRECTIONS complete solves per knot, 48 knots per second. A fixed mass-name reader prepares once and shares exact FK and static ROM prerequisites across every correction; each read is constant work on four knots.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each knot starts from the previous place and the centre's step. Unchanged body, profile and rig fix the mass demand and ROM metadata; the posture builder may borrow the synchronous FK source for its hip observation, while every joint, limb and digit fit and mass placement is evaluated.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Construction releases its FK, name and ROM sources and posed maps on return or throw. The returned cubic retains one scalar per knot, the count, the step and the start second; no posture callback, body or solved pose enters it.
   */
  export function solve(props: IAutoMovieMotionHumanCourse.IProps, through: number = props.to): (seconds: number) => number {
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, props.yaw),
      { x: 0, y: 0, z: 1 },
    );
    const from: number = props.from;
    const { knots, count, dt }: { knots: number[]; count: number; dt: number } =
      ((): { knots: number[]; count: number; dt: number } => {
        const resolution: ReturnType<typeof prepareHumanPoseResolution> =
          prepareHumanPoseResolution();
        let projection:
          | ReturnType<typeof prepareHumanPostureProjection>
          | undefined;
        let mass: ReturnType<typeof HumanBalance.prepareCentre> | undefined;
        const centre: (seconds: number, along: number) => number = (
          seconds: number,
          along: number,
        ): number => {
          const posture: IAutoMovieMotionHumanPosture = props.posture(
            seconds,
            along,
            resolution,
          );
          mass ??= HumanBalance.prepareCentre(props.body);
          projection ??= prepareHumanPostureProjection(props.body);
          return Vector3.dot(mass(posture, resolution, projection), forward);
        };
        const omega: number = resolveAutoMovieCenterOfMass.frequency(
          resolveAutoMovieCenterOfMass.pendulum(props.body.measure.hipHeight),
        );
        const count: number = Math.max(
          1,
          Math.ceil((props.to - props.from) / STEP),
        );
        const dt: number = (props.to - props.from) / count;
        const decay: number = Math.exp(-omega * dt);
        const knots: number[] = [props.start];
        let c: number = centre(props.from, props.start);
        // Preserve the full grid spacing and every predecessor in the
        // recurrence. The cubic on interval i reads through knot i+2.
        const end: number = dt === 0 ? count : Math.min(count,
          Math.max(0, Math.floor((through - from) / dt)) + 2,
        );
        for (let i: number = 1; i <= end; i++) {
          const t: number = props.from + i * dt;
          const target: number = props.target(t - dt / 2);
          const next: number = target + (c - target) * decay;
          let along: number = knots[i - 1]! + (next - c);
          for (let k: number = 0; k < CORRECTIONS; k++)
            along -= centre(t, along) - next;
          knots.push(along);
          c = next;
        }
        return { knots, count, dt };
      })();
    const at: (seconds: number) => number = interpolate(knots, count, dt, from);
    return through >= props.to ? at : (seconds: number): number => at(Math.min(seconds, through));
  }

  /**
   * The course's cubic through its solved knots, bound outside the
   * construction scope so no posture, FK or ROM state is reachable from it:
   * the knot interval clamped to the span, Catmull-Rom slopes from the
   * neighbouring knots (the end knots repeated) and the cubic Hermite basis.
   * A span of no length has one place, held at every second.
   *
   * @param knots The hips' place at each knot, metres along the heading.
   * @param count The intervals between the knots.
   * @param dt The knots' spacing, seconds.
   * @param from The span's first second.
   * @returns The place at a second.
   */
  function interpolate(
    knots: readonly number[],
    count: number,
    dt: number,
    from: number,
  ): (seconds: number) => number {
    const knot: (i: number) => number = (i: number): number =>
      knots[Math.min(count, Math.max(0, i))]!;
    if (dt === 0) return (): number => knots[count]!;
    return (seconds: number): number => {
      const x: number = Math.min(count, Math.max(0, (seconds - from) / dt));
      const i: number = Math.min(count - 1, Math.floor(x));
      const s: number = x - i;
      const a: number = knot(i);
      const b: number = knot(i + 1);
      const ma: number = (b - knot(i - 1)) / 2;
      const mb: number = (knot(i + 2) - a) / 2;
      return (
        (2 * s * s * s - 3 * s * s + 1) * a +
        (s * s * s - 2 * s * s + s) * ma +
        (-2 * s * s * s + 3 * s * s) * b +
        (s * s * s - s * s) * mb
      );
    };
  }
}
