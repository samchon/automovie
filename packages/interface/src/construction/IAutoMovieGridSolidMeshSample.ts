import type { AutoMovieVector2Tuple } from "../geometry/AutoMovieVector2Tuple";
import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/** One locally evaluated, not yet published sampling point. */
export interface IAutoMovieGridSolidMeshSample {
  /** Copied world point. */
  point: AutoMovieVector3Tuple;

  /** Its owner-local chart. */
  chart: Readonly<AutoMovieVector2Tuple>;
}
