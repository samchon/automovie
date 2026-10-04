import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

import type { IHumanSourceBodyField } from "./IHumanSourceBodyField.ts";
import type { IHumanSourceCut } from "./IHumanSourceCut.ts";
import type { IHumanSourceDeltaReader } from "./IHumanSourceDeltaReader.ts";
import type { IHumanSourceSample } from "./IHumanSourceSample.ts";

/** Inputs of the body reproduction: the published body and the replayed source field. */
export interface IHumanSourceBodyInput {
  body: IAutoMovieHumanBodyBasis;
  cut: IHumanSourceCut;
  reader: IHumanSourceDeltaReader;
  field: IHumanSourceBodyField;
  sample: IHumanSourceSample;
}
