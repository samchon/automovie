import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import type { IHumanSourcePosteriorOcclusionSearch } from "./IHumanSourcePosteriorOcclusionSearch.ts";
import type { IHumanSourceCrownAffineFrame } from "./IHumanSourceCrownAffineFrame.ts";

/** Offline dental neutral and every endpoint transformed on the same source. */
export interface IHumanSourcePosteriorOcclusionAuthoring {
  face: IAutoMovieHumanFaceBasis;
  search: IHumanSourcePosteriorOcclusionSearch;
  frames: IHumanSourceCrownAffineFrame[];
  editedVertices: number[];
  editedEndpoints: string[];
  editedEndpointVertices: Record<string, number[]>;
  invalidatedDerivatives: string[];
}
