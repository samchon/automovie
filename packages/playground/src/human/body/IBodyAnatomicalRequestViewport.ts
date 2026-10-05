import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasisDocument";

import type { IBodyAnatomicalRequestModel } from "./IBodyAnatomicalRequestModel";

/**
 * The viewport a numerical request panel drives.
 *
 * `build` evaluates a request into a frame, `publish` shows an admitted frame
 * and `dispose` releases one; `cancel` withdraws the pending build. `export`
 * encodes the candidate-only model, never a whole-body save. The view methods
 * change only the camera and the clay display.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Supplies the build, publication, export and view operations the numerical request panel invokes.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Separates frame building, publication and disposal so a failed build retains the last admitted frame.
 * @author Samchon
 */
export interface IBodyAnatomicalRequestViewport<
  Model extends IBodyAnatomicalRequestModel,
> {
  /** Build one request into a frame. */
  build: (document: IAutoMovieHumanBodyBasisDocument) => Promise<Model>;

  /** Show an admitted frame. */
  publish: (model: Model) => void;

  /** Release a frame's resources. */
  dispose: (model: Model) => void;

  /** Withdraw the pending build. */
  cancel: () => void;

  /** Encode the request's candidate-only model as GLB bytes. */
  export: (document: IAutoMovieHumanBodyBasisDocument) => Promise<Uint8Array<ArrayBuffer>>;

  /** Frame the subject in view. */
  fitView: () => void;

  /** Turn the camera to an azimuth, in degrees. */
  cameraView: (degrees: number) => void;

  /** Toggle the clay display. */
  setClay: (enabled: boolean) => void;
}
