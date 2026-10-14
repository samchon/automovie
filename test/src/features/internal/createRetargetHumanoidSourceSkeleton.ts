import type { AutoMovieHumanoidBone, IAutoMovieBone, IAutoMovieSkeleton, IAutoMovieTransform } from "@automovie/interface";

/** Build the unchanged stickman-source fixture using its original seventeen bone offsets in metres, identity rest rotations and null overrides. The conventional test geometry is not measured anatomy; moving it here preserves the existing caller while keeping its test below the source-file size limit. */
export function createRetargetHumanoidSourceSkeleton(): IAutoMovieSkeleton {
  return {
    id: "stickman-source",
    bones: [
      bone("hips", null, restAt(0, 0.92, 0)),
      bone("spine", "hips", restAt(0, 0.2, 0)),
      bone("chest", "spine", restAt(0, 0.22, 0)),
      bone("neck", "chest", restAt(0, 0.12, 0)),
      bone("head", "neck", restAt(0, 0.12, 0)),
      bone("leftUpperArm", "chest", restAt(0.17, 0.14, 0)),
      bone("leftLowerArm", "leftUpperArm", restAt(0.29, 0, 0)),
      bone("leftHand", "leftLowerArm", restAt(0.26, 0, 0)),
      bone("rightUpperArm", "chest", restAt(-0.17, 0.14, 0)),
      bone("rightLowerArm", "rightUpperArm", restAt(-0.29, 0, 0)),
      bone("rightHand", "rightLowerArm", restAt(-0.26, 0, 0)),
      bone("leftUpperLeg", "hips", restAt(0.1, -0.12, 0)),
      bone("leftLowerLeg", "leftUpperLeg", restAt(0, -0.44, 0)),
      bone("leftFoot", "leftLowerLeg", restAt(0, -0.08, 0.1)),
      bone("rightUpperLeg", "hips", restAt(-0.1, -0.12, 0)),
      bone("rightLowerLeg", "rightUpperLeg", restAt(0, -0.44, 0)),
      bone("rightFoot", "rightLowerLeg", restAt(0, -0.08, 0.1)),
    ],
  };
}

/** Allocate one original identity rest transform at the supplied metre offset. */
const restAt: (x: number, y: number, z: number) => IAutoMovieTransform = (x: number, y: number, z: number): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

/** Retain the original sparse bone identity, parent and owned rest transform with no authored constraint. */
const bone: (name: AutoMovieHumanoidBone, parent: AutoMovieHumanoidBone | null, rest: IAutoMovieTransform) => IAutoMovieBone = (
  name: AutoMovieHumanoidBone,
  parent: AutoMovieHumanoidBone | null,
  rest: IAutoMovieTransform,
): IAutoMovieBone => ({ bone: name, parent, rest, constraint: null });
