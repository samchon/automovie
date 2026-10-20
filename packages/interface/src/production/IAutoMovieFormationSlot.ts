import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One deterministic formation member materialized from compact design.
 *
 * @evidence contracts/common.md#principled-implementation Regeneration derives stable slot identity, placement and normalized motion phase from the admitted compact formation and seed; hero identity is the explicit override for that same slot.
 * @evidence contracts/common.md#clear-and-simple-design This materialized member projection contains the fields consumers need without embedding the whole formation or duplicating its placement algorithm.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null actor means anonymous, not a fabricated actor id; named heroes retain the formation's declared model group and deterministic slot placement.
 * @evidence contracts/common.md#meaningful-documentation Defines zero-based slot, compiler node identity, nullable hero, world-meter position, degree heading and normalized phase.
 */
export interface IAutoMovieFormationSlot {
  /** Zero-based deterministic slot index. */
  slot: number;

  /** Compiler-owned scene-node id. */
  node: string;

  /** Named hero actor at this slot, or null. */
  actor: string | null;

  /** Id of the model group this member draws. */
  model: string;

  /** Compiler-derived world position in meters. */
  position: IAutoMovieVector3;

  /** Compiler-derived world-space heading in degrees. */
  facingDeg: number;

  /** Stable normalized phase used by bounded instance motion. */
  motionPhase: number;
}
