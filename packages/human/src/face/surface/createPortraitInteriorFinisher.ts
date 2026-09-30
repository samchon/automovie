/**
 * Bridge one native interior producer to both component consumers. The head
 * stages prepareInteriors before packing skin; existing direct callers use
 * finish. Both invoke the same producer exactly once per call, so oral geometry
 * and kinematics have one owner and never make a metres-to-millimetres round trip.
 *
 * The producer reads the sealed final skin without mutation and returns fresh
 * native meshes in head millimetres. This adapter neither caches nor clones
 * those buffers: their owner supplies them, and createMetricMeshPart owns metric packing.
 * Native indices, unit normals, material identities and order are retained.
 */
import type { IAutoMovieModelPart } from "@automovie/interface";

import { createMetricMeshPart } from "../mesh/createMetricMeshPart";
import type { IControlMesh } from "../mesh/structures/IControlMesh";
import type { IPortraitInterior } from "./structures/IPortraitInterior";

/**
 * Give a native producer the established finish API without a second geometry
 * implementation. Upper/lower dentition, tongue and oral cavity use this bridge.
 * The caller spreads the result into its attachment declaration.
 */
export function createPortraitInteriorFinisher(
  prepare: (refined: IControlMesh) => IPortraitInterior[],
) {
  return {
    prepareInteriors: prepare,
    finish: (refined: IControlMesh): IAutoMovieModelPart[] =>
      prepare(refined).map(({ id, mesh, material }) =>
        createMetricMeshPart(id, mesh, material),
      ),
  };
}
