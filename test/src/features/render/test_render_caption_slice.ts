import { IAutoMovieCaptionEntry, IAutoMovieCaptionSidecar, planCaptionSidecar, sliceCaptionSidecar } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";



import { CAPTION_SEQUENCE } from "../internal/CAPTION_SEQUENCE";
import { CAPTION_SHOTS } from "../internal/CAPTION_SHOTS";
import { TREE_SCRIPT } from "../internal/TREE_SCRIPT";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/predicates";

const whole: () => IAutoMovieCaptionSidecar = (): IAutoMovieCaptionSidecar =>
  planCaptionSidecar({
    script: TREE_SCRIPT,
    sequence: CAPTION_SEQUENCE,
    shots: CAPTION_SHOTS,
    fps: 4,
  });

/**
 * Chunk-slicing the caption track, the caption mirror of the chunk plan's
 * frame-atomic rule: entries clip to the window and re-base to chunk-local
 * indices, so every chunk render carries its own caption sidecar.
 *
 * Scenarios (whole = 10 frames: duel `[0,2)`, aftermath `[2,10)`):
 *
 * 1. A middle window `[1,5)` clips both spans and re-bases them to `[0,1)` /
 *    `[1,4)` with captions intact: the hand-math oracle.
 * 2. The full window `[0,10)` reproduces the whole sidecar exactly.
 * 3. A window past the end clamps to `frameCount` (frames re-based, count `end -
 *    frameStart`).
 * 4. A window entirely inside one span drops the other (the `start >= stop` skip).
 * 5. Non-integer / negative `frameStart` and `frameEnd <= frameStart` throw.
 * 6. Non-integer frameEnd and windows starting at or beyond coverage refuse rather than producing negative frame counts.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real slicer over the caption planner's original two-span track and asserts clipped/rebased records, whole-window preservation, clamped coverage, single-span selection and every existing malformed or out-of-coverage refusal.
 * @evidence contracts/testing.md#independent-expectations Half-open interval intersection gives [0,1) and [1,4) for the [1,5) window over [0,2)/[2,10); authored fixture labels stay literal. Counts and interval endpoints remain exact, with nclose only for scalar clock leaves in whole-record comparisons.
 * @evidence contracts/testing.md#distinguishing-cases Preserves full, middle, inside-one-span and past-end windows plus fractional/negative starts, equal endpoints, fractional ends and starts at/beyond frameCount. Caption-tree joining and clock admission belong to caption_sidecar.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_render_caption_slice owns these portable synchronous interval cases and borrows canonical fixtures directly, without importing another test entry or writing/rendering files.
 */
export function test_render_caption_slice(): void {
  const sidecar: IAutoMovieCaptionSidecar = whole();

  const middle: IAutoMovieCaptionSidecar = sliceCaptionSidecar(sidecar, 1, 5);
  TestValidator.equals(
    "middle window re-bases",
    { ...middle, fps: 4 },
    {
      target: "seq:duel",
      fps: 4,
      frameCount: 4,
      entries: [
        {
          frameStart: 0,
          frameEnd: 1,
          beat: "duel",
          caption: "two knights clash at dawn",
          slug: "EXT. CASTLE COURTYARD - DAWN",
        },
        {
          frameStart: 1,
          frameEnd: 4,
          beat: "aftermath",
          caption: null,
          slug: "EXT. CASTLE COURTYARD - DAWN",
        },
      ],
    },
  );
  TestValidator.predicate("middle clock", nclose(middle.fps, 4));
  TestValidator.equals("middle frame count", middle.frameCount, 4);
  TestValidator.equals(
    "middle exact intervals",
    middle.entries.map((entry: IAutoMovieCaptionEntry): [number, number] => [
      entry.frameStart,
      entry.frameEnd,
    ]),
    [
      [0, 1],
      [1, 4],
    ],
  );

  const full: IAutoMovieCaptionSidecar = sliceCaptionSidecar(sidecar, 0, 10);
  TestValidator.equals(
    "full window equals the whole",
    { ...full, fps: sidecar.fps },
    sidecar,
  );
  TestValidator.predicate("full window clock", nclose(full.fps, sidecar.fps));

  const beyond: IAutoMovieCaptionSidecar = sliceCaptionSidecar(sidecar, 8, 99);
  TestValidator.equals("clamps to frameCount", beyond.frameCount, 2);
  TestValidator.equals(
    "clamped entries re-based",
    beyond.entries.map(
      (e: IAutoMovieCaptionEntry): [number, number, string] => [
        e.frameStart,
        e.frameEnd,
        e.beat,
      ],
    ),
    [[0, 2, "aftermath"]],
  );

  const inside: IAutoMovieCaptionSidecar = sliceCaptionSidecar(sidecar, 4, 8);
  TestValidator.equals(
    "window inside one span drops the other",
    inside.entries.map((e: IAutoMovieCaptionEntry): string => e.beat),
    ["aftermath"],
  );

  TestValidator.predicate(
    "non-integer frameStart throws",
    throwsError(
      (): IAutoMovieCaptionSidecar => sliceCaptionSidecar(sidecar, 0.5, 5),
      "frameStart",
    ),
  );
  TestValidator.predicate(
    "negative frameStart throws",
    throwsError(
      (): IAutoMovieCaptionSidecar => sliceCaptionSidecar(sidecar, -1, 5),
      "frameStart",
    ),
  );
  TestValidator.predicate(
    "inverted window throws",
    throwsError(
      (): IAutoMovieCaptionSidecar => sliceCaptionSidecar(sidecar, 5, 5),
      "frameEnd",
    ),
  );
  TestValidator.predicate(
    "non-integer frameEnd throws",
    throwsError(
      (): IAutoMovieCaptionSidecar => sliceCaptionSidecar(sidecar, 1, 5.5),
      "frameEnd",
    ),
  );
  // A window whose start is AT the coverage end (frameStart == frameCount) or
  // beyond it asks for frames the sidecar does not have: the render/caption
  // frame-count mismatch. Before the guard this returned a NEGATIVE frameCount
  // (end - frameStart) and passed silently; now it throws, naming both counts.
  TestValidator.predicate(
    "window at the coverage end throws",
    throwsError(
      (): IAutoMovieCaptionSidecar => sliceCaptionSidecar(sidecar, 10, 14),
      "exceeds caption coverage",
    ),
  );
  TestValidator.predicate(
    "window entirely beyond coverage throws (no negative frameCount)",
    throwsError(
      (): IAutoMovieCaptionSidecar => sliceCaptionSidecar(sidecar, 12, 20),
      "exceeds caption coverage",
    ),
  );
}
