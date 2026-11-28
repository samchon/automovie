import type { IAutoMovieSolidJoin } from "./IAutoMovieSolidJoin";
import type { IAutoMovieSolidSharedCurve } from "./IAutoMovieSolidSharedCurve";

/**
 * A mixed join's record as the kernel's join input: the declared loop of
 * `IAutoMovieConstructionJoin.loop` turned into the shared contact, its width
 * laws and its sides, in millimetres.
 *
 * The loop is read through the port curve's one owner
 * (`AutoMovieEngineConstructionPortCurve.curve`): the ellipse on the host face's
 * chart with its per-column shares joined by the periodic cubic, with two exact
 * clock derivatives. `AutoMovieEngineSolidSharedCurve` maps it through the host and
 * drops its foot on the part; `AutoMovieEngineConstructionWidths` reads each width at
 * the curve's points, the fold's turn among them; the result is what
 * `AutoMovieEngineSolidBody.merge` takes as a join whose curve is supplied, so the
 * rails, the blend, the trims and the faces are the traced join's own.
 */
export namespace IAutoMovieConstructionSharedLoop {
  /**
   * Prepared kernel join and contact generated from one declared host loop. It
   * retains the actual shared curve, side orientation and evaluated width law
   * for subsequent solid realization.
   */
  export interface IPrepared {
    /**
     * Kernel join arguments with actual traced contact and width data. The
     * calling merge supplies host and part geometry.
     */
    join: Omit<IAutoMovieSolidJoin.IInput, "part" | "host">;

    /** Actual shared contact retained for arc, direction and side reads. */
    shared: IAutoMovieSolidSharedCurve.IShared;
  }

  /**
   * Named failure of shared-loop preparation. The diagnostic identifies the
   * relevant loop, contact or width premise with its source detail.
   */
  export interface IRefusal {
    /** Diagnostic category for the loop, contact, kept side or width premise. */
    contract: string;

    /**
     * Original explanation of the refused premise, with relevant source values
     * when present.
     */
    detail: string;
  }
}
