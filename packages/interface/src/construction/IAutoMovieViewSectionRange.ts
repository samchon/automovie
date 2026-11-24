import type { IAutoMovieSource } from "./IAutoMovieSource";

/** Data and callback contracts shared by the ViewSectionRange operations. */
export namespace IAutoMovieViewSectionRange {
  /**
   * One synchronous candidate's unchanged measured source and fault
   * observation.
   */
  export interface ITrial {
    /** Common normalized shoulder before applying the four departures. */
    shoulder: number;

    /** Actual native source before unused display observations. */
    source: IAutoMovieSource;

    /** Original candidate fault, or null after the existing admission. */
    fault: string | null;
  }

  /** Two actual admissible endpoints of an increasing common-shoulder range. */
  export type IBracket = readonly [ITrial, ITrial];

  /** One target's near candidates and the bounded reader of its fixed box. */
  export interface IFamily {
    /** Actual local target bracket, when admitted by both endpoint readings. */
    bracket: IBracket | null;

    /**
     * Actual ellipse candidate already within the unchanged native target
     * tolerance, without another probe.
     */
    accepted?: IAutoMovieViewSectionRange.ITrial;

    /**
     * Prepare and measure one requested common shoulder. Original exceptions
     * propagate.
     */
    at(shoulder: number): IAutoMovieViewSectionRange.ITrial;

    /**
     * Run the complete reach search from the already observed ellipse, when
     * available.
     */
    reach(): IBracket | null;
  }
}
