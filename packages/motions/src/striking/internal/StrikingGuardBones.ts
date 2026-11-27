import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";

/*
 * The canonical bone outputs needed to place both fighting guard gloves. This
 * is fixed region/shoulder metadata of an unchanged body, not posed FK.
 * Parameter body: The canonical body whose skeleton and surface table stay fixed
 * after creation.
 * Returns: A fresh read-only set of at most eight bone names.
 */
export function StrikingGuardBones(
  body: IAutoMovieMotionHumanBody,
): ReadonlySet<AutoMovieHumanoidBone> {
  return new Set<AutoMovieHumanoidBone>([
    body.surfaces.regions.chin.bone,
    body.surfaces.regions.face.bone,
    body.surfaces.regions.jawLeft.bone,
    body.surfaces.regions.jawRight.bone,
    body.surfaces.regions.earLeft.bone,
    body.surfaces.regions.earRight.bone,
    "leftUpperArm",
    "rightUpperArm",
  ]);
}
