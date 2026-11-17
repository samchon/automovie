import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";

/**
 * The canonical bone outputs needed to place both fighting guard gloves.
 * This is fixed region/shoulder metadata of an unchanged body, not posed FK.
 *
 * @param body The canonical body whose skeleton and surface table stay fixed after creation.
 * @returns A borrowed read-only set; callers needing other outputs copy it first.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the six head-region owners, two shoulder origins, unchanged-body premise and borrowed read-only result.
 * @evidence contracts/development/implementation.md#principled-implementation Guard placement reads chin, face, both jaws, both ears and both upper-arm origins, so their actual surface-table owners and two named shoulders determine the complete needed output set.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One metadata owner serves StrikingGuard and defendGeometry's union of guard/defence outputs; FK ancestry remains with poseBones.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Stores no pose, time, joint value, target or geometry result. All authored joints still reach admission and the actual guard vector calculations and physical fits remain unchanged.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cold setup visits six fixed regions and adds two shoulders; later reads borrow the same at-most-eight-name set without rebuilding it. Requested FK pays only needed ancestry while still admitting every joint; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The existing body producer fixes skeleton and surface metadata for its lifetime. A different body has a different weak key; callers must not mutate the borrowed set, and new surface/rig metadata requires a new body.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One weak body key owns at most eight bone-name strings in a set; values retain no body, posed frames or readers. Body release permits collection, and operation-specific union sets remain caller-owned.
 */
export function StrikingGuardBones(body: IAutoMovieMotionHumanBody): ReadonlySet<AutoMovieHumanoidBone> {
  let selected: ReadonlySet<AutoMovieHumanoidBone> | undefined = KEPT.get(body);
  if (selected === undefined) {
    selected = new Set<AutoMovieHumanoidBone>([
      body.surfaces.regions.chin.bone, body.surfaces.regions.face.bone,
      body.surfaces.regions.jawLeft.bone, body.surfaces.regions.jawRight.bone,
      body.surfaces.regions.earLeft.bone, body.surfaces.regions.earRight.bone,
      "leftUpperArm", "rightUpperArm",
    ]);
    KEPT.set(body, selected);
  }
  return selected;
}

/** Weak canonical metadata only, with no pose or numeric answer. */
const KEPT: WeakMap<IAutoMovieMotionHumanBody, ReadonlySet<AutoMovieHumanoidBone>> = new WeakMap();
