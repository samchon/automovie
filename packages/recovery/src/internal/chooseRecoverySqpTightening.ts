import type { IAutoMovieSimplexAtom } from "@automovie/engine/math/IAutoMovieSimplexAtom";

import type { IAutoMovieRecoverySqpTightening } from "../structures/internal/IAutoMovieRecoverySqpTightening";

/**
 * Price strict inward margin against the current mixed direction's descent.
 *
 * @evidence contracts/common.md#principled-implementation Uses r=norm(p_S), G=-f*p_M and W=sum(lambda_i*norm(A_i)) from one admitted physical chart and untilted QP. For W>0 choose min(norm(p_M)^2.5,sqrt(r)*G/W); structural W=0 retains the ceiling. The square-root exponent is the original 2.5 minus the quadratic model order, not an independent parameter. Comparable step norms, G>=c*r^2 and bounded W give a conditional 2.5-order margin; actual retraction, working stability, solve accuracy and Lagrangian consistency remain separate requirements.
 * @evidence contracts/common.md#clear-and-simple-design Scalar-only target preparation belongs to the current arc owner. It needs the physical objective dot and selected row norms, without a metric forward action or a new factor.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses original untilted multipliers without normalization or clipping. Positive-product underflow is not structural zero, and unresolved products, sums, descent or division supply no target. Nearest Float64 arithmetic is not an outward bound or a replacement for actual gates.
 * @evidence contracts/common.md#meaningful-documentation Borrows admitted rows, selected indices, nonnegative duals and the actual mixed step. Malformed ownership/dimensions throw; computed arithmetic refusal returns bounded finite-or-null metadata. Selected row norms and all norm units refer to the unchanged physical tangent chart.
 * @evidence contracts/performance.md#efficient-algorithms The width-n direction admission scan, one objective sparse dot and one selected-row norm/price scan cost O(n+Z_f+Z_E+H) visits and O(1) numerical scratch. The arc prepays these scans in its conservative linear reserve before calling, including when no correction is later requested.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the existing unmixed and mixed norms, physical rows and certified untilted dual. It performs no geometry evaluation, factorization, new model or trial.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a fixed scalar result transfers; borrowed rows, directions and multipliers are not retained.
 */
export function chooseRecoverySqpTightening(
  rows: readonly IAutoMovieSimplexAtom[],
  selected: readonly number[],
  multipliers: readonly number[],
  mixed: readonly number[],
  sqpNorm: number,
  mixedNorm: number,
): IAutoMovieRecoverySqpTightening {
  if (rows.length < 1 || mixed.length < 1 || selected.length !== multipliers.length ||
      !(sqpNorm > 0 && sqpNorm < 1) || !Number.isFinite(sqpNorm) || !mixed.every(Number.isFinite))
    throw new Error("camera-sqp: admitted correction rows, dual and directions required");
  const original: number = mixedNorm ** 2.5;
  const result: IAutoMovieRecoverySqpTightening = {
    ceiling: Number.isFinite(original) ? original : null, value: null,
    descent: null, multiplierPrice: null, reason: "tightening-unresolved",
  };
  const objective: IAutoMovieSimplexAtom = rows[0]!;
  if (objective.indices.length !== objective.values.length)
    throw new Error("camera-sqp: admitted physical objective required");
  let slope: number = 0;
  for (let at: number = 0; at < objective.indices.length; at++) {
    const axis: number = objective.indices[at]!, coefficient: number = objective.values[at]!;
    if (!Number.isSafeInteger(axis) || axis < 0 || axis >= mixed.length || !Number.isFinite(coefficient))
      throw new Error("camera-sqp: finite physical objective coordinates required");
    slope += coefficient * mixed[axis]!;
  }
  const descent: number = -slope;
  result.descent = Number.isFinite(descent) ? descent : null;
  if (!(original > 0) || !Number.isFinite(original)) return result;
  if (!(descent > 0) || !Number.isFinite(descent)) {
    result.reason = "descent-unresolved";
    return result;
  }
  let price: number = 0, previous: number = 0;
  for (let at: number = 0; at < selected.length; at++) {
    const index: number = selected[at]!, multiplier: number = multipliers[at]!;
    if (!Number.isSafeInteger(index) || index <= previous || index >= rows.length ||
        !Number.isFinite(multiplier) || multiplier < 0)
      throw new Error("camera-sqp: ordered original correction dual required");
    previous = index;
    const row: IAutoMovieSimplexAtom = rows[index]!;
    if (row.indices.length !== row.values.length)
      throw new Error("camera-sqp: admitted physical correction row required");
    let norm: number = 0;
    for (let entry: number = 0; entry < row.values.length; entry++) {
      const axis: number = row.indices[entry]!, coefficient: number = row.values[entry]!;
      if (!Number.isSafeInteger(axis) || axis < 0 || axis >= mixed.length || !Number.isFinite(coefficient))
        throw new Error("camera-sqp: finite physical correction row required");
      norm = Math.hypot(norm, coefficient);
    }
    const product: number = multiplier * norm;
    if (!(norm > 0) || !Number.isFinite(norm) || !Number.isFinite(product) ||
        (multiplier > 0 && !(product > 0))) {
      result.reason = "multiplier-price-unresolved";
      return result;
    }
    price += product;
    if (!Number.isFinite(price)) {
      result.reason = "multiplier-price-unresolved";
      return result;
    }
  }
  result.multiplierPrice = price;
  if (price === 0) {
    result.value = original;
    result.reason = "zero-multiplier-price";
    return result;
  }
  const available: number = Math.sqrt(sqpNorm) * descent, cap: number = available / price;
  if (!(available > 0) || !Number.isFinite(available) || !(cap > 0) || !Number.isFinite(cap)) {
    result.reason = "cap-unresolved";
    return result;
  }
  result.value = Math.min(original, cap);
  result.reason = cap < original ? "objective-cap" : "original-ceiling";
  return result;
}
