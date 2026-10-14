/**
 * Whether the closure refused, and its message named the stated cause.
 *
 * Behavior: Executes the supplied real operation and returns true only for an Error containing the expected cause fragment, preserving unexpected throws as a failed predicate.
 * Expectation basis: The owning entry supplies the contract-derived fragment; this reader does not generate an expected error from the implementation or verify the complete diagnostic sentence.
 * Cases: Distinguishes normal return, matching Error, nonmatching Error and a non-Error throw by its existing predicate; actual product malformed inputs remain in owning tests.
 * Execution: The existing owning entries call productionSoundRefused during their portable in-memory cases and retain responsibility for assertion expectations and dynamically invoked predicates; this helper acquires no asset, process, renderer or GPU and keeps no completed-result cache.
 */
export function productionSoundRefused(
  closure: () => unknown,
  message: string,
): boolean {
  try {
    closure();
    return false;
  } catch (error) {
    return error instanceof Error && error.message.includes(message);
  }
}
