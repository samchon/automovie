import type { Browser, Page } from "playwright";

/**
 * What the renderer observer watches and whom it tells. `failed` receives a
 * cause and whether the renderer has physically stopped; only a physical stop
 * may release captures that were already dispatched to it.
 *
 * @evidence contracts/common.md#principled-implementation Separates physical renderer settlement from uncertain transport loss in the callback contract.
 * @evidence contracts/common.md#meaningful-documentation States what each member supplies.
 * @author Samchon
 */
export interface IHumanViewerRendererTargetOptions {
  /** Browser whose root session reports target lifecycle events. */
  browser: Pick<Browser, "newBrowserCDPSession" | "on" | "off" | "isConnected">;

  /** The one resident page whose renderer is observed. */
  page: Pick<Page, "context" | "on" | "off">;

  /** Called with the cause and whether the renderer physically stopped. */
  failed: (cause: string, physicalSettled: boolean) => void;
}
