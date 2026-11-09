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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame's axes, the normal convention and both interpolation rules.
 * @evidence contracts/development/design.md#principled-representation Represents Section planes of a chain: where each harmonic section lies in the world: companion namespace of 17 members (`IFrame`, `horizontal`, `place`, `local`, `interpolate`, `rate`, ...); units and frames named in its text: frames, world, frame, local, radians. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieLoftFrame` in packages/engine/src/geometry/construction/AutoMovieLoftFrame.ts; its surface is the 17 members listed and the text shows 77 other files naming it, mostly packages/human (40), packages/engine (22), test (15), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieLoftFrame {
  /**
   * Section origin and two axes; geometric rotation frames require an orthonormal pair.
   * The same shape also stores component derivatives in layer jet fields.
   *
   * @evidence contracts/development/design.md#principled-representation Three triples encode origin, planar x axis and planar z axis in world coordinates; geometric orthonormality is a caller premise, not a structural type guarantee.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The explicit basis record serves placement and interpolation without a hidden matrix convention.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts This interface neither validates nor normalizes its axes; derivative-valued frame fields intentionally use the same shape without unit axes.
   * @evidence contracts/development/common.md#meaningful-documentation Gives origin units, geometric axis roles and the distinction between a rotation frame and its component derivatives.
   */
  export interface IFrame {
    /** World position of the section's planar origin, mm. */
    origin: [number, number, number];

    /** Unit in-plane axis carrying the harmonic x coordinate. */
    u: [number, number, number];

    /** Unit in-plane axis carrying the harmonic z coordinate, orthogonal to `u`. */
    v: [number, number, number];
  }

  /**
   * Horizontal frame at a world height in mm: the default of an unframed layer.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Origin (0,y,0) with +X/+Z planar axes makes station equal world height and v-cross-u point upward.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One literal record defines the shared unframed-layer convention.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The given height is preserved without offsets or input-specific frame choices.
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the world-height units and default-layer role.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constructs three fixed triples in constant work and space.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This pure frame constructor owns no coordinated or cached work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns all returned tuples; the function retains none.
   */
  export function horizontal(y: number): IFrame {
    return { origin: [0, y, 0], u: [1, 0, 0], v: [0, 0, 1] };
  }

  /**
   * World point of planar coordinates x/z in mm, preserving the supplied basis.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Applies origin+x*u+z*v, the affine map that defines the section chart.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The three coordinate formulas expose placement without matrix allocation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not renormalize axes or discard their supplied scale; geometric frame admission belongs to the producer.
   * @evidence contracts/development/common.md#meaningful-documentation Gives planar/world units and the basis-preserving transformation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed three-component affine arithmetic and one tuple take constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One point placement has no interval preparation or shared effects to coordinate.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh world tuple and keeps no reference to the frame.
   */
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
   *
   * @evidence contracts/development/implementation.md#principled-implementation Dot products of p-origin against orthonormal u/v give planar projection coordinates; with a nonorthonormal interpolated basis these are dot coordinates, not the affine inverse of place.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One displacement and two dot products keep projection at the frame owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Discards the off-plane component by the declared projection rather than moving a ring or solving a hidden corrected frame.
   * @evidence contracts/development/common.md#meaningful-documentation Names the inherited-ring use and explicitly states the orthonormal-basis premise and its limitation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic allocates one displacement triple and one returned pair.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both coordinates share the same p-origin displacement.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the new pair escapes; frame and point remain unmodified and unretained.
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
   *
   * @evidence contracts/development/implementation.md#principled-implementation Cubic Hermite interpolates origin; a relative rotation logarithm, exponential and inverse right Jacobian interpolate orientation with endpoint angular velocities on admitted orthonormal frames.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Translation and rotation share the interval parameter while separate local helpers own fixed-size rotation algebra.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing angular velocities use the constant relative turn; near-identical axes and absent or sub-1e-12 total angular velocities take the explicit still branch, which reuses a's axes.
   * @evidence contracts/development/common.md#meaningful-documentation Gives parameter range, tangent/angular units, omitted-velocity meaning and the still-branch ownership/tolerance here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed-size 3x3 rotation operations and one Hermite origin use constant work/storage, with the still branch avoiding rotation construction.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares origin basis values and relative rotation within this reading; repeated interval queries reconstruct that local preparation rather than using a cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Rotation matrices and vectors are local; the output owns its origin and normally new axes, but borrows a's axes in the still branch.
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
   * World angular velocity, rad per station unit, of the constant turn from
   * frame `a` to frame `b` over a station span.
   *
   * The rotation vector of `Ra^T Rb` in world axes, divided by the span: a
   * turn about a fixed axis leaves that axis in place, so the world vector
   * is the same anywhere along the turn.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Maps the principal relative rotation logarithm from a's body frame to world axes and divides by the nonzero station span; orthonormal endpoint frames are required.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One relative-turn calculation returns the world angular velocity consumed by chain frame interpolation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the principal turn in [0,pi], not an inferred multi-turn history; zero or ill-scaled spans are not repaired here.
   * @evidence contracts/development/common.md#meaningful-documentation States radians per station unit, world-axis convention and constant-turn interpretation.
   * @evidence contracts/development/implementation.md#efficient-algorithms A fixed number of 3x3 operations and three divisions take constant time and storage.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The local rotation matrix/logarithm supplies all three returned components; no inter-query turn cache is retained.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the new angular-velocity triple escapes; endpoint frames and local matrices are not retained.
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
