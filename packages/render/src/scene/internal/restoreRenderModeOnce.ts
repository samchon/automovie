/*
 * Attempt one synchronous restoration once. Later calls preserve its original
 * failure instead of reporting success or retrying a partially released
 * resource; reentrant calls do not start a second attempt.
 */
export const restoreRenderModeOnce: (fn: () => void) => () => void = (
  fn: () => void,
): (() => void) => {
  let done: boolean = false;
  let failure: { error: unknown } | undefined;
  return (): void => {
    if (done) {
      if (failure !== undefined) throw failure.error;
      return;
    }
    done = true;
    try {
      fn();
    } catch (error) {
      failure = { error };
      throw error;
    }
  };
};
