/** Observe a thrown or rejected Error containing every requested message fragment. */
export async function rejectsError(
  task: () => Promise<unknown>,
  messageIncludes: string | readonly string[] = [],
): Promise<boolean> {
  const fragments: readonly string[] =
    typeof messageIncludes === "string" ? [messageIncludes] : messageIncludes;
  try {
    await task();
    return false;
  } catch (error) {
    return (
      error instanceof Error &&
      fragments.every((fragment: string): boolean => error.message.includes(fragment))
    );
  }
}
