/**
 * Read every registered face measurement on a person's face. The worker parses the serialized complete person against its paired generation and reads the final whole-person construction. A reading can be unavailable with a named reason; the request does not admit or commit that document.
 *
 * @evidence contracts/common.md#principled-implementation The discriminant selects final-person face reading and the id correlates its reply, while serialized input preserves complete face/body context.
 * @evidence contracts/common.md#clear-and-simple-design This transport schema carries a document and request identity; worker parsing, construction and measurement remain numerical owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A read request neither invents missing landmark support nor treats returned measurement records as accepted editor history.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies paired-generation parsing, final construction, named unavailability and the absence of document commit authority.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The message interface selects no parsing, geometry or measurement implementation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A correlation id is not a document-equivalence or numerical-cache key.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type owns no pending request, worker or retained model lifetime.
 *
 * @author Samchon
 */
export interface IConnectedPersonFaceReadMessage {
  /** Correlates the reply. */
  id: number;

  /** The request kind. */
  kind: "readFaceMeasurements";

  /** Serialized person document. */
  document: string;
}
