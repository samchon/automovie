import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieDrawingDesignIndex } from "./IAutoMovieDrawingDesignIndex";
import type { IAutoMovieDrawingFrame } from "./IAutoMovieDrawingFrame";
import type { IAutoMovieDrawingLine } from "./IAutoMovieDrawingLine";
import type { IAutoMovieDrawingView } from "./IAutoMovieDrawingView";

/**
 * Borrowed drafting inputs and derived linework for an orthographic drawing view.
 *
 * @evidence contracts/development/design.md#principled-representation IProps joins validated world geometry with a page-metre frame; IResult separates canonical strokes from unresolved model counts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface deriveAutoMovieDrawing supplies a shared index/filter and receives linework plus the count needed to report its geometry gap.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contracts preserve missing-geometry information and distinguish depth classification from occlusion without introducing renderer state.
 * @evidence contracts/development/common.md#meaningful-documentation Inputs document callback/validation duties and results document rounding, identity and exact count scope.
 */
export namespace IAutoMovieDraftDrawingLines {
  /**
   * Validated design, resolved view frame and selection predicate used to derive linework.
   * 
   * Drawables are the elements with an environment-owned model and the
   * boundaries that carry a face and are realized by no element, each kept only
   * when `drawn` accepts its kind and space; a boundary is accepted through any
   * space it separates and carries its first space, so a party wall reads the
   * same on both rooms' sheets. An element citing a builder-owned runtime model
   * cannot be drawn and is counted in `unresolvedModels` for the caller's gap.
   * 
   * Each drawable is classified by its nearest and deepest corner: wholly on the
   * viewer's side of a cut it is `overhead` while within `view.overhead` and
   * omitted beyond it; wholly deeper than `view.depth` it is `hidden`; otherwise
   * a cut view drafts its section as `cut` and the silhouette of what stands
   * beyond the plane as `projected`. Silhouettes lying in the cut plane are
   * dropped because the cut already draws them. Points are rounded onto the
   * grid, zero-length strokes are dropped, each stroke runs from its smaller
   * point, identical strokes are merged, and the result is sorted by role order,
   * layer, owner and points.
   *
   * The function reads the design synchronously; its index can populate tessellation caches. Keep the environment, view and indexed geometry stable for the call. deriveAutoMovieDrawing validates the environment and resolves the frame before supplying these inputs; the lower-level drafter does not repeat those checks.
   *
   * @evidence contracts/development/design.md#principled-representation World geometry is projected onto an orthonormal page frame in metres; cut/depth classification uses the view's metre bands. Matching frame, cut flag and design index are caller premises not encoded by this record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface deriveAutoMovieDrawing shares one design index across linework, openings and dimensions; the predicate supplies only kind/space selection without introducing viewer state.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Unresolved external geometry is counted, and depth roles do not claim occlusion. The callback is synchronous selection data rather than a renderer dependency.
   * @evidence contracts/development/common.md#meaningful-documentation States validation ownership, projection units, filtering, cache lifetime and the callback's call/exception behavior.
   */
  export type IProps = {
    /** Environment already accepted by validateBuiltEnvironment, borrowed without editing its authored records. */
    environment: IAutoMovieBuiltEnvironment;

    /** Matching view with metre-valued depth/overhead bands; null depth has no far band, and null overhead omits wholly viewer-side geometry in a cut view. */
    view: IAutoMovieDrawingView;

    /** Resolved unrounded world-to-page frame for this view; page coordinates remain metres before sheet scaling. */
    frame: IAutoMovieDrawingFrame;

    /** Index of this same environment snapshot, including world matrices and mutable per-derivation tessellation caches. */
    design: IAutoMovieDrawingDesignIndex;

    /** Whether the view projection cuts geometry; must agree with the view's projection as resolved by autoMovieDrawingHasCut. */
    cut: boolean;

    /** Synchronous inclusion predicate, called for each element and for boundary spaces until one passes. Null space denotes an unassigned element. Must keep inputs stable; exceptions propagate and the callback is not retained. */
    drawn: (kind: string, space: string | null) => boolean;
  };

  /**
   * Caller-owned drafted strokes and the number of selected elements whose model geometry could not be read from the environment index.
   *
   * Coordinates are page metres rounded to six decimals with negative zero normalized. Zero-length strokes are omitted and endpoints are ordered by x then y. Deduplication uses role, layer, owner and endpoints, so coincident strokes from different owners remain distinct. Depth bands classify strokes without solving occlusion.
   *
   * @evidence contracts/development/design.md#principled-representation Canonical line records preserve owner/role identity and page geometry; the nonnegative integer counter describes omitted model lookups rather than geometric invisibility.
   * @evidence contracts/development/design.md#minimal-and-owned-surface deriveAutoMovieDrawing places lines in the drawing and turns unresolvedModels into the external-model-geometry gap; both fields are produced in the same walk.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing model geometry is exposed explicitly instead of replaced by a box or silently treated as an empty successful drawing.
   * @evidence contracts/development/common.md#meaningful-documentation Gives ordering, grid units, deduplication identity, empty-output meaning and exact unresolved-count scope.
   */
  export type IResult = {
    /** Fresh mutable strokes sorted by cut/projected/overhead/hidden role precedence, layer, owner and endpoints; empty can mean filtering, absent geometry or no surviving strokes. */
    lines: IAutoMovieDrawingLine[];

    /** Selected elements with a non-null model id absent from design.models, counted per element. Null models, empty triangle meshes and filtered elements do not increment it. */
    unresolvedModels: number;
  };
}
