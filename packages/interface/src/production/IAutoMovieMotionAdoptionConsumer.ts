/** Explicit production adoption that consumes one external motion source. */
export interface IAutoMovieMotionAdoptionConsumer {
  /** External motion adoption consumer discriminator. */
  kind: "motion-adoption";

  /** Exact production-declared adoption identity. */
  id: string;
}
