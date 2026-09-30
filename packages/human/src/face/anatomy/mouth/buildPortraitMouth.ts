import { createMetricMeshPart } from "../../mesh/createMetricMeshPart";
import { preparePortraitMouth } from "./preparePortraitMouth";
import { IPortraitMouthPerformance } from "./structures/IPortraitMouthPerformance";
import { IPortraitMouthShape } from "./structures/IPortraitMouthShape";
import { IPortraitMouthSocket } from "./structures/IPortraitMouthSocket";
import { IAutoMovieModelPart } from "@automovie/interface";

/**
 * Preserve the direct oral builder in model metres. Native preparation owns
 * all lining admission, closed-cavity omission and legacy crown placement, so
 * the component and this compatibility entry cannot diverge geometrically.
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
