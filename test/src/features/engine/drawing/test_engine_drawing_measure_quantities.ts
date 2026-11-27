import { AutoMovieEngineDrawing } from "@automovie/engine";
import type {
  AutoMovieQuantitySubject,
  IAutoMovieQuantityFinding,
  IAutoMovieQuantityReport,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { drawingEnvironment } from "../../internal/drawingFixtures";
import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * Agreement of a take-off with its hand calculation, in the unit of the
 * quantity.
 */
const TAKE_OFF: number = 1e-5;

/** The total of one subject, or null when the report has none. */
const total: (
  report: IAutoMovieQuantityReport,
  subject: AutoMovieQuantitySubject,
) => number | null = (
  report: IAutoMovieQuantityReport,
  subject: AutoMovieQuantitySubject,
): number | null =>
  report.findings.find(
    (finding: IAutoMovieQuantityFinding): boolean =>
      finding.subject === subject,
  )?.total ?? null;

/**
 * `measureQuantities` takes off counts, areas and volumes from a built
 * environment.
 *
 * Scenarios, on the authored atelier (6 elements; a 10 x 3 x 6 m hall and a 10
 * x 0.5 x 6 m roof deck; a door of 0.9 x 2.1 m, an oculus of two half circles
 * of radius 0.3 m, and a vent without a profile):
 *
 * 1. The report names its protocol and environment.
 * 2. There are 6 elements and 3 openings.
 * 3. The measured opening area is the door's 1.89 m^2 plus the oculus's circle of
 *    pi 0.3^2 = 0.282743 m^2.
 * 4. The space volume is 180 + 30 = 210 m^3.
 * 5. Five fixed gaps are declared as unsupported, and the same environment gives
 *    the same digest.
 * 6. A contributor bound below one is refused.
 */
export function test_engine_drawing_measure_quantities(): void {
  const report: IAutoMovieQuantityReport =
    AutoMovieEngineDrawing.measureAutoMovieQuantities({
      environment: drawingEnvironment(),
    });
  TestValidator.equals(
    "the protocol and the environment",
    [report.protocol, report.environment],
    ["automovie.quantity.v1", "atelier"],
  );
  TestValidator.equals(
    "counts",
    [total(report, "element-count"), total(report, "opening-count")],
    [6, 3],
  );
  TestValidator.predicate(
    "opening area",
    nclose(
      total(report, "opening-area") ?? Number.NaN,
      1.89 + Math.PI * 0.09,
      TAKE_OFF,
    ),
  );
  TestValidator.predicate(
    "space volume",
    nclose(total(report, "space-volume") ?? Number.NaN, 210, TAKE_OFF),
  );
  TestValidator.predicate(
    "gaps and a stable digest",
    ["material-quantity", "pattern-cut-waste", "opening-deduction"].every(
      (subject: string): boolean =>
        report.gaps.some(
          (gap: { subject: string; status: string }): boolean =>
            gap.subject === subject && gap.status === "unsupported",
        ),
    ) &&
      AutoMovieEngineDrawing.measureAutoMovieQuantities({
        environment: drawingEnvironment(),
      }).digest === report.digest,
  );
  TestValidator.predicate(
    "a zero contributor bound",
    throwsError(
      (): unknown =>
        AutoMovieEngineDrawing.measureAutoMovieQuantities({
          environment: drawingEnvironment(),
          maxContributors: 0,
        }),
      "contributor bound",
    ),
  );
}
