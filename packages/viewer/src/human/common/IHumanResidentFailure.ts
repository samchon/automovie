/**
 * A numerical refusal belonging to one resident request, without a candidate value.
 *
 * @evidence contracts/common.md#principled-implementation A false discriminator and correlation id identify a refused numerical request; the coordinator converts its error text into the rejected request's Error without admitting a value.
 * @evidence contracts/common.md#clear-and-simple-design One refusal record separates unsuccessful output from IHumanResidentSuccess, preventing optional error/value combinations in the typed transport.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The refusal retains the runtime's reason rather than inventing a model or success marker. It is a static transport type, not a runtime schema check.
 * @evidence contracts/common.md#meaningful-documentation Fields distinguish request identity, false outcome and reported reason; absence of a candidate is explicit.
 * @evidence contracts/performance.md#efficient-algorithms Envelope inspection is constant work and error transfer scales with message length, without copying a numerical model on this branch.
 * @evidence contracts/performance.md#reuse-equivalent-work Refusal settles only its pending request; equal reason strings do not make different requests interchangeable or replayable.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This record owns only id, discriminator and text. The coordinator deletes the settled pending entry and late replies retain no request authority; no native handle is stored here.
 *
 * @author Samchon
 */
export interface IHumanResidentFailure {
  /** Identity of the refused request. */
  id: number;

  /** Refusal discriminator. */
  success: false;

  /** Runtime's reported refusal reason. */
  error: string;
}
