import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import type { IHumanSourceCut } from "./IHumanSourceCut.ts";
import type { IHumanSourceGeneration } from "./IHumanSourceGeneration.ts";
import type { IHumanSourceP1 } from "./IHumanSourceP1.ts";
import type { IHumanSourceReproductionRow } from "./IHumanSourceReproductionRow.ts";

/**
 * Inputs of the carry measurement: the reproduction rows, the published bases
 * and the two written representations they are compared against.
 *
 * @author Samchon
 */
export interface IHumanSourceCarryInput {
  rows: readonly IHumanSourceReproductionRow[];
  face: IAutoMovieHumanFaceBasis;
  body: IAutoMovieHumanBodyBasis;
  cut: IHumanSourceCut;
  generation: IHumanSourceGeneration;
  p1: IHumanSourceP1;
}
