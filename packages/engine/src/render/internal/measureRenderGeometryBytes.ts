import type {
  IAutoMovieMeasureRenderSimulation,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieRenderModelCost,
} from "@automovie/interface";

import { compareRenderIds } from "./compareRenderIds";

/*
 * The render inventory's geometry memory phase: the resident buffer bytes of
 * every drawn model, added to the ground and simulated bytes the earlier phases
 * counted.
 *
 * Models are visited in id order, so the sum adds in one fixed order. A model
 * the population phase flattened into one buffer pads its attributes the way
 * the renderer does: mixing coloured and bare parts gives every vertex a
 * white-default RGB triple, and mixing relief-weighted and bare parts gives
 * every vertex a relief factor of one, each counted once per prototype in
 * 32-bit floats. Each model's bytes join its cost record and one
 * `geometryBytes` row.
 * Returns: The geometry bytes of the frame.
 */
export function measureRenderGeometryBytes(props: {
  /*
   * Ground and simulated buffer bytes the earlier phases counted.
   */
  base: number;

  /*
   * The subject's models by id.
   */
  byId: ReadonlyMap<string, IAutoMovieModel>;

  /*
   * Ids of the models the population phase drew.
   */
  drawnModels: ReadonlySet<string>;

  /*
   * Ids of the drawn models it flattened into one buffer.
   */
  flattenedModels: ReadonlySet<string>;

  /*
   * Each drawn model's cost record; this phase adds the padding bytes.
   */
  costs: ReadonlyMap<string, IAutoMovieRenderModelCost>;

  /*
   * Appends one owner row.
   */
  add: IAutoMovieMeasureRenderSimulation.IProps["add"];
}): number {
  const { byId, costs, add }: typeof props = props;
  let geometryBytes: number = props.base;
  for (const id of [...props.drawnModels].sort(compareRenderIds)) {
    const cost: IAutoMovieRenderModelCost = costs.get(id)!;
    if (props.flattenedModels.has(id)) {
      // Flattening mixed RGB/bare parts gives every vertex a white-default RGB
      // triple. Count that resident padding once per prototype, not per slot.
      const coloredComponents: number = byId
        .get(id)!
        .parts.reduce(
          (sum: number, part: IAutoMovieModelPart): number =>
            sum +
            (part.geometry.type === "mesh" &&
            part.geometry.mesh.colors !== undefined
              ? part.geometry.mesh.positions.length
              : 0),
          0,
        );
      if (coloredComponents !== 0)
        cost.geometryBytes +=
          (cost.vertices * 3 - coloredComponents) *
          Float32Array.BYTES_PER_ELEMENT;

      // and mixed weighted/bare parts every vertex a relief factor of one
      const weightedVertices: number = byId
        .get(id)!
        .parts.reduce(
          (sum: number, part: IAutoMovieModelPart): number =>
            sum +
            (part.geometry.type === "mesh" &&
            part.geometry.mesh.reliefWeights !== undefined
              ? part.geometry.mesh.positions.length / 3
              : 0),
          0,
        );
      if (weightedVertices !== 0)
        cost.geometryBytes +=
          (cost.vertices - weightedVertices) * Float32Array.BYTES_PER_ELEMENT;
    }
    geometryBytes += cost.geometryBytes;
    add(`model:${id}`, `models["${id}"]`, "geometryBytes", cost.geometryBytes);
  }
  return geometryBytes;
}
