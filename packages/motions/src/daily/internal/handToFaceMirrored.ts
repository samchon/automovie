import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
} from "@automovie/interface";

/*
 * The region a row names for a hand (`handToFace`): the right hand's region,
 * mirrored for the left.
 * Parameter region: The right hand's region.
 * Parameter side: The hand.
 * Returns: The region.
 */
export function handToFaceMirrored(
  region: AutoMovieHumanoidRegion,
  side: AutoMovieHumanSide,
): AutoMovieHumanoidRegion {
  if (side === "right") return region;
  return region.endsWith("Right")
    ? (region.replace(/Right$/, "Left") as AutoMovieHumanoidRegion)
    : region.endsWith("Left")
      ? (region.replace(/Left$/, "Right") as AutoMovieHumanoidRegion)
      : region;
}
