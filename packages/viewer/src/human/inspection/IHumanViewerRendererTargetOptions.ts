import type { Browser, Page } from "playwright";

/**
 * What the renderer observer watches and whom it tells. `failed` receives a
 * cause and whether the renderer has physically stopped; only a physical stop
 * may release captures that were already dispatched to it.
 *
 * @evidence contracts/common.md#principled-implementation Separates physical renderer settlement from uncertain transport loss in the callback contract.
 * @evidence contracts/common.md#meaningful-documentation States what each member supplies.
 *
 * @evidence contracts/common.md#clear-and-simple-design Borrowed browser and page projections expose only the lifecycle events needed to correlate the owned renderer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Physical-settlement evidence comes from actual lifecycle events, never inferred solely from a lost transport connection.
 *
 * @author Samchon
 */
export interface IHumanViewerRendererTargetOptions {
  /** Browser whose root session reports target lifecycle events. */
  browser: Pick<Browser, "newBrowserCDPSession" | "on" | "off" | "isConnected">;

  /** The one resident page whose renderer is observed. */
  page: Pick<Page, "context" | "on" | "off">;

  /**
   * Called with the cause and whether the renderer physically stopped.
   *
   * @evidence contracts/common.md#principled-implementation Actual target lifecycle evidence reports both failure cause and physical settlement.
   * @evidence contracts/common.md#clear-and-simple-design The observer reports evidence while the capture lifetime owner decides release.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A lost CDP transport alone cannot certify that dispatched renderer work stopped.
   * @evidence contracts/common.md#meaningful-documentation The boolean distinguishes physical stop from uncertain transport loss.
   */
  failed: (cause: string, physicalSettled: boolean) => void;
}
