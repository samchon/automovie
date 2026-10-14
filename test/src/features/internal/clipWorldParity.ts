import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import type { IAutoMovieJointAxes } from "@automovie/engine";
import type { IAutoMovieResolvedBone } from "@automovie/engine";
import { resolvePose } from "@automovie/engine";
import { Matrix4 } from "@automovie/engine";
import type { IAutoMovieMotionClipBridge } from "@automovie/engine";
import { motionToClip } from "@automovie/engine";
import { sampleMotion } from "@automovie/engine";
import { resolveFrame } from "@automovie/engine";
import type { IAutoMovieRestFrame } from "@automovie/engine";
import { qclose } from "./qclose";
import { vclose } from "./vclose";

/**
 * Compare the existing motion/FK path with its node/clip bridge at the supplied
 * times. Missing expected bone matrices or position/rotation predicate failures
 * return false; position and sign-insensitive rotation tolerances default to
 * 1e-6. The product calls retain their own admission failures.
 *
 * Both paths share product math, so agreement is not an independent anatomical
 * oracle or a rendered-frame check. Empty queried times or no returned bones
 * make the comparison vacuously true; callers own a nonempty population and
 * the choice of bake-clock or between-sample queries. Each call bakes once and
 * retains no result after returning the boolean.
 */
export const clipWorldParity: (props: {
  motion: IAutoMovieMotion;
  skeleton: IAutoMovieSkeleton;
  times: readonly number[];
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
  sampleRate?: number;
  posEps?: number;
  rotEps?: number;
}) => boolean = (props: {
  motion: IAutoMovieMotion;
  skeleton: IAutoMovieSkeleton;
  times: readonly number[];
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
  sampleRate?: number;
  posEps?: number;
  rotEps?: number;
}): boolean => {
  const bridge: IAutoMovieMotionClipBridge = motionToClip({
    motion: props.motion,
    skeleton: props.skeleton,
    jointAxes: props.jointAxes,
    restFrames: props.restFrames,
    sampleRate: props.sampleRate,
  });
  for (const time of props.times) {
    const expected: IAutoMovieResolvedBone[] = resolvePose(
      sampleMotion(props.motion, time).pose,
      props.skeleton,
      props.jointAxes,
      props.restFrames,
    );
    const world: Map<string, number[]> = resolveFrame({
      nodes: bridge.nodes,
      clip: bridge.clip,
      limits: [],
      seconds: time,
    }).world;
    for (const bone of expected) {
      const matrix: number[] | undefined = world.get(bone.bone);
      if (matrix === undefined) return false;
      const decomposed: ReturnType<typeof Matrix4.decompose> =
        Matrix4.decompose(matrix);
      if (
        !vclose(
          Matrix4.position(matrix),
          bone.worldPosition,
          props.posEps ?? 1e-6,
        )
      )
        return false;
      if (
        !qclose(decomposed.rotation, bone.worldRotation, props.rotEps ?? 1e-6)
      )
        return false;
    }
  }
  return true;
};
