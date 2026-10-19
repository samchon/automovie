import { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";

import { AUTOMOVIE_HUMAN_UV_LAYOUT } from "../junction/AUTOMOVIE_HUMAN_UV_LAYOUT";
import { AutoMovieHumanUvLayout } from "../junction/AutoMovieHumanUvLayout";

/**
 * The head's generated skin as a surface hair, brows and lashes are placed on: looked up by the head chart's semantic coordinates, or hit by a ray.
 *
 * Explicit generated triangle addresses, when supplied, own chart membership
 * independently of UV packing. Otherwise the legacy published head rectangle
 * is inverted. Both paths read actual emitted skin positions and normals.
 * Addresses are `u` from chart bottom to vertex and `v` a turn from the anterior
 * midline. Positions are millimetres in the model frame at rest. Missing exact
 * generated chart coverage remains missing rather than using a spherical guess.
 *
 * @author Samchon
 */
export class AutoMovieHumanHeadSurface {
  private readonly positions_: number[];
  private readonly normals_: number[];
  private readonly charts_: number[];
  private readonly triangles_: number[];
  private readonly buckets_: number[][];

  /**
   * Gather the head's triangles from the emitted skin parts.
   *
   * @param parts The skin parts, in metres, each a mesh with texture coordinates; other parts are skipped
   * @throws {Error} When no triangle lies on the head's chart
   */
  public constructor(parts: readonly IAutoMovieModelPart[], addresses?: {
    /** Turn at the semantic chart cut; independent of packed texture layout. */
    seam: number;
    /** Per-part actual triangle [v-seam,u] corner pairs; null excludes a non-head triangle. */
    triangles: ReadonlyMap<string, readonly (readonly number[] | null)[]>;
  }) {
    if (addresses !== undefined && !Number.isFinite(addresses.seam))
      throw new Error("Finite generated head-chart seam required");
    const chart: AutoMovieHumanUvLayout.IChart =
      AUTOMOVIE_HUMAN_UV_LAYOUT.charts.find(
        (c: AutoMovieHumanUvLayout.IChart): boolean => c.part === "head",
      )!;
    this.positions_ = [];
    this.normals_ = [];
    this.charts_ = [];
    this.triangles_ = [];
    for (const part of parts) {
      if (part.geometry.type !== "mesh") continue;
      const mesh: IAutoMovieMesh = part.geometry.mesh;
      const supplied: readonly (readonly number[] | null)[] | undefined =
        addresses?.triangles.get(part.id);
      if (addresses !== undefined && supplied === undefined) continue;
      if ((addresses === undefined && mesh.uvs === null) || mesh.normals === null || mesh.indices === null)
        continue;
      if (supplied !== undefined && supplied.length * 3 !== mesh.indices.length)
        throw new Error("Head chart ownership must match actual triangle order");
      const local: Map<string, number> = new Map();
      const take: (i: number, x: number, y: number) => number = (
        i: number, x: number, y: number,
      ): number => {
        const key: string = JSON.stringify([i,x,y]);
        let found: number | undefined = local.get(key);
        if (found === undefined) {
          found = this.positions_.length / 3;
          local.set(key, found);
          for (let k: number = 0; k < 3; ++k) {
            this.positions_.push(mesh.positions[3 * i + k]! * 1000);
            this.normals_.push(mesh.normals![3 * i + k]!);
          }
          this.charts_.push(x, y);
        }
        return found;
      };
      for (let t: number = 0; t < mesh.indices.length; t += 3) {
        const corners: number[] = [
          mesh.indices[t]!,
          mesh.indices[t + 1]!,
          mesh.indices[t + 2]!,
        ];
        const explicit: readonly number[] | null | undefined = supplied?.[t / 3];
        if (supplied !== undefined && explicit === null) continue;
        if (supplied !== undefined &&
            (explicit === undefined || explicit.length !== 6 || !explicit.every(Number.isFinite)))
          throw new Error("Six finite actual head-chart corner values required");
        const inside: boolean = supplied !== undefined || corners.every((i: number): boolean => {
          const x: number = mesh.uvs![2 * i]!;
          const y: number = mesh.uvs![2 * i + 1]!;
          return (
            x >= chart.x - 1e-9 &&
            x <= chart.x + chart.width + 1e-9 &&
            y >= chart.y - 1e-9 &&
            y <= chart.y + chart.height + 1e-9
          );
        });
        if (inside) {
          const a: number[] = mesh.positions.slice(
            3 * corners[0]!,
            3 * corners[0]! + 3,
          );
          const b: number[] = mesh.positions.slice(
            3 * corners[1]!,
            3 * corners[1]! + 3,
          );
          const c: number[] = mesh.positions.slice(
            3 * corners[2]!,
            3 * corners[2]! + 3,
          );
          const area: number[] = cross(
            b.map((v: number, k: number): number => v - a[k]!),
            c.map((v: number, k: number): number => v - a[k]!),
          );
          // An exactly collapsed source triangle has no surface point. Keep
          // at() consistent with ray casting; no size threshold excludes skin.
          if (area.some((v: number): boolean => v !== 0))
            this.triangles_.push(...corners.map((index: number, k: number): number => take(
              index,
              explicit?.[2*k] ?? (mesh.uvs![2*index]!-chart.x)/chart.width,
              explicit?.[2*k+1] ?? (mesh.uvs![2*index+1]!-chart.y)/chart.height,
            )));
        }
      }
    }
    if (this.triangles_.length === 0)
      throw new Error("the skin has no triangle on the head's chart");
    this.buckets_ = Array.from({ length: GRID * GRID }, (): number[] => []);
    for (let t: number = 0; t < this.triangles_.length; t += 3) {
      const xs: number[] = [0, 1, 2].map(
        (k: number): number => this.charts_[2 * this.triangles_[t + k]!]!,
      );
      const ys: number[] = [0, 1, 2].map(
        (k: number): number => this.charts_[2 * this.triangles_[t + k]! + 1]!,
      );
      const [x0, x1]: [number, number] = [
        cell(Math.min(...xs)),
        cell(Math.max(...xs)),
      ];
      const [y0, y1]: [number, number] = [
        cell(Math.min(...ys)),
        cell(Math.max(...ys)),
      ];
      for (let y: number = y0; y <= y1; ++y)
        for (let x: number = x0; x <= x1; ++x)
          this.buckets_[y * GRID + x]!.push(t);
    }
    this.seam_ = addresses?.seam ?? chart.seam;
    this.canonicalFallback_ = addresses === undefined;
  }

  private readonly seam_: number;
  private readonly canonicalFallback_: boolean;

  /**
   * The surface point at a head chart address.
   *
   * @param u Along the chart, 0 at its bottom and 1 at the vertex
   * @param v Turn counterclockwise about the vertical from the anterior midline, any real number taken modulo one
   * @returns Position in millimetres and unit normal, or null when no head triangle covers the address, such as inside an opening
   */
  public at(u: number, v: number): AutoMovieHumanHeadSurface.IPoint | null {
    const x: number = (((v - this.seam_) % 1) + 1) % 1;
    const y: number = u;
    for (const t of this.buckets_[cell(y) * GRID + cell(x)]!) {
      const w: [number, number, number] | null = barycentric(
        this.charts_,
        this.triangles_,
        t,
        x,
        y,
      );
      if (w !== null) return this.blend(t, w);
    }
    return null;
  }

  /**
   * The surface point at a head chart address, falling back to the chart's canonical direction where the lookup finds no triangle.
   *
   * The head's chart is the elevation and turn of each control point's canonical direction, so near the poles, where the chart pinches and its triangles degenerate, the address is found by casting from a centre inside the head along that direction instead.
   *
   * @param centre A point inside the head, millimetres
   * @param u Along the chart, 0 at its bottom and 1 at the vertex
   * @param v Turn counterclockwise about the vertical from the anterior midline
   * @returns The point, or null when neither finds the surface
   */
  public toward(
    centre: readonly number[],
    u: number,
    v: number,
  ): AutoMovieHumanHeadSurface.IPoint | null {
    const found: AutoMovieHumanHeadSurface.IPoint | null = this.at(u, v);
    if (found !== null) return found;
    if (!this.canonicalFallback_) return null;
    const latitude: number = Math.PI * (u - 0.5);
    const turn: number = 2 * Math.PI * v;
    return this.cast(
      [centre[0]!, centre[1]!, centre[2]!],
      [
        Math.cos(latitude) * Math.sin(turn),
        Math.sin(latitude),
        Math.cos(latitude) * Math.cos(turn),
      ],
    );
  }

  /**
   * The nearest point where a ray meets the head's surface, from either side.
   *
   * @param origin Ray origin, millimetres
   * @param direction Ray direction, not necessarily unit
   * @returns The hit with its distance along the direction's unit length, or null when the ray misses
   */
  public cast(
    origin: readonly [number, number, number],
    direction: readonly [number, number, number],
  ): AutoMovieHumanHeadSurface.IHit | null {
    const length: number = Math.hypot(direction[0], direction[1], direction[2]);
    const d: number[] = direction.map((c: number): number => c / length);
    let best: AutoMovieHumanHeadSurface.IHit | null = null;
    const p: number[] = this.positions_;
    for (let t: number = 0; t < this.triangles_.length; t += 3) {
      const a: number = 3 * this.triangles_[t]!;
      const b: number = 3 * this.triangles_[t + 1]!;
      const c: number = 3 * this.triangles_[t + 2]!;
      const e1: number[] = [
        p[b]! - p[a]!,
        p[b + 1]! - p[a + 1]!,
        p[b + 2]! - p[a + 2]!,
      ];
      const e2: number[] = [
        p[c]! - p[a]!,
        p[c + 1]! - p[a + 1]!,
        p[c + 2]! - p[a + 2]!,
      ];
      const h: number[] = cross(d, e2);
      const det: number = dot(e1, h);
      if (Math.abs(det) < 1e-12) continue;
      const s: number[] = [
        origin[0] - p[a]!,
        origin[1] - p[a + 1]!,
        origin[2] - p[a + 2]!,
      ];
      const wu: number = dot(s, h) / det;
      if (wu < 0 || wu > 1) continue;
      const q: number[] = cross(s, e1);
      const wv: number = dot(d, q) / det;
      if (wv < 0 || wu + wv > 1) continue;
      const distance: number = dot(e2, q) / det;
      if (distance <= 0 || (best !== null && distance >= best.distance))
        continue;
      best = { ...this.blend(t, [1 - wu - wv, wu, wv]), distance };
    }
    return best;
  }

  /**
   * The skin's distance from a centre in every direction, for keeping hair off the skin.
   *
   * Every surface point is binned by its direction from the centre on a latitude-longitude grid of 5 degree cells, keeping the farthest, so the lookup costs nothing per query; a direction whose cell holds no point, such as down the neck, reads zero.
   *
   * @param centre A point inside the head, millimetres
   * @returns Radius in millimetres along a unit direction, interpolated between cells, or zero where the head has no surface
   */
  public radii(
    centre: readonly number[],
  ): (direction: readonly number[]) => number {
    const rows: number = 36;
    const cols: number = 72;
    const table: Float64Array = new Float64Array(rows * cols);
    const p: number[] = this.positions_;
    for (let i: number = 0; i < p.length; i += 3) {
      const d: number[] = [
        p[i]! - centre[0]!,
        p[i + 1]! - centre[1]!,
        p[i + 2]! - centre[2]!,
      ];
      const r: number = Math.hypot(d[0]!, d[1]!, d[2]!);
      const [y, x]: [number, number] = cellOf(d, r, rows, cols);
      const at: number =
        Math.min(rows - 1, Math.floor(y)) * cols + (Math.floor(x) % cols);
      table[at] = Math.max(table[at]!, r);
    }
    return (direction: readonly number[]): number => {
      const [y, x]: [number, number] = cellOf(direction, 1, rows, cols);
      const i0: number = Math.max(0, Math.min(rows - 2, Math.floor(y - 0.5)));
      const j0: number = ((Math.floor(x - 0.5) % cols) + cols) % cols;
      const j1: number = (j0 + 1) % cols;
      const fy: number = Math.max(0, Math.min(1, y - 0.5 - i0));
      const fx: number = x - 0.5 - Math.floor(x - 0.5);
      const v: (i: number, j: number) => number = (
        i: number,
        j: number,
      ): number => table[i * cols + j]!;
      const corners: number[] = [
        v(i0, j0),
        v(i0, j1),
        v(i0 + 1, j0),
        v(i0 + 1, j1),
      ];
      if (corners.some((c: number): boolean => c === 0))
        return Math.max(...corners);
      return (
        (corners[0]! * (1 - fx) + corners[1]! * fx) * (1 - fy) +
        (corners[2]! * (1 - fx) + corners[3]! * fx) * fy
      );
    };
  }

  /** Interpolate a triangle's corners by barycentric weights. */
  private blend(
    t: number,
    w: [number, number, number],
  ): AutoMovieHumanHeadSurface.IPoint {
    const position: [number, number, number] = [0, 0, 0];
    const normal: [number, number, number] = [0, 0, 0];
    for (let k: number = 0; k < 3; ++k) {
      const i: number = this.triangles_[t + k]!;
      for (let c: number = 0; c < 3; ++c) {
        position[c] += w[k]! * this.positions_[3 * i + c]!;
        normal[c] += w[k]! * this.normals_[3 * i + c]!;
      }
    }
    const n: number = Math.hypot(...normal);
    return { position, normal: [normal[0] / n, normal[1] / n, normal[2] / n] };
  }
}
/**
 * Types and constants of {@link AutoMovieHumanHeadSurface}.
 */
export namespace AutoMovieHumanHeadSurface {
  /**
   * A point on the head's surface.
   *
   * @author Samchon
   */
  export interface IPoint {
    /** Position, millimetres, model frame at rest. */
    position: [number, number, number];

    /** Outward unit normal, interpolated from the surface's limit normals. */
    normal: [number, number, number];
  }

  /**
   * A ray's hit on the head's surface.
   *
   * @author Samchon
   */
  export interface IHit extends IPoint {
    /** Distance from the ray's origin, millimetres. */
    distance: number;
  }
}

/** Fractional latitude row and longitude column of a direction of the given length. */
function cellOf(
  d: readonly number[],
  length: number,
  rows: number,
  cols: number,
): [number, number] {
  const lat: number = Math.asin(Math.max(-1, Math.min(1, d[1]! / length)));
  const lon: number = (Math.atan2(d[0]!, d[2]!) + 2 * Math.PI) % (2 * Math.PI);
  return [((lat + Math.PI / 2) / Math.PI) * rows, (lon / (2 * Math.PI)) * cols];
}

/** Cells per side of the chart lookup grid. */
const GRID: number = 64;

/** Grid cell of a chart coordinate in `[0, 1]`. */
function cell(x: number): number {
  return Math.min(GRID - 1, Math.max(0, Math.floor(x * GRID)));
}

/** Barycentric weights of a chart point in a triangle, or null outside it. */
function barycentric(
  charts: number[],
  triangles: number[],
  t: number,
  x: number,
  y: number,
): [number, number, number] | null {
  const [a, b, c]: [number, number, number] = [
    triangles[t]!,
    triangles[t + 1]!,
    triangles[t + 2]!,
  ];
  const ax: number = charts[2 * a]!;
  const ay: number = charts[2 * a + 1]!;
  const v0x: number = charts[2 * b]! - ax;
  const v0y: number = charts[2 * b + 1]! - ay;
  const v1x: number = charts[2 * c]! - ax;
  const v1y: number = charts[2 * c + 1]! - ay;
  const det: number = v0x * v1y - v1x * v0y;
  if (Math.abs(det) < 1e-14) return null;
  const px: number = x - ax;
  const py: number = y - ay;
  const wb: number = (px * v1y - v1x * py) / det;
  const wc: number = (v0x * py - px * v0y) / det;
  const eps: number = -1e-9;
  if (wb < eps || wc < eps || wb + wc > 1 - eps) return null;
  return [1 - wb - wc, wb, wc];
}

function cross(a: number[], b: number[]): number[] {
  return [
    a[1]! * b[2]! - a[2]! * b[1]!,
    a[2]! * b[0]! - a[0]! * b[2]!,
    a[0]! * b[1]! - a[1]! * b[0]!,
  ];
}

function dot(a: number[], b: number[]): number {
  return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
}
