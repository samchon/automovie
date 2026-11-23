import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieFormationSlot } from "./IAutoMovieFormationSlot";
import type { IAutoMovieInstanceSlot } from "./IAutoMovieInstanceSlot";

/**
 * Deterministic geometry and compact-member helpers exposed to a shot source builder over borrowed current records.
 *
 * @evidence contracts/development/design.md#principled-representation createAutoMovieSourceOracle delegates ground and member answers to the same terrain and compiled-slot regeneration laws used by engine consumers; Euclidean distance uses the norm of the point difference.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four methods provide source-local measurements without exposing a second scene builder or expanding compact populations into dense nodes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing compiled population ids, including inherited object keys, refuse; no surface means explicit zero ground height, and borrowed records are not deep-frozen or copied into a hidden stale cache.
 * @evidence contracts/development/common.md#meaningful-documentation Defines meter-based distance and ground answers, compiled record ownership, exact slot regeneration and missing-id or range failure.
 */
export interface IAutoMovieSourceOracle {
  /**
   * Binary64 Euclidean distance in meters between finite world-space points. Extreme finite coordinates can overflow a difference or the final norm to infinity.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines finite world-meter operands, binary64 meter output and extreme-input overflow without implying independent numeric admission.
   */
  distance(left: IAutoMovieVector3, right: IAutoMovieVector3): number;

  /**
   * World-meter height of the first containing world surface at the supplied XZ point, or zero when none contains it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines XZ world-meter sampling, first-containing precedence, height units and no-surface zero.
   */
  groundHeight(point: {
    /** World X position in metres. */
    x: number;

    /** World Z position in metres. */
    z: number;
  }): number;

  /**
   * Regenerate one compiled formation slot without expanding its population; missing ids or out-of-range indices throw RangeError.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines compiled population identity, zero-based exact slot regeneration and both RangeError conditions.
   */
  formationSlot(formation: string, slot: number): IAutoMovieFormationSlot;

  /**
   * Regenerate one compiled general-instance slot without expanding its population; missing ids or out-of-range indices throw RangeError.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines compiled set identity, exact addressed member and the missing-id and range refusals.
   */
  instanceSlot(instanceSet: string, slot: number): IAutoMovieInstanceSlot;
}
