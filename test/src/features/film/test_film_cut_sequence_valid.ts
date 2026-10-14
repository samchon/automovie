import { cutSequence } from "@automovie/engine";
import { type IAutoMovieSequenceEntry, type IAutoMovieShot } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

const shot: (id: string, duration: number) => IAutoMovieShot = (id: string, duration: number): IAutoMovieShot => ({
  id,
  name: null,
  scene: "scene-duel",
  camera: "cam-main",
  cameraMotion: null,
  performances: [],
  objectMotions: [],
  duration,
});

/**
 * A valid cut preserves the sequence id, frame rate and entry order, and its runtime accounts for trims and overlap.
 *
 * Scenarios:
 *
 * 1. Three entries over two built shots (the first played whole (3 s), the second
 *    trimmed to [0.5, 2.5] (2 s), the first reused with a 0.5 s cross-dissolve
 *    in) → success; the sequence carries the id and fps and the shot ids in order.
 * 2. Runtime = 3 + 2 + 3 − 0.5 = 7.5 s (a reused shot plays again; the dissolve
 *    overlaps the previous tail).
 *
 * @evidence contracts/testing.md#behavioral-verification Calls cutSequence on a coherent three-entry edit and checks successful admission, sequence identity, frame rate, repeated-shot order and runtime, detecting deduplication, reordered entries or omission of trim and transition arithmetic.
 * @evidence contracts/testing.md#independent-expectations The authored three- and four-second shots and two-second trim give 3 + 2 + 3 - 0.5 = 7.5 seconds; literal shot ids define order independently of the engine. The test checks this aggregate and selected metadata rather than every copied sequence member.
 * @evidence contracts/testing.md#distinguishing-cases Includes whole-shot playback, a finite interior trim, reuse of the first shot and a fitting dissolve; empty edits, duplicate source ids and invalid timing are owned by the refusal tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_cut_sequence_valid entry owns both assertion groups through one portable assembly call; no host, native build, installation or dynamically registered case is needed.
 */
export function test_film_cut_sequence_valid(): void {
  const cut: ReturnType<typeof cutSequence> = cutSequence(
    {
      sequence: { id: "seq-duel", name: "the duel" },
      fps: 24,
      entries: [
        { shot: "shot:beat-1", trim: null, transition: null },
        {
          shot: "shot:beat-2",
          trim: { start: 0.5, duration: 2 },
          transition: null,
        },
        {
          shot: "shot:beat-1",
          trim: null,
          transition: { kind: "crossDissolve", duration: 0.5 },
        },
      ],
      pacing: "hold the charge, snap the strike, breathe on the aftermath.",
      continuity: "the strike ends where the aftermath begins.",
    },
    [shot("shot:beat-1", 3), shot("shot:beat-2", 4)],
  );
  TestValidator.equals("success", cut.success, true);
  if (cut.success !== true) return;
  TestValidator.equals("sequence id", cut.sequence.id, "seq-duel");
  TestValidator.predicate("fps", nclose(cut.sequence.fps, 24));
  TestValidator.equals(
    "entry order",
    cut.sequence.shots.map((s: IAutoMovieSequenceEntry): string => s.shot),
    ["shot:beat-1", "shot:beat-2", "shot:beat-1"],
  );
  TestValidator.predicate("runtime", nclose(cut.runtime, 7.5));
}
