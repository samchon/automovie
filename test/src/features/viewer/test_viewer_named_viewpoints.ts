import {
  type IAutoMovieViewerSubjectBounds,
  type IAutoMovieViewerSubjectPose,
  type IAutoMovieViewerViewpoint,
  applyAutoMovieViewerSubjectPose,
  autoMovieViewerNamedViewpoints,
  frameAutoMovieViewerSubject,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * The eight named views are the six along the world axes and two
 * three-quarter views, each named by the side of the subject its camera
 * stands on.
 *
 * Scenarios:
 *
 * 1. The plan without an argument is the eight ids in their documented order
 *    with their azimuth and elevation and a distance factor of 1.25.
 * 2. A given distance factor is carried by every view, and each call returns
 *    fresh records.
 * 3. A distance factor of zero, a negative one, NaN and infinity are refused.
 * 4. Framing a 2 m cube centred at (2,3,4) aims every view at its centre from
 *    the distance at which its bounding sphere fits a 60 degree square lens
 *    times 1.25, with the camera on +Z, -Z, +X, -X, +Y and -Y for the six
 *    axis views and raised 20 degrees between two axes for the three-quarter
 *    views.
 * 5. A camera given each framed pose looks at the centre, the front view
 *    keeps +Y up, and the top and bottom views have -Z and +Z up in the
 *    picture with +X to the right.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public view plan, frames an authored box through the public framing owner and poses an actual three.js camera, then reads the returned records and the camera's axes.
 * @evidence contracts/development/testing.md#independent-expectations Expected ids, angles and camera sides are the documented table, and the expected distance is the cube's half diagonal over the sine of half the field of view, times the factor, computed by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts each view's camera side against the other seven, the default factor against a given one, the two three-quarter views' opposite quadrants, and the picture-up of the top view against the bottom view.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own box and camera and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: The plan without an argument is the eight ids in their documented order).
 */
export function test_viewer_named_viewpoints(): void {
  const close = (
    title: string,
    actual: number[],
    expected: number[],
    tolerance: number = 1e-9,
  ): void =>
    TestValidator.predicate(
      `${title}: ${actual.join(",")} within ${tolerance} of ${expected.join(",")}`,
      actual.length === expected.length &&
        actual.every(
          (value: number, i: number): boolean =>
            Math.abs(value - expected[i]!) <= tolerance,
        ),
    );

  // 1. Ids and angles.
  const views: IAutoMovieViewerViewpoint[] = autoMovieViewerNamedViewpoints();
  TestValidator.equals("the eight named views", views, [
    { id: "front", azimuthDeg: 0, elevationDeg: 0, distanceFactor: 1.25 },
    { id: "back", azimuthDeg: 180, elevationDeg: 0, distanceFactor: 1.25 },
    { id: "right", azimuthDeg: 90, elevationDeg: 0, distanceFactor: 1.25 },
    { id: "left", azimuthDeg: 270, elevationDeg: 0, distanceFactor: 1.25 },
    { id: "top", azimuthDeg: 0, elevationDeg: 90, distanceFactor: 1.25 },
    { id: "bottom", azimuthDeg: 0, elevationDeg: -90, distanceFactor: 1.25 },
    {
      id: "three-quarter",
      azimuthDeg: 45,
      elevationDeg: 20,
      distanceFactor: 1.25,
    },
    {
      id: "three-quarter-back",
      azimuthDeg: 225,
      elevationDeg: 20,
      distanceFactor: 1.25,
    },
  ]);

  // 2. A given distance factor.
  const far: IAutoMovieViewerViewpoint[] = autoMovieViewerNamedViewpoints(2);
  TestValidator.equals(
    "a given factor is carried by every view",
    far.map((view: IAutoMovieViewerViewpoint): number => view.distanceFactor),
    [2, 2, 2, 2, 2, 2, 2, 2],
  );
  TestValidator.equals(
    "with the same ids",
    far.map((view: IAutoMovieViewerViewpoint): string => view.id),
    views.map((view: IAutoMovieViewerViewpoint): string => view.id),
  );
  far[0]!.azimuthDeg = 12;
  TestValidator.equals(
    "each call returns fresh records",
    autoMovieViewerNamedViewpoints(2)[0]!.azimuthDeg,
    0,
  );

  // 3. Refusals.
  for (const factor of [0, -1, Number.NaN, Number.POSITIVE_INFINITY])
    TestValidator.error(
      `a distance factor of ${factor} is refused`,
      (): void => {
        autoMovieViewerNamedViewpoints(factor);
      },
    );

  // 4. Camera side of each view.
  const bounds: IAutoMovieViewerSubjectBounds = {
    min: { x: 1, y: 2, z: 3 },
    max: { x: 3, y: 4, z: 5 },
  };
  // Half diagonal sqrt(3) over sin(30 degrees), times 1.25.
  const distance: number = Math.sqrt(3) * 2 * 1.25;
  const poses: Map<string, IAutoMovieViewerSubjectPose> = new Map<
    string,
    IAutoMovieViewerSubjectPose
  >(
    views.map(
      (
        view: IAutoMovieViewerViewpoint,
      ): [string, IAutoMovieViewerSubjectPose] => [
        view.id,
        frameAutoMovieViewerSubject(bounds, view, { fovDeg: 60, aspect: 1 }),
      ],
    ),
  );
  const offset = (id: string): number[] => {
    const pose: IAutoMovieViewerSubjectPose = poses.get(id)!;
    return [
      pose.position.x - pose.target.x,
      pose.position.y - pose.target.y,
      pose.position.z - pose.target.z,
    ];
  };
  for (const [id, pose] of poses) {
    TestValidator.equals(`${id} aims at the centre`, pose.target, {
      x: 2,
      y: 3,
      z: 4,
    });
    close(
      `${id} stands at the fitted distance`,
      [Math.hypot(...offset(id))],
      [distance],
    );
  }
  const axes: [id: string, side: [number, number, number]][] = [
    ["front", [0, 0, 1]],
    ["back", [0, 0, -1]],
    ["right", [1, 0, 0]],
    ["left", [-1, 0, 0]],
    ["top", [0, 1, 0]],
    ["bottom", [0, -1, 0]],
  ];
  for (const [id, side] of axes)
    close(
      `${id} stands on its axis`,
      offset(id),
      side.map((component: number): number => component * distance),
    );
  const raised: number = distance * Math.sin((20 * Math.PI) / 180);
  const quarter: number[] = offset("three-quarter");
  TestValidator.predicate(
    `three-quarter stands between +Z and +X, raised 20 degrees: ${quarter.join(",")}`,
    quarter[0]! > 1 &&
      quarter[2]! > 1 &&
      Math.abs(quarter[0]! - quarter[2]!) <= 1e-9 &&
      Math.abs(quarter[1]! - raised) <= 1e-9,
  );
  const behind: number[] = offset("three-quarter-back");
  TestValidator.predicate(
    `three-quarter-back stands between -Z and -X, raised 20 degrees: ${behind.join(",")}`,
    behind[0]! < -1 &&
      behind[2]! < -1 &&
      Math.abs(behind[0]! - behind[2]!) <= 1e-9 &&
      Math.abs(behind[1]! - raised) <= 1e-9,
  );

  // 5. Picture axes of a posed camera.
  const posed = (
    id: string,
  ): { forward: number[]; up: number[]; right: number[] } => {
    const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
    applyAutoMovieViewerSubjectPose(camera, poses.get(id)!);
    return {
      forward: camera.getWorldDirection(new THREE.Vector3()).toArray(),
      up: new THREE.Vector3()
        .setFromMatrixColumn(camera.matrixWorld, 1)
        .toArray(),
      right: new THREE.Vector3()
        .setFromMatrixColumn(camera.matrixWorld, 0)
        .toArray(),
    };
  };
  // The vertical views look along the camera's up vector, so their axes are
  // exact only to the nudge three.js applies to such a view.
  for (const id of poses.keys())
    close(
      `${id} looks at the centre`,
      posed(id).forward,
      offset(id).map((component: number): number => -component / distance),
      1e-3,
    );
  close("front keeps +Y up", posed("front").up, [0, 1, 0]);
  close("front has +X to the right", posed("front").right, [1, 0, 0]);
  close("right has -Z to the right", posed("right").right, [0, 0, -1]);
  close("top has -Z up in the picture", posed("top").up, [0, 0, -1], 1e-3);
  close("top has +X to the right", posed("top").right, [1, 0, 0], 1e-3);
  close("bottom has +Z up in the picture", posed("bottom").up, [0, 0, 1], 1e-3);
  close("bottom has +X to the right", posed("bottom").right, [1, 0, 0], 1e-3);
}
