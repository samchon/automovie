import type {
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

import type { IBodyCorrectiveWorld } from "./IBodyCorrectiveWorld";
import { meshOfSegment } from "./bodyContactGeometry";
import type { IBodySegmented } from "./readBodyContacts";

/**
 * The segments of a body given as bare positions in basis vertex order, the
 * form the solver works in while it pushes: one mesh part per bone segment
 * and the basis vertices each part reads, as `createHumanBodySegmenter`
 * returns for a built body. Only the parts a crossing reading needs are
 * filled in: the model has no materials, skeleton or body.
 */
export function segmentBodyPositions(
  world: IBodyCorrectiveWorld,
  positions: number[],
): IBodySegmented {
  const sources = new Map<string, number[]>();
  const parts: IAutoMovieModelPart[] = [...world.segments].map(
    ([bone, corners]) => {
      sources.set(bone, [...new Set(corners)]);
      return {
        id: bone,
        name: null,
        geometry: { type: "mesh", mesh: meshOfSegment(positions, corners) },
        material: null,
        attachedBone: null,
        transform: null,
      };
    },
  );
  const model: IAutoMovieModel = {
    id: "segmented",
    name: null,
    origin: "imported",
    parts,
    skeleton: null,
    body: null,
    materials: [],
    asset: null,
  };
  return { model, sources };
}
