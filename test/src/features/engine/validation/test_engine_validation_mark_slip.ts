import {
  markSlip
} from "../../../../../packages/engine/src/validation/internal/markSlip";
import type { IAutoMovieMark, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `markSlip` draws each planted contact as a segment from its plant to
 * where it is, flagged when its horizontal travel exceeds its limit.
 *
 * Scenarios:
 *
 * 1. A foot planted at the origin and now 3 cm along x with a 2 cm limit gives one
 *    flagged `slip` segment `hero/leftFoot/slip` from (0,0,0) to (0.03,0,0).
 * 2. With a 5 cm limit it is unflagged; a foot risen 10 cm straight up has no
 *    horizontal travel and draws nothing.
 * 3. A negative limit is refused.
 */
export function test_engine_validation_mark_slip(): void {
  const foot = (at: IAutoMovieVector3, limit: number) => ({
    path: "hero/leftFoot",
    planted: { x: 0, y: 0, z: 0 },
    at,
    limit,
  });

  // 1.
  TestValidator.equals(
    "flagged slip",
    markSlip([foot({ x: 0.03, y: 0, z: 0 }, 0.02)]).map(
      (mark: IAutoMovieMark) => [
        mark.path,
        mark.kind,
        mark.flagged,
        mark.shape,
      ],
    ),
    [
      [
        "hero/leftFoot/slip",
        "slip",
        true,
        { type: "segments", points: [0, 0, 0, 0.03, 0, 0] },
      ],
    ],
  );

  // 2.
  TestValidator.equals(
    "unflagged and risen",
    [
      markSlip([foot({ x: 0.03, y: 0, z: 0 }, 0.05)])[0]!.flagged,
      markSlip([foot({ x: 0, y: 0.1, z: 0 }, 0.02)]).length,
    ],
    [false, 0],
  );

  // 3.
  TestValidator.error("negative limit", (): void => {
    markSlip([foot({ x: 0.03, y: 0, z: 0 }, -1)]);
  });
}
