import type { IAutoMovieHumanTrunkViewLaws } from "./IAutoMovieHumanTrunkViewLaws";

/** Type contracts exchanged by AutoMovieHumanTrunkLaws; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanTrunkLaws {
  /** The values still owed by laws, calibration mm.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The values still owed by laws, calibration mm.
   * @evidence contracts/development/design.md#principled-representation `chest`: One shared chest/bust-apex height; retained course-placement proxy, calibration mm. `cervicale`: Cervicale's forward place in the body frame. `perineum`: The perineum's forward place.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanTrunkLaws.of. Also types AutoMovieHumanBodyLaneInterim.pending.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `chest`, `cervicale`, `perineum`, `upper`; callers supply the complete record.
   */
  export interface IPending {
    /** One shared chest/bust-apex height; retained course-placement proxy, calibration mm. */
    chest: number;

    /** Cervicale's forward place in the body frame. */
    cervicale: number;

    /** The perineum's forward place. */
    perineum: number;

    /** The sites above the chest (`AutoMovieHumanTrunkViews.ILaws.upper`). */
    upper: IAutoMovieHumanTrunkViewLaws.ILaws["upper"];
  }
}
