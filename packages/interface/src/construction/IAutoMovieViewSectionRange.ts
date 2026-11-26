import type { IAutoMovieSource } from "./IAutoMovieSource";
import type { IAutoMovieViewSection } from "./IAutoMovieViewSection";

/** Data and callback contracts shared by the ViewSectionRange operations. */
export namespace IAutoMovieViewSectionRange {
  /**
   * One synchronous candidate's unchanged measured source and fault
   * observation.
   */
  export interface ITrial {
    /** Actual native source before unused display observations. */
    source: IAutoMovieSource;

    /** Original candidate fault, or null after the existing admission. */
    fault: string | null;
  }

  /**
   * An accepted candidate or actual local bracket, with call-owned numeric
   * trials for one target solve.
   */
  export interface IFamily {
    /**
     * Actual local target bracket; null also permits a separately accepted
     * original candidate.
     */
    range: IAutoMovieViewSection.IRange | null;

    /**
     * Actual ellipse candidate already within the unchanged native target
     * tolerance, without another probe.
     */
    accepted?: IAutoMovieViewSectionRange.ITrial;

    /**
     * Same-shoulder actual source/admission; original preparation exceptions
     * propagate.
     */
    at(shoulder: number): IAutoMovieViewSectionRange.ITrial;
  }
}
