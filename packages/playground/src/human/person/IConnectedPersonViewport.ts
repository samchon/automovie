import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

import type { IConnectedPersonModel } from "./IConnectedPersonModel";

/**
 * What the person panel needs of its viewport: build a person document in the
 * worker, publish or dispose a built model, export the static file, cancel
 * pending work, and frame the camera. `createConnectedBodyViewport` over a
 * person worker supplies it.
 *
 * @author Samchon
 */
export interface IConnectedPersonViewport<Model extends IConnectedPersonModel> {
  /** Build a person document; rejects with the runtime's refusal. */
  build(document: IAutoMovieHumanPersonDocument): Promise<Model>;

  /** Withdraw the pending build. */
  cancel(): void;

  /** Draw a built model. */
  publish(model: Model): void;

  /** Release a model that will not be drawn. */
  dispose(model: Model): void;

  /** Export the static GLB of a person document. */
  export(document: IAutoMovieHumanPersonDocument): Promise<Uint8Array<ArrayBuffer>>;

  /** Frame the whole figure. */
  fitView(): void;

  /** Orbit to an azimuth in degrees. */
  cameraView(degrees: number): void;

  /** Toggle the single-material clay pass. */
  setClay(enabled: boolean): void;

  /** Toggle shadow casting. */
  setShadows(enabled: boolean): void;
}
