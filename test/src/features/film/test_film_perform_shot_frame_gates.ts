import { performShot, stageScene } from "@automovie/engine";
import {
  IAutoMovieCameraAction,
  type IAutoMoviePerformedShot,
  IAutoMovieSkeleton,
  type IAutoMovieStagedSet,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

const frame: (
  overrides: Partial<IAutoMovieCameraAction>,
) => IAutoMovieCameraAction = (
  overrides: Partial<IAutoMovieCameraAction>,
): IAutoMovieCameraAction => ({
  verb: "frame",
  actor: "cam-main",
  start: 0,
  duration: "auto",
  framing: "medium",
  move: "static",
  on: { kind: "node", node: "knightA" },
  ...overrides,
});

/**
 * Performs frame drafts and checks located refusals for a direction subject and overlapping and equal-start moves.
 *
 * Scenarios:
 * 1. Refuse a direction subject at its authored on field.
 * 2. Refuse an explicit move overlapping the following move.
 * 3. Refuse two auto moves with the same start.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs frame drafts and checks located refusals for a direction subject and overlapping and equal-start moves.
 * @evidence contracts/development/testing.md#independent-expectations A heading has no position and one camera cannot own overlapping moves; authored paths supply the expected diagnosis independently.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers three negative requests; legal framing and camera domains are owned by the valid and framing_camera entries.
 * @evidence contracts/development/testing.md#execution-ownership The discoverable synchronous test_film_perform_shot_frame_gates unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Refuse a direction subject at its authored on field.).
 */
export function test_film_perform_shot_frame_gates(): void {
  const staged: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    makeStagingWrite(),
  );
  if (staged.success !== true) throw new Error("staging must succeed");

  const directed: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [frame({ on: { kind: "direction", headingDeg: 90 } })],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals("directional subject fails", directed.success, false);
  TestValidator.equals(
    "non-positional frame subject rejected",
    namedFacts([
      ["refused", (): boolean => directed.success === false],
      [
        "violated",
        (): boolean => hasViolation(directed, "type", "$input.draft[0].on"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const doubled: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [
        frame({ start: 0, duration: 1.5 }),
        frame({ start: 1.0, move: "push-in" }),
      ],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals("overlapping moves fail", doubled.success, false);
  TestValidator.equals(
    "double-booked camera rejected",
    namedFacts([
      ["refused", (): boolean => doubled.success === false],
      [
        "violated",
        (): boolean => hasViolation(doubled, "range", "$input.draft[1].start"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const sameStart: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [frame({ start: 0 }), frame({ start: 0, move: "push-in" })],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals("same-start frame moves fail", sameStart.success, false);
  TestValidator.equals(
    "same-start camera moves rejected",
    namedFacts([
      ["refused", (): boolean => sameStart.success === false],
      [
        "violated",
        (): boolean =>
          hasViolation(sameStart, "range", "$input.draft[1].start"),
      ],
    ]),
    { refused: true, violated: true },
  );
}
