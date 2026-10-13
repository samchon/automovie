import type { ViteDevServer } from "vite";

import type { HumanViewerMiddleware } from "./HumanViewerMiddleware.js";

import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue.js";
import type { IHumanViewerInstance } from "./IHumanViewerInstance.js";
import type { ISubscribeHumanViewerSourcesProps } from "./ISubscribeHumanViewerSourcesProps.js";
import type { createHumanViewerSource } from "./createHumanViewerSource.mjs";

/**
 * Ownership and readiness bindings for one attached server lifetime.
 *
 * @evidence contracts/common.md#principled-implementation A server lifetime pairs its source and process identity with explicit startup, actual page readiness and owned renderer release.
 * @evidence contracts/common.md#clear-and-simple-design Application Vite creation is injected while the viewer retains source transport and server lifetime.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only resources started by this server are closed; launcher ownership stays nullable for a directly started server.
 * @evidence contracts/common.md#meaningful-documentation Documents source ownership, HTTP composition, first-ready promise, renderer readings and final owned-resource cleanup.
 * @author Samchon
 */
export interface IStartHumanViewerServerProps {
  /**
   * Application-owned Vite configuration and HTTP middleware factory.
   *
   * @evidence contracts/common.md#principled-implementation Vite creation uses the application-owned configuration and middleware composition.
   * @evidence contracts/common.md#clear-and-simple-design The application supplies development-server creation while the viewer owns its lifetime binding.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The injected factory avoids importing application configuration through a reverse package dependency.
   * @evidence contracts/common.md#meaningful-documentation Documents application-owned asynchronous Vite server creation.
   */
  createVite: () => Promise<ViteDevServer>;

  /**
   * Publish the completed source revision through the viewer-owned transport.
   *
   * @evidence contracts/common.md#principled-implementation Revision publication emits the completed source authority through the viewer transport.
   * @evidence contracts/common.md#clear-and-simple-design Source publication stays host-owned while the transport callback performs notification.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A notification cannot certify a candidate display before its generation completes.
   * @evidence contracts/common.md#meaningful-documentation Defines the completed-source revision publication operation.
   */
  publishRevision: () => void;

  /** Source paths and selected storage owned by this server. */
  source: ReturnType<typeof createHumanViewerSource>;

  /** Public address and process-record identity. */
  instance: IHumanViewerInstance;

  /** Launcher owner, or null for a directly started server. */
  owner: number | null;

  /** Domain HTTP dispatcher installed before Vite middleware. */
  middleware: HumanViewerMiddleware;

  /**
   * Existing source-change publication, excluding the actual watcher binding.
   */
  watching: Omit<ISubscribeHumanViewerSourcesProps, "source" | "add" | "watch" | "browser">;

  /**
   * Current complete catalogue for source notifications.
   *
   * @evidence contracts/common.md#principled-implementation Server notifications read the current complete catalogue from the host.
   * @evidence contracts/common.md#clear-and-simple-design Mutable catalogue storage stays behind an accessor used at publication time.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Notification composition does not rely on an outdated captured inventory.
   * @evidence contracts/common.md#meaningful-documentation Names the catalogue accessor used by source notifications.
   */
  inventory: () => IHumanViewerCatalogue;

  /**
   * Starts this session's page and existing recovery owner.
   *
   * @evidence contracts/common.md#principled-implementation Opening starts the page and established recovery owner for this server session.
   * @evidence contracts/common.md#clear-and-simple-design The renderer/page owner retains browser startup details.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The operation does not take ownership of a page or process started by another session.
   * @evidence contracts/common.md#meaningful-documentation Defines this session's asynchronous page startup and recovery binding.
   */
  openPage: () => Promise<void>;

  /** Resolves when the first actual page is ready. */
  firstReady: Promise<void>;

  /**
   * Actual renderer string after readiness.
   *
   * @evidence contracts/common.md#principled-implementation The renderer accessor reports the actual device description available after readiness.
   * @evidence contracts/common.md#clear-and-simple-design Hardware observation stays with the renderer owner rather than server orchestration.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Startup phase completion cannot substitute for the renderer's measured description.
   * @evidence contracts/common.md#meaningful-documentation Documents the actual renderer string after page readiness.
   */
  renderer: () => string;

  /**
   * Records each startup stage.
   *
   * @evidence contracts/common.md#principled-implementation Phase publication records an actual named startup step.
   * @evidence contracts/common.md#clear-and-simple-design Startup reporting remains one host callback instead of duplicated mutable phase state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Recording a phase supplies no timer-based cancellation or visual acceptance.
   * @evidence contracts/common.md#meaningful-documentation Names the startup-stage reporting operation.
   */
  phase: (name: string) => void;

  /**
   * Existing hardware-ready publication and thumbnail maintenance.
   *
   * @evidence contracts/common.md#principled-implementation Ready publication invokes the established hardware-readiness and thumbnail maintenance owner.
   * @evidence contracts/common.md#clear-and-simple-design The server delegates post-readiness effects through one existing operation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The callback does not infer readiness solely from the listener accepting HTTP.
   * @evidence contracts/common.md#meaningful-documentation Defines hardware-ready publication and related thumbnail maintenance.
   */
  ready: () => void;

  /**
   * Closes only the browser/renderer resources this server started.
   *
   * @evidence contracts/common.md#principled-implementation Renderer closure releases only browser/render resources started by this server.
   * @evidence contracts/common.md#clear-and-simple-design The owning renderer callback retains disposal sequencing and completion.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Foreign session resources remain outside this server's cleanup authority.
   * @evidence contracts/common.md#meaningful-documentation Documents owned-resource cleanup and its asynchronous completion.
   */
  closeRenderer: () => Promise<void>;
}
