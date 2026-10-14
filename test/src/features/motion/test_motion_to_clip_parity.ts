import {
  IAutoMovieKeyframe,
  IAutoMovieBone,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { bakeTimes, clipWorldParity } from "../internal/clipParity";
import {
  createSkeleton,
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "../internal/fixtures";

/**
 * Observe motion-to-node-track agreement on the existing multi-joint/easing fixture at bake times and its interval midpoints. Fixed 8e-3-metre component and 4e-5 quaternion-dot midpoint limits are regression thresholds, not freshly measured maxima or a universal O(step squared) guarantee across easing discontinuities.
 *
 * Scenarios:
 *
 * 1. A nontrivial non-looping motion (multi-joint (shoulder two-axis, elbow, hips
 *    twist), easeInOut and cubicBezier segments, an animated root) holds
 *    world-transform parity on every bone at every baked sample time (1e-6).
 * 2. Between samples (segment midpoints) the divergence stays bounded: positions
 *    within 8e-3 m, rotations within qclose 4e-5.
 * 3. A bone rest scale ≠ 1 does not break parity: `resolvePose` ignores rest
 *    scale, and the lowered nodes pin scale to 1 to mirror it.
 *
 * @evidence contracts/testing.md#behavioral-verification clipWorldParity calls the actual bridge and both numerical playback/FK paths, compares every resolved fixture bone at default bake times and interval midpoints, then repeats bake-time agreement with one non-unit rest scale.
 * @evidence contracts/testing.md#independent-expectations Equality at the representation boundary is the preserved metamorphic contract; the original 1e-6 defaults and fixed 8e-3/4e-5 midpoint thresholds are authored expectations, not values recomputed from observed divergence. Both sides share product math, so agreement is not an independent anatomical oracle, and qclose measures unit-quaternion absolute-dot deviation rather than angular radians.
 * @evidence contracts/testing.md#distinguishing-cases Retains shoulder two-axis/elbow/hips articulation, easeInOut and cubicBezier, root translation/rotation, bake grid versus between-sample midpoints and unit versus factor-two lower-arm rest scale. Expression tracks and arbitrary discontinuities are outside these unchanged observations.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns all three parity helper calls with a nonempty rig/query population. Its private authored clip helper registers no extra cases, and no viewer, process or native artifact is started.
 */
export function test_motion_to_clip_parity(): void {
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  const motion: IAutoMovieMotion = paradeMotion();
  const times: number[] = bakeTimes(motion.duration);

  TestValidator.predicate(
    "parity at every baked sample time",
    clipWorldParity({ motion, skeleton, times }),
  );

  const midpoints: number[] = times.slice(0, -1).map((t: number, i: number): number => (t + times[i + 1]!) / 2);
  TestValidator.predicate(
    "bounded divergence between samples",
    clipWorldParity({
      motion,
      skeleton,
      times: midpoints,
      posEps: 8e-3,
      rotEps: 4e-5,
    }),
  );

  const scaled: IAutoMovieSkeleton = {
    id: skeleton.id,
    bones: skeleton.bones.map((bone: IAutoMovieBone): IAutoMovieBone =>
      bone.bone === "leftLowerArm"
        ? { ...bone, rest: { ...bone.rest, scale: { x: 2, y: 2, z: 2 } } }
        : bone,
    ),
  };
  TestValidator.predicate(
    "rest scale ignored on both sides",
    clipWorldParity({ motion, skeleton: scaled, times }),
  );
}

/** Multi-joint, multi-easing, root-animated 1 s clip. */
const paradeMotion: () => IAutoMovieMotion = (): IAutoMovieMotion => {
  const root0: IAutoMovieTransform = {
    translation: { x: 0, y: 1, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const root1: IAutoMovieTransform = {
    translation: { x: 0.4, y: 1, z: 0.2 },
    rotation: {
      x: 0,
      y: Math.sin(Math.PI / 8),
      z: 0,
      w: Math.cos(Math.PI / 8),
    },
    scale: { x: 1, y: 1, z: 1 },
  };
  const bezier: IAutoMovieKeyframe = {
    time: 0.5,
    pose: makePose(
      [
        joint("leftUpperArm", { flexion: 60, abduction: 25 }),
        joint("leftLowerArm", { flexion: 70 }),
        joint("hips", { twist: 10 }),
      ],
      root1,
    ),
    expression: null,
    easing: "cubicBezier",
    bezier: [0.42, 0, 0.58, 1],
  };
  return makeMotion(
    [
      keyframe(
        0,
        makePose(
          [
            joint("leftUpperArm", { flexion: 20, abduction: 5 }),
            joint("leftLowerArm", { flexion: 10 }),
            joint("hips", { twist: -10 }),
          ],
          root0,
        ),
        "easeInOut",
      ),
      bezier,
      keyframe(
        1,
        makePose(
          [
            joint("leftUpperArm", { flexion: 90, abduction: 45 }),
            joint("leftLowerArm", { flexion: 120 }),
            joint("hips", { twist: 20 }),
          ],
          root0,
        ),
      ),
    ],
    1,
  );
};
