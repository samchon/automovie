import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyBasisChannel,
} from "@automovie/human";

/**
 * What the body partition view of a person generation can evaluate, read
 * from its unavailable source targets.
 *
 * @author Samchon
 */
export interface IConnectedPersonBodyReach {
  /**
   * The body view with each available channel's domain ending at the onset
   * of any unavailable envelope corrective it drives; channels with an
   * unavailable endpoint are absent. Measured solves bracket in this domain.
   */
  basis: IAutoMovieHumanBodyBasis;

  /** Channels whose own endpoint is unavailable, shown disabled. */
  missing: IAutoMovieHumanBodyBasisChannel[];

  /** Per channel id, the named reasons its domain ends early. */
  limits: Map<string, string[]>;
}
