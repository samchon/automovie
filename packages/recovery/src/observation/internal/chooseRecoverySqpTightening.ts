import type {
  IAutoMovieRecoverySqpTightening,
  IAutoMovieSimplexAtom,
} from "@automovie/interface";

/*
 * Price strict inward margin against the current mixed direction's descent.
 */
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
    !(sqpNorm > 0 && sqpNorm < 1)
  )
    throw new Error(
      "camera-sqp: admitted correction rows, dual and directions required",
    );
  const original: number = mixedNorm ** 2.5;
  const result: IAutoMovieRecoverySqpTightening = {
    ceiling: original !== Infinity ? original : null,
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
    if (axis < 0 || axis >= mixed.length)
      throw new Error(
        "camera-sqp: finite physical objective coordinates required",
      );
    slope += coefficient * mixed[axis]!;
  }
  const descent: number = -slope;
  const unbounded: boolean = descent === Infinity || descent === -Infinity;
  result.descent = unbounded ? null : descent;
  if (!(original > 0) || original === Infinity) return result;
  if (!(descent > 0) || unbounded) {
    result.reason = "descent-unresolved";
    return result;
  }
  let price: number = 0,
    previous: number = 0;
  for (let at: number = 0; at < selected.length; at++) {
    const index: number = selected[at]!,
      multiplier: number = multipliers[at]!;
    if (index <= previous || index >= rows.length || multiplier < 0)
      throw new Error("camera-sqp: ordered original correction dual required");
    previous = index;
    const row: IAutoMovieSimplexAtom = rows[index]!;
    if (row.indices.length !== row.values.length)
      throw new Error("camera-sqp: admitted physical correction row required");
    let norm: number = 0;
    for (let entry: number = 0; entry < row.values.length; entry++) {
      const axis: number = row.indices[entry]!,
        coefficient: number = row.values[entry]!;
      if (axis < 0 || axis >= mixed.length)
        throw new Error("camera-sqp: finite physical correction row required");
      norm = Math.hypot(norm, coefficient);
    }
    const product: number = multiplier * norm;
    if (
      !(norm > 0) ||
      norm === Infinity ||
      product === Infinity ||
      (multiplier > 0 && !(product > 0))
    ) {
      result.reason = "multiplier-price-unresolved";
      return result;
    }
    price += product;
    if (price === Infinity) {
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
    available === Infinity ||
    !(cap > 0) ||
    cap === Infinity
  ) {
    result.reason = "cap-unresolved";
    return result;
  }
  result.value = Math.min(original, cap);
  result.reason = cap < original ? "objective-cap" : "original-ceiling";
  return result;
}
