import type { Page } from "playwright";

import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue";
import type { createHumanViewerCaptureLifetime } from "./createHumanViewerCaptureLifetime";

/**
 * The host state one capture reads. Each member is read at capture time
 * because the page, renderer, generation and catalogue all change while the
 * server runs.
 *
 * @evidence contracts/common.md#clear-and-simple-design The host keeps its state; the capture owner reads it through these accessors.
 * @evidence contracts/common.md#meaningful-documentation States why every member is an accessor.
 * @author Samchon
 */
export interface ICreateHumanViewerCaptureProps {
  /** The resident GPU page. */
  page: () => Page;

  /** Renderer string, empty while the page starts. */
  renderer: () => string;

  /** What the server is doing while it starts, for the refusal a capture gets meanwhile. */
  startup: () => string;

  /** Source generation the page has ready, empty while none is. */
  readyRevision: () => string;

  /** The catalogue revision the ready page itself reports, which a capture checks it is still showing. */
  pageRevision: () => string;

  /** Current catalogue. */
  inventory: () => IHumanViewerCatalogue;

  /** Dispatch ownership against renderer failure. */
  lifetime: ReturnType<typeof createHumanViewerCaptureLifetime>;

  /** Keep the renderer's heap under its limit after a capture. */
  trim: () => Promise<void>;
}
