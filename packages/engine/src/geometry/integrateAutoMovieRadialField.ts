/**
 * Integrate a strongest-site equal-radius compact radial field over a convex planar domain.
 *
 * Coordinates and radius use one common unit in an orthonormal plane frame; each site's z is its signed distance from that plane. The scalar is the strongest positive sphere section q^power, where q=1-distance²/radius². Equal radii make the strongest site a nearest-site half-plane partition. Green's theorem reduces each cell's radial polynomial to edge integrals: four-point Gauss-Legendre is exact for the interior degree-six polynomial in real arithmetic, and the exterior zero-divergence flux uses a signed angle. The returned gradient is the area integral of that scalar's physical planar derivative, not a normal-map or BRDF average.
 *
 * The caller supplies the actual convex domain, rather than an extrapolation from a smaller domain. This operation neither enumerates sites nor chooses an application-specific field scale or eligibility. At most 512 sites bound quadratic cell clipping; larger requests fail explicitly. Floating-point cancellation near tangent circles or nearly coincident sites remains finite precision, not a directed-rounding certificate. Degenerate footprints return zero after input admission.
 *
 * @evidence contracts/common.md#principled-implementation Equal radii turn strongest q^power support into a power-diagram half-plane partition including signed site-plane distances; Green's theorem and radial divergence primitives integrate each cell boundary, with four-node Gauss exact for interior degree-six polynomials in real arithmetic and angular exterior flux. Convexity and well-scaled finite arithmetic remain premises.
 * @evidence contracts/common.md#clear-and-simple-design One pure field integral returns scalar and gradient area integrals; site enumeration, physical domains, materials and image normalization remain caller responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses actual polygon/site coordinates and no fixed point-sampling grid, per-consumer constants or expected-output tables; a 512-site work cap rejects explicitly and finite scalar roundoff is clamped to its analytic [0,area] range.
 * @evidence contracts/common.md#meaningful-documentation Defines common coordinate units, site-plane offset, q^power strongest-site meaning, area/gradient units, degeneracies, precision limits and the explicit work cap.
 * @evidence contracts/performance.md#efficient-algorithms With S sites and V input vertices, conservative O(S²(V+S)) clipping time and O(V+S) per-cell live polygon storage bound this direct nearest-site partition; actual callers prefilter sphere bounds before this at-most-512-site operation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure operation coordinates no persistent requests; caller-owned prepared site lists may be reused without changing the integral.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Working cell polygons and quadrature closures are call-local; the caller owns only the returned scalar/gradient record.
 */
export function integrateAutoMovieRadialField(props: {
  /** Convex finite footprint in the supplied orthonormal plane; either winding is accepted. */
  polygon: readonly (readonly [number, number])[];

  /** Equal-radius field centres; z is signed plane distance in the same coordinate unit. */
  sites: readonly { x: number; y: number; z: number }[];

  /** Strictly positive finite common support radius in that coordinate unit. */
  radius: number;

  /** Supported compact radial polynomial exponent; these two degrees use the exact interior quadrature rule. */
  power: 2 | 3;
}): integrateAutoMovieRadialField.IOutput {
  if (
    !Number.isFinite(props.radius) ||
    props.radius <= 0 ||
    (props.power !== 2 && props.power !== 3) ||
    !Array.isArray(props.polygon) ||
    !Array.isArray(props.sites) ||
    props.sites.length > 512
  )
    throw new Error(
      "Radial footprint needs finite planar inputs and at most 512 sites",
    );
  for (let i: number = 0; i < props.polygon.length; i++) {
    const point: readonly [number, number] | undefined = props.polygon[i];
    if (
      !Object.hasOwn(props.polygon, i) ||
      !Array.isArray(point) ||
      point.length !== 2 ||
      !Object.hasOwn(point, 0) ||
      !Object.hasOwn(point, 1) ||
      !Number.isFinite(point[0]) ||
      !Number.isFinite(point[1])
    )
      throw new Error("A radial footprint needs dense finite planar pairs");
  }
  for (let i: number = 0; i < props.sites.length; i++) {
    const site: Site | undefined = props.sites[i];
    if (
      !Object.hasOwn(props.sites, i) ||
      site === null ||
      typeof site !== "object" ||
      !Number.isFinite(site.x) ||
      !Number.isFinite(site.y) ||
      !Number.isFinite(site.z)
    )
      throw new Error("A radial field needs dense finite site coordinates");
  }
  const radiusSquared: number = props.radius * props.radius;
  if (!Number.isFinite(radiusSquared) || radiusSquared === 0)
    throw new Error(
      "Radial support radius exceeds the squared-coordinate range",
    );
  const polygon: Point[] = props.polygon.map(
    (p: readonly [number, number]): Point => [...p],
  );
  const signed: number = area(polygon);
  if (!Number.isFinite(signed))
    throw new Error("Radial footprint area exceeds finite arithmetic");
  if (signed < 0) polygon.reverse();
  const extent: number = Math.abs(signed);
  if (extent === 0 || polygon.length < 3 || props.sites.length === 0)
    return { integral: 0, gradient: [0, 0], area: extent };
  let integral: number = 0;
  const gradient: Point = [0, 0];
  for (let i: number = 0; i < props.sites.length; ++i) {
    const site: Site = props.sites[i]!;
    let cell: Point[] = polygon;
    for (let j: number = 0; j < props.sites.length && cell.length >= 3; ++j) {
      if (i === j) continue;
      const other: Site = props.sites[j]!;
      const normal: Point = [2 * (other.x - site.x), 2 * (other.y - site.y)];
      const constant: number =
        other.x * other.x +
        other.y * other.y +
        other.z * other.z -
        site.x * site.x -
        site.y * site.y -
        site.z * site.z;
      if (![...normal, constant].every(Number.isFinite))
        throw new Error("Radial site partition exceeds finite arithmetic");
      if (normal[0] === 0 && normal[1] === 0 && constant === 0) {
        if (j < i) cell = [];
        continue;
      }
      cell = clip(cell, normal, constant);
    }
    const result: integrateAutoMovieRadialField.IOutput = integrate(
      cell,
      site,
      props.radius,
      props.power,
    );
    integral += result.integral;
    gradient[0] += result.gradient[0];
    gradient[1] += result.gradient[1];
  }
  if (![integral, ...gradient].every(Number.isFinite))
    throw new Error("Radial footprint integration exceeded finite arithmetic");
  return {
    integral: Math.max(0, Math.min(extent, integral)),
    gradient,
    area: extent,
  };
}

/**
 * Result types in physical planar units; this namespace performs no field evaluation or resource retention.
 *
 * @evidence contracts/common.md#principled-implementation Stores the pure radial field integral, planar gradient integral and actual polygon area in their common coordinate units.
 * @evidence contracts/common.md#clear-and-simple-design Keeps unnormalized integrals together so callers choose their area-weighting without a material representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries computed numbers, never sampling, clinical, geometric containment or material acceptance flags.
 * @evidence contracts/common.md#meaningful-documentation Members state the scalar integral, planar derivative integral and actual area units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no clipping or integration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record coordinates no cache or requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Its numbers own no resource or retained solver state.
 */
export namespace integrateAutoMovieRadialField {
  /** Area integrals before any image quantization or material layering; fields retain the caller's coordinate units.
   */
  export interface IOutput {
    /** Integral of q^power, squared coordinate units. */
    integral: number;

    /** Integral of its planar derivative, coordinate units. */
    gradient: [number, number];

    /** Footprint area, squared coordinate units. */
    area: number;
  }
}

/** Coordinates on the supplied orthonormal plane, in the caller's common unit. */
type Point = [number, number];
/** Sphere centre relative to the supplied plane, in the same coordinate unit. */
type Site = { x: number; y: number; z: number };

/** Signed twice-area of two planar vectors. */
function cross(a: Point, b: Point): number {
  return a[0] * b[1] - a[1] * b[0];
}

/** Signed polygon area; input convexity is the caller's clipped-texel premise. */
function area(polygon: Point[]): number {
  let sum: number = 0;
  for (let i: number = 0; i < polygon.length; ++i)
    sum += cross(polygon[i]!, polygon[(i + 1) % polygon.length]!);
  return sum / 2;
}

/** Sutherland-Hodgman clipping against one nearest-site half-plane. */
function clip(polygon: Point[], normal: Point, constant: number): Point[] {
  const result: Point[] = [];
  for (let i: number = 0; i < polygon.length; ++i) {
    const a: Point = polygon[i]!;
    const b: Point = polygon[(i + 1) % polygon.length]!;
    const da: number = normal[0] * a[0] + normal[1] * a[1] - constant;
    const db: number = normal[0] * b[0] + normal[1] * b[1] - constant;
    if (da <= 0) result.push(a);
    if ((da < 0 && db > 0) || (db < 0 && da > 0)) {
      const t: number = da / (da - db);
      result.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  return result;
}

/** Four-node rule integrates the supported edge polynomials of degree at most six. */
function gauss(read: (t: number) => number, lo: number, hi: number): number {
  const middle: number = (lo + hi) / 2;
  const half: number = (hi - lo) / 2;
  return (
    half *
    (0.3478548451374538 *
      (read(middle - half * 0.8611363115940526) +
        read(middle + half * 0.8611363115940526)) +
      0.6521451548625461 *
        (read(middle - half * 0.3399810435848563) +
          read(middle + half * 0.3399810435848563)))
  );
}

/** Radial divergence primitive inside the support, polynomial in squared radius. */
function flux(s: number, q0: number, radius2: number, power: 2 | 3): number {
  const t: number = s / radius2;
  return power === 2
    ? (q0 * q0) / 2 - (q0 * t) / 2 + (t * t) / 6
    : (q0 * q0 * q0) / 2 -
        (3 * q0 * q0 * t) / 4 +
        (q0 * t * t) / 2 -
        (t * t * t) / 8;
}

/** Integrate one sphere over its nearest-site cell, with zero field outside its disk. */
function integrate(
  polygon: Point[],
  site: Site,
  radius: number,
  power: 2 | 3,
): integrateAutoMovieRadialField.IOutput {
  const radius2: number = radius * radius;
  const q0: number = 1 - (site.z * site.z) / radius2;
  const result: integrateAutoMovieRadialField.IOutput = {
    integral: 0,
    gradient: [0, 0],
    area: Math.abs(area(polygon)),
  };
  if (q0 <= 0 || polygon.length < 3) return result;
  const support2: number = radius2 * q0;
  const exterior: number = (radius2 * q0 ** (power + 1)) / (2 * (power + 1));
  for (let i: number = 0; i < polygon.length; ++i) {
    const original: Point = polygon[i]!;
    const next: Point = polygon[(i + 1) % polygon.length]!;
    const a: Point = [original[0] - site.x, original[1] - site.y];
    const edge: Point = [next[0] - original[0], next[1] - original[1]];
    const aa: number = edge[0] * edge[0] + edge[1] * edge[1];
    if (aa === 0) continue;
    const bb: number = 2 * (a[0] * edge[0] + a[1] * edge[1]);
    const cc: number = a[0] * a[0] + a[1] * a[1] - support2;
    const discriminant: number = bb * bb - 4 * aa * cc;
    const cuts: number[] = [0, 1];
    if (discriminant > 0) {
      const root: number = Math.sqrt(discriminant);
      for (const t of [(-bb - root) / (2 * aa), (-bb + root) / (2 * aa)])
        if (t > 0 && t < 1) cuts.push(t);
    }
    cuts.sort((a: number, b: number): number => a - b);
    const square: (t: number) => number = (t: number): number =>
      (a[0] + t * edge[0]) ** 2 + (a[1] + t * edge[1]) ** 2;
    for (let k: number = 0; k + 1 < cuts.length; ++k) {
      const lo: number = cuts[k]!;
      const hi: number = cuts[k + 1]!;
      if (square((lo + hi) / 2) <= support2) {
        result.integral +=
          cross(a, edge) *
          gauss(
            (t: number): number => flux(square(t), q0, radius2, power),
            lo,
            hi,
          );
        const height: number = gauss(
          (t: number): number => Math.max(0, q0 - square(t) / radius2) ** power,
          lo,
          hi,
        );
        result.gradient[0] += edge[1] * height;
        result.gradient[1] -= edge[0] * height;
      } else {
        const first: Point = [a[0] + lo * edge[0], a[1] + lo * edge[1]];
        const last: Point = [a[0] + hi * edge[0], a[1] + hi * edge[1]];
        result.integral +=
          exterior *
          Math.atan2(
            cross(first, last),
            first[0] * last[0] + first[1] * last[1],
          );
      }
    }
  }
  return result;
}
