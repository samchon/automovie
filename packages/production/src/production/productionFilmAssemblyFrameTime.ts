import { IAutoMovieDiagnostic, IAutoMovieProductionFrameRate } from "@automovie/interface";
import { filmDiagnostic } from "./filmDiagnostic";

/**
 * Resolve an authored frame or seconds boundary to a nonnegative safe integer on the exact canonical frame grid; append a film diagnostic and return null on invalid boundaries.
 *
 * @evidence contracts/common.md#principled-implementation For seconds, rounding proposes a frame index and strict rational round-trip equality proves exact grid membership. Explicit frame values must already be integral; finite nonnegative values and safe indices are required. The caller supplies a canonical positive rational frame rate.
 * @evidence contracts/common.md#clear-and-simple-design The same scalar conversion is used for production runtime, video placements, transitions, and all timed tracks so their diagnostics follow one exact grid rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Strict equality retains the existing authored-time protocol rather than introducing epsilon or accepting an approximate rate. No fixture-specific time, nearest-grid repair, or failed boundary substitution is used.
 * @evidence contracts/common.md#meaningful-documentation The comment names input alternatives, output frame units, canonical rate premise, appended diagnostics, and null refusal. Floating seconds must round-trip exactly through the rational grid.
 * @evidence contracts/performance.md#efficient-algorithms A constant number of scalar arithmetic and safety checks determines each boundary, with one diagnostic allocation only when refused.
 * @evidence contracts/performance.md#reuse-equivalent-work Callers reuse the canonical rate while each authored boundary is checked independently. No cache is needed for this inexpensive scalar operation, and diagnostics remain per occurrence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary numbers disappear on return; the caller owns any appended diagnostic and the returned frame index. No buffers, handles, or tasks are acquired.
 */
export const productionFilmAssemblyFrameTime: (value: { frame: number; } | { seconds: number; }, frameRate: IAutoMovieProductionFrameRate, label: string, diagnostics: IAutoMovieDiagnostic[]) => number | null = (
  value: { frame: number } | { seconds: number },
  frameRate: IAutoMovieProductionFrameRate,
  label: string,
  diagnostics: IAutoMovieDiagnostic[],
): number | null => {
  const raw: number =
    "frame" in value
      ? value.frame
      : (value.seconds * frameRate.numerator) / frameRate.denominator;
  const rounded: number = Math.round(raw);
  if (
    Number.isFinite(raw) === false ||
    Number.isSafeInteger(rounded) === false ||
    rounded < 0 ||
    ("frame" in value
      ? value.frame !== rounded
      : value.seconds !==
        (rounded * frameRate.denominator) / frameRate.numerator)
  ) {
    const fps: number = frameRate.numerator / frameRate.denominator;
    diagnostics.push(
      filmDiagnostic(
        "film-time-off-grid",
        `${label} does not resolve to one non-negative safe production frame at ${fps} fps. Use an exact frame or frame-grid second.`,
      ),
    );
    return null;
  }
  return rounded;
};
