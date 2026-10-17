import type { Bone } from "../geometry/Bone.ts";
import type { Mesh } from "../geometry/Mesh.ts";
import type { V3 } from "../geometry/V3.ts";

/**
 * Resolves an explicitly named rig marker in the declared reference frame.
 *
 * @evidence contracts/common.md#principled-implementation Reads registered bone coordinates without replacing them with palpable landmark assumptions.
 * @evidence contracts/common.md#clear-and-simple-design Centralizes missing-marker failure for the hand producer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing source markers fail instead of selecting a nearby bone or coordinate.
 * @evidence contracts/common.md#meaningful-documentation Defines frame ownership and absence handling.
 * @evidence contracts/performance.md#efficient-algorithms Resolves the existing named map in expected constant time and constant auxiliary space.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the mesh loader's named bone map.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns the existing coordinate and retains no additional source or handle.
 */
export function handBone(mesh: Mesh, name: string, side: "l" | "r"): V3 {
  const bone: Bone | undefined = mesh.boneByName.get(`${name}_${side}`);
  if (!bone) throw new Error(`Missing hand rig marker: ${name}_${side}`);
  return bone.pos;
}
