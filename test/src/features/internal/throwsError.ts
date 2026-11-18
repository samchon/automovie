/**
 * Observe a synchronous Error containing every requested message fragment.
 * A normal return, including a returned Promise, is no synchronous refusal.
 *
 * @param task The owned action whose actual exception is observed.
 * @param messageIncludes Every literal fragment required of that exception.
 * @returns Whether the action itself threw the requested Error.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the synchronous boundary, normal-return behavior and literal message contract.
 * @evidence contracts/development/implementation.md#principled-implementation Observes the language's thrown value, returning false after a normal call; the failure assertion runs outside this catch and therefore cannot be swallowed as the expected exception.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Normalizes the fragments once, then calls the action in one try/catch.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Requires an actual Error and every requested fragment; manufactures no exception and replaces no foreign method or global.
 * @evidence contracts/development/implementation.md#efficient-algorithms Calls the action once and checks each requested literal fragment in its message.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each invocation observes a distinct actual action; exceptions are not reusable computation.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no action or exception after returning its boolean.
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
