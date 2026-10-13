import { IAutoMovieVector3 } from "@automovie/interface";

/** One place the room is listened from. */
export interface IAutoMovieAcousticReceiver {
  /** Stable receiver identity within the request. */
  id: string;
  /** World position in metres. */
  position: IAutoMovieVector3;
}
