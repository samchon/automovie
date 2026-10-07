import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyToeRay } from "@automovie/human/body/structures/rig/IAutoMovieHumanBodyToeRay";
import type { IAutoMovieHumanSkinLandmark } from "@automovie/human/common/basis/IAutoMovieHumanSkinLandmark";
import type { IAutoMovieHumanSkinRegion } from "@automovie/human/common/basis/IAutoMovieHumanSkinRegion";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFacePeriocular } from "@automovie/human/face/structures/IAutoMovieHumanFacePeriocular";

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

  /** Periocular registration of the face (`defineHumanSourcePeriocular`). */
  periocular: IAutoMovieHumanFacePeriocular;

  /** Per-ray toe bones from the default rig, or null when the sample carries no toe ray weights. */
  toeRays: IAutoMovieHumanBodyToeRay[] | null;

  /** Default-rig toe phalanx weights per generation sample, or null when not sampled. */
  sampleRays: [string, number][][] | null;

  /** Canonical root to native sampling ordinal; toe weights remain native. */
  sourceToNative?: Int32Array;
}
