import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieFormationSlot } from "./IAutoMovieFormationSlot";
import type { IAutoMovieInstanceSlot } from "./IAutoMovieInstanceSlot";

/**
 * Deterministic geometry and compact-member helpers exposed to a shot source
 * builder over borrowed current records.
 */
export interface IAutoMovieSourceOracle {
  /**
   * Binary64 Euclidean distance in meters between finite world-space points.
   * Extreme finite coordinates can overflow a difference or the final norm to
   * infinity.
   */
  distance(left: IAutoMovieVector3, right: IAutoMovieVector3): number;

  /**
   * World-meter height of the first containing world surface at the supplied XZ
   * point, or zero when none contains it.
   */
  groundHeight(point: {
    /** World X position in metres. */
    x: number;

    /** World Z position in metres. */
    z: number;
  }): number;

  /**
   * Regenerate one compiled formation slot without expanding its population;
   * missing ids or out-of-range indices throw RangeError.
   */
  formationSlot(formation: string, slot: number): IAutoMovieFormationSlot;

  /**
   * Regenerate one compiled general-instance slot without expanding its
   * population; missing ids or out-of-range indices throw RangeError.
   */
  instanceSlot(instanceSet: string, slot: number): IAutoMovieInstanceSlot;
}
