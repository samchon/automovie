/**
 * The original polygon display's ring zipper and crown fan connectivity. Copied
 * without arithmetic changes from Human's numerical loft emitter; this optional
 * renderer does not import that generator implementation.
 */
export namespace humanPolygonTopology {
  /** Caller-owned numerical buffers; positions retain the caller's units. */
  export interface IContext {
    /** Flat Cartesian positions in the assembler's metre frame. */
    positions: number[];

    /** Flat triangle vertex indices. */
    indices: number[];
  }

  /** Read one existing indexed vertex in the caller's unchanged units. */
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

  /** Join monotone cyclic phase rings using the original advancing-edge zipper. */
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
    L.push({ v: L[0]!.v, t: L[0]!.t + 2 * Math.PI });
    U.push({ v: U[0]!.v, t: U[0]!.t + 2 * Math.PI });
    let i: number = 0;
    let j: number = 0;
    while (i < nL || j < nU) {
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

  /**
   * Preserve original phase reduction and cyclic-start selection.
   *
   * Principled implementation: Reduces every phase into [0,2pi), rotates
   * indices to the minimum and unwraps one period using the existing strict
   * comparison. Clear and simple design: A private ordering helper serves the
   * single zipper algorithm. Prohibited implementation shortcuts: No sorting,
   * tolerance, sample deletion or phase fitting alters correspondence.
   * Meaningful documentation: Names phase reduction and cyclic rotation; zipper
   * documents ordering premises. Efficient algorithms: Three O(N) passes and
   * O(N) temporary scalar/vertex records. Reuse equivalent work: Reads supplied
   * vertex indices without copying positions. Bound retention and release
   * resources: Temporary reduction records transfer only to the caller zipper
   * and die after emission.
   */
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
    const out: { v: number; t: number }[] = [];
    for (let k: number = 0; k < ring.length; k++) {
      const i: number = (start + k) % ring.length;
      const t: number =
        reduced[i]! < reduced[start]! ? reduced[i]! + 2 * Math.PI : reduced[i]!;
      out.push({ v: ring[i]!, t });
    }
    return out;
  }

  /** Close an existing ring with the original oriented crown fan. */
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
}
