import { planViewerFrameTimes } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * Plan the film seconds a still capture writes, on the encoded frame grid.
 *
 * Scenarios:
 * 1. A range sampled every 20 frames at 30 fps lands on whole frames, including both ends when they fall on the grid.
 * 2. A step in seconds yields the same frames as the equivalent frame interval, and an off-grid range starts at the next frame.
 * 3. Explicit seconds are kept, sorted and deduplicated.
 * 4. Mixed or incomplete requests, out-of-film seconds and invalid intervals are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment lists the four scenarios and the rule each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Calls planViewerFrameTimes and compares the exact returned seconds or the thrown refusal; drifting off the frame grid, dropping a range end, inventing a default interval or admitting a second outside the film fails.
 * @evidence contracts/development/testing.md#independent-expectations Expected seconds are frame indices divided by 30, computed by hand from the requested range: 120 to 121 every 20 frames is frames 3600 and 3620, since 3640 lies past frame 3630, and every 10 frames reaches 3630 itself.
 * @evidence contracts/development/testing.md#distinguishing-cases Cases cover an on-grid range, an off-grid start, a step equal to a frame interval, a single-frame range, repeated explicit seconds, both request forms at once, a range without its end, both intervals, a zero interval, a fractional frame interval and seconds beyond the film.
 * @evidence contracts/development/testing.md#execution-ownership A pure unit test of the render package's planner; it starts no browser or Viewer, and actual still capture belongs to renderViewerFrames run against a Viewer.
 */
export function test_render_viewer_frame_times(): void {
  const film: { fps: number; durationSeconds: number } = {
    fps: 30,
    durationSeconds: 180,
  };
  TestValidator.equals(
    "every 20 frames over one second",
    planViewerFrameTimes({ ...film, from: 120, to: 121, every: 20 }),
    [3600 / 30, 3620 / 30],
  );
  TestValidator.equals(
    "every 10 frames reaches the range end",
    planViewerFrameTimes({ ...film, from: 120, to: 121, every: 10 }),
    [3600 / 30, 3610 / 30, 3620 / 30, 3630 / 30],
  );
  TestValidator.equals(
    "step equals the frame interval",
    planViewerFrameTimes({ ...film, from: 120, to: 121, step: 10 / 30 }),
    planViewerFrameTimes({ ...film, from: 120, to: 121, every: 10 }),
  );
  TestValidator.equals(
    "off-grid start begins at the next frame",
    planViewerFrameTimes({ ...film, from: 0.01, to: 0.1, every: 1 }),
    [1 / 30, 2 / 30, 3 / 30],
  );
  TestValidator.equals(
    "single-frame range",
    planViewerFrameTimes({ ...film, from: 150, to: 150, every: 5 }),
    [150],
  );
  TestValidator.equals(
    "explicit seconds sorted and deduplicated",
    planViewerFrameTimes({ ...film, at: [150.4, 12, 150.4, 0] }),
    [0, 12, 150.4],
  );
  for (const [label, request] of [
    ["both forms", { ...film, at: [1], from: 0, to: 1, every: 1 }],
    ["neither form", { ...film }],
    ["range without end", { ...film, from: 0, every: 1 }],
    ["both intervals", { ...film, from: 0, to: 1, every: 1, step: 0.1 }],
    ["no interval", { ...film, from: 0, to: 1 }],
    ["zero interval", { ...film, from: 0, to: 1, every: 0 }],
    ["fractional frames", { ...film, from: 0, to: 1, every: 1.5 }],
    ["reversed range", { ...film, from: 2, to: 1, every: 1 }],
    ["beyond the film", { ...film, from: 170, to: 181, every: 1 }],
    ["explicit beyond the film", { ...film, at: [180.5] }],
    ["empty explicit list", { ...film, at: [] }],
  ] as const)
    TestValidator.error(label, (): number[] => planViewerFrameTimes(request));
}
