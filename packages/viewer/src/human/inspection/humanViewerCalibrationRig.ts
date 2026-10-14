/**
 * Authored calibration markers consumed by addHumanViewerCalibration. Positions are metres in the displayed model frame (Y up, +Z front); these conventional coordinates are independent of camera projection and do not measure anatomy.
 *
 * Four markers use z=0.4 and one uses z=-0.4. Whether the rear marker is occluded depends on the actual subject and camera. Unlit primary/secondary colors identify intended marker regions, while antialiasing, occlusion and display composition can change boundary pixels; the table alone establishes no exact pixel identity or completed calibration result.
 */
export const humanViewerCalibrationRig = [
  {
    name: "front-left-high",
    position: [0.3, -0.4, 0.4],
    radius: 0.03,
    color: [255, 0, 0],
  },
  {
    name: "front-right-high",
    position: [-0.3, -0.4, 0.4],
    radius: 0.03,
    color: [0, 255, 0],
  },
  {
    name: "front-left-low",
    position: [0.3, -1.0, 0.4],
    radius: 0.03,
    color: [0, 0, 255],
  },
  {
    name: "front-right-low",
    position: [-0.3, -1.0, 0.4],
    radius: 0.03,
    color: [255, 255, 0],
  },
  {
    name: "rear-midline",
    position: [0, -0.7, -0.4],
    radius: 0.03,
    color: [255, 0, 255],
  },
] as const satisfies readonly {
  name: string;
  position: readonly [number, number, number];
  radius: number;
  color: readonly [number, number, number];
}[];
