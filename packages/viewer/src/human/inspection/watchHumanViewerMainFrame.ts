import type { Page } from "playwright";

/**
 * Report every new document the page's main frame loads. A Vite full reload
 * replaces the host page and with it every viewer frame and the committed
 * generation, without any message the page could still send, so the server
 * learns of it only from the new document. Same-document navigations (the
 * host writes the shown address into its hash with the History API) are not
 * reloads and are not reported: `domcontentloaded` fires only for a new
 * document, unlike `framenavigated`.
 *
 * @evidence contracts/common.md#principled-implementation The server's view of the page follows the browser's own document-load event, not a timeout or a URL comparison.
 * @evidence contracts/common.md#clear-and-simple-design One native document-load observer informs the existing residency owner without another navigation-state cache.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Observes actual browser events without patching History methods or interpreting a hash-only camera update as a viewport restart.
 * @evidence contracts/common.md#meaningful-documentation States why only a new document is a reload and why the History API updates are excluded.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state The server's view of the page follows the browser's own document-load event, not a timeout or a URL comparison.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor One native document-load observer informs the existing residency owner without another navigation-state cache.
 */
export function watchHumanViewerMainFrame(
  page: Page,
  reloaded: () => void,
): void {
  page.on("domcontentloaded", () => reloaded());
}
