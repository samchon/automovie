import type {
  IAutoMovieInspectionDiagnostics,
  IAutoMovieMotionHumanVerdicts,
} from "@automovie/interface";
import { HumanVerdictInspection } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * `HumanVerdictInspection` maps a verdict report to shared findings and
 * coverage: each performer covered on its sixteen bounds and each pair on
 * `partner`, the nine bounds the floor does not carry excluded for one who is
 * airborne; the readings of one bound of one performer collapse to its worst,
 * the timing faults of one performer to one finding; a finding naming nobody
 * given is refused.
 *
 * Scenarios, performers `a` on the floor and `b` swimming:
 *
 * 1. Coverage: 16 rows for each and 1 for the pair, 9 of `b`'s excluded.
 * 2. Two `slip` readings of `a`, 3 mm and 7 mm, are one finding keyed `a`; two
 *    timing faults of `a` are one finding; a `partner` reading of `a+b` is
 *    keyed by the pair.
 * 3. A finding on `c` is refused.
 */
export function test_unit_motions_audit_human_verdict_inspection(): void {
  const finding = (
    check: IAutoMovieMotionHumanVerdicts.IFinding["check"],
    subject: string,
    value: number,
    where: string = "stand",
  ): IAutoMovieMotionHumanVerdicts.IFinding => ({
    check,
    subject,
    value,
    limit: 0.005,
    seconds: value,
    where,
    act: "stand",
    instance: 1,
  });
  const report: IAutoMovieMotionHumanVerdicts.IReport = {
    clean: false,
    findings: [
      finding("slip", "a", 0.003),
      finding("slip", "a", 0.007),
      finding("timing", "a", 0, "1 stand: event ready twice"),
      finding("timing", "a", 0, "1 stand: event late at share 1.5"),
      finding("partner", "a+b", 0.02),
    ],
    unended: [],
  };
  const performers: IAutoMovieMotionHumanVerdicts.IPerformer[] = [
    { subject: "a", path: "film.performers[0]", airborne: false },
    { subject: "b", path: "film.performers[1]", airborne: true },
  ];
  const packet = HumanVerdictInspection(report, performers);
  const rows = (key: string): IAutoMovieInspectionDiagnostics.ICoverage[] =>
    packet.coverage.filter(
      (row: IAutoMovieInspectionDiagnostics.ICoverage): boolean =>
        row.key === key,
    );
  TestValidator.equals(
    "the coverage",
    [
      rows("a").length,
      rows("b").length,
      rows("b").filter(
        (row: IAutoMovieInspectionDiagnostics.ICoverage): boolean =>
          row.status === "excluded",
      ).length,
      rows("a+b").length,
    ],
    [16, 16, 9, 1],
  );
  TestValidator.equals(
    "the findings",
    packet.findings
      .map((f) => [f.check, f.key])
      .sort((x, y) => (JSON.stringify(x) < JSON.stringify(y) ? -1 : 1)),
    [
      ["human-partner", "a+b"],
      ["human-slip", "a"],
      ["human-timing", "a"],
    ],
  );
  TestValidator.predicate(
    "nobody given",
    throwsError(() =>
      HumanVerdictInspection(
        { ...report, findings: [finding("slip", "c", 0.01)] },
        performers,
      ),
    ),
  );
}
