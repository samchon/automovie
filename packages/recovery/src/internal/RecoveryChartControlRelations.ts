import type { IAutoMovieRecoveryChartControlRelations } from "@automovie/interface";

/**
 * Eliminate acyclic affine control relations without changing their
 * coefficients. Original control IDs remain the independent term addresses;
 * they are never replaced by compact solver slots. Fixed positions and returned
 * constants are millimetres. Relations may have signed weights or sums other
 * than one. Equal terms combine, exact zero sums disappear, and fixed terms
 * fold into the constant. No epsilon deletion, weight normalization or
 * convexity repair occurs.
 *
 * MaxTerms bounds each intermediate flattened provenance map, including fixed
 * sources, and every final independent expression. maxDepth counts relation
 * edges; fixed and independent controls have depth zero. Cycles are rejected
 * even when a declared dependency has zero weight or later cancels. Weight
 * diagnostics describe flattened fixed and independent source weights before
 * fixed-position folding. They do not certify a dependent enclosure. Invalid
 * identities, conflicts, budget exhaustion or nonfinite arithmetic throw
 * without mutating input or returning a partial relation system.
 */
export function RecoveryChartControlRelations(
  input: Parameters<IAutoMovieRecoveryChartControlRelations.Operation>[0],
): ReturnType<IAutoMovieRecoveryChartControlRelations.Operation> {
  if (
    input.controls < 0 ||
    input.controls > 0xffffffff ||
    input.maxTerms < 1 ||
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
      entry.id < 0 ||
      entry.id >= input.controls ||
      fixed.has(entry.id) ||
      entry.pointMm.length !== 3
    )
      throw new Error(
        "Fixed controls require unique valid IDs and finite millimetre positions",
      );
    fixed.set(entry.id, entry.pointMm);
  }
  for (const entry of input.relations) {
    if (
      !entry ||
      entry.id < 0 ||
      entry.id >= input.controls ||
      fixed.has(entry.id) ||
      relations.has(entry.id)
    )
      throw new Error(
        "A control may have one fixed owner or one valid affine relation",
      );
    for (const term of entry.terms)
      if (!term || term.id < 0 || term.id >= input.controls)
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
  const expressions: ReturnType<IAutoMovieRecoveryChartControlRelations.Operation>["expressions"] =
    [];
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
      const point: readonly [number, number, number] | undefined =
        fixed.get(source);
      if (point)
        for (let axis: number = 0; axis < 3; axis++) {
          const product: number = weight * point[axis]!,
            sum: number = constant[axis]! + product;
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
