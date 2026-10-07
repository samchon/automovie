import type { IAutoMovieHumanBodyAnatomicalAssembly } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import type * as THREE from "three";

import type { HumanResidentPort } from "../common/HumanResidentPort";
import type { createHumanViewport } from "../common/viewport";
import type { ConnectedBodyRequest } from "./ConnectedBodyRequest";
import type { ConnectedBodyResult } from "./ConnectedBodyResult";
import type { IConnectedBodyShadowRenderer } from "./IConnectedBodyShadowRenderer";

/**
 * Host services of `createConnectedBodyViewport`.
 *
 * The canvas, pixel ratio, orbit and resize observation are the shared human
 * viewport's; the renderer additionally exposes shadow-map control. `worker`
 * starts the resident body worker and `loadTexture` resolves material assets.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Supplies the canvas, renderer, worker and textures the body display stage runs on.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Names the host services the viewport needs for camera, shadows and resident frames.
 * @author Samchon
 */
export interface IConnectedBodyViewportHost<Document> extends Pick<
  Parameters<typeof createHumanViewport>[0],
  "canvas" | "pixelRatio" | "orbit" | "observeResize"
> {
  /**
   * Shared viewport renderer with shadow-map control.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Draws the committed body with its shadows.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Combines the shared renderer contract with static shadow invalidation.
   */
  renderer: Parameters<typeof createHumanViewport>[0]["renderer"] &
    IConnectedBodyShadowRenderer;

  /**
   * Start the resident worker port.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Keeps one numerical builder alive across edits.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Supplies the worker port preview transactions use.
   */
  worker: () => HumanResidentPort<ConnectedBodyRequest, ConnectedBodyResult>;

  /**
   * Resolve a material texture asset.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Shows the body's resident material maps.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Loads texture assets for the renderer's material bindings.
   */
  loadTexture: (asset: string) => Promise<THREE.Texture>;

  /**
   * Text of a document for the worker; a body document unless the stage draws people.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Sends the stage's current document to the worker.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Lets the stage choose body or person document serialization.
   */
  serialize?: (document: Document) => string;

  /** Loaded source authority for body-only auxiliary transactions; no private geometry enters a document. */
  source?: IAutoMovieHumanBodyAnatomicalAssembly;
}
