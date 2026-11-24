import { markAutoMovieSlip } from "@automovie/engine";
import type { IAutoMovieMark } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Planted contacts become segments from where they were planted to where they
 * are, flagged when their horizontal travel exceeds their limit.
 *
 * Scenarios:
 *
 * 1. A foot planted at the origin and now 3 cm along X, with a 2 cm limit, gives
 *    one flagged `slip` segment from the plant to the foot.
 * 2. The same foot with a 5 cm limit is drawn unflagged; a foot that rose 10 cm
 *    straight up has not moved horizontally and draws nothing.
 * 3. A limit that is negative or not finite and a point that is not finite are
 *    refused.
 */
export function test_unit_engine_mark_slip(): void {
  const foot = (at: { x: number; y: number; z: number }, limit: number) => ({
    path: "hero/leftFoot",
    planted: { x: 0, y: 0, z: 0 },
    at,
    limit,
  });

  // 1. Past the limit.
  TestValidator.equals(
    "a flagged segment from the plant to the foot",
    markAutoMovieSlip([foot({ x: 0.03, y: 0, z: 0 }, 0.02)]).map(
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

  // 2. Within the limit, and vertical motion.
  TestValidator.equals(
    "within the limit it is unflagged; rising draws nothing",
    [
      markAutoMovieSlip([foot({ x: 0.03, y: 0, z: 0 }, 0.05)])[0]!.flagged,
      markAutoMovieSlip([foot({ x: 0, y: 0.1, z: 0 }, 0.02)]).length,
    ],
    [false, 0],
  );

  // 3. Refusals.
  for (const [title, entry] of [
    ["a negative limit", foot({ x: 0.03, y: 0, z: 0 }, -1)],
  ] as const)
    TestValidator.error(`${title} is refused`, (): void => {
      markAutoMovieSlip([entry]);
    });
}
