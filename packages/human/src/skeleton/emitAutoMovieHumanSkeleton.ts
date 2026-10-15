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
 * Each bone's rest translation is its joint centre minus its parent's, converted from millimetres to metres in this one step; rest rotations are the identity and scales are one, so the emitted rig is the T-pose the joint centres describe. Human's constraints become the bones' range-of-motion overrides, and Human's declared axes become each bone's `axes`, which take precedence over any table a host passes, so a pose means the same anatomical motion on this person whichever host resolves it: the fingers flex toward the palm, the thumb across it, the eyes turn and the jaw opens about their own hinges. Rest rotations are the identity, so the rest model frame directions are the bone-local axes unchanged. The forearm declares a distal twist, because pronation and supination turn the radius beyond the elbow's hinge, so twisting a bent forearm leaves where it points unchanged. Constraints for bones Human declares none for stay null, so the engine's default humanoid range applies.
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
          axes:
            joint.bone === "leftLowerArm" || joint.bone === "rightLowerArm"
              ? { ...joint.axes, twistPlacement: "distal" }
              : { ...joint.axes },
        };
      },
    ),
  };
}
