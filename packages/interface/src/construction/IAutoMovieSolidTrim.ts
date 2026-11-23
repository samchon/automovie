import type { IAutoMovieBlendCrossJet } from "./IAutoMovieBlendCrossJet";
import type { IAutoMovieLoftContract } from "./IAutoMovieLoftContract";

/** Data and callback contracts shared by the SolidTrim operations. */
export namespace IAutoMovieSolidTrim {
  /**
   * A chart trim with its prepared loop, foot metadata, sampled classifier and
   * transverse-ribbon reader.
   */
  export interface ITrim {
    /** The surface's name. */
    surface: string;

    /**
     * The loop's control points `[u_0 .. u_{M-1}, v_0 .. v_{M-1}]`, the layout
     * of `AutoMovieSplineCurve` and of a root loop.
     */
    loop: number[];

    /**
     * The landmarks' feet, `[u, v]`, the loop's values at parameters `2 pi m /
     * M`.
     */
    feet: [number, number][];

    /**
     * The loop at a parameter.
     *
     * @param t Loop parameter, radians, any real value.
     * @returns `[u, v, du/dt, dv/dt]`.
     */
    at(t: number): [number, number, number, number];

    /**
     * Whether a chart point lies in the opening.
     *
     * @param u First chart parameter.
     * @param v Second chart parameter, on any branch of a periodic phase.
     */
    inside(u: number, v: number): boolean;

    /**
     * The skin's ribbon across the loop toward the opening, square to the loop
     * in the surface's first fundamental form.
     *
     * @param t Loop parameter.
     * @param a Scale of the cross parameter, world mm per unit.
     */
    ribbon(t: number, a: number): IAutoMovieBlendCrossJet;
  }

  /** An optional prepared trim and the premise failures reported before return. */
  export interface IResult {
    /** The trim, or null when a landmark has no foot or the loop crosses itself. */
    trim: IAutoMovieSolidTrim.ITrim | null;

    /** Every broken premise. */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  }
}
