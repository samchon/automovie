import { IAutoMovieMesh } from "@automovie/interface";

import { preparePortraitDentalRow } from "./preparePortraitDentalRow";
import { IPortraitDentalRow } from "./structures/IPortraitDentalRow";

/**
 * Preserve the mesh-only dental-row API. Native preparation owns the arch,
 * optional surface separation and cervical identities, so spacing and drawing
 * cannot silently use different crown constructions.
 *
 * @evidence contracts/common.md#principled-implementation It returns the mesh half of `preparePortraitDentalRow`, so spacing and drawing use the same crown construction.
 * @evidence contracts/common.md#clear-and-simple-design A thin adapter that keeps the mesh-only API.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No shortcut: it forwards to the one producer.
 * @evidence contracts/common.md#meaningful-documentation The comment states that native preparation owns the arch, the surface separation and the cervical identities.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in the group's local frame; nothing is converted.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function adapts one producer and defines no part of its own.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel of its own.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits exactly the row's primitives.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary; the preparation owns the proximal separation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds nothing; the preparation does.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No input of this function shapes a form beyond the row's documented dimensions.
 */
export function buildPortraitDentalRow(
  input: IPortraitDentalRow,
): IAutoMovieMesh {
  return preparePortraitDentalRow(input).mesh;
}
