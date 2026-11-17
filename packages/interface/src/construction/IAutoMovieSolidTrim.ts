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
     * @evidence contracts/development/implementation.md#principled-implementation Reads the prepared periodic cubic in the surface chart and its analytic first loop-parameter derivative.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure A four-number reading gives both location and tangent to margin consumers.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts This chart evaluation neither projects back to the surface domain nor certifies a regular/simple loop at that parameter.
     * @evidence contracts/development/common.md#meaningful-documentation Gives radian periodic query and the returned chart/derivative order.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The callable type has no body; create installs the constant-support SplineCurve evaluator.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Each reading reuses the same prepared control array; current values are not memoized per query.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The installed callback returns a fresh tuple and retains only its owning trim's controls/count, without a growing query cache.
     */
    at(t: number): [number, number, number, number];

    /**
     * Whether a chart point lies in the opening.
     *
     * @param u First chart parameter.
     * @param v Second chart parameter, on any branch of a periodic phase.
     *
     * @evidence contracts/development/implementation.md#principled-implementation Uses odd/even crossings of the prepared sampled chart polygon after choosing the phase branch nearest its mean.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One boolean reader hides only the polygon representation, not another world-space cut geometry.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Classifies the finite polygon rather than the exact cubic boundary; boundary behavior follows strict crossing comparisons and a one-sheet periodic premise.
     * @evidence contracts/development/common.md#meaningful-documentation States chart input and periodic branch handling; the trim comment names the sampled approximation.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature has no implementation; create's callback performs the O(16M) scan.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work All queries share the polygon/phase mean prepared once by create, provided the loop/surface is not mutated.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returning a boolean retains no query point; the owning trim controls the prepared polygon lifetime.
     */
    inside(u: number, v: number): boolean;

    /**
     * The skin's ribbon across the loop toward the opening, square to the
     * loop in the surface's first fundamental form.
     *
     * @param t Loop parameter.
     * @param a Scale of the cross parameter, world mm per unit.
     *
     * @evidence contracts/development/implementation.md#principled-implementation The installed reader solves the chart metric for an inward unit-world-speed direction and evaluates its scaled surface ribbon at the queried loop point.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure It connects the trim's chart tangent/orientation to the shared SolidRibbon evaluator.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Current sampled admission does not prove a direction at every t; an unsampled square failure is replaced by zero direction, so a returned record is not always a valid transverse boundary jet.
     * @evidence contracts/development/common.md#meaningful-documentation Gives inward direction, metric meaning and mm cross-parameter scale, including the unresolved fallback limitation.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This callable type chooses no solve algorithm; create and SolidRibbon own the actual fixed-size operations.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses prepared loop/orientation but reads the queried surface for direction and again in SolidRibbon; no shared queried jet is passed between them.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The callback retains its trim/surface dependencies and returns one small ribbon; it owns no growing parameter cache or resource handle.
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
