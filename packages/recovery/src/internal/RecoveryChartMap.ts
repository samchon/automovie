import type { IAutoMovieRecoveryChartMap } from "@automovie/interface";

/**
 * Private Dirichlet parameterization of an observed triangulated chart.
 * Original source incidence is used only by observation and never returned.
 */
export namespace RecoveryChartMap {
  /**
   * Solve a positive-weight Dirichlet graph Laplacian with diagonal PCG.
   * Anchoring every connected component makes the free matrix positive
   * definite. The caller still establishes disk topology and a compatible
   * boundary map; positive computed triangle areas are checked rather than
   * assumed from that premise.
   */
  export function parameterize(
    input: IAutoMovieRecoveryChartMap.Input,
  ): IAutoMovieRecoveryChartMap.Result {
    if (
      input.vertices < 3 ||
      !input.triangles.length ||
      !(input.tolerance > 0) ||
      input.maxIterations < 1
    )
      throw new Error(
        "A finite private chart and positive parameterization budgets are required",
      );
    const adjacency: Set<number>[] = Array.from(
      { length: input.vertices },
      (): Set<number> => new Set(),
    );
    for (const triangle of input.triangles) {
      if (triangle.length !== 3 || new Set(triangle).size !== 3)
        throw new Error(
          "Private chart triangles need three distinct addresses",
        );
      for (let k: number = 0; k < 3; k++) {
        const a: number = triangle[k]!,
          b: number = triangle[(k + 1) % 3]!;
        if (a < 0 || a >= input.vertices || b < 0 || b >= input.vertices)
          throw new Error("Private chart triangle addresses are invalid");
        adjacency[a]!.add(b);
        adjacency[b]!.add(a);
      }
    }
    const fixed: Map<number, [number, number]> = new Map();
    for (const value of input.fixed) {
      if (
        value.vertex < 0 ||
        value.vertex >= input.vertices ||
        fixed.has(value.vertex) ||
        ![value.u, value.v].every((x: number): boolean => x >= 0 && x <= 1)
      )
        throw new Error("Unique finite fixed chart coordinates are required");
      fixed.set(value.vertex, [value.u, value.v]);
    }
    const visited: Set<number> = new Set();
    for (let start: number = 0; start < input.vertices; start++)
      if (!visited.has(start)) {
        const queue: number[] = [start];
        visited.add(start);
        let anchored: boolean = false;
        for (let i: number = 0; i < queue.length; i++) {
          const vertex: number = queue[i]!;
          anchored ||= fixed.has(vertex);
          for (const neighbor of adjacency[vertex]!)
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
        }
        if (!anchored)
          throw new Error(
            "Every private chart component must reach a fixed boundary or guide",
          );
      }
    const free: number[] = [],
      slots: Int32Array = new Int32Array(input.vertices).fill(-1);
    for (let i: number = 0; i < input.vertices; i++)
      if (!fixed.has(i)) {
        slots[i] = free.length;
        free.push(i);
      }
    const parameters: [number, number][] = Array.from(
      { length: input.vertices },
      (_: unknown, i: number): [number, number] => fixed.get(i) ?? [0, 0],
    );
    const multiply: (x: Float64Array) => Float64Array = (
      x: Float64Array,
    ): Float64Array =>
      Float64Array.from(free, (vertex: number, i: number): number => {
        let value: number = adjacency[vertex]!.size * x[i]!;
        for (const neighbor of adjacency[vertex]!)
          if (slots[neighbor]! >= 0) value -= x[slots[neighbor]!]!;
        return value;
      });
    const dot: (a: Float64Array, b: Float64Array) => number = (
      a: Float64Array,
      b: Float64Array,
    ): number =>
      a.reduce(
        (sum: number, value: number, i: number): number => sum + value * b[i]!,
        0,
      );
    const iterations: [number, number] = [0, 0],
      diagnostics: string[] = [];
    for (let coordinate: number = 0; coordinate < 2; coordinate++) {
      const rhs: Float64Array = Float64Array.from(
        free,
        (vertex: number): number => {
          let value: number = 0;
          for (const neighbor of adjacency[vertex]!)
            value += fixed.get(neighbor)?.[coordinate] ?? 0;
          return value;
        },
      );
      const x: Float64Array = new Float64Array(free.length),
        residual: Float64Array = rhs.slice();
      let z: Float64Array = Float64Array.from(
          residual,
          (value: number, i: number): number =>
            value / adjacency[free[i]!]!.size,
        ),
        direction: Float64Array = z.slice(),
        product: number = dot(residual, z);
      for (
        let round: number = 0;
        round < input.maxIterations &&
        residual.some(
          (value: number): boolean => Math.abs(value) > input.tolerance,
        );
        round++
      ) {
        const applied: Float64Array = multiply(direction),
          denominator: number = dot(direction, applied);
        if (!(denominator > 0)) {
          diagnostics.push(
            `Unresolved harmonic arithmetic in coordinate ${coordinate}`,
          );
          break;
        }
        const alpha: number = product / denominator;
        for (let i: number = 0; i < x.length; i++) {
          x[i] += alpha * direction[i]!;
          residual[i] -= alpha * applied[i]!;
        }
        z = Float64Array.from(
          residual,
          (value: number, i: number): number =>
            value / adjacency[free[i]!]!.size,
        );
        const next: number = dot(residual, z),
          beta: number = next / product;
        direction = Float64Array.from(
          z,
          (value: number, i: number): number => value + beta * direction[i]!,
        );
        product = next;
        iterations[coordinate]++;
      }
      for (let i: number = 0; i < free.length; i++)
        parameters[free[i]!]![coordinate] = x[i]!;
    }
    let residual: number = 0;
    for (const vertex of free)
      for (let k: number = 0; k < 2; k++) {
        let value: number = adjacency[vertex]!.size * parameters[vertex]![k]!;
        for (const neighbor of adjacency[vertex]!)
          value -= parameters[neighbor]![k]!;
        residual = Math.max(residual, Math.abs(value));
      }
    const failedTriangles: number[] = [];
    input.triangles.forEach(
      (triangle: readonly [number, number, number], i: number): void => {
        const a: [number, number] = parameters[triangle[0]]!,
          b: [number, number] = parameters[triangle[1]]!,
          c: [number, number] = parameters[triangle[2]]!;
        const area: number =
          (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
        if (!(area > 0)) failedTriangles.push(i);
      },
    );
    const inRange: boolean = parameters.every((p: [number, number]): boolean =>
      p.every((x: number): boolean => x >= 0 && x <= 1),
    );
    if (!inRange)
      diagnostics.push(
        "Harmonic coordinates are outside the declared square or nonfinite",
      );
    if (!(residual <= input.tolerance))
      diagnostics.push(
        "The original harmonic equations exceed their residual tolerance",
      );
    if (failedTriangles.length)
      diagnostics.push(
        `${failedTriangles.length} private chart triangles have unresolved parameter orientation`,
      );
    return {
      parameters,
      qualified:
        inRange &&
        residual <= input.tolerance &&
        failedTriangles.length === 0 &&
        diagnostics.length === 0,
      iterations,
      residual,
      failedTriangles,
      diagnostics,
    };
  }
}
