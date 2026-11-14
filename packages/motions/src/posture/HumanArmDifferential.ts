import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";

/**
 * Differential inverse kinematics of an arm: the coordinates' step that moves
 * a point the hand carries by a small displacement, by damped least squares
 * (Wampler 1986, "Manipulator inverse kinematic solutions based on vector
 * formulations and damped least-squares methods", IEEE SMC 16:93), what both
 * the hold's seed and the follower map a site's motion onto the arm with.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the step maps, its source and its two readers.
 * @evidence contracts/development/design.md#principled-representation A displacement of a carried point mapped to the arm's coordinates by the contact's Jacobian.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, read by `HumanArmSeed` and `AutoMovieMotionHumanArmFollow`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts One map of a site's motion onto the arm, shared, not one per reader.
 */
export namespace HumanArmDifferential {
  /**
   * One damped least-squares step: `Jᵀ(JJᵀ + λ²I)⁻¹ r`, the contact's
   * Jacobian in the arm's free coordinates by central differences, `λ²` a
   * millionth of the Jacobian's own scale so a singular arm takes a bounded
   * step. A zero displacement gives a zero step.
   *
   * @param setup The arm.
   * @param frame What the arm is read against.
   * @param q The coordinates.
   * @param contact The point the hand carries, in its frame from the wrist.
   * @param r The displacement, metres.
   * @returns The coordinates' step.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the formula, the Jacobian, the damping and the zero case.
   * @evidence contracts/development/implementation.md#principled-implementation Damped least squares (Wampler 1986) on a central-difference Jacobian of the arm's own forward placement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One Jacobian, one damped three-by-three solve, one back-projection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A zero displacement returns a zero step, not a small one.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two forward placements per free coordinate and one Cramer solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanArmGeometry.placed`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function step(
    setup: G.ISetup,
    frame: G.IFrame,
    q: readonly number[],
    contact: IAutoMovieVector3,
    r: IAutoMovieVector3,
  ): number[] {
    const out: number[] = new Array(q.length).fill(0);
    if (Vector3.length(r) === 0) return out;
    const point = (c: readonly number[]): IAutoMovieVector3 => {
      const p: G.IPlaced = G.placed(setup, frame, c, false);
      return Vector3.add(p.wrist, Quaternion.rotateVector(p.hand, contact));
    };
    const free: number[] = [];
    const columns: IAutoMovieVector3[] = [];
    for (let d: number = 0; d < setup.free.length; ++d) {
      if (!setup.free[d]!) continue;
      const up: number[] = [...q];
      const down: number[] = [...q];
      up[d] = up[d]! + H;
      down[d] = down[d]! - H;
      free.push(d);
      columns.push(Vector3.scale(Vector3.subtract(point(up), point(down)), 1 / (2 * H)));
    }
    const axis = (v: IAutoMovieVector3, i: number): number => (i === 0 ? v.x : i === 1 ? v.y : v.z);
    const m: number[][] = [0, 1, 2].map((i: number): number[] =>
      [0, 1, 2].map((k: number): number => columns.reduce((s: number, c: IAutoMovieVector3): number => s + axis(c, i) * axis(c, k), 0)),
    );
    const damping: number = (1e-6 * (m[0]![0]! + m[1]![1]! + m[2]![2]!)) / 3;
    for (let i: number = 0; i < 3; ++i) m[i]![i]! += damping;
    const y: number[] = solve3(m, [r.x, r.y, r.z]);
    free.forEach((d: number, f: number): void => {
      const c: IAutoMovieVector3 = columns[f]!;
      out[d] = c.x * y[0]! + c.y * y[1]! + c.z * y[2]!;
    });
    return out;
  }
}

/** A three-by-three symmetric definite system solved by Cramer's rule. */
function solve3(m: readonly (readonly number[])[], b: readonly number[]): number[] {
  const det = (a: readonly (readonly number[])[]): number =>
    a[0]![0]! * (a[1]![1]! * a[2]![2]! - a[1]![2]! * a[2]![1]!) -
    a[0]![1]! * (a[1]![0]! * a[2]![2]! - a[1]![2]! * a[2]![0]!) +
    a[0]![2]! * (a[1]![0]! * a[2]![1]! - a[1]![1]! * a[2]![0]!);
  const whole: number = det(m);
  return [0, 1, 2].map((k: number): number => det(m.map((row: readonly number[], i: number): number[] => row.map((v: number, c: number): number => (c === k ? b[i]! : v)))) / whole);
}

/** The coordinate step of the Jacobian's central differences, coordinate units. */
const H: number = 0.05;
