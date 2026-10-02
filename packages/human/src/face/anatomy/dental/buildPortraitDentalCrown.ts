import { IAutoMovieMesh } from "@automovie/interface";

import { preparePortraitDentalCrown } from "./preparePortraitDentalCrown";
import { IPortraitDentalCrown } from "./structures/IPortraitDentalCrown";

/**
 * Build the standalone enamel mesh through the same native crown producer used
 * by dental rows. Existing callers retain the mesh-only API and owned buffers.
 *
 * @evidence contracts/common.md#principled-implementation It returns the mesh half of `preparePortraitDentalCrown`, so a standalone crown and a crown of a row come from one loft.
 * @evidence contracts/common.md#clear-and-simple-design A thin adapter that keeps the mesh-only API.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No shortcut: it forwards to the one producer.
 * @evidence contracts/common.md#meaningful-documentation The comment states that it uses the same producer as the rows and that buffers are owned.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in the crown's local frame; nothing is converted.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function adapts one producer and defines no part of its own.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel of its own.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits exactly the loft's primitives.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds nothing; the preparation does.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No input of this function shapes a form beyond the crown's documented dimensions.
 */
export function buildPortraitDentalCrown(
  shape: IPortraitDentalCrown,
  mesialDirection: number = 1,
): IAutoMovieMesh {
  return preparePortraitDentalCrown(shape, mesialDirection).mesh;
}
