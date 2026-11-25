import type { IAutoMovieSequence, IAutoMovieShot } from "@automovie/interface";
import { planPoseKeypointSidecar } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

const shot = (id: string, duration: number): IAutoMovieShot => ({
  id,
  name: null,
  scene: "scene",
  camera: "cam",
  cameraMotion: null,
  performances: [],
  objectMotions: [],
  duration,
});

/**
 * `planPoseKeypointSidecar` labels each output frame with its beat and the
 * keypoints of the actors on screen.
 *
 * Scenarios:
 *
 * 1. A cut of a 1 s shot `shot:a` then a 1 s shot `shot:b` at 4 fps has 8
 *    frames: the first four are beat `a`, the last four beat `b`, the target is
 *    the sequence id, and a shot with no staged scene has no actors.
 * 2. A frame rate of zero is refused.
 */
export function test_render_root_plan_pose_keypoint_sidecar(): void {
  const sequence: IAutoMovieSequence = {
    id: "seq",
    name: "seq",
    fps: 24,
    shots: [
      { shot: "shot:a", trim: { start: 0, duration: 1 }, transition: null },
      { shot: "shot:b", trim: { start: 0, duration: 1 }, transition: null },
    ],
  };
  const props = {
    sequence,
    shots: [shot("shot:a", 1), shot("shot:b", 1)],
    scenes: [],
    motions: [],
    skeletons: [],
  };
  const sidecar = planPoseKeypointSidecar({ ...props, fps: 4 });
  TestValidator.equals("target", [sidecar.target, sidecar.fps, sidecar.frameCount], [
    "seq",
    4,
    8,
  ]);
  TestValidator.equals(
    "beats",
    sidecar.frames.map((frame): string => frame.beat),
    ["a", "a", "a", "a", "b", "b", "b", "b"],
  );
  TestValidator.equals(
    "no actors",
    sidecar.frames.every((frame): boolean => frame.actors.length === 0),
    true,
  );
  TestValidator.error("no rate", (): void => {
    planPoseKeypointSidecar({ ...props, fps: 0 });
  });
}