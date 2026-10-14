import type { IPortraitInterior as ImportedIPortraitInterior } from "@automovie/human";
import {
  IAutoMovieModelPart,
  type IAutoMovieMesh as ImportedIAutoMovieMesh,
} from "@automovie/interface";

import { createMetricMeshPart } from "../../mesh/createMetricMeshPart";
import { preparePortraitMouth } from "./preparePortraitMouth";
import { IPortraitMouthPerformance } from "./structures/IPortraitMouthPerformance";
import { IPortraitMouthShape } from "./structures/IPortraitMouthShape";
import { IPortraitMouthSocket } from "./structures/IPortraitMouthSocket";

/**
 * Preserve the direct oral builder in model metres. Native preparation owns all lining admission, closed-cavity omission and legacy crown placement, so the component and this compatibility entry cannot diverge geometrically.
 *
 * @evidence contracts/common.md#principled-implementation The established native mouth preparation lowers its interior meshes into metric model parts.
 * @evidence contracts/common.md#clear-and-simple-design Direct compatibility and component paths delegate lining, omission and crown placement to one producer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This wrapper makes no independent anatomical reconstruction or contact-success claim.
 * @evidence contracts/common.md#meaningful-documentation Prepared portrait millimetres convert through the metric-part owner exactly once.
 * @evidence contracts/performance.md#efficient-algorithms Dominant work is native preparation plus linear buffer conversion per returned interior.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared preparation prevents divergent legacy crown/lining geometry.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned model parts own lowered buffers; source/socket/shape inputs remain borrowed.
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
  ).map(
    ({
      id,
      mesh,
      material,
    }: ImportedIPortraitInterior): IAutoMovieModelPart & {
      geometry: { type: "mesh"; mesh: ImportedIAutoMovieMesh };
    } => createMetricMeshPart(id, mesh, material),
  );
}
