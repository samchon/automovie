import type { IHumanSourceErrorInput } from "./structures/IHumanSourceErrorInput.ts";
import type { IHumanSourceReproductionError } from "./structures/IHumanSourceReproductionError.ts";

/**
 * Measure one representation against the published field in Float64 and in
 * Float32 vertex positions. Exact equality reports zero; nothing is
 * thresholded here, so a reader sees the actual residual of every row.
 */
export function measureHumanSourceError(input: IHumanSourceErrorInput): IHumanSourceReproductionError {
  const { published, candidate, neutral } = input;
  const count = published.length / 3;
  let maximum = 0;
  let float32 = 0;
  let squares = 0;
  let moving = 0;
  let differing = 0;
  for (let v = 0; v < count; v++) {
    const dx = candidate[3 * v] - published[3 * v];
    const dy = candidate[3 * v + 1] - published[3 * v + 1];
    const dz = candidate[3 * v + 2] - published[3 * v + 2];
    const e = Math.hypot(dx, dy, dz);
    if (e > 0) differing++;
    if (e > maximum) maximum = e;
    const moves =
      published[3 * v] !== 0 || published[3 * v + 1] !== 0 || published[3 * v + 2] !== 0 ||
      candidate[3 * v] !== 0 || candidate[3 * v + 1] !== 0 || candidate[3 * v + 2] !== 0;
    if (moves) {
      moving++;
      squares += e * e;
    }
    for (let c = 0; c < 3; c++) {
      const n = neutral[3 * v + c];
      const gap = Math.abs(Math.fround(n + candidate[3 * v + c]) - Math.fround(n + published[3 * v + c]));
      if (gap > float32) float32 = gap;
    }
  }
  return {
    maximumMetres: maximum,
    rmsMetres: moving === 0 ? 0 : Math.sqrt(squares / moving),
    float32MaximumMetres: float32,
    comparedVertices: count,
    differingVertices: differing,
  };
}
