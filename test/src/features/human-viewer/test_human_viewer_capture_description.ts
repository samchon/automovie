import { TestValidator } from "@nestia/e2e";

import { describeHumanViewerCapture } from "../../../scripts/human-viewer/describeHumanViewerCapture";

/**
 * Capture telemetry distinguishes measured stages and actual numeric builds.
 *
 * Scenarios:
 * 1. A new build records monotonic stage differences and a separate wall-clock
 *    source-edit interval, retaining the source's actual worker duration.
 * 2. A cache hit has no numeric build or edit interval and cannot inherit the
 *    preceding worker duration as its own cost.
 */
export const test_human_viewer_capture_description = (): void => {
  const input = { doc: "body:neutral", ao: false, built: 1, buildMs: 5,
    showMs: 7, pngMs: 2, started: 10, waited: 14, decoded: 30,
    finished: 31, wallTime: 1000, pendingEditAt: 900 };
  const built = describeHumanViewerCapture(input);
  TestValidator.equals("stages", built.phases, {
    pageWaitMs: 4, showMs: 7, buildMs: 5, pngMs: 2, decodeMs: 1,
  });
  TestValidator.equals("independent clock intervals", [built.lastRender.ms, built.lastRender.sinceEditMs], [21, 100]);
  TestValidator.equals("actual build", built.lastBuild, { doc: "body:neutral", ms: 5 });
  TestValidator.equals("build wall time", built.build, { ms: 5, ao: false, at: "1970-01-01T00:00:01.000Z" });
  const cached = describeHumanViewerCapture({ ...input, built: 0, pendingEditAt: null });
  TestValidator.equals("cache has zero numeric time", cached.phases.buildMs, 0);
  TestValidator.equals("no new build", [cached.lastBuild, cached.build], [null, null]);
  TestValidator.equals("no edit interval", cached.lastRender.sinceEditMs, null);
  TestValidator.equals("cache identity", cached.lastRender.build, "cache");
};
