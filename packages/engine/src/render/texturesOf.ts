import { IAutoMovieMaterial } from "@automovie/interface";

import { materialTextureSlots } from "../validation/materialTextureSlots";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";

/** Every distinct texture asset one material binds, ascending.
 *
 * @evidence contracts/common.md#principled-implementation Read materialTextureSlots, extract each binding's asset id, deduplicate exact strings and sort by code unit; that slot owner includes supported base/detail/overlay texture consumers.
 * @evidence contracts/common.md#clear-and-simple-design Asset inventory owns only the distinct id list while materialTextureSlots owns channel semantics and decoded upload facts remain with the host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts UV or sampler differences do not create another source asset id here; this list is not GPU allocation closure and no fixture path is added.
 * @evidence contracts/common.md#meaningful-documentation Docs identify distinct bound assets in deterministic order; string shorthand and structured references have the same asset-id semantics.
 * @evidence contracts/performance.md#efficient-algorithms S slots build a set and A unique ids sort in O(S+A log A) time with O(A) output/temporary id storage.
 * @evidence contracts/performance.md#reuse-equivalent-work All texture consumers share the slot enumeration owner; no list cache survives mutable material bindings or overlays.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the new id array and the set is temporary; no decoded image, file handle or texture object is retained.
 */
export const texturesOf: (material: IAutoMovieMaterial) => string[] = (
  material: IAutoMovieMaterial,
): string[] => {
  const assets: Set<string> = new Set<string>();
  for (const { binding } of materialTextureSlots(material))
    assets.add(typeof binding === "string" ? binding : binding.asset);
  return [...assets].sort(compareAutoMovieRenderIds);
};
