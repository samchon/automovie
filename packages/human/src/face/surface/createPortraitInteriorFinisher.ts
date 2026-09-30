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
 *
 * @evidence contracts/common.md#principled-implementation One native producer serves both the staged prepareInteriors consumer and the direct finish consumer, so oral geometry has one owner and is converted from head millimetres to model metres exactly once, in createMetricMeshPart.
 * @evidence contracts/common.md#clear-and-simple-design A two-member adapter over the producer with no cache or option.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No second geometry implementation and no conversion round trip.
 * @evidence contracts/common.md#meaningful-documentation States who calls which member, the read-only use of the sealed skin and the ownership of buffers.
 * @evidence contracts/modeling.md#spatial-conventions Head millimetres in, model metres out through the single named createMetricMeshPart step.
 * @evidenceExclude contracts/anatomy.md#anatomical-source createPortraitInteriorFinisher carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range createPortraitInteriorFinisher admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority createPortraitInteriorFinisher defines no input through which a caller shapes a human form.
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
