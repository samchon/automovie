import type { IAutoMovieMotionHumanAudit } from "@automovie/interface";
import {
  AutoMovieMotionHumanAudit
} from "../../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAudit";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieMotionHumanAudit.describe` formats the findings, with distances in
 * millimetres to a tenth and `speed` in metres per second to a hundredth, or
 * `clean`.
 *
 * Scenarios:
 *
 * 1. No finding reads `clean`.
 * 2. A 12.34 mm slip past 5 mm at 0.5 s on the left foot, and a 31.5 m/s speed
 *    past 30 at 1.25 s on the right hand, read on one line separated by `; `.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the clean message and the formatting of distance, speed and time in a two-finding report.
 * @evidence contracts/development/testing.md#behavioral-verification Passes a literal empty report and a typed report with slip and speed to Audit.describe and compares both strings exactly.
 * @evidence contracts/development/testing.md#independent-expectations The authored slip converts 0.01234 m to 12.3 mm at one decimal, while speed 31.5 is printed at two decimals. The recorded seconds, bounds and part names supply the other text directly.
 */
export function test_motions_audit_auto_movie_motion_human_audit_describe(): void {
  TestValidator.equals(
    "clean",
    AutoMovieMotionHumanAudit.describe({
      measures: {},
      pairs: [],
      findings: [],
    }),
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
