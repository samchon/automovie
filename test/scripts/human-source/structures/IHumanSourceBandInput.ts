import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import type { IHumanSourceBodyField } from "./IHumanSourceBodyField.ts";
import type { IHumanSourceCut } from "./IHumanSourceCut.ts";
import type { IHumanSourceDeltaReader } from "./IHumanSourceDeltaReader.ts";
import type { IHumanSourceFaceReproduction } from "./IHumanSourceFaceReproduction.ts";
import type { IHumanSourceGeneration } from "./IHumanSourceGeneration.ts";
import type { IHumanSourceSample } from "./IHumanSourceSample.ts";

/** Inputs of the band extension: the assembled generation and the upstream it came from. */
export interface IHumanSourceBandInput {
  generation: IHumanSourceGeneration;
  face: IAutoMovieHumanFaceBasis;
  body: IAutoMovieHumanBodyBasis;
  cut: IHumanSourceCut;
  faceRows: IHumanSourceFaceReproduction;
  reader: IHumanSourceDeltaReader;
  field: IHumanSourceBodyField;
  sample: IHumanSourceSample;
}
