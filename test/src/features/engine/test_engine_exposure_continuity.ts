import { AutoMovieEngineExposure } from "@automovie/engine";
import type { IAutoMovieCheckExposureContinuity } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/throwsError";

/**
 * Report exposure jumps between consecutive cuts of one screenplay scene.
 *
 * Scenarios:
 *
 * 1. Cuts of "INT. KITCHEN - NIGHT" at EV100 5.0, 5.2, 6.0, and 8.0 marked
 *    `change: true`, report exactly one finding, between the second and third
 *    cuts (0.8 stops).
 * 2. A cut of another group interleaved between the second and third cuts does not
 *    change the result.
 * 3. A tolerance of one stop reports nothing for the same cuts; a jump exactly at
 *    the tolerance is not reported.
 * 4. Two cuts with the same index throw.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the exported checker on ordered cuts and compares the full finding list; comparing with the previous cut of the film rather than of the group, reporting a decided change, or skipping the duplicate check fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected finding is the issue's worked example: 0.2 and 2.0 stop steps are under the default third of a stop or decided, and 0.8 is over it.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a decided change, an interleaved group, the tolerance boundary and a duplicate index. Metering belongs to test_engine_meter_illuminance.
 * @evidence contracts/development/testing.md#execution-ownership Portable CPU unit test discovered by its export name.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios with their EV100 values and expected findings.
 */
export function test_engine_exposure_continuity(): void {
  const kitchen: string = "INT. KITCHEN - NIGHT";
  const cuts: IAutoMovieCheckExposureContinuity.ICut[] = [
    { index: 0, group: kitchen, ev100: 5.0 },
    { index: 1, group: kitchen, ev100: 5.2 },
    { index: 2, group: kitchen, ev100: 6.0 },
    { index: 3, group: kitchen, ev100: 8.0, change: true },
  ];
  const expected: IAutoMovieCheckExposureContinuity.IFinding[] = [
    {
      group: kitchen,
      previousIndex: 1,
      previousEv100: 5.2,
      index: 2,
      ev100: 6.0,
    },
  ];
  TestValidator.equals(
    "one jump between the second and third cuts",
    AutoMovieEngineExposure.checkAutoMovieExposureContinuity({ cuts }),
    expected,
  );

  TestValidator.equals(
    "an interleaved location is compared only with its own cuts",
    AutoMovieEngineExposure.checkAutoMovieExposureContinuity({
      cuts: [
        cuts[0]!,
        cuts[1]!,
        { index: 7, group: "EXT. STREET - DAY", ev100: 14.5 },
        cuts[2]!,
        cuts[3]!,
      ],
    }),
    expected,
  );

  TestValidator.equals(
    "a wider tolerance reports nothing, and the boundary is allowed",
    [
      AutoMovieEngineExposure.checkAutoMovieExposureContinuity({ cuts, tolerance: 1 }),
      AutoMovieEngineExposure.checkAutoMovieExposureContinuity({
        cuts: [
          { index: 0, group: kitchen, ev100: 5 },
          { index: 1, group: kitchen, ev100: 5.5 },
        ],
        tolerance: 0.5,
      }),
    ],
    [[], []],
  );

  TestValidator.predicate(
    "two cuts with one index are refused",
    throwsError(
      (): IAutoMovieCheckExposureContinuity.IFinding[] =>
        AutoMovieEngineExposure.checkAutoMovieExposureContinuity({
          cuts: [cuts[0]!, { ...cuts[1]!, index: 0 }],
        }),
      "index 0",
    ),
  );
}
