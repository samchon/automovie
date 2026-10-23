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
 * - the orientation follows the spherical linear interpolation (slerp) of
 *   the two layers' rotations, so in-plane axes stay orthonormal.
 *
 * Slerp is C0 in angular velocity at a layer; a chain that turns sharply
 * therefore needs principal layers close enough that the turn per interval
 * stays small. This is the observation fitter's responsibility.
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
   */
  export function interpolate(
    a: IFrame,
    b: IFrame,
    ta: readonly [number, number, number],
    tb: readonly [number, number, number],
    t: number,
  ): IFrame {
    // Cubic Hermite origin.
    const h00: number = 2 * t ** 3 - 3 * t ** 2 + 1;
    const h10: number = t ** 3 - 2 * t ** 2 + t;
    const h01: number = -2 * t ** 3 + 3 * t ** 2;
    const h11: number = t ** 3 - t ** 2;
    const origin: [number, number, number] = [0, 1, 2].map(
      (k: number): number =>
        h00 * a.origin[k]! +
        h10 * ta[k]! +
        h01 * b.origin[k]! +
        h11 * tb[k]!,
    ) as [number, number, number];

    // Identical orientations need no rotation; this keeps horizontal chains
    // bit-for-bit on their axes.
    if (same(a.u, b.u) && same(a.v, b.v)) return { origin, u: a.u, v: a.v };

    // Slerp of the two rotations, each built from (u, v, u x v).
    const qa: number[] = quaternion(a);
    let qb: number[] = quaternion(b);
    let cosine: number = qa.reduce((s: number, q: number, i: number): number => s + q * qb[i]!, 0);
    if (cosine < 0) {
      qb = qb.map((q: number): number => -q);
      cosine = -cosine;
    }
    let q: number[];
    if (cosine > 0.9995) {
      // Nearly equal rotations: normalized linear interpolation avoids
      // dividing by a vanishing sine.
      q = qa.map((x: number, i: number): number => x + t * (qb[i]! - x));
    } else {
      const angle: number = Math.acos(cosine);
      const sa: number = Math.sin((1 - t) * angle) / Math.sin(angle);
      const sb: number = Math.sin(t * angle) / Math.sin(angle);
      q = qa.map((x: number, i: number): number => sa * x + sb * qb[i]!);
    }
    const length: number = Math.hypot(...q);
    q = q.map((x: number): number => x / length);

    return { origin, u: rotate(q, [1, 0, 0]), v: rotate(q, [0, 0, 1]) };
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
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 1e-12;
  }

  /**
   * Unit quaternion `[w, x, y, z]` of the rotation taking the reference axes
   * (+X, +Y, +Z) to (u, v x u, v), i.e. columns u, w = v x u, v.
   *
   * The reference frame maps +X to u and +Z to v, matching the horizontal
   * default, whose rotation is the identity.
   */
  function quaternion(frame: IFrame): number[] {
    const u: [number, number, number] = frame.u;
    const v: [number, number, number] = frame.v;
    const w: [number, number, number] = [
      v[1] * u[2] - v[2] * u[1],
      v[2] * u[0] - v[0] * u[2],
      v[0] * u[1] - v[1] * u[0],
    ];

    // Rotation matrix with columns u, w, v (images of +X, +Y, +Z).
    const m00: number = u[0], m01: number = w[0], m02: number = v[0];
    const m10: number = u[1], m11: number = w[1], m12: number = v[1];
    const m20: number = u[2], m21: number = w[2], m22: number = v[2];

    // Shepperd's method: pick the largest diagonal combination for stability.
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

  /** Rotate a vector by a unit quaternion `[w, x, y, z]`. */
  function rotate(
    q: readonly number[],
    p: readonly [number, number, number],
  ): [number, number, number] {
    const [w, x, y, z] = q as [number, number, number, number];

    // v' = v + 2 w (r x v) + 2 r x (r x v), r = (x, y, z)
    const cx: number = y * p[2] - z * p[1];
    const cy: number = z * p[0] - x * p[2];
    const cz: number = x * p[1] - y * p[0];
    return [
      p[0] + 2 * (w * cx + y * cz - z * cy),
      p[1] + 2 * (w * cy + z * cx - x * cz),
      p[2] + 2 * (w * cz + x * cy - y * cx),
    ];
  }
}
