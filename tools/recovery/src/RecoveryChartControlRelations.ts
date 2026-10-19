/**
 * Eliminate acyclic affine control relations without changing their coefficients.
 * Original control IDs remain the independent term addresses; they are never
 * replaced by compact solver slots. Fixed positions and returned constants are
 * millimetres. Relations may have signed weights or sums other than one.
 * Equal terms combine, exact zero sums disappear, and fixed terms fold into the
 * constant. No epsilon deletion, weight normalization or convexity repair occurs.
 *
 * maxTerms bounds each intermediate flattened provenance map, including fixed
 * sources, and every final independent expression. maxDepth counts relation
 * edges; fixed and independent controls have depth zero. Cycles are rejected
 * even when a declared dependency has zero weight or later cancels.
 * Weight diagnostics describe flattened fixed and independent source weights
 * before fixed-position folding. They do not certify a dependent enclosure.
 * Invalid identities, conflicts, budget exhaustion or nonfinite arithmetic throw
 * without mutating input or returning a partial relation system.
 *
 * @evidence contracts/common.md#principled-implementation A depth-first dependency order composes finite affine expressions over original fixed and independent controls. Folding fixed sources is an algebraic substitution; binary64 rounding remains separate from exact affine equivalence.
 * @evidence contracts/common.md#clear-and-simple-design One pure operation validates ownership, resolves the dependency DAG and publishes sparse solver expressions with separate coefficient diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source geometry, identity inference, diagonal floor, epsilon pruning, negative-weight clamp, normalization or post-fit enclosure adjustment changes the supplied relations.
 * @evidence contracts/common.md#meaningful-documentation States original term IDs, millimetres, budget counting, zero and cycle semantics, affine diagnostics, binary64 limits and atomic failure.
 * @evidence contracts/performance.md#efficient-algorithms For C controls, E declared dependency terms and T=maxTerms, expansion costs O(C+E*T) before sorting, with O(C*T*log(T+1)) worst-case output sorting and O(C*T+E) retained work. Each intermediate map is checked against T and traversal depth against maxDepth.
 * @evidence contracts/performance.md#reuse-equivalent-work Every control expression and its depth are computed once and reused by all dependent relations; repeated source IDs combine in a bounded map. There is no cross-call cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-local ownership maps, traversal state and flattened expressions expire on return or throw. Outputs own their arrays; controls and explicit sparse/depth budgets bound retained data, and no handles or input arrays escape.
 */
export function RecoveryChartControlRelations(input: {
  /** Nonnegative native-array control count, at most 2^32-1 original IDs. */
  controls: number;
  /** Each listed control has exactly this finite millimetre position. */
  fixed: readonly { id: number; pointMm: readonly [number, number, number] }[];
  /** Dependent controls and their finite weighted original-ID expressions. */
  relations: readonly {
    id: number;
    terms: readonly { id: number; weight: number }[];
  }[];
  /** Positive safe cap on intermediate provenance and final independent terms. */
  maxTerms: number;
  /** Nonnegative safe cap on the relation-edge dependency depth. */
  maxDepth: number;
}): {
  /** Unowned original IDs, in ascending order; these are the free variables. */
  independent: number[];
  /** One sparse millimetre expression per original control, in input ID order. */
  expressions: {
    constant: [number, number, number];
    terms: { id: number; weight: number }[];
  }[];
  /** Largest final independent term count, excluding folded fixed sources. */
  maximumTerms: number;
  /** Largest declared relation-edge depth, including zero-weight dependencies. */
  maximumDepth: number;
  /** Least retained flattened source weight; zero for an empty expression. */
  minimumWeight: number;
  /** Largest absolute deviation of pre-folding source weight sum from one. */
  maximumWeightSumError: number;
} {
  if (
    !input ||
    !Number.isSafeInteger(input.controls) ||
    input.controls < 0 ||
    input.controls > 0xffffffff ||
    !Array.isArray(input.fixed) ||
    !Array.isArray(input.relations) ||
    !Number.isSafeInteger(input.maxTerms) ||
    input.maxTerms < 1 ||
    !Number.isSafeInteger(input.maxDepth) ||
    input.maxDepth < 0
  )
    throw new Error(
      "A representable control count and finite sparse/depth budgets are required",
    );
  const fixed: Map<number, readonly [number, number, number]> = new Map();
  const relations: Map<number, readonly { id: number; weight: number }[]> =
    new Map();
  for (const entry of input.fixed) {
    if (
      !entry ||
      !Number.isSafeInteger(entry.id) ||
      entry.id < 0 ||
      entry.id >= input.controls ||
      fixed.has(entry.id) ||
      !Array.isArray(entry.pointMm) ||
      entry.pointMm.length !== 3 ||
      ![0, 1, 2].every((axis: number): boolean =>
        Number.isFinite(entry.pointMm[axis]),
      )
    )
      throw new Error(
        "Fixed controls require unique valid IDs and finite millimetre positions",
      );
    fixed.set(entry.id, entry.pointMm);
  }
  for (const entry of input.relations) {
    if (
      !entry ||
      !Number.isSafeInteger(entry.id) ||
      entry.id < 0 ||
      entry.id >= input.controls ||
      fixed.has(entry.id) ||
      relations.has(entry.id) ||
      !Array.isArray(entry.terms)
    )
      throw new Error(
        "A control may have one fixed owner or one valid affine relation",
      );
    for (const term of entry.terms)
      if (
        !term ||
        !Number.isSafeInteger(term.id) ||
        term.id < 0 ||
        term.id >= input.controls ||
        !Number.isFinite(term.weight)
      )
        throw new Error(
          "Affine terms require valid original control IDs and finite weights",
        );
    relations.set(entry.id, entry.terms);
  }
  const independent: number[] = [],
    flattened: Map<number, number>[] = new Array(input.controls);
  const states: Uint8Array = new Uint8Array(input.controls),
    depths: Float64Array = new Float64Array(input.controls);
  for (let id: number = 0; id < input.controls; id++)
    if (!relations.has(id)) {
      flattened[id] = new Map([[id, 1]]);
      states[id] = 2;
      if (!fixed.has(id)) independent.push(id);
    }
  let maximumDepth: number = 0;
  for (const id of relations.keys()) {
    if (states[id] === 2) continue;
    if (input.maxDepth === 0)
      throw new Error("An affine relation exceeds maxDepth");
    const stack: { id: number; next: number }[] = [{ id, next: 0 }];
    states[id] = 1;
    while (stack.length) {
      const frame: { id: number; next: number } = stack.at(-1)!;
      const terms: readonly { id: number; weight: number }[] = relations.get(
        frame.id,
      )!;
      if (frame.next < terms.length) {
        const target: number = terms[frame.next++]!.id;
        if (states[target] === 1)
          throw new Error(
            "Affine control relations contain a dependency cycle",
          );
        if (states[target] === 0) {
          if (stack.length >= input.maxDepth)
            throw new Error("Affine dependency traversal exceeds maxDepth");
          states[target] = 1;
          stack.push({ id: target, next: 0 });
        }
        continue;
      }
      const result: Map<number, number> = new Map();
      let depth: number = 1;
      for (const term of terms) {
        depth = Math.max(depth, depths[term.id]! + 1);
        if (depth > input.maxDepth)
          throw new Error("An affine expression exceeds maxDepth");
        for (const [source, weight] of flattened[term.id]!) {
          const product: number = term.weight * weight,
            combined: number = (result.get(source) ?? 0) + product;
          if (!Number.isFinite(product) || !Number.isFinite(combined))
            throw new Error("Affine coefficient composition became nonfinite");
          if (combined === 0) result.delete(source);
          else result.set(source, combined);
          if (result.size > input.maxTerms)
            throw new Error("Affine provenance composition exceeds maxTerms");
        }
      }
      flattened[frame.id] = result;
      depths[frame.id] = depth;
      maximumDepth = Math.max(maximumDepth, depth);
      states[frame.id] = 2;
      stack.pop();
    }
  }
  const expressions: ReturnType<
    typeof RecoveryChartControlRelations
  >["expressions"] = [];
  let maximumTerms: number = 0,
    minimumWeight: number = Infinity,
    maximumWeightSumError: number = 0;
  for (let id: number = 0; id < input.controls; id++) {
    const sources: [number, number][] = [...flattened[id]!.entries()].sort(
      (a: [number, number], b: [number, number]): number => a[0] - b[0],
    );
    const constant: [number, number, number] = [0, 0, 0],
      terms: { id: number; weight: number }[] = [];
    let weightSum: number = 0;
    if (!sources.length) minimumWeight = Math.min(minimumWeight, 0);
    for (const [source, weight] of sources) {
      minimumWeight = Math.min(minimumWeight, weight);
      weightSum += weight;
      if (!Number.isFinite(weightSum))
        throw new Error("An affine source-weight sum became nonfinite");
      const point: readonly [number, number, number] | undefined =
        fixed.get(source);
      if (point)
        for (let axis: number = 0; axis < 3; axis++) {
          const product: number = weight * point[axis]!,
            sum: number = constant[axis]! + product;
          if (!Number.isFinite(product) || !Number.isFinite(sum))
            throw new Error("A folded affine position became nonfinite");
          constant[axis] = sum;
        }
      else terms.push({ id: source, weight });
    }
    if (terms.length > input.maxTerms)
      throw new Error("An independent affine expression exceeds maxTerms");
    maximumWeightSumError = Math.max(
      maximumWeightSumError,
      Math.abs(weightSum - 1),
    );
    maximumTerms = Math.max(maximumTerms, terms.length);
    expressions.push({ constant, terms });
  }
  return {
    independent,
    expressions,
    maximumTerms,
    maximumDepth,
    minimumWeight: minimumWeight === Infinity ? 0 : minimumWeight,
    maximumWeightSumError,
  };
}
