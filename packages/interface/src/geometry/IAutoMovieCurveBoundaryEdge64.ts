/**
 * Directed declaration authorizing one named boundary owner and its receiving
 * region and node.
 *
 * Binding requires the context's exact published object and both declared
 * receiving keys.
 */
export interface IAutoMovieCurveBoundaryEdge64 {
  /**
   * Unique boundary identity inside the context, used to resolve publication
   * and consumption.
   */
  id: string;

  /** Region key required when the owner publishes the boundary. */
  ownerRegion: string;

  /** Declared hierarchy node key needed on the publication call. */
  ownerBone: string;

  /** Region key required when the recipient binds the genuine publication. */
  consumerRegion: string;

  /** Declared receiving hierarchy node key needed on the binding call. */
  consumerBone: string;
}
