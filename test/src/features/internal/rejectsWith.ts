/**
 * True when an asynchronous task rejects with an Error whose message contains
 * the fragment. Builds the boolean for `TestValidator.predicate`; it never
 * throws.
 */
export const rejectsWith = async (
  task: () => Promise<unknown>,
  fragment: string,
): Promise<boolean> => {
  try {
    await task();
    return false;
  } catch (error) {
    return error instanceof Error && error.message.includes(fragment);
  }
};
