import { performShot } from "../../../../packages/engine/src/film/performShot";
import { IAutoMoviePerformedShot } from "../../../../packages/engine/src/film/IAutoMoviePerformedShot";
import { IAutoMovieStagedSet } from "../../../../packages/engine/src/film/IAutoMovieStagedSet";
import { IAutoMovieScript, IAutoMovieSkeleton } from "@automovie/interface";
import { stageScene } from "../../../../packages/engine/src/film/stageScene";
import { TestValidator } from "@nestia/e2e";

import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

/**
 * Performs an explicitly staged world with matching blank beat, actor, camera and frame-target ids; checks refusal at every original owning field.
 *
 * Scenarios:
 * 1. Retains simultaneous blank beat/actor/camera/node subjects, including space and tab spellings; nonblank positive admission belongs to perform_shot_valid.
 *
 * @evidence contracts/testing.md#behavioral-verification Performs an explicitly staged world with matching blank beat, actor, camera and frame-target ids; checks refusal at every original owning field.
 * @evidence contracts/testing.md#independent-expectations Whitespace-only references violate the nonblank identity contract even when matching staged ids exist; independent authored field paths identify each failure.
 * @evidence contracts/testing.md#distinguishing-cases Retains simultaneous blank beat/actor/camera/node subjects, including space and tab spellings; nonblank positive admission belongs to perform_shot_valid.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_perform_shot_nonempty_refs unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 */
export function test_film_perform_shot_nonempty_refs(): void {
  const baseScript: IAutoMovieScript = makeScriptWrite();
  const baseStaged: IAutoMovieStagedSet = stageScene(baseScript, makeStagingWrite());
  if (baseStaged.success !== true) throw new Error("staging must succeed");

  const script: IAutoMovieScript = makeScriptWrite({
    beats: [{ ...baseScript.beats[0]!, id: " " }],
  });
  const staged: IAutoMovieStagedSet.ISuccess = {
    ...baseStaged,
    scene: {
      ...baseStaged.scene,
      nodes: [{ ...baseStaged.scene.nodes[0]!, id: " " }],
      cameras: [{ ...baseStaged.scene.cameras[0]!, id: "\t" }],
    },
  };

  const performed: IAutoMoviePerformedShot = performShot({
    script,
    staged,
    performance: makePerformanceWrite({
      beat: " ",
      draft: [
        {
          verb: "gesture",
          actor: " ",
          start: 0,
          duration: 1,
          kind: "wave",
        },
        {
          verb: "frame",
          actor: "\t",
          start: 0,
          duration: "auto",
          framing: "medium",
          move: "static",
          on: { kind: "node", node: " " },
        },
      ],
      revise: { review: "unchanged.", final: null },
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });

  TestValidator.equals("blank performance refs fail", performed.success, false);
  TestValidator.equals(
    "beat id violation",
    namedFacts([
      ["refused", (): boolean => performed.success === false],
      [
        "violated",
        (): boolean =>
          performed.success === false &&
          hasViolation(performed, "type", "$input.beat"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "action actor violation",
    namedFacts([
      ["refused", (): boolean => performed.success === false],
      [
        "violated",
        (): boolean =>
          performed.success === false &&
          hasViolation(performed, "type", "$input.draft[0].actor"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "frame camera actor violation",
    namedFacts([
      ["refused", (): boolean => performed.success === false],
      [
        "violated",
        (): boolean =>
          performed.success === false &&
          hasViolation(performed, "type", "$input.draft[1].actor"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "frame node target violation",
    namedFacts([
      ["refused", (): boolean => performed.success === false],
      [
        "violated",
        (): boolean =>
          performed.success === false &&
          hasViolation(performed, "type", "$input.draft[1].on.node"),
      ],
    ]),
    { refused: true, violated: true },
  );
}
