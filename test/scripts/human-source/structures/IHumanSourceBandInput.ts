import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import type { IHumanSourceGeneration } from "./IHumanSourceGeneration.ts";

/**
 * Inputs of the body band stage: the macro-defined generation, the published
 * face (for its jaw attachment) and body (for the anchor landmark rows), and
 * the band reach convention in metres.
 *
 * @author Samchon
 */
export interface IHumanSourceBandInput {
  generation: IHumanSourceGeneration;
  face: IAutoMovieHumanFaceBasis;
  body: IAutoMovieHumanBodyBasis;
  reachMetres: number;
}
