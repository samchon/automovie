/**
 * The weight range a body channel can be evaluated over on its basis, and why
 * it ends where it does.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyChannelReach {
  /** Lowest evaluable weight. */
  minimum: number;

  /** Highest evaluable weight. */
  maximum: number;

  /** One sentence per side whose reach ends before the envelope, naming the missing target. */
  limits: string[];
}
