import { IAutoMovieFormationSlot } from "./IAutoMovieFormationSlot";
import { IAutoMovieInstanceSlot } from "./IAutoMovieInstanceSlot";

/** Deterministic pure helpers exposed to a shot source builder. */
export interface IAutoMovieSourceOracle {
  /** Euclidean distance between two points. */
  distance(
    left: { x: number; y: number; z: number },
    right: { x: number; y: number; z: number },
  ): number;

  /** Height of the first matching world surface, or zero. */
  groundHeight(point: { x: number; z: number }): number;

  /** Regenerate one exact builder-owned formation slot without expanding it. */
  formationSlot(formation: string, slot: number): IAutoMovieFormationSlot;

  /**
   * Regenerate one exact builder-owned general instance without expanding it.
   */
  instanceSlot(instanceSet: string, slot: number): IAutoMovieInstanceSlot;
}
