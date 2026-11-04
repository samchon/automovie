/**
 * The original polygon display's ring zipper and crown fan connectivity.
 * Copied without arithmetic changes from Human's numerical loft emitter;
 * this optional renderer does not import that generator implementation.
 *
 * @evidence contracts/common.md#principled-implementation Preserves the existing monotone cyclic phase zipper, fan winding and direct indexed-position access; these operations connect supplied points without inventing geometry.
 * @evidence contracts/common.md#clear-and-simple-design Contains only the three connectivity operations consumed by the original display assembler, independent of body generation and rendering objects.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source course, vertex, phase fit or alternate shape rule is introduced during promotion.
 * @evidence contracts/common.md#meaningful-documentation Records original algorithm provenance, caller-owned point units and monotone phase premises.
 * @evidence contracts/performance.md#efficient-algorithms Zipper visits each ring vertex once; fan emission is linear and position access constant.
 * @evidence contracts/performance.md#reuse-equivalent-work Appends to caller-owned index buffers and reads existing positions without a second mesh representation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains no buffers after return; temporary phase records live only during a zipper call.
 */
export namespace humanPolygonTopology {

  /**
   * Caller-owned numerical buffers; positions retain the caller's units.
   *
   * @evidence contracts/common.md#principled-implementation Flat Cartesian positions and triangle indices preserve the original loft emitter representation without unit conversion.
   * @evidence contracts/common.md#clear-and-simple-design One structural context serves position queries and index emission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The renderer supplies actual emitted buffers, without fixture or anatomical branches.
   * @evidence contracts/common.md#meaningful-documentation States caller ownership and unchanged position units.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This context computes nothing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This context coordinates no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Buffer ownership remains with the assembler.
   */
  export interface IContext {

    /** Flat Cartesian positions in the assembler's metre frame. */
    positions: number[];

    /** Flat triangle vertex indices. */
    indices: number[];
  }

  /**
   * Read one existing indexed vertex in the caller's unchanged units.
   *
   * @evidence contracts/common.md#principled-implementation Reads the original three consecutive components at index times three.
   * @evidence contracts/common.md#clear-and-simple-design Keeps the original position accessor used by crown diagnostics.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Returns source components without reconstruction or correction.
   * @evidence contracts/common.md#meaningful-documentation Gives indexed access and unchanged units; the caller supplies a valid index.
   * @evidence contracts/performance.md#efficient-algorithms Constant work and one three-number tuple.
   * @evidence contracts/performance.md#reuse-equivalent-work Reads the existing numerical buffer.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one caller-owned tuple and retains no source.
   */
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
   * Join monotone cyclic phase rings using the original advancing-edge zipper.
   *
   * @evidence contracts/common.md#principled-implementation Reduces phases modulo two pi, rotates each ring to its minimum phase, then advances the next lower phase with one-period sentinels; supplied ring ordering must be monotone cyclically and arrays nonempty with matching phase counts.
   * @evidence contracts/common.md#clear-and-simple-design One connectivity walk preserves the exact existing triangle order and tie rule.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It changes no source points and performs no resampling or fixture-specific joining.
   * @evidence contracts/common.md#meaningful-documentation States cyclic monotone ordering, nonempty/matching input premises and original winding ownership.
   * @evidence contracts/performance.md#efficient-algorithms O(L+U) time and temporary records for L and U supplied ring vertices.
   * @evidence contracts/performance.md#reuse-equivalent-work Appends to the existing caller's triangle buffer.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Phase records are call-local; resulting indices remain caller-owned.
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
   * Principled implementation: Reduces every phase into [0,2pi), rotates indices to the minimum and unwraps one period using the existing strict comparison.
   * Clear and simple design: A private ordering helper serves the single zipper algorithm.
   * Prohibited implementation shortcuts: No sorting, tolerance, sample deletion or phase fitting alters correspondence.
   * Meaningful documentation: Names phase reduction and cyclic rotation; zipper documents ordering premises.
   * Efficient algorithms: Three O(N) passes and O(N) temporary scalar/vertex records.
   * Reuse equivalent work: Reads supplied vertex indices without copying positions.
   * Bound retention and release resources: Temporary reduction records transfer only to the caller zipper and die after emission.
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

  /**
   * Close an existing ring with the original oriented crown fan.
   *
   * @evidence contracts/common.md#principled-implementation Emits the original apex/current/next winding, reversed for a top pole, without adding coordinates.
   * @evidence contracts/common.md#clear-and-simple-design One fan emitter handles either pole orientation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No replacement terminal ring or hidden cap geometry is introduced.
   * @evidence contracts/common.md#meaningful-documentation States existing-ring and apex inputs and top orientation.
   * @evidence contracts/performance.md#efficient-algorithms O(N) index writes for N ring vertices.
   * @evidence contracts/performance.md#reuse-equivalent-work Writes the caller's existing index buffer and references its existing pole.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing and allocates no geometry or native handle.
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
}
