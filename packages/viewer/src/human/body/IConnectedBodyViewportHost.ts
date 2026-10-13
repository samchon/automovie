import type { IAutoMovieHumanBodyAnatomicalAssembly } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import type * as THREE from "three";

import type { HumanResidentPort } from "../common/HumanResidentPort.js";
import type { createHumanViewport } from "../common/createHumanViewport.js";
import type { ConnectedBodyRequest } from "@automovie/human/body/runtime/ConnectedBodyRequest";
import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";
import type { IConnectedBodyShadowRenderer } from "./IConnectedBodyShadowRenderer.js";

/**
 * Host services of `createConnectedBodyViewport`.
 *
 * The canvas, pixel ratio, orbit and resize observation are the shared human
 * viewport's; the renderer additionally exposes shadow-map control. `worker`
 * starts the resident body worker and `loadTexture` resolves material assets.
 *
 * @author Samchon
 */
export interface IConnectedBodyViewportHost<Document> extends Pick<
  Parameters<typeof createHumanViewport>[0],
  "canvas" | "pixelRatio" | "orbit" | "observeResize"
> {
  /** Shared viewport renderer with shadow-map control. */
  renderer: Parameters<typeof createHumanViewport>[0]["renderer"] &
    IConnectedBodyShadowRenderer;

  /** Start the resident worker port. */
  worker: () => HumanResidentPort<ConnectedBodyRequest, ConnectedBodyResult>;

  /** Resolve a material texture asset. */
  loadTexture: (asset: string) => Promise<THREE.Texture>;

  /**
   * Text of a document for the worker; a body document unless the stage draws people.
   */
  serialize?: (document: Document) => string;

  /** Loaded source authority for body-only auxiliary transactions; no private geometry enters a document. */
  source?: IAutoMovieHumanBodyAnatomicalAssembly;
}
