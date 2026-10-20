/**
 * Sidecar bytes owned by one manifest-declared external motion asset.
 *
 * @evidence contracts/common.md#principled-implementation The metadata ties a motion-resource use to an intended owning source asset path. Production inventory admission is retired; actual buffer/image dependency membership and current-byte identity require explicit host verification rather than following from this id.
 * @evidence contracts/common.md#clear-and-simple-design The consumer identifies only the parent motion asset, while the containing provenance entry owns the sidecar path, bytes and digest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Naming a motion asset does not authenticate an arbitrary sidecar. The host must establish dependency membership and current byte identity; no surviving ledger gate supplies them automatically.
 * @evidence contracts/common.md#meaningful-documentation Defines the sidecar consumer discriminator and exact manifest path of its owning external motion source.
 */
export interface IAutoMovieMotionResourceConsumer {
  /** External motion sidecar consumer discriminator. */
  kind: "motion-resource";

  /** Exact manifest path of the owning external motion asset. */
  id: string;
}
