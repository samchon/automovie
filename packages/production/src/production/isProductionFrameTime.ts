import { IAutoMovieProductionFrameRate } from "@automovie/interface";
import { resolveProductionFrameRate } from "@automovie/engine";

/**
 * Return whether nonnegative finite seconds exactly equal a safe integer frame on the supplied rational or integer frame clock.
 *
 * @evidence contracts/common.md#principled-implementation The shared rate resolver owns canonical reduction and refusal; its exceptions become false. Equality is binary64 equality to frame * denominator / numerator, without an epsilon or nearest-time correction.
 * @evidence contracts/common.md#clear-and-simple-design The shared rate resolver owns rational admission; this public predicate owns exact frame membership for graph validation and existing review consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The equality compares the reconstructed binary64 frame time directly; resolver refusal returns false, without an epsilon, nearby-frame substitution or consumer-specific exception.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms One rational reduction and fixed arithmetic are independent of graph size; Euclidean reduction depends on the rate terms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
 */
export const isProductionFrameTime: (time: number, input: number | IAutoMovieProductionFrameRate) => boolean = (
  time: number,
  input: number | IAutoMovieProductionFrameRate,
): boolean => {
  if (Number.isFinite(time) === false || time < 0) return false;
  try {
    const frameRate: IAutoMovieProductionFrameRate =
      typeof input === "number"
        ? resolveProductionFrameRate({ fps: input })
        : resolveProductionFrameRate({
            fps: input.numerator / input.denominator,
            frameRate: input,
          });
    const frame: number = Math.round(
      (time * frameRate.numerator) / frameRate.denominator,
    );
    return (
      Number.isSafeInteger(frame) &&
      time === (frame * frameRate.denominator) / frameRate.numerator
    );
  } catch {
    return false;
  }
};
