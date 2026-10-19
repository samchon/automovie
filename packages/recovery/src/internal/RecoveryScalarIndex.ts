/**
 * Immutable face-height interval queries for one admitted observation mesh.
 *
 * @evidence contracts/common.md#principled-implementation A balanced range-maximum tree over triangle minimum heights prunes disjoint intervals without changing scalar comparisons or source face identities.
 * @evidence contracts/common.md#clear-and-simple-design One call owns immutable interval arrays and returns separate inclusive plane and strict open-slab queries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every intersecting face is returned, including flat faces and hidden slab components; no specimen metadata or geometric approximation is used.
 * @evidence contracts/common.md#meaningful-documentation Queries document equality conventions, face order and the caller's immutable mesh lifetime.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Namespace initialization performs no work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No module cache exists.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Namespace initialization retains no state.
 */
export namespace RecoveryScalarIndex {
  /**
   * Prepare height intervals once; the caller keeps source arrays unchanged until queries finish.
   * Results contain original face IDs in ascending order. Plane queries include both endpoints;
   * slab queries require positive overlap with the open interval, retaining internal components.
   *
   * @evidence contracts/common.md#principled-implementation Each triangle's exact binary64 minimum and maximum define necessary and sufficient scalar intersection tests. Tree bounds only reject subtrees that cannot satisfy those same comparisons.
   * @evidence contracts/common.md#clear-and-simple-design The returned closure hides copied interval data; consumers receive only transient source face candidates.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Flat and tangent faces remain in inclusive plane queries, and every component with open-slab overlap remains in slab queries. No curve fitting or surface generation occurs here.
   * @evidence contracts/common.md#meaningful-documentation States source immutability, inclusive versus strict boundaries and stable output ordering.
   * @evidence contracts/performance.md#efficient-algorithms For T faces and V heights, preparation costs O(V+T log T) time and O(T) retained storage. A query visits intersecting tree bounds and sorts A matches in O(A log A); worst case O(T+A log A), while disjoint subtrees are skipped.
   * @evidence contracts/performance.md#reuse-equivalent-work Copied face intervals and tree bounds are reused by every plane and slab in one extraction. The caller creates a new index for another mesh or scalar chart; no mutable-input cache exists.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The extraction call owns O(T) interval/tree arrays and each query's O(A+log T) result/stack. These become unreachable after extraction; original source positions and topology never escape through query results.
   */
  export function create(
    triangles: readonly (readonly [number, number, number])[],
    heights: readonly number[],
  ): {
    cut: (level: number) => readonly number[];
    slab: (before: number, after: number) => readonly number[];
  } {
    if (!heights.length || !heights.every(Number.isFinite))
      throw new Error("Finite scalar heights are required");
    const minimum: Float64Array = new Float64Array(triangles.length);
    const maximum: Float64Array = new Float64Array(triangles.length);
    const order: number[] = [];
    for (let ti: number = 0; ti < triangles.length; ti++) {
      const triangle: readonly [number, number, number] = triangles[ti]!;
      if (
        triangle.length !== 3 ||
        triangle.some(
          (i: number): boolean =>
            !Number.isSafeInteger(i) || i < 0 || i >= heights.length,
        )
      )
        throw new Error("Face addresses do not align with scalar heights");
      const a: number = heights[triangle[0]]!,
        b: number = heights[triangle[1]]!,
        c: number = heights[triangle[2]]!;
      minimum[ti] = Math.min(a, b, c);
      maximum[ti] = Math.max(a, b, c);
      order.push(ti);
    }
    order.sort(
      (a: number, b: number): number => minimum[a]! - minimum[b]! || a - b,
    );
    let capacity: number = 1;
    while (capacity < order.length) capacity *= 2;
    const maxima: Float64Array = new Float64Array(capacity * 2).fill(-Infinity);
    const minima: Float64Array = new Float64Array(capacity * 2).fill(Infinity);
    for (let i: number = 0; i < order.length; i++) {
      maxima[capacity + i] = maximum[order[i]!]!;
      minima[capacity + i] = minimum[order[i]!]!;
    }
    for (let i: number = capacity - 1; i > 0; i--) {
      maxima[i] = Math.max(maxima[i * 2]!, maxima[i * 2 + 1]!);
      minima[i] = Math.min(minima[i * 2]!, minima[i * 2 + 1]!);
    }
    const query: (
      low: number,
      high: number,
      strict: boolean,
    ) => readonly number[] = (
      low: number,
      high: number,
      strict: boolean,
    ): readonly number[] => {
      if (
        !Number.isFinite(low) ||
        !Number.isFinite(high) ||
        (strict && !(low < high))
      )
        throw new Error("Finite ordered scalar query required");
      const result: number[] = [],
        stack: number[] = [1];
      while (stack.length) {
        const node: number = stack.pop()!;
        if (
          strict
            ? maxima[node]! <= low || minima[node]! >= high
            : maxima[node]! < low || minima[node]! > high
        )
          continue;
        if (node >= capacity) {
          const face: number | undefined = order[node - capacity];
          if (face !== undefined) result.push(face);
        } else {
          stack.push(node * 2 + 1);
          stack.push(node * 2);
        }
      }
      result.sort((a: number, b: number): number => a - b);
      return result;
    };
    return {
      cut: (level: number): readonly number[] => query(level, level, false),
      slab: (before: number, after: number): readonly number[] =>
        query(before, after, true),
    };
  }
}
