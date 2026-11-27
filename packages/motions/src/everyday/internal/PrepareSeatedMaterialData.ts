import type { AutoMovieHumanoidBone } from "@automovie/interface";

/*
 * Pelvis and both proximal legs are the regions on the sitting face.
 */
export const SEATED: ReadonlySet<AutoMovieHumanoidBone> = new Set([
  "hips",
  "leftUpperLeg",
  "rightUpperLeg",
]);
