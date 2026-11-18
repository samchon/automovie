import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";

/**
 * The canonical bone outputs needed to place both fighting guard gloves.
 * This is fixed region/shoulder metadata of an unchanged body, not posed FK.
 *
 * @param body The canonical body whose skeleton and surface table stay fixed after creation.
 * @returns A fresh read-only set of at most eight bone names.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the six head-region owners, two shoulder origins and the fresh result.
 * @evidence contracts/development/implementation.md#principled-implementation Guard placement reads chin, face, both jaws, both ears and both upper-arm origins, so their actual surface-table owners and two named shoulders determine the complete needed output set.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One metadata owner serves StrikingGuard and defendGeometry's union of guard/defence outputs; FK ancestry remains with poseBones.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Stores no pose, time, joint value, target or geometry result. All authored joints still reach admission and the actual guard vector calculations and physical fits remain unchanged.
 * @evidence contracts/development/implementation.md#efficient-algorithms Six region reads and two names per call; the guard's owners prepare their FK reader from it once per action (`StrikingStance.prepareGuard`).
 * @evidence contracts/development/implementation.md#reuse-equivalent-work No store beside the body keeps the set; the body's surface table owns the regions it is read from.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh set the caller owns and retains nothing.
 */
export function StrikingGuardBones(body: IAutoMovieMotionHumanBody): ReadonlySet<AutoMovieHumanoidBone> {
  return new Set<AutoMovieHumanoidBone>([
    body.surfaces.regions.chin.bone, body.surfaces.regions.face.bone,
    body.surfaces.regions.jawLeft.bone, body.surfaces.regions.jawRight.bone,
    body.surfaces.regions.earLeft.bone, body.surfaces.regions.earRight.bone,
    "leftUpperArm", "rightUpperArm",
  ]);
}
