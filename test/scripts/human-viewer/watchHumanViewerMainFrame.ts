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
 * @evidence contracts/common.md#meaningful-documentation States why only a new document is a reload and why the History API updates are excluded.
 */
export function watchHumanViewerMainFrame(page: Page, reloaded: () => void): void {
  page.on("domcontentloaded", () => reloaded());
}
