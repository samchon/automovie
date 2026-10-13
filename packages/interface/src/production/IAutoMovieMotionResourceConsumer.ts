/**
 * Sidecar bytes owned by one manifest-declared external motion asset.
 *
 * @author Samchon
 */
export interface IAutoMovieMotionResourceConsumer {
  /** External motion sidecar consumer discriminator. */
  kind: "motion-resource";

  /** Exact manifest path of the owning external motion asset. */
  id: string;
}
