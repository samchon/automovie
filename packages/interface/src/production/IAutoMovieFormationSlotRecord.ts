import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Identity and placement inputs shared by authored and compiled formation-slot regeneration.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents node naming, heading units and seeded phase identity, separating these from actor promotion and placement.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Actor promotion does not change the base model or seeded phase, and a slot address remains distinct from the generated scene-node string.
 * @evidence contracts/development/design.md#principled-representation Authored formation/model IDs, world-Y heading degrees and the deterministic seed are carried unchanged; formation admission and placement own numeric and slot validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Both formationSlot and compiledFormationSlot pass these four fields to one identity law, while their distinct hero tables remain with those callers.
 */
export namespace IAutoMovieFormationSlotRecord {
  /**
   * Formation fields that determine a regenerated slot's stable node identity, model, heading and motion phase.
   *
   * A design and a compiled formation share this identity law and differ only in
   * what they hand it: where a promoted hero is spelled, and the terrain the
   * slot's position is placed on. A hero slot is named by its actor and an
   * anonymous slot by `formation:<id>:slot:<six-digit slot>`; every member
   * carries the base model and the designed heading; and its motion phase in
   * `[0, 1)` is seeded by the formation seed and the slot under the phase domain
   * constant, whichever actor or position it is handed. The slot index is not
   * range-checked here; the caller's placement already refused it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents node naming, heading units and seeded phase identity, separating these from actor promotion and placement.
   * @evidence contracts/development/design.md#principled-representation Authored formation/model IDs, world-Y heading degrees and the deterministic seed are carried unchanged; formation admission and placement own numeric and slot validation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Both formationSlot and compiledFormationSlot pass these four fields to one identity law, while their distinct hero tables remain with those callers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Actor promotion does not change the base model or seeded phase, and a slot address remains distinct from the generated scene-node string.
   */
  export type IFormation = {
    /** Stable formation ID included in anonymous node IDs; heroes instead use their actor ID as the node ID. */
    id: string;

    /** Authored base model-group ID copied to every slot, including promoted heroes; this is not the derived runtime model ID. */
    model: string;

    /** Designed heading in degrees about world +Y, copied unchanged; instantaneous formation motion is applied elsewhere. */
    facingDeg: number;

    /** Deterministic seed combined with the zero-based slot address and phase salt to produce motionPhase in [0, 1); actor and position do not enter that draw. */
    seed: number;
  };

  /**
   * A slot's resolved actor promotion and staged point, supplied by the placement caller.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States anonymous versus promoted identity and that the returned slot aliases the supplied world position.
   * @evidence contracts/development/design.md#principled-representation Null explicitly means an anonymous slot; the vector is a world-space metre point already admitted and terrain-adjusted by placement.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Authored hero overrides and compiled hero records adapt to this same two-field input; formationSlotRecord does not need either source table.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No hero transform or geometry is inferred from the actor string; the caller supplies the actual staged position and owns its validity.
   */
  export type IMember = {
    /** Promoted actor ID used verbatim as the scene-node ID, or null for an anonymous slot whose node ID is derived from formation ID and padded slot address. */
    actor: string | null;

    /** Borrowed staged world-space position in metres, including terrain relief. The fresh slot record keeps this same vector reference; no copy or additional placement occurs. */
    position: IAutoMovieVector3;
  };
}
