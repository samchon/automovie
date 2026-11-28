import { AutoMovieRenderCapture } from "@automovie/render";
import assert from "node:assert/strict";

/**
 * Plan an exact tenth-second review cadence from native indices. Verify both
 * endpoints, decisive frames, four uniform clocks and a visibly slower source.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the cadence, endpoint policy, decisive intervals and slower-source case.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public planner on literal rational clocks and reads the exact interval result. It opens no scene, browser or media file.
 * @evidence contracts/development/testing.md#independent-expectations An exact tenth of a second fits two frames at 24 Hz, three at 30 Hz, two at 30000/1001 Hz and one at 10 Hz. Three frames at 30000/1001 Hz last 0.1001 seconds. Retaining frame one is additional to each ordinary stride above one.
 */
export function test_render_capture_plan_review_frames(): void {
  for (const [numerator, denominator, stride] of [
    [24, 1, 2],
    [30, 1, 3],
    [30_000, 1_001, 2],
    [10, 1, 1],
  ] as const) {
    const result = AutoMovieRenderCapture.planReviewFrames({
      frameRate: [numerator, denominator],
      frames: [0, 13],
      decisive: [[1, 2], [2, 3]],
    });
    const regular: number[] = Array.from(
      { length: Math.floor(13 / stride) + 1 },
      (_, index) => index * stride,
    );
    const selected = [...new Set([...regular, 1, 2, 3, 13])].sort((a, b) => a - b);
    assert.deepEqual(result, {
      type: "planned",
      frames: selected,
      largestGap: [stride * denominator, numerator],
    });
  }
  assert.deepEqual(AutoMovieRenderCapture.planReviewFrames({
    frameRate: [8, 1], frames: [2, 4],
  }), {
    type: "source-rate-below-review",
    frames: [2, 3, 4],
    largestGap: [1, 8],
  });
  assert.throws(() => AutoMovieRenderCapture.planReviewFrames({
    frameRate: [24, 1], frames: [2, 4], decisive: [[1, 2]],
  }), /decisive interval/u);
  assert.throws(() => AutoMovieRenderCapture.planReviewFrames({
    frameRate: [Infinity, 1], frames: [2, 4],
  }), /exact rational rate/u);
}
