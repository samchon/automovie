import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieSkeleton,
} from "@automovie/interface";

/** Preserve the existing combined bad target: remove rightHand, create the hips/spine cycle, point rightUpperArm to absent jaw, and append the duplicate first bone. This packages deliberate invalid input without admitting or repairing it. */
export function malformedRetargetTarget(
  skeleton: IAutoMovieSkeleton,
): IAutoMovieSkeleton {
  return {
    ...skeleton,
    id: "malformed-target",
    bones: [
      ...skeleton.bones
        .filter((b: IAutoMovieBone): boolean => b.bone !== "rightHand")
        .map(
          (b: IAutoMovieBone): IAutoMovieBone =>
            b.bone === "hips"
              ? { ...b, parent: "spine" as AutoMovieHumanoidBone }
              : b.bone === "rightUpperArm"
                ? { ...b, parent: "jaw" as AutoMovieHumanoidBone }
                : b,
        ),
      { ...skeleton.bones[0]!, parent: "spine" },
    ],
  };
}
