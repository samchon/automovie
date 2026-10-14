/**
 * Read every head measurement on a person's skin at rest. The measurement worker parses the complete person against its generation and returns metres by registered measurement name; editor admission and clinical acquisition qualification remain separate.
 *
 * @evidence contracts/common.md#principled-implementation Complete person context and the readPersonHead discriminant select registered final rest-skin readings with request-correlated replies.
 * @evidence contracts/common.md#clear-and-simple-design The transport schema carries identity and serialized input while parsing, rest construction and measurement belong to the worker.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A numerical read request neither supplies missing source support nor admits its document into editor history.
 * @evidence contracts/common.md#meaningful-documentation The comment names complete-person provenance, rest state, registered names, metre units and separate qualification/admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The request declaration chooses no parse or head-reading implementation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Correlation identifies a request rather than reusable document equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Pending requests and generation resources remain transport and worker-owned.
 *
 * @author Samchon
 */
export interface IConnectedPersonHeadReadMessage {
  /** Correlates the reply. */
  id: number;

  /** The request kind. */
  kind: "readPersonHead";

  /** Serialized person document. */
  document: string;
}
