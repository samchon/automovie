/**
 * A closed section about an axis point as a radius in the polar angle, built
 * from guides and the sectors between them (rule J2's sector fill).
 *
 * A guide stands at a fixed angle and owns the radius there and its first
 * and second angle derivatives `(rho, rho_phi, rho_phiphi)`. A sector between
 * two guides `a` and `b` of angular width `D` is, in the share
 * `xi = (phi - phi_a) / D`, the quintic Hermite of both guides' values
 *
 * ```text
 * rho = H0 rho_a + H1 D rho'_a + H2 D^2 rho''_a
 *     + H3 rho_b + H4 D rho'_b + H5 D^2 rho''_b + f B(xi)
 * ```
 *
 * plus the sector's own fullness `f` times `B = 64 xi^3 (1 - xi)^3`, which
 * vanishes with its first and second derivatives at both guides and is 1 at
 * the sector's middle. So the radius is C2 across every guide whatever the
 * sectors' fullness, each sector keeps one number of its own, and the guide's
 * jet is the point, tangent and curvature ({@link point}) a seam publishes.
 * A quarter superellipse would put zero curvature on the
 * guide; here the guide's curvature is whatever its `rho_phiphi` says.
 *
 * Angles are radians and run counter-clockwise in the section's own
 * `(x, z)` chart: the point at `phi` is `rho (cos phi, sin phi)`.
 *
 * @evidence contracts/common.md#principled-implementation Between guides a section is the quintic polar Hermite of the guides' exact polar jets, so it touches its box at the guides with matching curvature.
 * @evidence contracts/common.md#clear-and-simple-design One guide record and one sector evaluation in polar form.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the supplied guide jets and fullness directly; the caller owns their geometric derivation and validity.
 * @evidence contracts/common.md#meaningful-documentation States the guide's jet, the Hermite basis and the angle convention.
 * @evidence contracts/performance.md#efficient-algorithms Binary search finds one guide interval, then fixed-size Horner basis arithmetic evaluates the radius jet.
 * @evidence contracts/performance.md#reuse-equivalent-work Each radius reading shares the selected pair and basis powers across all three jet orders; no pair coefficients are cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Radius/point results are fresh fixed-size arrays; guides and computed coefficients are not retained by this module.
 */
export namespace AutoMoviePolarSector {
  /**
   * A guide: a fixed angle owning the radius and its two angle derivatives.
   *
   * @evidence contracts/common.md#principled-implementation Value, first derivative and second derivative at one polar angle supply the endpoint data of a quintic sector.
   * @evidence contracts/common.md#clear-and-simple-design Four scalar fields keep the interpolation boundary independent of the source conic or seam that produced it.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The record does not prove positive radius, ordered angles or conic origin; those are producer premises.
   * @evidence contracts/common.md#meaningful-documentation Names radians and both angular derivative orders; radius units follow the owning section, normally mm.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The guide is interpolation data and executes no search or evaluation.
   * @evidence contracts/performance.md#reuse-equivalent-work The same endpoint jet can be used by the two adjacent sectors while its values stay unchanged.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Each guide contains four numbers; the section owner controls the guide array's lifetime, with no module cache.
   */
  export interface IGuide {
    /** Polar angle, radians. */
    angle: number;

    /** Radius. */
    value: number;

    /** First derivative of the radius in the angle. */
    slope: number;

    /** Second derivative of the radius in the angle. */
    curvature: number;
  }

  /**
   * Radius and its first/second angular derivatives, in radius units per radian order.
   *
   * @evidence contracts/common.md#principled-implementation The three-tuple carries rho, rho-prime and rho-double-prime for analytic polar-to-Cartesian differentiation.
   * @evidence contracts/common.md#clear-and-simple-design Positional derivative order matches the radius and point readers without another stateful object.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The tuple itself performs no finite-value, positivity or curvature validation.
   * @evidence contracts/common.md#meaningful-documentation States derivative order and units relative to the section radius.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This alias contains no numeric algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A returned value tuple coordinates no cached work.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Its owner retains exactly three numbers and no resource handle.
   */
  export type Jet = [number, number, number];

  /**
   * The radius at an angle and its two angle derivatives.
   *
   * @param guides Guides by increasing angle within one turn, at least two;
   *   the last sector runs from the last guide round to the first.
   * @param fullness One per guide: sector j follows guide j.
   * @param phi Angle, any real value.
   *
   * @evidence contracts/common.md#principled-implementation Wraps finite phi into one turn, binary-searches increasing guides and evaluates the selected quintic endpoint-jet interpolation plus its C2-zero fullness bump.
   * @evidence contracts/common.md#clear-and-simple-design One guide search delegates only the fixed-size span polynomial to sector.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejects too few guides, mismatched fullness and a nonpositive selected span; full angle order/finiteness/positive-radius admission remains the caller's responsibility.
   * @evidence contracts/common.md#meaningful-documentation Gives guide order, cyclic last sector and fullness indexing, with derivative convention in Jet.
   * @evidence contracts/performance.md#efficient-algorithms O(log G) guide lookup plus constant polynomial work and a three-number result for G ordered guides.
   * @evidence contracts/performance.md#reuse-equivalent-work One selected guide pair, width and basis-power evaluation serves radius and both angular derivatives; repeated calls are not cached.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one fresh jet and retains neither guide/fullness arrays nor span preparation.
   */
  export function radius(
    guides: readonly IGuide[],
    fullness: readonly number[],
    phi: number,
  ): Jet {
    if (guides.length < 2 || fullness.length !== guides.length)
      throw new Error(
        "A polar section needs two guides and one fullness per sector",
      );
    const n: number = guides.length;
    const first: number = guides[0]!.angle;
    const at: number = wrap(phi - first) + first;

    // The sector by bisection on the increasing guide angles: the last guide
    // at or below the angle, or the last guide for the closing sector.
    let lo: number = 0;
    let hi: number = n;
    while (hi - lo > 1) {
      const m: number = (lo + hi) >> 1;
      if (guides[m]!.angle <= at) lo = m;
      else hi = m;
    }
    const j: number = lo;
    const a: IGuide = guides[j]!;
    const b: IGuide = guides[(j + 1) % n]!;
    const width: number =
      j + 1 < n ? b.angle - a.angle : b.angle + TWO_PI - a.angle;
    if (!(width > 0))
      throw new Error("Polar guides must increase within one turn");
    return sector(a, b, width, fullness[j]!, (at - a.angle) / width);
  }

  /**
   * The fullness that puts a sector's middle at a radius: the inverse of the
   * sector rule at `xi = 1/2`, where `B` is 1.
   *
   * @evidence contracts/common.md#principled-implementation At xi=1/2 the fullness basis equals one, so subtracting the zero-fullness radius gives the unique additive fullness for that midpoint.
   * @evidence contracts/common.md#clear-and-simple-design One base-sector reading and subtraction implement the inverse of the existing forward rule.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves the requested middle radius without clamping fullness or claiming the resulting whole sector is convex or positive.
   * @evidence contracts/common.md#meaningful-documentation States the midpoint parameter and unit-height bump premise; width must be positive as for sector evaluation.
   * @evidence contracts/performance.md#efficient-algorithms Constant span-polynomial work; this path also computes the two unused derivative entries of its local sector result.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the same forward sector basis instead of a second independent interpolation formula; no persistent prepared pair is owned.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The temporary jet is call-local and only a scalar fullness is returned.
   */
  export function fullnessAt(
    a: IGuide,
    b: IGuide,
    width: number,
    middle: number,
  ): number {
    return middle - sector(a, b, width, 0, 0.5)[0];
  }

  /**
   * A point of the section and its first and second derivatives in the angle,
   * in the section's `(x, z)` chart, for a radius jet: `p = rho e`,
   * `p' = rho' e + rho e_perp`, `p'' = (rho'' - rho) e + 2 rho' e_perp`.
   *
   * @evidence contracts/common.md#principled-implementation Applies the analytic product rule to rho(phi)*(cos(phi),sin(phi)) for the supplied finite radius jet.
   * @evidence contracts/common.md#clear-and-simple-design One reading returns Cartesian point and both derivatives in a fixed derivative-order array.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the given polar jet without finite differences, radius fitting or normalization.
   * @evidence contracts/common.md#meaningful-documentation Gives the section X/Z chart and all three conversion equations.
   * @evidence contracts/performance.md#efficient-algorithms Constant arithmetic, one sine/cosine pair and three two-component output arrays.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the same sine, cosine and radius derivatives for the point and both derivative orders.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fresh outer array and three pairs; no guide or jet state is retained.
   */
  export function point(jet: Jet, phi: number): [number[], number[], number[]] {
    const [r, r1, r2] = jet;
    const c: number = Math.cos(phi);
    const s: number = Math.sin(phi);
    return [
      [r * c, r * s],
      [r1 * c - r * s, r1 * s + r * c],
      [(r2 - r) * c - 2 * r1 * s, (r2 - r) * s + 2 * r1 * c],
    ];
  }

  /**
   * One sector's radius jet at share `xi` of its width: the quintic Hermite
   * basis and the bump with their first two derivatives written out by
   * Horner's rule, so a call allocates only its result.
   */
  function sector(
    a: IGuide,
    b: IGuide,
    width: number,
    full: number,
    xi: number,
  ): Jet {
    const D: number = width;
    const x: number = xi;
    const x2: number = x * x;

    // Values, first and second derivatives in xi of the six basis functions.
    const h0: number = 1 + x2 * x * (-10 + x * (15 - 6 * x));
    const h0d: number = x2 * (-30 + x * (60 - 30 * x));
    const h0dd: number = x * (-60 + x * (180 - 120 * x));
    const h1: number = x + x2 * x * (-6 + x * (8 - 3 * x));
    const h1d: number = 1 + x2 * (-18 + x * (32 - 15 * x));
    const h1dd: number = x * (-36 + x * (96 - 60 * x));
    const h2: number = x2 * (0.5 + x * (-1.5 + x * (1.5 - 0.5 * x)));
    const h2d: number = x * (1 + x * (-4.5 + x * (6 - 2.5 * x)));
    const h2dd: number = 1 + x * (-9 + x * (18 - 10 * x));
    const h3: number = 1 - h0;
    const h3d: number = -h0d;
    const h3dd: number = -h0dd;
    const h4: number = x2 * x * (-4 + x * (7 - 3 * x));
    const h4d: number = x2 * (-12 + x * (28 - 15 * x));
    const h4dd: number = x * (-24 + x * (84 - 60 * x));
    const h5: number = x2 * x * (0.5 + x * (-1 + 0.5 * x));
    const h5d: number = x2 * (1.5 + x * (-4 + 2.5 * x));
    const h5dd: number = x * (3 + x * (-12 + 10 * x));

    // The bump 64 xi^3 (1 - xi)^3 and its derivatives.
    const s: number = 1 - x;
    const bump: number = 64 * x2 * x * s * s * s;
    const bumpd: number = 192 * x2 * s * s * (1 - 2 * x);
    const bumpdd: number = 384 * x * s * (1 - 5 * x + 5 * x2);

    // The guides' jets scaled to the unit share.
    const v0: number = a.value;
    const v1: number = D * a.slope;
    const v2: number = D * D * a.curvature;
    const v3: number = b.value;
    const v4: number = D * b.slope;
    const v5: number = D * D * b.curvature;
    return [
      h0 * v0 + h1 * v1 + h2 * v2 + h3 * v3 + h4 * v4 + h5 * v5 + full * bump,
      (h0d * v0 +
        h1d * v1 +
        h2d * v2 +
        h3d * v3 +
        h4d * v4 +
        h5d * v5 +
        full * bumpd) /
        D,
      (h0dd * v0 +
        h1dd * v1 +
        h2dd * v2 +
        h3dd * v3 +
        h4dd * v4 +
        h5dd * v5 +
        full * bumpdd) /
        (D * D),
    ];
  }
}

/** A whole turn. */
const TWO_PI: number = 2 * Math.PI;

/** Angle reduced to `[0, 2 pi)`. */
function wrap(t: number): number {
  const r: number = t % TWO_PI;
  return r < 0 ? r + TWO_PI : r;
}
