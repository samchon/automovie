import type { IAutoMovieRecoveryScalarIndex } from "@automovie/interface";

/** Immutable face-height interval queries for one admitted observation mesh. */
export namespace RecoveryScalarIndex {
  /**
   * Prepare height intervals once; the caller keeps source arrays unchanged
   * until queries finish. Results contain original face IDs in ascending order.
   * Plane queries include both endpoints; slab queries require positive overlap
   * with the open interval, retaining internal components.
   */
  export function create(
    triangles: Parameters<IAutoMovieRecoveryScalarIndex.Create>[0],
    heights: Parameters<IAutoMovieRecoveryScalarIndex.Create>[1],
  ): ReturnType<IAutoMovieRecoveryScalarIndex.Create> {
    if (!heights.length) throw new Error("Finite scalar heights are required");
    const minimum: Float64Array = new Float64Array(triangles.length);
    const maximum: Float64Array = new Float64Array(triangles.length);
    const order: number[] = [];
    for (let ti: number = 0; ti < triangles.length; ti++) {
      const triangle: readonly [number, number, number] = triangles[ti]!;
      if (
        triangle.length !== 3 ||
        triangle.some((i: number): boolean => i < 0 || i >= heights.length)
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
      if (strict && !(low < high))
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
