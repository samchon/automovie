import { TestValidator } from "@nestia/e2e";

import { humanViewerCalibrationRig } from "../../../scripts/human-viewer/humanViewerCalibrationRig";
import { projectHumanViewerCalibration } from "../../../scripts/human-viewer/projectHumanViewerCalibration";

/**
 * The independent pinhole projection reproduces hand arithmetic.
 *
 * Scenarios:
 * 1. Front camera, 2 m, 60 degrees, 600 px: the front-left-high sphere lands
 *    at x 300 + 519.615 * 0.3 / 1.6 and y 300 - 519.615 * 0.3 / 1.6, with radius
 *    519.615 * 0.03 / 1.6 px, and the target projects to the centre.
 * 2. A camera at anatomical left (yaw 90) sees +Z on the image left.
 * 3. A point behind the camera has negative depth, and the rig has five
 *    uniquely named spheres of distinct colours.
 */
export const test_human_viewer_calibration_projection = (): void => {
  const front = {
    yaw: 0,
    pitch: 0,
    distance: 2,
    target: [0, -0.7, 0] as [number, number, number],
    fov: 60,
  };
  const focal = 300 / Math.tan(Math.PI / 6);
  const near = projectHumanViewerCalibration(front, 600, [0.3, -0.4, 0.4], 0.03);
  TestValidator.predicate("x", Math.abs(near.x - (300 + (focal * 0.3) / 1.6)) < 1e-9);
  TestValidator.predicate("y", Math.abs(near.y - (300 - (focal * 0.3) / 1.6)) < 1e-9);
  TestValidator.predicate("radius", Math.abs(near.radiusPx - (focal * 0.03) / 1.6) < 1e-9);
  TestValidator.equals("depth", near.depth, 1.6);
  const centre = projectHumanViewerCalibration(front, 600, [0, -0.7, 0]);
  TestValidator.equals("target is the centre", [centre.x, centre.y, centre.radiusPx], [300, 300, 0]);
  const left = projectHumanViewerCalibration({ ...front, yaw: 90 }, 600, [0, -0.7, 0.4]);
  TestValidator.predicate(
    "left camera sees front on the image left",
    Math.abs(left.x - (300 - (focal * 0.4) / 2)) < 1e-9,
  );
  const behind = projectHumanViewerCalibration(front, 600, [0, -0.7, 3]);
  TestValidator.predicate("behind the camera", behind.depth < 0);
  const names = humanViewerCalibrationRig.map((marker) => marker.name);
  const colors = humanViewerCalibrationRig.map((marker) => marker.color.join(","));
  TestValidator.equals("unique names", new Set(names).size, 5);
  TestValidator.equals("unique colours", new Set(colors).size, 5);
};
