import { extrudeAutoMovieRegion } from "@automovie/engine";
import type {
  IAutoMovieModel,
  IAutoMovieProfilePoint,
} from "@automovie/interface";

import { buildingModel } from "./buildingModel";

/**
 * Extrude an admitted XZ plan encoded in XY into a closed, oriented slab model.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The rings are the plan in metres, outer ring first. Depth extends along model-local Z; the building parent rotates it into the vertical axis.
 * @evidence contracts/development/implementation.md#principled-implementation Delegates the ring, holes and depth to the shared exact region extrusion and wraps its mesh as a scenic model.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The exterior, room and joints share one stage-ready extrusion adapter and material convention.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every authored inner ring remains a void; nothing convexifies or fills the source plan.
 * @evidence contracts/development/implementation.md#efficient-algorithms Extrusion inherits the shared triangulation cost and emits geometry bounded by the triangles and ring edges.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one solid and coordinates no calls.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned model owns the fresh extrusion buffers; the adapter retains no state.
 */
export function buildingRegionModel(
  id: string,
  name: string,
  rings: readonly IAutoMovieProfilePoint[][],
  depth: number,
  color: string,
): IAutoMovieModel {
  return buildingModel(
    id,
    name,
    {
      type: "mesh",
      mesh: extrudeAutoMovieRegion({
        outer: rings[0]!,
        holes: rings.slice(1),
        depth,
      }),
    },
    color,
  );
}
