import type { HumanSkinIntegrity } from "./HumanSkinIntegrity";
import { HumanSkinIntegrityUnion as Union } from "./HumanSkinIntegrityUnion";

/**
 * The edges of a triangle mesh, the half-edges that use each, and the
 * triangles at each vertex. It answers which edges are open, shared by more
 * than two triangles or wound the same way twice, and which corners join two
 * sheets.
 */
export class HumanSkinIntegrityTopology {
  /** Flat triangle vertex indices of the mesh. */
  public readonly I: Uint32Array;

  /** Number of distinct edges. */
  public readonly edges: number;

  /** Lower vertex of every edge. */
  public readonly ea: Int32Array;

  /** Upper vertex of every edge. */
  public readonly eb: Int32Array;

  /** First entry of every edge in `users`; one past the last edge's entries ends the table. */
  public readonly offset: Int32Array;

  /** Half-edges using each edge, `3 t + k` for the edge of triangle `t` leaving corner `k`. */
  public readonly users: Int32Array;

  /** First entry of every vertex in `vtri`. */
  public readonly vstart: Int32Array;

  /** Triangles at each vertex. */
  public readonly vtri: Int32Array;

  /** Edge index by the key `lower * vertices + upper`. */
  private readonly ids: Map<number, number> = new Map();

  /** Number of vertices, the edge key's base. */
  private readonly n: number;

  /** The tables of a mesh. */
  public constructor(mesh: HumanSkinIntegrity.IMesh) {
    const n: number = mesh.P.length / 3;
    const T: number = mesh.I.length / 3;
    const half: Int32Array = new Int32Array(3 * T);
    const ea: number[] = [];
    const eb: number[] = [];

    this.I = mesh.I;
    this.n = n;

    // Number the edges in order of first use, and name each half-edge's edge.
    for (let t: number = 0; t < T; t++)
      for (let k: number = 0; k < 3; k++) {
        const a: number = mesh.I[3 * t + k]!;
        const b: number = mesh.I[3 * t + ((k + 1) % 3)]!;
        const lo: number = Math.min(a, b);
        const hi: number = Math.max(a, b);
        const key: number = lo * n + hi;
        let e: number | undefined = this.ids.get(key);

        if (e === undefined) {
          e = ea.length;
          this.ids.set(key, e);
          ea.push(lo);
          eb.push(hi);
        }

        half[3 * t + k] = e;
      }

    this.edges = ea.length;
    this.ea = Int32Array.from(ea);
    this.eb = Int32Array.from(eb);

    // Group the half-edges by edge with a counting sort.
    this.offset = new Int32Array(this.edges + 1);

    for (const e of half) this.offset[e + 1]!++;

    for (let e: number = 0; e < this.edges; e++) this.offset[e + 1]! += this.offset[e]!;

    this.users = new Int32Array(3 * T);

    const fill: Int32Array = this.offset.slice(0, this.edges);

    for (let h: number = 0; h < 3 * T; h++) this.users[fill[half[h]!]!++] = h;

    // Group the triangles by vertex the same way.
    this.vstart = new Int32Array(n + 1);

    for (const v of mesh.I) this.vstart[v + 1]!++;

    for (let v: number = 0; v < n; v++) this.vstart[v + 1]! += this.vstart[v]!;

    this.vtri = new Int32Array(3 * T);

    const vfill: Int32Array = this.vstart.slice(0, n);

    for (let t: number = 0; t < T; t++) for (let k: number = 0; k < 3; k++) this.vtri[vfill[mesh.I[3 * t + k]!]!++] = t;
  }

  /** The edge between two vertices, or -1. */
  public edge(a: number, b: number): number {
    return this.ids.get(Math.min(a, b) * this.n + Math.max(a, b)) ?? -1;
  }

  /** The number of half-edges using an edge. */
  public uses(e: number): number {
    return this.offset[e + 1]! - this.offset[e]!;
  }

  /** Whether the two half-edges of an edge traverse it in opposite directions. */
  public consistent(e: number): boolean {
    const h1: number = this.users[this.offset[e]!]!;
    const h2: number = this.users[this.offset[e]! + 1]!;

    return this.I[h1] !== this.I[h2];
  }

  /** Triangles joined across every manifold, consistently wound edge: the sheets a ray test can orient. */
  public orientationPatches(): number[][] {
    const T: number = this.I.length / 3;
    const union: Union = new Union(T);

    for (let e: number = 0; e < this.edges; e++) {
      if (this.uses(e) !== 2 || !this.consistent(e)) continue;

      union.join(Math.floor(this.users[this.offset[e]!]! / 3), Math.floor(this.users[this.offset[e]! + 1]! / 3));
    }

    return union.groups();
  }

  /**
   * Vertices whose triangles fall into more than one fan: two sheets meeting
   * at a point. The triangles at a vertex join through the edges they share
   * there.
   */
  public pinched(): number[] {
    const out: number[] = [];
    const n: number = this.vstart.length - 1;

    for (let v: number = 0; v < n; v++) {
      const first: number = this.vstart[v]!;
      const m: number = this.vstart[v + 1]! - first;

      if (m < 2) continue;

      // Triangles at the vertex, joined across each edge from it.
      const local: number[] = [];

      for (let j: number = 0; j < m; j++) local.push(this.vtri[first + j]!);

      const union: Union = new Union(m);

      for (let j: number = 0; j < m; j++) {
        const t: number = local[j]!;

        for (let k: number = 0; k < 3; k++) {
          const w: number = this.I[3 * t + k]!;

          if (w === v) continue;

          const e: number = this.edge(v, w);

          for (let q: number = this.offset[e]!; q < this.offset[e + 1]!; q++) {
            const u: number = local.indexOf(Math.floor(this.users[q]! / 3));

            if (u >= 0) union.join(j, u);
          }
        }
      }

      // More than one fan makes the vertex a pinch.
      if (union.groups().length > 1) out.push(v);
    }

    return out;
  }

  /** A group of boundary edges as one closed simple loop of vertices, or null. */
  public loop(group: number[]): number[] | null {
    const next: Map<number, number[]> = new Map();

    // Each vertex of a simple loop has exactly two neighbours along it.
    for (const e of group)
      for (const [a, b] of [
        [this.ea[e]!, this.eb[e]!],
        [this.eb[e]!, this.ea[e]!],
      ] as [number, number][]) {
        const list: number[] | undefined = next.get(a);

        if (list === undefined) next.set(a, [b]);
        else list.push(b);
      }

    for (const list of next.values()) if (list.length !== 2) return null;

    if (next.size !== group.length) return null;

    // Walk the loop from one end; it must come back to the start after visiting every edge.
    const start: number = this.ea[group[0]!]!;
    const out: number[] = [start];
    let previous: number = -1;
    let current: number = start;

    for (;;) {
      const [x, y]: number[] = next.get(current)!;
      const step: number = x !== previous ? x! : y!;

      if (step === start) break;

      out.push(step);
      previous = current;
      current = step;

      if (out.length > group.length) return null;
    }

    return out.length === group.length ? out : null;
  }
}
