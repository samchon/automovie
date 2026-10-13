/**
 * One source-level loss or approximation accepted by conversion.
 *
 * @author Samchon
 */
export interface IAutoMovieExternalMotionLossEntry {
  /** Closed loss or approximation discriminator. */
  kind:
    | "channel-dropped"
    | "channel-approximated"
    | "precision-loss"
    | "semantic-loss";

  /** Stable source elements affected by the loss. */
  source: string[];

  /** Observable downstream consequence of the loss. */
  consequence: string;

  /** Whether the user explicitly accepted this loss. */
  authorized: boolean;
}
