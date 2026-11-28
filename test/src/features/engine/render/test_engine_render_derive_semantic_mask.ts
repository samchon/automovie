import { AutoMovieEngineRenderSemanticMask } from "@automovie/engine";
import type {
  IAutoMovieRenderSubject,
  IAutoMovieSemanticMask,
  IAutoMovieSemanticMaskEntry,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { modelsFixture, sceneFixture } from "../../internal/renderFixtures";
import { throwsError } from "../../internal/throwsError";

/** The five-node tower scene with its box models. */
const subject: () => IAutoMovieRenderSubject = (): IAutoMovieRenderSubject => ({
  scene: sceneFixture(),
  models: modelsFixture(),
});

/**
 * `deriveSemanticMask` gives every drawable of a render subject its
 * own colour under its own id, so a pixel can be read back as the thing it
 * shows.
 *
 * Scenarios, on the tower scene of five nodes:
 *
 * 1. The mask is of protocol `automovie.semantic-mask.v2` on a black background.
 * 2. The mask has five entries in ascending id order and five distinct colours.
 * 3. The same subject gives the same digest; a scene of six nodes gives a mask of
 *    six entries and another digest.
 * 4. Two nodes of one id are two claimants of one semantic id and are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the protocol and black background, ordered distinct entries, count and digest changes, and duplicate identity refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the Engine semantic-mask owner with typed tower subjects and reads the generated records and digest, then submits a repeated node id.
 * @evidence contracts/development/testing.md#independent-expectations Five authored nodes and one added node determine the expected cardinalities. Entry order and color uniqueness are checked directly. Reusing the same id creates two ownership claims and must produce the indicated refusal.
 */
export function test_engine_render_derive_semantic_mask(): void {
  const mask: IAutoMovieSemanticMask = AutoMovieEngineRenderSemanticMask.deriveAutoMovieSemanticMask(subject());
  TestValidator.equals(
    "protocol and background",
    [mask.protocol, mask.background],
    ["automovie.semantic-mask.v2", "#000000"],
  );
  const ids: string[] = mask.entries.map(
    (entry: IAutoMovieSemanticMaskEntry): string => entry.id,
  );
  TestValidator.predicate(
    "five entries, sorted, each in its own colour",
    ids.length === 5 &&
      ids.every(
        (id: string, index: number): boolean =>
          index === 0 || ids[index - 1]! < id,
      ) &&
      new Set(
        mask.entries.map((entry: IAutoMovieSemanticMaskEntry): string =>
          JSON.stringify(entry.color),
        ),
      ).size === 5,
  );
  const grown: IAutoMovieSemanticMask = AutoMovieEngineRenderSemanticMask.deriveAutoMovieSemanticMask({
    scene: sceneFixture({ extra: true }),
    models: modelsFixture(),
  });
  TestValidator.predicate(
    "a stable digest and a larger mask",
    AutoMovieEngineRenderSemanticMask.deriveAutoMovieSemanticMask(subject()).digest === mask.digest &&
      grown.entries.length === 6 &&
      grown.digest !== mask.digest,
  );
  TestValidator.predicate(
    "two claimants of one id",
    throwsError(
      (): unknown =>
        AutoMovieEngineRenderSemanticMask.deriveAutoMovieSemanticMask({
          scene: {
            ...sceneFixture(),
            nodes: [sceneFixture().nodes[0]!, sceneFixture().nodes[0]!],
          },
          models: modelsFixture(),
        }),
      "two claimants",
    ),
  );
}
