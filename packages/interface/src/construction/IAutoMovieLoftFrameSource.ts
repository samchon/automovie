import type { IAutoMovieLoftSectionFrame } from "./IAutoMovieLoftSectionFrame";
import type { IAutoMovieViewAxis } from "./IAutoMovieViewAxis";
import type { IAutoMovieViewAxisJet } from "./IAutoMovieViewAxisJet";

/** Data and callback contracts shared by the LoftFrameSource operations. */
export namespace IAutoMovieLoftFrameSource {
  /**
   * The analytic view axis retained for one principal layer and independent
   * numeric copies of its frame and optional station derivatives. Adjacent
   * layers must retain the same axis and match their snapshots for reads to
   * continue using that source.
   */
  export interface ISource {
    /**
     * Original analytic view axis. Retention requires its station derivative
     * callback, which may return null at a particular station.
     */
    axis: IAutoMovieViewAxis.IAxis;

    /** Physical station of the bound layer, in millimetres. */
    station: number;

    /**
     * Independent copy of the axis frame at this layer, with world-millimetre
     * origin and unitless axes. The frame stays available when the axis returns
     * no jet.
     */
    frame: IAutoMovieLoftSectionFrame;

    /**
     * Independent copy of the first and second physical-station frame
     * derivatives and corresponding value, or null when the derivative callback
     * returns null here.
     */
    jet: IAutoMovieViewAxisJet.IJet | null;
  }
}
