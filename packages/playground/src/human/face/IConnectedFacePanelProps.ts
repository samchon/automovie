import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceComponentTree,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";

import type { IConnectedFaceExpressionPreset } from "./IConnectedFaceExpressionPreset";
import type { IConnectedFaceViewport } from "./IConnectedFaceViewport";

/**
 * What the connected face panel is mounted with: the admitted basis and its
 * optional control map and component tree, the initial document, studies and
 * presets, the viewport factory and the download sink.
 *
 * @author Samchon
 */
export interface IConnectedFacePanelProps<Model> {
  /** Admitted basis; the panel reads its channels and measures their scale. */
  basis: IAutoMovieHumanFaceBasis;

  /** The document the panel opens. */
  initial: IAutoMovieHumanFaceBasisDocument;

  /** The simple coordinate map, when the basis has one. */
  controlMap?: IAutoMovieHumanFaceControlMap;

  /** The component tree that groups fine controls. */
  componentTree?: IAutoMovieHumanFaceComponentTree;

  /** Application-owned studies; never embedded in the numerical package. */
  studies?: readonly IAutoMovieHumanFaceBasisDocument[];

  /** Expression presets. */
  presets: IConnectedFaceExpressionPreset[];

  /** Create the viewport on the panel's canvas. */
  viewport: (canvas: HTMLCanvasElement) => IConnectedFaceViewport<Model>;

  /** Hand bytes to the user as a file. */
  download: (filename: string, bytes: BlobPart, mime: string) => void;
}
