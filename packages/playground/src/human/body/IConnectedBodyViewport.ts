import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";

/**
 * The numerical viewport the connected body panel drives: builds, publishes
 * and exports body documents, owns camera and display state, and may solve
 * the arms-down preset.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Builds, publishes and exports body documents and owns camera and display state outside the document.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Separates building from publishing so a failed build keeps the previous model.
 * @author Samchon
 */
export interface IConnectedBodyViewport<Model> {
  /** Build a document, optionally measuring it and reading its anatomy. */
  build: (
    document: IAutoMovieHumanBodyBasisDocument,
    measure?: boolean,
    anatomy?: boolean,
  ) => Promise<Model>;

  /** Cancel the build in flight. */
  cancel: () => void;

  /** Draw a committed model. */
  publish: (model: Model) => void;

  /** Release a model that will not be drawn. */
  dispose: (model: Model) => void;

  /** Export a document as GLB bytes. */
  export: (
    document: IAutoMovieHumanBodyBasisDocument,
  ) => Promise<Uint8Array<ArrayBuffer>>;

  /** Fit the camera to the drawn model. */
  fitView: () => void;

  /** Turn the camera to a yaw in degrees. */
  cameraView: (degrees: number) => void;

  /** Draw in clay. */
  setClay: (enabled: boolean) => void;

  /** Draw shadows. */
  setShadows: (enabled: boolean) => void;

  /** Solve the arms-down preset on a document's body, off the page. */
  armsDown?: (
    document: IAutoMovieHumanBodyBasisDocument,
  ) => Promise<Pick<IAutoMovieHumanBodyBasisDocument, "pose" | "shoulders">>;
}
