import { type IAutoMovieViewerSubjectBounds, type IAutoMovieViewerSubjectPose, AutoMovieRenderSubjectViewpoint } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/** Tolerance of the closed-form positions, metres. */
const POSITION_TOLERANCE: number = 1e-9;

/**
 * `frameAutoMovieViewerSubject` aims a view at the box centre from the distance
 * at which the bounding sphere fits the lens, times the view's factor.
 *
 * Scenarios:
 *
 * 1. A 2 m cube centred at (2,3,4) under a 60 degree square lens: the distance
 *    is half diagonal sqrt(3) over sin 30 degrees times 1.25.
 * 2. The front view stands on +Z and the top view on +Y at that distance, both
 *    aimed at the centre.
 */
export function test_render_scene_frame_viewer_subject(): void {
  const bounds: IAutoMovieViewerSubjectBounds = {
    min: { x: 1, y: 2, z: 3 },
    max: { x: 3, y: 4, z: 5 },
  };
  const distance: number = Math.sqrt(3) * 2 * 1.25;
  const lens: { fovDeg: number; aspect: number } = { fovDeg: 60, aspect: 1 };
  const front: IAutoMovieViewerSubjectPose = AutoMovieRenderSubjectViewpoint.frameAutoMovieViewerSubject(
    bounds,
    { id: "front", azimuthDeg: 0, elevationDeg: 0, distanceFactor: 1.25 },
    lens,
  );
  const top: IAutoMovieViewerSubjectPose = AutoMovieRenderSubjectViewpoint.frameAutoMovieViewerSubject(
    bounds,
    { id: "top", azimuthDeg: 0, elevationDeg: 90, distanceFactor: 1.25 },
    lens,
  );
  TestValidator.equals("front target", front.target, { x: 2, y: 3, z: 4 });
  TestValidator.equals("top target", top.target, { x: 2, y: 3, z: 4 });
  TestValidator.predicate(
    "front stands on +Z",
    Math.abs(front.position.x - 2) < POSITION_TOLERANCE &&
      Math.abs(front.position.y - 3) < POSITION_TOLERANCE &&
      Math.abs(front.position.z - (4 + distance)) < POSITION_TOLERANCE,
  );
  TestValidator.predicate(
    "top stands on +Y",
    Math.abs(top.position.x - 2) < POSITION_TOLERANCE &&
      Math.abs(top.position.y - (3 + distance)) < POSITION_TOLERANCE &&
      Math.abs(top.position.z - 4) < POSITION_TOLERANCE,
  );
}
