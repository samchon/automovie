/**
 * A section arc between two guide points, built in the frame of its own chord.
 *
 * The arc is the quintic Hermite curve of both ends' published jets (point,
 * unit tangent, curvature vector; rule J1), so it leaves each guide with that
 * guide's point, tangent line and curvature, plus the sector's own fullness
 * `f` times `64 xi^3 (1 - xi)^3`, which vanishes with its first and second
 * derivatives at both ends and is 1 at the middle, normal to the chord on its
 * outward side. The arc needs no common centre and no star-shaped section:
 * each sector of a section is such an arc between its two guides, and
 * the sectors merge only through the guides' jets (G2 across every guide).
 *
 * The Hermite part runs at a parameter speed equal to the chord's length, so
 * `xi` in `[0, 1]` runs the chord once. A section runs counter-clockwise in
 * its `(x, z)` chart, so the outward side of a chord is on the right of its
 * direction, `(c_z, -c_x) / |c|`.
 */
export namespace AutoMovieHumanChordArc {
  /** A guide's published jet in the section chart, by arclength: `AutoMovieHumanSeam.publish`. */
  export interface IEnd {
    /** Point, mm. */
    point: readonly number[];

    /** Unit tangent along the section's counter-clockwise direction. */
    tangent: readonly number[];

    /** Curvature vector `kappa N`, perpendicular to the tangent, 1/mm. */
    curvature: readonly number[];
  }

  /** A point of the arc with its first and second derivatives in `xi`. */
  export type Jet = [number[], number[], number[]];

  /**
   * The arc's point and its two derivatives in `xi`.
   *
   * @param a The guide the sector leaves.
   * @param b The guide the sector arrives at.
   * @param fullness The sector's bulge at its middle, mm, outward positive.
   * @param xi Place in the sector, 0 at `a` and 1 at `b`.
   * @returns `[p, p_xi, p_xixi]`.
   */
  export function jet(a: IEnd, b: IEnd, fullness: number, xi: number): Jet {
    const c: number[] = [b.point[0]! - a.point[0]!, b.point[1]! - a.point[1]!];
    const length: number = Math.hypot(c[0]!, c[1]!);
    if (!(length > 0)) throw new Error("A sector needs two distinct guide points");

    // The Hermite data in xi: value, speed `length` times the tangent and
    // `length^2` times the curvature vector.
    const lo: number[][] = [[...a.point], a.tangent.map((v: number): number => length * v), a.curvature.map((v: number): number => length * length * v)];
    const hi: number[][] = [[...b.point], b.tangent.map((v: number): number => length * v), b.curvature.map((v: number): number => length * length * v)];
    const out: Jet = [[0, 0], [0, 0], [0, 0]];
    const outward: number[] = [c[1]! / length, -c[0]! / length];
    for (let k: number = 0; k < 3; k++) {
      // Each basis polynomial's k-th derivative at xi, once for both axes.
      const bump: number = horner(DERIVED_BUMP[k]!, xi);
      const basis: number[] = DERIVED_BASIS[k]!.map((p: readonly number[]): number => horner(p, xi));
      for (let d: number = 0; d < 2; d++)
        out[k]![d] =
          fullness * outward[d]! * bump +
          lo[0]![d]! * basis[0]! +
          lo[1]![d]! * basis[1]! +
          lo[2]![d]! * basis[2]! +
          hi[0]![d]! * basis[3]! +
          hi[1]![d]! * basis[4]! +
          hi[2]![d]! * basis[5]!;
    }
    return out;
  }

  /**
   * The jet of the arc's end as the neighbour would copy it: the published
   * jet at `xi` of an arc, by arclength.
   */
  export function published(a: IEnd, b: IEnd, fullness: number, xi: number): { point: number[]; tangent: number[]; curvature: number[] } {
    const [p, d1, d2] = jet(a, b, fullness, xi);
    const speed: number = Math.hypot(d1[0]!, d1[1]!) || 1;
    const tangent: number[] = d1.map((v: number): number => v / speed);
    const along: number = (d2[0]! * tangent[0]! + d2[1]! * tangent[1]!) / speed;
    return {
      point: p,
      tangent,
      curvature: d2.map((v: number, k: number): number => (v - along * speed * tangent[k]!) / (speed * speed)),
    };
  }

  /**
   * The quintic Hermite basis on `[0, 1]` as polynomial coefficients from the
   * constant term: value, first and second derivative at 0, then at 1.
   */
  const BASIS: readonly (readonly number[])[] = [
    [1, 0, 0, -10, 15, -6],
    [0, 1, 0, -6, 8, -3],
    [0, 0, 0.5, -1.5, 1.5, -0.5],
    [0, 0, 0, 10, -15, 6],
    [0, 0, 0, -4, 7, -3],
    [0, 0, 0, 0.5, -1, 0.5],
  ];

  /** `64 xi^3 (1 - xi)^3`: zero with two derivatives at both ends, 1 at the middle. */
  const BUMP: readonly number[] = [0, 0, 0, 64, -192, 192, -64];

  /** A polynomial's k-th derivative's coefficients, from the constant term. */
  function derive(c: readonly number[], k: number): number[] {
    const out: number[] = [];
    for (let i: number = k; i < c.length; i++) {
      let f: number = 1;
      for (let j: number = 0; j < k; j++) f *= i - j;
      out.push(f * c[i]!);
    }
    return out;
  }

  /** A polynomial at x by Horner's rule, coefficients from the constant term. */
  function horner(c: readonly number[], x: number): number {
    let sum: number = 0;
    for (let i: number = c.length - 1; i >= 0; i--) sum = sum * x + c[i]!;
    return sum;
  }

  /** The basis' value, first and second derivative polynomials. */
  const DERIVED_BASIS: readonly (readonly (readonly number[])[])[] = [0, 1, 2].map((k: number): number[][] => BASIS.map((c: readonly number[]): number[] => derive(c, k)));

  /** The bump's value, first and second derivative polynomials. */
  const DERIVED_BUMP: readonly (readonly number[])[] = [0, 1, 2].map((k: number): number[] => derive(BUMP, k));
}
