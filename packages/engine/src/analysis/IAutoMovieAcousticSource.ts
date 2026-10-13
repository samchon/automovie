import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One steady noise source inside the room, such as a fan or a diffuser.
 *
 * Contributes `10^(Lw / 10) * (Q / (4 * pi * r^2) + 4 / R)` to the energy at
 * every receiver. A source whose power underflows to zero energy leaves the
 * receivers with no level, which the run reports as a gap.
 *
 * @author Samchon
 */
export interface IAutoMovieAcousticSource {
  /** Stable source identity, unique among the request's sources. */
  id: string;

  /** World position in metres; every axis finite. */
  position: IAutoMovieVector3;

  /** Sound power level in dB re 1 pW; finite. */
  soundPower: number;

  /** Directivity factor; finite and strictly positive, `1` being omnidirectional. */
  directivity: number;
}
