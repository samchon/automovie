/**
 * Private Dirichlet parameterization of an observed triangulated chart.
 * Original source incidence is used only by observation and never returned.
 *
 * @evidence contracts/common.md#principled-implementation Positive uniform graph weights define a discrete harmonic map with fixed boundary values; every free component must reach a fixed vertex and every output triangle is independently checked for positive parameter area.
 * @evidence contracts/common.md#clear-and-simple-design One private numerical owner separates chart registration from subsequent coefficient fitting and engine generation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source triangle is published as generated geometry, no folded parameter face is silently flipped, and no parameter is clipped into the domain.
 * @evidence contracts/common.md#meaningful-documentation States private source lifetime, fixed-boundary responsibility and explicit numerical and orientation qualification.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Namespace initialization computes nothing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No global cache exists.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Input and output lifetime belongs to the observation caller.
 */
export namespace RecoveryChartMap {
  /**
   * Private chart incidence with an already ordered, curve-registered boundary.
   *
   * @evidence contracts/common.md#principled-implementation Source vertex identities and triangle edges define positive harmonic weights; boundary coordinates carry the declared curve correspondence.
   * @evidence contracts/common.md#clear-and-simple-design The topology owner supplies a chart and the map owner solves only its interior parameters.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither disk topology nor material correspondence is inferred from endpoint count or distance.
   * @evidence contracts/common.md#meaningful-documentation Records private addresses, normalized coordinates, numerical tolerance and finite work limits.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no solve.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No cache is owned by the record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The observation caller owns all arrays.
   */
  export interface Input {
    /** Number of private observation vertices, including clipped edge observations. */
    vertices: number;

    /** Coherently oriented private chart triangles; never generation input. */
    triangles: readonly (readonly [number, number, number])[];

    /** Fixed normalized square-chart values, once per named boundary or guide vertex. */
    fixed: readonly { vertex: number; u: number; v: number }[];

    /** Positive absolute linear-equation residual tolerance in normalized chart units. */
    tolerance: number;

    /** Positive maximum conjugate-gradient iterations for each coordinate. */
    maxIterations: number;
  }

  /**
   * Observation-only coordinates and complete numerical/orientation findings.
   *
   * @evidence contracts/common.md#principled-implementation The returned harmonic coordinates retain fixed values and independently computed signed areas for every original chart triangle.
   * @evidence contracts/common.md#clear-and-simple-design Linear convergence and parameter orientation qualify different properties and remain separate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Folded or collapsed triangles remain explicit; a converged solve does not certify a valid disk chart or a fitted surface.
   * @evidence contracts/common.md#meaningful-documentation States coordinate order, residual meaning, private witnesses and limited qualification.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Coordinates are reused by fitting for this same private chart only.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns returned parameters and failed-face addresses.
   */
  export interface Result {
    /** Normalized chart coordinates in private input-vertex order. */
    parameters: [number, number][];

    /** True only when both linear residuals and all signed parameter areas pass. */
    qualified: boolean;

    /** Coordinate-wise actual iteration counts. */
    iterations: [number, number];

    /** Largest independently reconstructed linear-equation residual. */
    residual: number;

    /** Private triangle ordinals with nonpositive or nonfinite signed parameter area. */
    failedTriangles: number[];

    /** Solver, range and orientation limitations; no failure is repaired here. */
    diagnostics: string[];
  }

  /**
   * Solve a positive-weight Dirichlet graph Laplacian with diagonal PCG.
   * Anchoring every connected component makes the free matrix positive definite.
   * The caller still establishes disk topology and a compatible boundary map;
   * positive computed triangle areas are checked rather than assumed from that premise.
   *
   * @evidence contracts/common.md#principled-implementation Diagonally preconditioned conjugate gradients solve the symmetric free graph Laplacian with fixed-neighbor right-hand sides; all original equations and parameter triangles are checked after solving.
   * @evidence contracts/common.md#clear-and-simple-design One admitted adjacency graph serves anchoring, both coordinate solves and residual reconstruction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No source position is a generating control, no missing anchor is guessed, and solver failure or a folded UV face remains unqualified without clipping or triangle reversal.
   * @evidence contracts/common.md#meaningful-documentation States anchoring, positive-definiteness premises, binary64 residuals and separate topological/fitting obligations.
   * @evidence contracts/performance.md#efficient-algorithms For V private vertices, E graph edges and I iterations per coordinate, admission is O(V+E), solving O(I(V+E)), and storage O(V+E); conditioning controls the required iteration count.
   * @evidence contracts/performance.md#reuse-equivalent-work One undirected adjacency and free-index registry are reused for u, v and independent original-equation residuals.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Adjacency and PCG arrays are local and released on return or refusal; only parameters and diagnostic witnesses escape to the private observation caller.
   */
  export function parameterize(input: Input): Result {
    if (
      !Number.isSafeInteger(input.vertices) ||
      input.vertices < 3 ||
      !input.triangles.length ||
      !(input.tolerance > 0 && Number.isFinite(input.tolerance)) ||
      !Number.isSafeInteger(input.maxIterations) ||
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
        if (
          !Number.isSafeInteger(a) ||
          a < 0 ||
          a >= input.vertices ||
          !Number.isSafeInteger(b) ||
          b < 0 ||
          b >= input.vertices
        )
          throw new Error("Private chart triangle addresses are invalid");
        adjacency[a]!.add(b);
        adjacency[b]!.add(a);
      }
    }
    const fixed: Map<number, [number, number]> = new Map();
    for (const value of input.fixed) {
      if (
        !Number.isSafeInteger(value.vertex) ||
        value.vertex < 0 ||
        value.vertex >= input.vertices ||
        fixed.has(value.vertex) ||
        ![value.u, value.v].every(
          (x: number): boolean => Number.isFinite(x) && x >= 0 && x <= 1,
        )
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
        if (
          !(denominator > 0 && Number.isFinite(denominator)) ||
          !Number.isFinite(product)
        ) {
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
        if (!(area > 0 && Number.isFinite(area))) failedTriangles.push(i);
      },
    );
    const inRange: boolean = parameters.every((p: [number, number]): boolean =>
      p.every((x: number): boolean => Number.isFinite(x) && x >= 0 && x <= 1),
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
