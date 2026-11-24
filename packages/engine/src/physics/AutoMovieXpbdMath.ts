import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";

/**
 * The rigid-body corrections of extended position-based dynamics (Mueller,
 * Macklin, Chentanez, Jeschke and Kim 2020, "Detailed Rigid Body Simulation
 * with Extended Position Based Dynamics", SCA, section 3.3; compliance from
 * Macklin, Mueller and Chentanez 2016, "XPBD: Position-Based Simulation of
 * Compliant Constrained Dynamics", MIG).
 *
 * Each correction moves the bodies' centres and rotations; a kinematic body has
 * zero inverse mass and inertia and is never moved. `second` may be null for
 * the fixed world.
 */
export namespace AutoMovieXpbdMath {
  /**
   * A body's generalized inverse mass (Mueller et al. 2020, eq. 2 and 3): for a
   * positional correction along unit `n` at arm `r` from its centre, `w = 1/m +
   * (r x n)^T I^-1 (r x n)`; for an angular one, `w = n^T I^-1 n`.
   *
   * @param body The body, or null for the fixed world.
   * @param n Unit world direction.
   * @param arm World arm from the centre; absent for an angular correction.
   * @returns The generalized inverse mass; zero for the world or a kinematic
   *   body.
   */
  export function weight(
    body: AutoMovieXpbdBody | null,
    n: IAutoMovieVector3,
    arm?: IAutoMovieVector3,
  ): number {
    if (body === null || !body.dynamic) return 0;
    if (arm === undefined) return Vector3.dot(n, body.frozenInverseInertia(n));
    const rn: IAutoMovieVector3 = Vector3.cross(arm, n);
    return body.inverseMass() + Vector3.dot(rn, body.frozenInverseInertia(rn));
  }

  /**
   * A positional correction (Mueller et al. 2020, section 3.3.1): close the gap
   * `c` between the point at `armA` of `first` and the point at `armB` of
   * `second` along unit `n`, which points from the first point toward the
   * second, with compliance `alpha` over substep `h`: `dlambda = (c -
   * alphaTilde lambda) / (wA + wB + alphaTilde)`, `alphaTilde = alpha / h^2`,
   * and the impulse `p = dlambda n` moves the first body by `+p` and the second
   * by `-p`.
   *
   * @param first The first body.
   * @param second The second body, or null for the world.
   * @param n Unit world direction from the first point toward the second.
   * @param c The gap to close, metres.
   * @param armA World arm of the first point from its body's centre.
   * @param armB World arm of the second point from its body's centre.
   * @param alpha Compliance, metres per newton.
   * @param h The substep, seconds.
   * @param lambda The multiplier accumulated this step.
   * @returns The multiplier's change, newton seconds squared.
   */
  export function positional(
    first: AutoMovieXpbdBody,
    second: AutoMovieXpbdBody | null,
    n: IAutoMovieVector3,
    c: number,
    armA: IAutoMovieVector3,
    armB: IAutoMovieVector3,
    alpha: number,
    h: number,
    lambda: number,
  ): number {
    const tilde: number = alpha / (h * h);
    const total: number =
      weight(first, n, armA) + weight(second, n, armB) + tilde;
    if (!(total > 0)) return 0;
    const delta: number = (c - tilde * lambda) / total;
    apply(first, second, Vector3.scale(n, delta), armA, armB);
    return delta;
  }

  /**
   * Apply a positional impulse `p` at two arms: the first body moves by `+p`
   * through `1/m` and `I^-1 (r x p)`, the second by `-p`.
   *
   * @param first The first body.
   * @param second The second body, or null for the world.
   * @param p World impulse, newton seconds squared per second.
   * @param armA World arm on the first body.
   * @param armB World arm on the second body.
   */
  export function apply(
    first: AutoMovieXpbdBody,
    second: AutoMovieXpbdBody | null,
    p: IAutoMovieVector3,
    armA: IAutoMovieVector3,
    armB: IAutoMovieVector3,
  ): void {
    move(first, p, armA, 1);
    if (second !== null) move(second, p, armB, -1);
  }

  /**
   * A velocity impulse at two arms (Mueller et al. 2020, section 3.6): the
   * first body gains `+p`, the second `-p`.
   *
   * @param first The first body.
   * @param second The second body, or null for the world.
   * @param p World impulse, newton seconds.
   * @param armA World arm on the first body.
   * @param armB World arm on the second body.
   */
  export function impulse(
    first: AutoMovieXpbdBody,
    second: AutoMovieXpbdBody | null,
    p: IAutoMovieVector3,
    armA: IAutoMovieVector3,
    armB: IAutoMovieVector3,
  ): void {
    push(first, p, armA, 1);
    if (second !== null) push(second, p, armB, -1);
  }

  /**
   * An angular velocity impulse: the first body gains `I^-1 p`, the second
   * loses `I^-1 p`.
   *
   * @param first The first body.
   * @param second The second body, or null for the world.
   * @param p World angular impulse, newton metre seconds.
   */
  export function spin(
    first: AutoMovieXpbdBody,
    second: AutoMovieXpbdBody | null,
    p: IAutoMovieVector3,
  ): void {
    for (const [body, sign] of [
      [first, 1],
      [second, -1],
    ] as const)
      if (body !== null && body.dynamic)
        body.angularVelocity = Vector3.add(
          body.angularVelocity,
          Vector3.scale(body.frozenInverseInertia(p), sign),
        );
  }

  /**
   * A point attachment solved as one block (the ball joint of Mueller et al.
   * 2020, sec. 3.3.1, with its three rows solved together): the impulse `p =
   * K^-1 d` closes the gap `d` from the first point to the second, with `K =
   * sum (1/m) E - [r]x I^-1 [r]x` over both bodies, so one correction closes
   * the whole linearized gap whatever the inertia's anisotropy; the first body
   * moves by `+p`, the second by `-p`.
   *
   * @param first The first body.
   * @param second The second body, or null for the world.
   * @param d World gap from the first point to the second, metres.
   * @param armA World arm of the first point from its body's centre.
   * @param armB World arm of the second point from its body's centre.
   */
  export function point(
    first: AutoMovieXpbdBody,
    second: AutoMovieXpbdBody | null,
    d: IAutoMovieVector3,
    armA: IAutoMovieVector3,
    armB: IAutoMovieVector3,
  ): void {
    const k: number[] = add(
      pointMatrix(first, armA),
      pointMatrix(second, armB),
    );
    const p: IAutoMovieVector3 | null = solve(k, d);
    if (p !== null) apply(first, second, p, armA, armB);
  }

  /**
   * A rotation removed as one block: the angular impulse `p = K^-1 theta` with
   * `K = I_A^-1 + I_B^-1` removes the whole rotation vector `theta`, turning
   * the first body by `I_A^-1 p` and the second by `-I_B^-1 p`.
   *
   * @param first The first body.
   * @param second The second body, or null for the world.
   * @param theta World rotation vector to remove, radians.
   */
  export function rotation(
    first: AutoMovieXpbdBody,
    second: AutoMovieXpbdBody | null,
    theta: IAutoMovieVector3,
  ): void {
    const k: number[] = add(angularMatrix(first), angularMatrix(second));
    const p: IAutoMovieVector3 | null = solve(k, theta);
    if (p === null) return;
    turn(first, first.frozenInverseInertia(p), 1);
    if (second !== null) turn(second, second.frozenInverseInertia(p), -1);
  }

  /**
   * A body's world inverse inertia as a row-major 3x3 matrix; zero for the
   * world or a kinematic body.
   */
  function angularMatrix(body: AutoMovieXpbdBody | null): number[] {
    if (body === null || !body.dynamic) return [0, 0, 0, 0, 0, 0, 0, 0, 0];
    return [...body.frozen];
  }

  /** A body's point inverse mass matrix at an arm, `(1/m) E - [r]x I^-1 [r]x`. */
  function pointMatrix(
    body: AutoMovieXpbdBody | null,
    arm: IAutoMovieVector3,
  ): number[] {
    if (body === null || !body.dynamic) return [0, 0, 0, 0, 0, 0, 0, 0, 0];
    const result: number[] = [];
    for (const e of [
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 0, z: 1 },
    ]) {
      const column: IAutoMovieVector3 = Vector3.add(
        Vector3.scale(e, body.inverseMass()),
        Vector3.cross(body.frozenInverseInertia(Vector3.cross(arm, e)), arm),
      );
      result.push(column.x, column.y, column.z);
    }
    // Columns were pushed; transpose to row-major.
    return [
      result[0]!,
      result[3]!,
      result[6]!,
      result[1]!,
      result[4]!,
      result[7]!,
      result[2]!,
      result[5]!,
      result[8]!,
    ];
  }

  /** Elementwise sum of two 3x3 matrices. */
  function add(a: number[], b: number[]): number[] {
    return a.map((value: number, index: number): number => value + b[index]!);
  }

  /**
   * Solve `K p = b` for a symmetric positive definite 3x3 `K` by Cramer's rule;
   * null when singular.
   */
  function solve(k: number[], b: IAutoMovieVector3): IAutoMovieVector3 | null {
    const a: number = k[0]!;
    const bb: number = k[1]!;
    const c: number = k[2]!;
    const d: number = k[3]!;
    const e: number = k[4]!;
    const f: number = k[5]!;
    const g: number = k[6]!;
    const h: number = k[7]!;
    const i: number = k[8]!;
    const det: number =
      a * (e * i - f * h) - bb * (d * i - f * g) + c * (d * h - e * g);
    if (det === 0) return null;
    return {
      x:
        (b.x * (e * i - f * h) -
          bb * (b.y * i - f * b.z) +
          c * (b.y * h - e * b.z)) /
        det,
      y:
        (a * (b.y * i - f * b.z) -
          b.x * (d * i - f * g) +
          c * (d * b.z - b.y * g)) /
        det,
      z:
        (a * (e * b.z - b.y * h) -
          bb * (d * b.z - b.y * g) +
          b.x * (d * h - e * g)) /
        det,
    };
  }

  /**
   * Move a dynamic body by a small displacement: its centre by `linear` and its
   * rotation by the rotation vector `angular`, `q <- normalize(q + 1/2 [w, 0]
   * q)`, the update every position correction applies.
   *
   * @param body The body; a kinematic one is left as it is.
   * @param linear World translation of its centre, metres.
   * @param angular World rotation vector, radians.
   */
  export function displace(
    body: AutoMovieXpbdBody,
    linear: IAutoMovieVector3,
    angular: IAutoMovieVector3,
  ): void {
    if (!body.dynamic) return;
    body.center = Vector3.add(body.center, linear);
    turn(body, angular, 1);
  }

  /** Move a body's centre and rotation by a positional impulse at an arm. */
  function move(
    body: AutoMovieXpbdBody,
    p: IAutoMovieVector3,
    arm: IAutoMovieVector3,
    sign: number,
  ): void {
    if (!body.dynamic) return;
    body.center = Vector3.add(
      body.center,
      Vector3.scale(p, sign * body.inverseMass()),
    );
    turn(body, body.frozenInverseInertia(Vector3.cross(arm, p)), sign);
  }

  /** Change a body's velocities by an impulse at an arm. */
  function push(
    body: AutoMovieXpbdBody,
    p: IAutoMovieVector3,
    arm: IAutoMovieVector3,
    sign: number,
  ): void {
    if (!body.dynamic) return;
    body.velocity = Vector3.add(
      body.velocity,
      Vector3.scale(p, sign * body.inverseMass()),
    );
    body.angularVelocity = Vector3.add(
      body.angularVelocity,
      Vector3.scale(body.frozenInverseInertia(Vector3.cross(arm, p)), sign),
    );
  }

  /** Turn a body by a small rotation vector: `q <- normalize(q + 1/2 [w, 0] q)`. */
  function turn(
    body: AutoMovieXpbdBody,
    omega: IAutoMovieVector3,
    sign: number,
  ): void {
    if (!body.dynamic) return;
    const w: IAutoMovieVector3 = Vector3.scale(omega, 0.5 * sign);
    const q: IAutoMovieQuaternion = body.orientation;
    const dq: IAutoMovieQuaternion = Quaternion.multiply(
      { x: w.x, y: w.y, z: w.z, w: 0 },
      q,
    );
    body.orientation = Quaternion.normalize({
      x: q.x + dq.x,
      y: q.y + dq.y,
      z: q.z + dq.z,
      w: q.w + dq.w,
    });
  }
}
