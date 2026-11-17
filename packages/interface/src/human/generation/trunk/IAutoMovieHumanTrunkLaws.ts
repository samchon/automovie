import type { IAutoMovieHumanTrunkViewLaws } from "./IAutoMovieHumanTrunkViewLaws";

/**
 * Pending trunk placement quantities and upper-site laws in calibration millimetres.
 *
 * The interface package owns these declarations; AutoMovieHumanTrunkLaws in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Pending trunk placement quantities and upper-site laws in calibration millimetres. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IPending declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IPending separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanTrunkLaws exchanges the named IPending contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
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
