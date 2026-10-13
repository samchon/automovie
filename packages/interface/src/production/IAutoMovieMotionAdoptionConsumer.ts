/**
 * Explicit production adoption that consumes one external motion source.
 *
 * @author Samchon
 */
export interface IAutoMovieMotionAdoptionConsumer {
  /** External motion adoption consumer discriminator. */
  kind: "motion-adoption";

  /** Exact production-declared adoption identity. */
  id: string;
}
