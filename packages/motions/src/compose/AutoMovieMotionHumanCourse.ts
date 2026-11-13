import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanBalance } from "../everyday/HumanBalance";
import type { IHumanPosture } from "../posture/IHumanPosture";

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
 * {@link HumanBalance.support}) stands on the filtered centre. The law reads
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
   * What a course is solved from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and its unit.
   * @evidence contracts/development/design.md#principled-representation A posture builder, a target and a time span.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Seven members, all read by `solve`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The target is a function of time, so no foot path is assumed.
   */
  export interface IProps {
    /** The body. */
    body: IHumanBody;

    /** The heading the course runs along, degrees about +Y. */
    yaw: number;

    /**
     * The posture at a second with the hips a distance along the heading, metres.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the two arguments, a second and the hips' place in metres along the heading, and the posture returned.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback type with no body: the caller supplies the function, so no method is declared here.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback type with no body: the structure is the caller's.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback type with no body: nothing here computes a value.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback type with no body: its cost is the caller's, once per correction at each knot.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback type with no body: it shares nothing.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback type with no body: it acquires and retains nothing.
     */
    posture: (seconds: number, along: number) => IHumanPosture;

    /**
     * Where the extrapolated centre of mass is asked at a second, world metres along the heading.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument in seconds and the returned place in world metres along the heading.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback type with no body: the caller supplies the function, so no method is declared here.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback type with no body: the structure is the caller's.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback type with no body: nothing here computes a value.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback type with no body: its cost is the caller's, once per knot.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback type with no body: it shares nothing.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback type with no body: it acquires and retains nothing.
     */
    target: (seconds: number) => number;

    /** The span's first second. */
    from: number;

    /** The span's last second. */
    to: number;

    /** The hips' place at the span's first second, metres along the heading. */
    start: number;
  }

  /**
   * Solve a course.
   *
   * @param props The posture builder, the target and the span.
   * @returns The hips' place along the heading at a second, clamped to the span.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result and its clamping; the namespace gives the law.
   * @evidence contracts/development/implementation.md#principled-implementation The extrapolated centre of mass condition integrated exactly per step for a held target, the hips placed on the solved posture's centre by fixed-point corrections, read back by a Catmull-Rom cubic.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the knots and one interpolating closure.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The correction assumes the centre follows the hips one to one and repeats, so a leg that reconfigures is absorbed by the next correction and not by a typed gain.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve at the start and `CORRECTIONS` per knot, 48 knots a second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each knot starts from the previous knot's place moved by the centre's step, so two corrections suffice.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned closure holds one number per knot.
   */
  export function solve(props: IProps): (seconds: number) => number {
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, props.yaw),
      { x: 0, y: 0, z: 1 },
    );
    const centre = (seconds: number, along: number): number =>
      Vector3.dot(
        HumanBalance.support(props.body, props.posture(seconds, along)).centre,
        forward,
      );
    const omega: number = Math.sqrt(
      9.81 / (1.34 * props.body.measure.hipHeight),
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
    const knot = (i: number): number =>
      knots[Math.min(count, Math.max(0, i))]!;
    return (seconds: number): number => {
      const x: number = Math.min(
        count,
        Math.max(0, (seconds - props.from) / dt),
      );
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
