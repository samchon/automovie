import { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";

import { AUTOMOVIE_HUMAN_UV_LAYOUT } from "../junction/AUTOMOVIE_HUMAN_UV_LAYOUT";
import { AutoMovieHumanUvLayout } from "../junction/AutoMovieHumanUvLayout";

/**
 * The head's generated skin as a surface hair, brows and lashes are placed on: looked up by the head chart's semantic coordinates, or hit by a ray.
 *
 * The surface is read back from the emitted skin, whatever its assembly, rather than from the head generator: every triangle whose texture coordinates lie in the head's rectangle of the published UV layout is the head's, and the layout is a fixed function of each corner's semantic address, so inverting it returns the chart coordinates `u` (from the bottom of the head's chart to the vertex) and `v` (a turn counterclockwise about the vertical from the anterior midline). Placement therefore follows whatever form the head generator gives the person, and needs no index of any vertex. Positions are millimetres in the model frame at rest.
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
  public constructor(parts: readonly IAutoMovieModelPart[]) {
    const chart: AutoMovieHumanUvLayout.IChart = AUTOMOVIE_HUMAN_UV_LAYOUT.charts.find(
      (c: AutoMovieHumanUvLayout.IChart): boolean => c.part === "head",
    )!;
    this.positions_ = [];
    this.normals_ = [];
    this.charts_ = [];
    this.triangles_ = [];
    for (const part of parts) {
      if (part.geometry.type !== "mesh") continue;
      const mesh: IAutoMovieMesh = part.geometry.mesh;
      if (mesh.uvs === null || mesh.normals === null || mesh.indices === null) continue;
      const local: Map<number, number> = new Map();
      const take = (i: number): number => {
        let found: number | undefined = local.get(i);
        if (found === undefined) {
          found = this.positions_.length / 3;
          local.set(i, found);
          for (let k: number = 0; k < 3; ++k) {
            this.positions_.push(mesh.positions[3 * i + k]! * 1000);
            this.normals_.push(mesh.normals![3 * i + k]!);
          }
          this.charts_.push(
            (mesh.uvs![2 * i]! - chart.x) / chart.width,
            (mesh.uvs![2 * i + 1]! - chart.y) / chart.height,
          );
        }
        return found;
      };
      for (let t: number = 0; t < mesh.indices.length; t += 3) {
        const corners: number[] = [mesh.indices[t]!, mesh.indices[t + 1]!, mesh.indices[t + 2]!];
        const inside: boolean = corners.every((i: number): boolean => {
          const x: number = mesh.uvs![2 * i]!;
          const y: number = mesh.uvs![2 * i + 1]!;
          return x >= chart.x - 1e-9 && x <= chart.x + chart.width + 1e-9 && y >= chart.y - 1e-9 && y <= chart.y + chart.height + 1e-9;
        });
        if (inside) this.triangles_.push(...corners.map(take));
      }
    }
    if (this.triangles_.length === 0) throw new Error("the skin has no triangle on the head's chart");
    this.buckets_ = Array.from({ length: GRID * GRID }, (): number[] => []);
    for (let t: number = 0; t < this.triangles_.length; t += 3) {
      const xs: number[] = [0, 1, 2].map((k: number): number => this.charts_[2 * this.triangles_[t + k]!]!);
      const ys: number[] = [0, 1, 2].map((k: number): number => this.charts_[2 * this.triangles_[t + k]! + 1]!);
      const [x0, x1] = [cell(Math.min(...xs)), cell(Math.max(...xs))];
      const [y0, y1] = [cell(Math.min(...ys)), cell(Math.max(...ys))];
      for (let y: number = y0; y <= y1; ++y) for (let x: number = x0; x <= x1; ++x) this.buckets_[y * GRID + x]!.push(t);
    }
    this.seam_ = chart.seam;
  }

  private readonly seam_: number;

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
      const w: [number, number, number] | null = barycentric(this.charts_, this.triangles_, t, x, y);
      if (w !== null) return this.blend(t, w);
    }
    return null;
  }

  /**
   * The nearest point where a ray meets the head's surface, from either side.
   *
   * @param origin Ray origin, millimetres
   * @param direction Ray direction, not necessarily unit
   * @returns The hit with its distance along the direction's unit length, or null when the ray misses
   */
  public cast(origin: readonly [number, number, number], direction: readonly [number, number, number]): AutoMovieHumanHeadSurface.IHit | null {
    const length: number = Math.hypot(direction[0], direction[1], direction[2]);
    const d: number[] = direction.map((c: number): number => c / length);
    let best: AutoMovieHumanHeadSurface.IHit | null = null;
    const p: number[] = this.positions_;
    for (let t: number = 0; t < this.triangles_.length; t += 3) {
      const a: number = 3 * this.triangles_[t]!;
      const b: number = 3 * this.triangles_[t + 1]!;
      const c: number = 3 * this.triangles_[t + 2]!;
      const e1: number[] = [p[b]! - p[a]!, p[b + 1]! - p[a + 1]!, p[b + 2]! - p[a + 2]!];
      const e2: number[] = [p[c]! - p[a]!, p[c + 1]! - p[a + 1]!, p[c + 2]! - p[a + 2]!];
      const h: number[] = cross(d, e2);
      const det: number = dot(e1, h);
      if (Math.abs(det) < 1e-12) continue;
      const s: number[] = [origin[0] - p[a]!, origin[1] - p[a + 1]!, origin[2] - p[a + 2]!];
      const wu: number = dot(s, h) / det;
      if (wu < 0 || wu > 1) continue;
      const q: number[] = cross(s, e1);
      const wv: number = dot(d, q) / det;
      if (wv < 0 || wu + wv > 1) continue;
      const distance: number = dot(e2, q) / det;
      if (distance <= 0 || (best !== null && distance >= best.distance)) continue;
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
  public radii(centre: readonly number[]): (direction: readonly number[]) => number {
    const rows: number = 36;
    const cols: number = 72;
    const table: Float64Array = new Float64Array(rows * cols);
    const p: number[] = this.positions_;
    for (let i: number = 0; i < p.length; i += 3) {
      const d: number[] = [p[i]! - centre[0]!, p[i + 1]! - centre[1]!, p[i + 2]! - centre[2]!];
      const r: number = Math.hypot(d[0]!, d[1]!, d[2]!);
      const [y, x] = cellOf(d, r, rows, cols);
      const at: number = Math.min(rows - 1, Math.floor(y)) * cols + (Math.floor(x) % cols);
      table[at] = Math.max(table[at]!, r);
    }
    return (direction: readonly number[]): number => {
      const [y, x] = cellOf(direction, 1, rows, cols);
      const i0: number = Math.max(0, Math.min(rows - 2, Math.floor(y - 0.5)));
      const j0: number = ((Math.floor(x - 0.5) % cols) + cols) % cols;
      const j1: number = (j0 + 1) % cols;
      const fy: number = Math.max(0, Math.min(1, y - 0.5 - i0));
      const fx: number = x - 0.5 - Math.floor(x - 0.5);
      const v = (i: number, j: number): number => table[i * cols + j]!;
      const corners: number[] = [v(i0, j0), v(i0, j1), v(i0 + 1, j0), v(i0 + 1, j1)];
      if (corners.some((c: number): boolean => c === 0)) return Math.max(...corners);
      return (corners[0]! * (1 - fx) + corners[1]! * fx) * (1 - fy) + (corners[2]! * (1 - fx) + corners[3]! * fx) * fy;
    };
  }

  /** Interpolate a triangle's corners by barycentric weights. */
  private blend(t: number, w: [number, number, number]): AutoMovieHumanHeadSurface.IPoint {
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
function cellOf(d: readonly number[], length: number, rows: number, cols: number): [number, number] {
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
function barycentric(charts: number[], triangles: number[], t: number, x: number, y: number): [number, number, number] | null {
  const [a, b, c] = [triangles[t]!, triangles[t + 1]!, triangles[t + 2]!];
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
  return [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
}

function dot(a: number[], b: number[]): number {
  return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
}
