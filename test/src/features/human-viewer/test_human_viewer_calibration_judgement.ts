import { TestValidator } from "@nestia/e2e";

import { judgeHumanViewerCalibration } from "../../../scripts/human-viewer/judgeHumanViewerCalibration";
import { measureHumanViewerCalibration } from "../../../scripts/human-viewer/measureHumanViewerCalibration";

/**
 * Pixels are censused by colour and judged against the expected projection.
 *
 * Scenarios:
 * 1. A 10 by 10 frame with a 2 by 2 red block, a translucent red pixel and a
 *    near-red pixel counts five red pixels (the translucent one excluded, the
 *    near-red one within tolerance) at centroid (3.3, 4.9), and an absent
 *    colour has a null centroid.
 * 2. A full disc at the expected pixel is observed, the same disc 5 px away
 *    is off position, a third of the disc is partly occluded, a speck is
 *    occluded, a centre outside the picture is out of frame and a negative
 *    depth is behind the camera, and only the first is listed as observed.
 * 3. An unmeasured sphere, a zero radius and a disc without a centroid are
 *    occluded, occluded and off position.
 */
export const test_human_viewer_calibration_judgement = (): void => {
  const data = new Uint8Array(10 * 10 * 4);
  const set = (x: number, y: number, rgba: number[]): void => {
    data.set(rgba, (y * 10 + x) * 4);
  };
  for (const [x, y] of [[3, 5], [4, 5], [3, 6], [4, 6]]) set(x, y, [255, 0, 0, 255]);
  set(8, 8, [255, 0, 0, 200]);
  set(0, 0, [250, 4, 3, 255]);
  const found = measureHumanViewerCalibration(data, 10, 10, [
    { name: "red", color: [255, 0, 0] },
    { name: "blue", color: [0, 0, 255] },
  ]);
  TestValidator.equals("count", found.red.count, 5);
  TestValidator.predicate(
    "centroid",
    Math.abs((found.red.x ?? 0) - 3.3) < 1e-9 && Math.abs((found.red.y ?? 0) - 4.9) < 1e-9,
  );
  TestValidator.equals("blue", found.blue, { count: 0, x: null, y: null });
  const want = (x: number, y: number, depth = 1, radiusPx = 10) => ({ x, y, depth, radiusPx });
  const disc = Math.round(Math.PI * 100);
  const verdict = judgeHumanViewerCalibration(
    200,
    {
      good: want(100, 100),
      shifted: want(100, 100),
      partial: want(100, 100),
      hidden: want(100, 100),
      outside: want(250, 100),
      behind: want(100, 100, -1),
    },
    {
      good: { count: disc, x: 101, y: 100 },
      shifted: { count: disc, x: 105, y: 100 },
      partial: { count: Math.round(disc / 3), x: 100, y: 100 },
      hidden: { count: 5, x: 100, y: 100 },
    },
    2,
  );
  TestValidator.equals("verdicts", verdict.verdicts, {
    good: "observed",
    shifted: "off-position",
    partial: "partly-occluded",
    hidden: "occluded",
    outside: "out-of-frame",
    behind: "behind-camera",
  });
  TestValidator.equals("observed", verdict.observed, ["good"]);
  TestValidator.equals("excluded", verdict.excluded.length, 5);
  const missing = judgeHumanViewerCalibration(200, { lost: want(100, 100) }, {}, 2);
  TestValidator.equals("an unmeasured sphere is occluded", missing.verdicts.lost, "occluded");
  const nothing = judgeHumanViewerCalibration(
    200,
    { speck: want(100, 100, 1, 0) },
    { speck: { count: 1, x: 100, y: 100 } },
    2,
  );
  TestValidator.equals("a zero radius is occluded", nothing.verdicts.speck, "occluded");
  const unlocated = judgeHumanViewerCalibration(
    200,
    { gone: want(100, 100) },
    { gone: { count: disc, x: null, y: null } },
    2,
  );
  TestValidator.equals("a disc with no centroid is off position", unlocated.verdicts.gone, "off-position");
};
