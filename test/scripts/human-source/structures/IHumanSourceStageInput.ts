import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

import type { IHumanSourceBodyField } from "./IHumanSourceBodyField.ts";
import type { IHumanSourceCut } from "./IHumanSourceCut.ts";
import type { IHumanSourceDeltaReader } from "./IHumanSourceDeltaReader.ts";
import type { IHumanSourceSample } from "./IHumanSourceSample.ts";

/**
 * A historical body publication to compare the upstream replay against, on
 * the published body's vertex order (it must share the published triangles).
 *
 * @author Samchon
 */
export interface IHumanSourceStageInput {
  stage: IAutoMovieHumanBodyBasis;
  revision: string;
  cut: IHumanSourceCut;
  reader: IHumanSourceDeltaReader;
  field: IHumanSourceBodyField;
  sample: IHumanSourceSample;
}
