import { HumanAnatomy } from "./HumanAnatomy";
import type { HumanLayerPlane } from "./HumanLayerPlane";
import { HumanLayerTriangle } from "./HumanLayerTriangle";

type V3 = HumanAnatomy.V3;

const A: typeof HumanAnatomy = HumanAnatomy;

/** A mesh edge as `[lower vertex, upper vertex, position from lower to upper]`. */
type Edge = [number, number, number];

/** One triangle's piece of a plane section, between two of its edges. */
interface ISegment {
  /** Start, mm. */
  from: V3;

  /** End, mm. */
  to: V3;

  /** Key of the start's edge. */
  fromKey: number;

  /** Key of the end's edge. */
  toKey: number;

  /** The start's edge. */
  fromEdge: Edge;

  /** The end's edge. */
  toEdge: Edge;

  /** The triangle. */
  triangle: number;
}

/**
 * Triangle buckets of a mesh for plane sections and nearest-point queries.
 *
 * It reads positions and triangles only: the generated skin, a reference body
 * or a made copy of either are cut and measured alike.
 */
export class HumanLayerIndex {
  /** Flat positions, mm. */
  public readonly P: Float64Array;

  /** Flat triangle indices. */
  public readonly I: Uint32Array;

  /** Bucket size, mm. */
  private readonly cell: number;

  /** Triangles by bucket key. */
  private readonly cells: Map<number, number[]> = new Map();

  /** The query that last visited each triangle, so a triangle in several buckets is read once. */
  private readonly stamp: Uint32Array;

  /** The current query's number. */
  private tick: number = 0;

  /** Vertices on an open border, computed on first use. */
  private borderVertex: Uint8Array | null = null;

  /** Edge keys on an open border, computed on first use. */
  private borderEdges: Set<number> | null = null;

  /** Triangle centroids, computed on first use. */
  private centres: Float64Array | null = null;

  /**
   * @param P Flat positions, mm.
   * @param I Flat triangle indices.
   * @param cell Bucket size, mm.
   */
  public constructor(P: Float64Array, I: Uint32Array, cell: number = 20) {
    this.P = P;
    this.I = I;
    this.cell = cell;
    this.stamp = new Uint32Array(I.length / 3);

    for (let t: number = 0; t < I.length / 3; t++) {
      const lo: number[] = [0, 1, 2].map((k: number): number =>
        Math.floor(Math.min(P[3 * I[3 * t]! + k]!, P[3 * I[3 * t + 1]! + k]!, P[3 * I[3 * t + 2]! + k]!) / cell),
      );
      const hi: number[] = [0, 1, 2].map((k: number): number =>
        Math.floor(Math.max(P[3 * I[3 * t]! + k]!, P[3 * I[3 * t + 1]! + k]!, P[3 * I[3 * t + 2]! + k]!) / cell),
      );

      for (let i: number = lo[0]!; i <= hi[0]!; i++)
        for (let j: number = lo[1]!; j <= hi[1]!; j++)
          for (let k: number = lo[2]!; k <= hi[2]!; k++) {
            const key: number = bucket(i, j, k);
            const list: number[] | undefined = this.cells.get(key);

            if (list === undefined) this.cells.set(key, [t]);
            else list.push(t);
          }
    }
  }

  /**
   * Triangles with a bucket meeting the cube round a ball and, when given, a plane.
   *
   * @param centre Centre of the ball, mm.
   * @param radius Radius of the ball, mm.
   * @param plane A plane the buckets must also meet.
   */
  public gather(centre: V3, radius: number, plane?: HumanLayerPlane.IPlane): number[] {
    this.tick++;

    const out: number[] = [];
    const c: number = this.cell;
    const lo: number[] = centre.map((x: number): number => Math.floor((x - radius) / c));
    const hi: number[] = centre.map((x: number): number => Math.floor((x + radius) / c));
    const half: number = (c * Math.sqrt(3)) / 2;

    for (let i: number = lo[0]!; i <= hi[0]!; i++)
      for (let j: number = lo[1]!; j <= hi[1]!; j++)
        for (let k: number = lo[2]!; k <= hi[2]!; k++) {
          if (plane !== undefined) {
            const d: number =
              ((i + 0.5) * c - plane.origin[0]) * plane.normal[0] +
              ((j + 0.5) * c - plane.origin[1]) * plane.normal[1] +
              ((k + 0.5) * c - plane.origin[2]) * plane.normal[2];

            if (Math.abs(d) > half) continue;
          }

          const list: number[] | undefined = this.cells.get(bucket(i, j, k));

          if (list === undefined) continue;

          for (const t of list) {
            if (this.stamp[t] === this.tick) continue;
            this.stamp[t] = this.tick;
            out.push(t);
          }
        }

    return out;
  }

  /**
   * The section of the mesh by a plane within a ball, as loops.
   *
   * Each crossing triangle gives one segment between two of its edges,
   * oriented by the triangle's winding; segments meeting at an edge join. A
   * loop the ball or a mesh border cuts is open.
   *
   * @param plane The cutting plane.
   * @param centre Centre of the ball, mm.
   * @param radius Radius of the ball, mm.
   */
  public slice(plane: HumanLayerPlane.IPlane, centre: V3, radius: number): HumanLayerIndex.ILoop[] {
    return this.join(this.crossings(plane, centre, radius));
  }

  /**
   * The nearest point of the mesh to a point within a reach, over the
   * triangles a filter accepts.
   *
   * @param p The point, mm.
   * @param reach Furthest distance searched, mm.
   * @param accept Triangles to consider; all when absent.
   * @returns The nearest hit, or null when none lies within the reach.
   */
  public nearest(p: V3, reach: number, accept?: (t: number) => boolean): HumanLayerIndex.INearest | null {
    const P: Float64Array = this.P;
    const I: Uint32Array = this.I;
    const c: number = this.cell;
    let bestD2: number = reach * reach;
    let bestT: number = -1;
    let feature: number = 6;

    this.tick++;

    for (let i: number = Math.floor((p[0] - reach) / c); i <= Math.floor((p[0] + reach) / c); i++)
      for (let j: number = Math.floor((p[1] - reach) / c); j <= Math.floor((p[1] + reach) / c); j++)
        for (let k: number = Math.floor((p[2] - reach) / c); k <= Math.floor((p[2] + reach) / c); k++) {
          const list: number[] | undefined = this.cells.get(bucket(i, j, k));

          if (list === undefined) continue;

          for (const t of list) {
            if (this.stamp[t] === this.tick) continue;
            this.stamp[t] = this.tick;

            if (accept !== undefined && !accept(t)) continue;

            const d2: number = HumanLayerTriangle.closest(p, P, 3 * I[3 * t]!, 3 * I[3 * t + 1]!, 3 * I[3 * t + 2]!, SCRATCH);

            if (d2 >= bestD2) continue;
            bestD2 = d2;
            bestT = t;
            feature = SCRATCH[3]!;
            NEAREST[0] = SCRATCH[0]!;
            NEAREST[1] = SCRATCH[1]!;
            NEAREST[2] = SCRATCH[2]!;
          }
        }

    if (bestT < 0) return null;

    const corners: number[] = [I[3 * bestT]!, I[3 * bestT + 1]!, I[3 * bestT + 2]!];
    const a: V3 = this.point(corners[0]!);
    const normal: V3 = A.cross(A.sub(this.point(corners[1]!), a), A.sub(this.point(corners[2]!), a));
    const point: V3 = [NEAREST[0]!, NEAREST[1]!, NEAREST[2]!];
    const distance: number = Math.sqrt(bestD2);

    return {
      distance,
      signed: A.dot(A.sub(p, point), normal) < 0 ? -distance : distance,
      triangle: bestT,
      point,
      border: this.onBorder(corners, feature),
    };
  }

  /** Each triangle's centroid, flat, computed once. */
  public centroids(): Float64Array {
    if (this.centres !== null) return this.centres;

    const out: Float64Array = new Float64Array(this.I.length);

    for (let t: number = 0; t < this.I.length; t += 3)
      for (let k: number = 0; k < 3; k++)
        out[t + k] = (this.P[3 * this.I[t]! + k]! + this.P[3 * this.I[t + 1]! + k]! + this.P[3 * this.I[t + 2]! + k]!) / 3;

    this.centres = out;

    return out;
  }

  /** A vertex position. */
  private point(v: number): V3 {
    return [this.P[3 * v]!, this.P[3 * v + 1]!, this.P[3 * v + 2]!];
  }

  /**
   * Every crossing triangle's segment of the section.
   *
   * In winding order the cut enters a triangle on the edge running from below
   * the plane to above and leaves on the edge running back. The neighbour
   * across an edge runs it the other way, so its entry is this triangle's exit
   * and the segments chain however short they are.
   */
  private crossings(plane: HumanLayerPlane.IPlane, centre: V3, radius: number): ISegment[] {
    const P: Float64Array = this.P;
    const I: Uint32Array = this.I;
    const n: number = P.length / 3;
    const out: ISegment[] = [];

    for (const t of this.gather(centre, radius, plane)) {
      const v: number[] = [I[3 * t]!, I[3 * t + 1]!, I[3 * t + 2]!];
      const d: number[] = v.map(
        (x: number): number =>
          (P[3 * x]! - plane.origin[0]) * plane.normal[0] +
          (P[3 * x + 1]! - plane.origin[1]) * plane.normal[1] +
          (P[3 * x + 2]! - plane.origin[2]) * plane.normal[2],
      );
      const up: boolean[] = d.map((x: number): boolean => x >= 0);

      if (up[0] === up[1] && up[1] === up[2]) continue;

      const ends: V3[] = [];
      const keys: number[] = [];
      const edges: Edge[] = [];

      for (const want of [false, true]) {
        let e: number = 0;

        while (e < 3 && !(up[e] === want && up[(e + 1) % 3] !== want)) e++;

        const j: number = (e + 1) % 3;
        const s: number = d[e]! / (d[e]! - d[j]!);
        const va: number = v[e]!;
        const vb: number = v[j]!;

        ends.push([
          P[3 * va]! + (P[3 * vb]! - P[3 * va]!) * s,
          P[3 * va + 1]! + (P[3 * vb + 1]! - P[3 * va + 1]!) * s,
          P[3 * va + 2]! + (P[3 * vb + 2]! - P[3 * va + 2]!) * s,
        ]);
        keys.push(Math.min(va, vb) * n + Math.max(va, vb));
        edges.push(va < vb ? [va, vb, s] : [vb, va, 1 - s]);
      }

      if (A.dist(A.scale(A.add(ends[0]!, ends[1]!), 0.5), centre) > radius) continue;
      out.push({ from: ends[0]!, to: ends[1]!, fromKey: keys[0]!, toKey: keys[1]!, fromEdge: edges[0]!, toEdge: edges[1]!, triangle: t });
    }

    return out;
  }

  /** Join segments that meet at an edge into loops; a chain that does not return to its start is open. */
  private join(segments: ISegment[]): HumanLayerIndex.ILoop[] {
    const byStart: Map<number, number> = new Map();
    const ends: Set<number> = new Set();
    const done: Uint8Array = new Uint8Array(segments.length);
    const loops: HumanLayerIndex.ILoop[] = [];

    segments.forEach((s: ISegment, k: number): void => {
      if (!byStart.has(s.fromKey)) byStart.set(s.fromKey, k);
      ends.add(s.toKey);
    });

    const walk: (first: number) => void = (first: number): void => {
      const order: number[] = [];
      let k: number | undefined = first;
      let closed: boolean = false;

      while (k !== undefined && done[k] === 0) {
        done[k] = 1;
        order.push(k);
        k = byStart.get(segments[k]!.toKey);

        if (k === first) closed = true;
      }

      const m: number = order.length + (closed ? 0 : 1);
      const loop: HumanLayerIndex.ILoop = {
        closed,
        points: [],
        a: new Int32Array(m),
        b: new Int32Array(m),
        s: new Float64Array(m),
        triangle: new Int32Array(m),
      };

      order.forEach((q: number, i: number): void => {
        loop.points.push(segments[q]!.from);
        [loop.a[i], loop.b[i], loop.s[i]] = segments[q]!.fromEdge;
        loop.triangle[i] = segments[q]!.triangle;
      });

      if (!closed) {
        const last: ISegment = segments[order[order.length - 1]!]!;

        loop.points.push(last.to);
        [loop.a[m - 1], loop.b[m - 1], loop.s[m - 1]] = last.toEdge;
        loop.triangle[m - 1] = last.triangle;
      }

      if (loop.points.length >= 2) loops.push(loop);
    };

    // Open chains start where no segment ends, so they are walked whole before the closed loops.
    segments.forEach((s: ISegment, k: number): void => {
      if (done[k] === 0 && !ends.has(s.fromKey)) walk(k);
    });
    segments.forEach((_s: ISegment, k: number): void => {
      if (done[k] === 0) walk(k);
    });

    return loops;
  }

  /** Whether the feature a nearest point lies on is on an open border of the mesh. */
  private onBorder(corners: number[], feature: number): boolean {
    const border: { vertex: Uint8Array; edges: Set<number> } = this.borders();
    const n: number = this.P.length / 3;
    const edge: (a: number, b: number) => boolean = (a: number, b: number): boolean => border.edges.has(Math.min(a, b) * n + Math.max(a, b));

    if (feature < 3) return border.vertex[corners[feature]!] === 1;
    if (feature === 3) return edge(corners[0]!, corners[1]!);
    if (feature === 4) return edge(corners[1]!, corners[2]!);
    if (feature === 5) return edge(corners[0]!, corners[2]!);

    return false;
  }

  /** The vertices and edges used by one triangle only: the mesh's open borders. */
  private borders(): { vertex: Uint8Array; edges: Set<number> } {
    if (this.borderVertex !== null && this.borderEdges !== null) return { vertex: this.borderVertex, edges: this.borderEdges };

    const n: number = this.P.length / 3;
    const count: Map<number, number> = new Map();

    for (let t: number = 0; t < this.I.length; t += 3)
      for (let e: number = 0; e < 3; e++) {
        const a: number = this.I[t + e]!;
        const b: number = this.I[t + ((e + 1) % 3)]!;
        const key: number = Math.min(a, b) * n + Math.max(a, b);

        count.set(key, (count.get(key) ?? 0) + 1);
      }

    const edges: Set<number> = new Set();
    const vertex: Uint8Array = new Uint8Array(n);

    for (const [key, uses] of count)
      if (uses === 1) {
        edges.add(key);
        vertex[Math.floor(key / n)] = 1;
        vertex[key % n] = 1;
      }

    this.borderVertex = vertex;
    this.borderEdges = edges;

    return { vertex, edges };
  }
}

export namespace HumanLayerIndex {
  /** One section loop and the mesh edge every point of it lies on. */
  export interface ILoop {
    /** Whether the loop closes. */
    closed: boolean;

    /** Points in loop order, world mm. */
    points: V3[];

    /** Lower vertex of each point's edge. */
    a: Int32Array;

    /** Upper vertex of each point's edge. */
    b: Int32Array;

    /** Each point's position along its edge from `a` to `b`. */
    s: Float64Array;

    /** Triangle of the segment leaving each point. */
    triangle: Int32Array;
  }

  /** The mesh point nearest to a query point. */
  export interface INearest {
    /** Distance, mm. */
    distance: number;

    /** Distance, negative when the query lies behind the triangle's outward side, mm. */
    signed: number;

    /** The triangle. */
    triangle: number;

    /** The nearest point, mm. */
    point: V3;

    /** Whether it lies on an open border of the mesh. */
    border: boolean;
  }

  /**
   * A copy of a mesh's positions with each vertex moved by a field, for made
   * defects.
   *
   * @param P Flat positions, mm.
   * @param move The displacement of a vertex at a position, or null to leave it.
   */
  export function displaced(P: Float64Array, move: (p: V3) => V3 | null): Float64Array {
    const out: Float64Array = Float64Array.from(P);

    for (let v: number = 0; v < P.length / 3; v++) {
      const d: V3 | null = move([P[3 * v]!, P[3 * v + 1]!, P[3 * v + 2]!]);

      if (d === null) continue;
      out[3 * v] += d[0];
      out[3 * v + 1] += d[1];
      out[3 * v + 2] += d[2];
    }

    return out;
  }
}

/** Output of HumanLayerTriangle.closest: the nearest point and its feature. */
const SCRATCH: Float64Array = new Float64Array(4);

/** The best point so far while a nearest query scans triangles. */
const NEAREST: Float64Array = new Float64Array(3);

/** Bucket key of a cell. */
function bucket(i: number, j: number, k: number): number {
  return ((i + 1024) * 2048 + (j + 1024)) * 2048 + (k + 1024);
}
