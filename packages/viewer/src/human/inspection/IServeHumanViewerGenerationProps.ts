import type { ServerResponse } from "node:http";

import type { createHumanViewerGenerationWindows } from "./createHumanViewerGenerationWindows.js";

/**
 * What the generation window routes act on.
 *
 * @evidence contracts/common.md#principled-implementation Generation routes act on the existing generation-window owner and the current HTTP response.
 * @evidence contracts/common.md#clear-and-simple-design The route receives only URL, response, JSON output and generation windows.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The request binding contains no independent generation authority or replacement publication mechanism.
 * @evidence contracts/common.md#meaningful-documentation Names the request URL, response transport and generation-window state used by the route.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Generation routes act on the existing generation-window owner and the current HTTP response.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor The route receives only URL, response, JSON output and generation windows.
 * @author Samchon
 */
export interface IServeHumanViewerGenerationProps {
  /**
   * The request URL.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state The request URL. Generation routes act on the existing generation-window owner and the current HTTP response.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor The request URL. The route receives only URL, response, JSON output and generation windows.
   */
  url: URL;

  /**
   * The response.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state The response. Generation routes act on the existing generation-window owner and the current HTTP response.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor The response. The route receives only URL, response, JSON output and generation windows.
   */
  response: ServerResponse;

  /**
   * Send a JSON answer.
   *
   * @evidence contracts/common.md#principled-implementation Generation-route JSON output returns the value selected by the generation-window owner.
   * @evidence contracts/common.md#clear-and-simple-design The HTTP binding serializes while the route reads existing window state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Sending a generation answer cannot create an accepted replacement generation.
   * @evidence contracts/common.md#meaningful-documentation Names the generation route's JSON response callback.
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Generation-route JSON output returns the value selected by the generation-window owner.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor The HTTP binding serializes while the route reads existing window state.
   */
  json: (value: unknown) => void;

  /**
   * The generation windows.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state The generation windows. Generation routes act on the existing generation-window owner and the current HTTP response.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor The generation windows. The route receives only URL, response, JSON output and generation windows.
   */
  windows: ReturnType<typeof createHumanViewerGenerationWindows>;
}
