
import { AutoMovieHumanoidBone, IAutoMovieBone, IAutoMovieSkeleton } from "@automovie/interface";
import { productionExternalMotionComposeNativeRest as composeNativeRest } from "./productionExternalMotionComposeNativeRest";

/**
 * Project a target bone relative to its nearest mapped ancestor under the existing TRS recipe.
 *
 * Missing terminal or helper returns null. Otherwise the unmapped ancestor chain is reversed for parent-to-child composition, preserving the terminal constraint as a clone. Unique acyclic hierarchy and admitted rest values are caller premises; cycles are not guarded by this walk.
 *
 * @evidence contracts/common.md#principled-implementation The native compatibility owner uses the same helper-collapse representation as the admitted source mapping. Component TRS composition preserves the established recipe but cannot carry shear from rotated nonuniform scales; this is not full affine equivalence.
 * @evidence contracts/common.md#clear-and-simple-design One internal projection separates mapped hierarchy/rest calculation from canonical native comparison and its diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing ancestors are refused, not guessed from names. No cycle repair, normalization tolerance or shear decomposition is invented to make an incompatible rig compare equal.
 * @evidence contracts/common.md#meaningful-documentation Documents nearest mapped parent, ordered helper chain, null refusal, copied constraint and acyclic/TRS representation limits.
 * @evidence contracts/performance.md#efficient-algorithms A chain of H helpers requires O(H) lookup/storage/composition plus cloning the terminal constraint; overlapping chains can be revisited by the owning compatibility scan.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller's bone map and mapped set are reused, but this projection owns no retained ancestor/result cache for mutable skeletons.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Chain references are local and the returned bone/constraint copy transfers to immediate comparison. No handle/task is opened and hierarchy depth is not capped here.
 */
export function productionExternalMotionProjectedNativeBone(bones: ReadonlyMap<
    AutoMovieHumanoidBone,
    IAutoMovieSkeleton["bones"][number]
  >, mapped: ReadonlySet<AutoMovieHumanoidBone>, bone: AutoMovieHumanoidBone): IAutoMovieSkeleton["bones"][number] | null {
  const terminal: IAutoMovieBone | undefined = bones.get(bone);
  if (terminal === undefined) return null;
  const chain: IAutoMovieSkeleton["bones"][number][] = [terminal];
  let parent: AutoMovieHumanoidBone | null = terminal.parent;
  while (parent !== null && mapped.has(parent) === false) {
    const helper: IAutoMovieBone | undefined = bones.get(parent);
    if (helper === undefined) return null;
    chain.push(helper);
    parent = helper.parent;
  }
  let rest: IAutoMovieSkeleton["bones"][number]["rest"] = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  for (const member of chain.reverse())
    rest = composeNativeRest(rest, member.rest);
  return {
    bone,
    parent,
    rest,
    constraint: structuredClone(terminal.constraint),
  };
}
