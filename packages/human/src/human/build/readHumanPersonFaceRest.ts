import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanPersonFaceRest } from "../structures/IAutoMovieHumanPersonFaceRest";
import type { IAutoMovieHumanPersonSkinPlan } from "../structures/IAutoMovieHumanPersonSkinPlan";
import { meshOfHumanPart } from "./meshOfHumanPart";

/**
 * Read the face producer's evaluated skin back from its model, by skin vertex:
 * each head skin region's render vertices write their skin vertex, and the
 * band part's render vertices write their band view vertex.
 */
export function readHumanPersonFaceRest(
  plan: IAutoMovieHumanPersonSkinPlan,
  face: IAutoMovieModel,
): IAutoMovieHumanPersonFaceRest {
  const head = new Array<number>(plan.faceCount * 3).fill(0);
  for (const part of face.parts) {
    const sources = plan.faceRegions.get(part.id);
    if (sources === undefined) continue;
    const { positions } = meshOfHumanPart(part);
    sources.forEach((source, vertex) => {
      for (let axis = 0; axis < 3; axis++)
        head[source * 3 + axis] = positions[vertex * 3 + axis];
    });
  }
  const band = plan.band;
  if (band === undefined) return { head };
  const banded = new Array<number>(band.viewBodyVertices.length * 3).fill(0);
  const { positions } = meshOfHumanPart(
    face.parts.find((one) => one.id === band.surface)!,
  );
  band.sources.forEach((source, vertex) => {
    for (let axis = 0; axis < 3; axis++)
      banded[source * 3 + axis] = positions[vertex * 3 + axis];
  });
  return { head, band: banded };
}
