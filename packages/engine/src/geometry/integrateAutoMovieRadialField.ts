import type { IAutoMovieIntegrateRadialField } from "@automovie/interface";
import { overflowsBinary64 } from "../math/overflowsBinary64";

/**
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
export function integrateAutoMovieRadialField(
  props: IAutoMovieIntegrateRadialField.IProps,
): IAutoMovieIntegrateRadialField.IOutput {
  if (
    props.radius <= 0 ||
    props.sites.length > 512
  )
    throw new Error(
      "Radial footprint needs a positive radius and at most 512 sites",
    );
  const radiusSquared: number = props.radius * props.radius;
  // A finite radius can underflow or overflow its square.
  if (radiusSquared === 0 || overflowsBinary64(radiusSquared))
    throw new Error(
      "Radial support radius exceeds the squared-coordinate range",
    );
  const polygon: Point[] = props.polygon.map(
    (p: readonly [number, number]): Point => [...p],
  );
  const signed: number = area(polygon);
  if (overflowsBinary64(signed))
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
      if ([...normal, constant].some(overflowsBinary64))
        throw new Error("Radial site partition exceeds finite arithmetic");
      if (normal[0] === 0 && normal[1] === 0 && constant === 0) {
        if (j < i) cell = [];
        continue;
      }
      cell = clip(cell, normal, constant);
    }
    const result: IAutoMovieIntegrateRadialField.IOutput = integrate(
      cell,
      site,
      props.radius,
      props.power,
    );
    integral += result.integral;
    gradient[0] += result.gradient[0];
    gradient[1] += result.gradient[1];
  }
  if ([integral, ...gradient].some(overflowsBinary64))
    throw new Error("Radial footprint integration exceeded finite arithmetic");
  return {
    integral: Math.max(0, Math.min(extent, integral)),
    gradient,
    area: extent,
  };
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

/**
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

/**
 * Integrate one sphere over its nearest-site cell, with zero field outside its
 * disk.
 */
function integrate(
  polygon: Point[],
  site: Site,
  radius: number,
  power: 2 | 3,
): IAutoMovieIntegrateRadialField.IOutput {
  const radius2: number = radius * radius;
  const q0: number = 1 - (site.z * site.z) / radius2;
  const result: IAutoMovieIntegrateRadialField.IOutput = {
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
