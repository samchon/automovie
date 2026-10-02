/**
 * The calibration rig: spheres whose centres and colours were typed by hand
 * and are read by nothing in the code under test, so a frame that shows them
 * can be checked against arithmetic that does not touch the viewer's camera.
 * Positions are metres in the displayed model's frame (Y up, +Z toward the
 * front, origin at the head centre; a body hangs from y of about -0.08 down to
 * about -1.4). Four spheres stand in a plane 0.4 m in front of the figure at
 * x of plus and minus 0.3 and y of -0.4 and -1.0, and one stands 0.4 m behind
 * it on the midline, so a front view hides it behind the torso and a back view
 * shows it. Colours are pure unlit primaries and secondaries, so a rendered
 * pixel names its sphere exactly.
 *
 * @evidence contracts/common.md#principled-implementation The rig is declared data with units and frame, independent of the camera it calibrates.
 * @evidence contracts/common.md#clear-and-simple-design One table owns the rig for drawing, projection and judgement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coordinates are the independent reference and are never derived from the code under test.
 * @evidence contracts/common.md#meaningful-documentation States frame, units, placement reasons and the colour rule.
 * @evidence contracts/modeling.md#spatial-conventions Metres, Y up, +Z front, origin at the head centre, as the viewer's model frame.
 */
export const humanViewerCalibrationRig = [
  { name: "front-left-high", position: [0.3, -0.4, 0.4], radius: 0.03, color: [255, 0, 0] },
  { name: "front-right-high", position: [-0.3, -0.4, 0.4], radius: 0.03, color: [0, 255, 0] },
  { name: "front-left-low", position: [0.3, -1.0, 0.4], radius: 0.03, color: [0, 0, 255] },
  { name: "front-right-low", position: [-0.3, -1.0, 0.4], radius: 0.03, color: [255, 255, 0] },
  { name: "rear-midline", position: [0, -0.7, -0.4], radius: 0.03, color: [255, 0, 255] },
] as const satisfies readonly {
  name: string;
  position: readonly [number, number, number];
  radius: number;
  color: readonly [number, number, number];
}[];
