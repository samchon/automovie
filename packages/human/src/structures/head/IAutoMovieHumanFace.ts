import { tags } from "typia";

import { IAutoMovieHumanEye } from "./IAutoMovieHumanEye";
import { IAutoMovieHumanMouth } from "./IAutoMovieHumanMouth";
import { IAutoMovieHumanNose } from "./IAutoMovieHumanNose";
import { IAutoMovieHumanPair } from "../common/IAutoMovieHumanPair";

/** Resting eye, nose and mouth measurements between the Farkas landmarks. */
export interface IAutoMovieHumanFace {
  /** Eye openings; equal values retain a shared bilateral measurement. */
  eyePair: IAutoMovieHumanPair<IAutoMovieHumanEye>;

  /** Euclidean three-dimensional distance between the two endocanthia, millimetres. */
  intercanthalWidth: number & tags.Minimum<10> & tags.Maximum<60>;

  /** Nose dimensions. */
  nose: IAutoMovieHumanNose;

  /** Closed-mouth dimensions. */
  mouth: IAutoMovieHumanMouth;
}
