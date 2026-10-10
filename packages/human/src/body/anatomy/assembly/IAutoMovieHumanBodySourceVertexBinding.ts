import type { AutoMovieHumanBodyBoneId } from "../identity/AutoMovieHumanBodyBoneId";

/**
 * Offline source weights over the anatomical graph, not humanoid bone aliases.
 *
 * Four entries per vertex identify source bone ordinals and nonnegative weights
 * summing to one. Vertices are in the graph's common neutral metre frame; the
 * renderer applies each posed times inverse rest transform. No editor accepts
 * these arrays. A bone normally binds to itself; soft tissue requires actual
 * authored attachment accounts and does not acquire physiological validity
 * from linear blending.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourceVertexBinding {
  /** The ordinal-to-anatomical-bone map; each bone occurs once. */
  bones: readonly AutoMovieHumanBodyBoneId[];
  /** Four bone ordinals per surface vertex; zero-weight slots still use valid ordinals. */
  boneIndices: readonly number[];
  /** Four finite nonnegative weights per vertex, summing to one. */
  weights: readonly number[];
  /** Original or authored weighting method, site references and limitations. */
  account: string;
}
