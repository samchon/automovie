import type { IAutoMovieBlendCrossJet } from "./IAutoMovieBlendCrossJet";
import type { IAutoMovieLoftContract } from "./IAutoMovieLoftContract";

/**
 * Data and callback contracts shared by the SolidTrim operations.
 *
 * @evidence contracts/development/design.md#principled-representation Trim capabilities retain a periodic chart loop, landmark feet, membership and world-mm transverse ribbons; nullable results preserve premise diagnostics.
 * @evidence contracts/development/design.md#minimal-and-owned-surface SolidTrim publishes these prepared readers to solid construction and reuses SolidRibbon and LoftContract result vocabulary.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record does not turn a failed landmark foot or self-crossing loop into a trim; the engine controls admission.
 * @evidence contracts/development/common.md#meaningful-documentation Documents loop layout, radian clock, periodic query branches and failure result.
 */
export namespace IAutoMovieSolidTrim {
  /**
   * A chart trim with its prepared loop, foot metadata, sampled classifier and transverse-ribbon reader.
   *
   * @evidence contracts/development/design.md#principled-representation The periodic control layout and chart evaluator describe the margin, while a sampled polygon supplies the opening classifier and orientation used by ribbons.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One result keeps the loop and the readings used by tessellation/margin consumers together.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The mutable loop is shared by at/ribbon while inside uses a separately prepared polygon; direct mutation can make them disagree, and the type provides no invalidation or continuous regularity certificate.
   * @evidence contracts/development/common.md#meaningful-documentation Names chart layout, feet, periodic query semantics and each reader's purpose without claiming a fully certified simple opening.
   */
  export interface ITrim {
    /** The surface's name. */
    surface: string;

    /** The loop's control points `[u_0 .. u_{M-1}, v_0 .. v_{M-1}]`, the layout of `AutoMovieSplineCurve` and of a root loop. */
    loop: number[];

    /** The landmarks' feet, `[u, v]`, the loop's values at parameters `2 pi m / M`. */
    feet: [number, number][];

    /**
     * The loop at a parameter.
     *
     * @param t Loop parameter, radians, any real value.
     * @returns `[u, v, du/dt, dv/dt]`.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Gives radian periodic query and the returned chart/derivative order.
     */
    at(t: number): [number, number, number, number];

    /**
     * Whether a chart point lies in the opening.
     *
     * @param u First chart parameter.
     * @param v Second chart parameter, on any branch of a periodic phase.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States chart input and periodic branch handling; the trim comment names the sampled approximation.
     */
    inside(u: number, v: number): boolean;

    /**
     * The skin's ribbon across the loop toward the opening, square to the
     * loop in the surface's first fundamental form.
     *
     * @param t Loop parameter.
     * @param a Scale of the cross parameter, world mm per unit.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Gives inward direction, metric meaning and mm cross-parameter scale, including the unresolved fallback limitation.
     */
    ribbon(t: number, a: number): IAutoMovieBlendCrossJet;
  }

  /**
   * An optional prepared trim and the premise failures reported before return.
   *
   * @evidence contracts/development/design.md#principled-representation Null trim distinguishes an encountered admission failure from a prepared opening, with producer/contract/detail diagnostics retained for its caller.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two fields carry the geometry-or-failure result without throwing away diagnostic context.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A nonnull trim is not a proof against unsampled crossings/degeneracy; create currently stops at its first detected failure.
   * @evidence contracts/development/common.md#meaningful-documentation States nullable trim and reported-diagnostic meaning.
   */
  export interface IResult {
    /** The trim, or null when a landmark has no foot or the loop crosses itself. */
    trim: IAutoMovieSolidTrim.ITrim | null;

    /** Every broken premise. */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  }
}
