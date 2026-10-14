import type { IPlaygroundViewerPage } from "./IPlaygroundViewerPage";
import { createPlaygroundViewerPage } from "./createPlaygroundViewerPage";

/**
 * Browser process entry injected before application modules by the owned host.
 * It installs the page bridge and declares its Window binding for this program;
 * the reusable bridge contract remains an ordinary exported interface.
 */
declare global {
  /**
   * Optional original page bridge registered in this browser realm.
   *
   * @author Samchon
   */
  interface Window {
    __playgroundViewerPage?: IPlaygroundViewerPage;
  }
}

window.__playgroundViewerPage = createPlaygroundViewerPage();
const bootstrap: unknown = Reflect.get(window, "__playgroundViewerBootstrap");
if (
  window.__playgroundViewerPage !== undefined &&
  bootstrap !== null &&
  typeof bootstrap === "object"
)
  Reflect.set(bootstrap, "installed", true);
