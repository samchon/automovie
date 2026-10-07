import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

import type { IConnectedBodyConstructionExportResult } from "../body/IConnectedBodyConstructionExportResult";
import type { IConnectedPersonConstructionPreview } from "./IConnectedPersonConstructionPreview";
import type { IConnectedPersonModel } from "./IConnectedPersonModel";

/**
 * What the person panel needs of its viewport: build a person document in the
 * worker, publish or dispose a built model, export the static file, cancel
 * pending work, and frame the camera. `createConnectedBodyViewport` over a
 * person worker supplies it.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Builds, publishes and exports person documents and frames the camera outside the document.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Separates building from publishing so a failed build keeps the previous model.
 * @author Samchon
 */
export interface IConnectedPersonViewport<Model extends IConnectedPersonModel> {
  /** Build a person document; rejects with the runtime's refusal. */
  build(
    document: IAutoMovieHumanPersonDocument,
    measure?: boolean,
    anatomy?: boolean,
  ): Promise<Model>;

  /** Prepare the same source owner's full construction and admission for draft inspection. */
  construct(
    document: IAutoMovieHumanPersonDocument,
  ): Promise<IConnectedPersonConstructionPreview<Model>>;

  /** Encode a draft through unchanged export guards; admission stays separate. */
  exportConstruction(
    document: IAutoMovieHumanPersonDocument,
  ): Promise<Pick<IConnectedBodyConstructionExportResult, "glb" | "admission">>;

  /** Withdraw the pending build. */
  cancel(): void;

  /** Draw a built model. */
  publish(model: Model): void;

  /** Release a model that will not be drawn. */
  dispose(model: Model): void;

  /** Export the static GLB of a person document. */
  export(
    document: IAutoMovieHumanPersonDocument,
  ): Promise<Uint8Array<ArrayBuffer>>;

  /** Frame the whole figure. */
  fitView(): void;

  /** Orbit to an azimuth in degrees. */
  cameraView(degrees: number): void;

  /** Toggle the single-material clay pass. */
  setClay(enabled: boolean): void;

  /** Toggle shadow casting. */
  setShadows(enabled: boolean): void;
}
