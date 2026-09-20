import { portraitPart } from "../../mesh/portraitPart";
import { preparePortraitMouth } from "./preparePortraitMouth";
import { IPortraitMouthPerformance } from "./structures/IPortraitMouthPerformance";
import { IPortraitMouthShape } from "./structures/IPortraitMouthShape";
import { IPortraitMouthSocket } from "./structures/IPortraitMouthSocket";
import { IAutoMovieModelPart } from "@automovie/interface";

/**
 * Preserve the direct oral builder in model metres. Native preparation owns
 * all lining admission, closed-cavity omission and legacy crown placement, so
 * the component and this compatibility entry cannot diverge geometrically.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Publishes the prepared cavity and legacy crown interiors as model parts.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Converts each owned native oral mesh exactly once at the metric model boundary, retaining part order and material identities.
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
  ).map(({ id, mesh, material }) => portraitPart(id, mesh, material));
}
