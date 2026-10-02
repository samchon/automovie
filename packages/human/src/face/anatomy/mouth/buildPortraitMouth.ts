import { IAutoMovieModelPart } from "@automovie/interface";

import { createMetricMeshPart } from "../../mesh/createMetricMeshPart";
import { preparePortraitMouth } from "./preparePortraitMouth";
import { IPortraitMouthPerformance } from "./structures/IPortraitMouthPerformance";
import { IPortraitMouthShape } from "./structures/IPortraitMouthShape";
import { IPortraitMouthSocket } from "./structures/IPortraitMouthSocket";

/**
 * Preserve the direct oral builder in model metres. Native preparation owns
 * all lining admission, closed-cavity omission and legacy crown placement, so
 * the component and this compatibility entry cannot diverge geometrically.
 *
 * @evidence contracts/common.md#principled-implementation It is the metre-boundary adapter over `preparePortraitMouth`: the same native preparation supplies the millimetre interiors and `createMetricMeshPart` converts each once, so the direct builder and the component cannot place the interior differently.
 * @evidence contracts/common.md#clear-and-simple-design A thin adapter that exists only to keep the direct entry; all admission and placement stay in the preparation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No shortcut: it calls the one producer and converts units.
 * @evidence contracts/common.md#meaningful-documentation The comment states that it preserves the direct builder in model metres and that native preparation owns admission, closed-cavity omission and crown placement.
 * @evidence contracts/modeling.md#spatial-conventions Inputs are millimetres in the head frame; outputs are metres, converted once by `createMetricMeshPart`.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function converts the prepared interiors and defines no part of its own.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits exactly the primitives the preparation prepared.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary; the preparation owns the rim join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint of its own.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds nothing; the preparation does.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No input of this function shapes a form beyond the preparation's own named dimensions.
 */
export function buildPortraitMouth(
  source: number[][],
  socket: IPortraitMouthSocket,
  shape: IPortraitMouthShape,
  performance?: IPortraitMouthPerformance,
  skinIndices?: readonly number[],
): IAutoMovieModelPart[] {
  return preparePortraitMouth(
    source,
    socket,
    shape,
    performance,
    skinIndices,
  ).map(({ id, mesh, material }) => createMetricMeshPart(id, mesh, material));
}
