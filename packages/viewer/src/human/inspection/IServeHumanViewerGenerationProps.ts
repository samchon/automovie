import type { ServerResponse } from "node:http";

import type { createHumanViewerGenerationWindows } from "./createHumanViewerGenerationWindows.js";

/**
 * What the generation window routes act on.
 *
 * @evidence contracts/common.md#principled-implementation Generation routes act on the existing generation-window owner and the current HTTP response.
 * @evidence contracts/common.md#clear-and-simple-design The route receives only URL, response, JSON output and generation windows.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The request binding contains no independent generation authority or replacement publication mechanism.
 * @evidence contracts/common.md#meaningful-documentation Names the request URL, response transport and generation-window state used by the route.
 * @author Samchon
 */
export interface IServeHumanViewerGenerationProps {
  /** The request URL. */
  url: URL;

  /** The response. */
  response: ServerResponse;

  /**
   * Send a JSON answer.
   *
   * @evidence contracts/common.md#principled-implementation Generation-route JSON output returns the value selected by the generation-window owner.
   * @evidence contracts/common.md#clear-and-simple-design The HTTP binding serializes while the route reads existing window state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Sending a generation answer cannot create an accepted replacement generation.
   * @evidence contracts/common.md#meaningful-documentation Names the generation route's JSON response callback.
   */
  json: (value: unknown) => void;

  /** The generation windows. */
  windows: ReturnType<typeof createHumanViewerGenerationWindows>;
}
