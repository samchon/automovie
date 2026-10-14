import {
  IAutoMovieBone,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieHumanSkeleton } from "./IAutoMovieHumanSkeleton";

/** Metres per millimetre: the one conversion from Human's measurement unit to the model's. */
const METRES_PER_MILLIMETRE: number = 0.001;

/**
 * Emit a resolved skeleton as the `IAutoMovieSkeleton` films and the viewer read.
 *
 * Each bone's rest translation is its joint centre minus its parent's, converted from millimetres to metres in this one step; rest rotations are the identity and scales are one, so the emitted rig is the T-pose the joint centres describe. Human's constraints become the bones' range-of-motion overrides. Human's declared axes are not emitted yet, because `IAutoMovieBone` has no field for them; until it does, films pose every bone on the engine's default axes.
 *
 * @param skeleton Resolved skeleton, parents before children
 * @param id Rig id that poses and motions cite
 * @returns Skeleton record in metres
 */
export function emitAutoMovieHumanSkeleton(
  skeleton: IAutoMovieHumanSkeleton,
  id: string,
): IAutoMovieSkeleton {
  const positions: Map<string, IAutoMovieVector3> = new Map(
    skeleton.joints.map(
      (joint: IAutoMovieHumanSkeleton.IJoint): [string, IAutoMovieVector3] => [
        joint.bone,
        joint.position,
      ],
    ),
  );
  return {
    id,
    bones: skeleton.joints.map(
      (joint: IAutoMovieHumanSkeleton.IJoint): IAutoMovieBone => {
        const origin: IAutoMovieVector3 =
          joint.parent === null
            ? { x: 0, y: 0, z: 0 }
            : (positions.get(joint.parent) ?? { x: 0, y: 0, z: 0 });
        return {
          bone: joint.bone,
          parent: joint.parent,
          rest: {
            translation: {
              x: (joint.position.x - origin.x) * METRES_PER_MILLIMETRE,
              y: (joint.position.y - origin.y) * METRES_PER_MILLIMETRE,
              z: (joint.position.z - origin.z) * METRES_PER_MILLIMETRE,
            },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 1, y: 1, z: 1 },
          },
          constraint: joint.constraint,
        };
      },
    ),
  };
}
