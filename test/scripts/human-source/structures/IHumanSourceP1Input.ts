import type { IAutoMovieHumanSkinLandmark, IAutoMovieHumanSkinRegion } from "@automovie/human";
import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import type { IHumanSourceBodyReproduction } from "./IHumanSourceBodyReproduction.ts";
import type { IHumanSourceCut } from "./IHumanSourceCut.ts";
import type { IHumanSourceGeneration } from "./IHumanSourceGeneration.ts";
import type { IHumanSourceTopology } from "./IHumanSourceTopology.ts";

/**
 * Inputs of the P1 pair: the published bases re-bound to the generation's one cut.
 *
 * @author Samchon
 */
export interface IHumanSourceP1Input {
  face: IAutoMovieHumanFaceBasis;
  body: IAutoMovieHumanBodyBasis;
  generation: IHumanSourceGeneration;
  cut: IHumanSourceCut;
  topology: IHumanSourceTopology;
  bodyRows: IHumanSourceBodyReproduction;

  /** Skin landmarks of the face skin surface (the head view's surface 0). */
  headLandmarks: Record<string, IAutoMovieHumanSkinLandmark>;

  /** Skin regions of the face skin surface (the head view's surface 0). */
  headRegions: Record<string, IAutoMovieHumanSkinRegion>;
}
