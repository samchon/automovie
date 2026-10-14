/** Observe a synchronous Error containing every requested message fragment. A returned Promise is not a synchronous refusal. */
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
