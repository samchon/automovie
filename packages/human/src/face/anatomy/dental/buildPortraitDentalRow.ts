import { IAutoMovieMesh } from "@automovie/interface";

import { preparePortraitDentalRow } from "./preparePortraitDentalRow";
import { IPortraitDentalRow } from "./structures/IPortraitDentalRow";

/**
 * Preserve the mesh-only dental-row API. Native preparation owns the arch,
 * optional surface separation and cervical identities, so spacing and drawing
 * cannot silently use different crown constructions.
 *
 * @evidence contracts/common.md#principled-implementation The mesh-only row API returns the same prepared arch, separated crown surfaces and native correspondence construction used by component consumers.
 * @evidence contracts/common.md#clear-and-simple-design Preparation owns the entire row and this adapter exposes only its owned merged mesh.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Spacing and drawing cannot silently select different crown producers; the adapter adds no target spacing adjustment or per-person override.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies compatibility scope and the shared native owner for arch, separation and cervical IDs.
 * @evidence contracts/performance.md#efficient-algorithms Cost is preparePortraitDentalRow's crown generation, guide placement and all-pair surface separation/merge; returning its mesh adds constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing mesh callers and native component callers share the same row producer rather than cache results across mutable inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned merged mesh is caller-owned and the unused preparation correspondence expires, without retained input or resource.
 */
export function buildPortraitDentalRow(
  input: IPortraitDentalRow,
): IAutoMovieMesh {
  return preparePortraitDentalRow(input).mesh;
}
