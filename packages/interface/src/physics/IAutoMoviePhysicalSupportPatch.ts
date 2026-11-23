import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Current resolved support points in world metres. */
export interface IAutoMoviePhysicalSupportPatch {
  /** Endpoint bone from the footfall pattern. */
  bone: string;

  /** Contact patch vertices, not an invented standing footprint. */
  points: IAutoMovieVector3[];

  /** Current endpoint world position. */
  position: IAutoMovieVector3;
}
