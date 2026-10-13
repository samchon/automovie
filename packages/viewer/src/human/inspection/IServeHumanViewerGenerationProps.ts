import type { ServerResponse } from "node:http";

import type { createHumanViewerGenerationWindows } from "./createHumanViewerGenerationWindows.js";

/**
 * What the generation window routes act on.
 *
 * @author Samchon
 */
export interface IServeHumanViewerGenerationProps {
  /** The request URL. */
  url: URL;

  /** The response. */
  response: ServerResponse;

  /** Send a JSON answer. */
  json: (value: unknown) => void;

  /** The generation windows. */
  windows: ReturnType<typeof createHumanViewerGenerationWindows>;
}
