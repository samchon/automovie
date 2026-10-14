import { IAutoMoviePerformedShot } from "../../../../packages/engine/src/film/IAutoMoviePerformedShot";
import { IAutoMovieStagedSet } from "../../../../packages/engine/src/film/IAutoMovieStagedSet";
import { performShot } from "../../../../packages/engine/src/film/performShot";
import { stageScene } from "../../../../packages/engine/src/film/stageScene";
import { IAutoMovieCameraAction, IAutoMovieSkeleton } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

const frame: (overrides: Partial<IAutoMovieCameraAction>) => IAutoMovieCameraAction = (
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
 * Performs frame drafts and checks located refusals for a direction subject, overlapping and equal-start moves, unknown framing/move and malformed actor/target payloads.
 *
 * Scenarios:
 * 1. Refuse a direction subject at its authored on field.
 * 2. Refuse an explicit move overlapping the following move.
 * 3. Refuse two auto moves with the same start.
 * 4. Refuse unknown framing before camera compilation.
 * 5. Refuse an unknown move before camera compilation.
 * 6. Refuse null actor, absent target, malformed group nodes and malformed kind with located findings.
 *
 * @evidence contracts/testing.md#behavioral-verification Performs frame drafts and checks located refusals for a direction subject, overlapping and equal-start moves, unknown framing/move and malformed actor/target payloads.
 * @evidence contracts/testing.md#independent-expectations A heading has no position, one camera cannot own overlapping moves, and the closed frame vocabulary excludes the supplied unknown strings; authored paths supply the expected diagnosis independently.
 * @evidence contracts/testing.md#distinguishing-cases Covers nine existing negative requests including null actor, absent target, malformed group nodes and malformed kind; legal framing and camera domains are owned by the valid and framing_camera entries.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_perform_shot_frame_gates unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 */
export function test_film_perform_shot_frame_gates(): void {
  const staged: IAutoMovieStagedSet = stageScene(makeScriptWrite(), makeStagingWrite());
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
      ["violated", (): boolean => hasViolation(directed, "type", "$input.draft[0].on")],
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
        (): boolean => hasViolation(sameStart, "range", "$input.draft[1].start"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const invalidFraming: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [frame({ framing: "macro" as never })],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "invalid framing fails as data",
    invalidFraming.success,
    false,
  );
  TestValidator.equals(
    "unknown frame framing rejected",
    namedFacts([
      ["refused", (): boolean => invalidFraming.success === false],
      [
        "violated",
        (): boolean => hasViolation(invalidFraming, "type", "$input.draft[0].framing"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const invalidMove: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [frame({ move: "crash-zoom" as never })],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "invalid move fails as data",
    invalidMove.success,
    false,
  );
  TestValidator.equals(
    "unknown frame move rejected",
    namedFacts([
      ["refused", (): boolean => invalidMove.success === false],
      [
        "violated",
        (): boolean => hasViolation(invalidMove, "type", "$input.draft[0].move"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const malformedActor: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [frame({ actor: null as never })],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "malformed frame actor rejected",
    namedFacts([
      ["refused", (): boolean => malformedActor.success === false],
      [
        "violated",
        (): boolean => hasViolation(malformedActor, "type", "$input.draft[0].actor"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const missingTarget: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [frame({ on: undefined as never })],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "missing frame target rejected",
    namedFacts([
      ["refused", (): boolean => missingTarget.success === false],
      [
        "violated",
        (): boolean => hasViolation(missingTarget, "type", "$input.draft[0].on"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const malformedGroup: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [
        frame({
          on: { kind: "group", nodes: "knightA" } as never,
        }),
      ],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "malformed group target rejected",
    namedFacts([
      ["refused", (): boolean => malformedGroup.success === false],
      [
        "violated",
        (): boolean => hasViolation(malformedGroup, "type", "$input.draft[0].on.nodes"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const malformedKind: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [frame({ on: { kind: null } as never })],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "malformed target kind rejected",
    namedFacts([
      ["refused", (): boolean => malformedKind.success === false],
      [
        "violated",
        (): boolean => hasViolation(malformedKind, "type", "$input.draft[0].on"),
      ],
    ]),
    { refused: true, violated: true },
  );
}
