import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * One talus between the tibial/fibular ankle mortise and calcaneus.
 *
 * Its separate CT/MRI volume cannot determine the trochlear, subtalar or
 * talonavicular articular geometry; those surfaces require validated anatomy.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyTalusMeasurements {
  /** Talus bone only, excluding calcaneus and articular cartilage. */
  readonly boneVolume: IAutoMovieHumanBodyAnatomicalVolume;
}
