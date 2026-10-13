import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One place the room is listened from.
 *
 * Each receiver yields one `room.soundPressureLevel` sample whose id is the
 * receiver's. A receiver within 1e-12 m of any source is refused, because the
 * inverse square law has no value there, and a study may declare at most
 * `AUTOMOVIE_ANALYSIS_MAX_SAMPLES` receivers.
 *
 * @author Samchon
 */
export interface IAutoMovieAcousticReceiver {
  /** Stable receiver identity, unique among receivers and reused as sample id. */
  id: string;

  /** World position in metres; every axis finite. */
  position: IAutoMovieVector3;
}
