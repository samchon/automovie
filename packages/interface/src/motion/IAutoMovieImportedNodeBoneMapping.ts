import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * Explicit imported-node to normalized source-bone correspondence. Node ids and
 * bone slots must each be unique, and each bone must exist on the declared
 * source skeleton. `AutoMovieIngestExternalModel.adoptMotion` admits inspected-node bindings
 * and importedNodeClipToMotion admits clip conversion inputs.
 */
export interface IAutoMovieImportedNodeBoneMapping {
  /** Exact imported node identity. */
  node: string;

  /** Explicit normalized source-rig role. */
  bone: AutoMovieHumanoidBone;
}
