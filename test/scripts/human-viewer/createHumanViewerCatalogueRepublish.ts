/**
 * Coalesce catalogue republication requests into one rebuild per turn of the
 * event loop. Admission verdicts arrive in bursts of hundreds when a page
 * becomes ready; rebuilding the catalogue for each of them held the server's
 * thread for tens of seconds (`/health` measured at 7–20 s). A request made
 * while one is scheduled is folded into it, so a burst costs one rebuild.
 *
 * @evidence contracts/common.md#principled-implementation Republication follows the last verdict of a burst, never each one, without delaying beyond the current turn.
 * @evidence contracts/common.md#clear-and-simple-design One owner holds the pending request.
 * @evidence contracts/common.md#meaningful-documentation States the measured cause and the folding rule.
 */
export function createHumanViewerCatalogueRepublish(rebuild: () => void): () => void {
  let scheduled = false;
  return () => {
    if (scheduled) return;
    scheduled = true;
    setImmediate(() => {
      scheduled = false;
      rebuild();
    });
  };
}
