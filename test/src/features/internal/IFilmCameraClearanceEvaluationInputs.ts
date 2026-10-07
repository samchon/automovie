import type { evaluateCameraClearance } from "@automovie/engine";
import type {
  IAutoMovieCameraClearanceEnvelope,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IFilmCameraClearanceBox } from "./IFilmCameraClearanceBox";
import type { IFilmCameraClearanceEvaluationOverrides } from "./IFilmCameraClearanceEvaluationOverrides";

/** Original numerical clearance scenario readers and transform constructors. */
export interface IFilmCameraClearanceEvaluationInputs {
  /** Construct the original world transform. */
  identity(x?: number, y?: number, z?: number): IAutoMovieTransform;

  /** Construct the original obstacle box. */
  box(center: IAutoMovieVector3, half?: number): IFilmCameraClearanceBox;

  /** Construct the original body and rig envelope. */
  envelope(
    body?: IAutoMovieCameraClearanceEnvelope["body"],
    parentRig?: IAutoMovieCameraClearanceEnvelope["parentRig"],
  ): IAutoMovieCameraClearanceEnvelope;

  /** Execute the original evaluator with optional overrides. */
  evaluate(
    over?: IFilmCameraClearanceEvaluationOverrides,
  ): ReturnType<typeof evaluateCameraClearance>;

  /** Read the original thrown-error fragment. */
  throws(closure: () => unknown, text: string): boolean;
}
