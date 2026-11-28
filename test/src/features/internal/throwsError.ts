/**
 * Observe an Error thrown synchronously by an action. The message must contain
 * every supplied fragment. A normal return, including a returned Promise,
 * produces false.
 *
 * @param task Action to call once.
 * @param messageIncludes Required literal fragments, with no restriction by default.
 * @returns Whether the action threw an Error with the requested message.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the synchronous boundary, actual Error type, literal fragments and ordinary-return behavior.
 * @evidence contracts/development/implementation.md#principled-implementation Calls the action inside the catch boundary and recognizes only its thrown Error. Requiring every supplied fragment distinguishes the expected refusal from a different runtime error.
 * @evidence contracts/development/implementation.md#efficient-algorithms Normalizes a single fragment to a one-item list, runs the action once and short-circuits fragment checks. It borrows supplied arrays and releases the captured error on return.
 */
export function throwsError(
  task: () => unknown,
  messageIncludes: string | readonly string[] = [],
): boolean {
  const fragments: readonly string[] =
    typeof messageIncludes === "string" ? [messageIncludes] : messageIncludes;
  try {
    task();
    return false;
  } catch (error) {
    return (
      error instanceof Error &&
      fragments.every((fragment: string): boolean =>
        error.message.includes(fragment),
      )
    );
  }
}
