import { IAutoMovieMesh } from "@automovie/interface";

import { preparePortraitOralLining } from "./preparePortraitOralLining";
import { IPortraitOralChamber } from "./structures/IPortraitOralChamber";

/**
 * Preserve the standalone lining mesh API. The same native producer supplies
 * the mouth component with both the geometry and its exact skin correspondence.
 *
 * @evidence contracts/common.md#principled-implementation It returns the mesh half of `preparePortraitOralLining`, so the standalone lining and the mouth component's lining come from one producer and exact skin correspondence cannot diverge from the standalone mesh.
 * @evidence contracts/common.md#clear-and-simple-design A thin adapter that keeps the mesh-only API.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No shortcut: it forwards to the one producer.
 * @evidence contracts/common.md#meaningful-documentation The comment states that it preserves the standalone lining API and that the component gets geometry and correspondence from the same producer.
 * @evidence contracts/modeling.md#spatial-conventions Inputs and outputs are head-frame millimetres; nothing is converted.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function adapts one producer and defines no part of its own.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel of its own.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits exactly the preparation's primitives.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary; the preparation owns the rim join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint of its own.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds nothing; the preparation does.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No input of this function shapes a form beyond the preparation's documented dimensions.
 */
export function buildPortraitOralLining(
  surface: {
    positions: readonly (readonly number[])[];
    indices: readonly number[];
  },
  seed: number,
  depth: number,
  wall: number,
  chamber?: IPortraitOralChamber,
): IAutoMovieMesh {
  return preparePortraitOralLining(surface, seed, depth, wall, chamber).mesh;
}
