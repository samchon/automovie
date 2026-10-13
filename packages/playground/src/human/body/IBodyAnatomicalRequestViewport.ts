import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasisDocument";

import type { IBodyAnatomicalRequestModel } from "./IBodyAnatomicalRequestModel";

/**
 * The viewport a numerical request panel drives.
 *
 * `build` evaluates a request into a frame, `publish` shows an admitted frame
 * and `dispose` requests owned retirement; `settleRetirements` observes its
 * completion and failures. `cancel` withdraws the pending build. `export`
 * encodes the candidate-only model, never a whole-body save. The view methods
 * change only the camera and the clay display.
 *
 * @author Samchon
 */
export interface IBodyAnatomicalRequestViewport<
  Model extends IBodyAnatomicalRequestModel,
> {
  /** Build one request into a frame. */
  build: (document: IAutoMovieHumanBodyBasisDocument) => Promise<Model>;

  /** Show an admitted frame. */
  publish: (model: Model) => void;

  /** Request retirement of a frame's owned resources. */
  dispose: (model: Model) => void;

  /** Await requested owned retirement and preserve its actual failures. */
  settleRetirements: () => Promise<void>;

  /** Withdraw the pending build. */
  cancel: () => void;

  /** Encode the request's candidate-only model as GLB bytes. */
  export: (
    document: IAutoMovieHumanBodyBasisDocument,
  ) => Promise<Uint8Array<ArrayBuffer>>;

  /** Frame the subject in view. */
  fitView: () => void;

  /** Turn the camera to an azimuth, in degrees. */
  cameraView: (degrees: number) => void;

  /** Toggle the clay display. */
  setClay: (enabled: boolean) => void;
}
