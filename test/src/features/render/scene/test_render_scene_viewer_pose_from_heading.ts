import { AutoMovieRenderSubjectViewpoint } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/** Tolerance of the unit look direction. */
const DIRECTION_TOLERANCE: number = 1e-12;

/**
 * `AutoMovieRenderSubjectViewpoint.poseFromHeading` poses a camera at a point looking along a
 * yaw and pitch, with yaw 0 looking along -Z.
 *
 * Scenarios:
 *
 * 1. From (1, 2, 3), yaw 0 and pitch 0 look at (1, 2, 2); yaw 90 looks at
 *    (0, 2, 3); pitch 90 looks at (1, 3, 3).
 * 2. The lens and clip range are carried.
 * 3. A near plane of 0 and a far plane not beyond the near are refused.
 */
export function test_render_scene_viewer_pose_from_heading(): void {
  const lens: { fovDeg: number; aspect: number } = { fovDeg: 40, aspect: 2 };
  const at = (
    yaw: number,
    pitch: number,
  ): ReturnType<typeof AutoMovieRenderSubjectViewpoint.poseFromHeading> =>
    AutoMovieRenderSubjectViewpoint.poseFromHeading(
      { x: 1, y: 2, z: 3 },
      { yaw, pitch },
      lens,
      { near: 0.1, far: 50 },
    );
  const close = (
    pose: ReturnType<typeof AutoMovieRenderSubjectViewpoint.poseFromHeading>,
    x: number,
    y: number,
    z: number,
  ): boolean =>
    Math.abs(pose.target.x - x) < DIRECTION_TOLERANCE &&
    Math.abs(pose.target.y - y) < DIRECTION_TOLERANCE &&
    Math.abs(pose.target.z - z) < DIRECTION_TOLERANCE;
  TestValidator.predicate("forward", close(at(0, 0), 1, 2, 2));
  TestValidator.predicate("yaw", close(at(90, 0), 0, 2, 3));
  TestValidator.predicate("pitch", close(at(0, 90), 1, 3, 3));
  const pose = at(0, 0);
  TestValidator.equals(
    "carried",
    [pose.position, pose.lens, pose.near, pose.far],
    [{ x: 1, y: 2, z: 3 }, lens, 0.1, 50],
  );
  for (const clip of [
    { near: 0, far: 1 },
    { near: 1, far: 1 },
  ])
    TestValidator.error(JSON.stringify(clip), (): void => {
      AutoMovieRenderSubjectViewpoint.poseFromHeading(
        { x: 0, y: 0, z: 0 },
        { yaw: 0, pitch: 0 },
        lens,
        clip,
      );
    });
}