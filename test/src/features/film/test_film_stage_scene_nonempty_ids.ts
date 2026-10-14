import { stageScene } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

/**
 * Staging creates the scene artifact and its scene-wide entity ids. Blank ids
 * can avoid duplicate checks when the blank strings differ, but still cannot be
 * used as stable scene, node, camera, or light references.
 *
 * Scenarios:
 * 1. A staging payload with blank scene/actor/camera/light ids fails at
 *    each id field's own path.
 *
 * @evidence contracts/testing.md#behavioral-verification Stages blank scene, actor, camera and light identities in one write and requires each field's type finding, catching silent admission of unusable join keys.
 * @evidence contracts/testing.md#independent-expectations Nonblank identity is the authored reference contract; empty and whitespace literals determine the expected fields without using generated scene ids as an oracle.
 * @evidence contracts/testing.md#distinguishing-cases Exercises empty, space, tab and newline spellings across four identity owners; valid distinct identities belong to the valid entry and duplicate nonblank ids to the collision entry.
 * @evidence contracts/testing.md#execution-ownership This discoverable synchronous unit owns the four malformed ids through actual stageScene calls and existing in-memory fixtures, without native artifacts or hosts.
 */
export function test_film_stage_scene_nonempty_ids(): void {
  const base: ReturnType<typeof makeStagingWrite> = makeStagingWrite();
  const staged: ReturnType<typeof stageScene> = stageScene(
    makeScriptWrite({
      cast: [
        { node: " ", character: "the unnamed challenger", modelRef: null },
        { node: "knightB", character: "the champion", modelRef: null },
      ],
    }),
    makeStagingWrite({
      scene: { ...base.scene, id: "" },
      actors: [
        { ...base.actors[0]!, node: " " },
        { ...base.actors[1]!, node: "knightB" },
      ],
      cameras: [
        {
          ...base.cameras[0]!,
          node: "\t",
          lookAt: { kind: "node", node: "knightB" },
        },
      ],
      lights: [{ ...base.lights[0]!, node: "\n" }],
    }),
  );

  TestValidator.equals("blank staging ids fail", staged.success, false);
  TestValidator.equals(
    "scene id violation",
    namedFacts([
      ["refused", (): boolean => staged.success === false],
      [
        "violated",
        (): boolean =>
          staged.success === false &&
          hasViolation(staged, "type", "$input.scene.id"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "actor node violation",
    namedFacts([
      ["refused", (): boolean => staged.success === false],
      [
        "violated",
        (): boolean =>
          staged.success === false &&
          hasViolation(staged, "type", "$input.actors[0].node"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "camera node violation",
    namedFacts([
      ["refused", (): boolean => staged.success === false],
      [
        "violated",
        (): boolean =>
          staged.success === false &&
          hasViolation(staged, "type", "$input.cameras[0].node"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "light node violation",
    namedFacts([
      ["refused", (): boolean => staged.success === false],
      [
        "violated",
        (): boolean =>
          staged.success === false &&
          hasViolation(staged, "type", "$input.lights[0].node"),
      ],
    ]),
    { refused: true, violated: true },
  );
}
