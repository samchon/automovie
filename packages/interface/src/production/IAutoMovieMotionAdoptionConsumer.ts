/**
 * Explicit production adoption that consumes one external motion source.
 *
 * @evidence contracts/common.md#principled-implementation The discriminator and id declare a provenance use by one intended production adoption. The production ledger resolver is retired; Engine texture closure does not resolve this arm and the record establishes no byte or conversion authorization itself.
 * @evidence contracts/common.md#clear-and-simple-design One closed consumer arm names the production decision, leaving clip, actor, mapping and source path on their owning adoption and asset records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A matching asset path or id alone cannot authorize adoption. An explicit host must resolve the intended consumer and verify current source bytes rather than treating the declaration as an executed check.
 * @evidence contracts/common.md#meaningful-documentation Defines the explicit adoption role and exact production-declared id used by provenance admission.
 * @author Samchon
 */
export interface IAutoMovieMotionAdoptionConsumer {
  /** External motion adoption consumer discriminator. */
  kind: "motion-adoption";

  /** Exact production-declared adoption identity. */
  id: string;
}
