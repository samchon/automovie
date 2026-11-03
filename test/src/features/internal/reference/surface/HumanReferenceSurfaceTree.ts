import type { HumanReferenceSurface } from "./HumanReferenceSurface";
import { HumanReferenceSurfaceFlag } from "./HumanReferenceSurfaceFlag";
import { HumanReferenceSurfaceSearch } from "./HumanReferenceSurfaceSearch";

/**
 * Bounding-volume hierarchy over a triangle mesh, answering three exact
 * questions: the nearest point of the mesh to a point, the nearest crossing of
 * a normal line with a triangle facing along it, and whether a half-line
 * leaves the mesh. The hierarchy only orders and prunes the search; every
 * answer is the one a search over all triangles would give.
 *
 * A query reuses fixed-size stacks, so one tree answers one query at a time.
 */
export class HumanReferenceSurfaceTree {
  /**
   * Unit normal of every triangle from its winding, three per triangle. A mesh
   * wound inward has its normals turned, so they face out.
   */
  public readonly normal: Float64Array;

  /** Axis-aligned box of every node: three low then three high coordinates. */
  private readonly box: Float64Array;

  /** First child of every node, the second following it; -1 marks a leaf. */
  private readonly left: Int32Array;

  /** Position in `order` of each node's first triangle. */
  private readonly start: Int32Array;

  /** Triangle count of each node. */
  private readonly count: Int32Array;

  /** Triangle indices, grouped so every node owns a contiguous run. */
  private readonly order: Int32Array;

  /** Nodes still to visit during a query. */
  private readonly stack: Int32Array = new Int32Array(256);

  /** Squared distance to each stacked node's box, for nearest queries. */
  private readonly far: Float64Array = new Float64Array(256);

  /**
   * Builds the hierarchy by median splits on the widest axis of the triangle
   * centres, down to leaves of at most four triangles.
   *
   * @param P Flat vertex positions, mm.
   * @param I Flat triangle vertex indices.
   */
  public constructor(
    private readonly P: Float64Array,
    private readonly I: Uint32Array,
  ) {
    const T: number = I.length / 3;
    this.normal = new Float64Array(3 * T);

    const centre: Float64Array = new Float64Array(3 * T);
    let volume: number = 0;
    for (let t: number = 0; t < T; t++) {
      const a: number = 3 * I[3 * t]!;
      const b: number = 3 * I[3 * t + 1]!;
      const c: number = 3 * I[3 * t + 2]!;
      for (let k: number = 0; k < 3; k++) centre[3 * t + k] = P[a + k]! + P[b + k]! + P[c + k]!;

      const ux: number = P[b]! - P[a]!;
      const uy: number = P[b + 1]! - P[a + 1]!;
      const uz: number = P[b + 2]! - P[a + 2]!;
      const vx: number = P[c]! - P[a]!;
      const vy: number = P[c + 1]! - P[a + 1]!;
      const vz: number = P[c + 2]! - P[a + 2]!;
      const x: number = uy * vz - uz * vy;
      const y: number = uz * vx - ux * vz;
      const z: number = ux * vy - uy * vx;
      const l: number = Math.hypot(x, y, z) || 1;
      this.normal[3 * t] = x / l;
      this.normal[3 * t + 1] = y / l;
      this.normal[3 * t + 2] = z / l;
      volume += P[a]! * x + P[a + 1]! * y + P[a + 2]! * z;
    }

    // A mesh wound inward faces outward once its normals turn.
    if (volume < 0) for (let k: number = 0; k < this.normal.length; k++) this.normal[k] = -this.normal[k]!;

    const capacity: number = 2 * T + 1;
    this.box = new Float64Array(6 * capacity);
    this.left = new Int32Array(capacity).fill(-1);
    this.start = new Int32Array(capacity);
    this.count = new Int32Array(capacity);
    this.order = new Int32Array(T);
    for (let t: number = 0; t < T; t++) this.order[t] = t;

    let nodes: number = 1;
    const pending: number[] = [0, 0, T];
    while (pending.length !== 0) {
      const e: number = pending.pop()!;
      const s: number = pending.pop()!;
      const node: number = pending.pop()!;
      const lo: number[] = [Infinity, Infinity, Infinity];
      const hi: number[] = [-Infinity, -Infinity, -Infinity];
      const clo: number[] = [Infinity, Infinity, Infinity];
      const chi: number[] = [-Infinity, -Infinity, -Infinity];

      for (let k: number = s; k < e; k++) {
        const t: number = this.order[k]!;
        for (let j: number = 0; j < 3; j++) {
          const o: number = 3 * I[3 * t + j]!;
          for (let a: number = 0; a < 3; a++) {
            lo[a] = Math.min(lo[a]!, P[o + a]!);
            hi[a] = Math.max(hi[a]!, P[o + a]!);
          }
        }
        for (let a: number = 0; a < 3; a++) {
          clo[a] = Math.min(clo[a]!, centre[3 * t + a]!);
          chi[a] = Math.max(chi[a]!, centre[3 * t + a]!);
        }
      }

      for (let a: number = 0; a < 3; a++) {
        this.box[6 * node + a] = lo[a]!;
        this.box[6 * node + 3 + a] = hi[a]!;
      }
      this.start[node] = s;
      this.count[node] = e - s;
      if (e - s <= 4) continue;

      // Split the run at its median centre along the widest axis of the centres.
      const axis: number = [0, 1, 2].reduce(
        (m: number, a: number): number => (chi[a]! - clo[a]! > chi[m]! - clo[m]! ? a : m),
        0,
      );
      const mid: number = (s + e) >> 1;
      HumanReferenceSurfaceSearch.select(this.order, centre, axis, s, e, mid);
      this.left[node] = nodes;
      pending.push(nodes, s, mid, nodes + 1, mid, e);
      nodes += 2;
    }
  }

  /**
   * The exact nearest point of the mesh to a point.
   *
   * @param x X of the point, mm.
   * @param y Y of the point, mm.
   * @param z Z of the point, mm.
   * @param out Receives the squared distance, the triangle and the point.
   */
  public nearest(x: number, y: number, z: number, out: HumanReferenceSurface.INearest): void {
    let best: number = Infinity;
    let sp: number = 0;
    this.stack[sp] = 0;
    this.far[sp++] = this.boxDistance(0, x, y, z);
    const q: [number, number, number] = [0, 0, 0];

    while (sp !== 0) {
      const node: number = this.stack[--sp]!;
      if (this.far[sp]! >= best) continue;

      const l: number = this.left[node]!;
      if (l === -1) {
        const s: number = this.start[node]!;
        for (let k: number = s; k < s + this.count[node]!; k++) {
          const t: number = this.order[k]!;
          const d: number = HumanReferenceSurfaceSearch.closest(
            x,
            y,
            z,
            this.P,
            3 * this.I[3 * t]!,
            3 * this.I[3 * t + 1]!,
            3 * this.I[3 * t + 2]!,
            q,
          );
          if (d < best) {
            best = d;
            out.tri = t;
            out.q[0] = q[0];
            out.q[1] = q[1];
            out.q[2] = q[2];
          }
        }
        continue;
      }

      // The nearer child goes on top, so the search tightens its bound early.
      const dl: number = this.boxDistance(l, x, y, z);
      const dr: number = this.boxDistance(l + 1, x, y, z);
      const pair: [number, number, number, number] = dl <= dr ? [l, dl, l + 1, dr] : [l + 1, dr, l, dl];
      if (pair[3] < best) {
        this.stack[sp] = pair[2];
        this.far[sp++] = pair[3];
      }
      if (pair[1] < best) {
        this.stack[sp] = pair[0];
        this.far[sp++] = pair[1];
      }
    }

    out.d2 = best;
  }

  /**
   * The signed parameter of the nearest crossing of the line p + t d, |t| up
   * to the reach, with a triangle facing within 60 degrees of the direction d.
   *
   * @param x X of the line's point, mm.
   * @param y Y of the line's point, mm.
   * @param z Z of the line's point, mm.
   * @param dx X of the unit direction.
   * @param dy Y of the unit direction.
   * @param dz Z of the unit direction.
   * @param reach Largest |t| to consider, mm.
   * @returns The signed t of the nearest crossing, or NaN where there is none.
   */
  public ray(x: number, y: number, z: number, dx: number, dy: number, dz: number, reach: number): number {
    let best: number = reach;
    let found: number = NaN;
    let sp: number = 0;
    this.stack[sp++] = 0;
    const P: Float64Array = this.P;

    while (sp !== 0) {
      const node: number = this.stack[--sp]!;
      if (!this.crosses(node, x, y, z, dx, dy, dz, best)) continue;

      const l: number = this.left[node]!;
      if (l !== -1) {
        this.stack[sp++] = l;
        this.stack[sp++] = l + 1;
        continue;
      }

      const s: number = this.start[node]!;
      for (let k: number = s; k < s + this.count[node]!; k++) {
        const t: number = this.order[k]!;
        if (
          this.normal[3 * t]! * dx + this.normal[3 * t + 1]! * dy + this.normal[3 * t + 2]! * dz <
          HumanReferenceSurfaceFlag.FACING
        )
          continue;

        // Moller-Trumbore: solve the line against the triangle's plane in barycentric coordinates.
        const a: number = 3 * this.I[3 * t]!;
        const b: number = 3 * this.I[3 * t + 1]!;
        const c: number = 3 * this.I[3 * t + 2]!;
        const e1x: number = P[b]! - P[a]!;
        const e1y: number = P[b + 1]! - P[a + 1]!;
        const e1z: number = P[b + 2]! - P[a + 2]!;
        const e2x: number = P[c]! - P[a]!;
        const e2y: number = P[c + 1]! - P[a + 1]!;
        const e2z: number = P[c + 2]! - P[a + 2]!;
        const hx: number = dy * e2z - dz * e2y;
        const hy: number = dz * e2x - dx * e2z;
        const hz: number = dx * e2y - dy * e2x;
        const det: number = e1x * hx + e1y * hy + e1z * hz;
        if (Math.abs(det) < 1e-12) continue;

        const f: number = 1 / det;
        const sx: number = x - P[a]!;
        const sy: number = y - P[a + 1]!;
        const sz: number = z - P[a + 2]!;
        const u: number = f * (sx * hx + sy * hy + sz * hz);
        if (u < -1e-9 || u > 1 + 1e-9) continue;

        const qx: number = sy * e1z - sz * e1y;
        const qy: number = sz * e1x - sx * e1z;
        const qz: number = sx * e1y - sy * e1x;
        const v: number = f * (dx * qx + dy * qy + dz * qz);
        if (v < -1e-9 || u + v > 1 + 1e-9) continue;

        const along: number = f * (e2x * qx + e2y * qy + e2z * qz);
        if (Math.abs(along) <= best) {
          best = Math.abs(along);
          found = along;
        }
      }
    }

    return found;
  }

  /**
   * Whether the half-line p + t d, t > 0, meets no triangle.
   *
   * @param x X of the line's point, mm.
   * @param y Y of the line's point, mm.
   * @param z Z of the line's point, mm.
   * @param dx X of the direction.
   * @param dy Y of the direction.
   * @param dz Z of the direction.
   */
  public escapes(x: number, y: number, z: number, dx: number, dy: number, dz: number): boolean {
    let sp: number = 0;
    this.stack[sp++] = 0;
    const P: Float64Array = this.P;
    if (this.ahead(0, x, y, z, dx, dy, dz) < 0) return true;

    while (sp !== 0) {
      const node: number = this.stack[--sp]!;
      const l: number = this.left[node]!;
      if (l !== -1) {
        // The nearer child goes on top, so a blocked ray meets its blocker early.
        const tl: number = this.ahead(l, x, y, z, dx, dy, dz);
        const tr: number = this.ahead(l + 1, x, y, z, dx, dy, dz);
        if (tl >= 0 && tr >= 0) {
          this.stack[sp++] = tl <= tr ? l + 1 : l;
          this.stack[sp++] = tl <= tr ? l : l + 1;
        } else if (tl >= 0) this.stack[sp++] = l;
        else if (tr >= 0) this.stack[sp++] = l + 1;
        continue;
      }

      const s: number = this.start[node]!;
      for (let k: number = s; k < s + this.count[node]!; k++) {
        const t: number = this.order[k]!;
        const a: number = 3 * this.I[3 * t]!;
        const b: number = 3 * this.I[3 * t + 1]!;
        const c: number = 3 * this.I[3 * t + 2]!;
        const e1x: number = P[b]! - P[a]!;
        const e1y: number = P[b + 1]! - P[a + 1]!;
        const e1z: number = P[b + 2]! - P[a + 2]!;
        const e2x: number = P[c]! - P[a]!;
        const e2y: number = P[c + 1]! - P[a + 1]!;
        const e2z: number = P[c + 2]! - P[a + 2]!;
        const hx: number = dy * e2z - dz * e2y;
        const hy: number = dz * e2x - dx * e2z;
        const hz: number = dx * e2y - dy * e2x;
        const det: number = e1x * hx + e1y * hy + e1z * hz;
        if (Math.abs(det) < 1e-12) continue;

        const f: number = 1 / det;
        const sx: number = x - P[a]!;
        const sy: number = y - P[a + 1]!;
        const sz: number = z - P[a + 2]!;
        const u: number = f * (sx * hx + sy * hy + sz * hz);
        if (u < 0 || u > 1) continue;

        const qx: number = sy * e1z - sz * e1y;
        const qy: number = sz * e1x - sx * e1z;
        const qz: number = sx * e1y - sy * e1x;
        const v: number = f * (dx * qx + dy * qy + dz * qz);
        if (v < 0 || u + v > 1) continue;

        // A crossing closer than 1e-6 mm is the ray's own start surface.
        if (f * (e2x * qx + e2y * qy + e2z * qz) > 1e-6) return false;
      }
    }

    return true;
  }

  /**
   * Where the half-line t > 0 enters a node's box.
   *
   * @param node The node's index.
   * @param x X of the line's point, mm.
   * @param y Y of the line's point, mm.
   * @param z Z of the line's point, mm.
   * @param dx X of the direction.
   * @param dy Y of the direction.
   * @param dz Z of the direction.
   * @returns The entry parameter, or -1 where the half-line misses the box.
   */
  private ahead(node: number, x: number, y: number, z: number, dx: number, dy: number, dz: number): number {
    const b: Float64Array = this.box;
    const o: number = 6 * node;
    let lo: number = 0;
    let hi: number = Infinity;

    for (let a: number = 0; a < 3; a++) {
      const p: number = a === 0 ? x : a === 1 ? y : z;
      const d: number = a === 0 ? dx : a === 1 ? dy : dz;
      if (d === 0) {
        if (p < b[o + a]! || p > b[o + 3 + a]!) return -1;
        continue;
      }

      const t1: number = (b[o + a]! - p) / d;
      const t2: number = (b[o + 3 + a]! - p) / d;
      lo = Math.max(lo, Math.min(t1, t2));
      hi = Math.min(hi, Math.max(t1, t2));
      if (lo > hi) return -1;
    }

    return lo;
  }

  /**
   * Squared distance from a point to a node's box.
   *
   * @param node The node's index.
   * @param x X of the point, mm.
   * @param y Y of the point, mm.
   * @param z Z of the point, mm.
   */
  private boxDistance(node: number, x: number, y: number, z: number): number {
    const b: Float64Array = this.box;
    const o: number = 6 * node;
    const ex: number = Math.max(0, b[o]! - x, x - b[o + 3]!);
    const ey: number = Math.max(0, b[o + 1]! - y, y - b[o + 4]!);
    const ez: number = Math.max(0, b[o + 2]! - z, z - b[o + 5]!);

    return ex * ex + ey * ey + ez * ez;
  }

  /**
   * Whether the line's stretch |t| up to the reach meets a node's box.
   *
   * @param node The node's index.
   * @param x X of the line's point, mm.
   * @param y Y of the line's point, mm.
   * @param z Z of the line's point, mm.
   * @param dx X of the direction.
   * @param dy Y of the direction.
   * @param dz Z of the direction.
   * @param reach Largest |t|, mm.
   */
  private crosses(
    node: number,
    x: number,
    y: number,
    z: number,
    dx: number,
    dy: number,
    dz: number,
    reach: number,
  ): boolean {
    const b: Float64Array = this.box;
    const o: number = 6 * node;
    let lo: number = -reach - 1e-9;
    let hi: number = reach + 1e-9;

    for (let a: number = 0; a < 3; a++) {
      const p: number = a === 0 ? x : a === 1 ? y : z;
      const d: number = a === 0 ? dx : a === 1 ? dy : dz;
      if (d === 0) {
        if (p < b[o + a]! || p > b[o + 3 + a]!) return false;
        continue;
      }

      const t1: number = (b[o + a]! - p) / d;
      const t2: number = (b[o + 3 + a]! - p) / d;
      lo = Math.max(lo, Math.min(t1, t2));
      hi = Math.min(hi, Math.max(t1, t2));
      if (lo > hi) return false;
    }

    return true;
  }
}
