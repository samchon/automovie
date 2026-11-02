import type { AutoMovieHumanMeasurementProtocol as P } from "../../../../packages/human/src/generation/AutoMovieHumanMeasurementProtocol";
import { HumanAnatomy as A } from "./HumanAnatomy";
import { HumanPlanePath } from "./HumanPlanePath";

/** Final-skin readings at owned geometric addresses, with no target-size access. */
export namespace HumanMeasurementSite {
  /** A successful reading and the plane or surface-course points it measured. */
  export interface IReading {
    /** Taut section perimeter or declared surface-course length, mm. */
    girth: number;

    /** Component-pick address of the selected plane, mm. */
    origin: A.V3;

    /** Measured skin points; an empty set accompanies an unavailable reading. */
    points: A.V3[];
  }

  /**
   * Read a section, the maximum over its complete owned domain, or a four-contact
   * non-planar course. The 2 mm maximum-search pitch is an engineering sampling
   * resolution, not an anatomical window. Both exact domain ends participate.
   */
  export function read(skin: A.ISkin, site: P.ISite | undefined, region?: Uint32Array): IReading {
    const unavailable: IReading = { girth: NaN, origin: [NaN, NaN, NaN], points: [] };
    if (site === undefined || site.pose !== "bind") return unavailable;
    const geometry: P.ISite["geometry"] = site.geometry;
    if (geometry.kind === "course") return course(skin, geometry, region);
    if (geometry.kind === "plane-path") return HumanPlanePath.read(skin, geometry, region).least ?? unavailable;
    const normal: A.V3 = A.unit(geometry.normal);
    if (!normal.every(Number.isFinite)) return unavailable;
    const cut: (origin: A.V3) => A.ICut | null = A.parallel(skin, normal, region);
    if (geometry.kind === "section") {
      const section: A.ICut | null = cut(geometry.origin);
      return section === null ? unavailable : { girth: section.girth, origin: geometry.origin, points: section.points };
    }

    const length: number = A.dist(geometry.start, geometry.end);
    if (!Number.isFinite(length) || !(length > 0)) return unavailable;
    const steps: number = Math.ceil(length / 2);
    let best: IReading = unavailable;
    for (let k: number = 0; k <= steps; k++) {
      const origin: A.V3 = A.lerp(geometry.start, geometry.end, k / steps);
      const section: A.ICut | null = cut(origin);
      if (section !== null && (!Number.isFinite(best.girth) || section.girth > best.girth))
        best = { girth: section.girth, origin, points: section.points };
    }
    return best;
  }

  /** Read a bind address by name; absence remains a failed finite measurement. */
  export function named(skin: A.ISkin, key: P.Key, region?: Uint32Array): IReading {
    return read(skin, skin.measurementSites?.[key], region);
  }
}

/** Interpolate axial contact heights and ray-read their course on final triangles. */
function course(skin: A.ISkin, geometry: P.ICourse, region?: Uint32Array): HumanMeasurementSite.IReading {
  const axis: A.V3 = A.unit(geometry.normal);
  const front: A.V3 = A.unit(A.reject(geometry.front, axis));
  const left: A.V3 = A.cross(front, axis);
  const heights: number[] = geometry.contacts.map((point: A.V3): number => A.dot(A.sub(point, geometry.origin), axis));
  const points: A.V3[] = [];
  const count: number = 360;
  const stations: number[] = [];
  for (let k: number = 0; k < count; k++) {
    const phase: number = 4 * k / count;
    const cell: number = Math.floor(phase);
    const t: number = phase - cell;
    const a: number = heights[(cell + 3) % 4]!;
    const b: number = heights[cell]!;
    const c: number = heights[(cell + 1) % 4]!;
    const d: number = heights[(cell + 2) % 4]!;

    // Periodic Catmull-Rom uses the four contact heights and their centred
    // derivatives. No shoulder-width clipping or selected curvature enters.
    const height: number = 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
    stations.push(height);
  }

  // Every ray is perpendicular to this axis and stays at its sampled height.
  // Triangles outside the complete height band cannot intersect any ray.
  const candidates: Uint32Array = axialBand(skin, geometry.origin, axis, Math.min(...stations), Math.max(...stations), region);
  for (let k: number = 0; k < count; k++) {
    const angle: number = 2 * Math.PI * k / count;
    const origin: A.V3 = A.add(geometry.origin, A.scale(axis, stations[k]!));
    const direction: A.V3 = A.add(A.scale(front, Math.cos(angle)), A.scale(left, Math.sin(angle)));
    const distance: number = firstHit(skin, origin, direction, candidates);
    if (!Number.isFinite(distance)) return { girth: NaN, origin: geometry.origin, points: [] };
    points.push(A.add(origin, A.scale(direction, distance)));
  }
  let girth: number = 0;
  for (let k: number = 0; k < points.length; k++) girth += A.dist(points[k]!, points[(k + 1) % points.length]!);
  return { girth, origin: geometry.origin, points };
}

/** Conservative complete axial-band candidates, preserving source triangle order. */
function axialBand(skin: A.ISkin, origin: A.V3, axis: A.V3, low: number, high: number, region?: Uint32Array): Uint32Array {
  const projection: Float64Array = new Float64Array(skin.P.length / 3);
  let magnitude: number = Math.abs(A.dot(origin, axis));
  for (let v: number = 0; v < projection.length; v++) {
    projection[v] = (skin.P[3 * v]! - origin[0]) * axis[0] + (skin.P[3 * v + 1]! - origin[1]) * axis[1] + (skin.P[3 * v + 2]! - origin[2]) * axis[2];
    magnitude = Math.max(magnitude, Math.abs(skin.P[3 * v]! * axis[0]) + Math.abs(skin.P[3 * v + 1]! * axis[1]) + Math.abs(skin.P[3 * v + 2]! * axis[2]));
  }
  const slack: number = 32 * Number.EPSILON * Math.max(1, magnitude);
  const candidates: number[] = [];
  const count: number = region?.length ?? skin.I.length / 3;
  for (let k: number = 0; k < count; k++) {
    const triangle: number = region === undefined ? k : region[k]!;
    const a: number = projection[skin.I[3 * triangle]!]!;
    const b: number = projection[skin.I[3 * triangle + 1]!]!;
    const c: number = projection[skin.I[3 * triangle + 2]!]!;
    if (Math.max(a, b, c) >= low - slack && Math.min(a, b, c) <= high + slack) candidates.push(triangle);
  }
  return Uint32Array.from(candidates);
}

/** Closest positive Moller-Trumbore intersection, independent of surface priors. */
function firstHit(skin: A.ISkin, origin: A.V3, direction: A.V3, region?: Uint32Array): number {
  let nearest: number = Infinity;
  const count: number = region?.length ?? skin.I.length / 3;
  for (let k: number = 0; k < count; k++) {
    const triangle: number = region === undefined ? k : region[k]!;
    const a: A.V3 = A.point(skin, skin.I[3 * triangle]!);
    const b: A.V3 = A.point(skin, skin.I[3 * triangle + 1]!);
    const c: A.V3 = A.point(skin, skin.I[3 * triangle + 2]!);
    const ab: A.V3 = A.sub(b, a);
    const ac: A.V3 = A.sub(c, a);
    const p: A.V3 = A.cross(direction, ac);
    const determinant: number = A.dot(ab, p);
    if (Math.abs(determinant) <= 1e-12) continue;
    const delta: A.V3 = A.sub(origin, a);
    const u: number = A.dot(delta, p) / determinant;
    if (u < -1e-10 || u > 1 + 1e-10) continue;
    const q: A.V3 = A.cross(delta, ab);
    const v: number = A.dot(direction, q) / determinant;
    if (v < -1e-10 || u + v > 1 + 1e-10) continue;
    const distance: number = A.dot(ac, q) / determinant;
    if (distance >= 0 && distance < nearest) nearest = distance;
  }
  return nearest;
}
