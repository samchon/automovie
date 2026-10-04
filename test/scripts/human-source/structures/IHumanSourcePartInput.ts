import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import type { IHumanSourceCut } from "./IHumanSourceCut.ts";
import type { IHumanSourceDeltaReader } from "./IHumanSourceDeltaReader.ts";
import type { IHumanSourceFaceReproduction } from "./IHumanSourceFaceReproduction.ts";
import type { IHumanSourceGeneration } from "./IHumanSourceGeneration.ts";
import type { IHumanSourceSample } from "./IHumanSourceSample.ts";

/**
 * Inputs of the part binding stage: the macro-defined
 * generation, the published bases, the face recipes and the sampling run
 * with its refitted parts. `offset` is the source frame convention.
 *
 * @author Samchon
 */
export interface IHumanSourcePartInput {
  generation: IHumanSourceGeneration;
  face: IAutoMovieHumanFaceBasis;
  body: IAutoMovieHumanBodyBasis;
  cut: IHumanSourceCut;
  faceRows: IHumanSourceFaceReproduction;
  sample: IHumanSourceSample;
  reader: IHumanSourceDeltaReader;
  offset: number;
}
