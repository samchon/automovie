import type { Browser, Page } from "playwright";

/**
 * Borrowed renderer observation capabilities and the residency failure notification. The boolean reports terminal lifecycle settlement from Playwright/CDP, not measured operating-system process exit or physical GPU reclamation; residency uses that host report to settle dispatched capture ownership.
 *
 * @evidence contracts/common.md#principled-implementation Borrowed browser/page capabilities correlate terminal lifecycle signals with the resident page; failed distinguishes a cause from host-reported settlement without asserting independent OS or GPU observation.
 * @evidence contracts/common.md#clear-and-simple-design The observer receives only the browser/page operations it uses plus one failure callback, keeping recovery with residency.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inspector detachment is not itself terminal settlement, and even accepted browser/page/CDP terminal reports do not measure physical process or GPU termination.
 * @evidence contracts/common.md#meaningful-documentation Defines the resident page, borrowed lifecycle observer and the host-report limit behind capture ownership settlement.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The options declaration implements no CDP event matching; observeHumanViewerRendererTarget performs that correlation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Options carry borrowed observer capabilities rather than a shared observation cache or renderer-recovery result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Browser and page ownership remain with residency; the observer acquires subscriptions and returns its own disposal function.
 *
 * @author Samchon
 */
export interface IHumanViewerRendererTargetOptions {
  /** Browser whose root session reports target lifecycle events. */
  browser: Pick<Browser, "newBrowserCDPSession" | "on" | "off" | "isConnected">;

  /** The one resident page whose renderer is observed. */
  page: Pick<Page, "context" | "on" | "off">;

  /**
   * Called with the cause and whether the host reported terminal renderer/page lifecycle settlement. The retained parameter name does not imply independently observed OS or GPU termination.
   *
   * @evidence contracts/common.md#principled-implementation Conveys the renderer failure and the observer's terminal Playwright/CDP report; residency decides capture settlement and recovery from that host authority.
   * @evidence contracts/common.md#clear-and-simple-design Recovery is delegated to the residency owner instead of being coupled to individual CDP event handlers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither detached inspection nor the accepted terminal host report is physical GPU/OS termination measurement; no inferred physical allocation release is supplied.
   * @evidence contracts/common.md#meaningful-documentation Documents the cause, host-reported terminal condition and the physical-observation limitation despite the historical parameter name.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This notification signature selects no recovery algorithm; residency serializes replacement of the owned page.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Failure reports are notifications, while residency independently suppresses duplicate recovery of the same failed page.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Residency may settle dispatched capture ownership under a true terminal host report; false keeps it outstanding until awaited page-close completion or later terminal notification, and neither measures native memory release.
   */
  failed: (cause: string, physicalSettled: boolean) => void;
}
