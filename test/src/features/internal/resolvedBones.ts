import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Typed displayed bones for a unit test of a reader of joint centres: each
 * named bone at its world point, every bone turned by one rotation, local and
 * world alike, as a reader sees a rig it does not walk.
 *
 * @param points Each bone's world point, metres, in the map's order.
 * @param rotation Every bone's world rotation; the identity when absent.
 * @returns The bones by name.
 */
export function resolvedBones(
  points: readonly (readonly [AutoMovieHumanoidBone, IAutoMovieVector3])[],
  rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.identity(),
): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
  return new Map(
    points.map(
      ([bone, at]: readonly [AutoMovieHumanoidBone, IAutoMovieVector3]): [
        AutoMovieHumanoidBone,
        IAutoMovieResolvedBone,
      ] => [
        bone,
        {
          bone,
          localRotation: rotation,
          worldPosition: at,
          worldRotation: rotation,
        },
      ],
    ),
  );
}
