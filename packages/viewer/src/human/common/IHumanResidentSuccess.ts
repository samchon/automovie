/**
 * A resident worker's successful numerical value for one request.
 *
 * @evidence contracts/common.md#principled-implementation The true discriminator carries typed Output and its correlation id; the resident coordinator resolves only the matching pending entry from the current connection.
 * @evidence contracts/common.md#clear-and-simple-design A successful numerical value has its own record, keeping refusal text outside the value branch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Success reports runtime completion, not clinical or visual certification. The generic type does not perform runtime payload validation or synthesize a fallback value.
 * @evidence contracts/common.md#meaningful-documentation Fields state originating request id, true outcome and evaluated payload; the request's numerical owner defines the payload's admission meaning.
 * @evidence contracts/performance.md#efficient-algorithms Reading the envelope is constant work, while copying or transferring Output scales with its numerical buffers and metadata.
 * @evidence contracts/performance.md#reuse-equivalent-work A successful reply settles its request once after pending-map removal. Matching output values do not merge separate request effects or prove renderer equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Numerical payload transfers to the consuming request, and late canceled replies are ignored by the coordinator. This type stores no worker, texture or callback and defines no global output retention cache.
 *
 * @author Samchon
 */
export interface IHumanResidentSuccess<Output> {
  /** Identity of the request that produced the value. */
  id: number;

  /** Successful reply discriminator. */
  success: true;

  /** Evaluated numerical value. */
  value: Output;
}
