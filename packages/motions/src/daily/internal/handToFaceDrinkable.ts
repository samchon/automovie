import type {
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanGraspUse,
} from "@automovie/interface";

/*
 * Whether a grip was chosen for a use at a region of the face (`handToFace`):
 * its `use` brings the working point to that region, the mouth named as `mouth`
 * or as the region itself.
 * Parameter use: The grip's chosen use, if any.
 * Parameter region: The face region the task brings the working point to.
 * Returns: Whether the use brings the working point there.
 */
export function handToFaceDrinkable(
  use: IAutoMovieMotionHumanGraspUse.IUse | undefined,
  region: AutoMovieHumanoidRegion,
): boolean {
  if (use === undefined || use.at === undefined || use.at === "ahead")
    return false;
  return use.at === "mouth" ? region === "mouth" : use.at.region === region;
}
