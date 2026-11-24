import { blockBeat, stageScene } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import {
  makeBlockingWrite,
  makeScriptWrite,
  makeStagingWrite,
} from "../../../internal/filmFixtures";
import { hasViolation } from "../../../internal/predicates";

/**
 * `blockBeat` admits a blocking plan for a script beat over a staged scene.
 *
 * Fixture: the duel script, its staging, and a blocking with a strike anchored
 * at t = 1 inside the 2-second beat and a medium static camera on `knightA`.
 *
 * Scenarios:
 *
 * 1. The duel blocking succeeds, carrying the very plan given, for beat-1.
 * 2. Anchors at 0.5 then 1.5, in ascending order, still succeed.
 * 3. Two script beats sharing the id beat-1 are refused as a type finding at
 *    `$script.beats[1].id`.
 */
export function test_unit_engine_film_block_beat(): void {
  const script = makeScriptWrite();
  const staged = stageScene(script, makeStagingWrite());
  if (staged.success !== true) throw new Error("staging must succeed");

  const plan = makeBlockingWrite();
  const blocked = blockBeat(script, staged, plan);
  TestValidator.equals("success", blocked.success, true);
  if (blocked.success === true) {
    TestValidator.predicate("same plan", blocked.blocking === plan);
    TestValidator.equals("beat", blocked.blocking.beat, "beat-1");
  }

  const anchored = blockBeat(
    script,
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
  TestValidator.equals("ordered anchors", anchored.success, true);

  const duplicate = blockBeat(
    makeScriptWrite({
      beats: [
        script.beats[0]!,
        {
          ...script.beats[0]!,
          name: "the duplicate charge",
          summary: "a second planned beat sharing the same id",
        },
      ],
    }),
    staged,
    makeBlockingWrite(),
  );
  TestValidator.equals("duplicate beats fail", duplicate.success, false);
  TestValidator.predicate(
    "duplicate path",
    duplicate.success === false &&
      hasViolation(duplicate, "type", "$script.beats[1].id"),
  );
}
