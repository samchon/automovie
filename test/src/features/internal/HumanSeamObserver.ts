/**
 * Reads declared seams on emitted geometry as a renderer would: from points
 * alone, never from the jets the construction published.
 *
 * A curve junction is read from the two pieces' points on each side of it. A
 * surface seam is read in the plane normal to the seam's tangent: on each
 * side the observer finds the surface's points in that plane by Newton steps
 * along the seam, so the readings are the normal section's own gap, normal
 * angle and normal curvature, whatever either piece's parameter is
 * (testing.md: read a border across the feature, in the plane normal to its
 * own tangent). Derivatives come from one-sided five-point stencils at the
 * seam: fourth order for the first derivative, third order for the second.
 */
export namespace HumanSeamObserver {
  /** Continuity a seam declares. */
  export type Continuity = "G0" | "G1" | "G2";

  /** Readings at one seam point. */
  export interface IReading {
    /** Seam name. */
    seam: string;

    /** Where on the seam, for findings. */
    at: string;

    /** Distance between the two sides' points, mm. */
    gap: number;

    /** Angle between the two sides' tangents (curves) or normals (surfaces), radians. */
    angle: number;

    /** Jump of curvature (curves: curvature vector; surfaces: normal curvature in the normal plane), 1/mm. */
    curvature: number;
  }

  /** Limits a declared continuity is read against, with the reason for each. */
  export interface ITolerance {
    /** Largest gap, mm. */
    gap: number;

    /** Largest angle, radians. */
    angle: number;

    /** Largest curvature jump, 1/mm. */
    curvature: number;

    /** Where the limits come from. */
    basis: string;
  }

  /**
   * Limits for analytic or copied seams: a hundred times the observer's own
   * rounding. Points of magnitude M carry a rounding of about `eps M`
   * (`eps` the double epsilon); the stencils below, whose weights sum to 7
   * for the first derivative and 27 for the second, turn it into about
   * `7 eps M / h` and `27 eps M / h^2` at step h. With pieces parameterised
   * near unit speed (mm), those are the angle's and the curvature's
   * resolution. Truncation, `h^4 f^(5) / 5` and `5 h^3 f^(5) / 6`, stays
   * below them when the caller's step is small against the pieces' bending,
   * which each test states.
   *
   * @param magnitude Largest coordinate magnitude of the pieces, mm.
   * @param step Stencil step in mm of the pieces' own lengths.
   */
  export function exact(magnitude: number, step: number): ITolerance {
    const e: number = Number.EPSILON * magnitude;
    return {
      gap: 100 * e,
      angle: (700 * e) / step,
      curvature: (2700 * e) / (step * step),
      basis: `exact seam: 100 x observer rounding at ${magnitude} mm, step ${step} mm`,
    };
  }

  /**
   * Limits for generated skin: a gap below single-precision rounding of the
   * coordinates (`2^-24` of their magnitude) is invisible to a renderer; a
   * normal mismatch below 0.1 degree along seams is the class A surfacing
   * limit (surface-interrogation.md); a curvature jump is visible when it
   * turns the normal by that much over one vertex spacing, so its limit is
   * 0.1 degree over the spacing.
   *
   * @param magnitude Largest coordinate magnitude of the skin, mm.
   * @param spacing Vertex spacing across the seam, mm.
   */
  export function rendered(magnitude: number, spacing: number): ITolerance {
    const classA: number = (0.1 * Math.PI) / 180;
    return {
      gap: magnitude * 2 ** -24,
      angle: classA,
      curvature: classA / spacing,
      basis: `rendered skin: float32 at ${magnitude} mm, class A 0.1 degree, over ${spacing} mm spacing`,
    };
  }

  /**
   * Readings at a junction of two curve pieces.
   *
   * @param seam Seam name.
   * @param at Location label.
   * @param before Point of the earlier piece at parameter distance `sigma >= 0` back from the junction.
   * @param after Point of the later piece at `sigma >= 0` past the junction.
   * @param step Stencil step in the pieces' parameters.
   */
  export function curve(
    seam: string,
    at: string,
    before: (sigma: number) => number[],
    after: (sigma: number) => number[],
    step: number,
  ): IReading {
    const b: number[][] = derivatives(before, step);
    const a: number[][] = derivatives(after, step);

    // The earlier piece runs backward in sigma: its forward tangent is the
    // negated stencil, its second derivative unchanged.
    const tb: number[] = unit(scale(b[1]!, -1));
    const ta: number[] = unit(a[1]!);
    return {
      seam,
      at,
      gap: norm(sub(a[0]!, b[0]!)),
      angle: angle(tb, ta),
      curvature: norm(sub(bend(a[1]!, a[2]!), bend(b[1]!, b[2]!))),
    };
  }

  /**
   * Readings at one point of a surface seam, in the plane normal to the seam.
   *
   * @param seam Seam name.
   * @param at Location label.
   * @param owner Owner's point at seam parameter `a` and distance `sigma >= 0` into the owner.
   * @param neighbour Neighbour's point at `a` and `sigma >= 0` into the neighbour.
   * @param a Seam parameter of the reading.
   * @param step Stencil step, in both parameters.
   */
  export function surface(
    seam: string,
    at: string,
    owner: (a: number, sigma: number) => number[],
    neighbour: (a: number, sigma: number) => number[],
    a: number,
    step: number,
  ): IReading {
    const p0: number[] = owner(a, 0);
    const q0: number[] = neighbour(a, 0);

    // The seam's tangent from the owner's points along it.
    const T: number[] = unit(
      combine([
        [1 / 12, owner(a - 2 * step, 0)],
        [-8 / 12, owner(a - step, 0)],
        [8 / 12, owner(a + step, 0)],
        [-1 / 12, owner(a + 2 * step, 0)],
      ]),
    );
    const o: ISide = side(owner, a, p0, T, step);
    const n: ISide = side(neighbour, a, q0, T, step);

    // Both normals are taken as T x (direction away from the owner), so a
    // shared tangent plane gives the same normal on both sides.
    const no: number[] = unit(cross(T, scale(o.d1, -1)));
    const nn: number[] = unit(cross(T, n.d1));
    return {
      seam,
      at,
      gap: norm(sub(q0, p0)),
      angle: angle(no, nn),
      curvature: Math.abs(dot(bend(n.d1, n.d2), nn) - dot(bend(o.d1, o.d2), no)),
    };
  }

  /**
   * Every reading that misses its declared continuity, one line each with
   * its numbers and the tolerance basis: G0 judges the gap, G1 the angle as
   * well, G2 the curvature jump as well.
   */
  export function audit(
    readings: readonly IReading[],
    declared: Continuity,
    tolerance: ITolerance,
  ): string[] {
    const out: string[] = [];
    for (const r of readings) {
      const failed: string[] = [];
      if (!(r.gap <= tolerance.gap)) failed.push(`gap ${r.gap} mm`);
      if (declared !== "G0" && !(r.angle <= tolerance.angle))
        failed.push(`angle ${r.angle} rad`);
      if (declared === "G2" && !(r.curvature <= tolerance.curvature))
        failed.push(`curvature jump ${r.curvature} /mm`);
      if (failed.length)
        out.push(`${r.seam} @ ${r.at} misses ${declared}: ${failed.join(", ")} (${tolerance.basis})`);
    }
    return out;
  }

  /** The normal-plane curve of one side: its first and second derivatives at the seam. */
  interface ISide {
    /** First derivative of the section curve in sigma. */
    d1: number[];

    /** Second derivative of the section curve in sigma. */
    d2: number[];
  }

  /**
   * One side's section curve in the plane through `p0` normal to `T`: at each
   * stencil distance, the point of that side found in the plane by Newton
   * steps along the seam parameter.
   */
  function side(
    piece: (a: number, sigma: number) => number[],
    a: number,
    p0: number[],
    T: number[],
    step: number,
  ): ISide {
    const inPlane: (sigma: number) => number[] = (sigma: number): number[] => {
      if (sigma === 0) return piece(a, 0);
      let x: number = a;
      for (let i: number = 0; i < 20; i++) {
        const p: number[] = piece(x, sigma);
        const g: number = dot(sub(p, p0), T);
        const slope: number = dot(sub(piece(x + step, sigma), piece(x - step, sigma)), T) / (2 * step);
        const next: number = x - g / slope;
        if (Math.abs(next - x) < 1e-15 * Math.max(1, Math.abs(x))) return piece(next, sigma);
        x = next;
      }
      return piece(x, sigma);
    };
    const d: number[][] = derivatives(inPlane, step);
    return { d1: d[1]!, d2: d[2]! };
  }
}

/** Point and one-sided first and second derivatives at 0 of a curve given for sigma >= 0. */
function derivatives(f: (sigma: number) => number[], h: number): number[][] {
  const v: number[][] = [0, 1, 2, 3, 4].map((k: number): number[] => f(k * h));
  return [
    v[0]!,
    combine([
      [-25 / (12 * h), v[0]!],
      [48 / (12 * h), v[1]!],
      [-36 / (12 * h), v[2]!],
      [16 / (12 * h), v[3]!],
      [-3 / (12 * h), v[4]!],
    ]),
    combine([
      [35 / (12 * h * h), v[0]!],
      [-104 / (12 * h * h), v[1]!],
      [114 / (12 * h * h), v[2]!],
      [-56 / (12 * h * h), v[3]!],
      [11 / (12 * h * h), v[4]!],
    ]),
  ];
}

/** Curvature vector of a curve from its derivatives: the part of d2 across d1 over |d1|^2. */
function bend(d1: number[], d2: number[]): number[] {
  const t: number[] = unit(d1);
  const along: number = dot(d2, t);
  return scale(sub(d2, scale(t, along)), 1 / dot(d1, d1));
}

/** Angle between unit vectors, accurate near 0. */
function angle(a: number[], b: number[]): number {
  return 2 * Math.atan2(norm(sub(a, b)), norm(combine([[1, a], [1, b]])));
}

/** Weighted sum of vectors. */
function combine(terms: [number, number[]][]): number[] {
  const out: number[] = terms[0]![1].map((): number => 0);
  for (const [w, v] of terms) for (let k: number = 0; k < out.length; k++) out[k]! += w * v[k]!;
  return out;
}

/** Difference. */
function sub(a: number[], b: number[]): number[] {
  return a.map((x: number, k: number): number => x - b[k]!);
}

/** Scalar multiple. */
function scale(a: number[], s: number): number[] {
  return a.map((x: number): number => x * s);
}

/** Dot product. */
function dot(a: number[], b: number[]): number {
  return a.reduce((s: number, x: number, k: number): number => s + x * b[k]!, 0);
}

/** Cross product of 3-vectors. */
function cross(a: number[], b: number[]): number[] {
  return [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
}

/** Euclidean length. */
function norm(a: number[]): number {
  return Math.hypot(...a);
}

/** Unit vector, zero for zero. */
function unit(a: number[]): number[] {
  const l: number = norm(a);
  return l > 0 ? scale(a, 1 / l) : a.map((): number => 0);
}
