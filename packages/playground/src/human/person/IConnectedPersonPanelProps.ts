import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";

import type { BodyPosePreset } from "../body/bodyPosePresets";
import type { IConnectedPersonExpressionPreset } from "./IConnectedPersonExpressionPreset";
import type { IConnectedPersonMeasurement } from "./IConnectedPersonMeasurement";
import type { IConnectedPersonModel } from "./IConnectedPersonModel";
import type { IConnectedPersonViewport } from "./IConnectedPersonViewport";

/**
 * Inputs of `mountConnectedPersonPanel`.
 *
 * `face` and `body` are the head and body partition views of the published
 * person generation; the panel lists their controls and never evaluates them
 * itself. `initial` is the standard person the page opens with. `viewport`
 * builds and draws people in a worker; `solveMeasurement` solves a measured
 * body channel against the body view in its own worker; `download` saves a
 * file the user asked for.
 *
 * @author Samchon
 */
export interface IConnectedPersonPanelProps<Model extends IConnectedPersonModel> {
  /** The head partition view (a face basis with driver channels). */
  face: IAutoMovieHumanFaceBasis;

  /** The body partition view. */
  body: IAutoMovieHumanBodyBasis;

  /** The document the page opens with and Reset returns to. */
  initial: IAutoMovieHumanPersonDocument;

  /** Body pose presets. */
  poses: BodyPosePreset[];

  /** Face expression presets. */
  expressions: IConnectedPersonExpressionPreset[];

  /** Create the viewport on the panel's canvas. */
  viewport(canvas: HTMLCanvasElement): IConnectedPersonViewport<Model>;

  /** Solve a measured body channel for a target length in metres. */
  solveMeasurement(
    shape: Record<string, number>,
    channel: string,
    targetMetres: number,
  ): Promise<IConnectedPersonMeasurement>;

  /** Save bytes the user asked for under a file name. */
  download(filename: string, bytes: BlobPart, mime: string): void;
}
