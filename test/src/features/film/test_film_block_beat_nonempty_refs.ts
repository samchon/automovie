import { blockBeat, stageScene } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import {
  makeBlockingWrite,
  makeScriptWrite,
  makeStagingWrite,
} from "../internal/filmFixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

/**
 * Blocking consumes already-staged scene ids, but it is still a public boundary
 * for beat and node references. Matching blank ids can satisfy existence checks
 * while remaining unusable references for the performance stage.
 *
 * Scenarios:
 *
 * 1. Whitespace-only beat, actor and node-target camera references refuse at their input fields even though matching staged/script ids exist.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls blockBeat with matching whitespace ids in the script, stage and plan and requires type findings on all three plan references, detecting admission that checks existence but omits nonblank identity.
 * @evidence contracts/testing.md#independent-expectations A single space contains no non-whitespace identity, and the deliberately matching source ids make referential absence an insufficient explanation for refusal; expected paths name the beat, actor and camera fields authored in the input.
 * @evidence contracts/testing.md#distinguishing-cases Owns whitespace references that resolve by equality, contrasted with ordinary absent ids in the invalid-plan test and valid nonblank ids in the admitted-plan test; duplicate ids and prior-state fields have separate cases.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_film_block_beat_nonempty_refs entry owns one portable staging prerequisite and a copied scene record with authored blank ids, replacing no module or foreign method and starting no consumer, native artifact or host.
 */
export function test_film_block_beat_nonempty_refs(): void {
  const baseScript: ReturnType<typeof makeScriptWrite> = makeScriptWrite();
  const baseStaged: ReturnType<typeof stageScene> = stageScene(
    baseScript,
    makeStagingWrite(),
  );
  if (baseStaged.success !== true) throw new Error("staging must succeed");

  const script: ReturnType<typeof makeScriptWrite> = makeScriptWrite({
    beats: [{ ...baseScript.beats[0]!, id: " " }],
  });
  const staged: Parameters<typeof blockBeat>[1] = {
    ...baseStaged,
    scene: {
      ...baseStaged.scene,
      nodes: [{ ...baseStaged.scene.nodes[0]!, id: " " }],
    },
  };

  const blocked: ReturnType<typeof blockBeat> = blockBeat(
    script,
    staged,
    makeBlockingWrite({
      beat: " ",
      actors: [{ node: " ", beats: "acts under a blank scene id" }],
      camera: {
        framing: "medium",
        move: "static",
        on: { kind: "node", node: " " },
      },
    }),
  );

  TestValidator.equals("blank blocking refs fail", blocked.success, false);
  TestValidator.equals(
    "beat id violation",
    namedFacts([
      ["refused", (): boolean => blocked.success === false],
      [
        "violated",
        (): boolean =>
          blocked.success === false &&
          hasViolation(blocked, "type", "$input.beat"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "actor node violation",
    namedFacts([
      ["refused", (): boolean => blocked.success === false],
      [
        "violated",
        (): boolean =>
          blocked.success === false &&
          hasViolation(blocked, "type", "$input.actors[0].node"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "camera node violation",
    namedFacts([
      ["refused", (): boolean => blocked.success === false],
      [
        "violated",
        (): boolean =>
          blocked.success === false &&
          hasViolation(blocked, "type", "$input.camera.on.node"),
      ],
    ]),
    { refused: true, violated: true },
  );
}
