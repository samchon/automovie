import type { IAutoMovieHumanTrunkViewLaws } from "./IAutoMovieHumanTrunkViewLaws";

/**
 * Pending trunk placement quantities and upper-site laws in calibration
 * millimetres.
 *
 * The interface package owns these declarations; AutoMovieHumanTrunkLaws in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanTrunkLaws {
  /** The values still owed by laws, calibration mm. */
  export interface IPending {
    /**
     * One shared chest/bust-apex height; retained course-placement proxy,
     * calibration mm.
     */
    chest: number;

    /** Cervicale's forward place in the body frame. */
    cervicale: number;

    /** The perineum's forward place. */
    perineum: number;

    /** The sites above the chest (`AutoMovieHumanTrunkViews.ILaws.upper`). */
    upper: IAutoMovieHumanTrunkViewLaws.ILaws["upper"];
  }
}
