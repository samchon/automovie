import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import type { IHumanSourceCut } from "./IHumanSourceCut.ts";
import type { IHumanSourceDeltaReader } from "./IHumanSourceDeltaReader.ts";
import type { IHumanSourceSample } from "./IHumanSourceSample.ts";
import type { IHumanSourceTopology } from "./IHumanSourceTopology.ts";

/**
 * Inputs of the face reproduction. `landmarksNeutral` is the frame-mapped
 * joint-cube neutral in the sample's landmark order. `chinFactor` is the
 * lower-face preparation's recorded bake factor of the source chin endpoint
 * (`lower-face-receipt.json`). `tolerance` is the deleted recipe recovery's
 * acceptance residual in metres.
 *
 * @author Samchon
 */
export interface IHumanSourceFaceInput {
  face: IAutoMovieHumanFaceBasis;
  cut: IHumanSourceCut;
  topology: IHumanSourceTopology;
  sample: IHumanSourceSample;
  reader: IHumanSourceDeltaReader;
  landmarksNeutral: Float64Array;
  chinFactor: number;
  tolerance: number;
}
