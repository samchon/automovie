import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";

/**
 * The numerical viewport the connected face panel drives: builds, publishes
 * and exports face documents, and owns camera and display state.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Builds, publishes and exports face documents, keeping the last valid model on a failed build.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Separates building from publishing so a failed build keeps the previous model.
 * @author Samchon
 */
export interface IConnectedFaceViewport<Model> {
  /** Build a document, optionally measuring it and with occlusion. */
  build: (
    document: IAutoMovieHumanFaceBasisDocument,
    measure?: boolean,
    occlusion?: boolean,
  ) => Promise<Model>;

  /** Cancel the build in flight. */
  cancel: () => void;

  /** Export a document as GLB bytes. */
  export: (
    document: IAutoMovieHumanFaceBasisDocument,
    occlusion?: boolean,
  ) => Promise<Uint8Array<ArrayBuffer>>;

  /** Draw a committed model. */
  publish: (model: Model) => void;

  /** Release a model that will not be drawn. */
  dispose: (model: Model) => void;

  /** Fit the camera to the drawn model. */
  fitView: () => void;

  /** Turn the camera to a yaw in degrees. */
  cameraView: (degrees: number) => void;

  /** Draw in clay. */
  setClay: (enabled: boolean) => void;

  /** Draw shadows. */
  setShadows: (enabled: boolean) => void;
}
