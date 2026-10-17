import { integrateAutoMovieRadialField } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanAppearance } from "../structures/IAutoMovieHumanAppearance";

/**
 * Seeded physical rest-space marks, independent of vertex ids, UV charts and sampling.
 *
 * One jittered candidate per cubic cell makes a stationary three-dimensional field. Cell volume is 200 r / maximumDensity mm³ and candidates are thinned by density/maximumDensity. A plane intersects centres in a slab of thickness 2 r, giving the authored expected count per 100 mm². Increasing density retains the existing candidate positions. The sphere cross-sections have diameter at most the authored diameter, not a fixed diameter at every surface point. Finite curved patches do not have an exact count. Placement and papule heights are artistic conventions, not diagnoses, anatomical follicle placement or measured population distributions.
 *
 * The caller bakes this field on the actual rest skin. UV cuts sample the same position; baking resolution and UV metric error belong to that consumer.
 */
export class AutoMovieHumanSkinFeatureField {
  private readonly seed_: number;
  private readonly freckles_: IAutoMovieHumanAppearance.IFreckles | undefined;
  private readonly acne_: IAutoMovieHumanAppearance.IAcne | undefined;

  /** Copy the admitted controls; absent marks and zero coverage are identities. */
  public constructor(skin: IAutoMovieHumanAppearance.ISkin) {
    this.seed_ = skin.seed ?? 0;
    this.freckles_ =
      skin.freckles && skin.freckles.density > 0 && skin.freckles.contrast > 0
        ? { ...skin.freckles }
        : undefined;
    this.acne_ =
      skin.acne && skin.acne.density > 0 && skin.acne.severity > 0
        ? { ...skin.acne }
        : undefined;
  }

  /** Whether an actual nonzero mark can be emitted. */
  public get active(): boolean {
    return !!(
      (this.freckles_ &&
        this.freckles_.density > 0 &&
        this.freckles_.contrast > 0) ||
      (this.acne_ && this.acne_.density > 0 && this.acne_.severity > 0)
    );
  }

  /** Whether a separate freckle pigment layer can be emitted. */
  public get pigmented(): boolean {
    return this.freckles_ !== undefined;
  }

  /** Whether papule normals can be emitted. */
  public get papules(): boolean {
    return !!(this.acne_ && this.acne_.density > 0 && this.acne_.severity > 0);
  }

  /**
   * Prepare the exact compact-polynomial coverage filter for one actual rest triangle.
   *
   * Candidate cells are enumerated once for the triangle and reused by its clipped texel polygons. The current equal-radius q²/q³ authority is retained; no fixed sampling grid can miss a sub-texel disk. Returned gradients are averaged latent height slopes, not alpha-composited material normals. A degenerate triangle or work budget returns null rather than a centre approximation. The caller reports that unsupported region explicitly.
   */
  public prepare(
    triangleMm: readonly IAutoMovieVector3[],
  ):
    | ((
        polygonMm: readonly IAutoMovieVector3[],
      ) => ReturnType<AutoMovieHumanSkinFeatureField["sample"]>)
    | null {
    if (
      triangleMm.length !== 3 ||
      triangleMm.some(
        (p: IAutoMovieVector3): boolean =>
          ![p.x, p.y, p.z].every(Number.isFinite),
      )
    )
      throw new Error("Skin filter requires one finite triangle");
    const origin: IAutoMovieVector3 = triangleMm[0]!;
    const e: IAutoMovieVector3 = difference(triangleMm[1]!, origin);
    const f: IAutoMovieVector3 = difference(triangleMm[2]!, origin);
    const normal: IAutoMovieVector3 = cross(e, f);
    const edgeLength: number = Math.hypot(e.x, e.y, e.z);
    const areaLength: number = Math.hypot(normal.x, normal.y, normal.z);
    if (edgeLength === 0 || areaLength === 0) return null;
    const t: IAutoMovieVector3 = scale(e, 1 / edgeLength);
    const n: IAutoMovieVector3 = scale(normal, 1 / areaLength);
    const b: IAutoMovieVector3 = cross(n, t);
    const freckleSites: IAutoMovieVector3[] | null = this.sites(
      triangleMm,
      this.freckles_?.density ?? 0,
      this.freckles_?.diameterMm ?? 2,
      40,
      0x13,
    );
    const acneSites: IAutoMovieVector3[] | null = this.sites(
      triangleMm,
      this.acne_?.density ?? 0,
      this.acne_?.diameterMm ?? 3,
      10,
      0x71,
    );
    if (freckleSites === null || acneSites === null) return null;
    const local: (point: IAutoMovieVector3) => IAutoMovieVector3 = (
      point: IAutoMovieVector3,
    ): IAutoMovieVector3 => {
      const d: IAutoMovieVector3 = difference(point, origin);
      return { x: dot(d, t), y: dot(d, b), z: dot(d, n) };
    };
    const fs: IAutoMovieVector3[] = freckleSites.map(local);
    const acneLocal: IAutoMovieVector3[] = acneSites.map(local);
    return (
      polygonMm: readonly IAutoMovieVector3[],
    ): ReturnType<AutoMovieHumanSkinFeatureField["sample"]> => {
      const polygon: [number, number][] = polygonMm.map(
        (point: IAutoMovieVector3): [number, number] => {
          const p: IAutoMovieVector3 = local(point);
          return [p.x, p.y];
        },
      );
      const freckleRadius: number = (this.freckles_?.diameterMm ?? 2) / 2;
      const acneRadius: number = (this.acne_?.diameterMm ?? 3) / 2;
      const freckleCandidates: IAutoMovieVector3[] = intersectingSites(
        fs,
        polygon,
        freckleRadius,
      );
      const acneCandidates: IAutoMovieVector3[] = intersectingSites(
        acneLocal,
        polygon,
        acneRadius,
      );
      const freckles: integrateAutoMovieRadialField.IOutput =
        integrateAutoMovieRadialField({
          polygon,
          sites: freckleCandidates,
          radius: freckleRadius,
          power: 2,
        });
      const acne: integrateAutoMovieRadialField.IOutput =
        integrateAutoMovieRadialField({
          polygon,
          sites: acneCandidates,
          radius: acneRadius,
          power: 2,
        });
      const height: integrateAutoMovieRadialField.IOutput =
        integrateAutoMovieRadialField({
          polygon,
          sites: acneCandidates,
          radius: acneRadius,
          power: 3,
        });
      const inverseArea: number = height.area > 0 ? 1 / height.area : 0;
      const gain: number = 0.25 * (this.acne_?.severity ?? 0) * inverseArea;
      return {
        freckles:
          freckles.integral * inverseArea * (this.freckles_?.contrast ?? 0),
        acne: acne.integral * inverseArea * (this.acne_?.severity ?? 0),
        gradient: {
          x: gain * (height.gradient[0] * t.x + height.gradient[1] * b.x),
          y: gain * (height.gradient[0] * t.y + height.gradient[1] * b.y),
          z: gain * (height.gradient[0] * t.z + height.gradient[1] * b.z),
        },
      };
    };
  }

  /** Coverage and papule height gradient d(height mm)/d(rest position mm). */
  public sample(positionMm: IAutoMovieVector3): {
    freckles: number;
    acne: number;
    gradient: IAutoMovieVector3;
  } {
    const f: ReturnType<AutoMovieHumanSkinFeatureField["spot"]> = this.spot(
      positionMm,
      this.freckles_?.density ?? 0,
      this.freckles_?.diameterMm ?? 2,
      40,
      0x13,
    );
    const a: ReturnType<AutoMovieHumanSkinFeatureField["spot"]> = this.spot(
      positionMm,
      this.acne_?.density ?? 0,
      this.acne_?.diameterMm ?? 3,
      10,
      0x71,
    );
    const severity: number = this.acne_?.severity ?? 0;
    return {
      freckles: f.cover * (this.freckles_?.contrast ?? 0),
      acne: a.cover * severity,
      gradient: {
        x: a.gradient.x * 0.25 * severity,
        y: a.gradient.y * 0.25 * severity,
        z: a.gradient.z * 0.25 * severity,
      },
    };
  }

  /** Compact polynomial spot and its height derivative, retaining the strongest local spot. */
  private spot(
    p: IAutoMovieVector3,
    density: number,
    diameter: number,
    maximumDensity: number,
    salt: number,
  ): {
    cover: number;
    gradient: IAutoMovieVector3;
  } {
    const result: { cover: number; gradient: IAutoMovieVector3 } = {
      cover: 0,
      gradient: { x: 0, y: 0, z: 0 },
    };
    if (density === 0) return result;
    const radius: number = diameter / 2;
    const cell: number = Math.cbrt((200 * radius) / maximumDensity);
    const span: number = Math.ceil(radius / cell);
    const cx: number = Math.floor(p.x / cell);
    const cy: number = Math.floor(p.y / cell);
    const cz: number = Math.floor(p.z / cell);
    for (let z: number = cz - span; z <= cz + span; ++z)
      for (let y: number = cy - span; y <= cy + span; ++y)
        for (let x: number = cx - span; x <= cx + span; ++x) {
          if (
            hash(x, y, z, this.seed_ ^ salt ^ 0xa8ed) >=
            density / maximumDensity
          )
            continue;
          const dx: number =
            p.x - (x + hash(x, y, z, this.seed_ ^ salt)) * cell;
          const dy: number =
            p.y - (y + hash(x, y, z, this.seed_ ^ salt ^ 0x297a)) * cell;
          const dz: number =
            p.z - (z + hash(x, y, z, this.seed_ ^ salt ^ 0x68b3)) * cell;
          const q: number =
            1 - (dx * dx + dy * dy + dz * dz) / (radius * radius);
          if (q <= 0 || q * q <= result.cover) continue;
          result.cover = q * q;
          // Height q³ has a zero derivative at the compact-support boundary.
          const gain: number = (-6 * q * q) / (radius * radius);
          result.gradient = { x: gain * dx, y: gain * dy, z: gain * dz };
        }
    return result;
  }

  /** Same seeded sites as point sampling; bounded triangle preparation never resamples them. */
  private sites(
    triangle: readonly IAutoMovieVector3[],
    density: number,
    diameter: number,
    maximumDensity: number,
    salt: number,
  ): IAutoMovieVector3[] | null {
    if (density === 0) return [];
    const radius: number = diameter / 2;
    const cell: number = Math.cbrt((200 * radius) / maximumDensity);
    const lo: IAutoMovieVector3 = {
      x: Math.floor(
        (Math.min(...triangle.map((p: IAutoMovieVector3): number => p.x)) -
          radius) /
          cell,
      ),
      y: Math.floor(
        (Math.min(...triangle.map((p: IAutoMovieVector3): number => p.y)) -
          radius) /
          cell,
      ),
      z: Math.floor(
        (Math.min(...triangle.map((p: IAutoMovieVector3): number => p.z)) -
          radius) /
          cell,
      ),
    };
    const hi: IAutoMovieVector3 = {
      x: Math.floor(
        (Math.max(...triangle.map((p: IAutoMovieVector3): number => p.x)) +
          radius) /
          cell,
      ),
      y: Math.floor(
        (Math.max(...triangle.map((p: IAutoMovieVector3): number => p.y)) +
          radius) /
          cell,
      ),
      z: Math.floor(
        (Math.max(...triangle.map((p: IAutoMovieVector3): number => p.z)) +
          radius) /
          cell,
      ),
    };
    if ((hi.x - lo.x + 1) * (hi.y - lo.y + 1) * (hi.z - lo.z + 1) > 65536)
      return null;
    const plane: IAutoMovieVector3 = cross(
      difference(triangle[1]!, triangle[0]!),
      difference(triangle[2]!, triangle[0]!),
    );
    const normalLength: number = Math.hypot(plane.x, plane.y, plane.z);
    const result: IAutoMovieVector3[] = [];
    for (let z: number = lo.z; z <= hi.z; ++z)
      for (let y: number = lo.y; y <= hi.y; ++y)
        for (let x: number = lo.x; x <= hi.x; ++x) {
          if (
            hash(x, y, z, this.seed_ ^ salt ^ 0xa8ed) >=
            density / maximumDensity
          )
            continue;
          const candidate: IAutoMovieVector3 = {
            x: (x + hash(x, y, z, this.seed_ ^ salt)) * cell,
            y: (y + hash(x, y, z, this.seed_ ^ salt ^ 0x297a)) * cell,
            z: (z + hash(x, y, z, this.seed_ ^ salt ^ 0x68b3)) * cell,
          };
          // A site's sphere cannot affect this triangle if it misses its plane.
          // Filtering here preserves large, thin planar fixtures without counting
          // irrelevant three-dimensional cells against the retained-site budget.
          if (
            Math.abs(dot(difference(candidate, triangle[0]!), plane)) >=
            radius * normalLength
          )
            continue;
          result.push(candidate);
          if (result.length > 512) return null;
        }
    return result;
  }
}

/** Difference of physical vectors. */
function difference(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): IAutoMovieVector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

/** Euclidean frame dot product. */
function dot(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/** Physical frame cross product. */
function cross(a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/** Scale one vector without changing its input. */
function scale(a: IAutoMovieVector3, factor: number): IAutoMovieVector3 {
  return { x: a.x * factor, y: a.y * factor, z: a.z * factor };
}

/** A sphere whose section misses this polygon's bounds cannot beat any positive local spot. */
function intersectingSites(
  sites: IAutoMovieVector3[],
  polygon: [number, number][],
  radius: number,
): IAutoMovieVector3[] {
  if (polygon.length === 0) return [];
  const loX: number = Math.min(
    ...polygon.map((p: [number, number]): number => p[0]),
  );
  const hiX: number = Math.max(
    ...polygon.map((p: [number, number]): number => p[0]),
  );
  const loY: number = Math.min(
    ...polygon.map((p: [number, number]): number => p[1]),
  );
  const hiY: number = Math.max(
    ...polygon.map((p: [number, number]): number => p[1]),
  );
  return sites.filter((p: IAutoMovieVector3): boolean => {
    const section2: number = radius * radius - p.z * p.z;
    if (section2 <= 0) return false;
    const x: number = Math.max(loX - p.x, 0, p.x - hiX);
    const y: number = Math.max(loY - p.y, 0, p.y - hiY);
    return x * x + y * y < section2;
  });
}

/** Integer-coordinate avalanche hash, reproducible in JavaScript on either side of zero. */
function hash(x: number, y: number, z: number, seed: number): number {
  let h: number =
    Math.imul(x, 0x27d4eb2d) ^
    Math.imul(y, 0x165667b1) ^
    Math.imul(z, 0x1b873593) ^
    seed;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
