

/** Run `fn` on the first call only: the restore idempotence guard. */
export const restoreAutoMovieRenderModeOnce = (fn: () => void): (() => void) => {
  let done = false;
  return () => {
    if (done) return;
    done = true;
    fn();
  };
};
