import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyBasisDocument,
} from "@automovie/human";

import type { BodyPosePreset } from "./bodyPosePresets";
import type { IConnectedBodySimpleSolvers } from "./IConnectedBodySimpleSolvers";
import type { IConnectedBodyViewport } from "./IConnectedBodyViewport";

/**
 * What the connected body panel is mounted with: the admitted basis, the
 * initial document and pose presets, the viewport factory, the head seat, the
 * off-thread solvers and the download sink.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Mounts the editor with its basis, starting document, presets, viewport, head and download sink.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Supplies the viewport factory and off-thread solvers the transactional editor drives.
 * @author Samchon
 */
export interface IConnectedBodyPanelProps<Model> {
  /** The admitted body basis. */
  basis: IAutoMovieHumanBodyBasis;

  /** The document the panel opens. */
  initial: IAutoMovieHumanBodyBasisDocument;

  /** Pose presets. */
  poses: BodyPosePreset[];

  /** Create the viewport on the panel's canvas. */
  viewport: (canvas: HTMLCanvasElement) => IConnectedBodyViewport<Model>;

  /**
   * Seat the head on the published body for this body document, or hide it
   * (`null`); the head is evaluated from the document, not from the model.
   */
  seat: (model: Model | null, document: IAutoMovieHumanBodyBasisDocument) => void;

  /** The simple tier and measurement inverse, solved off the page's thread. */
  simple: IConnectedBodySimpleSolvers;

  /** Hand bytes to the user as a file. */
  download: (filename: string, bytes: BlobPart, mime: string) => void;
}
