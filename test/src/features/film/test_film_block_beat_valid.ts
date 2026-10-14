import { blockBeat, stageScene } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import {
  makeBlockingWrite,
  makeScriptWrite,
  makeStagingWrite,
} from "../internal/filmFixtures";

/**
 * Pins the happy path of the BLOCKING consumer: a plan whose beat the script
 * planned, whose intents belong to placed actors, whose anchors sit on the
 * beat's timeline in causal order, and whose camera favours a staged actor
 * passes through verbatim.
 *
 * Scenarios:
 *
 * 1. The duel blocking (strike anchored at t = 1 inside a 2-second beat, medium
 *    static camera on knightA) → success carrying the plan unchanged.
 * 2. Multiple anchors in ascending order (0.5 then 1.5) → still coherent.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls blockBeat for the standard admitted plan and an ascending two-anchor variant, checking success, beat identity and preservation of the first plan object, catching a gate that refuses valid causal order or substitutes a different plan.
 * @evidence contracts/testing.md#independent-expectations The script declares beat-1 and the stage places both knights; cue times one, or 0.5 then 1.5, lie within two seconds in listed order and the camera targets a placed knight. Exact returned object identity pins borrowed-plan ownership without deep-comparing numerical fields.
 * @evidence contracts/testing.md#distinguishing-cases Owns a singleton anchor and a strictly increasing two-anchor plan with medium/static framing; reversed or out-of-range anchors, nonfinite clocks and unknown references are covered by the refusal tests.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_film_block_beat_valid entry owns one portable stageScene result and both in-process blockBeat calls through existing fixtures, without installed consumers, native artifacts or a running host.
 */
export function test_film_block_beat_valid(): void {
  const staged: ReturnType<typeof stageScene> = stageScene(makeScriptWrite(), makeStagingWrite());
  if (staged.success !== true) throw new Error("staging must succeed");

  const plan: ReturnType<typeof makeBlockingWrite> = makeBlockingWrite();
  const blocked: ReturnType<typeof blockBeat> = blockBeat(makeScriptWrite(), staged, plan);
  TestValidator.equals("success", blocked.success, true);
  if (blocked.success === true) {
    TestValidator.predicate("the admitted plan is borrowed unchanged", blocked.blocking === plan);
    TestValidator.equals(
      "plan carried verbatim",
      blocked.blocking.beat,
      "beat-1",
    );
  }

  const anchored: ReturnType<typeof blockBeat> = blockBeat(
    makeScriptWrite(),
    staged,
    makeBlockingWrite({
      actors: [
        {
          node: "knightA",
          beats: "steps in, feints, then strikes",
          anchors: [
            { t: 0.5, cue: "the feint" },
            { t: 1.5, cue: "the strike lands" },
          ],
        },
      ],
    }),
  );
  TestValidator.equals("ordered anchors pass", anchored.success, true);
}
