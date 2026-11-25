import type { IAutoMovieLoftSectionJet } from "../../../construction/IAutoMovieLoftSectionJet";
import type { IAutoMovieLoftSectionPhase } from "../../../construction/IAutoMovieLoftSectionPhase";
import type { IAutoMovieLoftViewSource } from "../../../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/**
 * Original native field ownership, bounded regional reads and explicit
 * complete-parent demand. Runtime construction and admission remain with
 * AutoMovieHumanFootSource in Human.
 */
export namespace IAutoMovieHumanFootSource {
  /**
   * Call-owned scalar/fullness preparation; the original axis remains
   * authoritative.
   */
  export interface ISource {
    /**
     * Shared identity/frame metadata; a direct control owner retains no
     * completed parent. Legacy complete adapters may carry the actual whole
     * part.
     */
    part: Pick<IAutoMovieViewPart, "name" | "axis">;

    /**
     * Actual native coefficients when prepared directly; absent for a region
     * whose full parent is unrequested.
     */
    field?: IAutoMovieLoftViewSource.ISource;

    /**
     * Explicitly complete a regional owner's actual original, retaining its
     * real failure; absent on direct controls.
     */
    complete?(): IComplete;

    /**
     * Non-generating name when this owner also has a bounded regional
     * capability.
     */
    name?: string;

    /**
     * Identical axis shared by the retained interval and every full coupled
     * result.
     */
    axis?: IAutoMovieViewPart["axis"];

    /**
     * Explicit retained interval; reading it does not claim full-parent
     * completion.
     */
    region?: IRegion;
  }

  /**
   * Explicit complete-part adapter; direct regional/control consumers use only
   * ISource.
   */
  export interface IComplete extends ISource {
    /**
     * Actual completed original, obtained only by prepare or the explicit full
     * resolver.
     */
    part: IAutoMovieViewPart;

    /**
     * Actual native coefficients of that explicitly requested complete
     * original.
     */
    field: IAutoMovieLoftViewSource.ISource;
  }

  /**
   * The unchanged part of a generating family, without a substitute
   * whole-parent declaration.
   */
  export interface IRegion {
    /** Name of the actual owning production family. */

    name: string;

    /** Same original axis retained by the full family. */

    axis: IAutoMovieViewPart["axis"];

    /** Closed physical station interval, calibration mm. */

    domain: readonly [number, number];

    /** Actual value and separately available physical2 within this interval. */ at(
      station: number,
    ): IStation;
  }

  /**
   * One regular station's value capability and separately qualified physical
   * derivatives.
   */
  export interface IStation {
    /** Original local phase function, in mm and radians. */
    phase: (phi: number) => IAutoMovieLoftSectionPhase;

    /** Original physical-station total2, or explicit absence. */
    jet: ((phi: number) => IAutoMovieLoftSectionJet) | null;

    /** The original reason physical derivatives are unavailable. */
    unavailable: string | null;
  }

  /** Bounded region with a real, explicit full-original completion capability. */
  export interface IRegional extends ISource {
    /**
     * Complete and admit the actual coupled original, preserving its original
     * failure.
     */
    complete(): IComplete;
  }

  /**
   * Explicitly resolve the actual complete coupled parent part for a retained
   * region. Failure propagates; an earlier uncoupled part cannot stand in for
   * the requested parent.
   */
  export type FromRegionResolve = () => IAutoMovieViewPart;
}
