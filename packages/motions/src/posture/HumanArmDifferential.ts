import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";

/**
 * Differential inverse kinematics of an arm: the coordinates' step that moves a
 * point the hand carries by a small displacement, by damped least squares
 * (Wampler 1986, "Manipulator inverse kinematic solutions based on vector
 * formulations and damped least-squares methods", IEEE SMC 16:93), what both
 * the hold's seed and the follower map a site's motion onto the arm with.
 */
export namespace HumanArmDifferential {
  /**
   * One damped least-squares step: `Jᵀ(JJᵀ + λ²I)⁻¹ r`, the contact's Jacobian
   * in the arm's free coordinates by central differences, `λ²` a millionth of
   * the Jacobian's own scale so a singular arm takes a bounded step. A zero
   * displacement gives a zero step.
   *
   * @param setup The arm.
   * @param frame What the arm is read against.
   * @param q The coordinates.
   * @param contact The point the hand carries, in its frame from the wrist.
   * @param r The displacement, metres.
   * @param fixed Coordinates already at an active bound in this correction.
   * @returns The coordinates' step.
   */
  export function step(
    setup: IAutoMovieMotionHumanArmGeometry.ISetup,
    frame: IAutoMovieMotionHumanArmGeometry.IFrame,
    q: readonly number[],
    contact: IAutoMovieVector3,
    r: IAutoMovieVector3,
    fixed?: ReadonlySet<number>,
  ): number[] {
    const out: number[] = new Array(q.length).fill(0);
    if (Vector3.length(r) === 0) return out;
    const point: (c: readonly number[]) => IAutoMovieVector3 = (
      c: readonly number[],
    ): IAutoMovieVector3 => {
      const p: ReturnType<typeof G.chain> = G.chain(setup, frame, c);
      return Vector3.add(p.wrist, Quaternion.rotateVector(p.hand, contact));
    };
    const free: number[] = [];
    const columns: Float64Array = new Float64Array(3 * setup.free.length);
    const rate: number = 1 / (2 * H);
    const up: number[] = [...q];
    const down: number[] = [...q];
    for (let d: number = 0; d < setup.free.length; ++d) {
      if (!setup.free[d]! || fixed?.has(d)) continue;
      up[d] = q[d]! + H;
      down[d] = q[d]! - H;
      const index: number = 3 * free.length;
      free.push(d);
      const above: IAutoMovieVector3 = point(up);
      const below: IAutoMovieVector3 = point(down);
      columns[index] = (above.x - below.x) * rate;
      columns[index + 1] = (above.y - below.y) * rate;
      columns[index + 2] = (above.z - below.z) * rate;
      up[d] = q[d]!;
      down[d] = q[d]!;
    }
    let m00: number = 0;
    let m01: number = 0;
    let m02: number = 0;
    let m11: number = 0;
    let m12: number = 0;
    let m22: number = 0;
    for (let f: number = 0; f < free.length; f++) {
      const index: number = 3 * f;
      const cx: number = columns[index]!;
      const cy: number = columns[index + 1]!;
      const cz: number = columns[index + 2]!;
      m00 += cx * cx;
      m01 += cx * cy;
      m02 += cx * cz;
      m11 += cy * cy;
      m12 += cy * cz;
      m22 += cz * cz;
    }
    const damping: number = (1e-6 * (m00 + m11 + m22)) / 3;
    m00 += damping;
    m11 += damping;
    m22 += damping;
    const y: number[] = solve3(m00, m01, m02, m11, m12, m22, r.x, r.y, r.z);
    free.forEach((d: number, f: number): void => {
      const index: number = 3 * f;
      out[d] =
        columns[index]! * y[0]! +
        columns[index + 1]! * y[1]! +
        columns[index + 2]! * y[2]!;
    });
    return out;
  }
}

/**
 * The six symmetric entries and right-hand side of the same three-by-three
 * Cramer expansion, without temporary matrix rows.
 */
function solve3(
  m00: number,
  m01: number,
  m02: number,
  m11: number,
  m12: number,
  m22: number,
  bx: number,
  by: number,
  bz: number,
): number[] {
  const whole: number = determinant(
    m00,
    m01,
    m02,
    m01,
    m11,
    m12,
    m02,
    m12,
    m22,
  );
  // Damping makes the system positive definite when the Jacobian has any
  // nonzero column. A zero determinant has no displacement direction.
  if (whole === 0) return [0, 0, 0];
  return [
    determinant(bx, m01, m02, by, m11, m12, bz, m12, m22) / whole,
    determinant(m00, bx, m02, m01, by, m12, m02, bz, m22) / whole,
    determinant(m00, m01, bx, m01, m11, by, m02, m12, bz) / whole,
  ];
}

/**
 * The original left-to-right determinant expansion, with scalar entries instead
 * of temporary matrix copies.
 */
function determinant(
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
  g: number,
  h: number,
  i: number,
): number {
  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
}

/** The coordinate step of the Jacobian's central differences, coordinate units. */
const H: number = 0.05;
