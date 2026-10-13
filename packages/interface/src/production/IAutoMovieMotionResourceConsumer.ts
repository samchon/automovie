/**
 * Sidecar bytes owned by one manifest-declared external motion asset.
 *
 * @evidence contracts/common.md#principled-implementation The ledger ties a motion-resource use to the owning source asset path; inventory admission verifies that the registered resource is an actual buffer or image dependency of that current motion source.
 * @evidence contracts/common.md#clear-and-simple-design The consumer identifies only the parent motion asset, while the containing provenance entry owns the sidecar path, bytes and digest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Arbitrary sidecars cannot gain authorization by naming a motion asset; both dependency membership and current registered byte identity are required.
 * @evidence contracts/common.md#meaningful-documentation Defines the sidecar consumer discriminator and exact manifest path of its owning external motion source.
 * @author Samchon
 */
export interface IAutoMovieMotionResourceConsumer {
  /** External motion sidecar consumer discriminator. */
  kind: "motion-resource";

  /** Exact manifest path of the owning external motion asset. */
  id: string;
}
