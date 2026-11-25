import type { IAutoMovieMixFilmSound } from "@automovie/interface";
import { planAutoMovieDialogueMouths } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { createDialogueReceiptFixture } from "../../internal/createDialogueReceiptFixture";

/**
 * `planAutoMovieDialogueMouths` gives each line bound to exactly one actor a
 * jaw opening per film frame from its loudness.
 *
 * Scenarios:
 *
 * 1. A two-frame line of silence then full scale, spoken by `ann` who is bound
 *    to actor `actor-a`, becomes a line for that actor on its frames with jaw 0
 *    for the silent frame and an open jaw for the loud one, and no viseme
 *    ranges without phoneme chunks.
 * 2. A line whose speaker has no binding, or two bindings, or no speaker, is
 *    left out.
 */
export function test_render_audio_plan_dialogue_mouths_lines(): void {
  const samples: Float32Array = new Float32Array(4000).fill(0);
  samples.fill(1, 2000);
  const entry = (id: string, speaker: string | undefined): IAutoMovieMixFilmSound.ILine => ({
    line: {
      id,
      text: "hello",
      language: "en",
      ...(speaker === undefined ? {} : { speaker }),
      startFrame: 0,
      endFrame: 2,
    },
    receipt: createDialogueReceiptFixture({
      line: id,
      text: "hello",
      samples,
      sampleRate: 48_000,
    }).receipt,
    samples,
  });
  const plan = planAutoMovieDialogueMouths({
    lines: [
      entry("l1", "ann"),
      entry("l2", "bob"),
      entry("l3", "twin"),
      entry("l4", undefined),
    ],
    speakers: [
      { speaker: "ann", actor: "actor-a" },
      { speaker: "twin", actor: "actor-b" },
      { speaker: "twin", actor: "actor-c" },
    ],
    frameRate: { numerator: 24, denominator: 1 },
  });
  TestValidator.equals("fps", plan.fps, 24);
  TestValidator.equals(
    "lines kept",
    plan.lines.map((line): [string, string, number, number] => [
      line.line,
      line.actor,
      line.startFrame,
      line.endFrame,
    ]),
    [["l1", "actor-a", 0, 2]],
  );
  const jaw: number[] = plan.lines[0]!.jaw;
  TestValidator.predicate(
    "silent frame closed, loud frame open",
    jaw.length === 2 && jaw[0] === 0 && jaw[1]! > 0,
  );
  TestValidator.equals("no ranges", plan.lines[0]!.ranges, null);
}