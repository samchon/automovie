import type {
  IAutoMovieCameraClearanceRuntime,
  IAutoMoviePerformedShot,
  IAutoMovieStagedSet,
} from "@automovie/engine";
import type {
  IAutoMovieCamera,
  IAutoMovieClip,
  IAutoMovieModel,
  IAutoMovieSceneNode,
  IAutoMovieTransform,
} from "@automovie/interface";

import type { IFilmCameraClearanceAdapterOverrides } from "./IFilmCameraClearanceAdapterOverrides";
import type { IFilmCameraClearanceAdapterResult } from "./IFilmCameraClearanceAdapterResult";

/** Original deformation and motion boundary readers, sharing the exact accepted performance. */
export interface IFilmCameraClearanceDeformationInputs {
  /** Original performed shot. */
  performed: IAutoMoviePerformedShot.ISuccess;

  /** Original staged scene. */
  clearStage: IAutoMovieStagedSet.ISuccess;

  /** Original delivery camera. */
  heroCamera: IAutoMovieCamera;

  /** The original camera clip with a contact key off the base clock. */
  offClockCameraMotion: IAutoMovieClip;

  /** Original current revision and fixed sample-rate authority. */
  runtime: IAutoMovieCameraClearanceRuntime;

  /** Original staged actor. */
  sourceNode: IAutoMovieSceneNode;

  /** Original moving-prop node. */
  movingNode: IAutoMovieSceneNode;

  /** Original prop model. */
  propModel: IAutoMovieModel;

  /** Execute the same adapter against optional overridden inputs. */
  inspectAdapter(
    over?: IFilmCameraClearanceAdapterOverrides,
  ): IFilmCameraClearanceAdapterResult;

  /** Original model registry producer. */
  runtimeModels(): IAutoMovieModel[];

  /** Original transform constructor. */
  identity(x?: number, y?: number, z?: number): IAutoMovieTransform;
}
