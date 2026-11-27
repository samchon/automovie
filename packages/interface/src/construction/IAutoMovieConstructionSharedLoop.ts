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
   * The kernel's join input for a declared loop, and the contact it was built
   * from.
   */
  export interface IPrepared {
    /** What `AutoMovieEngineSolidBody.merge` takes as its `join`. */
    join: Omit<IAutoMovieSolidJoin.IInput, "part" | "host">;

    /** The contact, for a reader of its arcs. */
    shared: IAutoMovieSolidSharedCurve.IShared;
  }

  /** A premise the record broke. */
  export interface IRefusal {
    /**
     * `shared loop`, `closed loop`, `enclosed loop`, `one kept side` or
     * `width`.
     */
    contract: string;

    /** The message with its numbers. */
    detail: string;
  }
}
