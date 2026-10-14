
import { AutoMovieHumanoidBone, IAutoMovieBone, IAutoMovieSkeleton } from "@automovie/interface";
import { canonicalAutoMovieJsonBytes } from "./contentIdentity";
import { productionExternalMotionProjectedNativeBone as projectedNativeBone } from "./productionExternalMotionProjectedNativeBone";

/**
 * Compare mapped native rig records against target bones with unmapped helpers collapsed.
 *
 * Rig ids must match, each mapped source bone must exist, and the target projection must canonically encode to identical bytes. Equality is exact, including rest/constraint fields; this comparison does not establish visual similarity or tolerate floating-point differences.
 *
 * @evidence contracts/common.md#principled-implementation Inventory/model admission supplies unique, finite, acyclic rig records and mapping. Bone maps and a mapped set support ancestor projection before canonical comparison; this helper does not independently enforce those premises and duplicate bone keys would otherwise overwrite.
 * @evidence contracts/common.md#clear-and-simple-design The native-mode resolver owns incompatibility diagnostics and the choice to require explicit retarget mode; this internal predicate supplies only compatibility under the existing projected-TRS policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native mismatch never silently retargets. Exact canonical equality is the supported policy, while helper collapse carries the documented TRS/shear and acyclic-input limitations rather than a clinical equivalence claim.
 * @evidence contracts/common.md#meaningful-documentation Documents id/mapped-bone admission, strict rest/constraint identity, prior skeleton validation and projection limitations.
 * @evidence contracts/performance.md#efficient-algorithms Bone maps cost O(Bs+Bt) and a K-entry mapped set; each bone can walk H ancestors, compose rest data and canonicalize complete source/projected records. Overlapping ancestor chains are recomputed, and string/constraint byte size contributes to comparisons.
 * @evidence contracts/performance.md#reuse-equivalent-work The source/target maps and mapped set are reused across all selected bones in one call; projected ancestors and compatibility results are not cached across different rig/mapping generations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Maps and projected copies expire after the boolean result; rig arrays remain borrowed. No byte/population limit, host handle or running task is introduced.
 */
export function productionExternalMotionNativeRigCompatible(source: IAutoMovieSkeleton, mapped: readonly AutoMovieHumanoidBone[], target: IAutoMovieSkeleton): boolean {
  if (source.id !== target.id) return false;
  const sourceBones: Map<AutoMovieHumanoidBone, IAutoMovieBone> = new Map(source.bones.map((bone: IAutoMovieBone): [AutoMovieHumanoidBone, IAutoMovieBone] => [bone.bone, bone]));
  const targetBones: Map<AutoMovieHumanoidBone, IAutoMovieBone> = new Map(target.bones.map((bone: IAutoMovieBone): [AutoMovieHumanoidBone, IAutoMovieBone] => [bone.bone, bone]));
  const mappedBones: Set<AutoMovieHumanoidBone> = new Set(mapped);
  for (const bone of mappedBones) {
    const from: IAutoMovieBone | undefined = sourceBones.get(bone);
    const to: IAutoMovieBone | null = projectedNativeBone(targetBones, mappedBones, bone);
    if (
      from === undefined ||
      to === null ||
      Buffer.from(canonicalAutoMovieJsonBytes(from)).equals(
        Buffer.from(canonicalAutoMovieJsonBytes(to)),
      ) === false
    )
      return false;
  }
  return true;
}
