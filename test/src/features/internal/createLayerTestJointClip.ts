import type { AutoMovieHumanoidBone, IAutoMovieMotion, IAutoMovieTransform } from "@automovie/interface";
import { joint } from "./joint";
import { keyframe } from "./keyframe";
import { makeMotion } from "./makeMotion";
import { makePose } from "./makePose";

/** Build the unchanged one-second layer fixture, including optional deliberate cross-region joint/root leakage. Values and null branches are preserved from test_perform_layer; product masking is observed by its caller, not admitted here. */
export function createLayerTestJointClip(bone: AutoMovieHumanoidBone, end: number, leak: { bone: AutoMovieHumanoidBone; end: number } | null = null, rootX: number | null = null): IAutoMovieMotion {
  return makeMotion(
    [
      keyframe(
        0,
        makePose(
          [joint(bone, { flexion: 0 }), ...(leak === null ? [] : [joint(leak.bone, { flexion: 0 })])],
          rootX === null ? null : rootAt(0),
        ),
      ),
      keyframe(
        1,
        makePose(
          [joint(bone, { flexion: end }), ...(leak === null ? [] : [joint(leak.bone, { flexion: leak.end })])],
          rootX === null ? null : rootAt(rootX),
        ),
      ),
    ],
    1,
  );
}

/** Allocate the original identity root at X, retaining every original coordinate. */
const rootAt: (x: number) => IAutoMovieTransform = (x: number): IAutoMovieTransform => ({
  translation: { x, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});
