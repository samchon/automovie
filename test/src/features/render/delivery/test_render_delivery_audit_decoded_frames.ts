import type { IAutoMovieDecodedFrameAudit } from "@automovie/interface";
import { AutoMovieRenderDelivery } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRenderDelivery.auditDecodedFrames` checks an FFmpeg framecrc report against the
 * commissioned frame count and rate.
 *
 * Scenarios:
 *
 * 1. Three frames at 24 fps on a 1/24 time base cover their exact intervals; the
 *    audit reports 3 frames, 0.125 s, the time base and the frame that repeats
 *    the image before it.
 * 2. A missing time base, an excess frame, a malformed row, a frame off its
 *    interval and a non-positive count or rate are each refused.
 * 3. One tick on a 1/1 time base covers one frame at 1 fps. An unsafe ratio whose
 *    terms both round to the same number cannot establish that interval.
 */
export function test_render_delivery_audit_decoded_frames(): void {
  const a: string = "a".repeat(32);
  const b: string = "b".repeat(32);
  const row = (index: number, md5: string): string =>
    `0, ${index}, ${index}, 1, 100, ${md5}`;
  const report: string = ["#tb 0: 1/24", row(0, a), row(1, a), row(2, b)].join(
    "\n",
  );
  const audit = AutoMovieRenderDelivery.auditDecodedFrames(report, 3, 24);
  TestValidator.equals(
    "audit",
    [
      audit.frameCount,
      audit.durationSeconds,
      audit.timeBase,
      audit.repeatedImages,
    ],
    [3, 0.125, [1, 24], [1]],
  );
  const oneFrame: IAutoMovieDecodedFrameAudit = AutoMovieRenderDelivery.auditDecodedFrames(
    ["#tb 0: 1/1", row(0, a)].join("\n"),
    1,
    1,
  );
  TestValidator.equals(
    "one commissioned frame covers one exact tick",
    [oneFrame.timeBase, oneFrame.frames[0]?.pts, oneFrame.frames[0]?.duration],
    [[1, 1], 0, 1],
  );
  for (const [title, text, frames, fps] of [
    ["no time base", [row(0, a)].join("\n"), 1, 24],
    ["excess", ["#tb 0: 1/24", row(0, a), row(1, b)].join("\n"), 1, 24],
    ["malformed", ["#tb 0: 1/24", "0, 0, 0, 1"].join("\n"), 1, 24],
    ["off interval", ["#tb 0: 1/24", row(1, a)].join("\n"), 1, 24],
    ["no frames", report, 0, 24],
    ["no rate", report, 3, 0],
    [
      "an unsafe time base cannot round to a commissioned frame",
      ["#tb 0: 9007199254740993/9007199254740992", row(0, a)].join("\n"),
      1,
      1,
    ],
  ] as const)
    TestValidator.error(title, (): void => {
      AutoMovieRenderDelivery.auditDecodedFrames(text, frames, fps);
    });
}
