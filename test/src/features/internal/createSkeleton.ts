import { AutoMovieHumanoidBone, IAutoMovieBone, IAutoMovieSkeleton, IAutoMovieTransform } from "@automovie/interface";

function restAt(
  x: number,
  y: number,
  z: number
): IAutoMovieTransform {
  return ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});
}

function bone(
  name: AutoMovieHumanoidBone,
  parent: AutoMovieHumanoidBone | null,
  rest: IAutoMovieTransform
): IAutoMovieBone {
  return ({ bone: name, parent, rest, constraint: null });
}

/**
 * The existing twelve-bone engine test rig with local metre offsets, identity rest rotations and null authored constraints. This conventional incomplete hierarchy is not a measured Human population or a physiological model; engine default ROM remains the validation owner.
 */
export function createSkeleton(

): IAutoMovieSkeleton {
  return ({
  id: "skeleton-1",
  bones: [
    bone("hips", null, restAt(0, 1, 0)),
    bone("spine", "hips", restAt(0, 0.2, 0)),
    bone("chest", "spine", restAt(0, 0.2, 0)),
    bone("neck", "chest", restAt(0, 0.2, 0)),
    bone("head", "neck", restAt(0, 0.1, 0)),
    bone("leftUpperArm", "chest", restAt(0.2, 0, 0)),
    bone("leftLowerArm", "leftUpperArm", restAt(0.3, 0, 0)),
    bone("leftHand", "leftLowerArm", restAt(0.25, 0, 0)),
    bone("rightUpperArm", "chest", restAt(-0.2, 0, 0)),
    bone("rightLowerArm", "rightUpperArm", restAt(-0.3, 0, 0)),
    bone("leftUpperLeg", "hips", restAt(0.1, -0.1, 0)),
    bone("leftLowerLeg", "leftUpperLeg", restAt(0, -0.4, 0)),
  ],
});
}
