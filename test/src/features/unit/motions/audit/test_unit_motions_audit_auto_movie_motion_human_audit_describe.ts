import type { IAutoMovieMotionHumanAudit } from "@automovie/interface";
import { AutoMovieMotionHumanAudit } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieMotionHumanAudit.describe` writes one line per finding, metres in
 * millimetres to a tenth and `speed` in metres per second to a hundredth, or
 * `clean`.
 *
 * Scenarios:
 *
 * 1. No finding reads `clean`.
 * 2. A 12.34 mm slip past 5 mm at 0.5 s on the left foot, and a 31.5 m/s speed
 *    past 30 at 1.25 s on the right hand, read as two lines joined by `; `.
 */
export function test_unit_motions_audit_auto_movie_motion_human_audit_describe(): void {
  TestValidator.equals(
    "clean",
    AutoMovieMotionHumanAudit.describe({ measures: {}, pairs: [], findings: [] }),
    "clean",
  );
  const report: IAutoMovieMotionHumanAudit.IReport = {
    measures: {},
    pairs: [],
    findings: [
      {
        check: "slip",
        limit: 0.005,
        value: 0.01234,
        seconds: 0.5,
        where: "stand leftFoot",
      },
      {
        check: "speed",
        limit: 30,
        value: 31.5,
        seconds: 1.25,
        where: "rightHand",
      },
    ],
  };
  TestValidator.equals(
    "two findings",
    AutoMovieMotionHumanAudit.describe(report),
    "slip 12.3 mm > 5.0 at 0.500 s (stand leftFoot); speed 31.50 m/s > 30 at 1.250 s (rightHand)",
  );
}
