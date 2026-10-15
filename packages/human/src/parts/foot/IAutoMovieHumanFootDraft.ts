import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The foot cage's control points in the foot's local frame, laid out on the fixed grid of `AUTOMOVIE_HUMAN_FOOT_GRID` before they are knitted into faces.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFootDraft {
  /** Upper vertices by column, then row; null at the centre of the ankle hole, which has no vertex. */
  upper: Array<Array<IAutoMovieVector3 | null>>;

  /** Sole vertices by column, then row. */
  sole: IAutoMovieVector3[][];

  /** Toe stations by toe, then station, each its four corners: dorsomedial, dorsolateral, plantolateral, plantomedial. */
  toes: IAutoMovieVector3[][][];
}
