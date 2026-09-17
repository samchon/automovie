/**
 * Bridge one native interior producer to both component consumers. The head
 * stages prepareInteriors before packing skin; existing direct callers use
 * finish. Both invoke the same producer exactly once per call, so oral geometry
 * and kinematics have one owner and never make a metres-to-millimetres round trip.
 *
 * The producer reads the sealed final skin without mutation and returns fresh
 * native meshes in head millimetres. This adapter neither caches nor clones
 * those buffers: their owner supplies them, and portraitPart owns metric packing.
 * Native indices, unit normals, material identities and order are retained.
 */
import type { IAutoMovieModelPart } from "@automovie/interface";

import { portraitPart } from "./geometry";
import type { IPortraitInterior } from "./portraitComponents";
import type { IControlMesh } from "./subdivideControlMesh";

/**
 * Give a native producer the established finish API without a second geometry
 * implementation. Upper/lower dentition, tongue and oral cavity use this bridge.
 * The caller spreads the result into its attachment declaration.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Keeps component replacement compatible while exposing owned interiors before model packing.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Shares one refined-surface producer between native preparation and the existing component finisher.
 */
export function createPortraitInteriorFinisher(
  prepare: (refined: IControlMesh) => IPortraitInterior[],
) {
  return {
    prepareInteriors: prepare,
    finish: (refined: IControlMesh): IAutoMovieModelPart[] =>
      prepare(refined).map(({ id, mesh, material }) =>
        portraitPart(id, mesh, material),
      ),
  };
}
