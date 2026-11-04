import type { HumanAnatomy } from "../../HumanAnatomy";

/**
 * Plain facts of an indexed triangle mesh that the surface comparison reads:
 * outward vertex normals, vertex areas, connected pieces and open borders.
 * Nothing here knows a body; positions are flat millimetre triples and
 * triangles are flat index triples.
 */
export namespace HumanReferenceSurfaceMesh {
  /**
   * Outward unit vertex normals, area weighted. A mesh wound inward is turned
   * by the sign of its enclosed volume, so the result faces out either way.
   * A vertex no triangle uses gets the zero vector.
   *
   * @param P Flat vertex positions, mm.
   * @param I Flat triangle vertex indices.
   * @returns Flat unit normals, three per vertex.
   */
  export function vertexNormals(P: Float64Array, I: Uint32Array): Float64Array {
    const N: Float64Array = new Float64Array(P.length);
    let volume: number = 0;

    for (let t: number = 0; t < I.length; t += 3) {
      const a: number = 3 * I[t]!;
      const b: number = 3 * I[t + 1]!;
      const c: number = 3 * I[t + 2]!;
      const ux: number = P[b]! - P[a]!;
      const uy: number = P[b + 1]! - P[a + 1]!;
      const uz: number = P[b + 2]! - P[a + 2]!;
      const vx: number = P[c]! - P[a]!;
      const vy: number = P[c + 1]! - P[a + 1]!;
      const vz: number = P[c + 2]! - P[a + 2]!;
      const x: number = uy * vz - uz * vy;
      const y: number = uz * vx - ux * vz;
      const z: number = ux * vy - uy * vx;

      // The signed volume is the sum of the divergence-theorem tetrahedra over the origin.
      volume += P[a]! * x + P[a + 1]! * y + P[a + 2]! * z;

      for (const o of [a, b, c]) {
        N[o] += x;
        N[o + 1] += y;
        N[o + 2] += z;
      }
    }

    const sign: number = volume < 0 ? -1 : 1;
    for (let v: number = 0; v < N.length; v += 3) {
      const l: number = Math.hypot(N[v]!, N[v + 1]!, N[v + 2]!) || 1;
      N[v] = (sign * N[v]!) / l;
      N[v + 1] = (sign * N[v + 1]!) / l;
      N[v + 2] = (sign * N[v + 2]!) / l;
    }

    return N;
  }

  /**
   * A third of every adjacent triangle's area at each vertex, the share a
   * vertex owns when area is spread over corners.
   *
   * @param P Flat vertex positions, mm.
   * @param I Flat triangle vertex indices.
   * @returns Area per vertex, mm squared.
   */
  export function vertexAreas(P: Float64Array, I: Uint32Array): Float64Array {
    const A: Float64Array = new Float64Array(P.length / 3);

    for (let t: number = 0; t < I.length; t += 3) {
      const a: number = 3 * I[t]!;
      const b: number = 3 * I[t + 1]!;
      const c: number = 3 * I[t + 2]!;
      const ux: number = P[b]! - P[a]!;
      const uy: number = P[b + 1]! - P[a + 1]!;
      const uz: number = P[b + 2]! - P[a + 2]!;
      const vx: number = P[c]! - P[a]!;
      const vy: number = P[c + 1]! - P[a + 1]!;
      const vz: number = P[c + 2]! - P[a + 2]!;
      const s: number = Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) / 6;
      A[I[t]!] += s;
      A[I[t + 1]!] += s;
      A[I[t + 2]!] += s;
    }

    return A;
  }

  /**
   * The connected piece of every vertex, over the triangles' edges.
   *
   * @param I Flat triangle vertex indices.
   * @param n Vertex count.
   * @returns For each vertex, the representative vertex of its piece.
   */
  export function components(I: Uint32Array, n: number): Int32Array {
    const parent: Int32Array = new Int32Array(n);
    for (let v: number = 0; v < n; v++) parent[v] = v;

    const find: (v: number) => number = (v: number): number => {
      while (parent[v] !== v) {
        parent[v] = parent[parent[v]!]!;
        v = parent[v]!;
      }

      return v;
    };

    for (let t: number = 0; t < I.length; t += 3) {
      const a: number = find(I[t]!);
      const b: number = find(I[t + 1]!);
      const c: number = find(I[t + 2]!);
      parent[b] = a;
      parent[find(c)] = a;
    }

    const out: Int32Array = new Int32Array(n);
    for (let v: number = 0; v < n; v++) out[v] = find(v);

    return out;
  }

  /**
   * The piece of largest total area.
   *
   * @param piece Representative vertex of each vertex's piece, from `components`.
   * @param area Area per vertex.
   * @returns The representative of the largest piece.
   */
  export function largest(piece: Int32Array, area: Float64Array): number {
    const sum: Map<number, number> = new Map();
    for (let v: number = 0; v < piece.length; v++) sum.set(piece[v]!, (sum.get(piece[v]!) ?? 0) + area[v]!);

    let best: number = -1;
    let most: number = -Infinity;
    for (const [p, a] of sum)
      if (a > most) {
        most = a;
        best = p;
      }

    return best;
  }

  /**
   * Edges used by one triangle only, keyed by their vertex pair: the skin's
   * open borders.
   *
   * @param I Flat triangle vertex indices.
   * @param n Vertex count, which keys an edge.
   * @returns The keys of the open edges.
   */
  export function borderEdges(I: Uint32Array, n: number): Set<number> {
    const uses: Map<number, number> = new Map();
    for (let t: number = 0; t < I.length; t += 3)
      for (let k: number = 0; k < 3; k++) {
        const key: number = edgeKey(I[t + k]!, I[t + ((k + 1) % 3)]!, n);
        uses.set(key, (uses.get(key) ?? 0) + 1);
      }

    const out: Set<number> = new Set();
    for (const [key, count] of uses) if (count === 1) out.add(key);

    return out;
  }

  /**
   * Whether a nearest point lies on an open border edge of its triangle.
   *
   * @param P Flat vertex positions, mm.
   * @param I Flat triangle vertex indices.
   * @param f The triangle's index.
   * @param q The nearest point, mm.
   * @param border Open edges, from `borderEdges`.
   * @param n Vertex count, which keys an edge.
   */
  export function onBorder(
    P: Float64Array,
    I: Uint32Array,
    f: number,
    q: [number, number, number],
    border: Set<number>,
    n: number,
  ): boolean {
    for (let k: number = 0; k < 3; k++) {
      const a: number = I[3 * f + k]!;
      const b: number = I[3 * f + ((k + 1) % 3)]!;
      if (!border.has(edgeKey(a, b, n))) continue;

      const from: HumanAnatomy.V3 = [P[3 * a]!, P[3 * a + 1]!, P[3 * a + 2]!];
      const to: HumanAnatomy.V3 = [P[3 * b]!, P[3 * b + 1]!, P[3 * b + 2]!];
      if (segment(q, from, to) < 1e-6) return true;
    }

    return false;
  }

  /**
   * Distance from a point to a segment.
   *
   * @param p The point, mm.
   * @param a First end of the segment, mm.
   * @param b Second end of the segment, mm.
   */
  export function segment(p: HumanAnatomy.V3, a: HumanAnatomy.V3, b: HumanAnatomy.V3): number {
    const ab: number[] = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const ap: number[] = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
    const ll: number = ab[0]! ** 2 + ab[1]! ** 2 + ab[2]! ** 2;
    const s: number =
      ll === 0 ? 0 : Math.max(0, Math.min(1, (ap[0]! * ab[0]! + ap[1]! * ab[1]! + ap[2]! * ab[2]!) / ll));

    return Math.hypot(ap[0]! - s * ab[0]!, ap[1]! - s * ab[1]!, ap[2]! - s * ab[2]!);
  }

  /**
   * An undirected edge's key.
   *
   * @param a One end's vertex index.
   * @param b The other end's vertex index.
   * @param n Vertex count.
   */
  function edgeKey(a: number, b: number, n: number): number {
    return a < b ? a * n + b : b * n + a;
  }
}
