import type { IAutoMovieCurve64 as C } from "../../../packages/engine/src/geometry/curve/IAutoMovieCurve64.ts";
import { compileAutoMovieNormalizedPhases64 } from "../../../packages/engine/src/geometry/curve/compileAutoMovieNormalizedPhases64.ts";

/**
 * Normalize the saved open-course phase and optionally reverse its declared direction.
 * Physical coefficients remain unchanged; reversing a span reverses its control order
 * and widths together. The last normalized width closes the binary64 prefix exactly.
 *
 * @evidence contracts/common.md#principled-implementation Positive saved widths normalize one existing parameter chart; explicit reversal changes control and interval order together without fitting new geometry.
 * @evidence contracts/common.md#clear-and-simple-design One pure owner admits and normalizes a complete saved course for the open-field engine.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source mesh, nearest correspondence, copied normals, positional weld or coefficient correction enters this operation.
 * @evidence contracts/common.md#meaningful-documentation States phase normalization, physical preservation, explicit reversal and unrepresentable prefix refusal.
 * @evidence contracts/performance.md#efficient-algorithms N spans and widths require O(N) time and output storage.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure per-course operation has no cross-call cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the immutable input; normalized arrays transfer to the run invocation and no handle or global state survives.
 */
export function normalizeRecoveryCourse(
  curve: C.Cubic,
  reverse: boolean,
): C.Cubic {
  if (
    curve.closed ||
    curve.unit !== "mm" ||
    curve.phaseIntervals.length !== curve.spans.length
  )
    throw new Error("Saved open cubic millimetre authority required");
  const widths: number[] = reverse
    ? [...curve.phaseIntervals].reverse()
    : [...curve.phaseIntervals];
  const total: number = widths.reduce(
    (sum: number, h: number): number => sum + h,
    0,
  );
  if (!(total > 0 && Number.isFinite(total)))
    throw new Error("Open curve phase cannot be normalized");
  let prefix: number = 0;
  const phaseIntervals: number[] = widths.map(
    (width: number, i: number): number => {
      const value: number =
        i + 1 === widths.length ? 1 - prefix : width / total;
      if (!(value > 0 && Number.isFinite(value)))
        throw new Error("Normalized open phase interval is not representable");
      prefix += value;
      return value;
    },
  );
  const spans: C.Span[] = reverse
    ? [...curve.spans]
        .reverse()
        .map((span: C.Span): C.Span => [span[3], span[2], span[1], span[0]])
    : [...curve.spans];
  compileAutoMovieNormalizedPhases64(phaseIntervals, spans.length);
  return {
    ...curve,
    closed: false,
    phaseUnit: "normalized",
    phaseIntervals,
    spans,
  };
}
