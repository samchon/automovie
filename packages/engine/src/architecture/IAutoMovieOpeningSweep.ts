import { IAutoMovieVector3 } from "@automovie/interface";

/** The world volume one movable panel sweeps across its whole travel. */
export interface IAutoMovieOpeningSweep {
  /** Panel id inside its opening. */
  panel: string;
  /** The visible element the panel drives. */
  element: string;
  /** World minimum corner of the swept volume. */
  min: IAutoMovieVector3;
  /** World maximum corner of the swept volume. */
  max: IAutoMovieVector3;
}
