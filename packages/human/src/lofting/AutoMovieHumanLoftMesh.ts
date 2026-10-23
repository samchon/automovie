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

    /**
     * Named triangle ranges in emission order: each group owns the
     * triangles from its `start` index-buffer offset up to the next
     * group's start. Groups name the curve interval that generated them.
     */
    groups: { name: string; start: number }[];
  }

  /** One named piece of a split mesh, with its own compact vertex buffers. */
  export interface IPiece {
    /** Group name. */
    name: string;

    /** Flat vertex positions in mm. */
    positions: number[];

    /** Flat unit vertex normals, copied from the whole mesh. */
    normals: number[];

    /** Flat triangle indices into this piece's vertices. */
    indices: number[];
  }

  /** Empty buffers. */
  export function create(): IContext {
    return { positions: [], indices: [], groups: [] };
  }

  /**
   * Start a named group: triangles emitted from now on belong to it.
   *
   * Re-entering a name already used starts a new range under the same name;
   * `split` merges ranges by name.
   */
  export function group(context: IContext, name: string): void {
    const last: { name: string; start: number } | undefined =
      context.groups[context.groups.length - 1];

    // An empty previous range is replaced rather than kept.
    if (last !== undefined && last.start === context.indices.length)
      context.groups.pop();
    if (context.groups[context.groups.length - 1]?.name !== name)
      context.groups.push({ name, start: context.indices.length });
  }

  /**
   * Split the mesh into one piece per group name.
   *
   * Vertices shared by two groups are duplicated, each copy keeping the
   * normal computed on the whole mesh, so the pieces render without a
   * shading seam where they meet.
   *
   * @param context Mesh with groups.
   * @param normals Unit normals of the whole mesh, from {@link normals}.
   */
  export function split(context: IContext, normals: readonly number[]): IPiece[] {
    const pieces: Map<string, { piece: IPiece; remap: Map<number, number> }> =
      new Map();

    context.groups.forEach(
      (g: { name: string; start: number }, k: number): void => {
        const end: number =
          context.groups[k + 1]?.start ?? context.indices.length;

        let entry: { piece: IPiece; remap: Map<number, number> } | undefined =
          pieces.get(g.name);
        if (entry === undefined) {
          entry = {
            piece: { name: g.name, positions: [], normals: [], indices: [] },
            remap: new Map(),
          };
          pieces.set(g.name, entry);
        }

        // Copy each referenced vertex once per piece and reindex.
        for (let t: number = g.start; t < end; t++) {
          const v: number = context.indices[t]!;
          let local: number | undefined = entry.remap.get(v);
          if (local === undefined) {
            local = entry.piece.positions.length / 3;
            entry.remap.set(v, local);
            entry.piece.positions.push(
              context.positions[3 * v]!,
              context.positions[3 * v + 1]!,
              context.positions[3 * v + 2]!,
            );
            entry.piece.normals.push(
              normals[3 * v]!,
              normals[3 * v + 1]!,
              normals[3 * v + 2]!,
            );
          }
          entry.piece.indices.push(local);
        }
      },
    );
    return [...pieces.values()].map(
      (e: { piece: IPiece; remap: Map<number, number> }): IPiece => e.piece,
    );
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
   * Connect two cyclic rings of one chain that carry different phase sets.
   *
   * Both rings follow the same chain correspondence, so their vertices can
   * be merged by phase: walking both rings in increasing phase, each step
   * advances the ring whose next vertex has the smaller phase and emits one
   * triangle. The result is the zipper band used where a child chain leaves
   * the vertices it inherited from its parent for its own phase set, so
   * vertex density follows each chain's size rather than its ancestry.
   *
   * Phases are reduced modulo 2pi; each ring must be monotone in phase
   * along its vertex order, as both correspondence rules produce.
   *
   * @param context Buffers to grow.
   * @param lower Lower ring vertices.
   * @param lowerPhases Phase of each lower vertex in radians.
   * @param upper Upper ring vertices.
   * @param upperPhases Phase of each upper vertex in radians.
   */
  export function zipper(
    context: IContext,
    lower: readonly number[],
    lowerPhases: readonly number[],
    upper: readonly number[],
    upperPhases: readonly number[],
  ): void {
    const L: { v: number; t: number }[] = ascending(lower, lowerPhases);
    const U: { v: number; t: number }[] = ascending(upper, upperPhases);
    const nL: number = L.length;
    const nU: number = U.length;

    // Sentinels one period later close the cycle without index arithmetic.
    L.push({ v: L[0]!.v, t: L[0]!.t + 2 * Math.PI });
    U.push({ v: U[0]!.v, t: U[0]!.t + 2 * Math.PI });

    let i: number = 0;
    let j: number = 0;
    while (i < nL || j < nU) {
      // Advance the lower ring when its next vertex comes first in phase;
      // the triangle orientation matches `band`.
      const advanceLower: boolean =
        j >= nU || (i < nL && L[i + 1]!.t <= U[j + 1]!.t);

      if (advanceLower) {
        context.indices.push(L[i]!.v, U[j]!.v, L[i + 1]!.v);
        i++;
      } else {
        context.indices.push(L[i]!.v, U[j]!.v, U[j + 1]!.v);
        j++;
      }
    }
  }

  /** Ring vertices rotated to start at the smallest phase in `[0, 2pi)`. */
  function ascending(
    ring: readonly number[],
    phases: readonly number[],
  ): { v: number; t: number }[] {
    const reduced: number[] = phases.map(
      (t: number): number => t - 2 * Math.PI * Math.floor(t / (2 * Math.PI)),
    );
    const start: number = reduced.reduce(
      (best: number, t: number, i: number): number =>
        t < reduced[best]! ? i : best,
      0,
    );

    // Unwrap after the start so the sequence increases through one period.
    const out: { v: number; t: number }[] = [];
    for (let k: number = 0; k < ring.length; k++) {
      const i: number = (start + k) % ring.length;
      const t: number =
        reduced[i]! < reduced[start]! ? reduced[i]! + 2 * Math.PI : reduced[i]!;
      out.push({ v: ring[i]!, t });
    }
    return out;
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
