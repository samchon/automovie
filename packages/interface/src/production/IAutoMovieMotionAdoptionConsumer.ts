/**
 * Explicit production adoption that consumes one external motion source.
 *
 * @evidence contracts/common.md#principled-implementation Asset provenance matches the motion-adoption discriminator and exact adoption id against the production's declared external-motion selection before resident source bytes can enter conversion.
 * @evidence contracts/common.md#clear-and-simple-design One closed consumer arm names the production decision, leaving clip, actor, mapping and source path on their owning adoption and asset records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A matching asset path alone cannot authorize adoption; the current ledger must carry this exact consumer identity and the source bytes must match their digest.
 * @evidence contracts/common.md#meaningful-documentation Defines the explicit adoption role and exact production-declared id used by provenance admission.
 * @author Samchon
 */
export interface IAutoMovieMotionAdoptionConsumer {
  /** External motion adoption consumer discriminator. */
  kind: "motion-adoption";

  /** Exact production-declared adoption identity. */
  id: string;
}
