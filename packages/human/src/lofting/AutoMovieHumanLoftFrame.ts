/**
 * Section planes of a chain: where each harmonic section lies in the world.
 *
 * A section's harmonic coefficients are planar coordinates `(x, z)` in mm.
 * A frame places them in the world:
 *
 * ```text
 * P = origin + x * u + z * v
 * ```
 *
 * with orthonormal in-plane axes `u` and `v`. A chain's stations increase
 * along its length; the side of the plane they advance toward is a property
 * of the chain's layer sequence, not of the frame.
 *
 * ## The horizontal default
 *
 * A layer without a frame lies in the horizontal plane at world height equal
 * to its station: origin `(0, s, 0)`, `u = +X`, `v = +Z`. Every recovered
 * trunk, limb and digit chain uses this default, which reproduces the world
 * height slicing of the saved loft.
 *
 * ## Oriented layers
 *
 * A chain whose sections must turn, such as a foot leaving a horizontal
 * ankle section for sections across its length, or an ear leaving the head
 * surface, gives each principal layer its own frame. Between two layers:
 *
 * - the origin follows a cubic Hermite curve whose end tangents are the
 *   Catmull-Rom differences of the neighbouring layer origins, so the
 *   origin path is C1 across layers;
 * - the orientation follows a cubic Hermite curve on the rotation group,
 *   whose end angular velocities are given per layer (the chain uses the
 *   same three-point differences of its neighbouring layer rotations on
 *   both sides of a layer), so the in-plane axes stay orthonormal and turn
 *   with an angular velocity that is continuous across layers.
 *
 * The angular velocity matters wherever the section plane turns. A point
 * at distance x from the turning axis moves out of the plane at x times the
 * angular velocity; with the spherical linear interpolation (slerp) used
 * before, that speed jumped at every layer, and on skin lying across the
 * plane (the underside of the chin, the nape, the upper lip) each jump was a
 * crease of up to four degrees along the layer. Without angular velocities
 * the interpolation is slerp.
 */
export namespace AutoMovieHumanLoftFrame {
  /** A section plane in world millimetres. */
  export interface IFrame {
    /** World position of the section's planar origin, mm. */
    origin: [number, number, number];

    /** Unit in-plane axis carrying the harmonic x coordinate. */
    u: [number, number, number];

    /** Unit in-plane axis carrying the harmonic z coordinate, orthogonal to `u`. */
    v: [number, number, number];
  }

  /** Horizontal frame at a world height: the default of an unframed layer. */
  export function horizontal(y: number): IFrame {
    return { origin: [0, y, 0], u: [1, 0, 0], v: [0, 0, 1] };
  }

  /** World point of planar coordinates in a frame. */
  export function place(
    frame: IFrame,
    x: number,
    z: number,
  ): [number, number, number] {
    return [
      frame.origin[0] + x * frame.u[0] + z * frame.v[0],
      frame.origin[1] + x * frame.u[1] + z * frame.v[1],
      frame.origin[2] + x * frame.u[2] + z * frame.v[2],
    ];
  }

  /**
   * Planar coordinates of a world point projected onto a frame.
   *
   * Used when a child chain assigns phases to vertices it inherits from a
   * parent ring: the inherited ring lies in (or near) the child's end plane,
   * and the projection discards only the off-plane component.
   */
  export function local(
    frame: IFrame,
    p: readonly [number, number, number],
  ): [number, number] {
    const d: [number, number, number] = [
      p[0] - frame.origin[0],
      p[1] - frame.origin[1],
      p[2] - frame.origin[2],
    ];
    return [dot(d, frame.u), dot(d, frame.v)];
  }

  /**
   * Frame between two layers at unit parameter `t` in `[0, 1]`.
   *
   * @param a Frame of the lower layer.
   * @param b Frame of the upper layer.
   * @param ta Origin tangent at `a` per unit parameter, mm.
   * @param tb Origin tangent at `b` per unit parameter, mm.
   * @param t Unit parameter of the interval.
   * @param wa World angular velocity at `a` per unit parameter, rad;
   *   absent with `wb` for the constant velocity of slerp.
   * @param wb World angular velocity at `b` per unit parameter, rad.
   */
  export function interpolate(
    a: IFrame,
    b: IFrame,
    ta: readonly [number, number, number],
    tb: readonly [number, number, number],
    t: number,
    wa?: readonly [number, number, number],
    wb?: readonly [number, number, number],
  ): IFrame {
    // Cubic Hermite origin.
    const h00: number = 2 * t ** 3 - 3 * t ** 2 + 1;
    const h10: number = t ** 3 - 2 * t ** 2 + t;
    const h01: number = -2 * t ** 3 + 3 * t ** 2;
    const h11: number = t ** 3 - t ** 2;
    const origin: [number, number, number] = [0, 1, 2].map(
      (k: number): number =>
        h00 * a.origin[k]! + h10 * ta[k]! + h01 * b.origin[k]! + h11 * tb[k]!,
    ) as [number, number, number];

    // Identical orientations without turning need no rotation; this keeps
    // horizontal chains bit-for-bit on their axes.
    const still = (w: readonly [number, number, number] | undefined): boolean =>
      w !== undefined &&
      Math.abs(w[0]) + Math.abs(w[1]) + Math.abs(w[2]) < 1e-12;
    if (
      same(a.u, b.u) &&
      same(a.v, b.v) &&
      ((wa === undefined && wb === undefined) || (still(wa) && still(wb)))
    )
      return { origin, u: a.u, v: a.v };

    // R(t) = Ra exp([h(t)]x), h a cubic Hermite curve in the rotation
    // vectors of a's body frame: h(0) = 0, h(1) = phi = log(Ra^T Rb), and
    // dR/dt = R [Jr(h) h']x with Jr the right Jacobian of exp, so the end
    // derivatives that give body angular velocities Ra^T wa at a and
    // Rb^T wb at b are h'(0) = Ra^T wa and h'(1) = Jr(phi)^-1 Rb^T wb. With
    // both velocities phi (slerp's), h(t) = t phi, which is slerp.
    const Ra: number[][] = matrix(a);
    const Rb: number[][] = matrix(b);
    const phi: [number, number, number] = logarithm(
      multiply(transpose(Ra), Rb),
    );
    const da: [number, number, number] =
      wa === undefined ? phi : apply(transpose(Ra), wa);
    const db: [number, number, number] =
      wb === undefined ? phi : inverseJacobian(phi, apply(transpose(Rb), wb));
    const h: [number, number, number] = [0, 1, 2].map(
      (k: number): number => h10 * da[k]! + h01 * phi[k]! + h11 * db[k]!,
    ) as [number, number, number];
    const R: number[][] = multiply(Ra, exponential(h));
    return {
      origin,
      u: [R[0]![0]!, R[1]![0]!, R[2]![0]!],
      v: [R[0]![2]!, R[1]![2]!, R[2]![2]!],
    };
  }

  /**
   * Exact first derivative of the same interpolated frame, per unit t.
   * Returned origin/u/v are derivatives, not a proper placement frame.
   */
  export function derivative(
    a: IFrame,
    b: IFrame,
    ta: readonly [number, number, number],
    tb: readonly [number, number, number],
    t: number,
    wa?: readonly [number, number, number],
    wb?: readonly [number, number, number],
  ): IFrame {
    const h00: number = 6 * t * (t - 1);
    const h10: number = 3 * t ** 2 - 4 * t + 1;
    const h01: number = -h00;
    const h11: number = 3 * t ** 2 - 2 * t;
    const origin: [number, number, number] = [0, 1, 2].map(
      (k: number): number =>
        h00 * a.origin[k]! + h10 * ta[k]! + h01 * b.origin[k]! + h11 * tb[k]!,
    ) as [number, number, number];
    const still: (
      w: readonly [number, number, number] | undefined,
    ) => boolean = (w: readonly [number, number, number] | undefined): boolean =>
      w !== undefined && Math.abs(w[0]) + Math.abs(w[1]) + Math.abs(w[2]) < 1e-12;
    if (
      same(a.u, b.u) && same(a.v, b.v) &&
      ((wa === undefined && wb === undefined) || (still(wa) && still(wb)))
    )
      return { origin, u: [0, 0, 0], v: [0, 0, 0] };

    const Ra: number[][] = matrix(a);
    const Rb: number[][] = matrix(b);
    const phi: [number, number, number] = logarithm(
      multiply(transpose(Ra), Rb),
    );
    const da: [number, number, number] =
      wa === undefined ? phi : apply(transpose(Ra), wa);
    const db: [number, number, number] =
      wb === undefined ? phi : inverseJacobian(phi, apply(transpose(Rb), wb));
    const h: [number, number, number] = [0, 1, 2].map(
      (k: number): number =>
        (t ** 3 - 2 * t ** 2 + t) * da[k]! +
        (-2 * t ** 3 + 3 * t ** 2) * phi[k]! +
        (t ** 3 - t ** 2) * db[k]!,
    ) as [number, number, number];
    const dh: [number, number, number] = [0, 1, 2].map(
      (k: number): number => h10 * da[k]! + h01 * phi[k]! + h11 * db[k]!,
    ) as [number, number, number];
    const angle: number = Math.hypot(...h);
    const A: number = angle < 1e-4
      ? 1 / 2 - angle ** 2 / 24 + angle ** 4 / 720
      : (1 - Math.cos(angle)) / angle ** 2;
    const B: number = angle < 1e-4
      ? 1 / 6 - angle ** 2 / 120 + angle ** 4 / 5040
      : (angle - Math.sin(angle)) / angle ** 3;
    const hd: [number, number, number] = cross(h, dh);
    const hhd: [number, number, number] = cross(h, hd);
    const local: [number, number, number] = [0, 1, 2].map(
      (k: number): number => dh[k]! - A * hd[k]! + B * hhd[k]!,
    ) as [number, number, number];
    const value: IFrame = interpolate(a, b, ta, tb, t, wa, wb);
    const angular: [number, number, number] = apply(matrix(value), local);
    return { origin, u: cross(angular, value.u), v: cross(angular, value.v) };
  }

  /**
   * World angular velocity, rad per station unit, of the constant turn from
   * frame `a` to frame `b` over a station span.
   *
   * The rotation vector of `Ra^T Rb` in world axes, divided by the span: a
   * turn about a fixed axis leaves that axis in place, so the world vector
   * is the same anywhere along the turn.
   */
  export function rate(
    a: IFrame,
    b: IFrame,
    span: number,
  ): [number, number, number] {
    const Ra: number[][] = matrix(a);
    const phi: [number, number, number] = logarithm(
      multiply(transpose(Ra), matrix(b)),
    );
    const w: [number, number, number] = apply(Ra, phi);
    return [w[0] / span, w[1] / span, w[2] / span];
  }

  /** Rotation matrix of a frame: columns u, w = v x u, v (images of +X, +Y, +Z). */
  function matrix(frame: IFrame): number[][] {
    const u: [number, number, number] = frame.u;
    const v: [number, number, number] = frame.v;
    const w: [number, number, number] = [
      v[1] * u[2] - v[2] * u[1],
      v[2] * u[0] - v[0] * u[2],
      v[0] * u[1] - v[1] * u[0],
    ];
    return [
      [u[0], w[0], v[0]],
      [u[1], w[1], v[1]],
      [u[2], w[2], v[2]],
    ];
  }

  /** Transpose of a 3x3 matrix. */
  function transpose(m: number[][]): number[][] {
    return [0, 1, 2].map((i: number): number[] =>
      [0, 1, 2].map((j: number): number => m[j]![i]!),
    );
  }

  /** Product of two 3x3 matrices. */
  function multiply(a: number[][], b: number[][]): number[][] {
    return [0, 1, 2].map((i: number): number[] =>
      [0, 1, 2].map(
        (j: number): number =>
          a[i]![0]! * b[0]![j]! + a[i]![1]! * b[1]![j]! + a[i]![2]! * b[2]![j]!,
      ),
    );
  }

  /** A 3x3 matrix applied to a vector. */
  function apply(
    m: number[][],
    x: readonly [number, number, number],
  ): [number, number, number] {
    return [0, 1, 2].map(
      (i: number): number =>
        m[i]![0]! * x[0] + m[i]![1]! * x[1] + m[i]![2]! * x[2],
    ) as [number, number, number];
  }

  /** Cross product. */
  function cross(
    a: readonly [number, number, number],
    b: readonly [number, number, number],
  ): [number, number, number] {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  /** Rotation vector (axis times angle, angle in [0, pi]) of a rotation matrix. */
  function logarithm(m: number[][]): [number, number, number] {
    // Through the unit quaternion, which stays accurate for small angles.
    const q: number[] = quaternionOf(m);
    const sign: number = q[0]! < 0 ? -1 : 1;
    const x: number = sign * q[1]!;
    const y: number = sign * q[2]!;
    const z: number = sign * q[3]!;
    const s: number = Math.hypot(x, y, z);
    if (s < 1e-15) return [2 * x, 2 * y, 2 * z];
    const angle: number = 2 * Math.atan2(s, sign * q[0]!);
    return [(x / s) * angle, (y / s) * angle, (z / s) * angle];
  }

  /** Rotation matrix of a rotation vector (Rodrigues' formula). */
  function exponential(p: readonly [number, number, number]): number[][] {
    const angle: number = Math.hypot(p[0], p[1], p[2]);
    // sin(a)/a and (1 - cos(a))/a^2, by series near zero.
    const A: number =
      angle < 1e-6 ? 1 - angle ** 2 / 6 : Math.sin(angle) / angle;
    const B: number =
      angle < 1e-6 ? 0.5 - angle ** 2 / 24 : (1 - Math.cos(angle)) / angle ** 2;
    const [x, y, z] = p;
    const K: number[][] = [
      [0, -z, y],
      [z, 0, -x],
      [-y, x, 0],
    ];
    const K2: number[][] = multiply(K, K);
    return [0, 1, 2].map((i: number): number[] =>
      [0, 1, 2].map(
        (j: number): number =>
          (i === j ? 1 : 0) + A * K[i]![j]! + B * K2[i]![j]!,
      ),
    );
  }

  /**
   * Inverse right Jacobian of the rotation exponential at `p`, applied to x:
   * `x + (p x x) / 2 + c p x (p x x)`, `c = 1/a^2 - (1 + cos a) / (2 a sin a)`.
   */
  function inverseJacobian(
    p: readonly [number, number, number],
    x: readonly [number, number, number],
  ): [number, number, number] {
    const angle: number = Math.hypot(p[0], p[1], p[2]);
    const c: number =
      angle < 1e-4
        ? 1 / 12 + angle ** 2 / 720
        : 1 / angle ** 2 -
          (1 + Math.cos(angle)) / (2 * angle * Math.sin(angle));
    const px: [number, number, number] = cross(p, x);
    const ppx: [number, number, number] = cross(p, px);
    return [0, 1, 2].map(
      (k: number): number => x[k]! + px[k]! / 2 + c * ppx[k]!,
    ) as [number, number, number];
  }

  /** Dot product. */
  function dot(
    a: readonly [number, number, number],
    b: readonly [number, number, number],
  ): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** Whether two unit vectors are equal to rounding. */
  function same(
    a: readonly [number, number, number],
    b: readonly [number, number, number],
  ): boolean {
    return (
      Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) <
      1e-12
    );
  }

  /**
   * Unit quaternion `[w, x, y, z]` of a rotation matrix, by Shepperd's
   * method: the largest diagonal combination keeps it stable.
   */
  function quaternionOf(m: number[][]): number[] {
    const m00: number = m[0]![0]!,
      m01: number = m[0]![1]!,
      m02: number = m[0]![2]!;
    const m10: number = m[1]![0]!,
      m11: number = m[1]![1]!,
      m12: number = m[1]![2]!;
    const m20: number = m[2]![0]!,
      m21: number = m[2]![1]!,
      m22: number = m[2]![2]!;
    const trace: number = m00 + m11 + m22;
    if (trace > 0) {
      const s: number = 2 * Math.sqrt(trace + 1);
      return [0.25 * s, (m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s];
    }
    if (m00 > m11 && m00 > m22) {
      const s: number = 2 * Math.sqrt(1 + m00 - m11 - m22);
      return [(m21 - m12) / s, 0.25 * s, (m01 + m10) / s, (m02 + m20) / s];
    }
    if (m11 > m22) {
      const s: number = 2 * Math.sqrt(1 + m11 - m00 - m22);
      return [(m02 - m20) / s, (m01 + m10) / s, 0.25 * s, (m12 + m21) / s];
    }
    const s: number = 2 * Math.sqrt(1 + m22 - m00 - m11);
    return [(m10 - m01) / s, (m02 + m20) / s, (m12 + m21) / s, 0.25 * s];
  }
}
