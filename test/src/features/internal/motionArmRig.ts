import { indexSkeletonTopology } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { IHumanBody } from "@automovie/motions";

/**
 * Build a hand-made body for the elbow solver: a T pose with identity rest
 * rotations and the engine's default ranges, the hips at 0.9 m, the shoulder
 * joints at (±0.2, 1.4, 0), an upper arm of 0.3 m and a forearm of 0.25 m. It
 * has no contact shapes, and of the measures only the two arm lengths. Each
 * call returns a fresh body.
 */
export const motionArmRig: () => IHumanBody = (): IHumanBody => {
  const bone = (
    name: AutoMovieHumanoidBone,
    parent: AutoMovieHumanoidBone | null,
    x: number,
    y: number,
  ): IAutoMovieBone => ({
    bone: name,
    parent,
    rest: {
      translation: { x, y, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    constraint: null,
  });
  const skeleton: IAutoMovieSkeleton = {
    id: "arm-rig",
    bones: [
      bone("hips", null, 0, 0.9),
      bone("spine", "hips", 0, 0.15),
      bone("chest", "spine", 0, 0.15),
      bone("upperChest", "chest", 0, 0.1),
      bone("leftShoulder", "upperChest", 0.05, 0.1),
      bone("leftUpperArm", "leftShoulder", 0.15, 0),
      bone("leftLowerArm", "leftUpperArm", 0.3, 0),
      bone("leftHand", "leftLowerArm", 0.25, 0),
      bone("rightShoulder", "upperChest", -0.05, 0.1),
      bone("rightUpperArm", "rightShoulder", -0.15, 0),
      bone("rightLowerArm", "rightUpperArm", -0.3, 0),
      bone("rightHand", "rightLowerArm", -0.25, 0),
    ],
  };
  const rest: Map<AutoMovieHumanoidBone, IAutoMovieVector3> = new Map();
  for (const b of skeleton.bones) {
    const parent: IAutoMovieVector3 =
      b.parent === null ? { x: 0, y: 0, z: 0 } : rest.get(b.parent)!;
    rest.set(b.bone, {
      x: parent.x + b.rest.translation.x,
      y: parent.y + b.rest.translation.y,
      z: parent.z + b.rest.translation.z,
    });
  }
  return {
    skeleton,
    topology: indexSkeletonTopology(skeleton),
    rest,
    measure: { upperArm: 0.3, forearm: 0.25 },
    profile: { segments: [] },
  } as unknown as IHumanBody;
};
