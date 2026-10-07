import type {
  AutoMovieHumanFaceMeasurementReading,
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanPersonChannelAlias,
  IAutoMovieHumanPersonDocument,
  IAutoMovieHumanBodySimpleShape,
} from "@automovie/human";

import type { BodyPosePreset } from "../body/bodyPosePresets";
import type { IConnectedFaceExpressionPreset } from "../face/IConnectedFaceExpressionPreset";
import type { IConnectedBodyMeasurement } from "../body/IConnectedBodyMeasurement";
import type { IConnectedPersonFaceSolution } from "./IConnectedPersonFaceSolution";
import type { IConnectedPersonHeadSolution } from "./IConnectedPersonHeadSolution";
import type { IConnectedPersonMeasuredSolution } from "./IConnectedPersonMeasuredSolution";
import type { IConnectedPersonModel } from "./IConnectedPersonModel";
import type { IConnectedPersonViewport } from "./IConnectedPersonViewport";
import type { IAutoMovieHumanPersonHeadShapeSource } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadShapeSource";

/**
 * Inputs of `mountConnectedPersonPanel`.
 *
 * `face` and `body` are the head and body partition views of the published
 * person generation; the panel lists their controls and never evaluates them
 * itself. `initial` is the standard person the page opens with. `viewport`
 * builds and draws people in a worker; `solveMeasurement` solves a measured
 * body channel against the body view in its own worker, where
 * `readPersonMeasurement` and `solvePersonMeasurement` read and solve the
 * measurements whose site crosses the head/body cut, and `readPersonHead`
 * and `solvePersonHead` read and solve the head measurements,
 * `readFaceMeasurements` and `solveFaceMeasurement` read and solve the face
 * measurements; `download` saves a
 * file the user asked for.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Mounts the person editor with the body view whose controls it lists.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Mounts the person editor with the head view whose face controls it lists.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Supplies the viewport and download sink the transactional editor drives.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Supplies the standard person the editor screen opens with.
 * @author Samchon
 */
export interface IConnectedPersonPanelProps<Model extends IConnectedPersonModel> {
  /** The head partition view (a face basis with driver channels). */
  face: IAutoMovieHumanFaceBasis;

  /** Face channels the generation defines once through a body channel. */
  aliases: IAutoMovieHumanPersonChannelAlias[];

  /** Registered independent head differences from the same head view; absent on older unsupported generations. */
  headShapeSource?: IAutoMovieHumanPersonHeadShapeSource;

  /** The body partition view. */
  body: IAutoMovieHumanBodyBasis;

  /** The document the page opens with and Reset returns to. */
  initial: IAutoMovieHumanPersonDocument;

  /** Project simple values on this person's complete current rest skin and canonical body anatomy. */
  projectSimple(person: IAutoMovieHumanPersonDocument): Promise<IAutoMovieHumanBodySimpleShape>;

  /** Expand the owner's simple values over the current person's effective body shape. */
  expandSimple(person: IAutoMovieHumanPersonDocument, simple: IAutoMovieHumanBodySimpleShape): Promise<Record<string, number>>;

  /** Body pose presets. */
  poses: BodyPosePreset[];

  /** Face expression presets. */
  expressions: IConnectedFaceExpressionPreset[];

  /** Create the viewport on the panel's canvas. */
  viewport(canvas: HTMLCanvasElement): IConnectedPersonViewport<Model>;

  /** Solve a measured body channel for a target length in metres. */
  solveMeasurement(
    shape: Record<string, number>,
    channel: string,
    targetMetres: number,
  ): Promise<IConnectedBodyMeasurement>;

  /** Read a person measurement on a person's final skin at rest, metres. */
  readPersonMeasurement(document: IAutoMovieHumanPersonDocument, channel: string): Promise<number>;

  /** Solve a person measurement along its body channel for a target in metres. */
  solvePersonMeasurement(
    document: IAutoMovieHumanPersonDocument,
    channel: string,
    targetMetres: number,
  ): Promise<IConnectedPersonMeasuredSolution>;

  /** Read every head measurement on a person's skin at rest, metres by name. */
  readPersonHead(document: IAutoMovieHumanPersonDocument): Promise<Record<string, number>>;

  /** Solve the person's head channels for head measurement targets in metres. */
  solvePersonHead(document: IAutoMovieHumanPersonDocument, targets: Record<string, number>): Promise<IConnectedPersonHeadSolution>;

  /** Read every registered face measurement on a person's face. */
  readFaceMeasurements(document: IAutoMovieHumanPersonDocument): Promise<AutoMovieHumanFaceMeasurementReading[]>;

  /** Solve one face measurement target, in the measurement's unit, onto the channels it lists. */
  solveFaceMeasurement(document: IAutoMovieHumanPersonDocument, measurement: string, target: number): Promise<IConnectedPersonFaceSolution>;

  /** Save bytes the user asked for under a file name. */
  download(filename: string, bytes: BlobPart, mime: string): void;
}
