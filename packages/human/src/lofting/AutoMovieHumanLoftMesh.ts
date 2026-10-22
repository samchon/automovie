/**
 * Indexed triangle emission for lofted rings.
 *
 * Vertices are only what the section functions emit: every position comes
 * from a chain evaluation or is an inherited vertex of a parent ring. This
 * module never invents coordinates; it connects rings that share one phase
 * set and closes poles with fans.
 *
 * ## Orientation
 *
 * Rings are ordered by increasing phase, which runs from the front (+X)
 * toward +Z: counter-clockwise in the (x, z) plane. For a lower ring L and
 * an upper ring U, the up direction `u = U_i - L_i` and the phase direction
 * `d = L_{i+1} - L_i` give the outward normal `u x d`. The triangles
 * `(L_i, U_i, L_{i+1})` and `(L_{i+1}, U_i, U_{i+1})` are therefore
 * counter-clockwise seen from outside, the front-face convention of the
 * viewer.
 */
export namespace AutoMovieHumanLoftMesh {
  /** Growing vertex and index buffers in millimetres. */
  export interface IContext {
    /** Flat `[x, y, z, ...]` vertex positions in mm. */
    positions: number[];

    /** Flat triangle vertex indices. */
    indices: number[];
  }

  /** Empty buffers. */
  export function create(): IContext {
    return { positions: [], indices: [] };
  }

  /**
   * Append points and return their vertex indices in order.
   *
   * @param context Buffers to grow.
   * @param points World points `[x, y, z]` in mm.
   */
  export function vertices(
    context: IContext,
    points: readonly (readonly [number, number, number])[],
  ): number[] {
    const first: number = context.positions.length / 3;
    for (const p of points) context.positions.push(p[0], p[1], p[2]);
    return points.map((_: unknown, i: number): number => first + i);
  }

  /** World position of one vertex. */
  export function position(
    context: IContext,
    index: number,
  ): [number, number, number] {
    return [
      context.positions[3 * index]!,
      context.positions[3 * index + 1]!,
      context.positions[3 * index + 2]!,
    ];
  }

  /**
   * Connect two cyclic rings of equal length whose i-th vertices correspond.
   *
   * @param context Buffers to grow.
   * @param lower Ring at the lower height.
   * @param upper Ring at the higher height, same phase set as `lower`.
   */
  export function band(
    context: IContext,
    lower: readonly number[],
    upper: readonly number[],
  ): void {
    if (lower.length !== upper.length)
      throw new Error("A band needs rings with one shared phase set");

    const n: number = lower.length;
    for (let i: number = 0; i < n; i++) {
      const j: number = (i + 1) % n;

      // Two counter-clockwise triangles per quad; see the module note.
      context.indices.push(lower[i]!, upper[i]!, lower[j]!);
      context.indices.push(lower[j]!, upper[i]!, upper[j]!);
    }
  }

  /**
   * Close a ring with a fan to a pole vertex.
   *
   * A bottom pole faces -Y, so its triangles run `(apex, r_i, r_{i+1})`;
   * a top pole faces +Y and reverses them.
   *
   * @param context Buffers to grow.
   * @param ring Ring to close.
   * @param apex Pole vertex index.
   * @param top Whether the pole closes the ring from above.
   */
  export function cap(
    context: IContext,
    ring: readonly number[],
    apex: number,
    top: boolean,
  ): void {
    const n: number = ring.length;
    for (let i: number = 0; i < n; i++) {
      const a: number = ring[i]!;
      const b: number = ring[(i + 1) % n]!;
      if (top) context.indices.push(apex, b, a);
      else context.indices.push(apex, a, b);
    }
  }

  /**
   * Area-weighted vertex normals of the emitted triangles.
   *
   * Each triangle adds its unnormalized cross product, whose length is twice
   * its area, to its three vertices. Rings shared at branch events are one
   * set of vertices, so the normals there average both sides of the join
   * instead of showing a shading seam.
   */
  export function normals(context: IContext): number[] {
    const out: number[] = new Array<number>(context.positions.length).fill(0);
    const p: number[] = context.positions;

    for (let t: number = 0; t < context.indices.length; t += 3) {
      const a: number = 3 * context.indices[t]!;
      const b: number = 3 * context.indices[t + 1]!;
      const c: number = 3 * context.indices[t + 2]!;

      const ux: number = p[b]! - p[a]!;
      const uy: number = p[b + 1]! - p[a + 1]!;
      const uz: number = p[b + 2]! - p[a + 2]!;
      const vx: number = p[c]! - p[a]!;
      const vy: number = p[c + 1]! - p[a + 1]!;
      const vz: number = p[c + 2]! - p[a + 2]!;

      const nx: number = uy * vz - uz * vy;
      const ny: number = uz * vx - ux * vz;
      const nz: number = ux * vy - uy * vx;

      for (const v of [a, b, c]) {
        out[v]! += nx;
        out[v + 1]! += ny;
        out[v + 2]! += nz;
      }
    }

    // Normalize; an isolated vertex keeps a zero normal.
    for (let v: number = 0; v < out.length; v += 3) {
      const length: number = Math.hypot(out[v]!, out[v + 1]!, out[v + 2]!);
      if (length > 0) {
        out[v]! /= length;
        out[v + 1]! /= length;
        out[v + 2]! /= length;
      }
    }
    return out;
  }
}
