import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Explicit imported-node to normalized source-bone correspondence.
 *
 * @author Samchon
 */
export interface IAutoMovieImportedNodeBoneMapping {
  /** Exact imported node identity. */
  node: string;
  /** Explicit normalized source-rig role. */
  bone: AutoMovieHumanoidBone;
}
