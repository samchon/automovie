import { IAutoMovieVector3 } from "@automovie/interface";

/** One steady noise source inside the room, such as a fan or a diffuser. */
export interface IAutoMovieAcousticSource {
  /** Stable source identity within the request. */
  id: string;
  /** World position in metres. */
  position: IAutoMovieVector3;
  /** Sound power level in dB re 1 pW; finite. */
  soundPower: number;
  /** Directivity factor; strictly positive, `1` being omnidirectional. */
  directivity: number;
}
