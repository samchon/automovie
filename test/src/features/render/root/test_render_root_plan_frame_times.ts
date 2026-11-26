import type { IAutoMoviePlanViewerFrameTimesRequest } from "@automovie/interface";
import { planViewerFrameTimes } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../internal/predicates";

/**
 * Plan the film seconds a still capture writes, on the encoded frame grid.
 *
 * Scenarios:
 *
 * 1. A range sampled every 20 frames at 30 fps lands on whole frames, including
 *    both ends when they fall on the grid.
 * 2. A step in seconds yields the same frames as the equivalent frame interval,
 *    and an off-grid range starts at the next frame.
 * 3. Explicit seconds are kept, sorted and deduplicated.
 * 4. A range ending at the film duration samples only encoded frames. An explicit
 *    request can still name the exact end.
 * 5. Mixed or incomplete requests, out-of-film seconds and invalid intervals are
 *    refused.
 */
export function test_render_root_plan_frame_times(): void {
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
  const finalRange: IAutoMoviePlanViewerFrameTimesRequest = {
    fps: 4,
    durationSeconds: 1,
    from: 0,
    to: 1,
  };
  const expected: readonly number[] = [0, 0.25, 0.5, 0.75];
  const issues: string[] = [];
  for (const [label, frames] of [
    ["frame interval", planViewerFrameTimes({ ...finalRange, every: 1 })],
    ["seconds interval", planViewerFrameTimes({ ...finalRange, step: 0.25 })],
  ] as const)
    if (
      frames.length !== expected.length ||
      frames.some(
        (seconds: number, index: number): boolean =>
          !nclose(seconds, expected[index]!),
      )
    )
      issues.push(label);
  if (
    !throwsError(
      (): number[] => planViewerFrameTimes({ ...finalRange, every: 0.5 }),
      "positive whole number",
    )
  )
    issues.push("fractional frame interval");
  TestValidator.equals(
    "range selection agrees with the encoded grid",
    issues,
    [],
  );

  const explicit: number[] = planViewerFrameTimes({
    fps: 4,
    durationSeconds: 1,
    at: [1, 0.13],
  });
  TestValidator.predicate(
    "explicit times keep the off-grid second and exact endpoint",
    explicit.length === 2 &&
      nclose(explicit[0]!, 0.13) &&
      nclose(explicit[1]!, 1),
  );

  for (const [label, request] of [
    ["both forms", { ...film, at: [1], from: 0, to: 1, every: 1 }],
    ["neither form", { ...film }],
    ["range without end", { ...film, from: 0, every: 1 }],
    ["both intervals", { ...film, from: 0, to: 1, every: 1, step: 0.1 }],
    ["no interval", { ...film, from: 0, to: 1 }],
    ["zero interval", { ...film, from: 0, to: 1, every: 0 }],
    ["reversed range", { ...film, from: 2, to: 1, every: 1 }],
    ["beyond the film", { ...film, from: 170, to: 181, every: 1 }],
    ["explicit beyond the film", { ...film, at: [180.5] }],
    ["empty explicit list", { ...film, at: [] }],
  ] as const)
    TestValidator.error(label, (): number[] => planViewerFrameTimes(request));
}
