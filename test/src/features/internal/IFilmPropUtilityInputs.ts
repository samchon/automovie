import type { IAutoMoviePropSupportFace } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment, IAutoMoviePropBox, IAutoMovieStageSetPiece } from "@automovie/interface";

import type { IFilmPropPatchInput } from "./IFilmPropPatchInput";

/** Shared original environment and geometric readers for placement utility assertion groups. */
export interface IFilmPropUtilityInputs {
  /** The original room graph being queried. */
  environment: IAutoMovieBuiltEnvironment;

  /** Construct a bounds box from its original six coordinates. */
  box(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number): IAutoMoviePropBox;

  /** Original staged unit carrying the probe position. */
  UNIT: IAutoMovieStageSetPiece;

  /** Read the existing table support face. */
  tableTop(piece?: IAutoMovieStageSetPiece): IAutoMoviePropSupportFace | null;

  /** Read a finite bearing against the original expected gap. */
  bearing(gap: number | null, expected: number): boolean;

  /** Construct the original support-plane quaternion. */
  tipped(deg: number): IAutoMovieStageSetPiece["rotation"];

  /** Construct the original square support face. */
  patch(props: IFilmPropPatchInput): IAutoMoviePropSupportFace;
}
