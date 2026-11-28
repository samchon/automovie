import type { IAutoMovieIntegrateRadialField } from "@automovie/interface";

import { AutoMovieEnginePlanarArea } from "../AutoMovieEnginePlanarArea";

/*
 * Integrate a strongest-site equal-radius compact radial field over a convex
 * planar domain.
 *
 * Coordinates and radius use one common unit in an orthonormal plane frame;
 * each site's z is its signed distance from that plane. The scalar is the
 * strongest positive sphere section q^power, where q=1-distance²/radius². Equal
 * radii make the strongest site a nearest-site half-plane partition. Green's
 * theorem reduces each cell's radial polynomial to edge integrals: four-point
 * Gauss-Legendre is exact for the interior degree-six polynomial in real
 * arithmetic, and the exterior zero-divergence flux uses a signed angle. The
 * returned gradient is the area integral of that scalar's physical planar
 * derivative, not a normal-map or BRDF average.
 *
 * The caller supplies the actual convex domain, rather than an extrapolation
 * from a smaller domain. This operation neither enumerates sites nor chooses an
 * application-specific field scale or eligibility. At most 512 sites bound
 * quadratic cell clipping; larger requests fail explicitly. Floating-point
 * cancellation near tangent circles or nearly coincident sites remains finite
 * precision, not a directed-rounding certificate. Degenerate footprints return
 * zero after input admission.
 */
export function integrateRadialField(
  props: IAutoMovieIntegrateRadialField.IProps,
): IAutoMovieIntegrateRadialField.IOutput {
  if (
    !Number.isFinite(props.radius) ||
    props.radius <= 0 ||
    props.sites.length > 512
  )
    throw new Error(
      "Radial footprint needs a positive radius and at most 512 sites",
    );
  if (props.power !== 2 && props.power !== 3)
    throw new Error("Radial footprint power must be 2 or 3");
  const radiusSquared: number = props.radius * props.radius;
  // A finite radius can underflow or overflow its square.
  if (radiusSquared === 0 || !Number.isFinite(radiusSquared))
    throw new Error(
      "Radial support radius exceeds the squared-coordinate range",
    );
  const polygon: Point[] = [];
  for (const point of props.polygon) {
    if (
      !Array.isArray(point) ||
      point.length !== 2 ||
      !Number.isFinite(point[0]) ||
      !Number.isFinite(point[1])
    )
      throw new Error("Radial footprint needs finite planar points");
    polygon.push([point[0], point[1]]);
  }
  const sites: IAutoMovieIntegrateRadialField.ISite[] = [];
  for (const site of props.sites) {
    if (
      site === undefined ||
      site === null ||
      !Number.isFinite(site.x) ||
      !Number.isFinite(site.y) ||
      !Number.isFinite(site.z)
    )
      throw new Error("Radial footprint needs finite site centres");
    // A sphere that does not reach the plane contributes no positive field
    // and cannot take a point from the support of a sphere that does.
    if (Math.abs(site.z) < props.radius) sites.push(site);
  }
  const signed: number = AutoMovieEnginePlanarArea.measureTuples(polygon);
  if (!Number.isFinite(signed))
    throw new Error("Radial footprint area exceeds finite arithmetic");
  if (signed < 0) polygon.reverse();
  const extent: number = Math.abs(signed);
  if (extent === 0 || sites.length === 0)
    return { integral: 0, gradient: [0, 0], area: extent };
  let integral: number = 0;
  const gradient: Point = [0, 0];
  for (let i: number = 0; i < sites.length; ++i) {
    const site: IAutoMovieIntegrateRadialField.ISite = sites[i]!;
    let cell: Point[] = polygon;
    for (let j: number = 0; j < sites.length && cell.length >= 3; ++j) {
      if (i === j) continue;
      const other: IAutoMovieIntegrateRadialField.ISite = sites[j]!;
      const normal: Point = [2 * (other.x - site.x), 2 * (other.y - site.y)];
      const constant: number =
        other.x * other.x +
        other.y * other.y +
        other.z * other.z -
        site.x * site.x -
        site.y * site.y -
        site.z * site.z;
      if (
        !Number.isFinite(normal[0]) ||
        !Number.isFinite(normal[1]) ||
        !Number.isFinite(constant)
      )
        throw new Error("Radial site partition exceeds finite arithmetic");
      if (normal[0] === 0 && normal[1] === 0 && constant === 0) {
        if (j < i) cell = [];
        continue;
      }
      cell = clip(cell, normal, constant);
    }
    const result: IRadialIntegral = integrate(
      cell,
      site,
      radiusSquared,
      props.power,
    );
    integral += result.integral;
    gradient[0] += result.gradient[0];
    gradient[1] += result.gradient[1];
  }
  if (
    !Number.isFinite(integral) ||
    gradient.some((value: number): boolean => !Number.isFinite(value))
  )
    throw new Error("Radial footprint integration exceeded finite arithmetic");
  return {
    integral: Math.max(0, Math.min(extent, integral)),
    gradient,
    area: extent,
  };
}

/*
 * Coordinates on the supplied orthonormal plane, in the caller's common unit.
 */
type Point = [number, number];
type IRadialIntegral = Pick<
  IAutoMovieIntegrateRadialField.IOutput,
  "integral" | "gradient"
>;

/*
 * Signed twice-area of two planar vectors.
 */
function cross(a: Point, b: Point): number {
  return a[0] * b[1] - a[1] * b[0];
}

/*
 * Sutherland-Hodgman clipping against one nearest-site half-plane.
 */
function clip(polygon: Point[], normal: Point, constant: number): Point[] {
  const result: Point[] = [];
  for (let i: number = 0; i < polygon.length; ++i) {
    const a: Point = polygon[i]!;
    const b: Point = polygon[(i + 1) % polygon.length]!;
    const da: number = normal[0] * a[0] + normal[1] * a[1] - constant;
    const db: number = normal[0] * b[0] + normal[1] * b[1] - constant;
    if (!Number.isFinite(da) || !Number.isFinite(db))
      throw new Error("Radial site clipping exceeds finite arithmetic");
    if (da <= 0) result.push(a);
    if ((da < 0 && db > 0) || (db < 0 && da > 0)) {
      // Scaling opposite signed distances first keeps their sum representable.
      const scale: number = Math.max(Math.abs(da), Math.abs(db));
      const left: number = Math.abs(da) / scale;
      const t: number = left / (left + Math.abs(db) / scale);
      const point: Point = [
        (1 - t) * a[0] + t * b[0],
        (1 - t) * a[1] + t * b[1],
      ];
      if (!Number.isFinite(point[0]) || !Number.isFinite(point[1]))
        throw new Error("Radial site clipping exceeds finite arithmetic");
      result.push(point);
    }
  }
  return result;
}

/*
 * Four-node rule integrates the supported edge polynomials of degree at most
 * six.
 */
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

/*
 * Radial divergence primitive inside the support, polynomial in squared radius.
 */
function flux(s: number, q0: number, radius2: number, power: 2 | 3): number {
  const t: number = s / radius2;
  return power === 2
    ? (q0 * q0) / 2 - (q0 * t) / 2 + (t * t) / 6
    : (q0 * q0 * q0) / 2 -
        (3 * q0 * q0 * t) / 4 +
        (q0 * t * t) / 2 -
        (t * t * t) / 8;
}

/*
 * Integrate one sphere over its nearest-site cell, with zero field outside its
 * disk.
 */
function integrate(
  polygon: Point[],
  site: IAutoMovieIntegrateRadialField.ISite,
  radius2: number,
  power: 2 | 3,
): IRadialIntegral {
  const q0: number = 1 - (site.z * site.z) / radius2;
  const result: IRadialIntegral = { integral: 0, gradient: [0, 0] };
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
    const scale: number = Math.max(aa, Math.abs(bb), Math.abs(cc));
    if (!Number.isFinite(scale))
      throw new Error("Radial support intersection exceeds finite arithmetic");
    // Coefficients have squared coordinate units. Dividing all three by one
    // scale preserves the edge roots without squaring that unit scale again.
    const scaledA: number = aa / scale;
    const scaledB: number = bb / scale;
    const scaledC: number = cc / scale;
    const discriminant: number = scaledB * scaledB - 4 * scaledA * scaledC;
    const cuts: number[] = [0, 1];
    if (discriminant > 0) {
      const root: number = Math.sqrt(discriminant);
      for (const t of [
        (-scaledB - root) / (2 * scaledA),
        (-scaledB + root) / (2 * scaledA),
      ])
        if (t > 0 && t < 1) cuts.push(t);
    }
    cuts.sort((a: number, b: number): number => a - b);
    const square: (t: number) => number = (t: number): number =>
      (a[0] + t * edge[0]) ** 2 + (a[1] + t * edge[1]) ** 2;
    for (let k: number = 0; k + 1 < cuts.length; ++k) {
      const lo: number = cuts[k]!;
      const hi: number = cuts[k + 1]!;
      const middleSquare: number = square((lo + hi) / 2);
      if (!Number.isFinite(middleSquare))
        throw new Error("Radial support distance exceeds finite arithmetic");
      if (middleSquare <= support2) {
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
        const numerator: number = cross(first, last);
        const denominator: number = first[0] * last[0] + first[1] * last[1];
        if (!Number.isFinite(numerator) || !Number.isFinite(denominator))
          throw new Error("Radial exterior flux exceeds finite arithmetic");
        result.integral += exterior * Math.atan2(numerator, denominator);
      }
    }
  }
  return result;
}
