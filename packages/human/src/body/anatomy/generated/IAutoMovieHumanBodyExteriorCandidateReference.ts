/**
 * Immutable source identity and evaluation frame for an exterior report. This source-rest convention carries no population or clinical certificate; each fulfilled measurement states its own protocol.
 *
 * @evidence contracts/common.md#principled-implementation Exact basis identity and source-rest discriminator identify the evaluation frame used by fulfilled exterior instruments.
 * @evidence contracts/common.md#clear-and-simple-design Two provenance fields separate immutable source/frame from each measurement's protocol.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source-rest evaluation certifies no observed population, clinical reconstruction or requested pose.
 * @evidence contracts/common.md#meaningful-documentation Comments state exact-basis refusal and unperformed authored rest-frame semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Exterior reference metadata runs no source compilation or instrument evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Basis/frame identity qualifies dependencies without retaining completed exterior readings.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The reference pair owns no compiled skin or measurement task.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExteriorCandidateReference {
  /** Id of the exact compiled body basis whose channels and skin the instruments used; the builder refuses a reference bound to another basis. */
  readonly basis: string;

  /** Readings are taken on the basis's authored rest frame, with no pose prescribed by the request or the reference. */
  readonly evaluation: "source-rest";
}
