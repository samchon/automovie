import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * One calcaneus supporting the heel beneath the talus.
 *
 * Heel projection and plantar contact cannot be reconstructed from this bone
 * volume alone; the subtalar facet, plantar fat pad and skin remain separate.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyCalcaneusMeasurements {
  /** Calcaneal bone volume alone, excluding talus and heel fat pad. */
  readonly boneVolume: IAutoMovieHumanBodyAnatomicalVolume;
}
