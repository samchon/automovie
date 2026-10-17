import { HumanViewerPage } from "./human/HumanViewerPage";

/** Mount the ordinary Human page with a document-owned render lifetime.
 *
 * The HTML entry calls this operation once. Navigation and development module
 * replacement release the same page rather than leaving its renderer or input
 * listeners active after the document is gone.
 *
 * @evidence contracts/common.md#principled-implementation The HTML entry calls one named mount operation, which registers pagehide and HMR teardown against its actual page instance.
 * @evidence contracts/common.md#clear-and-simple-design Page responsibilities remain in HumanViewerPage and its installers; this operation owns only the document lifetime.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The HTML consumes this export directly; no unused export or alternate capture-only page bypasses the ordinary entry.
 * @evidence contracts/common.md#meaningful-documentation States the caller, single-mount premise and teardown ownership.
 * @evidence contracts/performance.md#efficient-algorithms Mounting invokes one page constructor; document teardown delegates to its idempotent disposer.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The HTML starts one page lifetime; it does not coordinate equivalent requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The document retains its page until pagehide or HMR disposal; HMR removes the pagehide listener before releasing the page.
 */
export function mountHumanViewerPage(): void {
  const page: HumanViewerPage = new HumanViewerPage();
  const dispose: () => void = (): void => page.dispose();
  window.addEventListener("pagehide", dispose, { once: true });
  if (import.meta.hot !== undefined)
    import.meta.hot.dispose((): void => {
      window.removeEventListener("pagehide", dispose);
      page.dispose();
    });
}
