import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One steady noise source inside the room, such as a fan or a diffuser.
 *
 * Contributes `10^(Lw / 10) * (Q / (4 * pi * r^2) + 4 / R)` to the energy at
 * every receiver. When the energy at a receiver underflows to zero or overflows
 * past double precision, that receiver has no level, and the run reports the
 * level metrics as a gap.
 */
export interface IAutoMovieAcousticSource {
  /** Stable source identity, unique among the request's sources. */
  id: string;

  /** World position in metres; every axis finite. */
  position: IAutoMovieVector3;

  /** Sound power level in dB re 1 pW; finite. */
  soundPower: number;

  /**
   * Directivity factor; finite and strictly positive, `1` being
   * omnidirectional.
   */
  directivity: number;
}
