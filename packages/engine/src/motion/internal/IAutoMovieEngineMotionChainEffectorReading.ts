import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Reads the admitted lower prefix and final projected orientation immediately.
 */
export type IAutoMovieEngineMotionChainEffectorReading = (
  rotation: IAutoMovieQuaternion,
  position: () => IAutoMovieVector3,
) => void;
