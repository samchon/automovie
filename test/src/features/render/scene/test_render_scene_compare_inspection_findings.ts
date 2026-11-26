import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";
import { AutoMovieRenderInspection } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `compareAutoMovieInspectionFindings` orders two findings of one identity:
 * confirmed before candidate, then an error before a warning, then the larger
 * witness rank, with no rank lowest.
 *
 * Scenarios, each returning 1 when the current finding is worse:
 *
 * 1. Confirmed against candidate is 1, and the reverse -1, whatever the rank.
 * 2. With equal confidence, an error against a warning is 1.
 * 3. With both equal, rank 3 against 2 is 1, rank 2 against none is 1, and equal
 *    ranks are 0.
 */
export function test_render_scene_compare_inspection_findings(): void {
  const finding: (
    confidence: IAutoMovieInspectionDiagnostics.IFinding["confidence"],
    category: IAutoMovieInspectionDiagnostics.IFinding["category"],
    rank?: number,
  ) => IAutoMovieInspectionDiagnostics.IFinding = (
    confidence: IAutoMovieInspectionDiagnostics.IFinding["confidence"],
    category: IAutoMovieInspectionDiagnostics.IFinding["category"],
    rank?: number,
  ): IAutoMovieInspectionDiagnostics.IFinding => ({
    check: "c",
    key: "k",
    code: "x",
    paths: [],
    category,
    confidence,
    message: "",
    witness: rank === undefined ? {} : { rank },
  });
  TestValidator.equals(
    "orders",
    [
      [finding("confirmed", "warning"), finding("candidate", "error", 9)],
      [finding("candidate", "error", 9), finding("confirmed", "warning")],
      [finding("candidate", "error"), finding("candidate", "warning", 9)],
      [finding("confirmed", "error", 3), finding("confirmed", "error", 2)],
      [finding("confirmed", "error", 2), finding("confirmed", "error")],
      [finding("confirmed", "error", 2), finding("confirmed", "error", 2)],
    ].map(([current, previous]): number =>
      AutoMovieRenderInspection.compareFindings(current!, previous!),
    ),
    [1, -1, 1, 1, 1, 0],
  );
}
