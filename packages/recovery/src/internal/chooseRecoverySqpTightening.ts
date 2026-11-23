import type {
  IAutoMovieRecoverySqpTightening,
  IAutoMovieSimplexAtom,
} from "@automovie/interface";

/** Price strict inward margin against the current mixed direction's descent. */
export function chooseRecoverySqpTightening(
  rows: readonly IAutoMovieSimplexAtom[],
  selected: readonly number[],
  multipliers: readonly number[],
  mixed: readonly number[],
  sqpNorm: number,
  mixedNorm: number,
): IAutoMovieRecoverySqpTightening {
  if (
    rows.length < 1 ||
    mixed.length < 1 ||
    selected.length !== multipliers.length ||
    !(sqpNorm > 0 && sqpNorm < 1) ||
    !Number.isFinite(sqpNorm) ||
    !mixed.every(Number.isFinite)
  )
    throw new Error(
      "camera-sqp: admitted correction rows, dual and directions required",
    );
  const original: number = mixedNorm ** 2.5;
  const result: IAutoMovieRecoverySqpTightening = {
    ceiling: Number.isFinite(original) ? original : null,
    value: null,
    descent: null,
    multiplierPrice: null,
    reason: "tightening-unresolved",
  };
  const objective: IAutoMovieSimplexAtom = rows[0]!;
  if (objective.indices.length !== objective.values.length)
    throw new Error("camera-sqp: admitted physical objective required");
  let slope: number = 0;
  for (let at: number = 0; at < objective.indices.length; at++) {
    const axis: number = objective.indices[at]!,
      coefficient: number = objective.values[at]!;
    if (
      !Number.isSafeInteger(axis) ||
      axis < 0 ||
      axis >= mixed.length ||
      !Number.isFinite(coefficient)
    )
      throw new Error(
        "camera-sqp: finite physical objective coordinates required",
      );
    slope += coefficient * mixed[axis]!;
  }
  const descent: number = -slope;
  result.descent = Number.isFinite(descent) ? descent : null;
  if (!(original > 0) || !Number.isFinite(original)) return result;
  if (!(descent > 0) || !Number.isFinite(descent)) {
    result.reason = "descent-unresolved";
    return result;
  }
  let price: number = 0,
    previous: number = 0;
  for (let at: number = 0; at < selected.length; at++) {
    const index: number = selected[at]!,
      multiplier: number = multipliers[at]!;
    if (
      !Number.isSafeInteger(index) ||
      index <= previous ||
      index >= rows.length ||
      !Number.isFinite(multiplier) ||
      multiplier < 0
    )
      throw new Error("camera-sqp: ordered original correction dual required");
    previous = index;
    const row: IAutoMovieSimplexAtom = rows[index]!;
    if (row.indices.length !== row.values.length)
      throw new Error("camera-sqp: admitted physical correction row required");
    let norm: number = 0;
    for (let entry: number = 0; entry < row.values.length; entry++) {
      const axis: number = row.indices[entry]!,
        coefficient: number = row.values[entry]!;
      if (
        !Number.isSafeInteger(axis) ||
        axis < 0 ||
        axis >= mixed.length ||
        !Number.isFinite(coefficient)
      )
        throw new Error("camera-sqp: finite physical correction row required");
      norm = Math.hypot(norm, coefficient);
    }
    const product: number = multiplier * norm;
    if (
      !(norm > 0) ||
      !Number.isFinite(norm) ||
      !Number.isFinite(product) ||
      (multiplier > 0 && !(product > 0))
    ) {
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
  const available: number = Math.sqrt(sqpNorm) * descent,
    cap: number = available / price;
  if (
    !(available > 0) ||
    !Number.isFinite(available) ||
    !(cap > 0) ||
    !Number.isFinite(cap)
  ) {
    result.reason = "cap-unresolved";
    return result;
  }
  result.value = Math.min(original, cap);
  result.reason = cap < original ? "objective-cap" : "original-ceiling";
  return result;
}
