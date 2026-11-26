import type { AutoMovieHumanoidBone } from "@automovie/interface";

import { humanoidBoneOfName } from "../internal/humanoidBoneOfName";
import type { IHumanoidSlot } from "./IHumanoidSlot";
import { object } from "./object";
import { requiredArray } from "./requiredArray";

/**
 * Resolve first-claim glTF skin joints to recognized humanoid naming slots.
 *
 * The caller has admitted skin joint indices. Nodes are visited in source
 * order, eligible only when listed in a skin, with the first recognized name
 * per slot retained; unrecognized names and later duplicate slots are ignored.
 * Returned slots describe naming correspondence rather than anatomy or positive
 * skin-weight coverage.
 */
export function gltfHumanoidBones(
  nodes: unknown[],
  skins: unknown[],
): IHumanoidSlot[] {
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
}
