import { blockBeat, stageScene } from "@automovie/engine";
import { type IAutoMovieConstraintViolation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makeBlockingWrite,
  makeScriptWrite,
  makeStagingWrite,
} from "../internal/filmFixtures";
import { hasViolation } from "../internal/predicates";

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
 *
 * @evidence contracts/testing.md#behavioral-verification Calls blockBeat after valid staging and requires all six authored faults at their field paths, including a causal-reversal explanation in addition to a range finding. This catches short-circuit reporting or an anchor merely refused as outside the zero-duration timeline while its reversed order goes unnoticed.
 * @evidence contracts/testing.md#independent-expectations The script contains no beat-99 or ghost/nobody placement, a zero-duration beat is invalid, t=5 is outside it, and 0.5 follows 1.5 in the authored list. Literal membership and ordering establish the expected paths independently of the gate's sets and predecessor state.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the six numbered simultaneous faults with two actor intents and a node-target camera; finite valid plans, nonfinite clocks, blank references, prior-state admission and camera vocabulary have separate tests.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_film_block_beat_invalid entry owns a portable stageScene prerequisite and one blockBeat refusal using existing fixtures, without installing a consumer, compiling native code or starting a real host.
 */
export function test_film_block_beat_invalid(): void {
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
