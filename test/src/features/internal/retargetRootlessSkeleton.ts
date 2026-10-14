import type { IAutoMovieBone, IAutoMovieSkeleton } from "@automovie/interface";

/** Preserve the existing malformed-source operation by parenting hips to spine; with the caller's unchanged spine-to-hips edge this removes root reachability. Other bone records remain borrowed. */
export function retargetRootlessSkeleton(
  skeleton: IAutoMovieSkeleton,
): IAutoMovieSkeleton {
  return {
    ...skeleton,
    bones: skeleton.bones.map(
      (b: IAutoMovieBone): IAutoMovieBone =>
        b.bone === "hips" ? { ...b, parent: "spine" } : b,
    ),
  };
}
