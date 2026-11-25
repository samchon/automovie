import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Identity and placement inputs shared by authored and compiled formation-slot
 * regeneration.
 */
export namespace IAutoMovieFormationSlotRecord {
  /**
   * Formation fields that determine a regenerated slot's stable node identity,
   * model, heading and motion phase.
   *
   * A design and a compiled formation share this identity law and differ only
   * in what they hand it: where a promoted hero is spelled, and the terrain the
   * slot's position is placed on. A hero slot is named by its actor and an
   * anonymous slot by `formation:<id>:slot:<six-digit slot>`; every member
   * carries the base model and the designed heading; and its motion phase in
   * `[0, 1)` is seeded by the formation seed and the slot under the phase
   * domain constant, whichever actor or position it is handed. The slot index
   * is not range-checked here; the caller's placement already refused it.
   */
  export type IFormation = {
    /**
     * Stable formation ID included in anonymous node IDs; heroes instead use
     * their actor ID as the node ID.
     */
    id: string;

    /**
     * Authored base model-group ID copied to every slot, including promoted
     * heroes; this is not the derived runtime model ID.
     */
    model: string;

    /**
     * Designed heading in degrees about world +Y, copied unchanged;
     * instantaneous formation motion is applied elsewhere.
     */
    facingDeg: number;

    /**
     * Deterministic seed combined with the zero-based slot address and phase
     * salt to produce motionPhase in [0, 1); actor and position do not enter
     * that draw.
     */
    seed: number;
  };

  /**
   * A slot's resolved actor promotion and staged point, supplied by the
   * placement caller.
   */
  export type IMember = {
    /**
     * Promoted actor ID used verbatim as the scene-node ID, or null for an
     * anonymous slot whose node ID is derived from formation ID and padded slot
     * address.
     */
    actor: string | null;

    /**
     * Borrowed staged world-space position in metres, including terrain relief.
     * The fresh slot record keeps this same vector reference; no copy or
     * additional placement occurs.
     */
    position: IAutoMovieVector3;
  };
}
