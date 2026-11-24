import { blockBeat, stageScene } from "@automovie/engine";
import { type IAutoMovieConstraintViolation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makeBlockingWrite,
  makeScriptWrite,
  makeStagingWrite,
} from "../../../internal/filmFixtures";
import { hasViolation } from "../../../internal/predicates";

/**
 * Blocking reports independent beat, timeline, actor, anchor and camera contradictions together.
 *
 * Scenarios:
 *
 * 1. Beat "beat-99" the script never planned → `type` on `$input.beat`.
 * 2. Duration 0 → `range` on `$input.duration`.
 * 3. An intent for the unstaged `ghost` → `type` on `$input.actors[0].node`.
 * 4. An anchor at t = 5 outside the beat → `range` on
 *    `$input.actors[0].anchors[0].t`.
 * 5. A later-listed anchor at an earlier t (1.5 → 0.5) → `range` on
 *    `$input.actors[1].anchors[1].t` (list order is causal order).
 * 6. The camera favouring the unstaged `nobody` → `type` on
 *    `$input.camera.on.node`.
 */
export function test_unit_engine_film_film_block_beat_invalid(): void {
  const staged: ReturnType<typeof stageScene> = stageScene(
    makeScriptWrite(),
    makeStagingWrite(),
  );
  if (staged.success !== true) throw new Error("staging must succeed");

  const blocked: ReturnType<typeof blockBeat> = blockBeat(
    makeScriptWrite(),
    staged,
    makeBlockingWrite({
      beat: "beat-99",
      duration: 0,
      actors: [
        {
          node: "ghost",
          beats: "haunts the frame",
          anchors: [{ t: 5, cue: "too late" }],
        },
        {
          node: "knightA",
          beats: "strikes before stepping, impossible",
          anchors: [
            { t: 1.5, cue: "the strike" },
            { t: 0.5, cue: "the step" },
          ],
        },
      ],
      camera: {
        framing: "close",
        move: "static",
        on: { kind: "node", node: "nobody" },
      },
    }),
  );
  TestValidator.equals("fails", blocked.success, false);
  if (blocked.success !== false) return;
  TestValidator.predicate(
    "unknown beat",
    hasViolation(blocked, "type", "$input.beat"),
  );
  TestValidator.predicate(
    "zero duration",
    hasViolation(blocked, "range", "$input.duration"),
  );
  TestValidator.predicate(
    "unstaged intent",
    hasViolation(blocked, "type", "$input.actors[0].node"),
  );
  TestValidator.predicate(
    "anchor off the timeline",
    hasViolation(blocked, "range", "$input.actors[0].anchors[0].t"),
  );
  TestValidator.predicate(
    "causality reversal",
    hasViolation(blocked, "range", "$input.actors[1].anchors[1].t"),
  );
  TestValidator.predicate(
    "causality reversal is reported independently of timeline overflow",
    blocked.violations.some(
      (item: IAutoMovieConstraintViolation): boolean =>
        item.kind === "range" &&
        item.path === "$input.actors[1].anchors[1].t" &&
        item.expected.includes("runs before its predecessor"),
    ),
  );
  TestValidator.predicate(
    "camera on a stranger",
    hasViolation(blocked, "type", "$input.camera.on.node"),
  );
}
