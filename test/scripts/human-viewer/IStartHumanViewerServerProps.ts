import type { HumanViewerMiddleware } from "./HumanViewerMiddleware";

import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue";
import type { IHumanViewerInstance } from "./IHumanViewerInstance";
import type { ISubscribeHumanViewerSourcesProps } from "./ISubscribeHumanViewerSourcesProps";
import type { createHumanViewerSource } from "./createHumanViewerSource.mjs";

/** Ownership and readiness bindings for one attached server lifetime. @author Samchon */
export interface IStartHumanViewerServerProps {
  /** Source paths and selected storage owned by this server. */
  source: ReturnType<typeof createHumanViewerSource>;

  /** Public address and process-record identity. */
  instance: IHumanViewerInstance;

  /** Launcher owner, or null for a directly started server. */
  owner: number | null;

  /** Domain HTTP dispatcher installed before Vite middleware. */
  middleware: HumanViewerMiddleware;

  /** Existing source-change publication, excluding the actual watcher binding. */
  watching: Omit<ISubscribeHumanViewerSourcesProps, "source" | "add" | "watch" | "browser">;

  /** Current complete catalogue for source notifications. */
  inventory: () => IHumanViewerCatalogue;

  /** Starts this session's page and existing recovery owner. */
  openPage: () => Promise<void>;

  /** Resolves when the first actual page is ready. */
  firstReady: Promise<void>;

  /** Actual renderer string after readiness. */
  renderer: () => string;

  /** Records each startup stage. */
  phase: (name: string) => void;

  /** Existing hardware-ready publication and thumbnail maintenance. */
  ready: () => void;

  /** Closes only the browser/renderer resources this server started. */
  closeRenderer: () => Promise<void>;
}
