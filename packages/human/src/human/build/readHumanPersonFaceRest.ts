import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanPersonFaceRest } from "../structures/IAutoMovieHumanPersonFaceRest";
import type { IAutoMovieHumanPersonSkinPlan } from "../structures/IAutoMovieHumanPersonSkinPlan";
import { meshOfHumanPart } from "./meshOfHumanPart";

/**
 * Read the face producer's evaluated skin back from its model, by skin vertex:
 * each head skin region's render vertices write their skin vertex, and the
 * band part's render vertices write their band view vertex.
 *
 * @evidence contracts/common.md#principled-implementation The skin is read through each region's registered corner sources, so a render split never moves a skin vertex.
 * @evidence contracts/common.md#clear-and-simple-design One pass over the head regions and one over the band part.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Vertices are addressed by source, never matched by position.
 * @evidence contracts/common.md#meaningful-documentation States what is read and how it is indexed.
 * @evidence contracts/modeling.md#spatial-conventions Metres of the face frame, as the producer emits them.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function reads parts and defines none.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The forming step owns the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
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
      for (let axis = 0; axis < 3; axis++) head[source * 3 + axis] = positions[vertex * 3 + axis];
    });
  }
  const band = plan.band;
  if (band === undefined) return { head };
  const banded = new Array<number>(band.viewBodyVertices.length * 3).fill(0);
  const { positions } = meshOfHumanPart(face.parts.find((one) => one.id === band.surface)!);
  band.sources.forEach((source, vertex) => {
    for (let axis = 0; axis < 3; axis++) banded[source * 3 + axis] = positions[vertex * 3 + axis];
  });
  return { head, band: banded };
}
