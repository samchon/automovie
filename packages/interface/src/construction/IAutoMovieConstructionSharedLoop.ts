import type { IAutoMovieSolidJoin } from "./IAutoMovieSolidJoin";
import type { IAutoMovieSolidSharedCurve } from "./IAutoMovieSolidSharedCurve";

/**
 * A mixed join's record as the kernel's join input: the declared loop of `IAutoMovieConstructionJoin.loop` turned into the shared
 * contact, its width laws and its sides, in millimetres.
 *
 * The loop is read through the port curve's one owner (`AutoMovieConstructionPortCurve.curve`): the ellipse on the host face's chart
 * with its per-column shares joined by the periodic cubic, with two exact clock derivatives. `AutoMovieSolidSharedCurve` maps it through
 * the host and drops its foot on the part; `AutoMovieConstructionWidths` reads each width at the curve's points, the fold's turn among
 * them; the result is what `AutoMovieSolidBody.merge` takes as a join whose curve is supplied, so the rails, the blend, the trims and
 * the faces are the traced join's own.
 */
export namespace IAutoMovieConstructionSharedLoop {
  /**
   * A pure declaration selecting an already evaluated chart loop on this invocation's source map.
   */
  export interface IReference {
    /** Select the evaluated source variant of a shared loop. */
    type: "source";

    /** Key of this invocation's boundary record. */
    source: string;
  }

  /**
   * A generated closed boundary, or its first unavailable premise, bound to the two actual source face identities.
   */
  export type ISource = {
    /** Actual host chart face. */
    readonly hostFace: string;

    /** Actual attached chart face. */
    readonly partFace: string;
  } & (
    | {
        /** The generating definition supplies an actual corrected boundary. */
        readonly kind: "ready";

        /** One-turn unwrapped host chart with its actual two clock derivatives, in mm and radians. */
        readonly at: IAutoMovieSolidSharedCurve.Loop;

        /** The same boundary in the part's original chart with its actual two clock derivatives, in mm and radians. */
        readonly partAt: IAutoMovieSolidSharedCurve.Loop;

        /** Sample the two native rails and their blend to this mesh deflection in millimetres. */
        readonly railChord?: number;
      }
    | {
        /** The source could not establish a boundary on the original charts. */
        readonly kind: "refused";

        /** The source producer's unavailable premise. */
        readonly detail: string;
      }
  );

  /**
   * The kernel's join input for a declared loop, and the contact it was built from.
   */
  export interface IPrepared {
    /** What `AutoMovieSolidBody.merge` takes as its `join`. */
    join: Omit<IAutoMovieSolidJoin.IInput, "part" | "host">;

    /** The contact, for a reader of its arcs. */
    shared: IAutoMovieSolidSharedCurve.IShared;
  }

  /**
   * A premise the record broke.
   */
  export interface IRefusal {
    /** `shared loop`, `closed loop`, `enclosed loop`, `one kept side` or `width`. */
    contract: string;

    /** The message with its numbers. */
    detail: string;
  }
}
