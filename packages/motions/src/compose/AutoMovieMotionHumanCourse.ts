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


  /**
   * Solve a course.
   *
   * @param props The posture builder, the target and the span.
   * @returns The hips' place along the heading at a second, clamped to the span.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result and its clamping; the namespace gives the law. Companion interpolate: States solved numeric provenance, clamped cubic readback and separation from construction-only pose/FK/ROM state.
   * @evidence contracts/development/implementation.md#principled-implementation The extrapolated centre of mass condition integrated exactly per step for a held target, the hips placed on the solved posture's centre by fixed-point corrections, read back by a Catmull-Rom cubic. Companion interpolate: Uses the original clamped knot lookup, endpoint half-difference slopes and Catmull-Rom polynomial in its unchanged arithmetic order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One synchronous metadata scope owns the original knot loop; only numeric knots/count/step leave it for the unchanged interpolating closure. Companion interpolate: One numeric reader factory owns clamped knot lookup and the same four-term polynomial; the mass/posture construction can release all unrelated state before this reader is returned.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The correction assumes the centre follows the hips one to one and repeats, so a leg that reconfigures is absorbed by the next correction and not by a typed gain. Companion interpolate: No knot, slope, time clamp or polynomial term changes; the original zero-duration and nonfinite arithmetic remain without a fallback or extra sample.
   * @evidence contracts/development/implementation.md#efficient-algorithms Retains one complete posture solve at the start and CORRECTIONS complete solves per knot, 48 knots per second. A native fixed mass-name reader prepares once, skips unused foot-support geometry and shares exact FK/static ROM prerequisites across every actual correction. Companion interpolate: Constant work and four bounded knot accesses per actual time query; construction-time geometry and fits are absent from this playback path as before.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each knot keeps its original previous-place/centre-step initialization. Unchanged body/profile/rig establish fixed mass demand and genuine ROM metadata; the actual posture builder may borrow that synchronous FK source for its raw hip observation, while all current joints/limb/digit fits and mass placements remain evaluated. Companion interpolate: The fixed solved knot array and numeric span coefficients belong to this course; every supplied second computes the same current interpolation and no time/result is cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Course construction releases its bounded FK/name/ROM sources and actual posed maps on return or throw. The returned cubic retains only one scalar per knot, count, step and start second; neither posture callbacks, body, source getters nor current solved poses enter it. Companion interpolate: The course owns only its numeric knots, count, step and start second until release; no body, posture callback, mass reader, FK source, ROM projector or prior result is reachable through this factory's lexical scope.
   */
  export function solve(props: IAutoMovieMotionHumanCourse.IProps): (seconds: number) => number {
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
        for (let i: number = 1; i <= count; i++) {
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
    return interpolate(knots, count, dt, from);
  }

  /**
   * Bind the original clamped cubic using only solved numeric course data,
   * outside the posture/metadata construction scope.
   *
   * States solved numeric provenance, clamped cubic readback and separation from construction-only pose/FK/ROM state.
   * Uses the original clamped knot lookup, endpoint half-difference slopes and Catmull-Rom polynomial in its unchanged arithmetic order.
   * One numeric reader factory owns clamped knot lookup and the same four-term polynomial; the mass/posture construction can release all unrelated state before this reader is returned.
   * No knot, slope, time clamp or polynomial term changes; the original zero-duration and nonfinite arithmetic remain without a fallback or extra sample.
   * Constant work and four bounded knot accesses per actual time query; construction-time geometry and fits are absent from this playback path as before.
   * The fixed solved knot array and numeric span coefficients belong to this course; every supplied second computes the same current interpolation and no time/result is cached.
   * The course owns only its numeric knots, count, step and start second until release; no body, posture callback, mass reader, FK source, ROM projector or prior result is reachable through this factory's lexical scope.
   */
  function interpolate(
    knots: readonly number[],
    count: number,
    dt: number,
    from: number,
  ): (seconds: number) => number {
    const knot: (i: number) => number = (i: number): number =>
      knots[Math.min(count, Math.max(0, i))]!;
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
