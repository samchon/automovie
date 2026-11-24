import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieFurnishingClearance } from "./IAutoMovieFurnishingClearance";
import type { IAutoMovieFurnishingRelation } from "./IAutoMovieFurnishingRelation";

/**
 * One individually placed piece of a furnished room: a model, how it is placed
 * and the floor it keeps clear.
 *
 * The furnishing producer measures the model's rest box once and resolves
 * `place` and `clear` from it. A layout override of the piece's role replaces
 * `place` with the override's absolute position.
 */
export interface IAutoMovieFurnishingPiece {
  /** Rigid model with its affordances, exposed as `<role>/<affordance id>`. */
  readonly model: IAutoMovieModel;

  /** Wall, facing or absolute placement in the room frame. */
  readonly place: IAutoMovieFurnishingRelation;

  /** Floor rectangles reserved beside the piece's faces. The default is none. */
  readonly clear?: readonly IAutoMovieFurnishingClearance[];
}
