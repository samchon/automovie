import type { Page } from "playwright";

/**
 * Report every new document the page's main frame loads. A Vite full reload
 * replaces the host page and with it every viewer frame and the committed
 * generation, without any message the page could still send, so the server
 * learns of it only from the new document. Same-document navigations (the
 * host writes the shown address into its hash with the History API) are not
 * reloads and are not reported: `domcontentloaded` fires only for a new
 * document, unlike `framenavigated`.
 */
export function watchHumanViewerMainFrame(
  page: Page,
  reloaded: () => void,
): void {
  page.on("domcontentloaded", () => reloaded());
}
