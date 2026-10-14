import type { Page } from "playwright";

/**
 * Observe new main documents through domcontentloaded. Same-document hash/history navigation is not a reload. Return the exact listener remover so the borrowed page's owner can join subscription withdrawal with renderer/page retirement.
 *
 * @evidence contracts/common.md#principled-implementation Uses actual domcontentloaded notifications to identify newly loaded main documents rather than same-document hash/history navigation.
 * @evidence contracts/common.md#clear-and-simple-design One exact listener exposes a remover so residency joins frame observation with its page/renderer retirement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A hash navigation is not reclassified as full source-generation loss, and cleanup removes only this listener rather than unrelated page observers.
 * @evidence contracts/common.md#meaningful-documentation Documentation distinguishes new documents, same-document navigation and returned subscription ownership.
 * @evidence contracts/performance.md#efficient-algorithms Each event invokes one callback with fixed adapter work and no page graph traversal or accumulated reload history.
 * @evidence contracts/performance.md#reuse-equivalent-work Document-load notifications are separate events rather than cacheable results; no old reload verdict is replayed into a replacement page.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the borrowed Page; the returned remover withdraws exactly one domcontentloaded listener and residency invokes it with its acquired page's cleanup.
 */
export function watchHumanViewerMainFrame(
  page: Page,
  reloaded: () => void,
): () => void {
  const loaded: () => void = (): void => reloaded();
  page.on("domcontentloaded", loaded);
  return (): void => {
    page.off("domcontentloaded", loaded);
  };
}
