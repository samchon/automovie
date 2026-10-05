import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

import type { IHumanSourceBodyReproduction } from "./IHumanSourceBodyReproduction.ts";
import type { IHumanSourceCut } from "./IHumanSourceCut.ts";
import type { IHumanSourceGeneration } from "./IHumanSourceGeneration.ts";
import type { IHumanSourceSample } from "./IHumanSourceSample.ts";

/**
 * What body field regeneration reads: the published body, the assembled
 * generation, the cut, the body rows and the sample (for the nipple fill).
 *
 * @author Samchon
 */
export interface IHumanSourceFieldInput {
  /** The published body basis. */
  body: IAutoMovieHumanBodyBasis;

  /** The assembled generation. */
  generation: IHumanSourceGeneration;

  /** The frozen cut. */
  cut: IHumanSourceCut;

  /** Body rows before regeneration. */
  bodyRows: IHumanSourceBodyReproduction;

  /** The upstream sample, whose fill operator refills the nipple region. */
  sample: IHumanSourceSample;
}
