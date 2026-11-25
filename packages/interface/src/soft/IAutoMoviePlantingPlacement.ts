import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** One accepted cluster member as a full-TRS instance. */
export interface IAutoMoviePlantingPlacement {
  /** Stable placement identity within the cluster. */
  id: string;

  /** Authored slot index this placement satisfied. */
  slot: number;

  /** World position of the member's base. */
  translation: IAutoMovieVector3;

  /** Unit quaternion in glTF `(x, y, z, w)` order. */
  rotation: IAutoMovieQuaternion;

  /** Per-axis scale; each strictly positive. */
  scale: IAutoMovieVector3;
}
