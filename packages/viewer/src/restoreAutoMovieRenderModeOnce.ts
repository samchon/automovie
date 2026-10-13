

/** Run `fn` on the first call only: the restore idempotence guard. 
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-beauty-structural-distinction Owns idempotent closure of one pass-local GPU override lifetime.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Owns idempotent closure of one pass-local GPU override lifetime.
 */
export const restoreAutoMovieRenderModeOnce = (fn: () => void): (() => void) => {
  let done = false;
  return () => {
    if (done) return;
    done = true;
    fn();
  };
};
