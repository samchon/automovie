/**
 * Immutable numerical input and its correlation identity sent to a resident worker.
 *
 * @evidence contracts/common.md#principled-implementation The envelope pairs numerical Input with the coordinator's increasing id so concurrent replies can settle their originating request. Consumers must not mutate input during its transport/processing; TypeScript fields are not readonly and this type does not enforce immutability.
 * @evidence contracts/common.md#clear-and-simple-design Correlation is transport metadata around the numerical request, leaving body and face operation grammar with their respective runtimes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No consumer name or fixture id changes admission. The number id has no safe-integer exhaustion guard in the current coordinator, an extreme lifetime limitation rather than an arbitrary wrapping rule.
 * @evidence contracts/common.md#meaningful-documentation Fields identify correlation and numerical runtime admission; the comment's immutable input is a caller obligation, not a runtime freeze.
 * @evidence contracts/performance.md#efficient-algorithms Envelope construction is constant work; serialization, native structured transfer and numerical processing scale with the actual Input payload.
 * @evidence contracts/performance.md#reuse-equivalent-work A new id identifies each request even when input text matches because exports and numerical requests can have independent effects. No document-only memoization is implied.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The pending coordinator retains settlement callbacks, while queued transport/runtime owners can retain the payload until processing. This record imposes no pending count or payload byte limit and stores no renderer handle.
 *
 * @author Samchon
 */
export interface IHumanResidentRequest<Input> {
  /** Monotonically assigned identity of this connection's request. */
  id: number;

  /** Numerical input admitted by the selected runtime. */
  input: Input;
}
