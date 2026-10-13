/**
 * Coalesce catalogue republication requests into one rebuild per turn of the
 * event loop. Admission verdicts arrive in bursts of hundreds when a page
 * becomes ready; rebuilding the catalogue synchronously for each of them
 * blocks ordinary requests on that same thread. A request made
 * while one is scheduled is folded into it, so a burst costs one rebuild.
 */
export function createHumanViewerCatalogueRepublish(
  rebuild: () => void,
): () => void {
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
