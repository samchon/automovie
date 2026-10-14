import type { AutoMovieHumanoidBone } from "@automovie/interface";

import { humanoidBoneOfName } from "../internal/humanoidBoneOfName";
import type { IHumanoidSlot } from "./IHumanoidSlot";
import { object } from "./object";
import { requiredArray } from "./requiredArray";

/**
 * Resolve first-claim glTF skin joints to recognized humanoid naming slots.
 *
 * The caller has admitted skin joint indices. Nodes are visited in source order, eligible only when listed in a skin, with the first recognized name per slot retained; unrecognized names and later duplicate slots are ignored. Returned slots describe naming correspondence rather than anatomy or positive skin-weight coverage.
 *
 * @evidence contracts/common.md#principled-implementation Skin joint indices define eligible nodes and normalized aliases assign at most one source-order node per semantic slot.
 * @evidence contracts/common.md#clear-and-simple-design Skin membership and slot claiming stay here while the shared name helper owns this importer's supported naming vocabulary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unrecognized names and repeated slots remain unmapped instead of overwriting first ownership or inferring missing anatomy.
 * @evidence contracts/common.md#meaningful-documentation Comments state node-order first claim, skin-only eligibility and the distinction from actual weight coverage.
 * @evidence contracts/performance.md#efficient-algorithms Work follows skins, their joint entries, nodes and eligible node-name text, with expected constant-time membership and slot lookups.
 * @evidence contracts/performance.md#reuse-equivalent-work Each eligible node name is resolved once; the inspector separately shares mesh/skin weight checks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary membership sets die with the call; returned slot records are bounded by the recognized humanoid vocabulary.
 * @author Samchon
 */
export const gltfHumanoidBones: (
  nodes: unknown[],
  skins: unknown[],
) => IHumanoidSlot[] = (
  nodes: unknown[],
  skins: unknown[],
): IHumanoidSlot[] => {
  const joints: Set<unknown> = new Set<unknown>(
    skins.flatMap((value: unknown, index: number): unknown[] =>
      requiredArray(
        object(value, `skins[${index}]`).joints,
        `skins[${index}].joints`,
      ),
    ),
  );
  const used: Set<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>();
  const slots: IHumanoidSlot[] = [];
  nodes.forEach((value: unknown, index: number): void => {
    if (joints.has(index) === false) return;
    const name: unknown = object(value, `nodes[${index}]`).name;
    if (typeof name !== "string") return;
    const bone: AutoMovieHumanoidBone | undefined = humanoidBoneOfName(name);
    if (bone === undefined || used.has(bone)) return;
    used.add(bone);
    slots.push({ bone, node: index });
  });
  return slots;
};
