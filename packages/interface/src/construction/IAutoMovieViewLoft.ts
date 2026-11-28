import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";
import type { IAutoMovieLoftContract } from "./IAutoMovieLoftContract";
import type { IAutoMovieLoftSectionFrame } from "./IAutoMovieLoftSectionFrame";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";
import type { IAutoMovieViewChain } from "./IAutoMovieViewChain";
import type { IAutoMovieViewSection } from "./IAutoMovieViewSection";

/**
 * Published geometry, admitted station sections and diagnostics from a view
 * loft.
 */
export namespace IAutoMovieViewLoft {
  /**
   * View loft result with final geometry, surviving sections and source
   * diagnostics. Input refusal leaves both geometry fields null. Station
   * refusal can retain sections for inspection. Direct original sources require
   * all prepared stations to survive. Girth can publish from at least two
   * admitted sections. Preserve source data while geometry retains it.
   */
  export interface IResult {
    /**
     * Admitted loft chain with ring phases and declared reliefs, or null on
     * final chain refusal. A returned chain can coexist with diagnostics.
     */
    chain: IAutoMovieLoftChain | null;

    /**
     * Regular solid surface constructed from the chain when physical
     * derivatives and anchor admission permit it, or null.
     */
    surface: IAutoMovieSolidSurface | null;

    /**
     * Admitted four-quarter station records in physical order, including
     * inserted cap rings and excluding collapsed tips.
     */
    sections: IAutoMovieViewLoft.IStation[];

    /**
     * Admitted conic-chain stations in physical order. Touch and split
     * declarations produce these records.
     */
    chains: IAutoMovieViewLoft.IChainStation[];

    /**
     * Numerical source and construction refusals in encounter order. Axis
     * callback exceptions can propagate separately.
     */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];

    /**
     * Declared station and phase continuity of the selected representation.
     * Preserve the shared default record while other results use it.
     */
    continuity: IResultContinuity;
  }

  /**
   * Declared chart continuity. Successful conic-chain results use C1 for
   * station and phase because moving joins can change their second partials.
   * Ordinary sections and early refusals use the shared C2 labels.
   */
  export type IResultContinuity = {
    /**
     * C2 for the ordinary representation. C1 marks a published conic chain
     * whose arc joins can have sided second phase derivatives.
     */
    phase: "C2" | "C1";

    /**
     * C2 for ordinary regular sections. C1 accounts for conic-chain joins that
     * move across physical stations in a published chain.
     */
    station: "C2" | "C1";
  };

  /**
   * Admitted four-quarter section and its actual axis frame at one physical
   * station. Preserve the retained frame during geometry reads.
   */
  export interface IStation {
    /**
     * Physical source station in millimetres. A horizontal height axis uses
     * this as world height.
     */
    station: number;

    /**
     * Actual axis frame at this station, with origin in world millimetres and
     * dimensionless u and v axes.
     */
    frame: IAutoMovieLoftSectionFrame;

    /**
     * Admitted four-quarter source used to fit compatibility coefficients and
     * inspect native guide geometry.
     */
    section: IAutoMovieViewSection.ISection;
  }

  /**
   * Admitted split or touch conic chain and its shared original frame at one
   * physical station. Retain the frame and section data in their published
   * form.
   */
  export interface IChainStation {
    /**
     * Physical station in millimetres shared by the axis and all source
     * outlines.
     */
    station: number;

    /**
     * Actual axis frame at this station, with world-millimetre origin. The
     * result borrows it for publication.
     */
    frame: IAutoMovieLoftSectionFrame;

    /**
     * Prepared local conic chain through the authored contact guides and split
     * controls.
     */
    chain: IAutoMovieViewChain.ISection;
  }
}
