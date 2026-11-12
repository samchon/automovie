import { type IAutoMovieMark, markAutoMovieSlip } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * Planted contacts become segments from where they were planted to where they are, flagged when their horizontal travel exceeds their limit.
 *
 * Scenarios:
 *
 * 1. A foot planted at the origin and now 3 cm along X, with a 2 cm limit, gives one flagged `slip` segment from the plant to the foot.
 * 2. The same foot with a 5 cm limit is drawn unflagged; a foot that rose 10 cm straight up has not moved horizontally and draws nothing.
 * 3. A limit that is negative or not finite and a point that is not finite are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the engine producer on contacts the test writes and reads the returned marks' paths, shapes and flags.
 * @evidence contracts/development/testing.md#independent-expectations Travel is measured by hand in the horizontal plane, as the documented skate bound measures it, and compared with the authored limits.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts travel above and below the limit, horizontal against vertical motion, and valid against refused inputs. The skate validation itself belongs to its own tests.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit writes its own inputs and starts no solver, browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A foot planted at the origin and now 3 cm along X, with a 2 cm limit).
 */
export function test_mark_slip(): void {
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
    [
      "an infinite limit",
      foot({ x: 0.03, y: 0, z: 0 }, Number.POSITIVE_INFINITY),
    ],
    ["a non-finite point", foot({ x: Number.NaN, y: 0, z: 0 }, 0.02)],
  ] as const)
    TestValidator.error(`${title} is refused`, (): void => {
      markAutoMovieSlip([entry]);
    });
}
